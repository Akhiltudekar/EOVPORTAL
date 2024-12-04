const express = require('express');
const router = express.Router();
const passport = require('../middleware/passport.middleware');
const jwt = require('jsonwebtoken');
require('dotenv').config();
 
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret'; // Use a strong secret in production
const REACT_APP_URL = 'http://localhost:3000'; // React app URL
const NODE_BACKEND_URL = 'http://localhost:5000'; // Node.js backend URL
 
// Initialize Microsoft login
router.get('/microsoft', (req, res, next) => {
  passport.authenticate('azuread-openidconnect', {
    response: res,
    failureRedirect: `${REACT_APP_URL}/error`,
    failureMessage: true,
    successRedirect: `${REACT_APP_URL}/dashboard`,
    prompt: 'select_account', // Forces user to select an account
  })(req, res, next);
});
 
// Handle Microsoft callback and generate JWT token
router.post(
  '/microsoft/callback',
  passport.authenticate('azuread-openidconnect', {
    failureRedirect: `${REACT_APP_URL}/error`,
    failureMessage: true,
  }),
  (req, res) => {
    try {
      if (!req.user) {
        return res.status(400).json({ error: 'Authentication failed, no user found.' });
      }
 
      // Generate JWT token
      const token = jwt.sign(
        { userId: req.user.user_id, email: req.user.email, role: req.user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
 
      console.log('JWT Token generated:', token);
 
      // Redirect to React frontend with token as query parameter
      res.redirect(`${REACT_APP_URL}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Error during callback processing:', error);
      res.redirect(`${REACT_APP_URL}/error`);
    }
  }
);
 
// Handle logout and clear session
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
 
    // Redirect to React app or Microsoft logout endpoint for full SSO logout
    res.redirect(`${REACT_APP_URL}/`);
  });
});
 
module.exports = router;