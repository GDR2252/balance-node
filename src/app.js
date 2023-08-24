const actuator = require('express-actuator');
const compression = require('compression');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const path = require('path');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const connectDB = require('./config/dbConn');
const verifyJWT = require('./middleware/verifyJWT');
const navigationRouter = require('./routes/navigation');
const fetchNavDataRouter = require('./routes/getnavdata');
const fetchThemesRouter = require('./routes/getthemes');
const registerRouter = require('./routes/register');
const authRouter = require('./routes/auth');
const refreshRouter = require('./routes/refresh');
const logoutRouter = require('./routes/logout');
const sportsRouter = require('./routes/sports');
const tournamentsRouter = require('./routes/tournament');
const eventsRouter = require('./routes/events');
const marketsRouter = require('./routes/markets');
const betlimitRouter = require('./routes/betlimit');
const changeauthRouter = require('./routes/changeauth');
const listRouter = require('./routes/list');
const loginRouter = require('./routes/userlogin');
const balanceRouter = require('./routes/balance');
const finduserRouter = require('./routes/finduser');
const streamRouter = require('./routes/stream');
const userInfoRouter = require('./routes/userInfo');

const app = express();
connectDB();
app.use(helmet());
app.disable('x-powered-by');
app.use(compression());
app.use(xss());
app.use(actuator());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
app.use(cookieParser());
app.use(cors());

app.use('/scrapdata', require('./routes/scrapdata'));
app.use('/ssotoken', require('./routes/ssotoken'));
app.use('/storenavdata', require('./routes/storenavdata'));
app.use('/fetchmarketrate', require('./routes/getmarketrates'));

app.use('/register', registerRouter);
app.use('/auth', authRouter);
app.use('/login', loginRouter);
app.use('/refresh', refreshRouter);
app.use('/logout', logoutRouter);
app.use('/navigation', navigationRouter);
app.use('/list', listRouter);
app.use('/finduser', finduserRouter);
app.use('/getthemes', fetchThemesRouter);
app.use('/rules', require('./routes/rules'));

app.use('/info', userInfoRouter);

app.use(verifyJWT);
app.use('/getnavdata', fetchNavDataRouter);
app.use('/sports', sportsRouter);
app.use('/tournaments', tournamentsRouter);
app.use('/events', eventsRouter);
app.use('/markets', marketsRouter);
app.use('/betlimits', betlimitRouter);
app.use('/changeauth', changeauthRouter);
app.use('/getBalance', balanceRouter);
app.use('/stream', streamRouter);
app.use('/activity', require('./routes/activity'));
app.use('/themes', require('./routes/themes'));
app.use('/placebet', require('./routes/bet'));
app.use('/stakes', require('./routes/stakes'));
app.use('/support', require('./routes/support'));

// custom 404
// eslint-disable-next-line no-unused-vars
app.use((req, res, next) => {
  res.status(404).send("You're Beyond The Borders!");
});

// custom error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).send('Something broke!');
});

module.exports = app;
