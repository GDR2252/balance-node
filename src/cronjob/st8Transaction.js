const { default: axios } = require("axios");
const { signBody } = require("../controllers/st8Controller");
const cron = require('node-cron');
const St8Transactions = require("../model/St8Transactions");
const St8Games = require("../model/St8Games");
const connectDB = require('../config/dbConn');

const getTransaction = async (req, res) => {
    try {
        connectDB();
        // const { start_time, end_time } = req.query
        const start_time = new Date(Date.now() - 10 * 60 * 1000).toJSON().split(".")[0]; // Set start time 10 minutes ago
        console.log("🚀 ~ file: st8Transaction.js:6 ~ getTransaction ~ start_time:", start_time)
        const end_time = new Date().toJSON().split(".")[0]; // Set end time as current time
        console.log("🚀 ~ file: st8Transaction.js:8 ~ getTransaction ~ end_time:", end_time)
        const params = `start_time=${start_time}&end_time=${end_time}&currency=INR&site=cbtf`

        const { is_valid, sign_b64 } = await signBody(params)
        if (is_valid) {
            let config = {
                method: 'get',
                maxBodyLength: Infinity,
                url: `https://cbt001.o.p8d.xyz/api/operator/v1/transactions?${params}`,
                headers: {
                    'x-st8-sign': sign_b64
                },
            };
            await axios.request(config)
                .then(async (response) => {
                    console.log(response.data.transactions.length);
                    if (response.data.transactions.length) {
                        for (let i = 0; i < response?.data?.transactions.length; i++) {
                            let element = response?.data?.transactions[i];
                            const getGames = await St8Games.findOne()
                            const getRounds = await St8Transactions.findOne({ round: element?.round });

                            const payload = {
                                username: element?.player,
                                amount: element?.amount,
                                developer_code: element?.developer_code,
                                game_code: element?.game_code,
                                round: element?.round,
                                player: element?.provider?.player,
                                bonus: element?.bonus,
                                processed_at: element?.processed_at,
                            }
                            payload["categoryName"] = getGames.games.developers.find((category) => {
                                return element.developer_code ===  category.code
                            }).name;

                            payload["gameName"] = getGames.games.games.find((game) => {
                                return element.game_code ===  game.code
                            }).name;
                            console.log(payload);
                            let list;
                            if (!getRounds && element?.kind === "debit") {
                                list = {
                                    ...payload,
                                    pl: 0,
                                }
                                console.log("list",list);
                                await St8Transactions.create(list);
                            } else {
                                await St8Transactions.findOneAndUpdate({ round: element.round }, { pl: element.amount }, { new: true });
                            }
                        }
                    }
                }).catch((error) => {
                    console.log("-----------", error);
                });
        } else {
            console.log("Something went wrong!");
        }
    } catch (error) {
        return res.send(500)({ error })
    }
}

// Schedule the function to run every minute
cron.schedule('*/10 * * * * *', async () => {
    await getTransaction();
});