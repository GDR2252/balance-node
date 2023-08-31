const path = require('path');
const { default: axios } = require('axios');

const logger = require('log4js').getLogger(path.parse(__filename).name);
const { getFirestore } = require('firebase-admin/firestore');
const ScoreBoard = require('../model/ScoreBoard');

async function addScore(req, res) {
  const { spreadexId, eventId } = req.body;
  const duplicate = await ScoreBoard.findOne({ spreadexId }).exec();
  if (duplicate) return res.status(409).json({ message: 'Cannot add Score. match already present.' });
  try {
    const db = getFirestore();

    const result = await ScoreBoard.create({
      spreadexId,
      eventId,
    });
    let respData = {};
    await axios.get(`https://www.spreadex.com/sports/model/api/SubscribeModel?modelRef=m1.s.d.match-centre.all:${spreadexId}`).then(async (response) => {
      if (response?.data?.model) {
        respData = response?.data?.model;
      }
    });
    const firebaseData = {};
    if (respData.eventTypeName === 'Football') {
      firebaseData.leagueSpEventId = respData?.leagueSpEventId.toString();
      firebaseData.eventStartTimeMs = respData?.eventStartTimeMs;
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
          penalty: '',
          shots: '',
          shots_on: '',
          poss: '',
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
          } else if (score?.iconName === 'penalty') {
            data.penalty = score?.value;
          } else if (score?.iconName === 'shots') {
            data.shots = score?.value;
          } else if (score?.iconName === 'shotsontarget') {
            data.shots_on = score?.value;
          } else if (score?.iconName === 'possession') {
            data.poss = score?.value;
          }
        });

        return data; // Return the transformed object for this item
      });
      firebaseData.scoreItems = transformedData;
    }

    if (respData.eventTypeName === 'Tennis') {
      firebaseData.leagueSpEventId = respData?.players[0]?.spEventId.toString();
      firebaseData.statusText = respData.statusText;
      firebaseData.eventTypeName = respData?.eventTypeName;
      firebaseData.eventStartTimeMs = respData?.eventStartTimeMs;

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
      firebaseData.eventStartTimeMs = respData?.eventStartTimeMs;
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
    if (firebaseData.eventTypeName === '') {
      ScoreBoard.findOneAndUpdate({ spreadexId }, { status: false });
    }
    if (firebaseData.leagueSpEventId && firebaseData.leagueSpEventId.length > 0) {
      //   console.log('firebaseData', firebaseData);
      const results = db.collection('scoreBoard').doc(firebaseData.leagueSpEventId).set(firebaseData);
      logger.info(results);
    }

    logger.debug(result);
    res.status(201).json({ success: `New scoreboard ${spreadexId} created!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function fetchScore(req, res) {
  try {
    const result = await ScoreBoard.find({});
    logger.debug(result);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function deleteScore(req, res) {
  const { spreadexId } = req.query;
  try {
    const data = await ScoreBoard.findOne({ spreadexId }).exec();
    if (!data) return res.status(404).json({ message: 'Cannot delete Score. Score not present.' });
    const db = getFirestore();
    await ScoreBoard.deleteOne({ spreadexId });
    await db.collection('scoreBoard').doc(spreadexId).delete();
    res.status(201).json({ success: `Sport ${spreadexId} deleted!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  addScore, fetchScore, deleteScore,
};
