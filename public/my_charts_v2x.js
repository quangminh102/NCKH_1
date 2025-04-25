// Thêm trình nghe sự kiện cho năm
document.getElementById('yearSelector').addEventListener('change', function() {
  var selectedYear = this.value;
  updateCharts(selectedYear);
});


// Hàm cập nhật các biểu đồ
function updateCharts(year) {
  console.log("Cập nhật biểu đồ cho năm: " + year);


  
  // Render all cross-correlation charts
  renderGenderAgeChart(year);
  renderGenderSeverityChart(year);
  renderGenderVehChart(year);
  renderVehSeverityChart(year);
  renderAgeSeverityChart(year);
  renderRoadSeverityChart(year);
}

// Function to determine the base API URL
function getBaseApiUrl() {
  // Check if running locally or on a web server
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' ) {
    // Running locally
    return 'http://localhost:8000/api';  // Adjust port if your local server uses a different one
  } else {
    // Running on web server
    return 'https://nckh-1-c67b.onrender.com/api';
  }
}

// Update all API URLs with the correct base URL
function updateApiUrl(endpoint) {
  const baseUrl = getBaseApiUrl();
  return `${baseUrl}/${endpoint}`;
}



// Gender-Age correlation chart (100% stacked)
function renderGenderAgeChart(year) {
  // Xây dựng URL API với tham số năm
  let apiUrl = 'http://localhost:8000/api/data_gender_age_by_year';
  if (year && year !== 'all') {
    apiUrl += `?year=${year}`;
  }

  // Lấy dữ liệu từ API
  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Xóa biểu đồ cũ và thông báo lỗi nếu có
      const chartContainer = d3.select('#gender-age-chart');
      chartContainer.selectAll('*').remove();

      // Kiểm tra xem có dữ liệu hay không
      if (!data || data.length === 0) {
        chartContainer.append('p')
          .attr('class', 'error')
          .text('Không có dữ liệu cho năm được chọn');
        return;
      }

      // Chuyển đổi dữ liệu thành số
      const processedData = data.map(d => ({
        Year: d.Year,
        Gender_1: d.Gender_1,
        T_25: Number(d.T_25 || 0),
        T25_45: Number(d.T25_45 || 0),
        T45_55: Number(d.T45_55 || 0),
        T_55: Number(d.T_55 || 0)
      }));

      // Tổng hợp dữ liệu theo giới tính 
      const groupedData = d3.group(processedData, d => d.Gender_1);
      let chartData = Array.from(groupedData, ([gender, values]) => ({
        Gender_1: gender,
        T_25: d3.sum(values, d => d.T_25),
        T25_45: d3.sum(values, d => d.T25_45),
        T45_55: d3.sum(values, d => d.T45_55),
        T_55: d3.sum(values, d => d.T_55)
      }));

      // Đảm bảo luôn có cả "Nam" và "Nữ" trong dữ liệu
      const genders = chartData.map(d => d.Gender_1);
      if (!genders.includes("Nam")) {
        chartData.push({
          Gender_1: "Nam",
          T_25: 0,
          T25_45: 0,
          T45_55: 0,
          T_55: 0
        });
      }
      if (!genders.includes("Nữ")) {
        chartData.push({
          Gender_1: "Nữ",
          T_25: 0,
          T25_45: 0,
          T45_55: 0,
          T_55: 0
        });
      }

      // Chuyển đổi sang phần trăm
      const normalizedData = chartData.map(d => {
        const total = d.T_25 + d.T25_45 + d.T45_55 + d.T_55;
        
        // Nếu tổng = 0, trả về tất cả các giá trị đều là 0
        if (total === 0) {
          return {
            Gender_1: d.Gender_1,
            T_25: 0,
            T25_45: 0,
            T45_55: 0,
            T_55: 0,
            total: 0
          };
        }

        return {
          Gender_1: d.Gender_1,
          T_25: (d.T_25 / total) * 100,
          T25_45: (d.T25_45 / total) * 100,
          T45_55: (d.T45_55 / total) * 100,
          T_55: (d.T_55 / total) * 100,
          total: total // Lưu tổng số vụ để hiển thị trên tooltip
        };
      });

      // Thiết lập canvas
      const svg = chartContainer
        .append('svg')
        .attr('width', 700)
        .attr('height', 400);

      const margin = { top: 40, right: 150, bottom: 60, left: 70 };
      const width = +svg.attr("width") - margin.left - margin.right;
      const height = +svg.attr("height") - margin.top - margin.bottom;
      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Định nghĩa các khóa cho độ tuổi
      const keys = ['T_25', 'T25_45', 'T45_55', 'T_55'];
      const stack = d3.stack().keys(keys);
      const stackedData = stack(normalizedData);

      // Tạo thang đo
      const x = d3.scaleBand()
        .domain(["Nữ", "Nam"]) // Cố định thứ tự: "Nữ" trước, "Nam" sau
        .range([0, width])
        .padding(0.3);

      const y = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);

      // Màu sắc
      const color = d3.scaleOrdinal()
        .domain(keys)
        .range(['#6b486b', '#ff8c00', '#98abc5', '#F9CAC8']);

      // Trục X
      g.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("y", 10)
        .attr("x", 0)
        .attr("dy", ".35em")
        .attr("transform", "rotate(0)")
        .style("text-anchor", "middle")
        .style("font-size", "12px");

      // Nhãn trục X
      g.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Giới tính");

      // Trục Y
      g.append("g")
        .attr("class", "axis y-axis")
        .call(d3.axisLeft(y).tickFormat(d => d + "%"))
        .selectAll("text")
        .style("font-size", "12px");

      // Nhãn trục Y
      g.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Phần trăm (%)");

      // Thêm các thanh stacked
      g.append("g")
        .selectAll("g")
        .data(stackedData)
        .join("g")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .join("rect")
        .attr("x", d => x(d.data.Gender_1))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth())
        .on("mouseover", function(event, d) {
          // Hiển thị tooltip khi di chuột
          const ageGroup = getAgeLabel(d3.select(this.parentNode).datum().key);
          const percentage = (d[1] - d[0]).toFixed(1);
          
          d3.select(this)
            .attr("stroke", "#000")
            .attr("stroke-width", 1)
            .attr("opacity", 0.8);
          
          g.append("text")
            .attr("class", "tooltip")
            .attr("x", x(d.data.Gender_1) + x.bandwidth() / 2)
            .attr("y", y((d[0] + d[1]) / 2))
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .attr("fill", percentage > 20 ? "white" : "black")
            .text(`${percentage}%`);
        })
        .on("mouseout", function() {
          d3.select(this)
            .attr("stroke", "none")
            .attr("opacity", 1);
          
          g.selectAll(".tooltip").remove();
        });

      // Thêm tiêu đề
      g.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(year && year !== 'all' 
          ? `Phân bố TNGT theo giới tính và độ tuổi - Năm ${year} (%)` 
          : "Phân bố TNGT theo giới tính và độ tuổi (Tất cả các năm) (%)");

      // Thêm chú thích
      const legend = svg.append('g')
        .attr('transform', `translate(${width + margin.left + 20}, ${margin.top})`);

      keys.forEach((key, i) => {
        const legendItem = legend.append('g')
          .attr('transform', `translate(0, ${i * 25})`);
        
        legendItem.append('rect')
          .attr('width', 15)
          .attr('height', 15)
          .attr('fill', color(key));
        
        legendItem.append('text')
          .attr('x', 20)
          .attr('y', 12)
          .text(getAgeLabel(key))
          .style("font-size", "12px");
      });

      // Thêm thông tin tổng số vụ cho mỗi giới tính
      normalizedData.forEach(d => {
        if (d.total > 0) {
          g.append("text")
            .attr("class", "total-info")
            .attr("x", x(d.Gender_1) + x.bandwidth() / 2)
            .attr("y", height + 30)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", "#666")
            .text(`n = ${d.total}`);
        }
      });
    })
    .catch(error => {
      console.error("Lỗi khi lấy dữ liệu:", error);
      d3.select('#gender-age-chart')
        .selectAll('*').remove()
        .append('p')
        .attr('class', 'error')
        .text('Error loading chart data: ' + error.message);
    });
}

// Hàm trả về nhãn cho độ tuổi
function getAgeLabel(key) {
  switch (key) {
    case 'T_25': return 'Dưới 25 tuổi';
    case 'T25_45': return '25-44 tuổi';
    case 'T45_55': return '45-54 tuổi';
    case 'T_55': return '55 tuổi trở lên';
    default: return key;
  }
}

// Gender-Severity correlation chart (100% stacked)
function renderGenderSeverityChart(year) {
  // Xây dựng URL API với tham số năm
  let apiUrl = 'http://localhost:8000/api/data_gender_severity';
  if (year && year !== 'all') {
    apiUrl += `?year=${year}`;
  }

  // Lấy dữ liệu từ API
  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Xóa biểu đồ cũ và thông báo lỗi nếu có
      const chartContainer = d3.select('#gender-severity-chart');
      chartContainer.selectAll('*').remove();

      // Kiểm tra xem có dữ liệu hay không
      if (!data || data.length === 0) {
        chartContainer.append('p')
          .attr('class', 'error')
          .text('Không có dữ liệu cho năm được chọn');
        return;
      }

      // Tổng hợp dữ liệu nếu year = 'all'
      let chartData = data;
      if (year === 'all') {
        const groupedData = d3.group(data, d => d.Gender_1);
        chartData = Array.from(groupedData, ([gender, values]) => ({
          Gender_1: gender,
          Khong_bi_sao: d3.sum(values, d => Number(d.Khong_bi_sao || 0)),
          Thuong_nhe: d3.sum(values, d => Number(d.Thuong_nhe || 0)),
          Thuong_nang: d3.sum(values, d => Number(d.Thuong_nang || 0)),
          Tu_vong: d3.sum(values, d => Number(d.Tu_vong || 0))
        }));
      }

      // Chuyển đổi dữ liệu đảm bảo các giá trị số
      chartData = chartData.map(d => ({
        Gender_1: d.Gender_1,
        Khong_bi_sao: Number(d.Khong_bi_sao || 0),
        Thuong_nhe: Number(d.Thuong_nhe || 0),
        Thuong_nang: Number(d.Thuong_nang || 0),
        Tu_vong: Number(d.Tu_vong || 0)
      }));

      // Chuẩn hóa dữ liệu thành tỷ lệ phần trăm
      const normalizedData = chartData.map(d => {
        const total = d.Khong_bi_sao + d.Thuong_nhe + d.Thuong_nang + d.Tu_vong;
        // Nếu tổng = 0, trả về tất cả các giá trị đều là 0
        if (total === 0) {
          return {
            Gender_1: d.Gender_1,
            Khong_bi_sao: 0,
            Thuong_nhe: 0,
            Thuong_nang: 0,
            Tu_vong: 0
          };
        }
        return {
          Gender_1: d.Gender_1,
          Khong_bi_sao: (d.Khong_bi_sao / total) * 100,
          Thuong_nhe: (d.Thuong_nhe / total) * 100,
          Thuong_nang: (d.Thuong_nang / total) * 100,
          Tu_vong: (d.Tu_vong / total) * 100
        };
      });

      // Thiết lập canvas
      const svg = chartContainer
        .append('svg')
        .attr('width', 700)
        .attr('height', 400);

      const margin = { top: 40, right: 150, bottom: 60, left: 70 };
      const width = +svg.attr("width") - margin.left - margin.right;
      const height = +svg.attr("height") - margin.top - margin.bottom;
      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Định nghĩa các khóa cho mức độ nghiêm trọng
      const keys = ['Khong_bi_sao', 'Thuong_nhe', 'Thuong_nang', 'Tu_vong'];
      const stack = d3.stack().keys(keys);
      const stackedData = stack(normalizedData);

      // Tạo thang đo
      const x = d3.scaleBand()
        .domain(normalizedData.map(d => d.Gender_1))
        .range([0, width])
        .padding(0.3);

      const y = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);

      // Màu sắc
      const color = d3.scaleOrdinal()
        .domain(keys)
        .range(['#4ecdc4', '#ffdd94', '#ff6b6b', '#c44d58']);

      // Trục X
      g.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "12px");

      // Nhãn trục X
      g.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Giới tính");

      // Trục Y
      g.append("g")
        .attr("class", "axis y-axis")
        .call(d3.axisLeft(y).tickFormat(d => d + "%"))
        .selectAll("text")
        .style("font-size", "12px");

      // Nhãn trục Y
      g.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Phần trăm (%)");

      // Thêm các thanh堆叠
      g.append("g")
        .selectAll("g")
        .data(stackedData)
        .join("g")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .join("rect")
        .attr("x", d => x(d.data.Gender_1))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth())
        .on("mouseover", function(event, d) {
          const severity = getSeverityLabel(d3.select(this.parentNode).datum().key);
          const percentage = (d[1] - d[0]).toFixed(1);
          
          d3.select(this)
            .attr("stroke", "#000")
            .attr("stroke-width", 1)
            .attr("opacity", 0.8);
          
          g.append("text")
            .attr("class", "tooltip")
            .attr("x", x(d.data.Gender_1) + x.bandwidth() / 2)
            .attr("y", y((d[0] + d[1]) / 2))
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .attr("fill", "white")
            .text(`${percentage}%`);
        })
        .on("mouseout", function() {
          d3.select(this)
            .attr("stroke", "none")
            .attr("opacity", 1);
          
          g.selectAll(".tooltip").remove();
        });

      // Thêm tiêu đề
      g.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(year && year !== 'all' 
          ? `Phân bố mức độ nghiêm trọng TNGT theo giới tính - Năm ${year} (%)` 
          : "Phân bố mức độ nghiêm trọng TNGT theo giới tính (Tất cả các năm) (%)");

      // Thêm chú thích
      const legend = svg.append('g')
        .attr('transform', `translate(${width + margin.left + 20}, ${margin.top})`);
      
      keys.forEach((key, i) => {
        const legendItem = legend.append('g')
          .attr('transform', `translate(0, ${i * 25})`);
        
        legendItem.append('rect')
          .attr('width', 15)
          .attr('height', 15)
          .attr('fill', color(key));
        
        legendItem.append('text')
          .attr('x', 20)
          .attr('y', 12)
          .text(getSeverityLabel(key))
          .style("font-size", "12px");
      });
    })
    .catch(error => {
      console.error("Lỗi khi lấy dữ liệu:", error);
      d3.select('#gender-severity-chart')
        .selectAll('*').remove()
        .append('p')
        .attr('class', 'error')
        .text('Error loading chart data: ' + error.message);
    });
}

// Hàm trả về nhãn cho mức độ nghiêm trọng
function getSeverityLabel(key) {
  switch (key) {
    case 'Khong_bi_sao': return 'Không bị sao';
    case 'Thuong_nhe': return 'Thương nhẹ';
    case 'Thuong_nang': return 'Thương nặng';
    case 'Tu_vong': return 'Tử vong';
    default: return key;
  }
}

// Gender-Vehicle correlation chart (100% stacked)
function renderGenderVehChart(year) {
  // Xây dựng URL API với tham số năm
  let apiUrl = 'http://localhost:8000/api/data_gender_veh';
  if (year && year !== 'all') {
    apiUrl += `?year=${year}`;
  }

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Xóa biểu đồ cũ và thông báo lỗi nếu có
      const chartContainer = d3.select('#gender-veh-chart');
      chartContainer.selectAll('*').remove();

      // Kiểm tra xem có dữ liệu hay không
      if (!data || data.length === 0) {
        chartContainer.append('p')
          .attr('class', 'error')
          .text('Không có dữ liệu cho năm được chọn');
        return;
      }

      // Chuyển đổi tất cả các giá trị thành số
      const processedData = data.map(d => ({
        Gender_1: d.Gender_1,
        Bo_hanh: Number(d.Bo_hanh || 0),
        Xe_dap: Number(d.Xe_dap || 0),
        Xe_mo_to: Number(d.Xe_mo_to || 0),
        O_to_con: Number(d.O_to_con || 0),
        Xe_buyt: Number(d.Xe_buyt || 0),
        Xe_tai: Number(d.Xe_tai || 0),
        Xe_khac: Number(d.Xe_khac || 0)
      }));

      // Calculate percentage for each vehicle by gender
      const normalizedData = processedData.map(d => {
        const total = d.Bo_hanh + d.Xe_dap + d.Xe_mo_to + 
                     d.O_to_con + d.Xe_buyt + d.Xe_tai + d.Xe_khac;
        
        // Nếu tổng = 0, trả về tất cả các giá trị đều là 0
        if (total === 0) {
          return {
            Gender_1: d.Gender_1,
            Bo_hanh: 0,
            Xe_dap: 0,
            Xe_mo_to: 0,
            O_to_con: 0,
            Xe_buyt: 0,
            Xe_tai: 0,
            Xe_khac: 0
          };
        }

        return {
          Gender_1: d.Gender_1,
          Bo_hanh: (d.Bo_hanh / total) * 100,
          Xe_dap: (d.Xe_dap / total) * 100,
          Xe_mo_to: (d.Xe_mo_to / total) * 100,
          O_to_con: (d.O_to_con / total) * 100,
          Xe_buyt: (d.Xe_buyt / total) * 100,
          Xe_tai: (d.Xe_tai / total) * 100,
          Xe_khac: (d.Xe_khac / total) * 100
        };
      });
      
      // Setup canvas
      const svg = chartContainer
        .append('svg')
        .attr('width', 700)
        .attr('height', 400);
      
      const margin = { top: 40, right: 200, bottom: 60, left: 70 };
      const width = +svg.attr("width") - margin.left - margin.right;
      const height = +svg.attr("height") - margin.top - margin.bottom;
      
      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
      
      // Define keys for vehicle types
      const keys = ['Bo_hanh', 'Xe_dap', 'Xe_mo_to', 'O_to_con', 'Xe_buyt', 'Xe_tai', 'Xe_khac'];
      const stack = d3.stack().keys(keys);
      const stackedData = stack(normalizedData);
      
      // Create scales
      const x = d3.scaleBand()
        .domain(normalizedData.map(d => d.Gender_1))
        .range([0, width])
        .padding(0.3);
      
      const y = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);
      
      // Color scale
      const color = d3.scaleOrdinal()
        .domain(keys)
        .range(d3.schemeCategory10);
      
      // X axis
      g.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "12px");
      
      // X axis label
      g.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Giới tính");
      
      // Y axis
      g.append("g")
        .attr("class", "axis y-axis")
        .call(d3.axisLeft(y).tickFormat(d => d + "%"))
        .selectAll("text")
        .style("font-size", "12px");
      
      // Y axis label
      g.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Phần trăm (%)");
      
      // Add stacked bars
      g.append("g")
        .selectAll("g")
        .data(stackedData)
        .join("g")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .join("rect")
        .attr("x", d => x(d.data.Gender_1))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth())
        .on("mouseover", function(event, d) {
          const vehicle = getVehicleLabel(d3.select(this.parentNode).datum().key);
          const percentage = (d[1] - d[0]).toFixed(1);
          
          d3.select(this)
            .attr("stroke", "#000")
            .attr("stroke-width", 1)
            .attr("opacity", 0.8);
          
          g.append("text")
            .attr("class", "tooltip")
            .attr("x", x(d.data.Gender_1) + x.bandwidth() / 2)
            .attr("y", y((d[0] + d[1]) / 2))
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .attr("fill", "white")
            .text(`${percentage}%`);
        })
        .on("mouseout", function() {
          d3.select(this)
            .attr("stroke", "none")
            .attr("opacity", 1);
          
          g.selectAll(".tooltip").remove();
        });
      
      // Add title
      g.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(year && year !== 'all' 
          ? `Phân bố phương tiện TNGT theo giới tính - Năm ${year} (%)` 
          : "Phân bố phương tiện TNGT theo giới tính (Tất cả các năm) (%)");
      
      // Add legend
      const legend = svg.append('g')
        .attr('transform', `translate(${width + margin.left + 20}, ${margin.top})`);
      
      keys.forEach((key, i) => {
        const legendItem = legend.append('g')
          .attr('transform', `translate(0, ${i * 25})`);
        
        legendItem.append('rect')
          .attr('width', 15)
          .attr('height', 15)
          .attr('fill', color(key));
        
        legendItem.append('text')
          .attr('x', 20)
          .attr('y', 12)
          .text(getVehicleLabel(key))
          .style("font-size", "12px");
      });
    })
    .catch(error => {
      console.error("Error fetching data:", error);
      d3.select('#gender-veh-chart')
        .selectAll('*').remove()
        .append('p')
        .attr('class', 'error')
        .text('Error loading chart data: ' + error.message);
    });
}

// Helper function to get vehicle labels
function getVehicleLabel(key) {
  switch (key) {
    case 'Bo_hanh': return 'Bộ hành';
    case 'Xe_dap': return 'Xe đạp';
    case 'Xe_mo_to': return 'Xe mô tô';
    case 'O_to_con': return 'Ô tô con';
    case 'Xe_buyt': return 'Xe buýt, xe khách';
    case 'Xe_tai': return 'Xe tải';
    case 'Xe_khac': return 'Xe khác, chưa rõ';
    default: return key;
  }
}




// Vehicle-Severity correlation chart (horizontal 100% stacked)
function renderVehSeverityChart(year) {
  // Xây dựng URL API với tham số năm
  let apiUrl = 'http://localhost:8000/api/data_veh_severity';
  if (year && year !== 'all') {
    apiUrl += `?year=${year}`;
  }

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Xóa biểu đồ cũ và thông báo lỗi nếu có
      const chartContainer = d3.select('#veh-severity-chart');
      chartContainer.selectAll('*').remove();

      // Kiểm tra xem có dữ liệu hay không
      if (!data || data.length === 0) {
        chartContainer.append('p')
          .attr('class', 'error')
          .text('Không có dữ liệu cho năm được chọn');
        return;
      }

      // Chuyển đổi tất cả các giá trị thành số
      const processedData = data.map(d => ({
        Veh_1: d.Veh_1,
        Khong_bi_sao: Number(d.Khong_bi_sao || 0),
        Thuong_nhe: Number(d.Thuong_nhe || 0),
        Thuong_nang: Number(d.Thuong_nang || 0),
        Tu_vong: Number(d.Tu_vong || 0)
      }));

      // Calculate percentage for each severity by vehicle type
      const normalizedData = processedData.map(d => {
        const total = d.Khong_bi_sao + d.Thuong_nhe + d.Thuong_nang + d.Tu_vong;
        
        // Nếu tổng = 0, trả về tất cả các giá trị đều là 0
        if (total === 0) {
          return {
            Veh_1: d.Veh_1,
            Khong_bi_sao: 0,
            Thuong_nhe: 0,
            Thuong_nang: 0,
            Tu_vong: 0
          };
        }

        return {
          Veh_1: d.Veh_1,
          Khong_bi_sao: (d.Khong_bi_sao / total) * 100,
          Thuong_nhe: (d.Thuong_nhe / total) * 100,
          Thuong_nang: (d.Thuong_nang / total) * 100,
          Tu_vong: (d.Tu_vong / total) * 100
        };
      });
      
      // Setup canvas
      const svg = chartContainer
        .append('svg')
        .attr('width', 700)
        .attr('height', 500);
      
      const margin = { top: 40, right: 150, bottom: 60, left: 150 };
      const width = +svg.attr("width") - margin.left - margin.right;
      const height = +svg.attr("height") - margin.top - margin.bottom;
      
      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
      
      // Define keys for severity levels
      const keys = ['Khong_bi_sao', 'Thuong_nhe', 'Thuong_nang', 'Tu_vong'];
      const stack = d3.stack().keys(keys);
      const stackedData = stack(normalizedData);
      
      // Create scales
      const y = d3.scaleBand()
        .domain(normalizedData.map(d => d.Veh_1))
        .range([0, height])
        .padding(0.2);
      
      const x = d3.scaleLinear()
        .domain([0, 100])
        .range([0, width]);
      
      // Color scale
      const color = d3.scaleOrdinal()
        .domain(keys)
        .range(['#4ecdc4', '#ffdd94', '#ff6b6b', '#c44d58']);
      
      // Y axis
      g.append("g")
        .attr("class", "axis y-axis")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", "12px");
      
      // X axis
      g.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d => d + "%"))
        .selectAll("text")
        .style("font-size", "12px");
      
      // X axis label
      g.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Phần trăm (%)");
      
      // Add stacked bars (horizontal)
      g.append("g")
        .selectAll("g")
        .data(stackedData)
        .join("g")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .join("rect")
        .attr("y", d => y(d.data.Veh_1))
        .attr("x", d => x(d[0]))
        .attr("width", d => x(d[1]) - x(d[0]))
        .attr("height", y.bandwidth())
        .on("mouseover", function(event, d) {
          // Add tooltip on hover
          const severity = getSeverityLabel(d3.select(this.parentNode).datum().key);
          const percentage = (d[1] - d[0]).toFixed(1);
          
          d3.select(this)
            .attr("stroke", "#000")
            .attr("stroke-width", 1)
            .attr("opacity", 0.8);
          
          g.append("text")
            .attr("class", "tooltip")
            .attr("x", x((d[0] + d[1]) / 2))
            .attr("y", y(d.data.Veh_1) + y.bandwidth() / 2)
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .attr("fill", percentage > 20 ? "white" : "black")
            .text(`${percentage}%`);
        })
        .on("mouseout", function() {
          d3.select(this)
            .attr("stroke", "none")
            .attr("opacity", 1);
          
          g.selectAll(".tooltip").remove();
        });
      
      // Add title
      g.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(year && year !== 'all' 
          ? `Phân bố mức độ nghiêm trọng TNGT theo loại phương tiện - Năm ${year} (%)` 
          : "Phân bố mức độ nghiêm trọng TNGT theo loại phương tiện (Tất cả các năm) (%)");
      
      // Add legend
      const legend = svg.append('g')
        .attr('transform', `translate(${width + margin.left + 20}, ${margin.top})`);
      
      keys.forEach((key, i) => {
        const legendItem = legend.append('g')
          .attr('transform', `translate(0, ${i * 25})`);
        
        legendItem.append('rect')
          .attr('width', 15)
          .attr('height', 15)
          .attr('fill', color(key));
        
        legendItem.append('text')
          .attr('x', 20)
          .attr('y', 12)
          .text(getSeverityLabel(key))
          .style("font-size", "12px");
      });
    })
    .catch(error => {
      console.error("Error fetching data:", error);
      d3.select('#veh-severity-chart')
        .selectAll('*').remove()
        .append('p')
        .attr('class', 'error')
        .text('Error loading chart data: ' + error.message);
    });
}

// Hàm trả về nhãn cho mức độ nghiêm trọng
function getSeverityLabel(key) {
  switch (key) {
    case 'Khong_bi_sao': return 'Không bị sao';
    case 'Thuong_nhe': return 'Thương nhẹ';
    case 'Thuong_nang': return 'Thương nặng';
    case 'Tu_vong': return 'Tử vong';
    default: return key;
  }
}

// Age-Severity correlation chart (horizontal 100% stacked)
function renderAgeSeverityChart(year) {
  // Xây dựng URL API với tham số năm
  let apiUrl = 'http://localhost:8000/api/data_age_severity';
  if (year && year !== 'all') {
    apiUrl += `?year=${year}`;
  }

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Xóa biểu đồ cũ và thông báo lỗi nếu có
      const chartContainer = d3.select('#age-severity-chart');
      chartContainer.selectAll('*').remove();

      // Kiểm tra xem có dữ liệu hay không
      if (!data || data.length === 0) {
        chartContainer.append('p')
          .attr('class', 'error')
          .text('Không có dữ liệu cho năm được chọn');
        return;
      }

      // Chuyển đổi tất cả các giá trị thành số
      const processedData = data.map(d => ({
        Severity_1: d.Severity_1,
        T_25: Number(d.T_25 || 0),
        T25_45: Number(d.T25_45 || 0),
        T45_55: Number(d.T45_55 || 0),
        T_55: Number(d.T_55 || 0)
      }));

      // Restructure data to get percentages by age group rather than by severity
      // This requires transforming the data matrix
      const severityTypes = processedData.map(d => d.Severity_1);
      const ageGroups = ['T_25', 'T25_45', 'T45_55', 'T_55'];
      
      // Create a new array of age groups with severity percentages
      const restructuredData = ageGroups.map(age => {
        // Calculate total for this age group across all severities
        let total = 0;
        processedData.forEach(d => {
          total += d[age];
        });
        
        // Create object with severity percentages
        const obj = { age_name: age };
        
        // Nếu tổng = 0, tất cả các giá trị là 0
        if (total === 0) {
          severityTypes.forEach(severity => {
            obj[severity.replace(/\s+/g, '_')] = 0;
          });
        } else {
          processedData.forEach(d => {
            obj[d.Severity_1.replace(/\s+/g, '_')] = (d[age] / total) * 100;
          });
        }
        
        return obj;
      });
      
      // Setup canvas
      const svg = chartContainer
        .append('svg')
        .attr('width', 700)
        .attr('height', 500);
      
      const margin = { top: 40, right: 150, bottom: 60, left: 100 };
      const width = +svg.attr("width") - margin.left - margin.right;
      const height = +svg.attr("height") - margin.top - margin.bottom;
      
      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
      
      // Define keys for severity levels (normalized to match the restructured data keys)
      const keys = severityTypes.map(k => k.replace(/\s+/g, '_'));
      const stack = d3.stack().keys(keys);
      const stackedData = stack(restructuredData);
      
      // Create scales
      const y = d3.scaleBand()
        .domain(restructuredData.map(d => d.age_name))
        .range([0, height])
        .padding(0.2);
      
      const x = d3.scaleLinear()
        .domain([0, 100])
        .range([0, width]);
      
      // Color scale - use consistent colors with other charts
      const color = d3.scaleOrdinal()
        .domain(keys)
        .range(['#4ecdc4', '#c44d58', '#ffdd94', '#ff6b6b']);
        
      
      // Y axis
      g.append("g")
        .attr("class", "axis y-axis")
        .call(d3.axisLeft(y).tickFormat(d => getAgeLabel(d)))
        .selectAll("text")
        .style("font-size", "12px");
      
      // X axis
      g.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d => d + "%"))
        .selectAll("text")
        .style("font-size", "12px");
      
      // X axis label
      g.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Phần trăm (%)");
      
      // Add stacked bars (horizontal)
      g.append("g")
        .selectAll("g")
        .data(stackedData)
        .join("g")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .join("rect")
        .attr("y", d => y(d.data.age_name))
        .attr("x", d => x(d[0]))
        .attr("width", d => x(d[1]) - x(d[0]))
        .attr("height", y.bandwidth())
        .on("mouseover", function(event, d) {
          // Add tooltip on hover
          const severity = getSeverityLabel(d3.select(this.parentNode).datum().key.replace(/_/g, ' '));
          const percentage = (d[1] - d[0]).toFixed(1);
          
          d3.select(this)
            .attr("stroke", "#000")
            .attr("stroke-width", 1)
            .attr("opacity", 0.8);
          
          g.append("text")
            .attr("class", "tooltip")
            .attr("x", x((d[0] + d[1]) / 2))
            .attr("y", y(d.data.age_name) + y.bandwidth() / 2)
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .attr("fill", percentage > 20 ? "white" : "black")
            .text(`${percentage}%`);
        })
        .on("mouseout", function() {
          d3.select(this)
            .attr("stroke", "none")
            .attr("opacity", 1);
          
          g.selectAll(".tooltip").remove();
        });
      
      // Add title
      g.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(year && year !== 'all' 
          ? `Phân bố mức độ nghiêm trọng TNGT theo độ tuổi - Năm ${year} (%)` 
          : "Phân bố mức độ nghiêm trọng TNGT theo độ tuổi (Tất cả các năm) (%)");
      
      // Add legend
      const legend = svg.append('g')
        .attr('transform', `translate(${width + margin.left + 20}, ${margin.top})`);
      
      keys.forEach((key, i) => {
        const legendItem = legend.append('g')
          .attr('transform', `translate(0, ${i * 25})`);
        
        legendItem.append('rect')
          .attr('width', 15)
          .attr('height', 15)
          .attr('fill', color(key));
        
        legendItem.append('text')
          .attr('x', 20)
          .attr('y', 12)
          .text(getSeverityLabel(key.replace(/_/g, ' ')))
          .style("font-size", "12px");
      });
    })
    .catch(error => {
      console.error("Error fetching data:", error);
      d3.select('#age-severity-chart')
        .selectAll('*').remove()
        .append('p')
        .attr('class', 'error')
        .text('Error loading chart data: ' + error.message);
    });
}

// Hàm trả về nhãn cho nhóm tuổi
function getAgeLabel(key) {
  switch (key) {
    case 'T_25': return 'Dưới 25 tuổi';
    case 'T25_45': return '25-44 tuổi';
    case 'T45_55': return '45-54 tuổi';
    case 'T_55': return '55 tuổi trở lên';
    default: return key;
  }
}

// Hàm trả về nhãn cho mức độ nghiêm trọng
function getSeverityLabel(key) {
  switch (key) {
    case 'Không_bị_sao':
    case 'Không bị sao': return 'Không bị sao';
    case 'Thương_nhẹ':
    case 'Thương nhẹ': return 'Thương nhẹ';
    case 'Thương_nặng':
    case 'Thương nặng': return 'Thương nặng';
    case 'Tử_vong':
    case 'Tử vong': return 'Tử vong';
    default: return key;
  }
}




// Road-Severity correlation chart (horizontal 100% stacked)
function renderRoadSeverityChart(year) {
  // Xây dựng URL API với tham số năm
  let apiUrl = 'http://localhost:8000/api/data_road_severity';
  if (year && year !== 'all') {
    apiUrl += `?year=${year}`;
  }

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Xóa biểu đồ cũ và thông báo lỗi nếu có
      const chartContainer = d3.select('#road-severity-chart');
      chartContainer.selectAll('*').remove();

      // Kiểm tra xem có dữ liệu hay không
      if (!data || data.length === 0) {
        chartContainer.append('p')
          .attr('class', 'error')
          .text('Không có dữ liệu cho năm được chọn');
        return;
      }

      // Chuyển đổi tất cả các giá trị thành số
      const processedData = data.map(d => ({
        Rdtype: d.Rdtype,
        Khong_bi_sao: Number(d.Khong_bi_sao || 0),
        Thuong_nhe: Number(d.Thuong_nhe || 0),
        Thuong_nang: Number(d.Thuong_nang || 0),
        Tu_vong: Number(d.Tu_vong || 0)
      }));

      // Calculate percentage for each severity by road type
      const normalizedData = processedData.map(d => {
        const total = d.Khong_bi_sao + d.Thuong_nhe + d.Thuong_nang + d.Tu_vong;
        
        // Nếu tổng = 0, trả về tất cả các giá trị đều là 0
        if (total === 0) {
          return {
            Rdtype: d.Rdtype,
            Khong_bi_sao: 0,
            Thuong_nhe: 0,
            Thuong_nang: 0,
            Tu_vong: 0
          };
        }

        return {
          Rdtype: d.Rdtype,
          Khong_bi_sao: (d.Khong_bi_sao / total) * 100,
          Thuong_nhe: (d.Thuong_nhe / total) * 100,
          Thuong_nang: (d.Thuong_nang / total) * 100,
          Tu_vong: (d.Tu_vong / total) * 100
        };
      });
      
      // Setup canvas
      const svg = chartContainer
        .append('svg')
        .attr('width', 700)
        .attr('height', 500);
      
      const margin = { top: 40, right: 150, bottom: 60, left: 150 };
      const width = +svg.attr("width") - margin.left - margin.right;
      const height = +svg.attr("height") - margin.top - margin.bottom;
      
      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
      
      // Define keys for severity levels
      const keys = ['Khong_bi_sao', 'Thuong_nhe', 'Thuong_nang', 'Tu_vong'];
      const stack = d3.stack().keys(keys);
      const stackedData = stack(normalizedData);
      
      // Create scales
      const y = d3.scaleBand()
        .domain(normalizedData.map(d => d.Rdtype))
        .range([0, height])
        .padding(0.2);
      
      const x = d3.scaleLinear()
        .domain([0, 100])
        .range([0, width]);
      
      // Color scale
      const color = d3.scaleOrdinal()
        .domain(keys)
        .range(['#4ecdc4', '#ffdd94', '#ff6b6b', '#c44d58']);
      
      // Y axis
      g.append("g")
        .attr("class", "axis y-axis")
        .call(d3.axisLeft(y).tickFormat(d => getRoadTypeLabel(d)))
        .selectAll("text")
        .style("font-size", "12px");
      
      // X axis
      g.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d => d + "%"))
        .selectAll("text")
        .style("font-size", "12px");
      
      // X axis label
      g.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Phần trăm (%)");
      
      // Add stacked bars (horizontal)
      g.append("g")
        .selectAll("g")
        .data(stackedData)
        .join("g")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .join("rect")
        .attr("y", d => y(d.data.Rdtype))
        .attr("x", d => x(d[0]))
        .attr("width", d => x(d[1]) - x(d[0]))
        .attr("height", y.bandwidth())
        .on("mouseover", function(event, d) {
          // Add tooltip on hover
          const severity = getSeverityLabel(d3.select(this.parentNode).datum().key);
          const percentage = (d[1] - d[0]).toFixed(1);
          
          d3.select(this)
            .attr("stroke", "#000")
            .attr("stroke-width", 1)
            .attr("opacity", 0.8);
          
          g.append("text")
            .attr("class", "tooltip")
            .attr("x", x((d[0] + d[1]) / 2))
            .attr("y", y(d.data.Rdtype) + y.bandwidth() / 2)
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .attr("fill", percentage > 20 ? "white" : "black")
            .text(`${percentage}%`);
        })
        .on("mouseout", function() {
          d3.select(this)
            .attr("stroke", "none")
            .attr("opacity", 1);
          
          g.selectAll(".tooltip").remove();
        });
      
      // Add title
      g.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(year && year !== 'all' 
          ? `Phân bố mức độ nghiêm trọng TNGT theo loại đường - Năm ${year} (%)` 
          : "Phân bố mức độ nghiêm trọng TNGT theo loại đường (Tất cả các năm) (%)");
      
      // Add legend
      const legend = svg.append('g')
        .attr('transform', `translate(${width + margin.left + 20}, ${margin.top})`);
      
      keys.forEach((key, i) => {
        const legendItem = legend.append('g')
          .attr('transform', `translate(0, ${i * 25})`);
        
        legendItem.append('rect')
          .attr('width', 15)
          .attr('height', 15)
          .attr('fill', color(key));
        
        legendItem.append('text')
          .attr('x', 20)
          .attr('y', 12)
          .text(getSeverityLabel(key))
          .style("font-size", "12px");
      });
    })
    .catch(error => {
      console.error("Error fetching data:", error);
      d3.select('#road-severity-chart')
        .selectAll('*').remove()
        .append('p')
        .attr('class', 'error')
        .text('Error loading chart data: ' + error.message);
    });
}

// Hàm trả về nhãn cho loại đường
function getRoadTypeLabel(rdtype) {
  switch (rdtype) {
    case 'Quốc lộ': return 'Quốc lộ';
    case 'Tỉnh lộ': return 'Tỉnh lộ';
    case 'Huyện lộ': return 'Huyện lộ';
    case 'Đường đô thị': return 'Đường đô thị';
    case 'Đường giao thông nông thôn': return 'Đường giao thông nông thôn';
    case 'Đường chuyên dùng': return 'Đường chuyên dùng';
    default: return rdtype;
  }
}

// Hàm trả về nhãn cho mức độ nghiêm trọng
function getSeverityLabel(key) {
  switch (key) {
    case 'Khong_bi_sao': return 'Không bị sao';
    case 'Thuong_nhe': return 'Thương nhẹ';
    case 'Thuong_nang': return 'Thương nặng';
    case 'Tu_vong': return 'Tử vong';
    default: return key;
  }
}

// Initialize charts on page load
window.onload = function() {
  // Default to showing data for all years
  const defaultYear = 'all';
  document.getElementById('yearSelector').value = defaultYear;
  updateCharts(defaultYear);
  updateCrossCorrelationCharts(defaultYear);
};
