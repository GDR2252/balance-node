const bcrypt = require('bcrypt');
const User = require('../model/User');

async function handleLogin(req, res) {
  const { user, pwd } = req.body;
  if (!user || !pwd) return res.status(400).json({ message: 'Username and password are required.' });

  const foundUser = await User.findOne({ username: user }).exec();
  if (!foundUser) return res.sendStatus(401);
  const match = await bcrypt.compare(pwd, foundUser.password);
  if (match) {
    const result = await foundUser.save();
    res.json(result);
  } else {
    res.sendStatus(401);
  }
}

module.exports = { handleLogin };
