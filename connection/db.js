const sequelize = require('../config/database');

sequelize
  .authenticate()
  .then(() => console.log('Database connected...'))
  .catch((err) => console.log('Error connecting to database:', err));

// Sync the models (force: true will drop and recreate tables - use with caution in production)
sequelize
  .sync({ force: true })
  .then(() => console.log('Database synchronized with models'))
  .catch((err) => console.error('Error synchronizing database:', err));

module.exports = sequelize;
