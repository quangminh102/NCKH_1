const d3 = require('d3');
const fs = require('fs');

function renderChart(data, fileName) {
  const width = 800;
  const height = 400;
  const margin = { top: 20, right: 30, bottom: 30, left: 40 };

  const x = d3.scaleLinear()
    .domain(d3.extent(data, (d) => d.x_value))
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, (d) => d.y_value)])
    .range([height - margin.bottom, margin.top]);

  const svg = d3.create('svg')
    .attr('width', width)
    .attr('height', height);

  svg.append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg.append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  svg.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 1.5)
    .attr('d', d3.line()
      .x((d) => x(d.x_value))
      .y((d) => y(d.y_value))
    );

  fs.writeFileSync(`./public/${fileName}.svg`, svg.node().outerHTML);
  console.log(`Biểu đồ đã được lưu tại './public/${fileName}.svg'`);
}

module.exports = renderChart;
