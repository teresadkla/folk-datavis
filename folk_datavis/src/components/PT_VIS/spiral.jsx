import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import "../../css/spiral.css";

const SpiralVis = () => {
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    // Seleciona o SVG e define dimensões
    const svg = d3.select(svgRef.current);
    const width = +svg.attr("width");
    const height = +svg.attr("height");

    // Cria um grupo centralizado para desenhar a espiral
    const g = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2}) scale(0.7)`);


    // Seleciona o tooltip (dica de ferramenta)
    const tooltip = d3.select(tooltipRef.current);
    // Escala de cores para os temas
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Configura o zoom e pan
    // const zoom = d3.zoom()
    //   .scaleExtent([0.5, 10])
    //   .on("zoom", (event) => {
    //     g.attr("transform", event.transform);
    //   });

    // svg.call(zoom);

    // Carrega os dados do CSV
    d3.csv("VIMEO_V6.csv").then(data => {
      // Filtra dados inválidos (Ano não numérico ou Tema inválido)
      const filteredRaw = data.filter(d => {
        const year = parseInt(d.Ano);
        return !isNaN(year) && d.Tema && d.Tema !== "#VALUE!";
      });

      // Converte Ano para número
      filteredRaw.forEach(d => {
        d.ano = parseInt(d.Ano);
      });

      // Ordena cronologicamente
      filteredRaw.sort((a, b) => d3.ascending(a.ano, b.ano));

      // Mantém apenas temas com mais de uma ocorrência
      const temaCounts = d3.rollup(filteredRaw, v => v.length, d => d.Tema);
      const filteredData = filteredRaw.filter(d => temaCounts.get(d.Tema) > 1);

      // Parâmetros da espiral (a = raio inicial, b = espaçamento radial, spacing = distância angular)
      const a = 5;
      const b = 10;
      const spacing = 15;

      const spiralPoints = [];
      let angle = 0;

      // Calcula as posições (x, y) de cada ponto na espiral
      for (let i = 0; i < filteredData.length; i++) {
        const r = a + b * angle;
        const x = r * Math.cos(angle);
        const y = r * Math.sin(angle);

        filteredData[i].x = x;
        filteredData[i].y = y;
        spiralPoints.push({ x, y });

        // Atualiza o ângulo para o próximo ponto
        const dr = b;
        const ds = Math.sqrt(r * r + dr * dr);
        angle += spacing / ds;
      }

      // Cria a linha da espiral
      const spiralLine = d3.line()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveCardinal);

      // Desenha a espiral
      g.append("path")
        .datum(spiralPoints)
        .attr("d", spiralLine)
        .attr("fill", "none")
        .attr("stroke", "#999")
        .attr("stroke-width", 1);

      // Desenha os círculos (pontos) para cada dado
      g.selectAll("circle")
        .data(filteredData)
        .enter()
        .append("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 7)
        .attr("fill", d => color(d.Tema))
        .attr("opacity", 1)
        // Mostra tooltip ao passar o mouse
        .on("mouseover", (event, d) => {
          const containerRect = svgRef.current.parentNode.getBoundingClientRect();
          tooltip.style("opacity", 1)
            .html(`<strong>${d.Tema}</strong><br>Ano: ${d.Ano}`)
            .style("left", (event.clientX - containerRect.left + 10) + "px")
            .style("top", (event.clientY - containerRect.top - 20) + "px");
        })
        // Esconde tooltip ao sair do mouse
        .on("mouseout", () => {
          tooltip.style("opacity", 0);
        })
        // Ao clicar em um círculo, destaca o tema e liga os pontos desse tema
        .on("click", function (event, clickedDatum) {
          const selectedTheme = clickedDatum.Tema;

          // Destaca apenas os círculos do tema selecionado
          g.selectAll("circle")
            .transition()
            .duration(300)
            .attr("opacity", d => d.Tema === selectedTheme ? 1 : 0.1);

          // Remove linha de destaque anterior
          g.selectAll(".highlight-line").remove();

          // Seleciona e ordena os pontos do tema selecionado
          const themePoints = filteredData
            .filter(d => d.Tema === selectedTheme)
            .sort((a, b) => d3.ascending(a.ano, b.ano));

          // Se houver mais de um ponto, desenha a linha ligando-os
          if (themePoints.length > 1) {
            const line = d3.line()
              .x(d => d.x)
              .y(d => d.y);

            g.append("path")
              .datum(themePoints)
              .attr("class", "highlight-line")
              .attr("d", line)
              .attr("fill", "none")
              .attr("stroke", "#222")
              .attr("stroke-width", 2)
              .attr("stroke-dasharray", "4 2");
          }

          // Impede propagação do clique para o SVG
          event.stopPropagation();
        });

      // Adiciona rótulos de ano (um por ano)
      let lastYear = null;
      g.selectAll(".year-label")
        .data(filteredData)
        .enter()
        .filter(d => {
          // Só adiciona rótulo se o ano for diferente do anterior
          const year = d.ano;
          if (year !== lastYear) {
            lastYear = year;
            return true;
          }
          return false;
        })
        .append("text")
        .attr("x", d => d.x + 15)
        .attr("y", d => d.y)
        .text(d => d.ano)
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr("fill", "#444")
        .attr("alignment-baseline", "middle");
    });

    // Ao clicar fora dos círculos, remove destaque e linhas
    svg.on("click", function (event) {
      if (event.target.tagName !== "circle") {
        g.selectAll("circle")
          .transition()
          .duration(300)
          .attr("opacity", 1);
        g.selectAll(".highlight-line").remove();
      }
    });

    // Limpa o SVG ao desmontar o componente
    return () => {
      svg.selectAll("*").remove();
    };
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <svg ref={svgRef} width={1500} height={1000}></svg>
      <div
        ref={tooltipRef}
        className="tooltip-spiral"
        // Tooltip para mostrar informações ao passar o mouse
      />
    </div>
  );
};

export default SpiralVis;
