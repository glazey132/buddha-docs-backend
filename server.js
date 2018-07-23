const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const User = require('./models').User;
const routes = require('./routes');

mongoose.Promise = require('bluebird');
mongoose.connect(process.env.MONGODB_URI);

/**
 ** Express server w/ Middleware: cookie parser, body parser, express session
 */
const app = express();
app.use(require('cookie-parser')());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: 'super saiyan',
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    resave: true,
    saveUninitialized: true
  })
);

// Passport.js
app.use(passport.initialize());
app.use(passport.session());

/*
** CORS settings
*/
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", true
  // res.heder("Access-Control-Allow-Origin", )
  res.header("Access-Control-Allow-Methods", "OPTIONS, POST, GET");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-type, Accept");
  next();
});
