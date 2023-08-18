const { MongoClient } = require('mongodb');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const logger = require('log4js').getLogger(path.parse(__filename).name);
require('dotenv').config();

const serviceAccount = require('../config/test-pro-e8d5a-2ebe09c66097.json');

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

function processcontent(content) {
  const obj = {};
  content.forEach((element) => {
    const docId = element._id;
    delete element._id;
    delete element.__v;
    delete element.isMarketDataDelayed;
    delete element.isMarketDataVirtual;
    obj[docId] = element;
  });
  return obj;
}

async function fetchmarketrates(req, res) {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  let results = [];
  try {
    await client.connect();
    const cursor = await client.db(process.env.EXCH_DB).collection('marketRates')
      .find({});
    results = await cursor.toArray();
  } catch (err) {
    logger.error(err);
  } finally {
    await client.close();
  }
  const processedData = await processcontent(results);
  try {
    Object.entries(processedData).forEach(async ([key, value]) => {
      const result = await db.collection('marketRates').doc(key).set(value);
      logger.info(result);
    });
    res.status(201).json({ message: 'Data migrated successfully' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function syncfirebase(req, res) {
  const data = req.body;
  const { type } = req.query;
  try {
    Object.entries(data).forEach(async ([key, value]) => {
      if (type === 'update') {
        const marketRatesRef = db.collection('marketRates').doc(key);
        const result = await marketRatesRef.update(value);
        logger.info(result);
      }
      if (type === 'insert') {
        const result = await db.collection('marketRates').doc(key).set(value);
        logger.info(result);
      }
      if (type === 'delete') {
        const result = await db.collection('marketRates').doc(key).delete();
        logger.info(result);
      }
    });
    res.status(201).json({ message: 'Data migrated successfully' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: err.message });
  }
}

module.exports = { fetchmarketrates, syncfirebase };
