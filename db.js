const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.loclalhost,
  user: process.env.root,
  password: process.env.root + '11032004',
  database: process.env.nckh,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;