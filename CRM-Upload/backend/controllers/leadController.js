const db = require('../models/db');
const { validateLead } = require('../utils/validation');

// Create lead
exports.createLead = async (req, res) => {
  const { customer_id, lead_source, status, value, description } = req.body;
  
  // Validate input data
  const validation = validateLead({ customer_id, lead_source, status, value });
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.errors
    });
  }

  try {
    // Check if customer exists
    const customerCheck = await db.query('SELECT id FROM customers WHERE id = $1', [customer_id]);
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const result = await db.query(
      'INSERT INTO leads (customer_id, lead_source, status, value, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [customer_id, lead_source, status, value || 0, description || null]
    );
    
    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: err.message 
    });
  }
};

// Get all leads with customer details
exports.getAllLeads = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT l.*, c.name as customer_name, c.email as customer_email 
      FROM leads l 
      LEFT JOIN customers c ON l.customer_id = c.id 
      ORDER BY l.created_at DESC
    `);
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: err.message 
    });
  }
};

// Get lead by ID
exports.getLeadById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT l.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone 
      FROM leads l 
      LEFT JOIN customers c ON l.customer_id = c.id 
      WHERE l.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: err.message 
    });
  }
};

// Update lead
exports.updateLead = async (req, res) => {
  const { id } = req.params;
  const { customer_id, lead_source, status, value, description } = req.body;
  
  // Validate input data
  const validation = validateLead({ customer_id, lead_source, status, value });
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.errors
    });
  }

  try {
    // Check if lead exists
    const leadCheck = await db.query('SELECT id FROM leads WHERE id = $1', [id]);
    if (leadCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Check if customer exists
    const customerCheck = await db.query('SELECT id FROM customers WHERE id = $1', [customer_id]);
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const result = await db.query(
      'UPDATE leads SET customer_id = $1, lead_source = $2, status = $3, value = $4, description = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [customer_id, lead_source, status, value || 0, description || null, id]
    );
    
    res.status(200).json({
      success: true,
      message: 'Lead updated successfully',
      data: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: err.message 
    });
  }
};

// Delete lead
exports.deleteLead = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM leads WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Lead deleted successfully',
      data: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: err.message 
    });
  }
};