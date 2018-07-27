const express = require('express');

const { User, Document } = require('./models');

module.exports = passport => {
  const router = express.Router();

  router.get('/test', (req, res) => {
    res.status(200).json({ success: true, msg: 'Test was a success' });
  });

  router.post('/login', passport.authenticate('local'), (req, res) => {
    if (req.user) {
      req.login(req.user, function(err) {
        if (err) {
          res.status(404).json({
            success: false,
            msg: 'Login was unsuccessful',
            error: err
          });
        }
      });
      res.send(req.user);
    }
  });

  router.get('/logout', (req, res) => {
    req.logout();
    res.json({ message: 'Logout successful' });
  });

  router.get('/getDocuments/:userid', (req, res) => {
    Document.find({ collaborators: req.params.userid })
      .then(docs => res.status(200).json({ docs, userid: req.params.userid }))
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
