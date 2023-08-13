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
    res.status(200).json({ message: 'Theme added successfully.' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function fetchThemes(req, res) {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const result = await client.db(process.env.EXCH_DB).collection('themes').find({}).toArray();
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
    const filter = { _id: body._id };
    const update = {
      origin: body.origin,
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
    logger.error(err);
    res.status(500).json({ message: err.message });
  }
}
async function deleteThemes(req, res) {
  const { _id } = req.query;
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const result = await client.db(process.env.EXCH_DB).collection('themes')
      .deleteOne({ _id });
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
