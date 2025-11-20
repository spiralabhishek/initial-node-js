# Node.js PostgreSQL API Project

A production-ready, secure, and scalable Node.js REST API with PostgreSQL database, built with modern JavaScript (ES Modules) and function-based architecture.

## 🚀 Features

- **Modern JavaScript**: ES Modules (`"type": "module"`)
- **Function-Based**: Pure functions throughout, no classes
- **PostgreSQL Database**: With connection pooling and transaction support
- **JWT Authentication**: Secure access and refresh token implementation
- **Security First**: Multiple layers of security middleware
- **Comprehensive Logging**: Winston logger with daily rotation
- **Input Validation**: Express-validator for robust validation
- **Rate Limiting**: Protection against brute force attacks
- **Error Handling**: Centralized error handling with detailed logging
- **Testing Ready**: Jest configuration with test structure
- **Code Quality**: ESLint and Prettier pre-configured
- **Database Migrations**: Structured migration system

## 📋 Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 12
- npm >= 9.0.0

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd nodejs-postgres-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

```bash
cp .env.example .env
```

Edit `.env` file with your configuration:

```env
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password

# JWT Secrets - CHANGE THESE IN PRODUCTION
JWT_ACCESS_SECRET=your_strong_secret_key_minimum_32_characters
JWT_REFRESH_SECRET=your_strong_refresh_secret_minimum_32_characters

# Cookie Secret - CHANGE THIS IN PRODUCTION
COOKIE_SECRET=your_strong_cookie_secret_minimum_32_characters
```

### 4. Create PostgreSQL database

```bash
createdb your_database_name
```

### 5. Run database migrations

```bash
npm run db:migrate
```

### 6. Start the server

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

## 📚 API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPass123!"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

## 🔒 Security Features

### 1. Authentication & Authorization
- JWT-based authentication
- Refresh token rotation
- Token revocation support
- HTTP-only cookies for refresh tokens

### 2. Password Security
- Bcrypt hashing (12 rounds)
- Strong password requirements
- Password validation

### 3. Request Security
- Helmet.js for HTTP headers
- CORS configuration
- Rate limiting (general and route-specific)
- Request size limits

### 4. Input Validation
- Express-validator
- XSS protection
- SQL injection prevention (parameterized queries)
- Parameter pollution prevention

### 5. Logging & Monitoring
- All requests logged
- Security events logged
- Error tracking
- Suspicious activity detection

## 📝 Available Scripts

```bash
# Development
npm run dev              # Start with nodemon
npm start               # Start production server

# Database
npm run db:migrate      # Run migrations
npm run db:seed         # Seed database
npm run db:reset        # Reset database

# Testing
npm test                # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage

# Code Quality
npm run lint            # Lint code
npm run lint:fix        # Lint and fix
npm run format          # Format with Prettier

# Security
npm run security:audit  # Run security audit

# Logs
npm run logs:clean      # Clean old logs
```

## 🏗️ Project Structure

```
src/
├── config/              # Configuration files
│   ├── env.js          # Environment variables
│   ├── logger.js       # Winston logger setup
│   ├── database.js     # Database configuration
│   └── security.js     # Security configuration
├── controllers/         # Route controllers
├── middleware/          # Express middleware
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   ├── validation.middleware.js
│   ├── security.middleware.js
│   └── rateLimiter.middleware.js
├── models/             # Database models
├── routes/             # API routes
├── services/           # Business logic
├── utils/              # Utility functions
├── database/
│   ├── migrations/     # Database migrations
│   ├── seeds/          # Database seeds
│   └── pool.js         # Connection pool
├── app.js              # Express app setup
└── server.js           # Server entry point
```

## 🧪 Testing

Run tests:
```bash
npm test
```

Run with coverage:
```bash
npm run test:coverage
```

## 📊 Logging

Logs are stored in the `logs/` directory:
- `application-YYYY-MM-DD.log` - All logs
- `error-YYYY-MM-DD.log` - Error logs only
- `security-YYYY-MM-DD.log` - Security-related logs

## 🔧 Environment Variables

See `.env.example` for all available environment variables.

### Critical Variables

- `JWT_ACCESS_SECRET` - Secret for access tokens (min 32 chars)
- `JWT_REFRESH_SECRET` - Secret for refresh tokens (min 32 chars)
- `COOKIE_SECRET` - Secret for cookie signing (min 32 chars)
- `DB_*` - Database connection details

## 🚀 Production Deployment

### 1. Environment Setup

```bash
NODE_ENV=production
COOKIE_SECURE=true
LOG_LEVEL=info
```

### 2. Generate Strong Secrets

```bash
# Generate random secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Run Security Check

```bash
npm run security:audit
```

### 4. Database Setup

```bash
npm run db:migrate
```

### 5. Start Server

```bash
npm start
```

## 📖 Best Practices Implemented

1. **Separation of Concerns**: Clear separation between routes, controllers, services, and models
2. **Error Handling**: Centralized error handling with proper logging
3. **Security**: Multiple layers of security middleware
4. **Validation**: Input validation at every endpoint
5. **Logging**: Comprehensive logging for debugging and monitoring
6. **Code Quality**: ESLint and Prettier for consistent code style
7. **Documentation**: Well-documented code with JSDoc comments

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License

## 👤 Author

Your Name

## 🙏 Acknowledgments

Built with modern best practices and security standards for Node.js applications.

POST   http://localhost:3000/api/admin/login 
POST   http://localhost:3000/api/admin/refresh-token

POST   http://localhost:3000/api/admin/register         (superadmin only)
GET    http://localhost:3000/api/admin/all              (superadmin only)

GET    http://localhost:3000/api/admin/profile          (requires admin login)
POST   http://localhost:3000/api/admin/logout           (requires admin login)
PUT    http://localhost:3000/api/admin/deactivate       (requires admin login)
------------------------------------------
POST   http://localhost:3000/api/auth/register/send-otp
POST   http://localhost:3000/api/auth/register/verify-otp

POST   http://localhost:3000/api/auth/login/send-otp
POST   http://localhost:3000/api/auth/login/resend-otp
POST   http://localhost:3000/api/auth/login/verify-otp

POST   http://localhost:3000/api/auth/refresh

POST   http://localhost:3000/api/auth/logout             (requires user login)
POST   http://localhost:3000/api/auth/logout-all         (requires user login)

GET    http://localhost:3000/api/auth/me                 (requires user login)
-------------------------------------------------
GET    http://localhost:3000/api/users/profile                     (requires login)
PUT    http://localhost:3000/api/users/profile                     (requires login)

POST   http://localhost:3000/api/users/phone/send-otp              (requires login)
POST   http://localhost:3000/api/users/phone/verify-otp            (requires login)

PUT    http://localhost:3000/api/users/deactivate                  (requires login)

PUT    http://localhost:3000/api/users/reactivate                  (public)

POST   http://localhost:3000/api/users/account/delete-otp          (requires login)
DELETE http://localhost:3000/api/users/account                     (requires login)

GET    http://localhost:3000/api/users/:id                         (requires login)
-------------------------------------------------
GET     http://localhost:3000/api/districts                         (requires login)
GET     http://localhost:3000/api/districts/:id                     (requires login)

POST    http://localhost:3000/api/districts                         (requires login)

PUT     http://localhost:3000/api/districts/:id                     (requires login)

DELETE  http://localhost:3000/api/districts/:id                     (requires login)

GET     http://localhost:3000/api/districts/:id/talukas             (requires login)
-------------------------------------------------
GET     http://localhost:3000/api/talukas                          (requires login)
GET     http://localhost:3000/api/talukas/:id                      (requires login)

POST    http://localhost:3000/api/talukas                          (requires login)

PUT     http://localhost:3000/api/talukas/:id                      (requires login)

DELETE  http://localhost:3000/api/talukas/:id                      (requires login)
-------------------------------------------------
GET     http://localhost:3000/api/categories                          (requires login)
GET     http://localhost:3000/api/categories/:id                      (requires login)

POST    http://localhost:3000/api/categories                          (requires login)

PUT     http://localhost:3000/api/categories/:id                      (requires login)

DELETE  http://localhost:3000/api/categories/:id                      (requires login)
--------------------------------------------------
GET     http://localhost:3000/api/posts                             
GET     http://localhost:3000/api/posts/:id                         
POST    http://localhost:3000/api/posts                              (requires login)

PUT     http://localhost:3000/api/posts/:id                          (requires login)

DELETE  http://localhost:3000/api/posts/:id                          (requires login)
--------------------------------------------------
GET     http://localhost:3000/api/news                              
GET     http://localhost:3000/api/news/:id                          
POST    http://localhost:3000/api/news                              (requires login)

PUT     http://localhost:3000/api/news/:id                          (requires login)

DELETE  http://localhost:3000/api/news/:id                          (requires login)
--------------------------------------------------
POST    http://localhost:3000/api/upload                            (requires login)
