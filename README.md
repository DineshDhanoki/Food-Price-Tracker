# Food Price Tracker

A comprehensive web application for tracking food prices across multiple retailers, built with modern technologies and scalable architecture.

## 🚀 Features

- **Price Comparison**: Compare prices across multiple retailers
- **Price Alerts**: Set alerts for price drops on favorite products
- **User Authentication**: Secure JWT-based authentication
- **Favorites**: Save favorite products for easy tracking
- **Analytics**: Track price trends and get insights
- **Web Scraping**: Automated price collection from major retailers
- **Responsive Design**: Modern, mobile-friendly interface

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **JWT** authentication
- **Puppeteer** for web scraping
- **Docker** containerization

### Frontend
- **React 18** with hooks
- **Styled Components** for styling
- **React Query** for data fetching
- **React Router** for navigation
- **Axios** for API calls

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Docker (optional)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FoodPriceTracker
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend && npm install
   
   # Install frontend dependencies
   cd ../frontend && npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment files
   cp .env.example .env
   cp backend/.env.example backend/.env
   
   # Edit the .env files with your configuration
   ```

4. **Set up the database**
   ```bash
   # Start PostgreSQL (using Docker)
   docker-compose up -d postgres
   
   # Run database migrations
   cd backend && npm run migrate
   ```

5. **Start the development servers**
   ```bash
   # Start both frontend and backend
   npm run dev
   ```

### Production Deployment

1. **Using Docker Compose**
   ```bash
   # Build and start all services
   docker-compose up -d
   ```

2. **Manual Deployment**
   ```bash
   # Build frontend
   cd frontend && npm run build
   
   # Start backend
   cd ../backend && npm start
   ```

## 🗄️ Database Schema

The application uses PostgreSQL with the following main tables:

- **users**: User accounts and authentication
- **products**: Product information and metadata
- **retailers**: Store information
- **product_prices**: Current prices across retailers
- **price_history**: Historical price data
- **price_alerts**: User-defined price alerts
- **user_favorites**: User's favorite products

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Products
- `GET /api/products/search` - Search products
- `GET /api/products/:id` - Get product details
- `POST /api/products/:id/favorite` - Add to favorites
- `GET /api/products/favorites/list` - Get user favorites

### Prices
- `GET /api/prices/compare` - Compare prices
- `GET /api/prices/history` - Price history
- `GET /api/prices/trending` - Trending products
- `GET /api/prices/deals` - Best deals

### Alerts
- `GET /api/alerts` - Get user alerts
- `POST /api/alerts` - Create price alert
- `PUT /api/alerts/:id` - Update alert
- `DELETE /api/alerts/:id` - Delete alert

## 🕷️ Web Scraping

The application includes a sophisticated web scraping system that:

- Supports multiple retailers (Walmart, Target, Kroger, etc.)
- Uses Puppeteer for dynamic content
- Implements rate limiting and anti-detection measures
- Stores scraped data in PostgreSQL
- Runs on scheduled intervals

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration
- Input validation with Joi
- SQL injection prevention
- XSS protection headers

## 📊 Performance Optimizations

- Database indexing for fast queries
- React Query for efficient data fetching
- Image optimization and lazy loading
- Compression middleware
- Connection pooling
- Caching strategies

## 🧪 Testing

```bash
# Run backend tests
cd backend && npm test

# Run frontend tests
cd frontend && npm test

# Run all tests
npm test
```

## 📈 Monitoring

- Health check endpoints
- Error logging and monitoring
- Database query performance tracking
- Scraping success/failure rates

## 🚀 Deployment

### Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=food_tracker
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=production
```

### Docker Deployment

```bash
# Build and deploy
docker-compose up -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale backend=3
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🔮 Future Enhancements

- Mobile app development
- Machine learning price predictions
- Social features and sharing
- Advanced analytics dashboard
- Integration with more retailers
- Real-time notifications
- Price forecasting algorithms
