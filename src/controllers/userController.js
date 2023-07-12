const User = require('../model/User');

const getProfile = async (req, res) => {
  const profile = await User.findOne({ username: req.user }).exec();
  if (!profile) return res.status(401).json({ message: 'User id is incorrect.' });
  //   delete profile._id;

  const data = {
    username: profile.username,
    balance: profile.balance,
    exposure: profile.exposureLimit,
  };
  res.json({ data });
};

module.exports = { getProfile };
