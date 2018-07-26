const express = require('express');

const { User, Document } = require('./models');

module.exports = passport => {
  const router = express.Router();

  router.get('/test', (req, res) => {
    res.status(200).json({ success: true, msg: 'Test was a success' });
  });

  router.post('/login', passport.authenticate('local'), (req, res) => {
    res.redirect('/documents');
  });

  // must be logged in to use the routes below
  router.use((req, res, next) => {
    if (!req.user) {
      res.status(400).json({ message: 'Error. You must login to do that.' });
    }
    next();
  });

  router.get('/documents', (req, res) => {
    Document.find({ collaborators: req.user.id })
      .then(docs => res.status(200).json({ docs, user: req.user }))
      .catch(err => res.status(401).json({ success: false, user: null }));
  });

  router.get('/logout', (req, res) => {
    req.logout();
    res.json({ message: 'Logout successful' });
  });

  return router;
};
