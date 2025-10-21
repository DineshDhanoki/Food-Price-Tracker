const express = require('express');
const Joi = require('joi');
const pool = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const priceComparisonSchema = Joi.object({
  productId: Joi.string().uuid().required(),
  retailerIds: Joi.array().items(Joi.string().uuid()).optional()
});

const priceHistorySchema = Joi.object({
  productId: Joi.string().uuid().required(),
  retailerId: Joi.string().uuid().optional(),
  days: Joi.number().integer().min(1).max(365).default(30)
});

// Compare prices for a product
router.get('/compare', optionalAuth, async (req, res) => {
  try {
    const { error, value } = priceComparisonSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { productId, retailerIds } = value;
    
    let priceQuery = `
      SELECT pp.id, pp.price, pp.original_price, pp.discount_percentage,
             pp.in_stock, pp.last_updated, pp.scraped_at,
             r.id as retailer_id, r.name as retailer_name, r.logo_url,
             p.name as product_name, p.brand, p.unit
      FROM product_prices pp
      JOIN retailers r ON pp.retailer_id = r.id
      JOIN products p ON pp.product_id = p.id
      WHERE pp.product_id = $1 AND pp.availability = true
    `;
    
    const params = [productId];
    
    if (retailerIds && retailerIds.length > 0) {
      priceQuery += ` AND pp.retailer_id = ANY($2)`;
      params.push(retailerIds);
    }
    
    priceQuery += ` ORDER BY pp.price ASC`;
    
    const result = await pool.query(priceQuery, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No prices found for this product' });
    }
    
    // Calculate price statistics
    const prices = result.rows.map(row => parseFloat(row.price));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    res.json({
      product: {
        id: result.rows[0].product_id,
        name: result.rows[0].product_name,
        brand: result.rows[0].brand,
        unit: result.rows[0].unit
      },
      prices: result.rows,
      statistics: {
        minPrice,
        maxPrice,
        avgPrice: Math.round(avgPrice * 100) / 100,
        priceRange: maxPrice - minPrice,
        totalRetailers: result.rows.length
      }
    });
    
  } catch (error) {
    console.error('Price comparison error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get price history for a product
router.get('/history', optionalAuth, async (req, res) => {
  try {
    const { error, value } = priceHistorySchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { productId, retailerId, days } = value;
    
    let historyQuery = `
      SELECT ph.price, ph.recorded_at, r.name as retailer_name, r.id as retailer_id
      FROM price_history ph
      JOIN retailers r ON ph.retailer_id = r.id
      WHERE ph.product_id = $1 
        AND ph.recorded_at >= NOW() - INTERVAL '${days} days'
    `;
    
    const params = [productId];
    
    if (retailerId) {
      historyQuery += ` AND ph.retailer_id = $2`;
      params.push(retailerId);
    }
    
    historyQuery += ` ORDER BY ph.recorded_at DESC`;
    
    const result = await pool.query(historyQuery, params);
    
    // Group by retailer for easier frontend consumption
    const historyByRetailer = {};
    result.rows.forEach(row => {
      if (!historyByRetailer[row.retailer_id]) {
        historyByRetailer[row.retailer_id] = {
          retailerId: row.retailer_id,
          retailerName: row.retailer_name,
          data: []
        };
      }
      historyByRetailer[row.retailer_id].data.push({
        price: parseFloat(row.price),
        date: row.recorded_at
      });
    });
    
    res.json({
      productId,
      days,
      history: Object.values(historyByRetailer)
    });
    
  } catch (error) {
    console.error('Price history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get trending products (products with significant price changes)
router.get('/trending', optionalAuth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const limit = parseInt(req.query.limit) || 20;
    
    const trendingQuery = `
      WITH price_changes AS (
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.brand,
          p.image_url,
          c.name as category_name,
          r.name as retailer_name,
          pp.price as current_price,
          ph.price as previous_price,
          ((pp.price - ph.price) / ph.price * 100) as price_change_percentage,
          pp.last_updated
        FROM products p
        JOIN product_prices pp ON p.id = pp.product_id
        JOIN retailers r ON pp.retailer_id = r.id
        JOIN categories c ON p.category_id = c.id
        JOIN LATERAL (
          SELECT price
          FROM price_history ph2
          WHERE ph2.product_id = p.id 
            AND ph2.retailer_id = pp.retailer_id
            AND ph2.recorded_at >= NOW() - INTERVAL '${days} days'
          ORDER BY ph2.recorded_at ASC
          LIMIT 1
        ) ph ON true
        WHERE pp.availability = true
          AND ph.price IS NOT NULL
          AND ph.price > 0
      )
      SELECT *
      FROM price_changes
      WHERE ABS(price_change_percentage) >= 5
      ORDER BY ABS(price_change_percentage) DESC
      LIMIT $1
    `;
    
    const result = await pool.query(trendingQuery, [limit]);
    
    res.json({
      trending: result.rows,
      period: `${days} days`
    });
    
  } catch (error) {
    console.error('Trending products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get best deals (products with highest discounts)
router.get('/deals', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const minDiscount = parseInt(req.query.minDiscount) || 10;
    
    const dealsQuery = `
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.brand,
        p.image_url,
        c.name as category_name,
        r.name as retailer_name,
        r.logo_url as retailer_logo,
        pp.price as current_price,
        pp.original_price,
        pp.discount_percentage,
        pp.last_updated
      FROM products p
      JOIN product_prices pp ON p.id = pp.product_id
      JOIN retailers r ON pp.retailer_id = r.id
      JOIN categories c ON p.category_id = c.id
      WHERE pp.availability = true 
        AND pp.in_stock = true
        AND pp.discount_percentage >= $1
        AND pp.original_price > pp.price
      ORDER BY pp.discount_percentage DESC
      LIMIT $2
    `;
    
    const result = await pool.query(dealsQuery, [minDiscount, limit]);
    
    res.json({
      deals: result.rows,
      minDiscount
    });
    
  } catch (error) {
    console.error('Deals fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
