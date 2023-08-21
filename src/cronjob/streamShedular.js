const { default: axios } = require('axios');
const cron = require('node-cron');
const StreamShedule = require('../model/StreamShedule');

// Define the task you want to run
const task = async () => {
  console.log('Cron job running at:', new Date());
  // Add your task logic here
  //   console.log('STREAM_SCHEDULE_URL', process.env.STREAM_SCHEDULE_URL);

  await axios.get('https://ss247.life/api/7e0f63439c55a393c8d7eebaafe826093f235f3e/streaminfo.php').then(async (response) => {
    // console.log(response.data); // Data received from the URL

    if (response.data.data.getMatches.length > 0) {
      for (const item of response.data.data.getMatches) {
        const { MatchID } = item;

        // Use updateOne with upsert option
        await StreamShedule.updateOne({ MatchID }, item, { upsert: true });
        // console.log(`Updated or created data for matchid: ${MatchID}`);
      }
    }

    // const bulkOps = [];

    // eslint-disable-next-line no-restricted-syntax
    // for (const item of response.data.data.getMatches) {
    // // Create an update operation with upsert option
    //   const updateOperation = {
    //     updateOne: {
    //       filter: { MatchID: item.MatchID },
    //       update: item,
    //       upsert: true,
    //     },
    //   };

    //   bulkOps.push(updateOperation);
    // }

    // if (bulkOps.length > 0) {
    // // Use bulkWrite to perform batch operations
    //   await StreamShedule.bulkWrite(bulkOps);
    //   console.log('Bulk update/creation completed');
    // }

    // await StreamShedule.insertMany(response.data.data.getMatches);
  })
    .catch((error) => {
      console.error('Error:', error);
    });
};

// Schedule the cron job to run every 15 minutes
cron.schedule('*/15 * * * *', task);
