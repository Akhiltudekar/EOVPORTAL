const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db.config');
const { validateUser } = require('../validators/user.validator');

exports.register = async (req, res) => {
  try {
    const { error } = validateUser(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING user_id, email, role',
      [email, hashedPassword, role]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { userId: user.user_id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};