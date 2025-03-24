import "./App.css";
import * as d3 from "d3";
import { useEffect, useState, useRef } from "react";

function App() {
  const [data, setData] = useState([]);
  const [baseTemperature, setBaseTemperature] = useState(0);
  const svgRef = useRef();

  useEffect(() => {
    d3.json(
      "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json"
    ).then((response) => {
      setData(response.monthlyVariance);
      setBaseTemperature(response.baseTemperature);
    });
  }, []);

  useEffect(() => {
    if (data.length === 0) return;
    
    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Set dimensions and margins
    const width = 1200;
    const height = 900;
    const padding = 100;
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Create main group for the chart
    const g = svg.append("g")
    
   
      // Add title
    g.append("text")
      .attr("id", "title")
      .attr("x", (width) / 2)
      .attr("y", padding * 0.5)
      .attr("text-anchor", "middle")
      .style("font-size", "24px")
      .text("Monthly Global Land-Surface Temperature");
    
    // Add description
    g.append("text")
      .attr("id", "description")
      .attr("x", (width) / 2)
      .attr("y", padding * 0.8)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text(`${Math.min(...data.map(d => d.year))} - ${Math.max(...data.map(d => d.year))}: base temperature ${baseTemperature}℃`);
    
    // Create scales
    const years = [...new Set(data.map(d => d.year))];
    const xScale = d3.scaleBand()
      .domain(years)
      .range([padding, width - padding])
      .padding(0);
    
    const months = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
    const yScale = d3.scaleBand()
      .domain(months)
      .range([padding, height - padding])
      .padding(0);
    
    // Create color scale
    const minTemp = baseTemperature + Math.min(...data.map(d => d.variance));
    const maxTemp = baseTemperature + Math.max(...data.map(d => d.variance));
    
    const colorScale = d3.scaleSequential()
      .domain([minTemp, maxTemp])
      .interpolator(d3.interpolateRdYlBu);
    
    // Create axes
    const xAxis = d3.axisBottom(xScale)
      .tickValues(xScale.domain().filter(year => year % 20 === 0))
      .tickFormat(d => d);
    
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(month => {
        const date = new Date(0);
        date.setUTCMonth(month);
        return d3.timeFormat("%B")(date);
      });
    
    g.append("g")
      .attr("id", "x-axis")
      .attr("transform", `translate(0, ${height - padding})`)
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "middle");
    
    g.append("g")
      .attr("id", "y-axis")
      .attr("transform", `translate(${padding}, 0)`)
      .call(yAxis);
    
    // Create tooltip
    const tooltip = d3.select(".chart-container")
      .append("div")
      .attr("id", "tooltip")
      .attr("class", "tooltip");
    
    // Create cells
    g.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "cell")
      .attr("x", d => xScale(d.year))
      .attr("y", d => yScale(d.month))
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("data-month", d => d.month - 1)
      .attr("data-year", d => d.year)
      .attr("data-temp", d => baseTemperature + d.variance)
      .style("fill", d => colorScale(baseTemperature + d.variance))
      .on("mouseover", function(event, d) {
        const date = new Date(d.year, d.month - 1);
        const monthName = d3.timeFormat("%B")(date);
        const temp = (baseTemperature + d.variance).toFixed(1);
        const variance = d.variance.toFixed(1);
        
        tooltip.style("opacity", 0.9)
          .attr("data-year", d.year)
          .html(`${d.year} - ${monthName}<br>Temperature: ${temp}℃<br>Variance: ${variance}℃`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        tooltip.style("opacity", 0);
      });
    
    // Create legend
    const legendWidth = 400;
    const legendHeight = 20;
    const numColors = 8; // Number of discrete color blocks
    
    const legendScale = d3.scaleLinear()
      .domain([minTemp, maxTemp])
      .range([0, legendWidth]);
    
    const legendAxis = d3.axisBottom(legendScale)
      .tickFormat(d => d.toFixed(1) + "℃")
      .tickValues(d3.range(minTemp, maxTemp, (maxTemp - minTemp) / numColors));
    
    const legend = g.append("g")
      .attr("id", "legend")
      .attr("transform", `translate(${(width - legendWidth) / 2}, ${height - padding * 0.5})`);
    
    // Create color blocks for legend
    const colorRanges = d3.range(numColors).map(i => {
      const t = i / (numColors - 1);
      return minTemp + t * (maxTemp - minTemp);
    });
    
    legend.selectAll("rect")
      .data(colorRanges)
      .enter()
      .append("rect")
      .attr("x", (d, i) => (i * legendWidth) / numColors)
      .attr("width", legendWidth / numColors)
      .attr("height", legendHeight)
      .style("fill", d => colorScale(d));
    
    legend.append("g")
      .attr("transform", `translate(0, ${legendHeight})`)
      .call(legendAxis);
    
  }, [data, baseTemperature]);

  return (
    <div className="App">
      <header className="App-header">
        Monthly Global Land-Surface Temperature
      </header>
      <div className="chart-container">
        <svg ref={svgRef}></svg>
      </div>
      <footer className="footer">
        <p>
          Coded and Designed by <strong>Sina Kiamehr</strong>
        </p>
      </footer>
    </div>
  );
}

export default App;
