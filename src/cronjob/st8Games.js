const cron = require('node-cron');
const { default: axios } = require('axios');
const User = require('../model/User');
const St8Games = require('../model/St8Games');

const getGames = async (req, res) => {
  console.log('Cron job running at:', new Date());
  const config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'https://cbt001.o.p8d.xyz/api/operator/v1/games?site=cbtf',
    headers: {
      'Content-Type': 'application/json',
      'x-st8-sign': process.env.PRV_KEY,
    },
  };

  await axios.request(config)
    .then(async (response) => {
      console.log(JSON.stringify(response.data));
      await St8Games.deleteMany();
      await St8Games.create({
        games: response.data,
      });
      return res.send({ st8Response: response.data });
    })
    .catch((error) =>
    // console.log(error);
      res.send({ st8Error: error }));
};

// Schedule the cron job to run every 6 hours
cron.schedule('0 */6 * * *', getGames);
