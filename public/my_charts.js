// Get base API URL from environment or use a default
const API_BASE_URL = window.API_BASE_URL || '';

// Function to build API URL with proper base
function getApiUrl(endpoint) {
  // If API_BASE_URL includes http or https, use it as is
  // Otherwise assume it's just a port or empty, and use current hostname
  if (API_BASE_URL.startsWith('http')) {
    return `${API_BASE_URL}${endpoint}`;
  } else if (API_BASE_URL) {
    return `${window.location.protocol}//${window.location.hostname}:${API_BASE_URL}${endpoint}`;
  } else {
    // Fallback to current origin
    return `${window.location.origin}${endpoint}`;
  }
}

// Add event listener for year selector
document.getElementById('yearSelector').addEventListener('change', function() {
  var selectedYear = this.value;
  updateCharts(selectedYear);
});

// Function to update all charts
function updateCharts(year) {
  console.log("Updating charts for year: " + year);

  // Update data for each chart
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

// Function to render month chart
function renderMonthChart(year) {
  // Build API URL
  const apiUrl = getApiUrl('/api/data_month_by_year');

  // Fetch data from API
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      // Convert nested object data to array
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

      // Filter by year if not 'all'
      if (year !== 'all') {
        formattedData = formattedData.filter(d => d.Year === parseInt(year));
      }

      // Group and sum if 'all'
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

      // Sort by month
      formattedData.sort((a, b) => a.Month - b.Month);

      // Remove old chart before drawing new one
      d3.select('#month-chart').selectAll('svg').remove();

      // Set up canvas
      const svg = d3.select('#month-chart')
        .append('svg')
        .attr('width', 650)
        .attr('height', 300);

      const margin = { top: 20, right: 30, bottom: 20, left: 50 };
      const width = +svg.attr("width") - margin.left - margin.right;
      const height = +svg.attr("height") - margin.top - margin.bottom;
      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      // Get values for X and Y axes
      const xValues = formattedData.map(d => d.Month.toString()); // Convert month to string
      const yValues = formattedData.map(d => d.Accidents);

      // Scales
      const x = d3.scaleBand()
        .domain(xValues)
        .range([0, width])
        .padding(0.1);

      const y = d3.scaleLinear()
        .domain([0, d3.max(yValues)])
        .nice()
        .range([height, 0]);

      // X and Y axes
      g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d => `Tháng ${d}`)); // Format X axis labels

      g.append("g")
        .call(d3.axisLeft(y));

      // Draw bars
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

// Function to render week chart
function renderWeekChart(year) {
  // Build API URL
  const apiUrl = getApiUrl('/api/data_week_by_year');

  // Fetch data from API
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      // Process data
      const weekOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
     
      // Filter data by year if needed
      let filteredData = year === 'all'
        ? aggregateWeeklyData(data) // Function to aggregate data for all years
        : data.filter(d => d.Year == year);

      // Sort by day of week order
      filteredData.sort((a, b) =>
        weekOrder.indexOf(a.day_name) - weekOrder.indexOf(b.day_name)
      );

      // Remove old chart
      d3.select('#week-chart').selectAll('svg').remove();

      // Set up canvas
      const svg = d3.select('#week-chart')
        .append('svg')
        .attr('width', 600)
        .attr('height', 300);

      const margin = { top: 20, right: 30, bottom: 40, left: 50 };
      const width = 500 - margin.left - margin.right;
      const height = 300 - margin.top - margin.bottom;
     
      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Scales
      const x = d3.scaleBand()
        .domain(filteredData.map(d => d.day_name))
        .range([0, width])
        .padding(0.1);

      const y = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.Accidents)])
        .nice()
        .range([height, 0]);

      // Draw axes
      g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x));

      g.append('g')
        .call(d3.axisLeft(y));

      // Draw bars
      g.selectAll('.bar')
        .data(filteredData)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.day_name))
        .attr('y', d => y(d.Accidents))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.Accidents))
        .attr('fill', '#7B68EE');
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
}

// Function to aggregate data for all years
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

// Function to render hour chart
function renderHourChart(year) {
  // Build API URL
  const apiUrl = getApiUrl('/api/data_hour_by_year');

  // Fetch data from API
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      // Process data
      const hourOrder = ['0h00-5h59', '6h00-11h59', '12h00-17h59', '18h00-23h59'];
     
      // Filter and aggregate data
      let filteredData = year === 'all'
        ? aggregateHourlyData(data) // Function to aggregate for all years
        : data.filter(d => d.Year == year);

      // Sort by hour order
      filteredData.sort((a, b) =>
        hourOrder.indexOf(a.hour_name) - hourOrder.indexOf(b.hour_name)
      );

      // Remove old chart
      d3.select('#hour-chart').selectAll('svg').remove();

      // Set up canvas
      const svg = d3.select('#hour-chart')
        .append('svg')
        .attr('width', 500)
        .attr('height', 300);

      const margin = { top: 20, right: 30, bottom: 40, left: 50 };
      const width = 500 - margin.left - margin.right;
      const height = 300 - margin.top - margin.bottom;
     
      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Scales
      const x = d3.scaleBand()
        .domain(filteredData.map(d => d.hour_name))
        .range([0, width])
        .padding(0.1);

      const y = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.Accidents)])
        .nice()
        .range([height, 0]);

      // Draw axes
      g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x));

      g.append('g')
        .call(d3.axisLeft(y));

      // Draw bars
      g.selectAll('.bar')
        .data(filteredData)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.hour_name))
        .attr('y', d => y(d.Accidents))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.Accidents))
        .attr('fill', '#7B68EE');
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
}

// Function to aggregate data for all years
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

// Function to render vehicle pie chart
function renderVehChart_Pie(year) {
  const apiUrl = getApiUrl('/api/data_veh_by_year');

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      // Process data by selected year
      let filteredData;
      if (year === 'all') {
        // Aggregate data for all years
        filteredData = aggregateVehData(data);
      } else {
        // Filter by specific year
        filteredData = data.filter(d => d.Year === parseInt(year));
      }

      if (filteredData.length === 0) {
        console.error("No data available");
        return;
      }

      // Remove old chart
      d3.select('#veh-chart').selectAll('svg').remove();

      // Calculate total
      const total = d3.sum(filteredData, d => d.Accidents);

      // Set up canvas with larger width for legend
      const svg = d3.select('#veh-chart')
        .append('svg')
        .attr('width', 700)
        .attr('height', 300);

      const margin = { top: 20, right: 20, bottom: 10, left: 20 };
      const radius = Math.min(500, 300) / 2 - 15;
      const g = svg.append('g')
        .attr('transform', `translate(${250},${150})`);

      // Create pie chart
      const pie = d3.pie().value(d => d.Accidents);
      const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

      // Colors
      const color = d3.scaleOrdinal()
        .domain(filteredData.map(d => d.Veh_1))
        .range(["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEEAD", "#D4A5A5", "#79BEDB"]);

      // Draw sections
      const arcs = pie(filteredData);
      g.selectAll('path')
        .data(arcs)
        .enter().append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => color(i))
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

      // Add percentage labels (adjust position based on percentage)
      g.selectAll('text')
        .data(arcs)
        .enter().append('text')
        .attr('transform', d => {
          const pos = arc.centroid(d);
          const percentage = (d.data.Accidents / total) * 100;
          
          // Adjust label position based on percentage
          const multiplier = percentage < 5 ? 2.1 : 1.05; // Labels <5% will be pushed further out
          pos[0] *= multiplier;
          pos[1] *= multiplier;
          
          return `translate(${pos})`;
        })
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', d => {
          const percentage = (d.data.Accidents / total) * 100;
          return percentage < 5 ? '#333' : '#fff'; // Black text for outside labels, white for inside
        })
        .text(d => {
          const percentage = (d.data.Accidents / total) * 100;
          return percentage < 5 ? `${percentage.toFixed(1)}%` : `${percentage.toFixed(1)}%`;
        });

      // Add title
      g.append('text')
        .attr('y', -radius - 20)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .text(`Tỷ lệ TNGT theo loại xe${year !== 'all' ? ` - Năm ${year}` : ''}`);

      // Add legend and move outside chart
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
          .text(`${d.Veh_1} (${d.Accidents})`);
      });
    })
    .catch(error => {
      console.error("Error fetching data:", error);
    });
}

// Function to render road type pie chart
function renderRoadChart_Pie(year) {
  const apiUrl = getApiUrl('/api/data_road_by_year');

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      // Process data by selected year
      let filteredData;
      if (year === 'all') {
        // Aggregate data for all years
        filteredData = aggregateRoadData(data);
      } else {
        // Filter by specific year
        filteredData = data.filter(d => d.Year === parseInt(year));
      }

      if (filteredData.length === 0) {
        console.error("No data available");
        return;
      }

      // Remove old chart
      d3.select('#road-chart').selectAll('svg').remove();

      // Calculate total
      const total = d3.sum(filteredData, d => d.Accidents);

      // Set up canvas with larger width for legend
      const svg = d3.select('#road-chart')
        .append('svg')
        .attr('width', 700)
        .attr('height', 300);

      const margin = { top: 20, right: 20, bottom: 10, left: 20 };
      const radius = Math.min(500, 300) / 2 - 15;
      const g = svg.append('g')
        .attr('transform', `translate(${250},${150})`);

      // Create pie chart
      const pie = d3.pie().value(d => d.Accidents);
      const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

      // Colors
      const color = d3.scaleOrdinal()
        .domain(filteredData.map(d => d.Rdtype))
        .range(["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEEAD", "#D4A5A5", "#79BEDB"]);

      // Draw sections
      const arcs = pie(filteredData);
      g.selectAll('path')
        .data(arcs)
        .enter().append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => color(i))
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

      // Add percentage labels (adjust position based on percentage)
      g.selectAll('text')
        .data(arcs)
        .enter().append('text')
        .attr('transform', d => {
          const pos = arc.centroid(d);
          const percentage = (d.data.Accidents / total) * 100;
          
          // Adjust label position based on percentage
          const multiplier = percentage < 5 ? 2.1 : 1.05; // Labels <5% will be pushed further out
          pos[0] *= multiplier;
          pos[1] *= multiplier;
          
          return `translate(${pos})`;
        })
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', d => {
          const percentage = (d.data.Accidents / total) * 100;
          return percentage < 5 ? '#333' : '#fff'; // Black text for outside labels, white for inside
        })
        .text(d => {
          const percentage = (d.data.Accidents / total) * 100;
          return percentage < 5 ? `${percentage.toFixed(1)}%` : `${percentage.toFixed(1)}%`;
        });

      // Add title
      g.append('text')
        .attr('y', -radius - 20)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .text(`Tỷ lệ TNGT theo loại đường${year !== 'all' ? ` - Năm ${year}` : ''}`);

      // Add legend and move outside chart
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
      console.error("Error fetching data:", error);
    });
}

// Function to aggregate vehicle data
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

// Function to aggregate road data
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

// Function to render gender pie chart
function renderGenderChart_Pie(year) {
  // Build API URL
  const apiUrl = getApiUrl('/api/data_gender_by_year');

  // Fetch data from API
  fetch(apiUrl)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      // Process data by selected year
      let filteredData;
      if (year === 'all') {
        // Aggregate data for all years
        filteredData = aggregateGenderData(data);
      } else {
        // Filter by specific year
        filteredData = data.filter(d => d.Year === parseInt(year));
      }

      if (filteredData.length === 0) {
        console.error("No data available");
        return;
      }

      // Remove old chart
      d3.select('#gender-chart').selectAll('svg').remove();

      // Calculate total
      const total = d3.sum(filteredData, d => d.Accidents);

      // Set up canvas
      const svg = d3.select('#gender-chart')
        .append('svg')
        .attr('width', 700)
        .attr('height', 300);

      const margin = { top: 20, right: 20, bottom: 10, left: 20 };
      const radius = Math.min(500, 300) / 2 - 15;
      const g = svg.append('g')
        .attr('transform', `translate(${250},${150})`);

      // Create pie chart
      const pie = d3.pie().value(d => d.Accidents);
      const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

      // Colors
      const color = d3.scaleOrdinal()
        .domain(filteredData.map(d => d.Gender_1))
        .range(["orange", "steelblue"]);

      // Draw sections
      const arcs = pie(filteredData);
      g.selectAll('path')
        .data(arcs)
        .enter().append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => color(i))
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

      // Add percentage labels (adjust position based on percentage)
      g.selectAll('text')
        .data(arcs)
        .enter().append('text')
        .attr('transform', d => {
          const pos = arc.centroid(d);
          const percentage = (d.data.Accidents / total) * 100;
          
          // Adjust label position based on percentage
          const multiplier = percentage < 5 ? 2.1 : 1.05; // Labels <5% will be pushed further out
          pos[0] *= multiplier;
          pos[1] *= multiplier;
          
          return `translate(${pos})`;
        })
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', d => {
          const percentage = (d.data.Accidents / total) * 100;
          return percentage < 5 ? '#333' : '#fff'; // Black text for outside labels, white for inside
        })
        .text(d => {
          const percentage = (d.data.Accidents / total) * 100;
          return percentage < 5 ? `${percentage.toFixed(1)}%` : `${percentage.toFixed(1)}%`;
        });

      // Add title
      g.append('text')
        .attr('y', -radius - 20)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .text(`Tỷ lệ TNGT theo giới${year !== 'all' ? ` - Năm ${year}` : ''}`);

      // Add legend
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
      console.error("Error fetching data:", error);
    });
}

// Function to aggregate gender data
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

// Function to render age pie chart
function renderAgeChart_Pie(year) {
  // Build API URL
  const apiUrl = getApiUrl('/api/data_age_by_year');

  // Fetch data from API
  fetch(apiUrl)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      // Process data by selected year
      let filteredData;
      if (year === 'all') {
        // Aggregate data for all years
        filteredData = aggregateAgeData(data);
      } else {
        // Filter by specific year
        filteredData = data.filter(d => d.Year === parseInt(year));
      }

      if (filteredData.length === 0) {
        console.error("No data available");
        return;
      }

      // Remove old chart
      d3.select('#age-chart').selectAll('svg').remove();

      // Calculate total
      const total = d3.sum(filteredData, d => d.Accidents);

      // Set up canvas
      const svg = d3.select('#age-chart')
        .append('svg')
        .attr('width', 700)
        .attr('height', 300);

      const margin = { top: 20, right: 20, bottom: 10, left: 20 };
      const radius = Math.min(500, 300) / 2 - 15;
      const g = svg.append('g')
        .attr('transform', `translate(${250},${150})`);

      // Create pie chart
      const pie = d3.pie().value(d => d.Accidents);
      const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

      // Colors
      const color = d3.scaleOrdinal()
        .domain(filteredData.map(d => d.age_name))
        .range(["lightblue", "orange", "steelblue", "#999999"]);

      // Draw sections
      const arcs = pie(filteredData);
      g.selectAll('path')
        .data(arcs)
        .enter().append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => color(i))
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

      // Add percentage labels (adjust position based on percentage)
      g.selectAll('text')
        .data(arcs)
        .enter().append('text')
        .attr('transform', d => {
          const pos = arc.centroid(d);
          const percentage = (d.data.Accidents / total) * 100;
          
          // Adjust label position based on percentage
          const multiplier = percentage < 5 ? 2.1 : 1.05; // Labels <5% will be pushed further out
          pos[0] *= multiplier;
          pos[1] *= multiplier;
          
          return `translate(${pos})`;
        })
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', d => {
          const percentage = (d.data.Accidents / total) * 100;
          return percentage < 5 ? '#333' : '#fff'; // Black text for outside labels, white for inside
        })
        .text(d => {
          const percentage = (d.data.Accidents / total) * 100;
          return percentage < 5 ? `${percentage.toFixed(1)}%` : `${percentage.toFixed(1)}%`;
        });

      // Add title
      g.append('text')
        .attr('y', -radius - 20)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .text(`Tỷ lệ TNGT theo độ tuổi${year !== 'all' ? ` - Năm ${year}` : ''}`);

      // Add legend
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
      console.error("Error fetching data:", error);
    });
}

// Function to aggregate age data
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

// Function to render severity pie chart
function renderSeverityChart_Pie(year) {
  // Build API URL
  const apiUrl = getApiUrl('/api/data_severity_by_year');

  // Fetch data from API
  fetch(apiUrl)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      // Process data by selected year
      let filteredData;
      if (year === 'all') {
        // Aggregate data for all years
        filteredData = aggregateSeverityData(data);
      } else {
        // Filter by specific year
        filteredData = data.filter(d => d.Year === parseInt(year));
      }

      if (filteredData.length === 0) {
        console.error("No data available");
        return;
      }

      // Sort data by severity level
      const severityOrder = ["Không bị sao", "Thương nhẹ", "Thương nặng", "Tử vong"];
      filteredData.sort((a, b) => severityOrder.indexOf(a.Severity_1) - severityOrder.indexOf(b.Severity_1));

      // Remove old chart
      d3.select('#severity-chart').selectAll('svg').remove();

      // Calculate total
      const total = d3.sum(filteredData, d => d.Accidents);

      // Set up canvas
      const svg = d3.select('#severity-chart')
        .append('svg')
        .attr('width', 700)
        .attr('height', 300);

      const margin = { top: 20, right: 20, bottom: 10, left: 20 };
      const radius = Math.min(500, 300) / 2 - 15;
      const g = svg.append('g')
        .attr('transform', `translate(${250},${150})`);

      // Create pie chart
      const pie = d3.pie().value(d => d.Accidents);
      const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

      // Colors
      const color = d3.scaleOrdinal()
        .domain(filteredData.map(d => d.Severity_1))
        .range(["#4ECDC4", "#FF6B6B", "#FFD166", "#06D6A0"]);

      // Draw sections
      const arcs = pie(filteredData);
      g.selectAll('path')
        .data(arcs)
        .enter().append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => color(i))
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

      // Add percentage labels (adjust position based on percentage)
      g.selectAll('text')
        .data(arcs)
        .enter().append('text')
        .attr('transform', d => {
          const pos = arc.centroid(d);
          const percentage = (d.data.Accidents / total) * 100;
          
          // Adjust label position based on percentage
          const multiplier = percentage < 5 ? 2.1 : 1.05; // Labels <5% will be pushed further out
          pos[0] *= multiplier;
          pos[1] *= multiplier;
          
          return `translate(${pos})`;
        })
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', d => {
          const percentage = (d.data.Accidents / total) * 100;
          return percentage < 5 ? '#333' : '#fff'; // Black text for outside labels, white for inside
        })
        .text(d => {
          const percentage = (d.data.Accidents / total) * 100;
          return percentage < 5 ? `${percentage.toFixed(1)}%` : `${percentage.toFixed(1)}%`;
        });

      // Add title
      g.append('text')
        .attr('y', -radius - 20)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .text(`Tỷ lệ TNGT theo mức độ nghiêm trọng${year !== 'all' ? ` - Năm ${year}` : ''}`);

      // Add legend
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
          .text(`${d.Severity_1} (${d.Accidents})`);
      });
    })
    .catch(error => {
      console.error("Error fetching data:", error);
    });
}

// Function to aggregate severity data
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

// Function to render cause pie chart
function renderCauseChart_Pie(year) {
  // Build API URL
  const apiUrl = getApiUrl('/api/data_cause_by_year');

  // Fetch data from API
  fetch(apiUrl)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      // Process data by selected year
      let filteredData;
      if (year === 'all') {
        // Aggregate data for all years
        filteredData = aggregateCauseData(data);
      } else {
        // Filter by specific year
        filteredData = data.filter(d => d.Year === parseInt(year));
      }

      if (filteredData.length === 0) {
        console.error("No data available");
        return;
      }

      // Remove old chart
      d3.select('#cause-chart').selectAll('svg').remove();

      // Calculate total
      const total = d3.sum(filteredData, d => d.Accidents);

      // Set up canvas
      const svg = d3.select('#cause-chart')
        .append('svg')
        .attr('width', 700)
        .attr('height', 300);

      const margin = { top: 20, right: 20, bottom: 10, left: 20 };
      const radius = Math.min(500, 300) / 2 - 15;
      const g = svg.append('g')
        .attr('transform', `translate(${250},${150})`);

      // Create pie chart
      const pie = d3.pie().value(d => d.Accidents);
      const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

      // Colors
      const color = d3.scaleOrdinal()
        .domain(filteredData.map(d => d.Causes))
        .range(["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEEAD", "#D4A5A5", "#79BEDB"]);

      // Draw sections
      const arcs = pie(filteredData);
      g.selectAll('path')
        .data(arcs)
        .enter().append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => color(i))
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

      // Add percentage labels (adjust position based on percentage)
      g.selectAll('text')
        .data(arcs)
        .enter().append('text')
        .attr('transform', d => {
          const pos = arc.centroid(d);
          const percentage = (d.data.Accidents / total) * 100;
          
          // Adjust label position based on percentage
          const multiplier = percentage < 5 ? 2.1 : 1.05; // Labels <5% will be pushed further out
          pos[0] *= multiplier;
          pos[1] *= multiplier;
          
          return `translate(${pos})`;
        })
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', d => {
          const percentage = (d.data.Accidents / total) * 100;
          return percentage < 5 ? '#333' : '#fff'; // Black text for outside labels, white for inside
        })
        .text(d => {
          const percentage = (d.data.Accidents / total) * 100;
          return percentage < 5 ? `${percentage.toFixed(1)}%` : `${percentage.toFixed(1)}%`;
        });

      // Add title
      g.append('text')
        .attr('y', -radius - 20)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .text(`Tỷ lệ TNGT theo nguyên nhân chính${year !== 'all' ? ` - Năm ${year}` : ''}`);

      // Add legend
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
          .text(`${d.Causes} (${d.Accidents})`);
      });
    })
    .catch(error => {
      console.error("Error fetching data:", error);
    });
}

// Function to aggregate cause data
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

// Function to load default data when page is loaded
window.onload = function() {
  // Get API base URL from window or environment
  if (typeof API_BASE_URL === 'undefined') {
    // Check if we can get it from a global variable or data attribute
    const apiBaseElement = document.getElementById('api-base-url');
    if (apiBaseElement) {
      window.API_BASE_URL = apiBaseElement.getAttribute('data-url');
    } else {
      // Default to current origin if not specified
      window.API_BASE_URL = '';
    }
  }
  
  // Display data for all years by default
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
      window.originalTitles[title.id] = title.textContent; // Use ID as key
    });
  }
  
  chartTitles.forEach(title => {
    const baseTitle = window.originalTitles[title.id];
    
    if (selectedYear !== 'all') {
      title.textContent = `${baseTitle} - Năm ${selectedYear}`;
    } else {
      title.textContent = baseTitle; // Restore original title
    }
  });
}
