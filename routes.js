const express = require('express');

const { User, Document } = require('./models');

module.exports = passport => {
  const router = express.Router();

  router.get('/test', (req, res) => {
    res.status(200).json({ success: true, msg: 'Test was a success' });
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
          res.redirect('/userid');
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

  router.get('/userid', (req, res) => {
    res.json({
      success: true,
      msg: 'returned from docs route',
      id: req.user._id
    });
  });

  router.get('/getAllDocs/:userid', (req, res) => {
    console.log('req in getAllDocs ', req.params);
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
