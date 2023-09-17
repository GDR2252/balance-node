const { default: axios } = require('axios');
const cron = require('node-cron');
const StreamShedule = require('../model/StreamShedule');
const Market = require('../model/Market');
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
    const eventIds = [];
    const bulkOps = [];
    if (respData.length > 0) {
      respData.map((item) => {
        eventIds.push(item.MatchID);
        bulkOps.push({
          updateOne: {
            filter: { MatchID: item.MatchID },
            update: item,
            upsert: true,
          },
        });
      });
      await StreamShedule.bulkWrite(bulkOps);
      await Market.updateMany({ eventId: { $in: eventIds } }, { isStreaming: true });
        
      console.log('Bulk update/creation completed.');
    } else {
      console.log('No match data to update.');
    }
  } catch (error) {
    console.log('error', error);
  }
};

// Schedule the cron job to run every 15 minutes
cron.schedule('*/1 * * * *', task);
