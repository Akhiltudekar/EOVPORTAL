const pool = require('../config/db.config');

// Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM employees ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const result = await pool.query(
      'SELECT * FROM employees WHERE employee_id = $1',
      [employeeId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get employee profile (for logged-in user)
exports.getEmployeeProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const result = await pool.query(
      `SELECT e.*, 
              array_agg(DISTINCT jsonb_build_object(
                'project_id', p.project_id,
                'project_name', p.project_name,
                'role', p.role_in_project
              )) FILTER (WHERE p.project_id IS NOT NULL) as projects,
              array_agg(DISTINCT jsonb_build_object(
                'certification_id', c.certification_id,
                'name', c.certification_name,
                'issue_date', c.issue_date
              )) FILTER (WHERE c.certification_id IS NOT NULL) as certifications
       FROM employees e
       LEFT JOIN projects p ON e.user_id = p.user_id
       LEFT JOIN certifications c ON e.user_id = c.user_id
       WHERE e.user_id = $1
       GROUP BY e.employee_id`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new employee
exports.createEmployee = async (req, res) => {
  try {
    const { name, job_title, department, employee_code, eov_mentor_name, experience, photo } = req.body;
    const { userId } = req.user;

    const result = await pool.query(
      `INSERT INTO employees (
        name, job_title, department, employee_code, eov_mentor_name, experience, photo, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, job_title, department, employee_code, eov_mentor_name, experience, photo, userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update employee profile
exports.updateEmployeeProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    const { name, job_title, department, eov_mentor_name, experience } = req.body;

    const result = await pool.query(
      `UPDATE employees 
       SET name = $1, job_title = $2, department = $3, eov_mentor_name = $4, experience = $5
       WHERE user_id = $6
       RETURNING *`,
      [name, job_title, department, eov_mentor_name, experience, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update employee by ID (admin only)
exports.updateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { name, job_title, department, employee_code, eov_mentor_name, experience } = req.body;

    const result = await pool.query(
      `UPDATE employees 
       SET name = $1, job_title = $2, department = $3, employee_code = $4, 
           eov_mentor_name = $5, experience = $6
       WHERE employee_id = $7
       RETURNING *`,
      [name, job_title, department, employee_code, eov_mentor_name, experience, employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update employee photo
exports.updateEmployeePhoto = async (req, res) => {
  try {
    const { userId } = req.user;
    const { photo } = req.body;

    const result = await pool.query(
      'UPDATE employees SET photo = $1 WHERE user_id = $2 RETURNING *',
      [photo, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const result = await pool.query(
      'DELETE FROM employees WHERE employee_id = $1 RETURNING *',
      [employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get employee projects
exports.getEmployeeProjects = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const result = await pool.query(
      `SELECT p.* FROM projects p
       INNER JOIN employees e ON e.user_id = p.user_id
       WHERE e.employee_id = $1
       ORDER BY p.start_date DESC`,
      [employeeId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get employee certifications
exports.getEmployeeCertifications = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const result = await pool.query(
      `SELECT c.* FROM certifications c
       INNER JOIN employees e ON e.user_id = c.user_id
       WHERE e.employee_id = $1
       ORDER BY c.issue_date DESC`,
      [employeeId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get employee important links
exports.getEmployeeLinks = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const result = await pool.query(
      `SELECT l.* FROM important_links l
       INNER JOIN employees e ON e.user_id = l.user_id
       WHERE e.employee_id = $1
       ORDER BY l.created_at DESC`,
      [employeeId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};