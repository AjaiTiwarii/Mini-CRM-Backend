const Redis = require('ioredis');

// Redis configuration
const redisConfig = {
  // Use Redis URL from environment, fallback to local Redis
  connection: process.env.REDIS_URL || 'redis://localhost:6379',
  // Additional options for production
  retryDelayOnFailover: 100,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
};

// Create Redis connection
let redis;

try {
  if (process.env.REDIS_URL) {
    // Use URL-based connection (for cloud Redis like Upstash)
    redis = new Redis(process.env.REDIS_URL);
  } else {
    // Use local Redis
    redis = new Redis({
      host: 'localhost',
      port: 6379,
      retryDelayOnFailover: 100,
      lazyConnect: true,
    });
  }

  redis.on('connect', () => {
    console.log('✅ Redis connected');
  });

  redis.on('error', (err) => {
    console.warn('⚠️ Redis connection error:', err.message);
    console.log('📝 Note: Some features requiring Redis will be disabled');
  });

} catch (error) {
  console.warn('⚠️ Redis initialization failed:', error.message);
  console.log('📝 Note: Running without Redis - some features will be disabled');
  
  // Create a mock Redis client for development
  redis = {
    get: () => Promise.resolve(null),
    set: () => Promise.resolve('OK'),
    del: () => Promise.resolve(1),
    exists: () => Promise.resolve(0),
    on: () => {},
    disconnect: () => Promise.resolve(),
  };
}

module.exports = redis;