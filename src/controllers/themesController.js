const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const { uploadImageTos3 } = require('../config/awsUploader');

async function addThemes(req, res) {
  const { files } = req;
  const data = req.body;
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  try {
    const logoUrl = await uploadImageTos3(files.logoUrl);
    logger.info(logoUrl);
    const faviconUrl = await uploadImageTos3(files.faviconUrl);
    logger.info(faviconUrl);
    data.logoUrl = logoUrl.data.Location;
    data.faviconUrl = faviconUrl.data.Location;
    logger.info(data);
    await client.connect();
    const result = await client.db(process.env.EXCH_DB).collection('themes')
      .insertOne(data);
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
  const { files } = req;
  logger.info(files);
  const data = req.body;
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  try {
    if (files.logoUrl) {
      const logoUrl = await uploadImageTos3(files.logoUrl);
      data.logoUrl = logoUrl.data.Location;
    }
    if (files.faviconUrl) {
      const faviconUrl = await uploadImageTos3(files.faviconUrl);
      data.faviconUrl = faviconUrl.data.Location;
    }
    logger.info(data);
    await client.connect();
    const filter = { _id: new ObjectId(data._id) };
    const update = {
      origin: data.origin,
      bottomImageContainerBg: data.bottomImageContainerBg,
      commonActiveColor: data.commonActiveColor,
      commonBgColor: data.commonBgColor,
      commonHeighLightColor: data.commonHeighLightColor,
      commonTextColor: data.commonTextColor,
      loginSignupBg: data.loginSignupBg,
      loginSignupText: data.loginSignupText,
      topHeaderBgColor: data.topHeaderBgColor,
      topHeaderTextColor: data.topHeaderTextColor,
    };
    if (files.logoUrl) {
      update.logoUrl = data.logoUrl;
    }
    if (files.faviconUrl) {
      update.faviconUrl = data.faviconUrl;
    }
    logger.info(filter);
    logger.info(update);
    const result = await client.db(process.env.EXCH_DB).collection('themes').findOneAndUpdate(filter, { $set: update });
    logger.info(result);
    res.status(201).json({ success: 'Theme updated!' });
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
      .deleteOne({ _id: new ObjectId(_id) });
    logger.info(result);
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
