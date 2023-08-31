const { default: axios } = require('axios');
const cron = require('node-cron');

const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const logger = require('log4js').getLogger(path.parse(__filename).name);
require('dotenv').config();
const connectDB = require('../config/dbConn');
const ScoreBoard = require('../model/ScoreBoard');

const serviceAccount = require('../config/test-pro-e8d5a-2ebe09c66097.json');

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const task = async () => {
  try {
    connectDB();
    console.log('Cron job running at:', new Date());
    const result = await ScoreBoard.find({ status: true });
    if (result.length > 0) {
      console.log('if');
      result.map(async (matchs) => {
        let respData = [];
        await axios.get(`https://www.spreadex.com/sports/model/api/SubscribeModel?modelRef=m1.s.d.match-centre.all:${matchs?.spreadexId}`).then(async (response) => {
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

            return data; // Return the transformed object for this item
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
        if (firebaseData.eventTypeName === '') {
          await ScoreBoard.findOneAndUpdate({ spreadexId: matchs?.spreadexId }, { status: false });
        }
        if (firebaseData.eventTypeName !== '') {
        //   console.log('firebaseData', firebaseData);
          const results = await db.collection('scoreBoard').doc(firebaseData.leagueSpEventId).set(firebaseData);
          logger.info(results);
        }
      });
    }
  } catch (error) {
    console.log('error', error);
  }
};

// Schedule the cron job to run every 15 minutes
cron.schedule('*/2 * * * * *', task);
