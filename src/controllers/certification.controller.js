const pool = require('../config/db.config');

exports.getAllCertifications = async (req, res) => {
  try {
    const { userId, role } = req.user;
    let query;
    let params;

    if (role === 'admin') {
      // Admin sees all certifications
      query = `
        SELECT c.*, u.email as user_email 
        FROM certifications c 
        LEFT JOIN users u ON c.user_id = u.user_id 
        ORDER BY c.issue_date DESC`;
      params = [];
    } else {
      // Regular users see only their certifications
      query = `
        SELECT c.*, u.email as user_email 
        FROM certifications c 
        LEFT JOIN users u ON c.user_id = u.user_id 
        WHERE c.user_id = $1 
        ORDER BY c.issue_date DESC`;
      params = [userId];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCertificationById = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { certificationId } = req.params;
    
    let query;
    let params;

    if (role === 'admin') {
      query = `
        SELECT c.*, u.email as user_email 
        FROM certifications c 
        LEFT JOIN users u ON c.user_id = u.user_id 
        WHERE c.certification_id = $1`;
      params = [certificationId];
    } else {
      query = `
        SELECT c.*, u.email as user_email 
        FROM certifications c 
        LEFT JOIN users u ON c.user_id = u.user_id 
        WHERE c.certification_id = $1 AND c.user_id = $2`;
      params = [certificationId, userId];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certification not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createCertification = async (req, res) => {
  try {
    const { role } = req.user;
    const { certification_name, issue_date, expiry_date, targeted_skill, user_id } = req.body;

    // If admin, use provided user_id or fallback to admin's user_id
    // If regular user, always use their own user_id
    const targetUserId = (role === 'admin' && user_id) ? user_id : req.user.userId;

    const result = await pool.query(
      `INSERT INTO certifications (
        certification_name, issue_date, expiry_date, targeted_skill, user_id
      ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [certification_name, issue_date, expiry_date, targeted_skill, targetUserId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCertification = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { certificationId } = req.params;
    const { certification_name, issue_date, expiry_date, targeted_skill } = req.body;

    let query;
    let params;

    if (role === 'admin') {
      query = `
        UPDATE certifications 
        SET certification_name = $1, issue_date = $2, expiry_date = $3, targeted_skill = $4
        WHERE certification_id = $5
        RETURNING *`;
      params = [certification_name, issue_date, expiry_date, targeted_skill, certificationId];
    } else {
      query = `
        UPDATE certifications 
        SET certification_name = $1, issue_date = $2, expiry_date = $3, targeted_skill = $4
        WHERE certification_id = $5 AND user_id = $6
        RETURNING *`;
      params = [certification_name, issue_date, expiry_date, targeted_skill, certificationId, userId];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certification not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCertification = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { certificationId } = req.params;

    let query;
    let params;

    if (role === 'admin') {
      query = 'DELETE FROM certifications WHERE certification_id = $1 RETURNING *';
      params = [certificationId];
    } else {
      query = 'DELETE FROM certifications WHERE certification_id = $1 AND user_id = $2 RETURNING *';
      params = [certificationId, userId];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certification not found' });
    }

    res.json({ message: 'Certification deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};