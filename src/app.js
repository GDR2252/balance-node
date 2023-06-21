const express = require('express');
const helmet = require('helmet');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const connectDB = require('./config/dbConn');
const navigationRouter = require('./routes/navigation');
const fetchNavDataRouter = require('./routes/getnavdata');
const fetchThemesRouter = require('./routes/getthemes');
const registerRouter = require('./routes/register');
const authRouter = require('./routes/auth');

const app = express();
connectDB();
app.use(helmet());
app.disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/navigation', navigationRouter);
app.use('/getnavdata', fetchNavDataRouter);
app.use('/getthemes', fetchThemesRouter);
app.use('/register', registerRouter);
app.use('/auth', authRouter);

// custom 404
// eslint-disable-next-line no-unused-vars
app.use((req, res, next) => {
  res.status(404).send("Sorry can't find that!");
});

// custom error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).send('Something broke!');
});

module.exports = app;
