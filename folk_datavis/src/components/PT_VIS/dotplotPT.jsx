import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const fontText = getComputedStyle(document.documentElement)
  .getPropertyValue('--font-secondary')
  .trim();


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
    const imagesGroup = g.selectAll("g.images").data([null]).join("g").attr("class", "images");

    const rScale = d3.scaleSqrt().domain([1, d3.max(dadosProcessados, d => d.count)]).range([20, 60]);

    const regioesVisiveis = todasRegioes.slice(paginaRegiao * regioesPorPagina, (paginaRegiao + 1) * regioesPorPagina);
    const temasVisiveis = todosTemas.slice(paginaTema * temasPorPagina, (paginaTema + 1) * temasPorPagina);

    const xScale = d3.scalePoint().domain(regioesVisiveis).range([0, innerWidth]).padding(0.5);
    const yScale = d3.scalePoint().domain(temasVisiveis).range([0, innerHeight]).padding(0.5);

    eixoYGroup.call(d3.axisLeft(yScale));

    const visiveis = dadosProcessados.filter(
      d => temasVisiveis.includes(d.tema) && regioesVisiveis.includes(d.regiao)
    );

    const paths = imagesGroup.selectAll("path.flower1").data(visiveis, d => d.tema + d.regiao);

    // Remove os paths antigos
    paths.exit().remove();

    // Atualiza os paths existentes (se houver)
    paths
      .transition()
      .duration(500)
      .attr("transform", d => {
        const x = xScale(d.regiao) - rScale(d.count) / 2;
        const y = yScale(d.tema) - rScale(d.count) / 2;
        const scale = rScale(d.count) / 170;
        return `translate(${x}, ${y}) scale(${scale})`;
      });

    paths
      .enter()
      .append("path")
      .attr("class", "flower1")
      .attr("d", "M84.11,83.26c-7.25-7.17-13.98-12.9-20.19-17.4-7.28-9.86-13.1-23.1-10.41-38.76C58.37-1.17,91.17-3.59,105.45,4.61c9.18,5.27,22.85,24.06-3.08,59.58-9.91,7.41-16.33,16.23-18.26,19.06ZM141.5,53.51c-15.86-2.73-29.24,3.28-39.14,10.68-4.44,6.08-10.05,12.66-17.03,19.74,2.87,1.95,11.87,8.51,19.34,18.63,35.35,25.66,54.05,12.03,59.31,2.88,8.2-14.27,5.79-47.08-22.48-51.94ZM63.92,65.85c-35.35-25.66-54.05-12.03-59.31-2.88-8.2,14.27-5.79,47.08,22.48,51.94,15.86,2.73,29.24-3.28,39.14-10.68,4.44-6.08,10.05-12.66,17.03-19.74-2.87-1.95-11.87-8.51-19.34-18.63ZM84.11,83.26c-.41.6-.61.93-.61.93.01.01.02.02.03.03.26-.26.51-.52.77-.78-.06-.06-.12-.12-.18-.18ZM66.23,104.23c-25.93,35.52-12.26,54.31-3.08,59.58,14.27,8.2,47.08,5.79,51.94-22.48,2.69-15.67-3.13-28.91-10.41-38.76-6.21-4.51-12.93-10.24-20.19-17.4-1.93,2.84-8.35,11.65-18.26,19.06ZM84.29,83.44c.26.26.52.51.78.77.09-.09.18-.18.27-.27-.59-.4-.93-.61-.93-.61-.04.04-.08.08-.11.12ZM83.26,84.49c.59.4.93.61.93.61.04-.04.08-.08.11-.12-.26-.26-.52-.51-.78-.77-.09.09-.18.18-.27.27ZM84.49,85.17c.41-.6.61-.93.61-.93-.01-.01-.02-.02-.03-.03-.26.26-.51.52-.77.78.06.06.12.12.18.18Z")
      .attr("transform", d => {
        const x = xScale(d.regiao) - rScale(d.count) / 2;
        const y = yScale(d.tema) - rScale(d.count) / 2;
        const scale = rScale(d.count) / 170; // 170 é uma estimativa do tamanho original do path
        return `translate(${x}, ${y}) scale(${scale})`;
      })
      .style("fill", "#474E95")
      .style("cursor", "pointer")
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

    eixoYGroup
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .style("font-family", fontText)
      .yle("font-size", "14px"); // opcional


    g.selectAll(".x-axis").remove();
    g.append("g")
      .attr("class", "x-axis")
      .call(d3.axisTop(xScale).tickValues(regioesVisiveis))
      .selectAll("text")
      .attr("transform", "rotate(0)")
      .style("text-anchor", "center")
      .style("font-family", fontText)
      .style("font-size", "14px");
  }, [dadosProcessados, todosTemas, todasRegioes, paginaTema, paginaRegiao]);

  return (
    <div>
      <svg ref={svgRef} width={1200} height={800} />

      <div id="categoria-info" style={{ marginTop: "1rem", fontSize: "14px" }}></div>

      {/* Controles de temas */}
      <div style={{ marginTop: "20px" }}>
        <button onClick={() => setPaginaTema((p) => Math.max(p - 1, 0))} disabled={paginaTema === 0}>
          ← Temas
        </button>
        <span style={{ margin: "0 10px" }}>Página Tema {paginaTema + 1}</span>
        <button
          onClick={() =>
            setPaginaTema((p) => Math.min(p + 1, totalPaginasTemas - 1))
          }
          disabled={paginaTema >= totalPaginasTemas - 1}
        >
          Temas →
        </button>
      </div>

      {/* Controles de regiões */}
      <div style={{ marginTop: "10px" }}>
        <button onClick={() => setPaginaRegiao((p) => Math.max(p - 1, 0))} disabled={paginaRegiao === 0}>
          ← Regiões
        </button>
        <span style={{ margin: "0 10px" }}>Página Região {paginaRegiao + 1}</span>
        <button
          onClick={() =>
            setPaginaRegiao((p) => Math.min(p + 1, totalPaginasRegioes - 1))
          }
          disabled={paginaRegiao >= totalPaginasRegioes - 1}
        >
          Regiões →
        </button>
      </div>
    </div>
  );
};

export default GraficoTemasPorRegiao;
