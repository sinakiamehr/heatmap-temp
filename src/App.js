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
    const margin = { top: 80, right: 40, bottom: 120, left: 60 };
    const width = 1200 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Add title and description
    svg.append("text")
      .attr("id", "title")
      .attr("x", width / 2)
      .attr("y", -45)
      .attr("text-anchor", "middle")
      .style("font-size", "24px")
      .text("Monthly Global Land-Surface Temperature");
    
    svg.append("text")
      .attr("id", "description")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text(`${Math.min(...data.map(d => d.year))} - ${Math.max(...data.map(d => d.year))}: base temperature ${baseTemperature}℃`);
    
    // Create scales
    const years = [...new Set(data.map(d => d.year))];
    const xScale = d3.scaleBand()
      .domain(years)
      .range([0, width])
      .padding(0);
    
    const months = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const yScale = d3.scaleBand()
      .domain(months)
      .range([0, height])
      .padding(0);
    
    // Create color scale
    const minTemp = baseTemperature + Math.min(...data.map(d => d.variance));
    const maxTemp = baseTemperature + Math.max(...data.map(d => d.variance));
    
    const colorScale = d3.scaleSequential()
      .domain([minTemp, maxTemp])
      .interpolator(d3.interpolateRdYlBu);
    
    // Create axes
    const xAxis = d3.axisBottom(xScale)
      .tickValues(xScale.domain().filter(year => year % 10 === 0))
      .tickFormat(d => d);
    
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(month => {
        const date = new Date(0);
        date.setUTCMonth(month);
        return d3.timeFormat("%B")(date);
      });
    
    svg.append("g")
      .attr("id", "x-axis")
      .attr("transform", `translate(0, ${height})`)
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "middle");
    
    svg.append("g")
      .attr("id", "y-axis")
      .call(yAxis);
    
    // Create tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("id", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "1px")
      .style("border-radius", "5px")
      .style("padding", "10px");
    
    // Create cells
    svg.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "cell")
      .attr("x", d => xScale(d.year))
      .attr("y", d => yScale(d.month - 1))
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
    const legendColors = 10;
    
    const legendScale = d3.scaleLinear()
      .domain([minTemp, maxTemp])
      .range([0, legendWidth]);
    
    const legendAxis = d3.axisBottom(legendScale)
      .tickFormat(d => d.toFixed(1) + "℃")
      .tickValues(d3.range(minTemp, maxTemp, (maxTemp - minTemp) / legendColors));
    
    const legend = svg.append("g")
      .attr("id", "legend")
      .attr("transform", `translate(${(width - legendWidth) / 2}, ${height + 50})`);
    
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");
    
    const colorStops = d3.range(0, 1.01, 0.1);
    colorStops.forEach(stop => {
      const tempValue = minTemp + stop * (maxTemp - minTemp);
      gradient.append("stop")
        .attr("offset", `${stop * 100}%`)
        .attr("stop-color", colorScale(tempValue));
    });
    
    legend.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#gradient)");
    
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
