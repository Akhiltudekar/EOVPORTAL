const pool = require('../config/db.config');

exports.getAllLinks = async (req, res) => {
  try {
    const { userId } = req.user;
    const result = await pool.query(
      'SELECT * FROM important_links WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLinkById = async (req, res) => {
  try {
    const { userId } = req.user;
    const { linkId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM important_links WHERE link_id = $1 AND user_id = $2',
      [linkId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createLink = async (req, res) => {
  try {
    const { userId } = req.user;
    const { employee_id, link_name, url, description } = req.body;

    const result = await pool.query(
      `INSERT INTO important_links (
        employee_id, link_name, url, description, created_at, user_id
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5) RETURNING *`,
      [employee_id, link_name, url, description, userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateLink = async (req, res) => {
  try {
    const { userId } = req.user;
    const { linkId } = req.params;
    const { employee_id, link_name, url, description } = req.body;

    const result = await pool.query(
      `UPDATE important_links 
       SET employee_id = $1, link_name = $2, url = $3, description = $4
       WHERE link_id = $5 AND user_id = $6
       RETURNING *`,
      [employee_id, link_name, url, description, linkId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteLink = async (req, res) => {
  try {
    const { userId } = req.user;
    const { linkId } = req.params;

    const result = await pool.query(
      'DELETE FROM important_links WHERE link_id = $1 AND user_id = $2 RETURNING *',
      [linkId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.json({ message: 'Link deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};