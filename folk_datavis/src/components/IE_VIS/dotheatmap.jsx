import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "../../css/dotheatmap.css";

const margin = { top: 100, right: 50, bottom: 20, left: 150 };
const pageSize = 40;

const DotHeatmap = () => {
  const svgRef = useRef();
  const [data, setData] = useState([]);
  const [names, setNames] = useState([]);
  const [types, setTypes] = useState([]);
  const [countMap, setCountMap] = useState(new Map());
  const [startIndex, setStartIndex] = useState(0);
  const [filterActive, setFilterActive] = useState(false);

  useEffect(() => {
    d3.csv("/sets.csv").then((rawData) => {
      const count = d3.rollup(
        rawData,
        (v) => v.length,
        (d) => d.name,
        (d) => d.type
      );
      const nameList = Array.from(new Set(rawData.map((d) => d.name))).sort();
      const typeList = Array.from(new Set(rawData.map((d) => d.type))).sort();
      setData(rawData);
      setNames(nameList);
      setTypes(typeList);
      setCountMap(count);
    });
  }, []);

  useEffect(() => {
    if (data.length && names.length && types.length && countMap.size) {
      renderDotHeatmap();
    }
  }, [data, names, types, countMap, startIndex, filterActive]);

  const getFilteredNames = () => {
    return Array.from(countMap.entries())
      .filter(([_, typeMap]) => typeMap.size > 1)
      .map(([name]) => name)
      .sort();
  };

  const renderDotHeatmap = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("g").remove();

    const width = +svg.attr("width") - margin.left - margin.right;
    const height = +svg.attr("height") - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const currentNames = filterActive ? getFilteredNames() : names;
    const visibleNames = currentNames.slice(startIndex, startIndex + pageSize);

    const xScale = d3.scaleBand().domain(types).range([0, width]).padding(0.1);
    const yScale = d3
      .scaleBand()
      .domain(visibleNames)
      .range([0, height])
      .padding(0.1);

    const colorScale = d3
      .scaleSequential(d3.interpolatePlasma)
      .domain([1, d3.max(Array.from(countMap.values(), (m) => d3.max(m.values())))]);

    g.append("g").call(d3.axisLeft(yScale));
    g.append("g")
      .attr("transform", `translate(0,-10)`)
      .call(d3.axisTop(xScale))
      .selectAll("text")
      .attr("transform", "rotate(0)")
      .style("text-anchor", "center");

    g.selectAll(".y-grid")
      .data(visibleNames)
      .enter()
      .append("line")
      .attr("class", "y-grid")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", (d) => yScale(d) + yScale.bandwidth() / 2)
      .attr("y2", (d) => yScale(d) + yScale.bandwidth() / 2);

    g.selectAll(".x-grid")
      .data(types)
      .enter()
      .append("line")
      .attr("class", "x-grid")
      .attr("y1", 0)
      .attr("y2", height)
      .attr("x1", (d) => xScale(d) + xScale.bandwidth() / 2)
      .attr("x2", (d) => xScale(d) + xScale.bandwidth() / 2);

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    for (const [name, typeMap] of countMap) {
      if (!visibleNames.includes(name)) continue;
      for (const [type, count] of typeMap) {
        g.append("circle")
          .attr("cx", xScale(type) + xScale.bandwidth() / 2)
          .attr("cy", yScale(name) + yScale.bandwidth() / 2)
          .attr("r", 5)
          .attr("fill", colorScale(count))
          .attr("stroke", "none")
          .on("mouseover", function (event) {
            tooltip.transition().duration(100).style("opacity", 1);
            tooltip.html(`<strong>${name}</strong><br>${type}: <b>${count}</b> variações`);
          })
          .on("mousemove", function (event) {
            tooltip
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY - 20 + "px");
          })
          .on("mouseout", function () {
            tooltip.transition().duration(200).style("opacity", 0);
          });
      }
    }
  };

  return (
    <div className="DotHeatmap-container">
      <div className="controls">
        <button
          onClick={() => setFilterActive((prev) => !prev)}
          id="filter-multi-type"
        >
          {filterActive ? "Mostrar todas as músicas" : "Mostrar apenas músicas com mais de um tipo"}
        </button>
        <button
          id="nav-up"
          onClick={() => setStartIndex((prev) => Math.max(prev - pageSize, 0))}
        >
          ▲
        </button>
        <button
          id="nav-down"
          onClick={() => {
            const currentNames = filterActive ? getFilteredNames() : names;
            if (startIndex + pageSize < currentNames.length) {
              setStartIndex((prev) => prev + pageSize);
            }
          }}
        >
          ▼
        </button>
      </div>
      <svg ref={svgRef} width={1000} height={900} />
    </div>
  );
};

export default DotHeatmap;
