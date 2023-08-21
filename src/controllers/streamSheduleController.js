const { default: axios } = require('axios');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const StreamShedule = require('../model/StreamShedule');
require('dotenv').config();

async function getStream(req, res) {
//   await axios.get('https://ss247.life/api/7e0f63439c55a393c8d7eebaafe826093f235f3e/streaminfo.php').then(async (response) => {
//     console.log(response.data); // Data received from the URL
//     await StreamShedule.insertMany(response.data.data.getMatches);
//   })
//     .catch((error) => {
//       console.error('Error:', error);
//     });

  const { eventId } = req.query;
  const profile = await StreamShedule.findOne({ MatchID: eventId }).select('Channel').exec();
  if (!profile) return res.status(404).json({ message: 'No Event found yet!' });
  try {
    res.status(200).json(profile);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error fetching Events.' });
  }
}

module.exports = { getStream };
