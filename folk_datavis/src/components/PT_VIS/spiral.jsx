import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import "../../css/spiral.css";
import { act } from "react";

// Carrega o script do Perlin noise a partir da pasta public (usado para animar linhas curvas)
const script = document.createElement('script');
script.src = '/perlin.js';
document.head.appendChild(script);

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

      const leafspath = "M142.54,71.27c0,39.36-31.91,71.27-71.27,71.27S0,110.64,0,71.27,31.91,0,71.27,0s71.27,31.91,71.27,71.27Z";

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
            // Desenha linhas com Perlin noise entre cada par de pontos consecutivos
            for (let i = 0; i < themePoints.length - 1; i++) {
              g.append("path")
                .attr("class", "highlight-line")
                .attr("fill", "none")
                .attr("stroke", "#6B3F21")
                .attr("stroke-width", 2.5)
                .attr("d", createPerlinLine(
                  themePoints[i].x, themePoints[i].y,
                  themePoints[i + 1].x, themePoints[i + 1].y
                ));
            }
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

  // Função para criar linhas curvas com Perlin noise entre pontos
  const createPerlinLine = (sourceX, sourceY, targetX, targetY) => {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;
    const perpX = -dy / distance;
    const perpY = dx / distance;
    const curveIntensity = Math.min(distance * 0.5, 50);
    const time = Date.now() * 0.00001;
    const noiseScale = 0.02;
    // Aplica Perlin noise ao ponto de controlo da curva
    const perlinOffset = window.noise ? window.noise.perlin3(midX * noiseScale, midY * noiseScale, time) * 100 : 0;
    const controlX = midX + (perpX * curveIntensity) + perlinOffset;
    const controlY = midY + (perpY * curveIntensity) + perlinOffset;

    // Gera a linha curva com vários segmentos e ruído
    const segments = 300;
    let path = `M ${sourceX} ${sourceY}`;
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const mt = 1 - t;
      const x = mt * mt * sourceX + 2 * mt * t * controlX + t * t * targetX;
      const y = mt * mt * sourceY + 2 * mt * t * controlY + t * t * targetY;
      const segmentNoise = window.noise ? window.noise.perlin3(x * noiseScale * 2, y * noiseScale * 2, time) * 8 : 0;
      const segmentNoiseY = window.noise ? window.noise.perlin3(y * noiseScale * 2, x * noiseScale * 2, time + 100) * 8 : 0;
      path += ` L ${x + segmentNoise} ${y + segmentNoiseY}`;
    }

    return path;
  };

  return (
    <div style={{ position: "relative" }}>
      <svg ref={svgRef} width={1500} height={1000}></svg>
      <div ref={tooltipRef} className="tooltip-spiral" />
    </div>
  );
};

export default SpiralVis;
