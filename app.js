var express = require("express");
var app = express();
var d3 = require('d3');

// Load environment variables at the beginning of the file
require('dotenv').config();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");

app.get("/", function(request, response) {
  response.render("homePage");
});

var server = require("http").Server(app);

app.post('/', function (req, res) {
  res.render('homePage');
})

//connecting MySQL
var mysql = require('mysql2'); // Import MySQL module
const { console } = require("inspector");

// Use environment variables more consistently - check for both standard and service-specific variables
var connection_db = mysql.createConnection({
  host: process.env.DB_HOST || process.env.MYSQL_ADDON_HOST || 'localhost',
  user: process.env.DB_USER || process.env.MYSQL_ADDON_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQL_ADDON_PASSWORD || '11032004',
  port: process.env.DB_PORT || process.env.MYSQL_ADDON_PORT || 3306,
  database: process.env.DB_NAME || process.env.MYSQL_ADDON_DB || 'nckh'
});

// Log the database connection to verify variables (for development only - remove in production)
console.log("Database connection using:", {
  host: process.env.DB_HOST || process.env.MYSQL_ADDON_HOST || 'localhost',
  user: process.env.DB_USER || process.env.MYSQL_ADDON_USER || 'root',
  // Don't log passwords in production
  port: process.env.DB_PORT || process.env.MYSQL_ADDON_PORT || 3306,
  database: process.env.DB_NAME || process.env.MYSQL_ADDON_DB || 'nckh'
});

// Connect to MySQL database
connection_db.connect((err) => {
  if (err) {
    console.error("MySQL connection failed:", err);
    return;
  }
  console.log("Database connection successful!");
});

// Query data
// API to get data from MySQL for months
const query_month = 'SELECT MONTH(Date) AS Months, COUNT(*) AS Accidents FROM hanoi_data_tngt_1517 GROUP BY MONTH(Date)';
app.get('/api/data_month', (req, res) => {
  connection_db.query(query_month, (err, results) => {
    if (err) throw err;
    res.json(results); // Return data as JSON
  });
});

// API to get accident data by month for each year
const query_month_by_year = `
  SELECT 
    YEAR(Date) AS Year, 
    MONTH(Date) AS Month, 
    COUNT(*) AS Accidents 
  FROM hanoi_data_tngt_1517 
  WHERE YEAR(Date) BETWEEN 2015 AND 2017 
  GROUP BY YEAR(Date), MONTH(Date)
  ORDER BY Year, Month`;

app.get('/api/data_month_by_year', (req, res) => {
  connection_db.query(query_month_by_year, (err, results) => {
    if (err) {
      console.error("Query error:", err);
      return res.status(500).json({ error: "Server error" });
    }
    
    // Convert data to format { year: { month: count } }
    const formattedData = results.reduce((acc, { Year, Month, Accidents }) => {
      if (!acc[Year]) acc[Year] = {};
      acc[Year][Month] = Accidents;
      return acc;
    }, {});

    res.json(formattedData);
  });
});

// API to get data from MySQL for days of week
const query_week_by_year = `
  SELECT 
    YEAR(Date) AS Year,
    CASE DAYOFWEEK(Date) 
      WHEN 1 THEN 'Sunday' 
      WHEN 2 THEN 'Monday' 
      WHEN 3 THEN 'Tuesday' 
      WHEN 4 THEN 'Wednesday' 
      WHEN 5 THEN 'Thursday' 
      WHEN 6 THEN 'Friday' 
      WHEN 7 THEN 'Saturday' 
    END AS day_name, 
    COUNT(*) AS Accidents 
  FROM hanoi_data_tngt_1517 
  GROUP BY Year, day_name
  ORDER BY Year, FIELD(day_name, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')`;

app.get('/api/data_week_by_year', (req, res) => {
  connection_db.query(query_week_by_year, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// API to get data from MySQL for hours in day
const query_hour_by_year = `
  SELECT 
    YEAR(Date) AS Year,
    CASE 
      WHEN HOUR(Hour) BETWEEN 0 AND 5 THEN '0h00-5h59' 
      WHEN HOUR(Hour) BETWEEN 6 AND 11 THEN '6h00-11h59' 
      WHEN HOUR(Hour) BETWEEN 12 AND 17 THEN '12h00-17h59' 
      ELSE '18h00-23h59' 
    END AS hour_name, 
    COUNT(*) AS Accidents 
  FROM hanoi_data_tngt_1517 
  GROUP BY Year, hour_name`;

app.get('/api/data_hour_by_year', (req, res) => {
  connection_db.query(query_hour_by_year, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// API to get data from MySQL for seasons
const query_season = "SELECT CASE WHEN Month(Date) BETWEEN 2 AND 4 THEN 'Spring' WHEN Month(Date) BETWEEN 5 AND 7 THEN 'Summer' WHEN Month(Date) BETWEEN 8 AND 10 THEN 'Fall' ELSE 'Winter' END AS season_name, COUNT(*) AS Accidents FROM hanoi_data_tngt_1517 GROUP BY season_name";
app.get('/api/data_season', (req, res) => {
  connection_db.query(query_season, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// API to get data from MySQL for accident locations
const query_point = "SELECT * FROM hanoi_data_tngt_1517 WHERE Latitude IS NOT NULL and Longitude IS NOT NULL";
app.get('/api/data_point', (req, res) => {
  connection_db.query(query_point, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// API to get data from MySQL for vehicle types by year
const query_veh_by_year = `
  SELECT 
    YEAR(Date) AS Year,
    Veh_1, 
    COUNT(*) AS Accidents 
  FROM hanoi_data_tngt_1517 
  WHERE Veh_1 IS NOT NULL 
  GROUP BY Year, Veh_1`;

app.get('/api/data_veh_by_year', (req, res) => {
  connection_db.query(query_veh_by_year, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// API to get data from MySQL for road types
const query_road_by_year = `
  SELECT 
    YEAR(Date) AS Year,
    Rdtype, 
    COUNT(*) AS Accidents 
  FROM hanoi_data_tngt_1517 
  WHERE Rdtype IS NOT NULL 
  GROUP BY Year, Rdtype`;

app.get('/api/data_road_by_year', (req, res) => {
  connection_db.query(query_road_by_year, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// API to get data from MySQL for gender
const query_gender_by_year = `
  SELECT 
    YEAR(Date) AS Year,
    Gender_1, 
    COUNT(*) AS Accidents 
  FROM hanoi_data_tngt_1517 
  WHERE Gender_1 IS NOT NULL 
  GROUP BY Year, Gender_1`;

app.get('/api/data_gender_by_year', (req, res) => {
  connection_db.query(query_gender_by_year, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// API to get data from MySQL for Age
const query_age_by_year = `
  SELECT 
    YEAR(Date) AS Year,
    CASE 
      WHEN Age < 25 THEN '<25' 
      WHEN Age >=25 AND Age <45 THEN '25-45' 
      WHEN Age >=45 AND Age <55 THEN '45-55' 
      ELSE '>55' 
    END AS age_name, 
    COUNT(*) AS Accidents 
  FROM Hanoi_data_TNGT_1517 
  WHERE Age IS NOT NULL 
  GROUP BY Year, age_name`;

app.get('/api/data_age_by_year', (req, res) => {
  connection_db.query(query_age_by_year, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// API to get data from MySQL for Severity
const query_severity_by_year = `
  SELECT 
    YEAR(Date) AS Year,
    Severity_1, 
    COUNT(*) AS Accidents 
  FROM hanoi_data_tngt_1517 
  WHERE Severity_1 IS NOT NULL 
  GROUP BY Year, Severity_1`;

app.get('/api/data_severity_by_year', (req, res) => {
  connection_db.query(query_severity_by_year, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// API to get data from MySQL for Cause
const query_cause_by_year = `
  SELECT 
    YEAR(Date) AS Year,
    Causes, 
    COUNT(*) AS Accidents 
  FROM hanoi_data_tngt_1517 
  WHERE Causes IS NOT NULL 
  GROUP BY Year, Causes`;

app.get('/api/data_cause_by_year', (req, res) => {
  connection_db.query(query_cause_by_year, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// API for gender-age data by year
const query_gender_age_by_year = `
  SELECT
    YEAR(Date) AS Year,
    Gender_1,
    SUM(CASE WHEN Age < 25 THEN 1 ELSE 0 END) AS T_25,
    SUM(CASE WHEN Age >=25 AND Age <45 THEN 1 ELSE 0 END) AS T25_45,
    SUM(CASE WHEN Age >=45 AND Age <55 THEN 1 ELSE 0 END) AS T45_55,
    SUM(CASE WHEN Age >=55 THEN 1 ELSE 0 END) AS T_55
  FROM Hanoi_data_TNGT_1517
  WHERE Age IS NOT NULL AND Gender_1 IS NOT NULL`;

app.get('/api/data_gender_age_by_year', (req, res) => {
  const year = req.query.year;
  let query = query_gender_age_by_year;
  
  // Handle differently for 'all' and specific year
  if (year && year !== 'all') {
    // Add year filter to WHERE condition
    query += ` AND YEAR(Date) = ${connection_db.escape(year)}`;
  }
  
  // Add GROUP BY at the end of query
  query += ` GROUP BY Year, Gender_1`;
  
  // Add HAVING if there's a year
  if (year && year !== 'all') {
    query += ` HAVING Year = ${connection_db.escape(year)}`;
  }

  connection_db.query(query, (err, results) => {
    if (err) {
      console.error("Query error:", err);
      return res.status(500).json({ error: "Server error" });
    }
    
    // Return empty array instead of error if no data
    if (!results || results.length === 0) {
      return res.json([]);
    }
    
    res.json(results);
  });
});

// API for gender-severity correlation
const query_gender_severity = `
  SELECT
    Gender_1,
    SUM(CASE WHEN Severity_1 = 'Không bị sao' THEN 1 ELSE 0 END) AS Khong_bi_sao,
    SUM(CASE WHEN Severity_1 = 'Thương nhẹ' THEN 1 ELSE 0 END) AS Thuong_nhe,
    SUM(CASE WHEN Severity_1 = 'Thương nặng' THEN 1 ELSE 0 END) AS Thuong_nang,
    SUM(CASE WHEN Severity_1 = 'Tử vong' THEN 1 ELSE 0 END) AS Tu_vong
  FROM Hanoi_data_TNGT_1517
  WHERE Severity_1 IS NOT NULL AND Gender_1 IS NOT NULL`;

app.get('/api/data_gender_severity', (req, res) => {
  const year = req.query.year;
  let query = query_gender_severity;
  
  // Create query for each case
  if (year && year !== 'all') {
    // Add year filter to WHERE condition
    query += ` AND YEAR(Date) = ${connection_db.escape(year)}`;
  }
  
  // Add GROUP BY at the end of query
  query += ` GROUP BY Gender_1`;

  connection_db.query(query, (err, results) => {
    if (err) {
      console.error("Query error:", err);
      return res.status(500).json({ error: "Server error" });
    }
    
    // Return empty array instead of error if no data
    if (!results || results.length === 0) {
      return res.json([]);
    }
    
    res.json(results);
  });
});

// API for gender-vehicle correlation
const query_gender_veh = `
  SELECT
    Gender_1,
    SUM(CASE WHEN Veh_1 = 'Bộ hành' THEN 1 ELSE 0 END) AS Bo_hanh,
    SUM(CASE WHEN Veh_1 = 'Xe đạp' THEN 1 ELSE 0 END) AS Xe_dap,
    SUM(CASE WHEN Veh_1 = 'Xe mô tô' THEN 1 ELSE 0 END) AS Xe_mo_to,
    SUM(CASE WHEN Veh_1 = 'Ô tô con' THEN 1 ELSE 0 END) AS O_to_con,
    SUM(CASE WHEN Veh_1 = 'Xe buýt, xe khách' THEN 1 ELSE 0 END) AS Xe_buyt,
    SUM(CASE WHEN Veh_1 = 'Xe tải' THEN 1 ELSE 0 END) AS Xe_tai,
    SUM(CASE WHEN Veh_1 = 'Xe khác, chưa rõ' THEN 1 ELSE 0 END) AS Xe_khac
  FROM Hanoi_data_TNGT_1517
  WHERE Veh_1 IS NOT NULL AND Gender_1 IS NOT NULL`;

app.get('/api/data_gender_veh', (req, res) => {
  const year = req.query.year;
  let query = query_gender_veh;
  
  // Add year filter if specified
  if (year && year !== 'all') {
    // Add year filter to WHERE condition
    query += ` AND YEAR(Date) = ${connection_db.escape(year)}`;
  }
  
  // Add GROUP BY at the end of query
  query += ` GROUP BY Gender_1`;

  connection_db.query(query, (err, results) => {
    if (err) {
      console.error("Query error:", err);
      return res.status(500).json({ error: "Server error" });
    }
    
    // Return empty array instead of error if no data
    if (!results || results.length === 0) {
      return res.json([]);
    }
    
    res.json(results);
  });
});

// API for vehicle-severity correlation
const query_veh_severity = `
  SELECT
    Veh_1,
    SUM(CASE WHEN Severity_1 = 'Không bị sao' THEN 1 ELSE 0 END) AS Khong_bi_sao,
    SUM(CASE WHEN Severity_1 = 'Thương nhẹ' THEN 1 ELSE 0 END) AS Thuong_nhe,
    SUM(CASE WHEN Severity_1 = 'Thương nặng' THEN 1 ELSE 0 END) AS Thuong_nang,
    SUM(CASE WHEN Severity_1 = 'Tử vong' THEN 1 ELSE 0 END) AS Tu_vong
  FROM Hanoi_data_TNGT_1517
  WHERE Severity_1 IS NOT NULL AND Veh_1 IS NOT NULL`;

app.get('/api/data_veh_severity', (req, res) => {
  const year = req.query.year;
  let query = query_veh_severity;
  
  // Add year filter if specified
  if (year && year !== 'all') {
    // Add year filter to WHERE condition
    query += ` AND YEAR(Date) = ${connection_db.escape(year)}`;
  }
  
  // Add GROUP BY at the end of query
  query += ` GROUP BY Veh_1`;

  connection_db.query(query, (err, results) => {
    if (err) {
      console.error("Query error:", err);
      return res.status(500).json({ error: "Server error" });
    }
    
    // Return empty array instead of error if no data
    if (!results || results.length === 0) {
      return res.json([]);
    }
    
    res.json(results);
  });
});

// API for age-severity correlation
const query_age_severity = `
  SELECT
    Severity_1,
    SUM(CASE WHEN Age < 25 THEN 1 ELSE 0 END) AS T_25,
    SUM(CASE WHEN Age >=25 AND Age <45 THEN 1 ELSE 0 END) AS T25_45,
    SUM(CASE WHEN Age >=45 AND Age <55 THEN 1 ELSE 0 END) AS T45_55,
    SUM(CASE WHEN Age >=55 THEN 1 ELSE 0 END) AS T_55
  FROM Hanoi_data_TNGT_1517
  WHERE Age IS NOT NULL AND Severity_1 IS NOT NULL`;

app.get('/api/data_age_severity', (req, res) => {
  const year = req.query.year;
  let query = query_age_severity;
  
  // Add year filter if specified
  if (year && year !== 'all') {
    // Add year filter to WHERE condition
    query += ` AND YEAR(Date) = ${connection_db.escape(year)}`;
  }
  
  // Add GROUP BY at the end of query
  query += ` GROUP BY Severity_1`;

  connection_db.query(query, (err, results) => {
    if (err) {
      console.error("Query error:", err);
      return res.status(500).json({ error: "Server error" });
    }
    
    // Return empty array instead of error if no data
    if (!results || results.length === 0) {
      return res.json([]);
    }
    
    res.json(results);
  });
});

// API for road-severity correlation
const query_road_severity = `
  SELECT
    Rdtype,
    SUM(CASE WHEN Severity_1 = 'Không bị sao' THEN 1 ELSE 0 END) AS Khong_bi_sao,
    SUM(CASE WHEN Severity_1 = 'Thương nhẹ' THEN 1 ELSE 0 END) AS Thuong_nhe,
    SUM(CASE WHEN Severity_1 = 'Thương nặng' THEN 1 ELSE 0 END) AS Thuong_nang,
    SUM(CASE WHEN Severity_1 = 'Tử vong' THEN 1 ELSE 0 END) AS Tu_vong
  FROM Hanoi_data_TNGT_1517
  WHERE Severity_1 IS NOT NULL AND Rdtype IS NOT NULL`;

app.get('/api/data_road_severity', (req, res) => {
  const year = req.query.year;
  let query = query_road_severity;
  
  // Add year filter if specified
  if (year && year !== 'all') {
    // Add year filter to WHERE condition
    query += ` AND YEAR(Date) = ${connection_db.escape(year)}`;
  }
  
  // Add GROUP BY at the end of query
  query += ` GROUP BY Rdtype`;

  connection_db.query(query, (err, results) => {
    if (err) {
      console.error("Query error:", err);
      return res.status(500).json({ error: "Server error" });
    }
    
    // Return empty array instead of error if no data
    if (!results || results.length === 0) {
      return res.json([]);
    }
    
    res.json(results);
  });
});

// Helper function to create filterable endpoints
function createFilterableEndpoint(route, baseQuery, groupByFields) {
  app.get(route, (req, res) => {
    const year = req.query.year;
    let query = baseQuery;
    let queryParams = [];
    
    if (year) {
      query += ' AND YEAR(Date) = ?';
      queryParams.push(year);
    }
    
    query += ` GROUP BY ${groupByFields}`;
    
    connection_db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error("Query error:", err);
        return res.status(500).json({ error: "Server error" });
      }
      res.json(results);
    });
  });
}

// Socket
var io = require("socket.io")(server);
io.on('connection', function(socket) {
  console.log("New connection: " + socket.id);
  socket.on('disconnect', function() {
    console.log(socket.id + " disconnected");
  });
});

// Get port from environment variables or use default
const port = process.env.PORT || process.env.APP_PORT || 8000;
server.listen(port, () => {
  console.log(`Application running at http://localhost:${port}`);
});
