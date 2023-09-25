const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const User = require('../model/User');
const { uuid } = require('uuidv4');
const { MongoClient, ObjectId } = require('mongodb');
// Sign body 
var rs = require('jsrsasign');
var rsu = require('jsrsasign-util');
const { default: axios } = require('axios');
const St8Games = require('../model/St8Games');

var priv_pem = rsu.readFile('./ec.key');
var priv_key = rs.KEYUTIL.getKey(priv_pem);
var pub_pem = rsu.readFile('./ec.pub');
var pub_key = rs.KEYUTIL.getKey(pub_pem);

async function signBody(req) {
    const reqString = JSON.stringify(req, null)
    var sign = new rs.KJUR.crypto.Signature({ alg: 'SHA256withECDSA' });
    sign.init(priv_key);
    var sign_hex = sign.signString(reqString);
    var sign_b64 = rs.hextob64(sign_hex);
    console.log('Signature is:');
    console.log(sign_b64);

    var signature_to_verify = rs.b64nltohex(sign_b64);
    var sign_pub = new rs.KJUR.crypto.Signature({ alg: 'SHA256withECDSA' });
    sign_pub.init(pub_key);
    sign_pub.updateString(reqString);
    var is_valid = sign_pub.verify(signature_to_verify);

    console.log('Signature valid?:');
    console.log(is_valid);

    console.log(req.method);

    if (is_valid) {
        return { is_valid, sign_b64 }
    } else {
        return false
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

const getGames = async (req, res) => {
    const profile = await User.findOne({ username: req.user }).exec();
    if (!profile) return res.status(401).json({ message: 'User id is incorrect.' });
    const response = await St8Games.findOne({})
    return res.send( response )
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
                .then((response) => {
                    console.log(response.data);
                    return res.send({ is_valid, data: response.data })
                })
                .catch((error) => {
                    console.log(error);
                    return res.send({ is_valid, st8Error: error.response })
                });
        } else {
            return res.send({ message: "Something went wrong!" })
        }
    } catch (err) {
        logger.error(err);
        // await session.abortTransaction();
        // logger.error('Transaction rolled back.');
    } finally {
        // if (client) {
        //     await session.endSession();
        //     await client.close();
        // }
    }
}

const withdraw = async (req, res) => {
    const { amount } = req.body

    const profile = await User.findOne({ username: req.user }).exec();
    if (!profile) return res.status(401).json({ message: 'User id is incorrect.' });

    const data = {
        "transaction_id": uuid().toString().replaceAll("-", ""),
        "player": profile.username,
        "amount": amount,
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

        axios.request(config)
            .then((response) => {
                console.log(response.data);
                return res.send({ is_valid, data: response.data })
            })
            .catch((error) => {
                console.log(error);
                return res.send({ is_valid, st8Error: error.response })
            });
    } else {
        return res.send({ message: "Something went wrong!" })
    }
}

const transfer = async (req, res) => {
    const {type} = req?.body
    if(type === "deposit"){
        deposit(req, res)
    }
    if(type === "withdraw"){
        withdraw(req, res)
    }
   
}

module.exports = {
    signBody,
    getGames,
    launchGame,
    getBalance,
    deposit,
    withdraw,
    transfer
};