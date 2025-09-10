const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Run migrations
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations.sql'), 
      'utf8'
    );
    await client.query(migrationSQL);
    console.log('✅ Database migrations completed');

    // Run seeds in development only
    if (process.env.NODE_ENV === 'development') {
      const seedSQL = fs.readFileSync(
        path.join(__dirname, 'seeds.sql'), 
        'utf8'
      );
      await client.query(seedSQL);
      console.log('✅ Sample data seeded');
    }

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('🎉 Database setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupDatabase;