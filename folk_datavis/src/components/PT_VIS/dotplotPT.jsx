import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const TemaRegiaoVis = () => {
  const svgRef = useRef();
  const [paginaAtual, setPaginaAtual] = useState(0);
  const temasPorPagina = 10;

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const margin = { top: 60, right: 20, bottom: 120, left: 200 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    let processed = [];
    let filteredData = [];
    let todosTemas = [];
    let regioes = [];

    const g = svg
      .selectAll("g.container")
      .data([null])
      .join("g")
      .attr("class", "container")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const eixoYGroup = g.selectAll("g.y-axis").data([null]).join("g").attr("class", "y-axis");
    const circlesGroup = g.selectAll("g.circles").data([null]).join("g").attr("class", "circles");

    d3.csv("/VIMEO_V5.csv").then((data) => {
      const temaCount = d3.rollup(data, (v) => v.length, (d) => d.Tema);
      const temasRepetidos = new Set([...temaCount.entries()].filter(([_, c]) => c > 1).map(([t]) => t));
      filteredData = data.filter((d) => temasRepetidos.has(d.Tema));

      const counts = d3.rollups(
        filteredData,
        (v) => v.length,
        (d) => d.Tema,
        (d) => d.Região
      );

      counts.forEach(([tema, regiaoData]) => {
        regiaoData.forEach(([regiao, count]) => {
          const categoria = filteredData.find(
            (d) => d.Tema === tema && d.Região === regiao
          )?.Categorias ?? "";
          processed.push({ tema, regiao, count, categoria });
        });
      });

      regioes = Array.from(new Set(processed.map((d) => d.regiao)));
      todosTemas = Array.from(new Set(processed.map((d) => d.tema)));

      const xScale = d3.scalePoint().domain(regioes).range([0, innerWidth]).padding(0.5);
      const rScale = d3.scaleSqrt().domain([1, d3.max(processed, (d) => d.count)]).range([4, 30]);

      function atualizarPagina(curPage) {
        const paginas = todosTemas.slice(curPage * temasPorPagina, (curPage + 1) * temasPorPagina);
        const yScale = d3.scalePoint().domain(paginas).range([0, innerHeight]).padding(0.5);

        eixoYGroup.call(d3.axisLeft(yScale));

        const visiveis = processed.filter((d) => paginas.includes(d.tema));

        const circles = circlesGroup.selectAll("circle").data(visiveis, (d) => d.tema + d.regiao);

        circles.exit().remove();

        circles
          .transition()
          .duration(500)
          .attr("cx", (d) => xScale(d.regiao))
          .attr("cy", (d) => yScale(d.tema))
          .attr("r", (d) => rScale(d.count));

        circles
          .enter()
          .append("circle")
          .attr("cx", (d) => xScale(d.regiao))
          .attr("cy", (d) => yScale(d.tema))
          .attr("r", (d) => rScale(d.count))
          .attr("fill", "#4682B4")
          .on("click", (event, d) => {
            const artistas = filteredData
              .filter((item) => item.Tema === d.tema && item.Região === d.regiao)
              .map((item) => item.Nome)
              .filter((v, i, a) => a.indexOf(v) === i);

            const instrumentos = filteredData
              .filter((item) => item.Tema === d.tema && item.Região === d.regiao)
              .map((item) => item.Instrumento)
              .flatMap((instr) => (instr ? instr.split(",").map((i) => i.trim()) : []))
              .filter((v, i, a) => v && a.indexOf(v) === i);

            d3.select("#categoria-info").html(`
              <strong>Tema:</strong> ${d.tema} (${d.regiao})<br>
              <strong>Categoria:</strong> ${d.categoria}<br>
              <strong>Artistas:</strong> ${artistas.join(", ")}<br>
              <strong>Instrumentos:</strong> ${instrumentos.join(", ")}
            `);
          })
          .append("title")
          .text((d) => `${d.tema} (${d.regiao}): ${d.count}`);

        g.selectAll(".x-grid").remove();
        g.selectAll(".x-grid")
          .data(regioes)
          .enter()
          .append("line")
          .attr("class", "x-grid")
          .attr("x1", (d) => xScale(d))
          .attr("x2", (d) => xScale(d))
          .attr("y1", 0)
          .attr("y2", innerHeight)
          .attr("stroke", "#ccc")
          .attr("stroke-dasharray", "2,2");

        g.selectAll(".x-axis").remove();
        g.append("g")
          .attr("class", "x-axis")
          .call(d3.axisTop(xScale))
          .selectAll("text")
          .attr("transform", "rotate(-45)")
          .style("text-anchor", "start");
      }

      atualizarPagina(paginaAtual);

      // Force update when page changes
      window.__update = atualizarPagina;
    });
  }, [paginaAtual]);

  return (
    <div>
      <svg ref={svgRef} width={1000} height={600} />
      <div>
        <button onClick={() => setPaginaAtual((p) => Math.max(0, p - 1))}>Anterior</button>
        <button onClick={() => setPaginaAtual((p) => p + 1)}>Próxima</button>
      </div>
      <div id="categoria-info" />
    </div>
  );
};

export default TemaRegiaoVis;
