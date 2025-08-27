import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import "../../css/dotplottypes.css";

const fontText = getComputedStyle(document.documentElement)
  .getPropertyValue('--font-secondary')
  .trim();

// Margens do gráfico
const margin = { top: 100, right: 50, bottom: 20, left: 400 };
// Número de linhas exibidas por página
const pageSize = 20;

const DotPlotTypes = () => {
  const svgRef = useRef();
  // Estados para armazenar dados e configurações
  const [data, setData] = useState([]);
  const [startIndex, setStartIndex] = useState(0); // Índice inicial para paginação
  const [filterActive, setFilterActive] = useState(false); // Filtro de músicas com mais de um tipo
  const [isLoading, setIsLoading] = useState(true); // Estado de carregamento
  const [loadingText, setLoadingText] = useState("Carregando dados..."); // Texto do loading
  // Add a new state to track the animation mode
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const [showLegend, setShowLegend] = useState(false); // Estado para mostrar/ocultar legenda

  // Novos estados para o sistema de visualização
  const [viewMode, setViewMode] = useState('songs'); // 'songs', 'mode', 'meter'
  const [showFilters, setShowFilters] = useState(false);
  const [showViewModeDropdown, setShowViewModeDropdown] = useState(false); // Novo estado
  const [selectedMeters, setSelectedMeters] = useState([]);
  const [selectedModes, setSelectedModes] = useState([]);

  // Carrega e processa os dados CSV ao montar o componente
  useEffect(() => {
    setIsLoading(true);
    setLoadingText("Carregando dados musicais...");

    d3.csv("sets.csv")
      .then(csvData => {
        setLoadingText("Processando informações...");

        setTimeout(() => {
          setData(csvData);
          setLoadingText("Finalizando...");

          setTimeout(() => {
            setIsLoading(false);
          }, 500);
        }, 300);
      })
      .catch(error => {
        console.error("Erro ao carregar dados:", error);
        setLoadingText("Erro ao carregar dados");
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      });
  }, []);

  // Memoriza nomes, tipos e countMap baseado no modo de visualização
  const processedData = useMemo(() => {
    if (!data.length) return { names: [], types: [], countMap: new Map() };

    let filteredData = [...data];

    // Aplicar filtros baseados no modo de visualização
    if (viewMode === 'songs') {
      if (selectedMeters.length > 0) {
        filteredData = filteredData.filter(d => selectedMeters.includes(d.meter));
      }
      if (selectedModes.length > 0) {
        filteredData = filteredData.filter(d => selectedModes.includes(d.mode));
      }
    } else if (viewMode === 'mode') {
      if (selectedMeters.length > 0) {
        filteredData = filteredData.filter(d => selectedMeters.includes(d.meter));
      }
    } else if (viewMode === 'meter') {
      if (selectedModes.length > 0) {
        filteredData = filteredData.filter(d => selectedModes.includes(d.mode));
      }
    }

    const types = Array.from(new Set(filteredData.map(d => d.type))).sort();
    let names, countMap;

    if (viewMode === 'songs') {
      names = Array.from(new Set(filteredData.map(d => d.name))).sort();
      countMap = d3.rollup(
        filteredData,
        v => v.length,
        d => d.name,
        d => d.type
      );
    } else if (viewMode === 'mode') {
      names = Array.from(new Set(filteredData.map(d => d.mode))).sort();
      countMap = d3.rollup(
        filteredData,
        v => v.length,
        d => d.mode,
        d => d.type
      );
    } else if (viewMode === 'meter') {
      names = Array.from(new Set(filteredData.map(d => d.meter))).sort();
      countMap = d3.rollup(
        filteredData,
        v => v.length,
        d => d.meter,
        d => d.type
      );
    }

    return { names, types, countMap };
  }, [data, viewMode, selectedMeters, selectedModes]);

  const { names, types, countMap } = processedData;

  // Opções disponíveis para filtros
  const availableMeters = useMemo(() => 
    Array.from(new Set(data.map(d => d.meter))).sort(), [data]);
  const availableModes = useMemo(() => 
    Array.from(new Set(data.map(d => d.mode))).sort(), [data]);

  // Re-renderiza o dotplot quando os dados ou controles mudam
  useEffect(() => {
    if (data.length && names.length && types.length && countMap.size) {
      renderDotPlotTypes();
    }
  }, [data, names, types, countMap, startIndex, filterActive, viewMode]);

  // Reset pagination when view mode changes
  useEffect(() => {
    setStartIndex(0);
  }, [viewMode, selectedMeters, selectedModes]);

  // Retorna apenas nomes que possuem mais de um tipo associado
  const getFilteredNames = () => {
    return Array.from(countMap.entries())
      .filter(([_, typeMap]) => typeMap.size > 1)
      .map(([name]) => name)
      .sort();
  };

  // Função principal de renderização do dotplot
  const renderDotPlotTypes = () => {
    const svg = d3.select(svgRef.current);

    // Clear any existing content regardless of animation setting
    svg.selectAll("g").remove();

    // Create new chart immediately
    createNewChart();

    // Reset animation flag for future renders
    if (!shouldAnimate) {
      // Use setTimeout to avoid batching with current render
      setTimeout(() => setShouldAnimate(true), 0);
    }

    function createNewChart() {
      // Calcula largura e altura internas do gráfico
      const width = +svg.attr("width") - margin.left - margin.right;
      const height = +svg.attr("height") - margin.top - margin.bottom;

      // Centraliza o grupo principal horizontalmente no SVG
      const svgWidth = +svg.attr("width");
      const gTranslateX = margin.left + (svgWidth - margin.left - margin.right - width) / 2;

      // Grupo principal do gráfico 
      const g = svg
        .append("g")
        .attr("transform", `translate(${gTranslateX},${margin.top})`)
        // Skip initial opacity setting if not animating
        .style("opacity", shouldAnimate ? 0 : 1);

      // Define nomes visíveis de acordo com filtro e paginação
      const currentNames = filterActive ? getFilteredNames() : names;
      const visibleNames = currentNames.slice(startIndex, startIndex + pageSize);

      // Escalas para os eixos X (tipos) e Y (nomes)
      const xScale = d3.scaleBand().domain(types).range([0, width]).padding(0.1);
      const yScale = d3
        .scaleBand()
        .domain(visibleNames)
        .range([0, height])
        .padding(0.1);

      // Escala de tamanho baseada na contagem (substituindo a escala de cor)
      const maxCount = d3.max(Array.from(countMap.values(), (m) => d3.max(m.values())));
      const sizeScale = d3
        .scaleLinear()
        .domain([1, maxCount])
        .range([6, 24]); // Tamanho mínimo 6px, máximo 24px

      // Eixo Y (nomes)
      g.append("g").call(d3.axisLeft(yScale))
        .selectAll("text")
        .style("font-family", fontText)
        .style("font-size", "14px");

      // Eixo X (tipos)
      g.append("g")
        .attr("transform", `translate(0,-10)`)
        .call(d3.axisTop(xScale))
        .selectAll("text")
        .attr("transform", "rotate(0)")
        .style("text-anchor", "center")
        .style("font-family", fontText)
        .style("font-size", "14px");

      // Linhas de grade horizontais
      g.selectAll(".y-grid")
        .data(visibleNames)
        .enter()
        .append("line")
        .attr("class", "y-grid")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", (d) => yScale(d) + yScale.bandwidth() / 2)
        .attr("y2", (d) => yScale(d) + yScale.bandwidth() / 2)
        .attr("stroke", "#ccc")
        .attr("stroke-dasharray", "2,2");

      // Linhas de grade verticais
      g.selectAll(".x-grid")
        .data(types)
        .enter()
        .append("line")
        .attr("class", "x-grid")
        .attr("y1", 0)
        .attr("y2", height)
        .attr("x1", (d) => xScale(d) + xScale.bandwidth() / 2)
        .attr("x2", (d) => xScale(d) + xScale.bandwidth() / 2)
        .attr("stroke", "#ccc")
        .attr("stroke-dasharray", "2,2");

      // Remove tooltip existente se houver
      d3.select("body").selectAll(".tooltip").remove();

      // Tooltip para mostrar detalhes ao passar o mouse
      const tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

      // Renderiza os círculos do dotplot (começam invisíveis)
      const circles = [];
      for (const [name, typeMap] of countMap) {
        if (!visibleNames.includes(name)) continue;
        for (const [type, count] of typeMap) {
          const finalRadius = sizeScale(count);
          const circle = g.append("circle")
            .attr("cx", xScale(type) + xScale.bandwidth() / 2)
            .attr("cy", yScale(name) + yScale.bandwidth() / 2)
            .attr("r", shouldAnimate ? 0 : finalRadius) // Start with final size if not animating
            .attr("fill", "#4a90e2") // Cor fixa azul
            .attr("stroke", "#2c5aa0") // Borda azul mais escura
            .attr("stroke-width", 0.5)
            .style("opacity", shouldAnimate ? 0 : 0.8) // Start visible if not animating
            .on("mouseover", function (event) {
              d3.select(this)
                .attr("stroke-width", 2)
                .style("opacity", 1);
              tooltip.transition().duration(100).style("opacity", 1);
              tooltip.html(`<strong>${name}</strong><br>${type}: <b>${count}</b> variações`);
            })
            .on("mousemove", function (event) {
              tooltip
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 20 + "px");
            })
            .on("mouseout", function () {
              d3.select(this)
                .attr("stroke-width", 0.5)
                .style("opacity", 0.8);
              tooltip.transition().duration(200).style("opacity", 0);
            });

          if (shouldAnimate) {
            circles.push({ circle, finalRadius });
          }
        }
      }

      // Only animate if shouldAnimate is true
      if (shouldAnimate) {
        // Animação de fade in do grupo principal
        g.transition()
          .duration(700)
          .style("opacity", 1);

        // Animação dos círculos com delay escalonado
        circles.forEach(({ circle, finalRadius }, index) => {
          circle
            .transition()
            .delay(200 + index * 10) // Delay escalonado para efeito em cascata
            .duration(700)
            .attr("r", finalRadius) // Cresce até o tamanho final baseado na contagem
            .style("opacity", 0.8); // Fade in
        });
      }
    }
  };

  // Função para lidar com mudança de filtro
  const handleFilterToggle = () => {
    setIsLoading(true);
    setLoadingText("Aplicando filtro...");

    setTimeout(() => {
      setFilterActive((prev) => !prev);
      setStartIndex(0); // Reset para primeira página
      setLoadingText("Atualizando visualização...");

      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }, 200);
  };

  // Função para lidar com navegação
  const handleNavigation = (direction) => {
    setIsLoading(true);
    setLoadingText("Carregando página...");
    setShouldAnimate(false);

    setTimeout(() => {
      if (direction === 'up') {
        setStartIndex((prev) => Math.max(prev - pageSize, 0));
      } else {
        const currentNames = filterActive ? getFilteredNames() : names;
        if (startIndex + pageSize < currentNames.length) {
          setStartIndex((prev) => prev + pageSize);
        }
      }

      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }, 200);
  };

  // Funções para lidar com mudanças de filtros
  const handleMeterChange = (meter) => {
    setSelectedMeters(prev => 
      prev.includes(meter) 
        ? prev.filter(m => m !== meter)
        : [...prev, meter]
    );
  };

  const handleModeChange = (mode) => {
    setSelectedModes(prev => 
      prev.includes(mode) 
        ? prev.filter(m => m !== mode)
        : [...prev, mode]
    );
  };

  const clearFilters = () => {
    setSelectedMeters([]);
    setSelectedModes([]);
  };

  const applyFilters = () => {
    setShowFilters(false);
    setStartIndex(0);
  };

  const getViewModeLabel = () => {
    switch(viewMode) {
      case 'songs': return 'Songs';
      case 'mode': return 'Mode';
      case 'meter': return 'Meter';
      default: return 'Songs';
    }
  };

  // Função para lidar com mudança do modo de visualização
  const handleViewModeChange = (newMode) => {
    setViewMode(newMode);
    setShowViewModeDropdown(false);
    setStartIndex(0);
  };

  return (
    <div className="DotPlotTypes-container" style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="loading-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999
        }}>
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">{loadingText}</div>
          </div>
        </div>
      )}

      {/* Novos controles de visualização */}
      <div className="visualization-controls">
        <div className="control-group">
          <div className="dropdown-container">
            <button 
              className="dropdown-btn view-mode-btn"
              onClick={() => setShowViewModeDropdown(!showViewModeDropdown)}
            >
              Visualizar por <span className="chevron">▼</span>
            </button>
            {showViewModeDropdown && (
              <div className="dropdown-content">
                <label className="checkbox-item">
                  <input 
                    type="checkbox" 
                    checked={viewMode === 'songs'}
                    onChange={() => handleViewModeChange('songs')}
                  />
                  Songs
                </label>
                <label className="checkbox-item">
                  <input 
                    type="checkbox" 
                    checked={viewMode === 'mode'}
                    onChange={() => handleViewModeChange('mode')}
                  />
                  Mode
                </label>
                <label className="checkbox-item">
                  <input 
                    type="checkbox" 
                    checked={viewMode === 'meter'}
                    onChange={() => handleViewModeChange('meter')}
                  />
                  Meter
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="control-group">
          <div className="dropdown-container">
            <button 
              className="dropdown-btn filter-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              <span className="filter-icon"></span> Filtrar por <span className="chevron">▼</span>
            </button>
            {showFilters && (
              <div className="dropdown-content filter-panel">
                <h3>Filtrar por atributos musicais</h3>
                
                <div className="filter-sections">
                  <div className="filter-section">
                    <h4>Meter</h4>
                    {availableMeters.map(meter => (
                      <label key={meter} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={selectedMeters.includes(meter)}
                          onChange={() => handleMeterChange(meter)}
                          disabled={viewMode === 'meter'}
                        />
                        {meter}
                      </label>
                    ))}
                  </div>

                  <div className="filter-section">
                    <h4>Mode</h4>
                    {availableModes.map(mode => (
                      <label key={mode} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={selectedModes.includes(mode)}
                          onChange={() => handleModeChange(mode)}
                          disabled={viewMode === 'mode'}
                        />
                        {mode}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="filter-actions">
                  <button className="clear-filters-btn" onClick={clearFilters}>
                    Limpar filtros
                  </button>
                  <button className="apply-filters-btn" onClick={applyFilters}>
                    Aplicar filtros
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="control-group">
          <button
            onClick={handleFilterToggle}
            disabled={isLoading}
            className="multi-type-btn"
            style={{
              opacity: isLoading ? 0.6 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {viewMode === 'songs' 
              ? (filterActive ? "Mostrar todas as músicas" : "Mostrar músicas com mais de um tipo")
              : `Mostrar ${getViewModeLabel().toLowerCase()}s com mais de um tipo`
            }
          </button>
        </div>
      </div>

      <div className="controls">
        {/* Botão para navegar para cima na paginação */}
        <button
          id="nav-up"
          onClick={() => handleNavigation('up')}
          disabled={isLoading || startIndex === 0}
          style={{
            opacity: isLoading || startIndex === 0 ? 0.6 : 1,
            cursor: isLoading || startIndex === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          ↑
        </button>
        {/* Botão para navegar para baixo na paginação */}
        <button
          id="nav-down"
          onClick={() => handleNavigation('down')}
          disabled={isLoading}
          style={{
            opacity: isLoading ? 0.6 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          ↓
        </button>
      </div>

      {/* Modal da Legenda */}
      {showLegend && !isLoading && (
        <div className="legend-modal">
          <div className="legend-content">
            <button className="legend-close" onClick={() => setShowLegend(false)}>
              ×
            </button>
            <h3>Legenda do gráfico</h3>
            <div className="legend-section">
              <h4>Sobre o Gráfico:</h4>
              <p>Este é um <strong>Dot Plot</strong> que mostra a relação entre músicas folclóricas e seus tipos musicais.</p>
            </div>
            <div className="legend-section">
              <h4>Como Ler:</h4>
              <ul>
                <li><strong>Eixo Vertical (Y):</strong> {getViewModeLabel()}</li>
                <li><strong>Eixo Horizontal (X):</strong> Tipos de música</li>
                <li><strong>Círculos:</strong> Indicam que um item pertence a um tipo específico</li>
                <li><strong>Tamanho dos Círculos:</strong> Círculos maiores representam mais variações</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SVG onde o dotplot é desenhado */}
      <svg className="DotPlotTypessvg" ref={svgRef} width={1500} height={900} />
    </div>
  );
};

export default DotPlotTypes;