const express = require('express');
const pool = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all retailers
router.get('/', optionalAuth, async (req, res) => {
  try {
    const retailersQuery = `
      SELECT id, name, website, logo_url, is_active, created_at
      FROM retailers
      WHERE is_active = true
      ORDER BY name
    `;

    const result = await pool.query(retailersQuery);
    res.json({ retailers: result.rows });

  } catch (error) {
    console.error('Retailers fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get retailer details
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const retailerId = req.params.id;

    const retailerQuery = `
      SELECT r.*, 
             COUNT(DISTINCT pp.product_id) as total_products,
             COUNT(DISTINCT p.id) as unique_products
      FROM retailers r
      LEFT JOIN product_prices pp ON r.id = pp.retailer_id AND pp.availability = true
      LEFT JOIN products p ON pp.product_id = p.id
      WHERE r.id = $1 AND r.is_active = true
      GROUP BY r.id, r.name, r.website, r.logo_url, r.is_active, r.created_at
    `;

    const result = await pool.query(retailerQuery, [retailerId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Retailer not found' });
    }

    res.json({ retailer: result.rows[0] });

  } catch (error) {
    console.error('Retailer details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
