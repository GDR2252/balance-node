const express = require('express');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
const navigationRouter = require('./routes/navigation');
const fetchNavDataRouter = require('./routes/getnavdata');
const fetchThemesRouter = require('./routes/getthemes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/navigation', navigationRouter);
app.use('/getnavdata', fetchNavDataRouter);
app.use('/getthemes', fetchThemesRouter);

// error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(500);
  logger.log(err);
  res.json('error');
});

module.exports = app;
