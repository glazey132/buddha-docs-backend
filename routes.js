const express = require('express');

const { User, Doc } = require('./models');

module.exports = passport => {
  const router = express.Router();

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

  router.get('/logout', (req, res) => {
    req.logout();
    res.json({ message: 'Logout successful' });
  });

  return router;
};
