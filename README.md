# Mini CRM Backend

A comprehensive Customer Relationship Management (CRM) backend system built with Node.js, featuring Google OAuth authentication, customer data management, audience segmentation, campaign management, and delivery tracking capabilities.

## Features

### Core Functionality
- **Google OAuth Authentication** - Secure user authentication via Google OAuth 2.0
- **Customer Data Management** - Create, retrieve, and manage customer information and orders
- **Audience Segmentation** - Create targeted customer segments based on spending patterns and behavior  
- **Campaign Management** - Create and manage marketing campaigns for specific customer segments
- **Delivery Tracking** - Monitor communication delivery status with detailed logging
- **Dashboard Analytics** - Real-time statistics and insights about customers and orders

### Technical Features
- RESTful API design with comprehensive error handling
- PostgreSQL database with Sequelize ORM
- Session-based authentication with secure cookie handling
- Cross-origin resource sharing (CORS) support

## 🛠️ Technology Stack

### Backend Framework
- **Node.js** (>=16.0.0) - JavaScript runtime
- **Express.js** - Web application framework
- **Passport.js** - Authentication middleware

### Database & Caching
- **PostgreSQL** - Primary database
- **Sequelize** - Object-Relational Mapping (ORM)

### Authentication & Security
- **Google OAuth 2.0** - Third-party authentication
- **Express Session** - Session management
- **Joi** - Data validation
- **JWT** - JSON Web Tokens


## Project Structure

```
Mini-CRM-Backend/
├── src/
│   ├── config/         # Configuration files (Passport, database)
│   ├── controllers/    # Business logic controllers
│   ├── middleware/     # Authentication and validation middleware
│   ├── models/         # Sequelize database models
│   ├── routes/         # API route definitions
│   └── utils/          # Utility functions and helpers
├── database/
│   ├── migrations.sql  # Database schema migrations
│   ├── seeds.sql      # Sample data for development
│   └── setup.js       # Database initialization script
├── .env.example       # Environment variable template
├── .gitignore        # Git ignore rules
├── package.json      # Project dependencies and scripts
├── package-lock.json # Dependency lock file
└── server.js         # Main application entry point
```

## Getting Started

### Prerequisites

Ensure you have the following installed on your system:
- **Node.js** (version 16.0.0 or higher)
- **PostgreSQL** (version 12 or higher)
- **npm** package manager

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

   ```

4. **Set up the database**
   ```bash
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
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - Development: `http://localhost:5000/auth/google/callback`
   - Production: `https://yourdomain.com/auth/google/callback`
6. Copy the Client ID and Client Secret to your `.env` file

## Api Documentation
Api documetation is available [here](https://documenter.getpostman.com/view/29025034/2sB3HoqKfn)


## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | No | development |
| `PORT` | Server port | No | 5000 |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SESSION_SECRET` | Session encryption secret | Yes | - |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes | - |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | No | http://localhost:5000/auth/google/callback |
| `FRONTEND_URL` | Frontend application URL | No | http://localhost:3000 |
