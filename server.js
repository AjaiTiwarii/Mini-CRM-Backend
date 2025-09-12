const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Import passport config after middleware setup
try {
  require('./src/config/passport');
  console.log('Passport configuration loaded');
} catch (error) {
  console.warn('Passport configuration failed:', error.message);
}

// AUTH ROUTES 
app.get('/auth/google', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.json({
      error: 'Google OAuth not configured',
      message: 'Please set GOOGLE_CLIENT_ID in your .env file'
    });
  }
  
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res);
});

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/auth/google?error=failed' }),
  (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}?auth=success`);
  }
);

app.get('/auth/me', (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.post('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) console.error('Logout error:', err);
    res.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  });
});

// DATA ROUTESerDate" DESC LIMIT 5;
let dataRoutesLoaded = false;
try {
  const dataRoutes = require('./src/routes/data');
  app.use('/api/data', dataRoutes);
  console.log('Data routes loaded');
  dataRoutesLoaded = true;
} catch (error) {
  console.error('Data routes failed to load:', error.message);
}

// SEGMENT ROUTES
let segmentRoutesLoaded = false;
try {
  const segmentRoutes = require('./src/routes/segments');
  app.use('/api/segments', segmentRoutes);
  segmentRoutesLoaded = true;
} catch (error) {
  console.error('Segment routes failed to load:', error.message);
}

// CAMPAIGN ROUTES
let campaignRoutesLoaded = false;
try {
  const campaignRoutes = require('./src/routes/campaigns');
  app.use('/api/campaigns', campaignRoutes);
  campaignRoutesLoaded = true;
} catch (error) {
  console.error('Campaign routes failed to load:', error.message);
}

// DELIVERY ROUTES
let deliveryRoutesLoaded = false;
try {
  const deliveryRoutes = require('./src/routes/delivery');
  app.use('/api/delivery', deliveryRoutes);
  deliveryRoutesLoaded = true;
} catch (error) {
  console.error('Delivery routes failed to load:', error.message);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    features: {
      googleOAuth: !!process.env.GOOGLE_CLIENT_ID,
      dataRoutes: dataRoutesLoaded,
      segmentRoutes: segmentRoutesLoaded,
      campaignRoutes: campaignRoutesLoaded,
      deliveryRoutes: deliveryRoutesLoaded
    }
  });
});

// Test route
app.get('/test', (req, res) => {
  const routes = {
    auth: [
      'GET /auth/google - Google OAuth login',
      'GET /auth/me - Get current user',
      'POST /auth/logout - Logout'
    ],
    system: [
      'GET /health - Health check',
      'GET /test - This endpoint'
    ]
  };

  if (dataRoutesLoaded) {
    routes.data = [
      'GET /api/data/customers - List customers',
      'POST /api/data/customers - Create customer',
      'GET /api/data/orders - List orders',
      'POST /api/data/orders - Create order',
      'GET /api/data/stats - Dashboard statistics'
    ];
  }

  if (segmentRoutesLoaded) {
    routes.segments = [
      'GET /api/segments - List segments',
      'POST /api/segments - Create segment',
      'POST /api/segments/preview - Preview audience'
    ];
  }

  if (campaignRoutesLoaded) {
    routes.campaigns = [
      'GET /api/campaigns - List campaigns',
      'POST /api/campaigns - Create campaign',
      'GET /api/campaigns/:id - Get campaign details'
    ];
  }

  if (deliveryRoutesLoaded) {
    routes.delivery = [
      'POST /api/delivery/receipt - Handle delivery receipt'
    ];
  }

  res.json({
    message: 'Mini CRM Backend - All Available Routes',
    routes
  });
});

// 404 handler
app.use((req, res) => {
  const availableRoutes = ['/health', '/test', '/auth/google', '/auth/me'];
  if (dataRoutesLoaded) availableRoutes.push('/api/data/*');
  if (segmentRoutesLoaded) availableRoutes.push('/api/segments/*');
  if (campaignRoutesLoaded) availableRoutes.push('/api/campaigns/*');
  if (deliveryRoutesLoaded) availableRoutes.push('/api/delivery/*');

  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
    availableRoutes
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
async function startServer() {
  try {
    if (dataRoutesLoaded) {
      const { sequelize } = require('./src/models');
      await sequelize.authenticate();
      console.log('Database connected successfully');
    }

    app.listen(PORT, () => {
      console.log('Mini CRM Backend Starting...');
      console.log(`Server: http://localhost:${PORT}`);
      console.log(`Health: http://localhost:${PORT}/health`);
      console.log(`Test: http://localhost:${PORT}/test`);
      console.log('');
      console.log('FEATURES STATUS:');
      console.log(`   Authentication: Google OAuth`);
      console.log(`   Data Ingestion: ${dataRoutesLoaded ? 'ACTIVE' : 'DISABLED'}`);
      console.log(`   Segments: ${segmentRoutesLoaded ? 'ACTIVE' : 'DISABLED'}`);
      console.log(`   Campaigns: ${campaignRoutesLoaded ? 'ACTIVE' : 'DISABLED'}`);
      console.log(`   Delivery: ${deliveryRoutesLoaded ? 'ACTIVE' : 'DISABLED'}`);
      console.log('');
      console.log('Server ready!');
    });

  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.log('Starting server anyway...');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (DATABASE ISSUES)`);
    });
  }
}

startServer();