import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "../../css/mapstyles.css";

const fontText = getComputedStyle(document.documentElement)
  .getPropertyValue('--font-secondary')
  .trim();

const temasPorPagina = 20;
const regioesPorPagina = 23;

const GraficoTemasPorRegiao = ({ active }) => {
  const svgRef = useRef();
  const [dadosProcessados, setDadosProcessados] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [todosTemas, setTodosTemas] = useState([]);
  const [todasRegioes, setTodasRegioes] = useState([]);
  const [paginaTema, setPaginaTema] = useState(0);
  const [paginaRegiao, setPaginaRegiao] = useState(0);
  const [prevActive, setPrevActive] = useState(false); // Track previous active state
  const [prevPaginaTema, setPrevPaginaTema] = useState(0); // Track previous tema page
  const [prevPaginaRegiao, setPrevPaginaRegiao] = useState(0); // Track previous regiao page

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
    if (!active) {
      setPrevActive(false);
      return;
    }

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

    // Determine if animation should occur - only when first loading or when active state changes
    // Not when just navigating between pages
    const isPageChange = (prevPaginaTema !== paginaTema || prevPaginaRegiao !== paginaRegiao);
    const shouldAnimate = !prevActive || (prevActive !== active && !isPageChange);

    // Update previous page states for next render
    setPrevPaginaTema(paginaTema);
    setPrevPaginaRegiao(paginaRegiao);
    
    // Remove old paths
    paths.exit()
      .transition()
      .duration(isPageChange ? 0 : 300)
      .style("opacity", 0)
      .attr("transform", d => {
        const x = xScale(d.regiao) - rScale(d.count) / 2;
        const y = yScale(d.tema) - rScale(d.count) / 2;
        return `translate(${x}, ${y}) scale(0)`;
      })
      .remove();

    // Function to apply animation to any path selection
    const animatePaths = (selection, isNew = false) => {
      if (isPageChange) {
        // If just changing pages, don't animate - just place elements in final position
        selection
          .attr("transform", d => {
            const x = xScale(d.regiao) - rScale(d.count) / 2;
            const y = yScale(d.tema) - rScale(d.count) / 2;
            const scale = rScale(d.count) / 170;
            return `translate(${x}, ${y}) scale(${scale})`;
          })
          .style("opacity", 1);
        return;
      }

      // Define initial positions for animation
      selection
        .attr("transform", d => {
          const x = xScale(d.regiao) - rScale(d.count) / 2;
          const y = yScale(d.tema) - rScale(d.count) / 2;
          return `translate(${x}, ${y}) scale(0)`;
        })
        .style("opacity", 0);

      // Apply animation
      selection
        .transition()
        .duration(700)
        .ease(d3.easeBackOut)
        .attr("transform", d => {
          const x = xScale(d.regiao) - rScale(d.count) / 2;
          const y = yScale(d.tema) - rScale(d.count) / 2;
          const scale = rScale(d.count) / 170;
          return `translate(${x}, ${y}) scale(${scale})`;
        })
        .style("opacity", 1);
    };

    // For existing paths, animate only if shouldAnimate is true
    if (shouldAnimate) {
      animatePaths(paths);
    } else {
      // If no animation needed, just update positions
      paths
        .attr("transform", d => {
          const x = xScale(d.regiao) - rScale(d.count) / 2;
          const y = yScale(d.tema) - rScale(d.count) / 2;
          const scale = rScale(d.count) / 170;
          return `translate(${x}, ${y}) scale(${scale})`;
        });
    }

    // Adiciona os novos paths
    const enterPaths = paths.enter()
      .append("path")
      .attr("class", "flower1")
      .attr("d", "M84.11,83.26c-7.25-7.17-13.98-12.9-20.19-17.4-7.28-9.86-13.1-23.1-10.41-38.76C58.37-1.17,91.17-3.59,105.45,4.61c9.18,5.27,22.85,24.06-3.08,59.58-9.91,7.41-16.33,16.23-18.26,19.06ZM141.5,53.51c-15.86-2.73-29.24,3.28-39.14,10.68-4.44,6.08-10.05,12.66-17.03,19.74,2.87,1.95,11.87,8.51,19.34,18.63,35.35,25.66,54.05,12.03,59.31,2.88,8.2-14.27,5.79-47.08-22.48-51.94ZM63.92,65.85c-35.35-25.66-54.05-12.03-59.31-2.88-8.2,14.27-5.79,47.08,22.48,51.94,15.86,2.73,29.24-3.28,39.14-10.68,4.44-6.08,10.05-12.66,17.03-19.74-2.87-1.95-11.87-8.51-19.34-18.63ZM84.11,83.26c-.41.6-.61.93-.61.93.01.01.02.02.03.03.26-.26.51-.52.77-.78-.06-.06-.12-.12-.18-.18ZM66.23,104.23c-25.93,35.52-12.26,54.31-3.08,59.58,14.27,8.2,47.08,5.79,51.94-22.48,2.69-15.67-3.13-28.91-10.41-38.76-6.21-4.51-12.93-10.24-20.19-17.4-1.93,2.84-8.35,11.65-18.26,19.06ZM84.29,83.44c.26.26.52.51.78.77.09-.09.18-.18.27-.27-.59-.4-.93-.61-.93-.61-.04.04-.08.08-.11.12ZM83.26,84.49c.59.4.93.61.93.61.04-.04.08-.08.11-.12-.26-.26-.52-.51-.78-.77-.09.09-.18.18-.27.27ZM84.49,85.17c.41-.6.61-.93.61-.93-.01-.01-.02-.02-.03-.03-.26.26-.51.52-.77.78.06.06.12.12.18.18Z")
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

        d3.select("#categoria-info")
          .style("display", "block")
          .html(`
            <button class="close-button">✕</button>
            <div class="card">
              <div class="header">
                <strong>Tema:</strong> ${d.tema}
                <span class="regiao">${d.regiao}</span>
              </div>
              <hr>
              <div class="section">
                <strong>Categoria:</strong>
                <ul><li>${d.categoria}</li></ul>
              </div>
              <div class="section">
                <strong>Artistas:</strong>
                <ul>${artistas.map(nome => `<li>${nome}</li>`).join("")}</ul>
              </div>
              <div class="section">
                <strong>Instrumentos:</strong>
                <ul>${instrumentos.map(instr => `<li>${instr}</li>`).join("")}</ul>
              </div>
            </div>
          `);

        d3.select("#categoria-info .close-button").on("click", () => {
          d3.select("#categoria-info").style("display", "none");
        });
      });

    // Adiciona o title aos novos paths
    enterPaths.append("title").text(d => `${d.tema} (${d.regiao}): ${d.count}`);

    // Anima os novos paths
    animatePaths(enterPaths, true);

    // Atualiza estado de controle
    setPrevActive(true);

    // Resto do código para grade e eixos permanece igual...
    g.selectAll(".x-grid").remove();
    g.selectAll(".y-grid").remove();

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
      .attr("stroke-dasharray", "2,2")
      .style("opacity", 0);

    g.selectAll(".y-grid")
      .data(temasVisiveis)
      .enter()
      .append("line")
      .attr("class", "y-grid")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", d => yScale(d))
      .attr("y2", d => yScale(d))
      .attr("stroke", "#eee")
      .attr("stroke-dasharray", "2,2")
      .style("opacity", 0);

    g.selectAll(".x-grid, .y-grid")
      .transition()
      .duration(600)
      .style("opacity", 1);

    imagesGroup.raise();

    eixoYGroup.call(d3.axisLeft(yScale));
    eixoYGroup.selectAll("text")
      .style("font-family", fontText)
      .style("font-size", "12px")
      .style("opacity", 0)
      .transition()
      .duration(600)
      .style("opacity", 1);

    g.selectAll(".x-axis").remove();
    g.append("g")
      .attr("class", "x-axis")
      .call(d3.axisTop(xScale).tickValues(regioesVisiveis))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "start")
      .style("font-family", fontText)
      .style("font-size", "12px")
      .style("opacity", 0)
      .transition()
      .duration(600)
      .style("opacity", 1);

  }, [active, dadosProcessados, todosTemas, todasRegioes, paginaTema, paginaRegiao, prevActive, prevPaginaTema, prevPaginaRegiao]);

  return (
    <div className="dotplotPT-container">
      <div className="dotplotPT-info">
        <svg ref={svgRef} width={1200} height={800} />
        <div id="categoria-info" style={{ marginTop: "1rem", fontSize: "14px" }}></div>
      </div>

      <div className="dotplotPT-controls">
        <div>
          <button onClick={() => setPaginaTema((p) => Math.max(p - 1, 0))} disabled={paginaTema === 0}>
            ↑
          </button>
          <span style={{ margin: "0 10px" }}>Página Tema {paginaTema + 1}</span>
          <button
            onClick={() => setPaginaTema((p) => Math.min(p + 1, totalPaginasTemas - 1))}
            disabled={paginaTema >= totalPaginasTemas - 1}
          >
            ↓
          </button>
        </div>

        <div>
          <button onClick={() => setPaginaRegiao((p) => Math.max(p - 1, 0))} disabled={paginaRegiao === 0}>
            ←
          </button>
          <span style={{ margin: "0 10px" }}>Página Região {paginaRegiao + 1}</span>
          <button
            onClick={() => setPaginaRegiao((p) => Math.min(p + 1, totalPaginasRegioes - 1))}
            disabled={paginaRegiao >= totalPaginasRegioes - 1}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};

export default GraficoTemasPorRegiao;