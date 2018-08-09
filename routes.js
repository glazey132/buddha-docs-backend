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
    Document.findById(req.params.docId, function(err, doc) {
      if (err || !doc) {
        console.log('Unable to find document associated with given id');
        res.status(500).json({
          success: false,
          doc: null,
          msg: 'Error locating document with given id'
        });
      } else if (doc.collaborators.indexOf(req.user._id) === -1) {
        res.status(401).json({
          success: false,
          doc: null,
          msg:
            'You do not have access to view this document because you are not on the list of collaborators!'
        });
      } else {
        res
          .status(200)
          .json({ success: true, doc: doc, msg: 'Welcome to the document!' });
      }
    });
  });

  router.post('/saveDoc', (req, res) => {
    console.log('req.body in save doc ', req.body);
    if (!req.body.contents) {
      res
        .status(400)
        .json({ sucess: false, msg: 'no contents provided to save.' });
    }
    Document.findById(req.body.docid)
      .then(doc => {
        (doc.contents = req.body.contents),
          (doc.last_edit = new Date().getTime()),
          (doc.revision_history = [
            ...doc.revision_history,
            { timestamp: doc.last_edit, contents: req.body.contents }
          ]);
        doc
          .save()
          .then(doc => {
            res.status(200).json({ doc });
          })
          .catch(err => {
            res.json({ err });
          });
      })
      .catch(err => {
        res.json({ err });
      });
  });

  router.post('/document/add', (req, res) => {
    Document.findById(req.body.docId, function(err, doc) {
      if (err || !doc) {
        console.log('Unable to find document associated with given id');
        res.status(500).json({
          success: false,
          doc: null,
          msg: 'Error locating document with given id'
        });
      } else if (doc.collaborators.indexOf(req.user._id) === -1) {
        let user = req.user;
        user.docList.push(req.body.docId);
        doc.collaborators.push(user._id);
        Promise.all([
          user.save(),
          doc.save(),
          User.populate(req.user, { path: 'docsList', select: 'ts name' })
        ])
          .then(all => {
            console.log(`Found new doc ${doc.title} for ${req.user.username}`);
            res.status(200).json({
              success: true,
              user: all[2],
              document: all[1],
              message: 'Congrats! You are now a collaborator'
            });
            console.log('Promise.all OBJ *$*$* ===> ', all);
          })
          .catch(err => {
            res.status(400).json({ success: false, error: err });
          });
      } else {
        console.log(
          `${req.user.username} was already a collaborator on doc: ${doc.title}`
        );
        res.json({
          success: true,
          document: doc,
          user: req.user,
          message: 'Adding a doc you already have.'
        });
      }
    });
  });

  router.get('/logout', (req, res) => {
    req.logout();
    res.json({ message: 'Logout successful' });
  });

  return router;
};
