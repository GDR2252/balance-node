const { default: axios } = require('axios');
const cron = require('node-cron');
const StreamShedule = require('../model/StreamShedule');

// Define the task you want to run
const task = async () => {
   try {
    console.log('Cron job running at:', new Date());
    let respData = [];
    //   console.log('STREAM_SCHEDULE_URL', process.env.STREAM_SCHEDULE_URL);
    await axios.get('https://ss247.life/api/7e0f63439c55a393c8d7eebaafe826093f235f3e/streaminfo.php').then(async (response) => {
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
    }
  } catch (error) {
    console.log('error', error);
  }
};

// Schedule the cron job to run every 15 minutes
cron.schedule('*/15 * * * *', task);
