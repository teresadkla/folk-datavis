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
  // Add a new state to track the animation mode
  const [shouldAnimate, setShouldAnimate] = useState(true);

  // Carrega e processa os dados CSV ao montar o componente
  useEffect(() => {
    setIsLoading(true);
    d3.csv("sets.csv")
      .then(setData)
      .finally(() => setIsLoading(false));
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

  return (
    <div className="DotPlotTypes-container">
      <div className="controls">
        {/* Botão para ativar/desativar filtro de músicas com mais de um tipo */}
        <button onClick={() => setFilterActive((prev) => !prev)} id="filter-multi-type" >
          {filterActive ? "Mostrar todas as músicas" : "Mostrar apenas músicas com mais de um tipo"}
        </button>
        {/* Botão para navegar para cima na paginação */}
        <button id="nav-up" onClick={() => {
          setShouldAnimate(false);
          setStartIndex((prev) => Math.max(prev - pageSize, 0));
        }} >
          ↑
        </button>
        {/* Botão para navegar para baixo na paginação */}
        <button id="nav-down" onClick={() => {
          setShouldAnimate(false);
          const currentNames = filterActive ? getFilteredNames() : names;
          if (startIndex + pageSize < currentNames.length) {
            setStartIndex((prev) => prev + pageSize);
          }
        }}>
          ↓
        </button>
      </div>
      {/* SVG onde o heatmap é desenhado */}
      <svg className="DotPlotTypessvg" ref={svgRef} width={1500} height={900} />
    </div>
  );
};

export default DotPlotTypes;