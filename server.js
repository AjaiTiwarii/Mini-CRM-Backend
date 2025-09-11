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
  console.log('✅ Passport configuration loaded');
} catch (error) {
  console.warn('⚠️ Passport configuration failed:', error.message);
}

// AUTH ROUTES (keeping your Google OAuth exactly as is)
app.get('/auth/google', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.json({
      error: 'Google OAuth not configured',
      message: 'Please set GOOGLE_CLIENT_ID in your .env file'
    });
  }
  
  // Use passport google authentication
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res);
});

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/auth/google?error=failed' }),
  (req, res) => {
    // Successful authentication
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}?auth=success`);
  }
);

// Updated to match frontend expectations
// app.get('/auth/me', (req, res) => {
//   if (req.user) {
//     res.json({ 
//       success: true,
//       data: { user: req.user },
//       message: 'User authenticated'
//     });
//   } else {
//     res.status(401).json({ 
//       success: false,
//       message: 'Not authenticated' 
//     });
//   }
// });

app.get('/auth/me', (req, res) => {
  if (req.user) {
    // Return user directly (not wrapped) - exactly as it was before
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

// DATA ROUTES - Load with proper error handling
let dataRoutesLoaded = false;
try {
  const dataRoutes = require('./src/routes/data');
  app.use('/api/data', dataRoutes);
  console.log('✅ Data routes loaded');
  dataRoutesLoaded = true;
} catch (error) {
  console.error('❌ Data routes failed to load:', error.message);
  console.log('📝 Make sure src/routes/data.js and models exist');
}

// MOCK ROUTES for features not implemented yet
app.get('/api/segments', (req, res) => {
  res.json({
    success: true,
    data: { segments: [] },
    message: 'Segments feature coming soon'
  });
});

app.get('/api/campaigns', (req, res) => {
  res.json({
    success: true,
    data: { campaigns: [] },
    message: 'Campaigns feature coming soon'
  });
});

app.post('/api/ai/parse-segment', (req, res) => {
  res.json({
    success: false,
    message: 'AI integration coming soon',
    data: { rules: [] }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    features: {
      googleOAuth: !!process.env.GOOGLE_CLIENT_ID,
      dataRoutes: dataRoutesLoaded,
      database: 'checking...'
    }
  });
});

// Updated test route with all available endpoints
app.get('/test', (req, res) => {
  const routes = {
    auth: [
      'GET /auth/google - Google OAuth login',
      'GET /auth/google/callback - OAuth callback',
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

  routes.mock = [
    'GET /api/segments - Mock segments',
    'GET /api/campaigns - Mock campaigns',
    'POST /api/ai/parse-segment - Mock AI'
  ];

  res.json({
    message: 'Mini CRM Backend - All Available Routes',
    routes,
    testCommands: {
      health: 'curl http://localhost:5000/health',
      auth: 'curl http://localhost:5000/auth/me',
      ...(dataRoutesLoaded && {
        stats: 'curl http://localhost:5000/api/data/stats',
        customers: 'curl http://localhost:5000/api/data/customers',
        createCustomer: 'curl -X POST http://localhost:5000/api/data/customers -H "Content-Type: application/json" -d \'{"email":"test@test.com","name":"Test User"}\''
      })
    }
  });
});

// 404 handler with helpful message
app.use((req, res) => {
  const availableRoutes = ['/health', '/test', '/auth/google', '/auth/me'];
  if (dataRoutesLoaded) {
    availableRoutes.push('/api/data/stats', '/api/data/customers', '/api/data/orders');
  }

  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
    availableRoutes,
    hint: 'Visit /test to see all available routes'
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

// Start server with database connection test
async function startServer() {
  try {
    // Test database connection if data routes are loaded
    if (dataRoutesLoaded) {
      const { sequelize } = require('./src/models');
      await sequelize.authenticate();
      console.log('✅ Database connected successfully');
    }

    // Start server
    app.listen(PORT, () => {
      console.log('🚀 Mini CRM Backend Starting...');
      console.log(`📍 Server: http://localhost:${PORT}`);
      console.log(`🔗 Health: http://localhost:${PORT}/health`);
      console.log(`🧪 Test: http://localhost:${PORT}/test`);
      console.log(`🔑 Google OAuth: http://localhost:${PORT}/auth/google`);
      console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL}`);
      
      console.log('');
      console.log('✅ FEATURES STATUS:');
      console.log('   🔐 Authentication: Google OAuth (real)');
      console.log(`   📊 Data Ingestion: ${dataRoutesLoaded ? 'ACTIVE' : 'DISABLED (missing files)'}`);
      console.log('   🎯 Segments: Mock (coming soon)');
      console.log('   📢 Campaigns: Mock (coming soon)');
      console.log('   🤖 AI Integration: Mock (coming soon)');
      console.log('');
      
      if (dataRoutesLoaded) {
        console.log('🎉 Server ready! Data APIs are live!');
        console.log(`📊 Test stats: curl http://localhost:${PORT}/api/data/stats`);
      } else {
        console.log('⚠️ Server ready but data routes disabled');
        console.log('📝 Create missing files to enable data features');
      }
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('⚠️ Starting server anyway - data routes may not work');
    
    // Start server even if database fails
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} (DATABASE ISSUES)`);
      console.log(`🔗 Health: http://localhost:${PORT}/health`);
      console.log(`🧪 Test: http://localhost:${PORT}/test`);
      console.log('📝 Fix database connection to enable data features');
    });
  }
}

startServer();