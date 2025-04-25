// Thêm trình nghe sự kiện cho năm
document.getElementById('yearSelector').addEventListener('change', function() {
  var selectedYear = this.value;
  updateCharts(selectedYear);
});


// Hàm cập nhật các biểu đồ
function updateCharts(year) {
  console.log("Cập nhật biểu đồ cho năm: " + year);


  // Cập nhật dữ liệu cho mỗi biểu đồ
  renderMonthChart(year);
  renderWeekChart(year);
  renderHourChart(year);
  renderVehChart_Pie(year);
  renderGenderChart_Pie(year);
  renderAgeChart_Pie(year);
  renderSeverityChart_Pie(year);
  renderCauseChart_Pie(year);
  renderRoadChart_Pie(year);
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
    return 'https://nckhsv-2025.onrender.com/api';
  }
}

// Update all API URLs with the correct base URL
function updateApiUrl(endpoint) {
  const baseUrl = getBaseApiUrl();
  return `${baseUrl}/${endpoint}`;
}


// Hàm vẽ biểu đồ tháng
function renderMonthChart(year) {
  // Xây dựng URL API
 let apiUrl = updateApiUrl('data_month_by_year');


  // Lấy dữ liệu từ API
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      // Chuyển đổi dữ liệu object lồng thành mảng
      let formattedData = [];
      for (const [yearKey, months] of Object.entries(data)) {
        for (const [monthKey, accidents] of Object.entries(months)) {
          formattedData.push({
            Year: parseInt(yearKey),
            Month: parseInt(monthKey),
            Accidents: accidents
          });
        }
      }


      // Lọc theo năm nếu không chọn 'all'
      if (year !== 'all') {
        formattedData = formattedData.filter(d => d.Year === parseInt(year));
      }


      // Nhóm và tính tổng nếu chọn 'all'
      if (year === 'all') {
        const temp = {};
        formattedData.forEach(d => {
          const key = d.Month;
          if (!temp[key]) temp[key] = 0;
          temp[key] += d.Accidents;
        });
        formattedData = Object.entries(temp).map(([Month, Accidents]) => ({
          Month: parseInt(Month),
          Accidents
        }));
      }


      // Sắp xếp theo tháng
      formattedData.sort((a, b) => a.Month - b.Month);


      // Xóa biểu đồ cũ trước khi vẽ mới
      d3.select('#month-chart').selectAll('svg').remove();


      // Thiết lập canvas
      const svg = d3.select('#month-chart')
        .append('svg')
        .attr('width', 600)
        .attr('height', 300);


      const margin = { top: 20, right: 30, bottom: 20, left: 50 };
      const width = +svg.attr("width") - margin.left - margin.right;
      const height = +svg.attr("height") - margin.top - margin.bottom;
      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);


      // Lấy giá trị cho trục X và Y
      const xValues = formattedData.map(d => d.Month.toString()); // Chuyển tháng thành chuỗi
      const yValues = formattedData.map(d => d.Accidents);


      // Thang đo (scales)
      const x = d3.scaleBand()
        .domain(xValues)
        .range([0, width])
        .padding(0.1);


      const y = d3.scaleLinear()
        .domain([0, d3.max(yValues)])
        .nice()
        .range([height, 0]);


      // Trục X và Y
      g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d => `Tháng ${d}`)); // Định dạng nhãn trục X


      g.append("g")
        .call(d3.axisLeft(y));


      // Thêm tiêu đề
      //g.append("text")
      //  .attr("x", width / 2)
      //  .attr("y", -margin.top / 2)
      //  .attr("text-anchor", "middle")
      //  .style("font-size", "16px")
      //  .style("font-weight", "bold")
      //  .text(year !== "all"
      //    ? `Phân bố TNGT theo tháng - Năm ${year}`
      //    : "Phân bố TNGT theo tháng (Tất cả năm)");


      // Vẽ cột
      g.selectAll(".bar")
        .data(formattedData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.Month.toString()))
        .attr("y", d => y(d.Accidents))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.Accidents))
        .attr("fill", "#7B68EE");
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
}


// Hàm vẽ biểu đồ ngày trong tuần
function renderWeekChart(year) {
  // Xây dựng URL API
  let apiUrl = updateApiUrl('data_week_by_year');


  // Lấy dữ liệu từ API
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      // Xử lý dữ liệu
      const weekOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
     
      // Lọc dữ liệu theo năm nếu cần
      let filteredData = year === 'all'
        ? aggregateWeeklyData(data) // Hàm tổng hợp dữ liệu cho tất cả năm
        : data.filter(d => d.Year == year);


      // Sắp xếp theo thứ tự ngày trong tuần
      filteredData.sort((a, b) =>
        weekOrder.indexOf(a.day_name) - weekOrder.indexOf(b.day_name)
      );


      // Xóa biểu đồ cũ
      d3.select('#week-chart').selectAll('svg').remove();


      // Thiết lập canvas
      const svg = d3.select('#week-chart')
        .append('svg')
        .attr('width', 600)
        .attr('height', 300);


      const margin = { top: 20, right: 30, bottom: 40, left: 50 };
      const width = 500 - margin.left - margin.right;
      const height = 300 - margin.top - margin.bottom;
     
      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);


      // Thang đo
      const x = d3.scaleBand()
        .domain(filteredData.map(d => d.day_name))
        .range([0, width])
        .padding(0.1);


      const y = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.Accidents)])
        .nice()
        .range([height, 0]);


      // Vẽ trục
      g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x));


      g.append('g')
        .call(d3.axisLeft(y));


      // Vẽ cột
      g.selectAll('.bar')
        .data(filteredData)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.day_name))
        .attr('y', d => y(d.Accidents))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.Accidents))
        .attr('fill', '#7B68EE');


      // Thêm tiêu đề
      //g.append('text')
      //  .attr('x', width/2)
      // .attr('y', -10)
      //  .attr('text-anchor', 'middle')
      //  .style('font-size', '16px')
      //  .style('font-weight', 'bold')
      //  .text(`Phân bố TNGT theo ngày trong tuần${year !== 'all' ? ` - Năm ${year}` : ''}`);
    })
    .catch(error => {
      console.error('Lỗi khi lấy dữ liệu:', error);
    });
}


// Hàm tổng hợp dữ liệu cho tất cả năm
function aggregateWeeklyData(data) {
  const aggregated = {};
 
  data.forEach(item => {
    if (!aggregated[item.day_name]) {
      aggregated[item.day_name] = 0;
    }
    aggregated[item.day_name] += item.Accidents;
  });


  return Object.entries(aggregated).map(([day_name, Accidents]) => ({
    day_name,
    Accidents
  }));
}


// Hàm vẽ biểu đồ khung giờ
function renderHourChart(year) {
  // Xây dựng URL API
  let apiUrl = updateApiUrl('data_hour_by_year');

  // Lấy dữ liệu từ API
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      // Xử lý dữ liệu
      const hourOrder = ['0h00-5h59', '6h00-11h59', '12h00-17h59', '18h00-23h59'];
     
      // Lọc và tổng hợp dữ liệu
      let filteredData = year === 'all'
        ? aggregateHourlyData(data) // Hàm tổng hợp cho tất cả năm
        : data.filter(d => d.Year == year);


      // Sắp xếp theo thứ tự khung giờ
      filteredData.sort((a, b) =>
        hourOrder.indexOf(a.hour_name) - hourOrder.indexOf(b.hour_name)
      );


      // Xóa biểu đồ cũ
      d3.select('#hour-chart').selectAll('svg').remove();


      // Thiết lập canvas
      const svg = d3.select('#hour-chart')
        .append('svg')
        .attr('width', 500)
        .attr('height', 300);


      const margin = { top: 20, right: 30, bottom: 40, left: 50 };
      const width = 500 - margin.left - margin.right;
      const height = 300 - margin.top - margin.bottom;
     
      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);


      // Thang đo
      const x = d3.scaleBand()
        .domain(filteredData.map(d => d.hour_name))
        .range([0, width])
        .padding(0.1);


      const y = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.Accidents)])
        .nice()
        .range([height, 0]);


      // Vẽ trục
      g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x));


      g.append('g')
        .call(d3.axisLeft(y));


      // Vẽ cột
      g.selectAll('.bar')
        .data(filteredData)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.hour_name))
        .attr('y', d => y(d.Accidents))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.Accidents))
        .attr('fill', '#7B68EE');


      // Thêm tiêu đề
      //g.append('text')
      //  .attr('x', width/2)
      //  .attr('y', -10)
      //  .attr('text-anchor', 'middle')
      //  .style('font-size', '16px')
      //  .style('font-weight', 'bold')
      //  .text(`Phân bố TNGT theo khung giờ${year !== 'all' ? ` - Năm ${year}` : ''}`);
    })
    .catch(error => {
      console.error('Lỗi khi lấy dữ liệu:', error);
    });
}


// Hàm tổng hợp dữ liệu cho tất cả năm
function aggregateHourlyData(data) {
  const aggregated = {};
 
  data.forEach(item => {
    if (!aggregated[item.hour_name]) {
      aggregated[item.hour_name] = 0;
    }
    aggregated[item.hour_name] += item.Accidents;
  });


  return Object.entries(aggregated).map(([hour_name, Accidents]) => ({
    hour_name,
    Accidents
  }));
}




// Hàm vẽ biểu đồ xe
function renderVehChart_Pie(year) {
  let apiUrl = updateApiUrl('data_veh_by_year');

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      // Xử lý dữ liệu theo năm được chọn
      let filteredData;
      if (year === 'all') {
        // Tổng hợp dữ liệu cho tất cả năm
        filteredData = aggregateVehData(data);
      } else {
        // Lọc theo năm cụ thể
        filteredData = data.filter(d => d.Year === parseInt(year));
      }


      if (filteredData.length === 0) {
        console.error("Không có dữ liệu");
        return;
      }


      // Xóa biểu đồ cũ
      d3.select('#veh-chart').selectAll('svg').remove();


      // Tính tổng số vụ
      const total = d3.sum(filteredData, d => d.Accidents);


      // Thiết lập canvas với chiều rộng lớn hơn để có không gian cho chú thích
      const svg = d3.select('#veh-chart')
        .append('svg')
        .attr('width', 700) // Tăng chiều rộng từ 500 lên 700 để có không gian cho chú thích
        .attr('height', 300);


      const margin = { top: 20, right: 20, bottom: 10, left: 20 };
      const radius = Math.min(500, 300) / 2 - 15; // Bán kính vẫn giữ nguyên
      const g = svg.append('g')
        .attr('transform', `translate(${250},${150})`); // Tâm biểu đồ giữ nguyên


      // Tạo pie chart
      const pie = d3.pie().value(d => d.Accidents);
      const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);


      // Màu sắc
      const color = d3.scaleOrdinal()
        .domain(filteredData.map(d => d.Veh_1))
        .range(["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEEAD", "#D4A5A5", "#79BEDB"]);


      // Vẽ các phần
      const arcs = pie(filteredData);
      g.selectAll('path')
        .data(arcs)
        .enter().append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => color(i))
        .attr('stroke', 'white')
        .attr('stroke-width', 2);


// Thêm nhãn phần trăm (điều chỉnh vị trí dựa trên phần trăm)
g.selectAll('text')
  .data(arcs)
  .enter().append('text')
  .attr('transform', d => {
    const pos = arc.centroid(d);
    const percentage = (d.data.Accidents / total) * 100;
    
    // Điều chỉnh vị trí nhãn dựa trên phần trăm
    const multiplier = percentage < 5 ? 2.1 : 1.05; // Nhãn <5% sẽ được đẩy ra ngoài xa hơn
    pos[0] *= multiplier;
    pos[1] *= multiplier;
    
    return `translate(${pos})`;
  })
  .attr('text-anchor', 'middle')
  .attr('font-size', '12px') // Kích thước chữ
  .attr('fill', d => {
    const percentage = (d.data.Accidents / total) * 100;
    return percentage < 5 ? '#333' : '#fff'; // Màu chữ đen cho nhãn ngoài, trắng cho nhãn trong
  })
  .text(d => {
    const percentage = (d.data.Accidents / total) * 100;
    return percentage < 5 ? `${percentage.toFixed(1)}%` : `${percentage.toFixed(1)}%`;
  });


      // Thêm tiêu đề
      g.append('text')
        .attr('y', -radius - 20)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .text(`Tỷ lệ TNGT theo loại xe${year !== 'all' ? ` - Năm ${year}` : ''}`);


      // Thêm chú thích và di chuyển ra ngoài biểu đồ
      const legend = svg.append('g')
        .attr('transform', `translate(${radius + 300}, 20)`); // Di chuyển chú thích xa hơn về bên phải (300px từ tâm)


      filteredData.forEach((d, i) => {
        const legendItem = legend.append('g')
          .attr('transform', `translate(0, ${i * 25})`);


        legendItem.append('rect')
          .attr('width', 15)
          .attr('height', 15)
          .attr('fill', color(i));


        legendItem.append('text')
          .attr('x', 20)
          .attr('y', 12)
          .text(`${d.Veh_1} (${d.Accidents})`);
      });
    })
    .catch(error => {
      console.error("Lỗi khi lấy dữ liệu:", error);
    });
}


function renderRoadChart_Pie(year) {
  let apiUrl = updateApiUrl('data_road_by_year');

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      // Xử lý dữ liệu theo năm được chọn
      let filteredData;
      if (year === 'all') {
        // Tổng hợp dữ liệu cho tất cả năm
        filteredData = aggregateRoadData(data);
      } else {
        // Lọc theo năm cụ thể
        filteredData = data.filter(d => d.Year === parseInt(year));
      }


      if (filteredData.length === 0) {
        console.error("Không có dữ liệu");
        return;
      }


      // Xóa biểu đồ cũ
      d3.select('#road-chart').selectAll('svg').remove();


      // Tính tổng số vụ
      const total = d3.sum(filteredData, d => d.Accidents);


      // Thiết lập canvas với chiều rộng lớn hơn để có không gian cho chú thích
      const svg = d3.select('#road-chart')
        .append('svg')
        .attr('width', 700)
        .attr('height', 300);


      const margin = { top: 20, right: 20, bottom: 10, left: 20 };
      const radius = Math.min(500, 300) / 2 - 15;
      const g = svg.append('g')
        .attr('transform', `translate(${250},${150})`);


      // Tạo pie chart
      const pie = d3.pie().value(d => d.Accidents);
      const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);


      // Màu sắc
      const color = d3.scaleOrdinal()
        .domain(filteredData.map(d => d.Rdtype))
        .range(["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEEAD", "#D4A5A5", "#79BEDB"]);


      // Vẽ các phần
      const arcs = pie(filteredData);
      g.selectAll('path')
        .data(arcs)
        .enter().append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => color(i))
        .attr('stroke', 'white')
        .attr('stroke-width', 2);


// Thêm nhãn phần trăm (điều chỉnh vị trí dựa trên phần trăm)
g.selectAll('text')
  .data(arcs)
  .enter().append('text')
  .attr('transform', d => {
    const pos = arc.centroid(d);
    const percentage = (d.data.Accidents / total) * 100;
    
    // Điều chỉnh vị trí nhãn dựa trên phần trăm
    const multiplier = percentage < 5 ? 2.1 : 1.05; // Nhãn <5% sẽ được đẩy ra ngoài xa hơn
    pos[0] *= multiplier;
    pos[1] *= multiplier;
    
    return `translate(${pos})`;
  })
  .attr('text-anchor', 'middle')
  .attr('font-size', '12px') // Kích thước chữ
  .attr('fill', d => {
    const percentage = (d.data.Accidents / total) * 100;
    return percentage < 5 ? '#333' : '#fff'; // Màu chữ đen cho nhãn ngoài, trắng cho nhãn trong
  })
  .text(d => {
    const percentage = (d.data.Accidents / total) * 100;
    return percentage < 5 ? `${percentage.toFixed(1)}%` : `${percentage.toFixed(1)}%`;
  });


      // Thêm tiêu đề
      g.append('text')
        .attr('y', -radius - 20)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .text(`Tỷ lệ TNGT theo loại đường${year !== 'all' ? ` - Năm ${year}` : ''}`);


      // Thêm chú thích và di chuyển ra ngoài biểu đồ
      const legend = svg.append('g')
        .attr('transform', `translate(${radius + 300}, 20)`);


      filteredData.forEach((d, i) => {
        const legendItem = legend.append('g')
          .attr('transform', `translate(0, ${i * 25})`);


        legendItem.append('rect')
          .attr('width', 15)
          .attr('height', 15)
          .attr('fill', color(i));


        legendItem.append('text')
          .attr('x', 20)
          .attr('y', 12)
          .text(`${d.Rdtype} (${d.Accidents})`);
      });
    })
    .catch(error => {
      console.error("Lỗi khi lấy dữ liệu:", error);
    });
}


// Hàm tổng hợp dữ liệu cho tất cả năm
function aggregateRoadData(data) {
  const temp = {};
  data.forEach(d => {
    const key = d.Rdtype;
    if (!temp[key]) temp[key] = 0;
    temp[key] += d.Accidents;
  });
  return Object.entries(temp).map(([Rdtype, Accidents]) => ({
    Rdtype,
    Accidents
  }));
}


// Hàm tổng hợp dữ liệu xe cộ
function aggregateVehData(data) {
  const aggregated = {};
 
  data.forEach(item => {
    if (!aggregated[item.Veh_1]) {
      aggregated[item.Veh_1] = 0;
    }
    aggregated[item.Veh_1] += item.Accidents;
  });


  return Object.entries(aggregated).map(([Veh_1, Accidents]) => ({
    Veh_1,
    Accidents
  }));
}


function renderGenderChart_Pie(year) {
  // Xây dựng URL API
  let apiUrl = updateApiUrl('data_gender_by_year');

  // Lấy dữ liệu từ API
  fetch(apiUrl)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      // Xử lý dữ liệu theo năm được chọn
      let filteredData;
      if (year === 'all') {
        // Tổng hợp dữ liệu cho tất cả năm
        filteredData = aggregateGenderData(data);
      } else {
        // Lọc theo năm cụ thể
        filteredData = data.filter(d => d.Year === parseInt(year));
      }


      if (filteredData.length === 0) {
        console.error("Không có dữ liệu");
        return;
      }


      // Xóa biểu đồ cũ
      d3.select('#gender-chart').selectAll('svg').remove();


      // Tính tổng số vụ
      const total = d3.sum(filteredData, d => d.Accidents);


      // Thiết lập canvas
      const svg = d3.select('#gender-chart')
        .append('svg')
        .attr('width', 700)
        .attr('height', 300);


      const margin = { top: 20, right: 20, bottom: 10, left: 20 };
      const radius = Math.min(500, 300) / 2 - 15;
      const g = svg.append('g')
        .attr('transform', `translate(${250},${150})`);


      // Tạo pie chart
      const pie = d3.pie().value(d => d.Accidents);
      const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);


      // Màu sắc
      const color = d3.scaleOrdinal()
        .domain(filteredData.map(d => d.Gender_1))
        .range(["orange", "steelblue"]);


      // Vẽ các phần
      const arcs = pie(filteredData);
      g.selectAll('path')
        .data(arcs)
        .enter().append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => color(i))
        .attr('stroke', 'white')
        .attr('stroke-width', 2);


// Thêm nhãn phần trăm (điều chỉnh vị trí dựa trên phần trăm)
g.selectAll('text')
  .data(arcs)
  .enter().append('text')
  .attr('transform', d => {
    const pos = arc.centroid(d);
    const percentage = (d.data.Accidents / total) * 100;
    
    // Điều chỉnh vị trí nhãn dựa trên phần trăm
    const multiplier = percentage < 5 ? 2.1 : 1.05; // Nhãn <5% sẽ được đẩy ra ngoài xa hơn
    pos[0] *= multiplier;
    pos[1] *= multiplier;
    
    return `translate(${pos})`;
  })
  .attr('text-anchor', 'middle')
  .attr('font-size', '12px') // Kích thước chữ
  .attr('fill', d => {
    const percentage = (d.data.Accidents / total) * 100;
    return percentage < 5 ? '#333' : '#fff'; // Màu chữ đen cho nhãn ngoài, trắng cho nhãn trong
  })
  .text(d => {
    const percentage = (d.data.Accidents / total) * 100;
    return percentage < 5 ? `${percentage.toFixed(1)}%` : `${percentage.toFixed(1)}%`;
  });

      // Thêm tiêu đề
      g.append('text')
        .attr('y', -radius - 20)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .text(`Tỷ lệ TNGT theo giới${year !== 'all' ? ` - Năm ${year}` : ''}`);


      // Thêm chú thích
      const legend = svg.append('g')
        .attr('transform', `translate(${radius + 300}, 20)`);


      filteredData.forEach((d, i) => {
        const legendItem = legend.append('g')
          .attr('transform', `translate(0, ${i * 25})`);


        legendItem.append('rect')
          .attr('width', 15)
          .attr('height', 15)
          .attr('fill', color(i));


        legendItem.append('text')
          .attr('x', 20)
          .attr('y', 12)
          .text(`${d.Gender_1} (${d.Accidents})`);
      });
    })
    .catch(error => {
      console.error("Lỗi khi lấy dữ liệu:", error);
    });
}


// Hàm tổng hợp dữ liệu cho tất cả năm
function aggregateGenderData(data) {
  const temp = {};
  data.forEach(d => {
    const key = d.Gender_1;
    if (!temp[key]) temp[key] = 0;
    temp[key] += d.Accidents;
  });
  return Object.entries(temp).map(([Gender_1, Accidents]) => ({
    Gender_1,
    Accidents
  }));
}


function renderAgeChart_Pie(year) {
  // Xây dựng URL API
  let apiUrl = updateApiUrl('data_age_by_year');

  // Lấy dữ liệu từ API
  fetch(apiUrl)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      // Xử lý dữ liệu theo năm được chọn
      let filteredData;
      if (year === 'all') {
        // Tổng hợp dữ liệu cho tất cả năm
        filteredData = aggregateAgeData(data);
      } else {
        // Lọc theo năm cụ thể
        filteredData = data.filter(d => d.Year === parseInt(year));
      }


      if (filteredData.length === 0) {
        console.error("Không có dữ liệu");
        return;
      }


      // Xóa biểu đồ cũ
      d3.select('#age-chart').selectAll('svg').remove();


      // Tính tổng số vụ
      const total = d3.sum(filteredData, d => d.Accidents);


      // Thiết lập canvas
      const svg = d3.select('#age-chart')
        .append('svg')
        .attr('width', 700)
        .attr('height', 300);


      const margin = { top: 20, right: 20, bottom: 10, left: 20 };
      const radius = Math.min(500, 300) / 2 - 15;
      const g = svg.append('g')
        .attr('transform', `translate(${250},${150})`);


      // Tạo pie chart
      const pie = d3.pie().value(d => d.Accidents);
      const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);


      // Màu sắc
      const color = d3.scaleOrdinal()
        .domain(filteredData.map(d => d.age_name))
        .range(["lightblue", "orange", "steelblue", "#999999"]);


      // Vẽ các phần
      const arcs = pie(filteredData);
      g.selectAll('path')
        .data(arcs)
        .enter().append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => color(i))
        .attr('stroke', 'white')
        .attr('stroke-width', 2);


// Thêm nhãn phần trăm (điều chỉnh vị trí dựa trên phần trăm)
g.selectAll('text')
  .data(arcs)
  .enter().append('text')
  .attr('transform', d => {
    const pos = arc.centroid(d);
    const percentage = (d.data.Accidents / total) * 100;
    
    // Điều chỉnh vị trí nhãn dựa trên phần trăm
    const multiplier = percentage < 5 ? 2.1 : 1.05; // Nhãn <5% sẽ được đẩy ra ngoài xa hơn
    pos[0] *= multiplier;
    pos[1] *= multiplier;
    
    return `translate(${pos})`;
  })
  .attr('text-anchor', 'middle')
  .attr('font-size', '12px') // Kích thước chữ
  .attr('fill', d => {
    const percentage = (d.data.Accidents / total) * 100;
    return percentage < 5 ? '#333' : '#fff'; // Màu chữ đen cho nhãn ngoài, trắng cho nhãn trong
  })
  .text(d => {
    const percentage = (d.data.Accidents / total) * 100;
    return percentage < 5 ? `${percentage.toFixed(1)}%` : `${percentage.toFixed(1)}%`;
  });


      // Thêm tiêu đề
      g.append('text')
        .attr('y', -radius - 20)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .text(`Tỷ lệ TNGT theo độ tuổi${year !== 'all' ? ` - Năm ${year}` : ''}`);


      // Thêm chú thích
      const legend = svg.append('g')
        .attr('transform', `translate(${radius + 300}, 20)`);


      filteredData.forEach((d, i) => {
        const legendItem = legend.append('g')
          .attr('transform', `translate(0, ${i * 25})`);


        legendItem.append('rect')
          .attr('width', 15)
          .attr('height', 15)
          .attr('fill', color(i));


        legendItem.append('text')
          .attr('x', 20)
          .attr('y', 12)
          .text(`${d.age_name} (${d.Accidents})`);
      });
    })
    .catch(error => {
      console.error("Lỗi khi lấy dữ liệu:", error);
    });
}


// Hàm tổng hợp dữ liệu cho tất cả năm
function aggregateAgeData(data) {
  const temp = {};
  data.forEach(d => {
    const key = d.age_name;
    if (!temp[key]) temp[key] = 0;
    temp[key] += d.Accidents;
  });
  return Object.entries(temp).map(([age_name, Accidents]) => ({
    age_name,
    Accidents
  }));
}


function renderSeverityChart_Pie(year) {
  // Xây dựng URL API
  let apiUrl = updateApiUrl('data_severity_by_year');

  // Lấy dữ liệu từ API
  fetch(apiUrl)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      // Xử lý dữ liệu theo năm được chọn
      let filteredData;
      if (year === 'all') {
        // Tổng hợp dữ liệu cho tất cả năm
        filteredData = aggregateSeverityData(data);
      } else {
        // Lọc theo năm cụ thể
        filteredData = data.filter(d => d.Year === parseInt(year));
      }


      if (filteredData.length === 0) {
        console.error("Không có dữ liệu");
        return;
      }


      // Sắp xếp dữ liệu theo mức độ nghiêm trọng
      const severityOrder = ["Không bị sao", "Thương nhẹ", "Thương nặng", "Tử vong"];
      filteredData.sort((a, b) => severityOrder.indexOf(a.Severity_1) - severityOrder.indexOf(b.Severity_1));


      // Xóa biểu đồ cũ
      d3.select('#severity-chart').selectAll('svg').remove();


      // Tính tổng số vụ
      const total = d3.sum(filteredData, d => d.Accidents);


      // Thiết lập canvas
      const svg = d3.select('#severity-chart')
        .append('svg')
        .attr('width', 700)
        .attr('height', 300);


      const margin = { top: 20, right: 20, bottom: 10, left: 20 };
      const radius = Math.min(500, 300) / 2 - 15;
      const g = svg.append('g')
        .attr('transform', `translate(${150},${150})`);


      // Tạo pie chart
      const pie = d3.pie().value(d => d.Accidents);
      const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);


      // Màu sắc
      const color = d3.scaleOrdinal()
        .domain(filteredData.map(d => d.Severity_1))
        .range(["#4ECDC4", "#FF6B6B", "#FFD166", "#06D6A0"]);


      // Vẽ các phần
      const arcs = pie(filteredData);
      g.selectAll('path')
        .data(arcs)
        .enter().append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => color(i))
        .attr('stroke', 'white')
        .attr('stroke-width', 2);


// Thêm nhãn phần trăm (điều chỉnh vị trí dựa trên phần trăm)
g.selectAll('text')
  .data(arcs)
  .enter().append('text')
  .attr('transform', d => {
    const pos = arc.centroid(d);
    const percentage = (d.data.Accidents / total) * 100;
    
    // Điều chỉnh vị trí nhãn dựa trên phần trăm
    const multiplier = percentage < 5 ? 2.1 : 1.05; // Nhãn <5% sẽ được đẩy ra ngoài xa hơn
    pos[0] *= multiplier;
    pos[1] *= multiplier;
    
    return `translate(${pos})`;
  })
  .attr('text-anchor', 'middle')
  .attr('font-size', '12px') // Kích thước chữ
  .attr('fill', d => {
    const percentage = (d.data.Accidents / total) * 100;
    return percentage < 5 ? '#333' : '#fff'; // Màu chữ đen cho nhãn ngoài, trắng cho nhãn trong
  })
  .text(d => {
    const percentage = (d.data.Accidents / total) * 100;
    return percentage < 5 ? `${percentage.toFixed(1)}%` : `${percentage.toFixed(1)}%`;
  });


      // Thêm tiêu đề
      g.append('text')
        .attr('y', -radius - 20)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .text(`Tỷ lệ TNGT theo mức độ nghiêm trọng${year !== 'all' ? ` - Năm ${year}` : ''}`);


      // Thêm chú thích
      const legend = svg.append('g')
        .attr('transform', `translate(${radius + 190}, 20)`);


      filteredData.forEach((d, i) => {
        const legendItem = legend.append('g')
          .attr('transform', `translate(0, ${i * 25})`);


        legendItem.append('rect')
          .attr('width', 15)
          .attr('height', 15)
          .attr('fill', color(i));


        legendItem.append('text')
          .attr('x', 20)
          .attr('y', 12)
          .text(`${d.Severity_1} (${d.Accidents})`);
      });
    })
    .catch(error => {
      console.error("Lỗi khi lấy dữ liệu:", error);
    });
}


// Hàm tổng hợp dữ liệu cho tất cả năm
function aggregateSeverityData(data) {
  const temp = {};
  data.forEach(d => {
    const key = d.Severity_1;
    if (!temp[key]) temp[key] = 0;
    temp[key] += d.Accidents;
  });
  return Object.entries(temp).map(([Severity_1, Accidents]) => ({
    Severity_1,
    Accidents
  }));
}


function renderCauseChart_Pie(year) {
  let apiUrl = updateApiUrl('data_cause_by_year');
  
  fetch(apiUrl)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      let filteredData;
      if (year === 'all') {
        filteredData = aggregateCauseData(data);
      } else {
        filteredData = data.filter(d => d.Year === parseInt(year));
      }

      if (filteredData.length === 0) {
        console.error("Không có dữ liệu");
        return;
      }

      d3.select('#cause-chart').selectAll('svg').remove();

      const total = d3.sum(filteredData, d => d.Accidents);

      const svg = d3.select('#cause-chart')
        .append('svg')
        .attr('width', 700)
        .attr('height', 300);

      const margin = { top: 20, right: 20, bottom: 10, left: 20 };
      const radius = Math.min(500, 300) / 2 - 15;
      const g = svg.append('g')
        .attr('transform', `translate(${150},${150})`);

      const pie = d3.pie().value(d => d.Accidents);
      const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

      const color = d3.scaleOrdinal()
        .domain(filteredData.map(d => d.Causes))
        .range(["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEEAD", "#D4A5A5", "#79BEDB"]);

      const arcs = pie(filteredData);
      g.selectAll('path')
        .data(arcs)
        .enter().append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => color(i))
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

      // Thêm nhãn phần trăm (chỈ hiển thị >=2%)
      g.selectAll('text')
        .data(arcs)
        .enter().append('text')
        .attr('transform', d => {
          const pos = arc.centroid(d);
          const percentage = (d.data.Accidents / total) * 100;
          const multiplier = percentage < 5 ? 2.1 : 1.05;
          pos[0] *= multiplier;
          pos[1] *= multiplier;
          return `translate(${pos})`;
        })
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', '#333')
        .text(d => {
          const percentage = (d.data.Accidents / total) * 100;
          return percentage >= 2 ? `${percentage.toFixed(1)}%` : '';
        });

      g.append('text')
        .attr('y', -radius - 20)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .text(`Tỷ lệ TNGT theo nguyên nhân chính${year !== 'all' ? ` - Năm ${year}` : ''}`);

      // Thêm chú thích với phần trăm <2%
      const legend = svg.append('g')
        .attr('transform', `translate(${radius + 190}, 20)`);

      filteredData.forEach((d, i) => {
        const legendItem = legend.append('g')
          .attr('transform', `translate(0, ${i * 25})`);
        
        const percentage = (d.Accidents / total) * 100;

        legendItem.append('rect')
          .attr('width', 15)
          .attr('height', 15)
          .attr('fill', color(i));

        legendItem.append('text')
          .attr('x', 20)
          .attr('y', 12)
          .text(`${d.Causes} (${d.Accidents})`);

        // Hiển thị phần trăm <2% bên cạnh legend
        if (percentage < 2) {
          legendItem.append('text')
            .attr('x', 210)  // Vị trí hiển thị phần trăm
            .attr('y', 12)
            .attr('fill', '#333')
            .text(`(${percentage.toFixed(1)}%)`);
        }
      });
    })
    .catch(error => {
      console.error("Lỗi khi lấy dữ liệu:", error);
    });
}

// Hàm tổng hợp dữ liệu cho tất cả năm
function aggregateCauseData(data) {
  const temp = {};
  data.forEach(d => {
    const key = d.Causes;
    if (!temp[key]) temp[key] = 0;
    temp[key] += d.Accidents;
  });
  return Object.entries(temp).map(([Causes, Accidents]) => ({
    Causes,
    Accidents
  }));
}

// Hàm để tải dữ liệu mặc định khi trang được tải
window.onload = function() {
  // Mặc định hiển thị dữ liệu cho năm 2015
  updateCharts('all');
};

// Get the dropdown element
const yearSelector = document.getElementById('yearSelector');

// Add event listener for dropdown changes
yearSelector.addEventListener('change', function() {
  updateChartTitles(this.value);
  updateCharts(this.value); // Call your chart update function
});

// Function to update chart titles based on selected year
function updateChartTitles(selectedYear) {
  const chartTitles = document.querySelectorAll('.chart-title');
  
  // Store original titles if not already stored
  if (!window.originalTitles) {
    window.originalTitles = {};
    chartTitles.forEach(title => {
      window.originalTitles[title.id] = title.textContent;
    });
  }
  
  chartTitles.forEach(title => {
    // Check if we have the original title stored
    if (window.originalTitles && window.originalTitles[title.id]) {
      // Use the original title as base
      let baseTitle = window.originalTitles[title.id];
      
      // Only add year suffix if a specific year is selected
      if (selectedYear !== 'all') {
        // Check if title already contains a year suffix to prevent duplication
        if (!baseTitle.includes(' - Năm')) {
          title.textContent = `${baseTitle} - Năm ${selectedYear}`;
        }
      } else {
        // Restore original title when "Các năm" is selected
        title.textContent = baseTitle;
      }
    }
  });
}
