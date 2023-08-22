const { default: axios } = require('axios');
const cron = require('node-cron');
const StreamShedule = require('../model/StreamShedule');
const connectDB = require('../config/dbConn');

// Define the task you want to run
const task = async () => {
  try {
    console.log('Cron job running at:', new Date());
    connectDB();
    let respData = [];
    await axios.get(process.env.STREAM_SCHEDULE_URL).then(async (response) => {
      if (response.data.data.getMatches.length > 0) {
        respData = response?.data?.data?.getMatches;
      }
    })
      .catch((error) => {
        console.error('Error:', error);
      });
    if (respData.length > 0) {
      const bulkOps = respData.map((item) => ({
        updateOne: {
          filter: { MatchID: item.MatchID },
          update: item,
          upsert: true,
        },
      }));
      await StreamShedule.bulkWrite(bulkOps);
      console.log('Bulk update/creation completed.');
    } else {
      console.log('No match data to update.');
    }
  } catch (error) {
    console.log('error', error);
  }
};

// Schedule the cron job to run every 15 minutes
cron.schedule('*/15 * * * *', task);
