# Mini CRM Backend

A comprehensive Customer Relationship Management (CRM) backend system built with Node.js, featuring Google OAuth authentication, customer data management, audience segmentation, campaign management, delivery tracking, and AI-powered campaign insights using Google's Gemini API.

## Features

### Core Functionality
- **Google OAuth Authentication** - Secure user authentication via Google OAuth 2.0
- **Customer Data Management** - Create, retrieve, and manage customer information and orders
- **Audience Segmentation** - Create targeted customer segments based on spending patterns and behavior  
- **Campaign Management** - Create and manage marketing campaigns for specific customer segments
- **AI-Powered Insights** - Generate intelligent campaign analysis using Google Gemini AI
- **Dashboard Analytics** - Real-time statistics and insights about customers and orders

### Technical Features
- RESTful API design with comprehensive error handling
- PostgreSQL database with Sequelize ORM
- Session-based authentication with secure cookie handling
- Cross-origin resource sharing (CORS) support
- Joi validation for data integrity

## Technology Stack

### Backend Framework
- **Node.js** (>=16.0.0) - JavaScript runtime
- **Express.js** - Web application framework
- **Passport.js** - Authentication middleware with Google OAuth strategy

### Database & ORM
- **PostgreSQL** - Primary database with UUID support
- **Sequelize** - Object-Relational Mapping (ORM) with associations

### AI Integration
- **Google Gemini AI** - Campaign insights and analysis generation
- **@google/generative-ai** - Official Google AI SDK

### Authentication & Security
- **Google OAuth 2.0** - Third-party authentication
- **Express Session** - Session management with secure cookies
- **Joi** - Request validation and sanitization

## Project Structure

```
Mini-CRM-Backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js   # Database connection setup
│   │   ├── passport.js   # Passport Google OAuth strategy
│   │   └── auth.js       # Authentication configuration
│   ├── controllers/      # Business logic controllers
│   │   ├── authController.js      # Authentication logic
│   │   ├── dataController.js      # Customer & order management
│   │   ├── segmentController.js   # Audience segmentation
│   │   ├── campaignController.js  # Campaign management + AI
│   │   └── deliveryController.js  # Delivery receipt handling
│   ├── middleware/       # Request middleware
│   │   ├── auth.js       # Authentication middleware
│   │   └── validation.js # Joi validation schemas
│   ├── models/           # Sequelize database models
│   │   ├── index.js      # Model associations and exports
│   │   ├── User.js       # User authentication model
│   │   ├── Customer.js   # Customer data model
│   │   ├── Order.js      # Order tracking model
│   │   ├── Segment.js    # Audience segment model
│   │   ├── Campaign.js   # Campaign management model
│   │   └── CommunicationLog.js # Message delivery logs
│   ├── routes/           # API route definitions
│   │   ├── auth.js       # Authentication routes
│   │   ├── data.js       # Customer & order routes
│   │   ├── segments.js   # Segmentation routes
│   │   ├── campaigns.js  # Campaign routes + AI insights
│   │   └── delivery.js   # Delivery webhook routes
│   ├── services/         # External service integrations
│   │   └── aiService.js  # Google Gemini AI integration
│   └── utils/            # Utility functions and helpers
│       ├── response.js   # Standardized API responses
│       └── logger.js     # Application logging
├── database/
│   ├── migrations.sql    # Database schema with indexes
│   ├── seeds.sql         # Sample data for development
│   └── setup.js          # Database initialization script
├── .env.example          # Environment variable template
├── .gitignore           # Git ignore rules
├── package.json         # Project dependencies and scripts
├── package-lock.json    # Dependency lock file
└── server.js            # Main application entry point
```

## Getting Started

### Prerequisites

Ensure you have the following installed on your system:
- **Node.js** (version 16.0.0 or higher)
- **PostgreSQL** (version 12 or higher)
- **npm** package manager
- **Google Cloud Console** account (for OAuth)
- **Google AI Studio** account (for Gemini API)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AjaiTiwarii/Mini-CRM-Backend.git
   cd Mini-CRM-Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file with your configuration:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=5000

   # Database Configuration
   DATABASE_URL=postgresql://username:password@localhost:5432/mini_crm_db

   # Authentication
   SESSION_SECRET=your-session-secret-here

   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

   # Frontend URL
   FRONTEND_URL=http://localhost:3000

   # AI Integration
   GEMINI_API_KEY=your_gemini_api_key

   # Logging
   LOG_LEVEL=info
   ```

4. **Set up the database**
   ```bash
   # Create database and run migrations
   npm run db:setup
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start at `http://localhost:5000`

### Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and People API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:5000`
   - Authorized redirect URIs: `http://localhost:5000/auth/google/callback`
5. Copy the Client ID and Client Secret to your `.env` file

### Google Gemini AI Setup

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key for Gemini
3. Add the API key to your `.env` file as `GEMINI_API_KEY`
4. The system uses Gemini 1.5 Flash for campaign insights generation

## API Documentation

**Complete API Documentation:** [https://documenter.getpostman.com/view/29025034/2sB3HoqKfn](https://documenter.getpostman.com/view/29025034/2sB3HoqKfn)

## AI-Powered Features

- **Performance Analysis**: Delivery rates, audience engagement
- **Segment Insights**: Performance by customer characteristics
- **Actionable Recommendations**: Data-driven suggestions
- **Fallback System**: Graceful degradation if AI service unavailable

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | No | development |
| `PORT` | Server port | No | 5000 |
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `SESSION_SECRET` | Session encryption secret | Yes | - |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes | - |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | No | http://localhost:5000/auth/google/callback |
| `FRONTEND_URL` | Frontend application URL | No | http://localhost:3000 |
| `GEMINI_API_KEY` | Google Gemini AI API key | Yes | - |
| `LOG_LEVEL` | Logging verbosity | No | info |
