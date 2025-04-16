const connection = require('./connection');

// Lấy dữ liệu cho một bảng cụ thể
function fetchChartData(callback) {
  const query_month = 'SELECT MONTH(Date) AS Months, COUNT(*) AS Accidents FROM Hanoi_data_TNGT_2022 GROUP BY MONTH(Date)';
  connection.query(query_month, (err, results) => {
    if (err) {
      console.error(`Lỗi truy vấn dữ liệu`, err);
      callback(err, null);
      return;
    }
    callback(null, results);
  });
}

module.exports = {
  fetchChartData
};