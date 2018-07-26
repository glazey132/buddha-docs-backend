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
mongoose.connect(
  process.env.MONGODB_URI,
  { useNewUrlParser: true }
);

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
  res.header('Access-Control-Allow-Credentials', true);
  // res.heder("Access-Control-Allow-Origin", )
  res.header('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-type, Accept'
  );
  next();
});

// passport
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(
  new LocalStrategy(function(username, password, done) {
    User.findOrCreate(username, password, function(err, user) {
      if (err) {
        return done(err, null);
      }
      return done(null, user); // user registered
    });
  })
);

app.get('/', function(req, res) {
  res.send('Hello world');
});

app.use(routes(passport));

const server = app.listen(process.env.PORT || 3000, function() {
  console.log('\n Backend server for Buddha docs running on port 3000! \n');
});

module.export = server;
