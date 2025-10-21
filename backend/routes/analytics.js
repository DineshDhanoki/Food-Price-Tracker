const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user analytics dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's favorite products count
    const favoritesQuery = 'SELECT COUNT(*) as favorites_count FROM user_favorites WHERE user_id = $1';
    const favoritesResult = await pool.query(favoritesQuery, [userId]);

    // Get user's active alerts count
    const alertsQuery = 'SELECT COUNT(*) as alerts_count FROM price_alerts WHERE user_id = $1 AND is_active = true';
    const alertsResult = await pool.query(alertsQuery, [userId]);

    // Get triggered alerts count
    const triggeredAlertsQuery = 'SELECT COUNT(*) as triggered_count FROM price_alerts WHERE user_id = $1 AND triggered_at IS NOT NULL';
    const triggeredResult = await pool.query(triggeredAlertsQuery, [userId]);

    // Get user's most tracked categories
    const categoriesQuery = `
      SELECT c.name as category_name, COUNT(uf.id) as tracking_count
      FROM user_favorites uf
      JOIN products p ON uf.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE uf.user_id = $1
      GROUP BY c.name
      ORDER BY tracking_count DESC
      LIMIT 5
    `;
    const categoriesResult = await pool.query(categoriesQuery, [userId]);

    // Get recent price changes for user's favorites
    const recentChangesQuery = `
      SELECT 
        p.name as product_name,
        p.brand,
        r.name as retailer_name,
        pp.price as current_price,
        ph.price as previous_price,
        ((pp.price - ph.price) / ph.price * 100) as change_percentage,
        pp.last_updated
      FROM user_favorites uf
      JOIN products p ON uf.product_id = p.id
      JOIN product_prices pp ON p.id = pp.product_id
      JOIN retailers r ON pp.retailer_id = r.id
      JOIN LATERAL (
        SELECT price
        FROM price_history ph2
        WHERE ph2.product_id = p.id 
          AND ph2.retailer_id = pp.retailer_id
          AND ph2.recorded_at >= NOW() - INTERVAL '7 days'
        ORDER BY ph2.recorded_at ASC
        LIMIT 1
      ) ph ON true
      WHERE uf.user_id = $1
        AND pp.availability = true
        AND ph.price IS NOT NULL
        AND ph.price > 0
        AND ABS(((pp.price - ph.price) / ph.price * 100)) >= 5
      ORDER BY ABS(((pp.price - ph.price) / ph.price * 100)) DESC
      LIMIT 10
    `;
    const recentChangesResult = await pool.query(recentChangesQuery, [userId]);

    res.json({
      summary: {
        favoritesCount: parseInt(favoritesResult.rows[0].favorites_count),
        activeAlertsCount: parseInt(alertsResult.rows[0].alerts_count),
        triggeredAlertsCount: parseInt(triggeredResult.rows[0].triggered_count)
      },
      topCategories: categoriesResult.rows,
      recentPriceChanges: recentChangesResult.rows
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get price trends for a specific product
router.get('/trends/:productId', authenticateToken, async (req, res) => {
  try {
    const productId = req.params.productId;
    const days = parseInt(req.query.days) || 30;

    const trendsQuery = `
      SELECT 
        r.name as retailer_name,
        AVG(ph.price) as avg_price,
        MIN(ph.price) as min_price,
        MAX(ph.price) as max_price,
        COUNT(*) as data_points,
        DATE_TRUNC('day', ph.recorded_at) as date
      FROM price_history ph
      JOIN retailers r ON ph.retailer_id = r.id
      WHERE ph.product_id = $1 
        AND ph.recorded_at >= NOW() - INTERVAL '${days} days'
      GROUP BY r.name, DATE_TRUNC('day', ph.recorded_at)
      ORDER BY date DESC, r.name
    `;

    const result = await pool.query(trendsQuery, [productId]);

    // Group by retailer for easier consumption
    const trendsByRetailer = {};
    result.rows.forEach(row => {
      if (!trendsByRetailer[row.retailer_name]) {
        trendsByRetailer[row.retailer_name] = [];
      }
      trendsByRetailer[row.retailer_name].push({
        date: row.date,
        avgPrice: parseFloat(row.avg_price),
        minPrice: parseFloat(row.min_price),
        maxPrice: parseFloat(row.max_price),
        dataPoints: parseInt(row.data_points)
      });
    });

    res.json({
      productId,
      period: `${days} days`,
      trends: trendsByRetailer
    });

  } catch (error) {
    console.error('Price trends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
