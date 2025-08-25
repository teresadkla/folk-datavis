import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "../../css/dotplotPT.css";

const fontText = getComputedStyle(document.documentElement)
  .getPropertyValue('--font-secondary')
  .trim();

const temasPorPagina = 20;
const regioesPorPagina = 23;

const GraficoTemasPorRegiao = ({ active }) => {
  const svgRef = useRef();
  const [dadosProcessados, setDadosProcessados] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [todasRegioes, setTodasRegioes] = useState([]);
  const [paginaTema, setPaginaTema] = useState(0);
  const [paginaRegiao, setPaginaRegiao] = useState(0);
  const [prevActive, setPrevActive] = useState(false);
  const [prevPaginaTema, setPrevPaginaTema] = useState(0);
  const [prevPaginaRegiao, setPrevPaginaRegiao] = useState(0);

  const [todosInstrumentos, setTodosInstrumentos] = useState([]);
  const [instrumentosSelecionados, setInstrumentosSelecionados] = useState([]);
  const [dadosFiltrados, setDadosFiltrados] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [modoVisualizacao, setModoVisualizacao] = useState('temas');
  const [todasCategorias, setTodasCategorias] = useState([]);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState([]);
  const [isDropdownCategoriaOpen, setIsDropdownCategoriaOpen] = useState(false);
  const [dadosVisualizacao, setDadosVisualizacao] = useState([]);
  const [itensEixoY, setItensEixoY] = useState([]);

  const totalPaginasTemas = Math.ceil(itensEixoY.length / temasPorPagina);

  const processarDadosPorCategoria = (dados) => {
    const expandedData = [];
    dados.forEach(item => {
      if (item.Categorias) {
        const categorias = item.Categorias.split(",").map(c => c.trim());
        categorias.forEach(categoria => {
          if (categoria) {
            expandedData.push({
              ...item,
              CategoriaPrincipal: categoria
            });
          }
        });
      }
    });

    const counts = d3.rollups(
      expandedData,
      v => v.length,
      d => d.CategoriaPrincipal,
      d => d.Região
    );

    const processed = [];
    counts.forEach(([categoria, regiaoData]) => {
      regiaoData.forEach(([regiao, count]) => {
        const instrumentos = expandedData
          .filter(item => item.CategoriaPrincipal === categoria && item.Região === regiao)
          .map(item => item.Instrumento)
          .flatMap(instr => (instr ? instr.split(",").map(i => i.trim()) : []))
          .filter((v, i, a) => v && a.indexOf(v) === i);

        processed.push({
          tema: categoria,
          regiao,
          count,
          categoria,
          instrumentos
        });
      });
    });

    return processed;
  };

  const processarDadosPorInstrumento = (dados) => {
    const expandedData = [];
    dados.forEach(item => {
      if (item.Instrumento) {
        const instrumentos = item.Instrumento.split(",").map(i => i.trim());
        instrumentos.forEach(instrumento => {
          if (instrumento) {
            expandedData.push({
              ...item,
              InstrumentoPrincipal: instrumento
            });
          }
        });
      }
    });

    const counts = d3.rollups(
      expandedData,
      v => v.length,
      d => d.InstrumentoPrincipal,
      d => d.Região
    );

    const processed = [];
    counts.forEach(([instrumento, regiaoData]) => {
      regiaoData.forEach(([regiao, count]) => {
        const categoria = expandedData.find(
          d => d.InstrumentoPrincipal === instrumento && d.Região === regiao
        )?.Categorias ?? "";

        processed.push({
          tema: instrumento,
          regiao,
          count,
          categoria,
          instrumentos: [instrumento]
        });
      });
    });

    return processed;
  };

  useEffect(() => {
    d3.csv("VIMEO_V8.csv").then((data) => {
      const temaCount = d3.rollup(data, v => v.length, d => d.Tema);
      const temasRepetidos = new Set([...temaCount.entries()].filter(([_, c]) => c > 1).map(([t]) => t));
      const filtrados = data.filter(d => temasRepetidos.has(d.Tema));

      const allInstruments = filtrados
        .map(item => item.Instrumento)
        .flatMap(instr => (instr ? instr.split(",").map(i => i.trim()) : []))
        .filter((v, i, a) => v && a.indexOf(v) === i)
        .sort();

      setTodosInstrumentos(allInstruments);

      const allCategories = filtrados
        .map(item => item.Categorias)
        .filter(cat => cat)
        .flatMap(cat => cat.split(",").map(c => c.trim()))
        .filter((v, i, a) => v && a.indexOf(v) === i)
        .sort();

      setTodasCategorias(allCategories);

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

          const instrumentos = filtrados
            .filter(item => item.Tema === tema && item.Região === regiao)
            .map(item => item.Instrumento)
            .flatMap(instr => (instr ? instr.split(",").map(i => i.trim()) : []))
            .filter((v, i, a) => v && a.indexOf(v) === i);

          processed.push({ tema, regiao, count, categoria, instrumentos });
        });
      });

      setFilteredData(filtrados);
      setDadosProcessados(processed);
      setDadosFiltrados(processed);
      setDadosVisualizacao(processed);
      setTodasRegioes(Array.from(new Set(processed.map(d => d.regiao))).sort(d3.ascending));
      setItensEixoY(Array.from(new Set(processed.map(d => d.tema))).sort(d3.ascending));
    });
  }, []);

  useEffect(() => {
    let dadosParaProcessar = dadosFiltrados.length > 0 ?
      filteredData.filter(d => {
        const temaNaLista = dadosFiltrados.some(df => df.tema === d.Tema && df.regiao === d.Região);
        return temaNaLista;
      }) : filteredData;

    let novosdados = [];

    switch (modoVisualizacao) {
      case 'temas':
        novosdados = dadosProcessados;
        break;
      case 'categorias':
        novosdados = processarDadosPorCategoria(dadosParaProcessar);
        break;
      case 'instrumentos':
        novosdados = processarDadosPorInstrumento(dadosParaProcessar);
        break;
      default:
        novosdados = dadosProcessados;
    }

    if (instrumentosSelecionados.length > 0 && modoVisualizacao !== 'instrumentos') {
      novosdados = novosdados.filter(d =>
        instrumentosSelecionados.some(instrumento =>
          d.instrumentos && d.instrumentos.includes(instrumento)
        )
      );
    }

    if (categoriasSelecionadas.length > 0 && modoVisualizacao !== 'categorias') {
      novosdados = novosdados.filter(d =>
        categoriasSelecionadas.some(categoria =>
          d.categoria && d.categoria.includes(categoria)
        )
      );
    }

    setDadosVisualizacao(novosdados);
    setItensEixoY(Array.from(new Set(novosdados.map(d => d.tema))).sort(d3.ascending));

    setPaginaTema(0);
    setPaginaRegiao(0);
  }, [modoVisualizacao, dadosProcessados, filteredData, instrumentosSelecionados, categoriasSelecionadas, dadosFiltrados]);

  useEffect(() => {
    if (!active) {
      setPrevActive(false);
      return;
    }

    const svg = d3.select(svgRef.current);
    const width = +svg.attr("width");
    const height = +svg.attr("height");

    const margin = { top: 60, right: 60, bottom: 120, left: 200 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .selectAll("g.container")
      .data([null])
      .join("g")
      .attr("class", "container")
      .attr("transform", `translate(${margin.left}, ${(height - innerHeight) / 2 + 60})`);

    const eixoYGroup = g.selectAll("g.y-axis").data([null]).join("g").attr("class", "y-axis");
    const imagesGroup = g.selectAll("g.images").data([null]).join("g").attr("class", "images");

    let tooltip = d3.select("body").select(".dotplot-tooltip");
    if (tooltip.empty()) {
      tooltip = d3.select("body")
        .append("div")
        .attr("class", "dotplot-tooltip")
        .style("position", "absolute")
        .style("padding", "10px")
        .style("background", "white")
        .style("color", "white")
        .style("border-radius", "5px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("font-family", fontText)
        .style("font-size", "12px")
        .style("box-shadow", "0 2px 5px rgba(0,0,0,0.3)")
        .style("z-index", "1000");
    }

    const rScale = d3.scaleSqrt().domain([1, d3.max(dadosVisualizacao, d => d.count)]).range([30, 70]);

    const regioesVisiveis = todasRegioes.slice(paginaRegiao * regioesPorPagina, (paginaRegiao + 1) * regioesPorPagina);
    const temasVisiveis = itensEixoY.slice(paginaTema * temasPorPagina, (paginaTema + 1) * temasPorPagina);

    const xScale = d3.scalePoint().domain(regioesVisiveis).range([0, innerWidth]).padding(0.5);
    const yScale = d3.scalePoint().domain(temasVisiveis).range([0, innerHeight]).padding(0.5);

    const visiveis = dadosVisualizacao.filter(
      d => temasVisiveis.includes(d.tema) && regioesVisiveis.includes(d.regiao)
    );

    const paths = imagesGroup.selectAll("path.flower1").data(visiveis, d => d.tema + d.regiao);

    const isPageChange = (prevPaginaTema !== paginaTema || prevPaginaRegiao !== paginaRegiao);
    const shouldAnimate = !prevActive || (prevActive !== active && !isPageChange);

    setPrevPaginaTema(paginaTema);
    setPrevPaginaRegiao(paginaRegiao);

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

    const animatePaths = (selection, isNew = false) => {
      if (isPageChange) {
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

      selection
        .attr("transform", d => {
          const x = xScale(d.regiao) - rScale(d.count) / 2;
          const y = yScale(d.tema) - rScale(d.count) / 2;
          return `translate(${x}, ${y}) scale(0)`;
        })
        .style("opacity", 0);

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

    if (shouldAnimate) {
      animatePaths(paths);
    } else {
      paths
        .attr("transform", d => {
          const x = xScale(d.regiao) - rScale(d.count) / 2;
          const y = yScale(d.tema) - rScale(d.count) / 2;
          const scale = rScale(d.count) / 170;
          return `translate(${x}, ${y}) scale(${scale})`;
        });
    }

    const createTooltipContent = (d) => {
      const labelModo = modoVisualizacao.charAt(0).toUpperCase() + modoVisualizacao.slice(1, -1);
      
      let content = `
        <div style="margin-bottom: 5px;">
          <strong>${labelModo}:</strong> ${d.tema}
        </div>
        <div style="margin-bottom: 5px;">
          <strong>Região:</strong> ${d.regiao}
        </div>
        <div style="margin-bottom: 5px;">
          <strong>Ocorrências:</strong> ${d.count}
        </div>
      `;

      if (modoVisualizacao === 'temas' || modoVisualizacao === 'instrumentos') {
        if (d.categoria) {
          content += `
            <div style="margin-bottom: 5px;">
              <strong>Categoria:</strong> ${d.categoria}
            </div>
          `;
        }
      }

      if (d.instrumentos && d.instrumentos.length > 0 && modoVisualizacao !== 'instrumentos') {
        const instrumentosLimitados = d.instrumentos.slice(0, 3);
        const instrumentosTexto = instrumentosLimitados.join(", ");
        const maisInstrumentos = d.instrumentos.length > 3 ? ` (+${d.instrumentos.length - 3} mais)` : "";
        
        content += `
          <div style="margin-bottom: 5px;">
            <strong>Instrumentos:</strong> ${instrumentosTexto}${maisInstrumentos}
          </div>
        `;
      }

      return content;
    };

    const enterPaths = paths.enter()
      .append("path")
      .attr("class", "flower1")
      .attr("d", "M15.76,18.41C13.6,7.72,22.87.65,22.87.65c9.63,8.91,6.69,19.16,6.69,19.16,14.29-4.3,14.77,7.6,14.77,7.6-13.94-5.61-12.89,14.95-12.89,14.95,1.32,19.04-8.1,17.44-8.1,17.44-7.1.83-8.35-16.82-8.35-16.82C13.29,22,1.04,25.04,1.04,25.04c6.57-11.1,14.72-6.63,14.72-6.63Z")
      .style("fill", "#474E95")
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .style("fill", "#6A5ACD")
          .style("opacity", 0.9);

        tooltip
          .html(createTooltipContent(d))
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px")
          .transition()
          .duration(200)
          .style("opacity", 1);
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .style("fill", "#474E95")
          .style("opacity", 1);

        tooltip
          .transition()
          .duration(200)
          .style("opacity", 0);
      })
      .on("click", (event, d) => {
        tooltip.style("opacity", 0);
        
        const artistas = filteredData
          .filter(item => {
            switch (modoVisualizacao) {
              case 'temas':
                return item.Tema === d.tema && item.Região === d.regiao;
              case 'categorias':
                return item.Categorias && item.Categorias.includes(d.tema) && item.Região === d.regiao;
              case 'instrumentos':
                return item.Instrumento && item.Instrumento.includes(d.tema) && item.Região === d.regiao;
              default:
                return false;
            }
          })
          .map(item => item.Nome)
          .filter((v, i, a) => a.indexOf(v) === i);

        const instrumentos = filteredData
          .filter(item => {
            switch (modoVisualizacao) {
              case 'temas':
                return item.Tema === d.tema && item.Região === d.regiao;
              case 'categorias':
                return item.Categorias && item.Categorias.includes(d.tema) && item.Região === d.regiao;
              case 'instrumentos':
                return item.Instrumento && item.Instrumento.includes(d.tema) && item.Região === d.regiao;
              default:
                return false;
            }
          })
          .map(item => item.Instrumento)
          .flatMap(instr => (instr ? instr.split(",").map(i => i.trim()) : []))
          .filter((v, i, a) => v && a.indexOf(v) === i);

        const labelModo = modoVisualizacao.charAt(0).toUpperCase() + modoVisualizacao.slice(1, -1);

        d3.select("#categoria-info")
          .style("display", "block")
          .html(`
            <button class="close-button">✕</button>
            <div class="card">
              <div class="header">
                <strong>${labelModo}:</strong> ${d.tema}
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

    paths
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .style("fill", "#6A5ACD")
          .style("opacity", 0.9);

        tooltip
          .html(createTooltipContent(d))
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px")
          .transition()
          .duration(200)
          .style("opacity", 1);
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .style("fill", "#474E95")
          .style("opacity", 1);

        tooltip
          .transition()
          .duration(200)
          .style("opacity", 0);
      });

    enterPaths.selectAll("title").remove();
    paths.selectAll("title").remove();

    animatePaths(enterPaths, true);
    setPrevActive(true);

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

  }, [active, dadosVisualizacao, itensEixoY, todasRegioes, paginaTema, paginaRegiao, prevActive, prevPaginaTema, prevPaginaRegiao, modoVisualizacao]);

  return (
    <div className="dotplotPT-container">
      <div className="dotplotPT-filters">
        <div className="modo-visualizacao">
          <label>Eixo Y - Visualizar por:</label>
          <select
            value={modoVisualizacao}
            onChange={(e) => setModoVisualizacao(e.target.value)}
            className="modo-select"
          >
            <option value="temas">Temas</option>
            <option value="categorias">Categorias</option>
            <option value="instrumentos">Instrumentos</option>
          </select>
        </div>

        {modoVisualizacao !== 'categorias' && (
          <div className="categoria-filter">
            <button
              className="filter-button"
              onClick={() => setIsDropdownCategoriaOpen(!isDropdownCategoriaOpen)}
            >
              {categoriasSelecionadas.length === 0
                ? "Filtrar por Categoria"
                : `${categoriasSelecionadas.length} categoria(s) selecionada(s)`}
            </button>

            {isDropdownCategoriaOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <button
                    className="select-all-button"
                    onClick={() => {
                      if (categoriasSelecionadas.length === todasCategorias.length) {
                        setCategoriasSelecionadas([]);
                      } else {
                        setCategoriasSelecionadas([...todasCategorias]);
                      }
                    }}
                  >
                    {categoriasSelecionadas.length === todasCategorias.length
                      ? "Desselecionar Todos"
                      : "Selecionar Todos"}
                  </button>
                  <button
                    className="close-dropdown"
                    onClick={() => setIsDropdownCategoriaOpen(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="instrumento-list">
                  {todasCategorias.map(categoria => (
                    <label key={categoria} className="instrumento-item">
                      <input
                        type="checkbox"
                        checked={categoriasSelecionadas.includes(categoria)}
                        onChange={() => {
                          if (categoriasSelecionadas.includes(categoria)) {
                            setCategoriasSelecionadas(
                              categoriasSelecionadas.filter(c => c !== categoria)
                            );
                          } else {
                            setCategoriasSelecionadas([...categoriasSelecionadas, categoria]);
                          }
                        }}
                      />
                      {categoria}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {modoVisualizacao !== 'instrumentos' && (
          <div className="instrumento-filter">
            <button
              className="filter-button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {instrumentosSelecionados.length === 0
                ? "Filtrar por Instrumento"
                : `${instrumentosSelecionados.length} instrumento(s) selecionado(s)`}
            </button>

            {isDropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <button
                    className="select-all-button"
                    onClick={() => {
                      if (instrumentosSelecionados.length === todosInstrumentos.length) {
                        setInstrumentosSelecionados([]);
                      } else {
                        setInstrumentosSelecionados([...todosInstrumentos]);
                      }
                    }}
                  >
                    {instrumentosSelecionados.length === todosInstrumentos.length
                      ? "Desselecionar Todos"
                      : "Selecionar Todos"}
                  </button>
                  <button
                    className="close-dropdown"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="instrumento-list">
                  {todosInstrumentos.map(instrumento => (
                    <label key={instrumento} className="instrumento-item">
                      <input
                        type="checkbox"
                        checked={instrumentosSelecionados.includes(instrumento)}
                        onChange={() => {
                          if (instrumentosSelecionados.includes(instrumento)) {
                            setInstrumentosSelecionados(
                              instrumentosSelecionados.filter(i => i !== instrumento)
                            );
                          } else {
                            setInstrumentosSelecionados([...instrumentosSelecionados, instrumento]);
                          }
                        }}
                      />
                      {instrumento}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="dotplotPT-info">
        <svg ref={svgRef} width={1200} height={1000} />
        <div id="categoria-info" style={{ marginTop: "1rem", fontSize: "14px" }}></div>
      </div>

      <div className="dotplotPT-controls">
        <div>
          <button onClick={() => setPaginaTema((p) => Math.max(p - 1, 0))} disabled={paginaTema === 0}>
            ↑
          </button>
          <span style={{ margin: "0 10px" }}>
            {modoVisualizacao.charAt(0).toUpperCase() + modoVisualizacao.slice(1, -1)} {paginaTema + 1}
          </span>
          <button
            onClick={() => setPaginaTema((p) => Math.min(p + 1, totalPaginasTemas - 1))}
            disabled={paginaTema >= totalPaginasTemas - 1}
          >
            ↓
          </button>
        </div>
      </div>
    </div>
  );
};

export default GraficoTemasPorRegiao;