const pool = require('../config/db.config');

exports.getAllProjects = async (req, res) => {
  try {
    const { userId, role } = req.user;
    let query;
    let params;

    if (role === 'admin') {
      // Admin sees all projects
      query = `
        SELECT p.*, u.email as user_email 
        FROM projects p 
        LEFT JOIN users u ON p.user_id = u.user_id 
        ORDER BY p.start_date DESC`;
      params = [];
    } else {
      // Regular users see only their projects
      query = `
        SELECT p.*, u.email as user_email 
        FROM projects p 
        LEFT JOIN users u ON p.user_id = u.user_id 
        WHERE p.user_id = $1 
        ORDER BY p.start_date DESC`;
      params = [userId];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { projectId } = req.params;
    
    let query;
    let params;

    if (role === 'admin') {
      query = `
        SELECT p.*, u.email as user_email 
        FROM projects p 
        LEFT JOIN users u ON p.user_id = u.user_id 
        WHERE p.project_id = $1`;
      params = [projectId];
    } else {
      query = `
        SELECT p.*, u.email as user_email 
        FROM projects p 
        LEFT JOIN users u ON p.user_id = u.user_id 
        WHERE p.project_id = $1 AND p.user_id = $2`;
      params = [projectId, userId];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { role } = req.user;
    const {
      project_name,
      role_in_project,
      project_manager,
      project_description,
      start_date,
      end_date,
      loading_hours,
      tools_and_tech,
      team_members,
      user_id
    } = req.body;

    // If admin, use provided user_id or fallback to admin's user_id
    // If regular user, always use their own user_id
    const targetUserId = (role === 'admin' && user_id) ? user_id : req.user.userId;

    // Convert arrays to JSON strings for PostgreSQL
    const toolsJson = JSON.stringify(tools_and_tech);
    const teamJson = JSON.stringify(team_members);

    const result = await pool.query(
      `INSERT INTO projects (
        project_name, role_in_project, project_manager, project_description,
        start_date, end_date, loading_hours, tools_and_tech, team_members, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10) RETURNING *`,
      [
        project_name,
        role_in_project,
        project_manager,
        project_description,
        start_date,
        end_date,
        loading_hours,
        toolsJson,
        teamJson,
        targetUserId
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { projectId } = req.params;
    const {
      project_name,
      role_in_project,
      project_manager,
      project_description,
      start_date,
      end_date,
      loading_hours,
      tools_and_tech,
      team_members
    } = req.body;

    // Convert arrays to JSON strings for PostgreSQL
    const toolsJson = JSON.stringify(tools_and_tech);
    const teamJson = JSON.stringify(team_members);

    let query;
    let params;

    if (role === 'admin') {
      query = `
        UPDATE projects 
        SET project_name = $1, role_in_project = $2, project_manager = $3,
            project_description = $4, start_date = $5, end_date = $6,
            loading_hours = $7, tools_and_tech = $8::jsonb, team_members = $9::jsonb
        WHERE project_id = $10
        RETURNING *`;
      params = [
        project_name,
        role_in_project,
        project_manager,
        project_description,
        start_date,
        end_date,
        loading_hours,
        toolsJson,
        teamJson,
        projectId
      ];
    } else {
      query = `
        UPDATE projects 
        SET project_name = $1, role_in_project = $2, project_manager = $3,
            project_description = $4, start_date = $5, end_date = $6,
            loading_hours = $7, tools_and_tech = $8::jsonb, team_members = $9::jsonb
        WHERE project_id = $10 AND user_id = $11
        RETURNING *`;
      params = [
        project_name,
        role_in_project,
        project_manager,
        project_description,
        start_date,
        end_date,
        loading_hours,
        toolsJson,
        teamJson,
        projectId,
        userId
      ];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { projectId } = req.params;

    let query;
    let params;

    if (role === 'admin') {
      query = 'DELETE FROM projects WHERE project_id = $1 RETURNING *';
      params = [projectId];
    } else {
      query = 'DELETE FROM projects WHERE project_id = $1 AND user_id = $2 RETURNING *';
      params = [projectId, userId];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};