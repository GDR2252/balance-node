const axios = require('axios');
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

async function handleFootball(req, res) {
  let respData = [];
  await axios.get('https://www.spreadex.com/sports/model/api/SubscribeModel?modelRef=m1.s.d.match-centre.all:12082649').then(async (response) => {
    if (response?.data?.model) {
      respData = response?.data?.model;
    }
  });
  const firebaseData = {};
  if (respData.eventTypeName === 'Football') {
    firebaseData.leagueSpEventId = respData?.leagueSpEventId.toString();
    firebaseData.timerDetail = {
      minutes: respData?.timerDetail?.minutes,
      seconds: respData?.timerDetail?.seconds,
      hasStarted: respData?.timerDetail?.hasStarted,
      isCountdown: respData?.timerDetail?.isCountdown,
      includeBrackets: respData?.timerDetail?.includeBrackets,
      isHalfTime: respData?.timerDetail?.isHalfTime,
    };
    firebaseData.statusText = respData.statusText;
    firebaseData.eventTypeName = 'Soccer';

    const transformedData = respData?.scoreItems.map((item, index) => {
      const data = {
        name: respData?.teamKit?.[`team${index + 1}Name`],
        icon: respData?.teamKit?.[`team${index + 1}KitFileName`],
        goalInfo: '',
        goal: '',
        htscore: '',
        corner: '',
        yellow_card: '',
        red_card: '',
      };

      item?.scoreData?.forEach((score) => {
        if (score?.iconName === 'goalInfo') {
          data.goalInfo = score?.value;
        } else if (score?.iconName === 'goal') {
          data.goal = score?.value;
        } else if (score?.iconName === 'htscore') {
          data.htscore = score?.value;
        } else if (score?.iconName === 'corner') {
          data.corner = score?.value;
        } else if (score?.iconName === 'yellow-card') {
          data.yellow_card = score?.value;
        } else if (score?.iconName === 'red-card') {
          data.red_card = score?.value;
        }
      });
      return data;
    });

    firebaseData.scoreItems = transformedData;
  }

  if (respData.eventTypeName === 'Tennis') {
    firebaseData.leagueSpEventId = respData?.players[0]?.spEventId.toString();
    firebaseData.statusText = respData.statusText;
    firebaseData.eventTypeName = respData?.eventTypeName;

    const transformedData = respData?.scoreItems.map((item, index) => {
      const data = {
        name: item?.teamName,
        icon: respData?.teamKit?.[`team${index + 1}Flag`],
        sets: '',
        set1: '',
        set2: '',
        set3: '',
        pts: '',
        playerRanking: '',
        rank: '',
        server: '',
      };

      item?.scoreData?.forEach((score) => {
        if (score?.iconName === 'sets') {
          data.sets = score?.value;
        } else if (score?.iconName === 'set1') {
          data.set1 = score?.value;
        } else if (score?.iconName === 'set2') {
          data.set2 = score?.value;
        } else if (score?.iconName === 'set3') {
          data.set3 = score?.value;
        } else if (score?.iconName === 'pts') {
          data.pts = score?.value;
        } else if (score?.iconName === 'server') {
          data.server = score?.value;
        } else if (score?.iconName === 'rank') {
          data.rank = score?.value;
        } else if (score?.iconName === 'playerRanking') {
          data.playerRanking = score?.value;
        }
      });
      return data;
    });

    firebaseData.scoreItems = transformedData;
  }

      if (respData.eventTypeName === 'Cricket') {
    firebaseData.leagueSpEventId = respData?.players[0]?.spEventId.toString();
    firebaseData.statusText = respData.statusText;
    firebaseData.eventTypeName = respData?.eventTypeName;

    const transformedData = respData?.scoreItems.map((item, index) => {
      const data = {
        name: item?.teamName,
        icon: respData?.teamKit?.[`team${index + 1}KitFileName`],
        score: '',
        overs: '',
        runrate: '',
        fours: '',
        sixes: '',
        wides: '',
        bat_ball: '',
        currentBatsman: '',
      };

      item?.scoreData?.forEach((score) => {
        if (score?.iconName === 'score') {
          data.score = score?.value;
        } else if (score?.iconName === 'overs') {
          data.overs = score?.value;
        } else if (score?.iconName === 'runrate') {
          data.runrate = score?.value;
        } else if (score?.iconName === 'fours') {
          data.fours = score?.value;
        } else if (score?.iconName === 'sixes') {
          data.sixes = score?.value;
        } else if (score?.iconName === 'currentBatsman') {
          data.currentBatsman = score?.value;
        } else if (score?.iconName === 'bat-ball') {
          data.bat_ball = score?.value;
        } else if (score?.iconName === 'wides') {
          data.wides = score?.value;
        }
      });
      return data;
    });

    firebaseData.scoreItems = transformedData;
  }

  console.log('firebaseData', firebaseData);
  res.send(firebaseData);
}
module.exports = { handleLogin, handleFootball };
