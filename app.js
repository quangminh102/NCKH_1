var express = require("express");
var app = express();
var d3 = require('d3');
require('dotenv').config();
console.log("Thông tin từ .env:");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_NAME:", process.env.DB_NAME);

// Thiết lập middleware và cấu hình
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true })); // Thêm middleware xử lý form data
app.use(express.json()); // Thêm middleware xử lý JSON
app.set("view engine", "ejs");
app.set("views", "./views");

app.get("/", function(request, response) {
  response.render("homePage");
});

app.post('/', function(req, res) {
  res.render('homePage');
});

// Tạo server HTTP
var server = require("http").Server(app);

// Kết nối MySQL
var mysql = require('mysql2'); // Import MySQL module

// Tạo kết nối với cơ sở dữ liệu
var connection_db;
if (process.env.DATABASE_URL) {
  // Parse the DATABASE_URL for Render's MySQL service
  const dbUrl = new URL(process.env.DATABASE_URL);
  connection_db = mysql.createConnection({
    host: dbUrl.hostname,
    user: dbUrl.username,
    password: dbUrl.password,
    port: dbUrl.port || 3306,
    database: dbUrl.pathname.substring(1), // Remove leading slash
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  // Sử dụng biến môi trường
  connection_db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME
  });
}

// Kết nối MySQL
connection_db.connect((err) => {
  if (err) {
    console.error("Kết nối MySQL thất bại:", err);
    return;
  }
  console.log("Kết nối CSDL thành công!");
});




// Truy van du lieu
// API để lấy dữ liệu từ MySQL cho thang
const query_month = 'SELECT MONTH(Date) AS Months, COUNT(*) AS Accidents FROM hanoi_data_tngt_1517 GROUP BY MONTH(Date)';
app.get('/api/data_month', (req, res) => {
  connection_db.query(query_month, (err, results) => {
    if (err) throw err;
    res.json(results); // Trả dữ liệu dưới dạng JSON
  });
});



// API để lấy dữ liệu tai nạn theo tháng của từng năm
const query_month_by_year = `
  SELECT
    YEAR(Date) AS Year,
    MONTH(Date) AS Month,
    COUNT(*) AS Accidents
  FROM hanoi_data_tngt_1517
  WHERE YEAR(Date) BETWEEN 2015 AND 2017
  GROUP BY YEAR(Date), MONTH(Date)
  ORDER BY Year, Month`;

require('dotenv').config();
app.get('/api/data_month_by_year', (req, res) => {
  connection_db.query(query_month_by_year, (err, results) => {
    if (err) {
      console.error("Lỗi truy vấn:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }
   
    // Chuyển đổi dữ liệu thành định dạng { năm: { tháng: số_vụ } }
    const formattedData = results.reduce((acc, { Year, Month, Accidents }) => {
      if (!acc[Year]) acc[Year] = {};
      acc[Year][Month] = Accidents;
      return acc;
    }, {});


    res.json(formattedData);
  });
});


// API để lấy dữ liệu từ MySQL cho tuần
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




// API để lấy dữ liệu từ MySQL theo khung giờ trong ngay
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




// API để lấy dữ liệu từ MySQL cho mua trong nam
const query_season = "SELECT CASE WHEN Month(Date) BETWEEN 2 AND 4 THEN 'Spring' WHEN Month(Date) BETWEEN 5 AND 7 THEN 'Summer' WHEN Month(Date) BETWEEN 8 AND 10 THEN 'Fall' ELSE 'Winter' END AS season_name, COUNT(*) AS Accidents FROM hanoi_data_tngt_1517 GROUP BY season_name";
app.get('/api/data_season', (req, res) => {
  connection_db.query(query_season, (err, results) => {
    if (err) throw err;
    res.json(results); // Trả dữ liệu dưới dạng JSON
  });
});




// API để lấy dữ liệu từ MySQL cho tọa do TNGT
//const query_point = "SELECT Latitude, Longitude, Code, Severity_1 FROM hanoi_data_tngt_1517 WHERE Latitude IS NOT NULL and Longitude IS NOT NULL";
const query_point = "SELECT * FROM hanoi_data_tngt_1517 WHERE Latitude IS NOT NULL and Longitude IS NOT NULL";
app.get('/api/data_point', (req, res) => {
  connection_db.query(query_point, (err, results) => {
    if (err) throw err;
    res.json(results); // Trả dữ liệu dưới dạng JSON
  });
});






// API để lấy dữ liệu từ MySQL cho loai xe
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


// API để lấy dữ liệu từ MySQL cho loai duong
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






// API để lấy dữ liệu từ MySQL cho gender
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




// API để lấy dữ liệu từ MySQL cho Age
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
  FROM hanoi_data_tngt_1517
  WHERE Age IS NOT NULL
  GROUP BY Year, age_name`;


app.get('/api/data_age_by_year', (req, res) => {
  connection_db.query(query_age_by_year, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});


// API để lấy dữ liệu từ MySQL cho Severity
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




// API để lấy dữ liệu từ MySQL cho Cause
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


// =================API để lấy dữ liệu 2D từ MySQL


// =================API để lấy dữ liệu 2D từ MySQL


// API để lấy dữ liệu từ MySQL cho Gender_age
//const query_gender_age = "SELECT CASE WHEN Age < 25 THEN '<25 tuổi'WHEN Age >=25 AND Age <45 THEN '25-45' WHEN Age >=45 AND Age <55 THEN '45-55' ELSE '>55 tuổ' END AS age_name, COUNT(*) AS Accidents, Gender_1 FROM hanoi_data_tngt_1517 WHERE Age IS NOT NULL and Gender_1 IS NOT NULL GROUP BY age_name, Gender_1";


// API để lấy dữ liệu từ MySQL cho Gender_age theo năm
// API to fetch gender-age data by year
const query_gender_age_by_year = `
  SELECT
    YEAR(Date) AS Year,
    Gender_1,
    SUM(CASE WHEN Age < 25 THEN 1 ELSE 0 END) AS T_25,
    SUM(CASE WHEN Age >=25 AND Age <45 THEN 1 ELSE 0 END) AS T25_45,
    SUM(CASE WHEN Age >=45 AND Age <55 THEN 1 ELSE 0 END) AS T45_55,
    SUM(CASE WHEN Age >=55 THEN 1 ELSE 0 END) AS T_55
  FROM hanoi_data_tngt_1517
  WHERE Age IS NOT NULL AND Gender_1 IS NOT NULL`;


app.get('/api/data_gender_age_by_year', (req, res) => {
  const year = req.query.year;
  let query = query_gender_age_by_year;
 
  // Xử lý khác nhau cho trường hợp 'all' và năm cụ thể
  if (year && year !== 'all') {
    // Thêm điều kiện lọc năm vào WHERE
    query += ` AND YEAR(Date) = ${connection_db.escape(year)}`;
  }
 
  // Thêm GROUP BY vào cuối câu query
  query += ` GROUP BY Year, Gender_1`;
 
  // Thêm HAVING nếu có year
  if (year && year !== 'all') {
    query += ` HAVING Year = ${connection_db.escape(year)}`;
  }


  connection_db.query(query, (err, results) => {
    if (err) {
      console.error("Query error:", err);
      return res.status(500).json({ error: "Server error" });
    }
   
    // Trả về mảng rỗng thay vì lỗi nếu không có dữ liệu
    if (!results || results.length === 0) {
      return res.json([]);
    }
   
    res.json(results);
  });
});






// API for total gender-age distribution (for percentage calculations)
const query_gender_age = `
  SELECT
    Gender_1,
    SUM(CASE WHEN Age < 25 THEN 1 ELSE 0 END) AS T_25,
    SUM(CASE WHEN Age >=25 AND Age <45 THEN 1 ELSE 0 END) AS T25_45,
    SUM(CASE WHEN Age >=45 AND Age <55 THEN 1 ELSE 0 END) AS T45_55,
    SUM(CASE WHEN Age >=55 THEN 1 ELSE 0 END) AS T_55
  FROM hanoi_data_tngt_1517
  WHERE Age IS NOT NULL AND Gender_1 IS NOT NULL
  GROUP BY Gender_1`;


app.get('/api/data_gender_age_by_year', (req, res) => {
  const year = req.query.year;
  let query = query_gender_age_by_year;
  let queryParams = [];
 
  if (year) {
    query += ' HAVING Year = ?';
    queryParams.push(year);
  }
 
  connection_db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Query error:", err);
      return res.status(500).json({ error: "Server error" });
    }
    res.json(results);
  });
});


// API để lấy dữ liệu từ MySQL cho Gender_severity
// API for gender-severity correlation
const query_gender_severity = `
  SELECT
    Gender_1,
    SUM(CASE WHEN Severity_1 = 'Không bị sao' THEN 1 ELSE 0 END) AS Khong_bi_sao,
    SUM(CASE WHEN Severity_1 = 'Thương nhẹ' THEN 1 ELSE 0 END) AS Thuong_nhe,
    SUM(CASE WHEN Severity_1 = 'Thương nặng' THEN 1 ELSE 0 END) AS Thuong_nang,
    SUM(CASE WHEN Severity_1 = 'Tử vong' THEN 1 ELSE 0 END) AS Tu_vong
  FROM hanoi_data_tngt_1517
  WHERE Severity_1 IS NOT NULL AND Gender_1 IS NOT NULL`;


app.get('/api/data_gender_severity', (req, res) => {
  const year = req.query.year;
  let query = query_gender_severity;
 
  // Tạo câu query cho từng trường hợp
  if (year && year !== 'all') {
    // Thêm điều kiện lọc năm vào WHERE
    query += ` AND YEAR(Date) = ${connection_db.escape(year)}`;
  }
 
  // Thêm GROUP BY vào cuối câu query
  query += ` GROUP BY Gender_1`;


  connection_db.query(query, (err, results) => {
    if (err) {
      console.error("Query error:", err);
      return res.status(500).json({ error: "Server error" });
    }
   
    // Trả về mảng rỗng thay vì lỗi nếu không có dữ liệu
    if (!results || results.length === 0) {
      return res.json([]);
    }
   
    res.json(results);
  });
});




// API for gender-severity correlation
const query_gender_severity_base = `
  SELECT
    Gender_1,
    Year,
    SUM(CASE WHEN Severity_1 = 'Không bị sao' THEN 1 ELSE 0 END) AS Khong_bi_sao,
    SUM(CASE WHEN Severity_1 = 'Thương nhẹ' THEN 1 ELSE 0 END) AS Thuong_nhe,
    SUM(CASE WHEN Severity_1 = 'Thương nặng' THEN 1 ELSE 0 END) AS Thuong_nang,
    SUM(CASE WHEN Severity_1 = 'Tử vong' THEN 1 ELSE 0 END) AS Tu_vong
  FROM hanoi_data_tngt_1517
  WHERE Severity_1 IS NOT NULL AND Gender_1 IS NOT NULL`;


app.get('/api/data_gender_severity', (req, res) => {
  const year = req.query.year;
  let query = query_gender_severity_base;
  let queryParams = [];
 
  if (year) {
    query += ' AND Year = ? GROUP BY Gender_1';
    queryParams.push(year);
  } else {
    query += ' GROUP BY Gender_1, Year';
  }
 
  connection_db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Query error:", err);
      return res.status(500).json({ error: "Server error" });
    }
    res.json(results);
  });
});
















// API để lấy dữ liệu từ MySQL cho Gender_Veh1
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
  FROM hanoi_data_tngt_1517
  WHERE Veh_1 IS NOT NULL AND Gender_1 IS NOT NULL`;


app.get('/api/data_gender_veh', (req, res) => {
  const year = req.query.year;
  let query = query_gender_veh;
 
  // Thêm điều kiện lọc năm nếu được chỉ định
  if (year && year !== 'all') {
    // Thêm điều kiện lọc năm vào WHERE
    query += ` AND YEAR(Date) = ${connection_db.escape(year)}`;
  }
 
  // Thêm GROUP BY vào cuối câu query
  query += ` GROUP BY Gender_1`;


  connection_db.query(query, (err, results) => {
    if (err) {
      console.error("Query error:", err);
      return res.status(500).json({ error: "Server error" });
    }
   
    // Trả về mảng rỗng thay vì lỗi nếu không có dữ liệu
    if (!results || results.length === 0) {
      return res.json([]);
    }
   
    res.json(results);
  });
});








// API để lấy dữ liệu từ MySQL cho Veh_severity
const query_veh_severity = `
  SELECT
    Veh_1,
    SUM(CASE WHEN Severity_1 = 'Không bị sao' THEN 1 ELSE 0 END) AS Khong_bi_sao,
    SUM(CASE WHEN Severity_1 = 'Thương nhẹ' THEN 1 ELSE 0 END) AS Thuong_nhe,
    SUM(CASE WHEN Severity_1 = 'Thương nặng' THEN 1 ELSE 0 END) AS Thuong_nang,
    SUM(CASE WHEN Severity_1 = 'Tử vong' THEN 1 ELSE 0 END) AS Tu_vong
  FROM hanoi_data_tngt_1517
  WHERE Severity_1 IS NOT NULL AND Veh_1 IS NOT NULL`;


app.get('/api/data_veh_severity', (req, res) => {
  const year = req.query.year;
  let query = query_veh_severity;
 
  // Thêm điều kiện lọc năm nếu được chỉ định
  if (year && year !== 'all') {
    // Thêm điều kiện lọc năm vào WHERE
    query += ` AND YEAR(Date) = ${connection_db.escape(year)}`;
  }
 
  // Thêm GROUP BY vào cuối câu query
  query += ` GROUP BY Veh_1`;


  connection_db.query(query, (err, results) => {
    if (err) {
      console.error("Query error:", err);
      return res.status(500).json({ error: "Server error" });
    }
   
    // Trả về mảng rỗng thay vì lỗi nếu không có dữ liệu
    if (!results || results.length === 0) {
      return res.json([]);
    }
   
    res.json(results);
  });
});






// API để lấy dữ liệu từ MySQL cho age_severity
const query_age_severity = `
  SELECT
    Severity_1,
    SUM(CASE WHEN Age < 25 THEN 1 ELSE 0 END) AS T_25,
    SUM(CASE WHEN Age >=25 AND Age <45 THEN 1 ELSE 0 END) AS T25_45,
    SUM(CASE WHEN Age >=45 AND Age <55 THEN 1 ELSE 0 END) AS T45_55,
    SUM(CASE WHEN Age >=55 THEN 1 ELSE 0 END) AS T_55
  FROM hanoi_data_tngt_1517
  WHERE Age IS NOT NULL AND Severity_1 IS NOT NULL`;


app.get('/api/data_age_severity', (req, res) => {
  const year = req.query.year;
  let query = query_age_severity;
 
  // Thêm điều kiện lọc năm nếu được chỉ định
  if (year && year !== 'all') {
    // Thêm điều kiện lọc năm vào WHERE
    query += ` AND YEAR(Date) = ${connection_db.escape(year)}`;
  }
 
  // Thêm GROUP BY vào cuối câu query
  query += ` GROUP BY Severity_1`;


  connection_db.query(query, (err, results) => {
    if (err) {
      console.error("Query error:", err);
      return res.status(500).json({ error: "Server error" });
    }
   
    // Trả về mảng rỗng thay vì lỗi nếu không có dữ liệu
    if (!results || results.length === 0) {
      return res.json([]);
    }
   
    res.json(results);
  });
});










// API để lấy dữ liệu từ MySQL cho Road_severity
const query_road_severity = `
  SELECT
    Rdtype,
    SUM(CASE WHEN Severity_1 = 'Không bị sao' THEN 1 ELSE 0 END) AS Khong_bi_sao,
    SUM(CASE WHEN Severity_1 = 'Thương nhẹ' THEN 1 ELSE 0 END) AS Thuong_nhe,
    SUM(CASE WHEN Severity_1 = 'Thương nặng' THEN 1 ELSE 0 END) AS Thuong_nang,
    SUM(CASE WHEN Severity_1 = 'Tử vong' THEN 1 ELSE 0 END) AS Tu_vong
  FROM hanoi_data_tngt_1517
  WHERE Severity_1 IS NOT NULL AND Rdtype IS NOT NULL`;


app.get('/api/data_road_severity', (req, res) => {
  const year = req.query.year;
  let query = query_road_severity;
 
  // Thêm điều kiện lọc năm nếu được chỉ định
  if (year && year !== 'all') {
    // Thêm điều kiện lọc năm vào WHERE
    query += ` AND YEAR(Date) = ${connection_db.escape(year)}`;
  }
 
  // Thêm GROUP BY vào cuối câu query
  query += ` GROUP BY Rdtype`;


  connection_db.query(query, (err, results) => {
    if (err) {
      console.error("Query error:", err);
      return res.status(500).json({ error: "Server error" });
    }
   
    // Trả về mảng rỗng thay vì lỗi nếu không có dữ liệu
    if (!results || results.length === 0) {
      return res.json([]);
    }
   
    res.json(results);
  });
});


// API endpoints by year with filtering
// This allows adding year parameter to any endpoint
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


















// Initialize and add the map
function initMap() {
    // The location of Uluru
    var uluru = {
      lat: -25.344,
      lng: 131.036
    };
    // The map, centered at Uluru
    var map = new google.maps.Map(
      document.getElementById('map'), {
        zoom: 4,
        center: uluru
      });
    // The marker, positioned at Uluru
    var marker = new google.maps.Marker({
      position: uluru,
      map: map
    });
  }


// Socket
var io= require("socket.io")(server);
io.on('connection', function(socket){
    console.log("co nguoi ket noi: " + socket.id)
    socket.on('disconected',function(){
        console.log(socket.id + " disconected");
    });
});


//server.listen(8000);
const port = 3306;
server.listen(port, () => {
  console.log(`Ứng dụng chạy tại http://localhost:${port}`);
});
