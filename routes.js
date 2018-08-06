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
    console.log('in get all docs req.user ===> ', req.user);
    let privateDocs = [];
    let sharedDocs = [];
    Document.find({ collaborators: req.user._id })
      .sort({ last_edit: -1 })
      .then(docs => {
        res.status(200).json({
          username: req.user.username,
          docs: docs,
          userid: req.user._id
        });
      })
      .catch(err =>
        res.status(404).json({
          username: req.user.username,
          docs: null,
          userid: req.user._id
        })
      );
  });

  router.post('/newDoc', (req, res) => {
    console.log('\n NEW NEW DOC req in new Doc \n ', req.body);
    Document.create({
      title: req.body.title,
      password: req.body.password,
      collaborators: [req.user.id],
      contents: req.body.contents,
      revision_history: [
        { timestamp: new Date().getTime(), contents: req.body.contents }
      ]
    })
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

  router.get('/findDoc/:docId', (req, res) => {
    console.log('in findDoc by id route here is req ---> ', req.user._id);
    Document.findById(req.params.docId, function(err, doc) {
      if (err || !doc) {
        console.log('Unable to find document associated with given id');
        res.status(500).json({
          success: false,
          doc: null,
          msg: 'Error locating document with given id'
        });
      } else if (doc.collaborators.indexOf(req.user._id) === -1) {
        console.log('doc . collabers ', doc);
        res.status(401).json({
          success: false,
          doc: null,
          msg:
            'You do not have access to view this document because you are not on the list of collaborators!'
        });
      } else {
        console.log('doc . collabers ', doc);
        res
          .status(200)
          .json({ success: true, doc: doc, msg: 'Welcome to the document!' });
      }
    });
  });

  router.get('/logout', (req, res) => {
    req.logout();
    res.json({ message: 'Logout successful' });
  });

  return router;
};
