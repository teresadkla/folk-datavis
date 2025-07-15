import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "../../css/comparison.css";

const fontText = getComputedStyle(document.documentElement)
  .getPropertyValue('--font-secondary')
  .trim();

const MidiHeatmapComparison = () => {
  const svgRef = useRef();
  const [allNames, setAllNames] = useState([]);
  const [pitchData, setPitchData] = useState([]);
  const [selectedName, setSelectedName] = useState(null);

  const margin = { top: 50, right: 140, bottom: 50, left: 70 };
  const width = 1500 - margin.left - margin.right;
  const height = 700 - margin.top - margin.bottom;

  useEffect(() => {
    d3.json("pitch_compressed.json").then(jsonData => {
      const nameCounts = d3.rollup(jsonData, v => v.length, d => d.name);
      const multiVersionNames = Array.from(nameCounts.entries())
        .filter(([_, count]) => count > 1)
        .map(([name]) => name);

      setAllNames(multiVersionNames);
      setPitchData(jsonData);
      setSelectedName(multiVersionNames[0]);
    });
  }, []);

  useEffect(() => {
    if (!selectedName || pitchData.length === 0) return;

    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    svg.selectAll("*").remove();

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const variations = pitchData.filter(d => d.name === selectedName);

    const heatmapData = [];
    variations.forEach(variation => {
      variation.midiValues.forEach((pitch, idx) => {
        heatmapData.push({ x: idx, y: pitch });
      });
    });

    const xMax = d3.max(heatmapData, d => d.x);
    const yExtent = d3.extent(heatmapData, d => d.y);

    const xScale = d3.scaleLinear().domain([0, xMax]).range([0, width]);
    const yScale = d3.scaleLinear().domain([yExtent[0], yExtent[1] + 1]).range([height, 0]);

    const binSizeX = 1;
    const binSizeY = 1;

    const bins = d3.rollup(
      heatmapData,
      v => v.length,
      d => Math.floor(d.x / binSizeX),
      d => Math.floor(d.y / binSizeY)
    );

    const density = [];
    for (let [xBin, yMap] of bins.entries()) {
      for (let [yBin, count] of yMap.entries()) {
        density.push({
          x: xBin * binSizeX,
          y: yBin * binSizeY,
          count
        });
      }
    }

    const maxCount = d3.max(density, d => d.count);

    const color = d3.scaleLinear()
      .domain([0, maxCount / 2, maxCount])
      .range(["#5193AE", "#82813E", "#CC5C25"])
      .interpolate(d3.interpolateLab);

    // Tooltip
    const tooltip = d3.select(".midi-chart-container")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "#fff")
      .style("padding", "8px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("font-size", "12px");

    g.selectAll("rect")
      .data(density)
      .enter()
      .append("rect")
      .attr("x", d => xScale(d.x))
      .attr("y", d => yScale(d.y + binSizeY))
      .attr("width", xScale(binSizeX) - xScale(0))
      .attr("height", yScale(yExtent[0]) - yScale(yExtent[0] + binSizeY))
      .attr("fill", d => color(d.count))
      .attr("stroke", "none")
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(
            `Tempo (x): ${d.x}<br/>
             Pitch (y): ${d.y}<br/>
             Contagem: ${d.count}`
          );
      })
      .on("mousemove", event => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });
    // Linhas horizontais para cada valor de pitch (MIDI)
    for (let yVal = yExtent[0]; yVal <= yExtent[1]; yVal++) {
      g.append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", yScale(yVal))
        .attr("y2", yScale(yVal))
        .attr("stroke", "#888")
        .attr("stroke-opacity", 0.15)
        .attr("stroke-width", 1);
    }

    g.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("font-family", fontText)
      .style("font-size", "14px");

    g.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .style("font-family", fontText)
      .style("font-size", "14px");

    // LEGEND
    const legendHeight = 200;
    const legendWidth = 20;

    const legendScale = d3.scaleLinear()
      .domain([0, maxCount])
      .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale)
      .ticks(6)
      .tickFormat(d3.format(".0f"));

    const defs = svg.append("defs");

    const linearGradient = defs.append("linearGradient")
      .attr("id", "legend-gradient")
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "0%")
      .attr("y2", "0%");

    const legendSteps = 10;
    const step = 1 / (legendSteps - 1);
    for (let i = 0; i < legendSteps; i++) {
      const value = i * step * maxCount;
      linearGradient.append("stop")
        .attr("offset", `${i * step * 100}%`)
        .attr("stop-color", color(value));
    }

    svg.append("g")
      .attr("transform", `translate(${width + margin.left + 20}, ${margin.top})`)
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)");

    svg.append("g")
      .attr("transform", `translate(${width + margin.left + 20 + legendWidth}, ${margin.top})`)
      .call(legendAxis)
      .selectAll("text")
      .style("font-family", fontText)
      .style("font-size", "12px");


    svg.append("text")
      .attr("x", width + margin.left + 10)
      .attr("y", margin.top - 10)
      .text("Frequência")
       .style("font-family", fontText)
      .style("font-size", "12px")
      .style("font-weight", "bold");

  }, [selectedName, pitchData]);

  return (
    <div className="midi-chart-container">
      <select
        className="music-select"
        onChange={(e) => setSelectedName(e.target.value)}
        value={selectedName || ""}
      >
        {allNames.map((name, idx) => (
          <option key={idx} value={name}>{name}</option>
        ))}
      </select>
      <div style={{ float: "right", marginLeft: "20px", fontWeight: "bold" }}>
        {selectedName && pitchData.length > 0 && (
          (() => {
            const variations = pitchData.filter(d => d.name === selectedName);
            return `Nº de variações: ${variations.length}`;
          })()
        )}
      </div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default MidiHeatmapComparison;
