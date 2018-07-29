const express = require('express');

const { User, Document } = require('./models');

module.exports = passport => {
  const router = express.Router();

  router.get('/test', (req, res) => {
    res.status(200).json({ success: true, msg: 'Test was a success' });
  });

  router.get('/register', (req, res) => {
    console.log('get register route');
  });

  router.post('/register', (req, res) => {
    User.create({
      username: req.body.username,
      password: req.body.password
    })
      .then(user => {
        console.log(`User: ${user} created`);
        res
          .status(200)
          .json({ success: true, user: user, msg: `User: ${user} created` });
      })
      .catch(err => {
        console.log(`Caught error: ${err}`);
        res.status(500).json({ success: false, error: err, msg: 'caught err' });
      });
  });

  router.get('/login', (req, res) => {
    console.log('get login route');
  });

  router.post('/login', (req, res, next) => {
    passport.authenticate('local', function(err, user, info) {
      if (err) {
        console.log('inside error');
        return next(err);
      }
      if (!user) {
        console.log('No user');
        res.status(401).send('not user');
      } else {
        req.login(user, function(err) {
          if (err) {
            return res.send(err);
          }
          res.redirect('/docs');
        });
      }
    })(req, res, next);
  });

  router.use(function(req, res, next) {
    if (!req.user) {
      res.json({
        success: false,
        message:
          "Not logged in! Req.user has not been provided and needs to be seen to. Set the with credentials flag of all axios calls to secure routes to true. Do that and you've successfully made it into MORDOR!!!🗻 🕷 🗡 🏔  🏹 💍 👿 🌋 "
      });
    } else {
      console.log(req.user.username, 'has passed the gate, press on!😡 🛡 ⚔️');
      next();
    }
  });

  router.get('/docs', (req, res) => {
    console.log('in docs here is req.user ', req.user);
    console.log('in docs here is req.session ', req.session);
    res.json({ success: true, msg: 'returned from docs route' });
    // Document.find({ collaborators: req.user.id })
    //   .sort({ last_edit: -1 })
    //   .then(docs => {
    //     res.json({ docs, user: req.user });
    //   })
    //   .catch(err => {
    //     res.json({ err });
    //   });
  });

  router.get('/logout', (req, res) => {
    req.logout();
    res.json({ message: 'Logout successful' });
  });

  router.get('/docs', (req, res) => {
    console.log('req user in get documents ', req.user);
    console.log('req.session in docs route ', req.session);
    Document.find({ collaborators: req.params.userid })
      .sort({ last_edit: -1 })
      .then(docs => res.status(200).json({ docs, user: req.user }))
      .catch(err => res.status(401).json({ success: false, user: null }));
  });

  router.post('/newDoc', (req, res) => {
    console.log('\n NEW NEW DOC req in new Doc \n ', req.body);
    Document.create({ title: req.body.title, password: req.body.password })
      .then(doc => {
        res.json({
          document: doc,
          success: true,
          message: 'successful creation of new document'
        });
      })
      .catch(err => {
        res.json({
          error: err,
          message: 'Caught error when trying to create new doc'
        });
      });
  });

  return router;
};
