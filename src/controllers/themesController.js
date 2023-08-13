const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const { formidable } = require('formidable');

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
  const form = formidable({});
  const [fields, files] = await form.parse(req);
  console.log(fields);
  console.log(files);
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const filter = { _id: fields._id[0] };
    const update = {
      origin: fields.origin[0],
      bottomImageContainerBg: fields.bottomImageContainerBg[0],
      commonActiveColor: fields.commonActiveColor[0],
      commonBgColor: fields.commonBgColor[0],
      commonHeighLightColor: fields.commonHeighLightColor[0],
      commonTextColor: fields.commonTextColor[0],
      loginSignupBg: fields.loginSignupBg[0],
      loginSignupText: fields.loginSignupText[0],
      topHeaderBgColor: fields.topHeaderBgColor[0],
      topHeaderTextColor: fields.topHeaderTextColor[0],
    };
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
