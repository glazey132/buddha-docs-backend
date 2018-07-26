const express = require('express');

const { User, Document } = require('./models');

module.exports = passport => {
  const router = express.Router();

  router.get('/test', (req, res) => {
    res.status(200).json({ success: true, msg: 'Test was a success' });
  });

  router.post('/login', passport.authenticate('local'), (req, res) => {
    console.log('in post to login here is req ', req);
    // res.redirect('/documents');
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
