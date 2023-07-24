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
      parentId,
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

async function fetchrules(req, res) {
  const rules = [];
  try {
    const mainrules = await matchrules.aggregate([{
      $match: {
        parentId: null,
      },
    }]);
    for (let i = 0; i < mainrules.length; i += 1) {
      const element = mainrules[i];
      delete element._id;
      delete element.__v;
      delete element.createdAt;
      delete element.updatedAt;
      const childrules = await matchrules.aggregate([{
        $match: {
          parentId: element.id,
        },
      }]);
      element.children = childrules;
      rules.push(element);
      logger.info(rules);
    }
    res.status(201).json(rules);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  addrules, addsubrules, deleterules, fetchrules,
};
