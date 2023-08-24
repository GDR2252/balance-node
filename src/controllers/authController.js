const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Trader = require('../model/Trader');
const User = require('../model/User');
require('dotenv').config();

async function handleLogin(req, res) {
  const { user, pwd } = req.body;
  if (!user || !pwd) return res.status(400).json({ message: 'Username and password are required.' });

  const foundUser = await Trader.findOne({ username: user }).exec();
  if (!foundUser) return res.status(401).json({ message: 'The username or password is incorrect.' });
  const match = await bcrypt.compare(pwd, foundUser.password);
  if (match) {
    const { roles } = foundUser;
    const accessToken = jwt.sign(
      {
        username: foundUser.username,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '1d' },
    );
    const refreshToken = jwt.sign(
      { username: foundUser.username },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '1d' },
    );
    foundUser.refreshToken = refreshToken;
    await foundUser.save();
    res.cookie('jwt', refreshToken, {
      httpOnly: true, secure: true, sameSite: 'None', maxAge: 24 * 60 * 60 * 1000,
    });
    res.json({ roles, accessToken });
  } else {
    res.status(401).json({ message: 'The username or password is incorrect.' });
  }
}

async function aviatorAuth(req, res) {
  const { user_token, currency } = req.body;
  let userdata;
  if (user_token && user_token !== '') {
    jwt.verify(user_token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
    //   console.log(err, decoded);
      userdata = await User.findOne({ username: decoded?.username });
      res.json({
        code: 200,
        message: 'ok',
        data: {
          user_id: userdata?._id,
          username: userdata?.username,
          balance: Number(userdata?.balance) * 1000,
          currency: currency,
        },
      });
    });
  } else {
    return res.status(400).json({ code: 401, message: 'User token is invalid' });
  }
}

async function aviatorProfile(req, res) {
  const { user_id, currency } = req.body;
  if (user_id && user_id !== '') {
    const userdata = await User.findOne({ _id: user_id });
    res.json({
      code: 200,
      message: 'ok',
      data: {
        user_id: userdata?._id,
        username: userdata?.username,
        balance: Number(userdata?.balance) * 1000,
        currency,
      },
    });
  } else {
    return res.status(400).json({ code: 401, message: 'User token is invalid' });
  }
}

module.exports = { handleLogin, aviatorAuth, aviatorProfile };
