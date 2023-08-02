const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const User = require('../model/User');
const ActivityLog = require('../model/ActivityLog');
require('dotenv').config();

const addActivity = async (foundUser, activity, status) => {
  try {
    const activityPayload = {
      username: foundUser.username,
      ip: activity?.query,
      detail: JSON.stringify(activity),
      status,
    };

    const findActivity = await ActivityLog
      .find({ username: foundUser.username }).countDocuments().lean();

    if (findActivity > 25) {
      const firstRecord = await ActivityLog
        .findOne({ username: foundUser.username }, { sort: { createdAt: 1 } });
      await ActivityLog.findByIdAndDelete({ _id: firstRecord._id });
      await ActivityLog.create(activityPayload);
    } else {
      await ActivityLog.create(activityPayload);
    }
  } catch (err) {
    logger.error(err);
    return false;
  }
};

async function handleLogin(req, res) {
  const { user, pwd, ip } = req.body;
  if (!user || !pwd) return res.status(400).json({ message: 'Username and password are required.' });

  const foundUser = await User.findOne({ username: user }).exec();
  if (!foundUser) return res.status(401).json({ message: 'The username or password is incorrect.' });
  const match = await bcrypt.compare(pwd, foundUser.password);
  if (match) {
    const {
      roles, username, mobile, selfReferral,
    } = foundUser;
    const accessToken = jwt.sign(
      {
        username: foundUser.username,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '1d' },
    );
    await addActivity(foundUser, ip, 'success');
    res.json({
      roles, username, mobile, accessToken, referralCode: selfReferral,
    });
  } else {
    await addActivity(foundUser, ip, 'failed');
    res.status(401).json({ message: 'The username or password is incorrect.' });
  }
}

module.exports = { handleLogin };
