const Pool = require('pg').Pool;

const pool = new Pool({
  user: 'postgres',
  password: 'christopher8',
  host: 'localhost',
  port: 5432,
  database: 'sales_dashboard'
})

module.exports = pool;