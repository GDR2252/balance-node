const User = require("../model/User");

const getProfile = async (req, res) => {
  const profile = await User.findOne({ username: req.user }).exec();
  if (!profile)
    return res.status(401).json({ message: "User id is incorrect." });
  //   delete profile._id;
  delete profile.__v;
  delete profile.password;
  res.json({ profile });
};

module.exports = { getProfile };
