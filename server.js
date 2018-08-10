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
  //console.log('inside serialize user here is user: ', user, user.id);
  done(null, user._id);
});

passport.deserializeUser(async function(id, done) {
  //console.log('in deserialize here is id ', id);
  User.findById(id)
    .then(user => {
      if (user) {
        //console.log('User in deserialize ===> ', user);
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

io.on('connect', onConnection);

function onConnection(socket) {
  const rooms = io.sockets.adapter.rooms;
  const colors = ['red', 'lime', 'dodgerblue', 'magenta', 'cyan', 'purple'];
  socket.on('connection', room => {
    socket.join(room);
    if (rooms[room].currentContentState) {
      socket.emit('state update', rooms[room].currentContentState);
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected!');
  });

  socket.on('changeEditorState', data => {
    console.log('socket got change editor state action ! data ==> ', data);
    if (io.sockets.adapter.rooms[data.room]) {
      let socketIdArr = Object.keys(rooms);
      const selectedColor = colors[socketIdArr.indexOf(data.socketId)];
      data.userObj = {};
      if (data.data) {
        data.userObj[data.socketId] = {
          color: selectedColor,
          top: data.data.loc.top,
          left: data.data.loc.left,
          right: data.data.loc.right
        };
      }
      socket.to(data.room).emit('changeEditorState', data);
      rooms[data.room].currentContentState = data.contentState;
    }
  });
}

module.export = server;
