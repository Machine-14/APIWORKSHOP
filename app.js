var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
const verifyToken = require('./middleware/token.middleware.js');

require('dotenv').config();
require('./db.js')
process.env.DB_NAME


var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');
var productsRouter = require('./routes/products');
const { verify } = require('crypto');

// var usersRouter = require('./routes/users');
// var ordersRouter = require('./routes/orders');

var app = express();
app.use(cors())


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/v1/', authRouter);
app.use('/api/v1/',verifyToken, productsRouter);

// app.use('/api/v1/', usersRouter);
// app.use('/api/v1/', productsRouter);
// app.use('/api/v1/', ordersRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
