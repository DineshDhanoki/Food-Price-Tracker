const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');
const pool = require('../config/database');

class WebScraper {
  constructor() {
    this.browser = null;
    this.maxConcurrent = parseInt(process.env.MAX_CONCURRENT_SCRAPES) || 5;
    this.scrapingQueue = [];
    this.isScraping = false;
  }

  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
  }

  async scrapeRetailer(retailerId) {
    try {
      await this.initialize();
      
      // Get retailer configuration
      const retailerQuery = 'SELECT * FROM retailers WHERE id = $1 AND is_active = true';
      const retailerResult = await pool.query(retailerQuery, [retailerId]);
      
      if (retailerResult.rows.length === 0) {
        throw new Error('Retailer not found or inactive');
      }
      
      const retailer = retailerResult.rows[0];
      
      // Log scraping start
      const logQuery = `
        INSERT INTO scraping_logs (retailer_id, status, started_at)
        VALUES ($1, 'started', CURRENT_TIMESTAMP)
        RETURNING id
      `;
      const logResult = await pool.query(logQuery, [retailerId]);
      const logId = logResult.rows[0].id;
      
      let productsScraped = 0;
      let errorsCount = 0;
      
      try {
        // Different scraping strategies based on retailer
        switch (retailer.name.toLowerCase()) {
          case 'walmart':
            productsScraped = await this.scrapeWalmart(retailer);
            break;
          case 'target':
            productsScraped = await this.scrapeTarget(retailer);
            break;
          case 'kroger':
            productsScraped = await this.scrapeKroger(retailer);
            break;
          default:
            productsScraped = await this.scrapeGeneric(retailer);
        }
        
        // Update scraping log
        await pool.query(
          'UPDATE scraping_logs SET status = $1, products_scraped = $2, completed_at = CURRENT_TIMESTAMP WHERE id = $3',
          ['completed', productsScraped, logId]
        );
        
        console.log(`Scraping completed for ${retailer.name}: ${productsScraped} products`);
        
      } catch (error) {
        errorsCount++;
        console.error(`Scraping error for ${retailer.name}:`, error);
        
        await pool.query(
          'UPDATE scraping_logs SET status = $1, errors_count = $2, error_message = $3, completed_at = CURRENT_TIMESTAMP WHERE id = $4',
          ['failed', errorsCount, error.message, logId]
        );
      }
      
    } catch (error) {
      console.error('Scraper initialization error:', error);
      throw error;
    }
  }

  async scrapeWalmart(retailer) {
    const page = await this.browser.newPage();
    let productsScraped = 0;
    
    try {
      // Navigate to Walmart's grocery section
      await page.goto('https://www.walmart.com/browse/food', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for products to load
      await page.waitForSelector('[data-testid="item-stack"]', { timeout: 10000 });
      
      // Extract product data
      const products = await page.evaluate(() => {
        const productElements = document.querySelectorAll('[data-testid="item-stack"]');
        const products = [];
        
        productElements.forEach(element => {
          try {
            const nameElement = element.querySelector('[data-automation-id="product-title"]');
            const priceElement = element.querySelector('[itemprop="price"]');
            const imageElement = element.querySelector('img');
            
            if (nameElement && priceElement) {
              const name = nameElement.textContent.trim();
              const priceText = priceElement.textContent.trim().replace('$', '');
              const price = parseFloat(priceText);
              const imageUrl = imageElement ? imageElement.src : null;
              
              if (name && !isNaN(price)) {
                products.push({
                  name,
                  price,
                  imageUrl,
                  retailer: 'Walmart'
                });
              }
            }
          } catch (error) {
            console.error('Error parsing product:', error);
          }
        });
        
        return products;
      });
      
      // Save products to database
      for (const product of products) {
        try {
          await this.saveProduct(product, retailer.id);
          productsScraped++;
        } catch (error) {
          console.error('Error saving product:', error);
        }
      }
      
    } finally {
      await page.close();
    }
    
    return productsScraped;
  }

  async scrapeTarget(retailer) {
    const page = await this.browser.newPage();
    let productsScraped = 0;
    
    try {
      await page.goto('https://www.target.com/c/grocery/-/N-5xtg6', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      await page.waitForSelector('[data-test="product-details"]', { timeout: 10000 });
      
      const products = await page.evaluate(() => {
        const productElements = document.querySelectorAll('[data-test="product-details"]');
        const products = [];
        
        productElements.forEach(element => {
          try {
            const nameElement = element.querySelector('[data-test="product-title"]');
            const priceElement = element.querySelector('[data-test="current-price"]');
            const imageElement = element.querySelector('img');
            
            if (nameElement && priceElement) {
              const name = nameElement.textContent.trim();
              const priceText = priceElement.textContent.trim().replace('$', '');
              const price = parseFloat(priceText);
              const imageUrl = imageElement ? imageElement.src : null;
              
              if (name && !isNaN(price)) {
                products.push({
                  name,
                  price,
                  imageUrl,
                  retailer: 'Target'
                });
              }
            }
          } catch (error) {
            console.error('Error parsing product:', error);
          }
        });
        
        return products;
      });
      
      for (const product of products) {
        try {
          await this.saveProduct(product, retailer.id);
          productsScraped++;
        } catch (error) {
          console.error('Error saving product:', error);
        }
      }
      
    } finally {
      await page.close();
    }
    
    return productsScraped;
  }

  async scrapeKroger(retailer) {
    // Kroger requires more complex handling due to their anti-bot measures
    const page = await this.browser.newPage();
    let productsScraped = 0;
    
    try {
      // Set user agent to avoid detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      await page.goto('https://www.kroger.com/shop', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait a bit to avoid being detected as a bot
      await page.waitForTimeout(2000);
      
      // This would need to be implemented based on Kroger's actual structure
      // For now, return 0 as a placeholder
      console.log('Kroger scraping not fully implemented yet');
      
    } finally {
      await page.close();
    }
    
    return productsScraped;
  }

  async scrapeGeneric(retailer) {
    // Generic scraping using axios and cheerio for simpler sites
    try {
      const response = await axios.get(retailer.website, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      const products = [];
      
      // Generic selectors - would need to be customized per site
      $('.product-item, .product-card, [data-testid*="product"]').each((index, element) => {
        const $el = $(element);
        const name = $el.find('.product-name, .product-title, h3, h4').first().text().trim();
        const priceText = $el.find('.price, .product-price, [class*="price"]').first().text().trim();
        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        const imageUrl = $el.find('img').first().attr('src');
        
        if (name && !isNaN(price)) {
          products.push({
            name,
            price,
            imageUrl,
            retailer: retailer.name
          });
        }
      });
      
      let productsScraped = 0;
      for (const product of products) {
        try {
          await this.saveProduct(product, retailer.id);
          productsScraped++;
        } catch (error) {
          console.error('Error saving product:', error);
        }
      }
      
      return productsScraped;
      
    } catch (error) {
      console.error('Generic scraping error:', error);
      return 0;
    }
  }

  async saveProduct(productData, retailerId) {
    try {
      // First, try to find existing product by name
      const existingProductQuery = 'SELECT id FROM products WHERE name ILIKE $1';
      const existingProduct = await pool.query(existingProductQuery, [productData.name]);
      
      let productId;
      
      if (existingProduct.rows.length > 0) {
        productId = existingProduct.rows[0].id;
      } else {
        // Create new product
        const createProductQuery = `
          INSERT INTO products (name, brand, image_url, unit)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `;
        
        const brand = productData.name.split(' ')[0]; // Simple brand extraction
        const productResult = await pool.query(createProductQuery, [
          productData.name,
          brand,
          productData.imageUrl,
          'each'
        ]);
        
        productId = productResult.rows[0].id;
      }
      
      // Save or update price
      const priceQuery = `
        INSERT INTO product_prices (product_id, retailer_id, price, availability, in_stock, last_updated)
        VALUES ($1, $2, $3, true, true, CURRENT_TIMESTAMP)
        ON CONFLICT (product_id, retailer_id) 
        DO UPDATE SET 
          price = EXCLUDED.price,
          last_updated = EXCLUDED.last_updated,
          availability = EXCLUDED.availability,
          in_stock = EXCLUDED.in_stock
        RETURNING id
      `;
      
      const priceResult = await pool.query(priceQuery, [
        productId,
        retailerId,
        productData.price
      ]);
      
      // Save to price history
      const historyQuery = `
        INSERT INTO price_history (product_id, retailer_id, price)
        VALUES ($1, $2, $3)
      `;
      
      await pool.query(historyQuery, [productId, retailerId, productData.price]);
      
      return priceResult.rows[0].id;
      
    } catch (error) {
      console.error('Error saving product:', error);
      throw error;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = WebScraper;
