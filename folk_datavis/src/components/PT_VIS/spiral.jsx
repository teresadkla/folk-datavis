import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import "../../css/spiral.css";
import { act } from "react";

const SpiralVis = ({ active }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (!active) return;

    const svg = d3.select(svgRef.current);
    const width = +svg.attr("width");
    const height = +svg.attr("height");

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2}) scale(0.7)`);

    const tooltip = d3.select(tooltipRef.current);

    d3.csv("VIMEO_V8.csv").then((data) => {
      const filteredRaw = data.filter((d) => {
        const year = parseInt(d.Ano);
        return !isNaN(year) && d.Tema && d.Tema !== "#VALUE!";
      });

      filteredRaw.forEach((d) => {
        d.ano = parseInt(d.Ano);
      });

      filteredRaw.sort((a, b) => d3.ascending(a.ano, b.ano));

      const temaCounts = d3.rollup(filteredRaw, (v) => v.length, (d) => d.Tema);
      const filteredData = filteredRaw.filter(
        (d) => temaCounts.get(d.Tema) > 1
      );

      const uniqueYears = Array.from(new Set(filteredData.map(d => d.ano))).sort((a, b) => a - b);
      const colorPalette = d3.schemeTableau10.concat(d3.schemeSet3).slice(0, 17);
      const yearColor = d3.scaleOrdinal().domain(uniqueYears).range(colorPalette);

      const a = 5;
      const b = 10;
      const spacing = 15;

      const spiralPoints = [];
      let angle = 0;

      for (let i = 0; i < filteredData.length; i++) {
        const r = a + b * angle;
        const x = r * Math.cos(angle);
        const y = r * Math.sin(angle);

        filteredData[i].x = x;
        filteredData[i].y = y;
        spiralPoints.push({ x, y });

        const dr = b;
        const ds = Math.sqrt(r * r + dr * dr);
        angle += spacing / ds;
      }

      const spiralLine = d3.line()
        .x((d) => d.x)
        .y((d) => d.y)
        .curve(d3.curveCardinal);

      // Animação da espiral
      const spiralPath = g.append("path")
        .datum(spiralPoints)
        .attr("d", spiralLine)
        .attr("fill", "none")
        .attr("stroke", "#999")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", function () {
          const length = this.getTotalLength();
          return `${length} ${length}`;
        })
        .attr("stroke-dashoffset", function () {
          return this.getTotalLength();
        })
        .transition()
        .duration(3000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);

      const leafspath = "M6.62,89.93S-16.49,41.54,27.12,14.23c9.39-5.88,20.03-9.42,31.03-10.74,11.23-1.35,28.8-3.19,39.41-2.96,0,0-15.92,42.18-34.38,57.22S6.26,76.17,6.62,89.93Z";

      //Animação das folhas a aparecer em sequência
      g.selectAll(".custom-shape")
        .data(filteredData)
        .enter()
        .append("path")
        .attr("class", "custom-shape")
        .attr("d", leafspath)
        .attr("fill", (d) => yearColor(d.ano))
        .attr("opacity", 0)
        .attr("transform", (d) => {
          const scale = 0.15;
          const offsetX = -6.62;
          const offsetY = -89.93;
          return `translate(${d.x}, ${d.y}) scale(${scale}) translate(${offsetX}, ${offsetY})`;
        })
        .transition()
        .delay((d, i) => i * 5)
        .duration(300)
        .attr("opacity", 1);

      // Tooltip interativo
      g.selectAll(".custom-shape")
        .on("mouseover", (event, d) => {
          const containerRect = svgRef.current.parentNode.getBoundingClientRect();
          tooltip
            .style("opacity", 1)
            .html(`<strong>${d.Tema}</strong><br>Ano: ${d.Ano}`)
            .style("left", event.clientX - containerRect.left + 10 + "px")
            .style("top", event.clientY - containerRect.top - 20 + "px");
        })
        .on("mouseout", () => {
          tooltip.style("opacity", 0);
        })
        .on("click", function (event, clickedDatum) {
          const selectedTheme = clickedDatum.Tema;

          g.selectAll(".custom-shape")
            .transition()
            .duration(300)
            .attr("opacity", (d) => (d.Tema === selectedTheme ? 1 : 0.1));

          g.selectAll(".highlight-line").remove();

          const themePoints = filteredData
            .filter((d) => d.Tema === selectedTheme)
            .sort((a, b) => d3.ascending(a.ano, b.ano));

          if (themePoints.length > 1) {
            const line = d3.line()
              .x((d) => d.x)
              .y((d) => d.y);

            g.append("path")
              .datum(themePoints)
              .attr("class", "highlight-line")
              .attr("d", line)
              .attr("fill", "none")
              .attr("stroke", "#222")
              .attr("stroke-width", 2)
              .attr("stroke-dasharray", "4 2");
          }

          event.stopPropagation();
        });

      // ✨ Rótulos de ano com fade-in
      let lastYear = null;
      g.selectAll(".year-label")
        .data(filteredData)
        .enter()
        .filter((d) => {
          const year = d.ano;
          if (year !== lastYear) {
            lastYear = year;
            return true;
          }
          return false;
        })
        .append("text")
        .attr("x", (d) => d.x + 15)
        .attr("y", (d) => d.y)
        .text((d) => d.ano)
        .attr("font-size", "12px")
        .attr("fill", "#444")
        .attr("alignment-baseline", "middle")
        .attr("opacity", 0)
        .transition()
        .delay((d, i) => i * 50)
        .duration(400)
        .attr("opacity", 1);

      // Legenda
      const legendGroup = svg.append("g")
        .attr("transform", `translate(${width - 160}, ${height / 2 - uniqueYears.length * 10})`);

      uniqueYears.forEach((year, i) => {
        const legendRow = legendGroup.append("g")
          .attr("transform", `translate(0, ${i * 20})`);

        legendRow.append("rect")
          .attr("width", 14)
          .attr("height", 14)
          .attr("fill", yearColor(year));

        legendRow.append("text")
          .attr("x", 20)
          .attr("y", 11)
          .text(year)
          .style("font-size", "12px")
          .attr("alignment-baseline", "middle");
      });
    });

    svg.on("click", function (event) {
      if (event.target.tagName !== "path") {
        g.selectAll(".custom-shape")
          .transition()
          .duration(300)
          .attr("opacity", 1);
        g.selectAll(".highlight-line").remove();
      }
    });

    return () => {
      svg.selectAll("*").remove();
    };
  }, [active]);

  return (
    <div style={{ position: "relative" }}>
      <svg ref={svgRef} width={1500} height={1000}></svg>
      <div ref={tooltipRef} className="tooltip-spiral" />
    </div>
  );
};

export default SpiralVis;
