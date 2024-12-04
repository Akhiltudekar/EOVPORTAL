const passport = require('passport');
const { BearerStrategy, OIDCStrategy } = require('passport-azure-ad');
const pool = require('../config/db.config');
const azureConfig = require('../config/azure.config');

// OIDC Strategy for user login
passport.use(
  'azuread-openidconnect',
  new OIDCStrategy(
    {
      ...azureConfig,
      usePKCE: true,
      passReqToCallback: true, // Allows us to pass the request to the callback
    },
    async (req, iss, sub, profile, accessToken, refreshToken, done) => {
      // try {
      //   console.log('OIDCStrategy: Received profile:', profile); // Log profile data

      //   if (!profile.oid) {
      //     console.error('Error: No OID found in user profile');
      //     return done(new Error('No OID found in user profile'));
      //   }

      //   const email = profile._json.preferred_username || profile._json.email;
      //   console.log('OIDCStrategy: User email:', email); // Log email being processed

      //   // Query to check if the user already exists in the database
      //   const userQuery = 'SELECT * FROM users WHERE email = $1';
      //   const userResult = await pool.query(userQuery, [email]);

      //   if (userResult.rows.length === 0) {
      //     console.log('OIDCStrategy: New user, inserting into DB'); // Log when creating a new user
      //     // If user doesn't exist, insert a new user into the database
      //     const insertQuery =
      //       'INSERT INTO users (email, role, name) VALUES ($1, $2, $3) RETURNING *';
      //     const newUserResult = await pool.query(insertQuery, [
      //       email,
      //       'user', // Default role
      //       profile.displayName || '', // Name from profile
      //     ]);
      //     console.log('OIDCStrategy: New user created:', newUserResult.rows[0]); // Log new user
      //     return done(null, newUserResult.rows[0]);
      //   }

      //   console.log('OIDCStrategy: User found in DB:', userResult.rows[0]); // Log existing user
      //   // If user exists, return the user
      //   return done(null, userResult.rows[0]);
      // } catch (err) {
      //   console.error('Error in OIDC Strategy:', err);
      //   return done(err);
      // }
    return done(null,profile)
    }

  )
);

// Bearer Strategy for API protection
passport.use(
  new BearerStrategy(
    {
      identityMetadata: azureConfig.identityMetadata,
      clientID: azureConfig.clientID,
      validateIssuer: true, // Set to true to validate token issuer
      issuer: azureConfig.issuer, // Add your issuer if needed
      loggingLevel: 'warn',
      passReqToCallback: false,
    },
    async (token, done) => {
      console.log('BearerStrategy: Received token:', token); // Ensure token is received

      if (!token || !token.preferred_username) {
        console.log('BearerStrategy: Missing token or email in token');
        return done(null, false, { message: 'Unauthorized - Missing token or email' });
      }

      // Check if user exists in the database
      const userQuery = 'SELECT * FROM users WHERE email = $1';
      const userResult = await pool.query(userQuery, [token.preferred_username]);

      if (userResult.rows.length === 0) {
        console.log('BearerStrategy: User not registered');
        return done(null, false, { message: 'User not registered' });
      }

      console.log('BearerStrategy: User found in DB:', userResult.rows[0]);
      return done(null, userResult.rows[0], token);
    }
  )
);

// Serialize user (store user ID in session)
passport.serializeUser((user, done) => {
  console.log('serializeUser: User ID:', user.user_id); // Log user ID during serialization
  done(null, user.user_id);
});

// Deserialize user (fetch user details from session using user ID)
passport.deserializeUser(async (id, done) => {
  console.log('deserializeUser: User ID:', id); // Log user ID during deserialization

  try {
    const query = 'SELECT * FROM users WHERE user_id = $1';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      console.error('deserializeUser: User not found');
      return done(new Error('User not found'));
    }

    console.log('deserializeUser: User found:', result.rows[0]); // Log user data
    done(null, result.rows[0]);
  } catch (err) {
    console.error('Error during deserialization:', err);
    done(err);
  }
});

module.exports = passport;
