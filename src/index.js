const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('./middleware/passport.middleware');
const flash = require('connect-flash');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const ssoRoutes = require('./routes/sso.routes');
const employeeRoutes = require('./routes/employee.routes');
const projectRoutes = require('./routes/project.routes');
const certificationRoutes = require('./routes/certification.routes');
const linkRoutes = require('./routes/link.routes');
const { authenticateToken } = require('./middleware/auth.middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Session configuration
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sso', ssoRoutes);
app.use('/api/employees', authenticateToken, employeeRoutes);
app.use('/api/projects', authenticateToken, projectRoutes);
app.use('/api/certifications', authenticateToken, certificationRoutes);
app.use('/api/links', authenticateToken, linkRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});