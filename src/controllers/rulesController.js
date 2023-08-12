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
  let rules = [];
  try {
    rules = await matchrules.aggregate([
      { $match: { parentId: null } },
      {
        $graphLookup: {
          from: 'matchrules',
          startWith: '$id',
          connectFromField: 'id',
          connectToField: 'parentId',
          depthField: 'level',
          as: 'children',
        },
      },
      {
        $unwind: {
          path: '$children',
          preserveNullAndEmptyArrays: true,
        },
      },
      { $sort: { 'children.level': -1 } },
      {
        $group: {
          _id: '$_id',
          id: { $first: '$id' },
          title: { $first: '$title' },
          highlight: { $first: '$highlight' },
          children: { $push: '$children' },
        },
      },
      {
        $addFields: {
          children: {
            $reduce: {
              input: '$children',
              initialValue: { level: -1, presentChild: [], prevChild: [] },
              in: {
                $let: {
                  vars: {
                    prev: {
                      $cond: [
                        { $eq: ['$$value.level', '$$this.level'] },
                        '$$value.prevChild',
                        '$$value.presentChild',
                      ],
                    },
                    current: {
                      $cond: [{ $eq: ['$$value.level', '$$this.level'] }, '$$value.presentChild', []],
                    },
                  },
                  in: {
                    level: '$$this.level',
                    prevChild: '$$prev',
                    presentChild: {
                      $concatArrays: [
                        '$$current',
                        [
                          {
                            $mergeObjects: [
                              '$$this',
                              {
                                children: {
                                  $filter: {
                                    input: '$$prev',
                                    as: 'e',
                                    cond: { $eq: ['$$e.parentId', '$$this.id'] },
                                  },
                                },
                              },
                            ],
                          },
                        ],
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          _id: '$_id',
          children: '$children.presentChild',
        },
      },
    ]);
    res.status(200).json(rules);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  addrules, addsubrules, deleterules, fetchrules,
};
