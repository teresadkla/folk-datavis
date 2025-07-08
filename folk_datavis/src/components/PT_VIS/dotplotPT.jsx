import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const temasPorPagina = 8;
const regioesPorPagina = 8;

const GraficoTemasPorRegiao = () => {
  const svgRef = useRef();
  const [dadosProcessados, setDadosProcessados] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [todosTemas, setTodosTemas] = useState([]);
  const [todasRegioes, setTodasRegioes] = useState([]);
  const [paginaTema, setPaginaTema] = useState(0);
  const [paginaRegiao, setPaginaRegiao] = useState(0);

const totalPaginasTemas = Math.ceil(todosTemas.length / temasPorPagina);
const totalPaginasRegioes = Math.ceil(todasRegioes.length / regioesPorPagina);


  // Carrega e processa os dados CSV apenas uma vez
  useEffect(() => {
    d3.csv("VIMEO_V8.csv").then((data) => {
      const temaCount = d3.rollup(data, v => v.length, d => d.Tema);
      const temasRepetidos = new Set([...temaCount.entries()].filter(([_, c]) => c > 1).map(([t]) => t));
      const filtrados = data.filter(d => temasRepetidos.has(d.Tema));

      const counts = d3.rollups(
        filtrados,
        v => v.length,
        d => d.Tema,
        d => d.Região
      );

      const processed = [];
      counts.forEach(([tema, regiaoData]) => {
        regiaoData.forEach(([regiao, count]) => {
          const categoria = filtrados.find(
            d => d.Tema === tema && d.Região === regiao
          )?.Categorias ?? "";
          processed.push({ tema, regiao, count, categoria });
        });
      });

      setFilteredData(filtrados);
      setDadosProcessados(processed);
      setTodosTemas(Array.from(new Set(processed.map(d => d.tema))).sort(d3.ascending));
      setTodasRegioes(Array.from(new Set(processed.map(d => d.regiao))).sort(d3.ascending));
    });
  }, []);

  // Atualiza o gráfico sempre que a página ou os dados mudam
  useEffect(() => {
    if (dadosProcessados.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = +svg.attr("width");
    const height = +svg.attr("height");

    const margin = { top: 60, right: 20, bottom: 120, left: 200 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .selectAll("g.container")
      .data([null])
      .join("g")
      .attr("class", "container")
      .attr("transform", `translate(${margin.left}, ${(height - innerHeight) / 2})`);

    const eixoYGroup = g.selectAll("g.y-axis").data([null]).join("g").attr("class", "y-axis");
    const circlesGroup = g.selectAll("g.circles").data([null]).join("g").attr("class", "circles");

    const rScale = d3.scaleSqrt().domain([1, d3.max(dadosProcessados, d => d.count)]).range([4, 30]);

    const regioesVisiveis = todasRegioes.slice(paginaRegiao * regioesPorPagina, (paginaRegiao + 1) * regioesPorPagina);
    const temasVisiveis = todosTemas.slice(paginaTema * temasPorPagina, (paginaTema + 1) * temasPorPagina);

    const xScale = d3.scalePoint().domain(regioesVisiveis).range([0, innerWidth]).padding(0.5);
    const yScale = d3.scalePoint().domain(temasVisiveis).range([0, innerHeight]).padding(0.5);

    eixoYGroup.call(d3.axisLeft(yScale));

    const visiveis = dadosProcessados.filter(
      d => temasVisiveis.includes(d.tema) && regioesVisiveis.includes(d.regiao)
    );

    const circles = circlesGroup.selectAll("circle").data(visiveis, d => d.tema + d.regiao);

    circles.exit().remove();

    circles
      .transition()
      .duration(500)
      .attr("cx", d => xScale(d.regiao))
      .attr("cy", d => yScale(d.tema))
      .attr("r", d => rScale(d.count));

    circles
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.regiao))
      .attr("cy", d => yScale(d.tema))
      .attr("r", d => rScale(d.count))
      .attr("fill", "#4682B4")
      .on("click", (event, d) => {
        const artistas = filteredData
          .filter(item => item.Tema === d.tema && item.Região === d.regiao)
          .map(item => item.Nome)
          .filter((v, i, a) => a.indexOf(v) === i);

        const instrumentos = filteredData
          .filter(item => item.Tema === d.tema && item.Região === d.regiao)
          .map(item => item.Instrumento)
          .flatMap(instr => (instr ? instr.split(",").map(i => i.trim()) : []))
          .filter((v, i, a) => v && a.indexOf(v) === i);

        d3.select("#categoria-info").html(`
          <strong>Tema:</strong> ${d.tema} (${d.regiao})<br>
          <strong>Categoria:</strong> ${d.categoria}<br>
          <strong>Artistas:</strong> ${artistas.join(", ")}<br>
          <strong>Instrumentos:</strong> ${instrumentos.join(", ")}
        `);
      })
      .append("title")
      .text(d => `${d.tema} (${d.regiao}): ${d.count}`);

    g.selectAll(".x-grid").remove();
    g.selectAll(".x-grid")
      .data(regioesVisiveis)
      .enter()
      .append("line")
      .attr("class", "x-grid")
      .attr("x1", d => xScale(d))
      .attr("x2", d => xScale(d))
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "#ccc")
      .attr("stroke-dasharray", "2,2");

    g.selectAll(".x-axis").remove();
    g.append("g")
      .attr("class", "x-axis")
      .call(d3.axisTop(xScale).tickValues(regioesVisiveis))
      .selectAll("text")
      .attr("transform", "rotate(0)")
      .style("text-anchor", "center");
  }, [dadosProcessados, todosTemas, todasRegioes, paginaTema, paginaRegiao]);

  return (
  <div>
    <svg ref={svgRef} width={1200} height={800} />
    
    <div id="categoria-info" style={{ marginTop: "1rem", fontSize: "14px" }}></div>

    {/* Controles de temas */}
    <div style={{ marginTop: "20px" }}>
      <button
        onClick={() => setPaginaTema((p) => Math.max(p - 1, 0))}
        disabled={paginaTema === 0}
      >
        ← Temas
      </button>
      <span style={{ margin: "0 10px" }}>Página Tema {paginaTema + 1}</span>
      <button
        onClick={() =>
          setPaginaTema((p) => Math.min(p + 1, Math.ceil(todosTemas.length / temasPorPagina) - 1))
        }
        disabled={paginaTema >= Math.ceil(todosTemas.length / temasPorPagina) - 1}
      >
        Temas →
      </button>
    </div>

    {/* Controles de regiões */}
    <div style={{ marginTop: "10px" }}>
      <button
        onClick={() => setPaginaRegiao((p) => Math.max(p - 1, 0))}
        disabled={paginaRegiao === 0}
      >
        ← Regiões
      </button>
      <span style={{ margin: "0 10px" }}>Página Região {paginaRegiao + 1}</span>
      <button
        onClick={() =>
          setPaginaRegiao((p) => Math.min(p + 1, Math.ceil(todasRegioes.length / regioesPorPagina) - 1))
        }
        disabled={paginaRegiao >= Math.ceil(todasRegioes.length / regioesPorPagina) - 1}
      >
        Regiões →
      </button>
    </div>
  </div>
);

};

export default GraficoTemasPorRegiao;
