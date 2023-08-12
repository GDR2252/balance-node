const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const Support = require('../model/Support');

async function addDetail(req, res) {
  const { body } = req;
  try {
    await Support.create({
      origin: body.origin,
      contact: body.contact,
    });
    res.status(200).json({ message: 'Contact added successfully.' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function fetchDetail(req, res) {
  try {
    const result = await Support.find({ }).exec();
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
async function updateDetail(req, res) {
  const { body } = req;
  try {
    const filter = { _id: body._id };
    const update = {
      origin: body.origin,
      contact: body.contact,
    };
    await Support.findOneAndUpdate(filter, update);
    res.status(201).json({ success: `Contact for ${body.origin} updated!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
async function deleteDetail(req, res) {
  const { _id } = req.query;
  try {
    await Support.deleteOne({ _id });
    res.status(201).json({ success: 'Contact deleted!' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: err.message });
  }
}
module.exports = {
  addDetail, updateDetail, fetchDetail, deleteDetail,
};
