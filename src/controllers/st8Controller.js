const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const User = require('../model/User');
const { uuid } = require('uuidv4');
const { MongoClient, ObjectId, Transaction } = require('mongodb');
// Sign body 
var rs = require('jsrsasign');
var rsu = require('jsrsasign-util');
const { default: axios } = require('axios');
const St8Games = require('../model/St8Games');
const St8Transactions = require('../model/St8Transactions');

var priv_pem = rsu.readFile('./ec.key');
var priv_key = rs.KEYUTIL.getKey(priv_pem);
var pub_pem = rsu.readFile('./ec.pub');
var pub_key = rs.KEYUTIL.getKey(pub_pem);

async function signBody(req) {
    console.log(typeof req);
    const reqString = (typeof req) === "string" ? req : JSON.stringify(req, null)
    var sign = new rs.KJUR.crypto.Signature({ alg: 'SHA256withECDSA' });
    sign.init(priv_key);
    var sign_hex = sign.signString(reqString);
    var sign_b64 = rs.hextob64(sign_hex);
    console.log('Signature is:', sign_b64);

    var signature_to_verify = rs.b64nltohex(sign_b64);
    var sign_pub = new rs.KJUR.crypto.Signature({ alg: 'SHA256withECDSA' });
    sign_pub.init(pub_key);
    sign_pub.updateString(reqString);
    var is_valid = sign_pub.verify(signature_to_verify);

    console.log('Signature valid?:', is_valid);

    if (is_valid) {
        return { is_valid, sign_b64 }
    } else {
        return false
    }
}


const getTransaction = async (req, res) => {
    try {
        const { start_time, end_time } = req.query

        const profile = await User.findOne({ username: req.user }).exec();
        if (!profile) return res.status(401).json({ message: 'User id is incorrect.' });

        console.log(new Date(start_time));
        console.log(new Date(new Date(end_time).getTime() + 24 * 60 * 60 * 1000));

        let query = start_time !== "" && end_time !== "" ?
            {
                createdAt: {
                    $gte: new Date(start_time),
                    $lte: new Date(new Date(end_time).getTime() + 24 * 60 * 60 * 1000)
                },
                username: profile.username
            } : {};

        const transactions = await St8Transactions.find(query).sort({ updatedAt: -1 });
        res.send({ result: transactions })

    } catch (error) {
        return res.status(500).json(error)
    }
}

const getCategoryTotalPL = async (req, res) => {
    try {
        const profile = await User.findOne({ username: req.user }).exec();
        if (!profile) return res.status(401).json({ message: 'User id is incorrect.' });

        const categories = await St8Transactions.aggregate([
            { $match: { username: profile.username } },
            {
                $group: {
                    _id: '$username',
                    totalPL: {
                        $sum: {
                            $cond: [
                                { $eq: ["$pl", 0] },
                                { $subtract: ["$pl", "$amount"] },
                                "$pl"
                            ]
                        }
                    },
                    data: { $push: '$$ROOT' },
                },
            },
            {
                $project : {
                    _id: 0,
                    username : '$_id',
                    totalPL : '$totalPL',
                    createdAt: {$first : "$data.createdAt"},
                    sportName: "St8", 
                }
            },
            { $sort: { updatedAt: -1 } },
        ])
        res.send({ result: categories[0] })
    } catch (error) {
        return res.status(500).json(error)
    }
}

const getCategoryList = async (req, res) => {
    try {
        const profile = await User.findOne({ username: req.user }).exec();
        if (!profile) return res.status(401).json({ message: 'User id is incorrect.' });

        const categories = await St8Transactions.aggregate([
            {
                $match: {
                    username: profile.username,
                }
            },
            {
                $group: {
                    _id: "$developer_code",
                    totalPL: {
                        $sum: {
                            $cond: {
                                if: { $eq: ["$pl", 0] },
                                then: { $subtract: ["$pl", "$amount"] },
                                else: "$pl"
                            }
                        }
                    },
                    data: { $push: '$$ROOT' },
                }
            },
            {
                $project : {
                    _id: 0,
                    developerCode : '$_id',
                    totalPL : '$totalPL',
                    createdAt: {$first : "$data.createdAt"},
                    categoryName : {$first : "$data.categoryName"},
                    sportName: "St8"
                }
            },
            { $sort: { updatedAt: -1 } }
        ])
       
        res.send({ result: categories })
    } catch (error) {
        return res.status(500).json(error)
    }
}

const getGameList = async (req, res) => {
    try {
        const profile = await User.findOne({ username: req.user }).exec();
        if (!profile) return res.status(401).json({ message: 'User id is incorrect.' });

        const { category } = req.query;

        const categories = await St8Transactions.aggregate([
            {
                $match: {
                    username: profile.username,
                    developer_code: category
                }
            },
            {
                $group: {
                    _id: "$game_code",
                    totalPL: {
                        $sum: {
                            $cond: {
                                if: { $eq: ["$pl", 0] },
                                then: { $subtract: ["$pl", "$amount"] },
                                else: "$pl"
                            }
                        }
                    },
                    data: { $push: '$$ROOT' },
                }
            },
            {
                $project : {
                    _id: 0,
                    game_code : '$_id',
                    totalPL : '$totalPL',
                    createdAt: {$first : "$data.createdAt"},
                    categoryName : {$first : "$data.categoryName"},
                    gameName : {$first : "$data.gameName"},
                    sportName: "St8"
                }
            },
            { $sort: { updatedAt: -1 } },

        ])
        res.send({ result: categories })
    } catch (error) {
        return res.status(500).json(error)
    }
}

const getGames = async (req, res) => {
    const response = await St8Games.findOne({})
    return res.send(response)
}


const launchGame = async (req, res) => {
    const { game_code } = req.body
    const profile = await User.findOne({ username: req.user }).exec();

    if (!profile) return res.status(401).json({ message: 'User id is incorrect.' });
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'not authorized.' });
    const token = authHeader.split(' ')[1];


    const data = {
        "game_code": game_code,
        "currency": "INR",
        "site": {
            "id": "cbtf",
            "lobby": "https://cbt001.o.p8d.xyz/games",
            "deposit": "https://cbt001.o.p8d.xyz/cashier"
        },
        "token": token,
        "player": profile?.username,
        "country": "IN",
        "lang": "eng",
        "device": "DESKTOP",
        "fun_mode": false,
        "player_profile": {
            "id": profile?.username,
            "jurisdiction": "CeG",
            "default_currency": "INR",
            "reg_country": "IN",
            "affiliate": "aff_5678",
            "bet_limits": "low",
            "birth_date": "1999-04-01",
            "reg_date": "2022-04-10",
            "attributes": {
                "labels": [
                    "table game preference",
                    "language English"
                ]
            }
        }
    }
    const { is_valid, sign_b64 } = await signBody(data)
    if (is_valid) {
        let finalData = JSON.stringify(data);
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: "https://cbt001.o.p8d.xyz/api/operator/v1/launch",
            headers: {
                'Content-Type': 'application/json',
                'x-st8-sign': sign_b64
            },
            data: finalData
        };

        axios.request(config)
            .then((response) => {
                console.log(JSON.stringify(response.data));
                return res.send({ is_valid, data: response.data })
            })
            .catch((error) => {
                console.log(error.response);
                return res.send({ is_valid, st8Error: error.response.data })
            });
    } else {
        return res.send({ message: "Something went wrong!" })
    }
}

const getBalance = async (req, res) => {
    try {
        const profile = await User.findOne({ username: req.user }).exec();
        if (!profile) return res.status(401).json({ message: 'User id is incorrect.' });

        const data = {
            "player": profile?.username,
            "currency": "INR",
            "site": "cbtf",
            "developer_code": "btsl"
        }

        const { is_valid, sign_b64 } = await signBody(data)
        if (is_valid) {
            let finalData = JSON.stringify(data);
            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: "https://cbt001.o.p8d.xyz/api/operator/v1/cashier/balance",
                headers: {
                    'Content-Type': 'application/json',
                    'x-st8-sign': sign_b64
                },
                data: finalData
            };

            axios.request(config)
                .then((response) => {
                    console.log(response.data);
                    return res.send({ is_valid, data: response.data })
                })
                .catch((error) => {
                    console.log(error.response);
                    return res.send({ is_valid, st8Error: error.response })
                });
        } else {
            return res.send({ message: "Something went wrong!" })
        }
    } catch (error) {
        return res.send({ error })
    }
}

const deposit = async (req, res) => {
    const { amount } = req.body
    console.log(req.user, amount);
    // const uri = process.env.MONGO_URL;
    // const client = new MongoClient(uri);

    // const transactionOptions = {
    //     readConcern: { level: 'snapshot' },
    //     writeConcern: { w: 'majority' },
    //     readPreference: 'primary',
    // };
    // const session = client.startSession();
    try {
        // session.startTransaction(transactionOptions);
        // await client.connect();
        // await client.db(process.env.EXCH_DB).collection('auracsresults').insertOne(body, { session });

        const profile = await User.findOne({ username: req.user }).exec();
        if (!profile) return res.status(401).json({ message: 'User id is incorrect.' });
        if (profile.balance >= amount) {

            const data = {
                "transaction_id": uuid().toString().replaceAll("-", ""),
                "player": profile.username,
                "amount": amount,
                "currency": "INR",
                "site": "cbtf"
            }

            const { is_valid, sign_b64 } = await signBody(data)
            if (is_valid) {
                let finalData = JSON.stringify(data);
                let config = {
                    method: 'post',
                    maxBodyLength: Infinity,
                    url: "https://cbt001.o.p8d.xyz/api/operator/v1/cashier/deposit",
                    headers: {
                        'Content-Type': 'application/json',
                        'x-st8-sign': sign_b64
                    },
                    data: finalData
                };

                axios.request(config)
                    .then(async (response) => {
                        console.log(response.data);
                        const deposit = (profile.balance - amount).toFixed(2);
                        await User.updateOne({ username: req.user }, { $set: { 'balance': deposit } }).exec();
                        return res.send({ is_valid, data: response.data })
                    })
                    .catch((error) => {
                        return res.send({ is_valid, data: error.response.data })
                    });
            } else {
                return res.send({ message: "Something went wrong!" })
            }
        } else {
            return res.status(500).send({ message: "User having insufficient balance!" })
        }
    } catch (err) {
        logger.error(err);
        return res.send({ message: "Something went wrong!" })
        // await session.abortTransaction();
        // logger.error('Transaction rolled back.');
    } finally {
        // if (client) {
        //     await session.endSession();
        //     await client.close();
        // }
    }
}

const getBalanceUser = async (username) => {
    const profile = await User.findOne({ username: username }).exec();
    if (!profile) return res.status(401).json({ message: 'User id is incorrect.' });

    const data = {
        "player": profile?.username,
        "currency": "INR",
        "site": "cbtf",
        "developer_code": "btsl"
    }

    const { is_valid, sign_b64 } = await signBody(data)
    if (is_valid) {
        let finalData = JSON.stringify(data);
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: "https://cbt001.o.p8d.xyz/api/operator/v1/cashier/balance",
            headers: {
                'Content-Type': 'application/json',
                'x-st8-sign': sign_b64
            },
            data: finalData
        };

        return axios.request(config)
            .then((response) => {
                console.log("res", response.data);
                return (response.data)
            })
            .catch((error) => {
                console.log(error.response);
                return ({ is_valid, st8Error: error.response })
            });
    }
}

const withdraw = async (req, res) => {
    try {
        const casinoBalance = await getBalanceUser(req.user)
        const profile = await User.findOne({ username: req.user }).exec();
        if (!profile) return res.status(401).json({ message: 'User id is incorrect.' });


        const data = {
            "transaction_id": uuid().toString().replaceAll("-", ""),
            "player": profile.username,
            "amount": Number(casinoBalance.balance),
            "currency": "INR",
            "site": "cbtf",
            "developer_code": "btsl"
        }

        const { is_valid, sign_b64 } = await signBody(data)
        if (is_valid) {
            let finalData = JSON.stringify(data);
            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: "https://cbt001.o.p8d.xyz/api/operator/v1/cashier/withdraw",
                headers: {
                    'Content-Type': 'application/json',
                    'x-st8-sign': sign_b64
                },
                data: finalData
            };

            await axios.request(config)
                .then(async (response) => {
                    const withdraw = (profile.balance + Number(casinoBalance.balance)).toFixed(2);
                    await User.updateOne({ username: req.user }, { $set: { 'balance': withdraw } }).exec();
                    return res.send({ is_valid, data: response.data })
                })
                .catch((error) => {
                    return res.status(500).send({ message: error?.response?.data })
                });
        } else {
            return res.send({ message: "Something went wrong!" })
        }
    } catch (error) {
        console.log(error);
        return res.send({ message: "Something went wrong!" })
    }
}

const transfer = async (req, res) => {
    const { type } = req?.body
    if (type === "deposit") {
        deposit(req, res)
    }
    if (type === "withdraw") {
        withdraw(req, res)
    }

}
// const getGames = async (req, res) => {
//   console.log('Cron job running at:', new Date());
//     const profile = await User.findOne({ username: req.user }).exec();
//     if (!profile) return res.status(401).json({ message: 'User id is incorrect.' });
//     let config = {
//         method: 'get',
//         maxBodyLength: Infinity,
//         url: "https://cbt001.o.p8d.xyz/api/operator/v1/games?site=cbtf",
//         headers: {
//             'Content-Type': 'application/json',
//             'x-st8-sign': process.env.PRV_KEY
//         },
//     };

//     axios.request(config)
//         .then(async (response) => {
//             console.log(JSON.stringify(response.data));
//             await St8Games.deleteMany();
//             await St8Games.create({
//               games: response.data
//             })
//             return res.send({ st8Response: response.data })
//         })
//         .catch((error) => {
//             // console.log(error);
//             return res.send({ st8Error: error })
//         });
// }
module.exports = {
    signBody,
    getGames,
    launchGame,
    getBalance,
    deposit,
    withdraw,
    transfer,
    getTransaction,
    getCategoryList,
    getCategoryTotalPL,
    getGameList
};