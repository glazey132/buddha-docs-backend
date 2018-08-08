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
 ** Express server
 */
const app = express();

/*
** Middleware:body parser, express session
*/
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
  })
);

// Passport.js initialize
app.use(passport.initialize());
app.use(passport.session());

/*
** CORS settings
*/
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, X-AUTHENTICATION, X-IP, Content-Type, Accept'
  );
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Passport.js localstrategy and serializeUser / deserializeUser
passport.use(
  new LocalStrategy(function(username, password, done) {
    User.findOne({ username: username })
      .populate('privateDocs', 'sharedDocs')
      .exec((err, user) => {
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false, {
            message: `${username} does not exist in our database.`
          });
        }
        if (user.password !== password) {
          return done(null, false, { message: 'Incorrect password' });
        }
        return done(null, user);
      });
  })
);

passport.serializeUser(function(user, done) {
  console.log('inside serialize user here is user: ', user, user.id);
  done(null, user._id);
});

passport.deserializeUser(async function(id, done) {
  console.log('in deserialize here is id ', id);
  User.findById(id)
    .then(user => {
      if (user) {
        console.log('User in deserialize ===> ', user);
        return done(null, user);
      }
    })
    .catch(err => {
      console.error(err);
      return done(err);
    });
});

//apply passport to all routes
app.use(routes(passport));

const server = app.listen(process.env.PORT || 3000, function() {
  console.log('\n Backend server for Buddha docs running on port 3000! \n');
});

const io = require('socket.io').listen(server);

io.on('connection', function(socket) {
  console.log('connection to socket made');

  socket.on('documentJoin', data => {
    socket.join(data.docId);
  });

  socket.on('documentLeave', data => {
    console.log('socket received a document leave ', data);
    socket.broadcast.to(data.docId).emit('userLeave', {
      color: data.color
    });
    socket.leave(data.docId);
  });

  socket.on('changeEditorState', data => {
    socket.broadcast.to(data.docId).emit('updateEditorState', {
      contentState: data.contentState,
      selectionState: data.selectionState,
      color: data.color,
      username: data.username
    });
  });

  socket.on('changeName', data => {
    socket.broadcast.to(data.docId).emit('updateName', {
      name: data.name
    });
  });

  socket.on('cursor', data => {
    console.log('cursor update ', data);
    socket.broadcast.to(data.docId).emit('updateCursor', {
      loc: data.loc
    });
  });
});

module.export = server;
