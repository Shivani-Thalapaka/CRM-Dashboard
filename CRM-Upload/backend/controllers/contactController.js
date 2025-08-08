const db = require('../models/db');
const { validateContact } = require('../utils/validation');

// Create contact
exports.createContact = async (req, res) => {
  const { customer_id, contact_type, contact_value, is_primary } = req.body;
  
  // Validate input data
  const validation = validateContact({ customer_id, contact_type, contact_value });
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

    // Check for duplicate contact value for the same customer
    const duplicateCheck = await db.query(
      'SELECT * FROM contacts WHERE customer_id = $1 AND contact_value = $2',
      [customer_id, contact_value]
    );
    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Contact value already exists for this customer'
      });
    }

    // If setting as primary, remove primary flag from other contacts of same type
    if (is_primary) {
      await db.query(
        'UPDATE contacts SET is_primary = false WHERE customer_id = $1 AND contact_type = $2',
        [customer_id, contact_type]
      );
    }

    const result = await db.query(
      'INSERT INTO contacts (customer_id, contact_type, contact_value, is_primary) VALUES ($1, $2, $3, $4) RETURNING *',
      [customer_id, contact_type, contact_value, is_primary || false]
    );
    
    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
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

// Get all contacts with customer details
exports.getAllContacts = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, cu.name as customer_name, cu.email as customer_email 
      FROM contacts c 
      LEFT JOIN customers cu ON c.customer_id = cu.id 
      ORDER BY c.is_primary DESC, c.created_at DESC
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

// Get contact by ID
exports.getContactById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT c.*, cu.name as customer_name, cu.email as customer_email 
      FROM contacts c 
      LEFT JOIN customers cu ON c.customer_id = cu.id 
      WHERE c.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
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

// Get contacts by customer ID
exports.getContactsByCustomer = async (req, res) => {
  const { customer_id } = req.params;
  try {
    const result = await db.query(
      'SELECT * FROM contacts WHERE customer_id = $1 ORDER BY is_primary DESC, contact_type, created_at DESC',
      [customer_id]
    );
    
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

// Get contacts by type (email, phone, etc.)
exports.getContactsByType = async (req, res) => {
  const { type } = req.params;
  try {
    const result = await db.query(`
      SELECT c.*, cu.name as customer_name 
      FROM contacts c 
      LEFT JOIN customers cu ON c.customer_id = cu.id 
      WHERE c.contact_type = $1 
      ORDER BY c.is_primary DESC, c.created_at DESC
    `, [type]);
    
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

// Update contact
exports.updateContact = async (req, res) => {
  const { id } = req.params;
  const { customer_id, contact_type, contact_value, is_primary } = req.body;
  
  // Validate input data
  const validation = validateContact({ customer_id, contact_type, contact_value });
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.errors
    });
  }

  try {
    // Check if contact exists
    const contactCheck = await db.query('SELECT * FROM contacts WHERE id = $1', [id]);
    if (contactCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
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

    // Check for duplicate contact value (excluding current contact)
    const duplicateCheck = await db.query(
      'SELECT * FROM contacts WHERE customer_id = $1 AND contact_value = $2 AND id != $3',
      [customer_id, contact_value, id]
    );
    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Contact value already exists for this customer'
      });
    }

    // If setting as primary, remove primary flag from other contacts of same type
    if (is_primary) {
      await db.query(
        'UPDATE contacts SET is_primary = false WHERE customer_id = $1 AND contact_type = $2 AND id != $3',
        [customer_id, contact_type, id]
      );
    }

    const result = await db.query(
      'UPDATE contacts SET customer_id = $1, contact_type = $2, contact_value = $3, is_primary = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [customer_id, contact_type, contact_value, is_primary || false, id]
    );
    
    res.status(200).json({
      success: true,
      message: 'Contact updated successfully',
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

// Delete contact
exports.deleteContact = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM contacts WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Contact deleted successfully',
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