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

  // Memoriza nomes, tipos e countMap
  const names = useMemo(() => Array.from(new Set(data.map(d => d.name))).sort(), [data]);
  const types = useMemo(() => Array.from(new Set(data.map(d => d.type))).sort(), [data]);
  const countMap = useMemo(() => d3.rollup(
    data,
    v => v.length,
    d => d.name,
    d => d.type
  ), [data]);

  // Re-renderiza o dotplot quando os dados ou controles mudam
  useEffect(() => {
    if (data.length && names.length && types.length && countMap.size) {
      renderDotPlotTypes();
    }
  }, [data, names, types, countMap, startIndex, filterActive]);

  // Retorna apenas nomes que possuem mais de um tipo associado
  const getFilteredNames = () => {
    return Array.from(countMap.entries())
      .filter(([_, typeMap]) => typeMap.size > 1)
      .map(([name]) => name)
      .sort();
  };

  // Função principal de renderização do heatmap
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

      // Escala de cor baseada na contagem
      const colorScale = d3
        .scaleSequential(d3.interpolatePlasma)
        .domain([1, d3.max(Array.from(countMap.values(), (m) => d3.max(m.values())))]);

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

      // Renderiza os círculos do heatmap (começam invisíveis)
      const circles = [];
      for (const [name, typeMap] of countMap) {
        if (!visibleNames.includes(name)) continue;
        for (const [type, count] of typeMap) {
          const circle = g.append("circle")
            .attr("cx", xScale(type) + xScale.bandwidth() / 2)
            .attr("cy", yScale(name) + yScale.bandwidth() / 2)
            .attr("r", shouldAnimate ? 0 : 5) // Start with final size if not animating
            .attr("fill", colorScale(count))
            .attr("stroke", "none")
            .style("opacity", shouldAnimate ? 0 : 1) // Start visible if not animating
            .on("mouseover", function (event) {
              tooltip.transition().duration(100).style("opacity", 1);
              tooltip.html(`<strong>${name}</strong><br>${type}: <b>${count}</b> variações`);
            })
            .on("mousemove", function (event) {
              tooltip
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 20 + "px");
            })
            .on("mouseout", function () {
              tooltip.transition().duration(200).style("opacity", 0);
            });
          
          if (shouldAnimate) {
            circles.push(circle);
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
        circles.forEach((circle, index) => {
          circle
            .transition()
            .delay(200 + index * 10) // Delay escalonado para efeito em cascata
            .duration(700)
            .attr("r", 5) // Cresce até o tamanho final
            .style("opacity", 1); // Fade in
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

      <div className="controls">
        {/* Botão para ativar/desativar filtro de músicas com mais de um tipo */}
        <button 
          onClick={handleFilterToggle}
          disabled={isLoading}
          id="filter-multi-type"
          style={{
            opacity: isLoading ? 0.6 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {filterActive ? "Mostrar todas as músicas" : "Mostrar apenas músicas com mais de um tipo"}
        </button>
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
      
      {/* Botão para mostrar/ocultar legenda */}
      <button 
        className="legend-btn-types" 
        onClick={() => setShowLegend((prev) => !prev)}
        disabled={isLoading}
        style={{
          opacity: isLoading ? 0.6 : 1,
          cursor: isLoading ? 'not-allowed' : 'pointer'
        }}
      >
        {showLegend ? "Ocultar Legenda" : "Ver Legenda"}
      </button>

      {/* Modal da Legenda */}
      {showLegend && !isLoading && (
        <div className="legend-modal">
          <div className="legend-content">
            <h3>Legenda do Gráfico</h3>
            <div className="legend-section">
              <h4>Sobre o Gráfico:</h4>
              <p>Este é um <strong>Dot Plot</strong> que mostra a relação entre músicas folclóricas e seus tipos musicais.</p>
            </div>
            <div className="legend-section">
              <h4>Como Ler:</h4>
              <ul>
                <li><strong>Eixo Vertical (Y):</strong> Nomes das músicas</li>
                <li><strong>Eixo Horizontal (X):</strong> Tipos de música</li>
                <li><strong>Círculos:</strong> Indicam que uma música pertence a um tipo específico</li>
                <li><strong>Cor dos Círculos:</strong> Intensidade da cor representa o número de variações da música nesse tipo</li>
              </ul>
            </div>
            <div className="legend-section">
              <h4>Cores:</h4>
              <div className="color-legend">
                <div className="color-item">
                  <div className="color-box" style={{backgroundColor: '#0d0887'}}></div>
                  <span>Poucas variações</span>
                </div>
                <div className="color-item">
                  <div className="color-box" style={{backgroundColor: '#7e03a8'}}></div>
                  <span>Variações médias</span>
                </div>
                <div className="color-item">
                  <div className="color-box" style={{backgroundColor: '#f0f921'}}></div>
                  <span>Muitas variações</span>
                </div>
              </div>
            </div>
            <div className="legend-section">
              <h4>Controles:</h4>
              <ul>
                <li><strong>Filtro:</strong> Mostra apenas músicas com múltiplos tipos</li>
                <li><strong>Navegação (↑/↓):</strong> Navega entre páginas do gráfico</li>
                <li><strong>Hover:</strong> Passe o mouse sobre os círculos para ver detalhes</li>
              </ul>
            </div>
            <button className="legend-close" onClick={() => setShowLegend(false)}>
              Fechar
            </button>
          </div>
        </div>
      )}
      
      {/* SVG onde o heatmap é desenhado */}
      <svg className="DotPlotTypessvg" ref={svgRef} width={1500} height={900} />
    </div>
  );
};

export default DotPlotTypes;