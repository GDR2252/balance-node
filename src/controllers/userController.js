const User = require('../model/User');

const getBalance = async (req, res) => {
  const profile = await User.findOne({ username: req.user }).exec();
  if (!profile) return res.status(401).json({ message: 'User id is incorrect.' });
  const data = {
    balance: profile.balance,
    exposure: profile.exposureLimit,
  };
  res.json({ data });
};

module.exports = { getBalance };
