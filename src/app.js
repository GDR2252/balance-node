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

const app = express();
connectDB();
app.use(helmet());
app.disable('x-powered-by');
app.use(compression());
app.use(xss());
app.use(actuator());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.use('/scrapdata', require('./routes/scrapdata'));
app.use('/ssotoken', require('./routes/ssotoken'));
app.use('/storenavdata', require('./routes/storenavdata'));

app.use('/register', registerRouter);
app.use('/auth', authRouter);
app.use('/login', loginRouter);
app.use('/refresh', refreshRouter);
app.use('/logout', logoutRouter);
app.use('/navigation', navigationRouter);
app.use('/list', listRouter);
app.use(verifyJWT);
app.use('/getnavdata', fetchNavDataRouter);
app.use('/getthemes', fetchThemesRouter);
app.use('/sports', sportsRouter);
app.use('/tournaments', tournamentsRouter);
app.use('/events', eventsRouter);
app.use('/markets', marketsRouter);
app.use('/betlimits', betlimitRouter);
app.use('/changeauth', changeauthRouter);

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
