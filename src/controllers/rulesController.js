const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const matchrules = require('../model/Matchrule');

async function addrules(req, res) {
  const { title } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required.' });
  const duplicate = await matchrules.findOne({ title }).exec();
  if (duplicate) return res.status(409).json({ message: 'Cannot add rule. Rule already present.' });
  try {
    const result = await matchrules.create({
      title,
      id: new Date().getTime(),
    });
    logger.debug(result);
    res.status(201).json({ message: `New rule ${title} created!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function addsubrules(req, res) {
  const { title, parentId } = req.body;
  if (!title || !parentId) return res.status(400).json({ message: 'Title and parent id is required.' });
  const duplicate = await matchrules.aggregate([{
    $match: {
      title,
      parentId,
    },
  }]);
  if (duplicate.length > 0) return res.status(409).json({ message: 'Cannot add sub rule. Sub rule already present.' });
  const parentIdData = await matchrules.aggregate([{
    $match: {
      $expr: {
        $eq: ['$id', parentId],
      },
    },
  }]);
  if (!parentIdData.length > 0) return res.status(400).json({ message: "Cannot add sub rule. Parent doesn't exists." });
  try {
    const result = await matchrules.create({
      title,
      parentId: [...parentIdData[0].parentId, parentId],
      id: new Date().getTime(),
    });
    logger.debug(result);
    res.status(201).json({ message: `New subrule ${title} created!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function deleterules(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ message: 'Id is required.' });
  try {
    const data = await matchrules.findOne({ id }).exec();
    if (!data) return res.status(404).json({ message: "Cannot delete rule as it doesn't exists." });
    const parentid = await matchrules.aggregate([{
      $match: {
        $expr: {
          $eq: ['$parentId', id],
        },
      },
    }]);
    if (parentid.length > 0) return res.status(400).json({ message: 'Cannot delete rule. Child rule exists.' });
    const result = await matchrules.deleteOne({ id });
    logger.debug(result);
    res.status(201).json({ message: `Rule ${id} deleted!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
const createNestedStructure = (data) => {
  const map = {};
  const result = [];
  data.forEach((item) => {
    map[item.id] = { ...item.toJSON(), children: [] };
  });
  data.forEach((item) => {
    item.parentId.forEach((pid) => {
      if (map[pid]) {
        if (map[pid]?.id === item?.parentId?.[item?.parentId?.length - 1]) {
          map[pid].children.push(map[item.id]);
        }
      }
    });
  });
  data.forEach((item) => {
    if (item.parentId.length === 0) {
      result.push(map[item.id]);
    }
  });
  return result;
};

async function fetchrules(req, res) {
  let rules = [];
  try {
    rules = await matchrules.find({});
    const data = createNestedStructure(rules);
    res.status(200).json(data);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function updaterules(req, res) {
  const { id, highlight } = req.body;
  const data = await matchrules.findOne({ id }).exec();
  if (!data) res.status(404).json({ message: 'Cannot update highlight. Rule not present.' });
  try {
    const filter = { id };
    const update = {
      highlight,
    };
    const result = await matchrules.findOneAndUpdate(filter, update);
    logger.info(result);
    res.status(201).json({ success: `Highlight updated for ${id}!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
module.exports = {
  addrules, addsubrules, deleterules, fetchrules, updaterules,
};
