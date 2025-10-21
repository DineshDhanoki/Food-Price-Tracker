const express = require('express');
const Joi = require('joi');
const pool = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const productSearchSchema = Joi.object({
  query: Joi.string().min(1).max(100).required(),
  category: Joi.string().uuid().optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0)
});

// Search products
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { error, value } = productSearchSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { query, category, limit, offset } = value;
    
    let searchQuery = `
      SELECT DISTINCT p.id, p.name, p.brand, p.unit, p.image_url, p.description,
             c.name as category_name,
             COALESCE(
               (SELECT json_agg(
                 json_build_object(
                   'retailerId', r.id,
                   'retailerName', r.name,
                   'price', pp.price,
                   'originalPrice', pp.original_price,
                   'discountPercentage', pp.discount_percentage,
                   'inStock', pp.in_stock,
                   'lastUpdated', pp.last_updated
                 )
                 FROM product_prices pp
                 JOIN retailers r ON pp.retailer_id = r.id
                 WHERE pp.product_id = p.id AND pp.availability = true
                 ORDER BY pp.price ASC
               ), '[]'::json
             ) as prices
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.name ILIKE $1 OR p.brand ILIKE $1
    `;
    
    const params = [`%${query}%`];
    let paramIndex = 2;
    
    if (category) {
      searchQuery += ` AND p.category_id = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    searchQuery += ` ORDER BY p.name LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(searchQuery, params);
    
    res.json({
      products: result.rows,
      pagination: {
        limit,
        offset,
        total: result.rows.length
      }
    });
    
  } catch (error) {
    console.error('Product search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product details
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const productId = req.params.id;
    
    const productQuery = `
      SELECT p.*, c.name as category_name,
             COALESCE(
               (SELECT json_agg(
                 json_build_object(
                   'retailerId', r.id,
                   'retailerName', r.name,
                   'retailerLogo', r.logo_url,
                   'price', pp.price,
                   'originalPrice', pp.original_price,
                   'discountPercentage', pp.discount_percentage,
                   'inStock', pp.in_stock,
                   'lastUpdated', pp.last_updated
                 )
                 FROM product_prices pp
                 JOIN retailers r ON pp.retailer_id = r.id
                 WHERE pp.product_id = p.id AND pp.availability = true
                 ORDER BY pp.price ASC
               ), '[]'::json
             ) as prices,
             COALESCE(
               (SELECT json_agg(
                 json_build_object(
                   'date', ph.recorded_at,
                   'price', ph.price,
                   'retailerName', r.name
                 )
                 FROM price_history ph
                 JOIN retailers r ON ph.retailer_id = r.id
                 WHERE ph.product_id = p.id
                 ORDER BY ph.recorded_at DESC
                 LIMIT 30
               ), '[]'::json
             ) as priceHistory
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `;
    
    const result = await pool.query(productQuery, [productId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ product: result.rows[0] });
    
  } catch (error) {
    console.error('Product details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get categories
router.get('/categories/list', async (req, res) => {
  try {
    const categoriesQuery = `
      SELECT id, name, description, parent_id
      FROM categories
      ORDER BY name
    `;
    
    const result = await pool.query(categoriesQuery);
    res.json({ categories: result.rows });
    
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add product to favorites (authenticated users only)
router.post('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user.id;
    
    // Check if product exists
    const productCheck = await pool.query('SELECT id FROM products WHERE id = $1', [productId]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Add to favorites (ignore if already exists)
    const favoriteQuery = `
      INSERT INTO user_favorites (user_id, product_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, product_id) DO NOTHING
      RETURNING id
    `;
    
    const result = await pool.query(favoriteQuery, [userId, productId]);
    
    if (result.rows.length > 0) {
      res.json({ message: 'Product added to favorites' });
    } else {
      res.json({ message: 'Product already in favorites' });
    }
    
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove product from favorites
router.delete('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user.id;
    
    const deleteQuery = 'DELETE FROM user_favorites WHERE user_id = $1 AND product_id = $2';
    const result = await pool.query(deleteQuery, [userId, productId]);
    
    if (result.rowCount > 0) {
      res.json({ message: 'Product removed from favorites' });
    } else {
      res.json({ message: 'Product was not in favorites' });
    }
    
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's favorite products
router.get('/favorites/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const favoritesQuery = `
      SELECT p.id, p.name, p.brand, p.unit, p.image_url,
             c.name as category_name,
             COALESCE(
               (SELECT json_agg(
                 json_build_object(
                   'retailerId', r.id,
                   'retailerName', r.name,
                   'price', pp.price,
                   'originalPrice', pp.original_price,
                   'discountPercentage', pp.discount_percentage,
                   'inStock', pp.in_stock,
                   'lastUpdated', pp.last_updated
                 )
                 FROM product_prices pp
                 JOIN retailers r ON pp.retailer_id = r.id
                 WHERE pp.product_id = p.id AND pp.availability = true
                 ORDER BY pp.price ASC
               ), '[]'::json
             ) as prices
      FROM user_favorites uf
      JOIN products p ON uf.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE uf.user_id = $1
      ORDER BY uf.created_at DESC
    `;
    
    const result = await pool.query(favoritesQuery, [userId]);
    res.json({ favorites: result.rows });
    
  } catch (error) {
    console.error('Favorites fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
