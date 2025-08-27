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

  useEffect(() => {
    if (!active) return;

    const svg = d3.select(svgRef.current);
    const width = +svg.attr("width");
    const height = +svg.attr("height");

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2}) scale(0.7)`);

    // Criar o tooltip dinamicamente apenas quando necessário
    let tooltip = null;

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

      // Calcula a escala para o tamanho das pétalas baseada no número de ocorrências
      const maxOccurrences = d3.max(Array.from(temaCounts.values()));
      const minOccurrences = d3.min(Array.from(temaCounts.values()));
      const sizeScale = d3.scaleLinear()
        .domain([minOccurrences, maxOccurrences])
        .range([0.5, 1.5]); // Tamanho mínimo 0.5x e máximo 1.5x

      const uniqueYears = Array.from(new Set(filteredData.map(d => d.ano))).sort((a, b) => a - b);
      
      // Nova paleta de cores dividida em três períodos de 6 anos cada
      const colors = ["#E09D2C", "#C33512", "#474E95"];  // Amarelo, Vermelho, Azul
      
      // Função para obter a cor baseada no período do ano
      const yearColor = (ano) => {
        const yearIndex = uniqueYears.indexOf(ano);
        const totalYears = uniqueYears.length;
        
        // Divide os anos em 3 períodos iguais
        if (yearIndex < Math.floor(totalYears / 3)) {
          return colors[0]; // #E09D2C (amarelo) - primeiros 6 anos
        } else if (yearIndex < Math.floor(2 * totalYears / 3)) {
          return colors[1]; // #C33512 (vermelho) - 6 anos intermédios
        } else {
          return colors[2]; // #474E95 (azul) - últimos 6 anos
        }
      };

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

      const leafspath = "M22.31.51C10.72.94-.51,29.44.57,30.05c.38.21,1.47-3.48,6.15-7.74,8.75-7.95,16.98-5.9,20.5-12.89.24-.47,2.29-4.63.52-7.08-1.44-1.99-4.68-1.86-5.43-1.84Z";

      //Animação das folhas a aparecer em sequência
      g.selectAll(".custom-shape")
        .data(filteredData)
        .enter()
        .append("path")
        .attr("class", "custom-shape")
        .attr("d", leafspath)
        .attr("fill", (d) => yearColor(d.ano))
        // .attr("stroke", "rgba(255, 255, 255, 0)")
        // .attr("stroke-width", "10px")
        .style("cursor", "pointer")
        .attr("opacity", 0)
        .attr("transform", (d, i) => {
          // Calcula a escala baseada no número de ocorrências do tema
          const themeOccurrences = temaCounts.get(d.Tema);
          const scale = 0.8 * sizeScale(themeOccurrences);
          
          // Use the actual bottom point coordinates of the leaf (0.57, 30.05)
          const offsetX = 0.57;
          const offsetY = -30.05;
          
          // Calcula o ângulo da espiral para orientar a folha
          const angle = Math.atan2(d.y, d.x);
          
          // Alterna a orientação: par aponta para fora, ímpar para dentro com maior separação
          const baseAngle = angle * 180 / Math.PI;
          const rotation = i % 2 === 0 ? baseAngle - 140 : baseAngle + 80;
          
          return `translate(${d.x}, ${d.y}) rotate(${rotation}) scale(${scale}) translate(${offsetX}, ${offsetY})`;
        })
        .transition()
        .delay((d, i) => i * 5)
        .duration(300)
        .attr("opacity", 1);

      // Tooltip interativo - agora mostra também o número de ocorrências
      g.selectAll(".custom-shape")
        .on("mouseover", (event, d) => {
          // Criar tooltip se não existir
          if (!tooltip) {
            tooltip = d3.select("body")
              .append("div")
              .attr("class", "tooltip-spiral")
              .style("opacity", 0)
              .style("position", "absolute")
              .style("z-index", "1000")
              .style("background", "white")
              .style("color", "black")
              .style("padding", "5px 10px")
              .style("border-radius", "5px")
              .style("pointer-events", "none")
              .style("font-size", "12px");
          }

          const themeOccurrences = temaCounts.get(d.Tema);
          tooltip
            .style("opacity", 1)
            .html(`<strong>${d.Tema}</strong><br>Ano: ${d.Ano}<br>Ocorrências: ${themeOccurrences}`)
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 20 + "px");
        })
        .on("mouseout", () => {
          if (tooltip) {
            tooltip.style("opacity", 0);
          }
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
        .attr("font-size", "14px")
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
      // Remover tooltip se existir
      if (tooltip) {
        tooltip.remove();
      }
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
    <div style={{ position: "relative", display: "flex", gap: "20px" }}>
      <svg ref={svgRef} width={1500} height={1000}></svg>
    </div>
  );
};

export default SpiralVis;
