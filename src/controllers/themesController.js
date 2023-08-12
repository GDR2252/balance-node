const { MongoClient } = require('mongodb');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);

async function addThemes(req, res) {
  const { body } = req;
  logger.info(req);
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const result = await client.db(process.env.EXCH_DB).collection('themes')
      .insertOne(body);
    logger.info(`New listing created with the following id: ${result.insertedId}`);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function fetchThemes(req, res) {
  const { origin } = req.body;
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const result = await client.db(process.env.EXCH_DB).collection('themes').find({ origin });
    logger.info(result);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
async function updateThemes(req, res) {
  const { body } = req;
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const filter = { origin: body.origin };
    const update = {
      bottomImageContainerBg: body.bottomImageContainerBg,
      commonActiveColor: body.commonActiveColor,
      commonBgColor: body.commonBgColor,
      commonHeighLightColor: body.commonHeighLightColor,
      commonTextColor: body.commonTextColor,
      loginSignupBg: body.loginSignupBg,
      loginSignupText: body.loginSignupText,
      topHeaderBgColor: body.topHeaderBgColor,
      topHeaderTextColor: body.topHeaderTextColor,
    };
    const result = await client.db(process.env.EXCH_DB).collection('themes').findOneAndUpdate(filter, update);
    logger.info(result);
    res.status(201).json({ success: `Theme for ${body.origin} updated!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
async function deleteThemes(req, res) {
  const { origin } = req.query;
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const result = await client.db(process.env.EXCH_DB).collection('themes')
      .deleteOne({ origin });
    logger.debug(result);
    res.status(201).json({ success: 'Themes deleted!' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: err.message });
  } finally {
    await client.close();
  }
}
module.exports = {
  addThemes, fetchThemes, updateThemes, deleteThemes,
};
