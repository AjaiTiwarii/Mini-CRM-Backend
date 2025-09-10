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

// Simple auth routes (inline for testing)
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

app.get('/auth/me', (req, res) => {
  if (req.user) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.post('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) console.error('Logout error:', err);
    res.json({ message: 'Logged out successfully' });
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    googleOAuth: !!process.env.GOOGLE_CLIENT_ID
  });
});

// Test route to verify server is working
app.get('/test', (req, res) => {
  res.json({
    message: 'Server is working!',
    availableRoutes: {
      health: '/health',
      googleAuth: '/auth/google',
      googleCallback: '/auth/google/callback',
      currentUser: '/auth/me',
      logout: '/auth/logout'
    }
  });
});

// Import other routes (but don't fail if they don't exist)
try {
  const dataRoutes = require('./src/routes/data');
  app.use('/api/data', dataRoutes);
  console.log('✅ Data routes loaded');
} catch (error) {
  console.warn('⚠️ Data routes not loaded:', error.message);
}

try {
  const segmentRoutes = require('./src/routes/segments');
  app.use('/api/segments', segmentRoutes);
  console.log('✅ Segment routes loaded');
} catch (error) {
  console.warn('⚠️ Segment routes not loaded:', error.message);
}

try {
  const campaignRoutes = require('./src/routes/campaigns');
  app.use('/api/campaigns', campaignRoutes);
  console.log('✅ Campaign routes loaded');
} catch (error) {
  console.warn('⚠️ Campaign routes not loaded:', error.message);
}

try {
  const aiRoutes = require('./src/routes/ai');
  app.use('/api/ai', aiRoutes);
  console.log('✅ AI routes loaded');
} catch (error) {
  console.warn('⚠️ AI routes not loaded:', error.message);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
    availableRoutes: ['/health', '/test', '/auth/google', '/auth/me']
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

// Start server WITHOUT database
app.listen(PORT, () => {
  console.log('🚀 Server starting...');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test route: http://localhost:${PORT}/test`);
  console.log(`🔑 Google OAuth: http://localhost:${PORT}/auth/google`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log('📋 No database sync - using raw SQL tables');
  console.log('✅ Server ready!');
});