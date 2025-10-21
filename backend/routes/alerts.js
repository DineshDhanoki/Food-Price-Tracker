const express = require('express');
const Joi = require('joi');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const alertSchema = Joi.object({
  productId: Joi.string().uuid().required(),
  targetPrice: Joi.number().positive().required()
});

// Create price alert
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error, value } = alertSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { productId, targetPrice } = value;
    const userId = req.user.id;

    // Check if product exists
    const productCheck = await pool.query('SELECT id, name FROM products WHERE id = $1', [productId]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if alert already exists
    const existingAlert = await pool.query(
      'SELECT id FROM price_alerts WHERE user_id = $1 AND product_id = $2 AND is_active = true',
      [userId, productId]
    );

    if (existingAlert.rows.length > 0) {
      return res.status(409).json({ error: 'Price alert already exists for this product' });
    }

    // Create alert
    const alertQuery = `
      INSERT INTO price_alerts (user_id, product_id, target_price)
      VALUES ($1, $2, $3)
      RETURNING id, target_price, created_at
    `;

    const result = await pool.query(alertQuery, [userId, productId, targetPrice]);

    res.status(201).json({
      message: 'Price alert created successfully',
      alert: {
        id: result.rows[0].id,
        productId,
        productName: productCheck.rows[0].name,
        targetPrice: result.rows[0].target_price,
        createdAt: result.rows[0].created_at
      }
    });

  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's price alerts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const alertsQuery = `
      SELECT 
        pa.id,
        pa.target_price,
        pa.created_at,
        pa.triggered_at,
        p.id as product_id,
        p.name as product_name,
        p.brand,
        p.image_url,
        c.name as category_name,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'retailerId', r.id,
              'retailerName', r.name,
              'price', pp.price,
              'inStock', pp.in_stock,
              'lastUpdated', pp.last_updated
            )
            FROM product_prices pp
            JOIN retailers r ON pp.retailer_id = r.id
            WHERE pp.product_id = p.id AND pp.availability = true
            ORDER BY pp.price ASC
          ), '[]'::json
        ) as current_prices
      FROM price_alerts pa
      JOIN products p ON pa.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE pa.user_id = $1
      ORDER BY pa.created_at DESC
    `;

    const result = await pool.query(alertsQuery, [userId]);

    res.json({ alerts: result.rows });

  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update price alert
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const alertId = req.params.id;
    const userId = req.user.id;
    const { targetPrice } = req.body;

    if (!targetPrice || targetPrice <= 0) {
      return res.status(400).json({ error: 'Valid target price is required' });
    }

    const updateQuery = `
      UPDATE price_alerts 
      SET target_price = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND user_id = $3
      RETURNING id, target_price, updated_at
    `;

    const result = await pool.query(updateQuery, [targetPrice, alertId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({
      message: 'Alert updated successfully',
      alert: result.rows[0]
    });

  } catch (error) {
    console.error('Update alert error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete price alert
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const alertId = req.params.id;
    const userId = req.user.id;

    const deleteQuery = 'DELETE FROM price_alerts WHERE id = $1 AND user_id = $2';
    const result = await pool.query(deleteQuery, [alertId, userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ message: 'Alert deleted successfully' });

  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle alert status
router.patch('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const alertId = req.params.id;
    const userId = req.user.id;

    const toggleQuery = `
      UPDATE price_alerts 
      SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING id, is_active, updated_at
    `;

    const result = await pool.query(toggleQuery, [alertId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({
      message: `Alert ${result.rows[0].is_active ? 'activated' : 'deactivated'}`,
      alert: result.rows[0]
    });

  } catch (error) {
    console.error('Toggle alert error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
