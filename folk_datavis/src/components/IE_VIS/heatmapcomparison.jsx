import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import "../../css/comparison.css";



const fontText = getComputedStyle(document.documentElement)
  .getPropertyValue('--font-secondary')
  .trim();

const MidiHeatmapComparison = ({ active }) => {
  const svgRef = useRef(); // Referência ao elemento SVG
  const miniMapRef = useRef(); // Referência para o minimap
  const [allNames, setAllNames] = useState([]); // Lista com os nomes com múltiplas versões
  const [filteredNames, setFilteredNames] = useState([]); // Lista filtrada de nomes
  const [pitchData, setPitchData] = useState([]); // Dados brutos carregados do JSON
  const [selectedName, setSelectedName] = useState(null); // Nome atualmente selecionado no dropdown
  const [zoomRange, setZoomRange] = useState([0, 100]); // Range de zoom em percentagem
  const [isDragging, setIsDragging] = useState(false); // Estado para controlar o arrasto no minimap
  const [highlightHighFrequency, setHighlightHighFrequency] = useState(false); // Estado para destacar bins de alta frequência
  const [setsData, setSetsData] = useState([]); // Dados do arquivo sets.csv
  const [highFrequencyInfo, setHighFrequencyInfo] = useState([]); // Informações sobre os bins de alta frequência
  const [isLoading, setIsLoading] = useState(true); // Estado de carregamento
  const [loadingText, setLoadingText] = useState("Carregando dados..."); // Texto do loading

  // Estados para filtros
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [availableFilters, setAvailableFilters] = useState({
    meter: [],
    mode: [],
    type: []
  });
  const [selectedFilters, setSelectedFilters] = useState({
    meter: [],
    mode: [],
    type: []
  });
  const [isFiltering, setIsFiltering] = useState(false); // Estado para controle de filtragem

  // Margens e dimensões do gráfico
  const margin = { top: 50, right: 280, bottom: 50, left: 70 }; // Aumentado de 140 para 280
  const width = 1500 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;

  // Dimensões do minimap
  const miniMapHeight = 80;
  const miniMapMargin = { top: 10, right: 10, bottom: 20, left: 10 }; // Sem margem à esquerda
  const miniMapWidth = width * 0.6; // Reduzido para 60% da largura original

  // Carrega os dados na primeira renderização
  useEffect(() => {
    setIsLoading(true);
    setLoadingText("Carregando dados de pitch...");
    
    // Carregar os dados de pitch
    d3.json("pitch_compressed.json").then(jsonData => {
      // Conta quantas vezes cada nome aparece
      const nameCounts = d3.rollup(jsonData, v => v.length, d => d.name);

      // Filtra nomes que têm mais de uma versão (variações musicais)
      const multiVersionNames = Array.from(nameCounts.entries())
        .filter(([_, count]) => count > 1)
        .map(([name]) => name);

      setAllNames(multiVersionNames);
      setFilteredNames(multiVersionNames); // Inicialmente, todos os nomes estão visíveis
      setPitchData(jsonData);
      
      setLoadingText("Carregando informações musicais...");
      
      // Carregar os dados de sets.csv
      return d3.csv("sets.csv");
    }).then(csvData => {
      setSetsData(csvData);

      // Extrair valores únicos para cada filtro
      const meters = [...new Set(csvData.map(item => item.meter).filter(Boolean))];
      const modes = [...new Set(csvData.map(item => item.mode).filter(Boolean))];
      const types = [...new Set(csvData.map(item => item.type).filter(Boolean))];

      setAvailableFilters({
        meter: meters,
        mode: modes,
        type: types
      });
      
      setLoadingText("Finalizando...");
      
      // Pequeno delay para mostrar que terminou
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }).catch(error => {
      console.error("Erro ao carregar dados:", error);
      setLoadingText("Erro ao carregar dados");
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    });
  }, []);

  // Efeito para selecionar o primeiro nome filtrado quando a lista filtrada muda
  useEffect(() => {
    if (filteredNames.length > 0) {
      setSelectedName(filteredNames[0]);
    } else if (allNames.length > 0) {
      setSelectedName(allNames[0]);
    }
  }, [filteredNames, allNames]);

  // Função para aplicar filtros
  const applyFilters = () => {
    setIsFiltering(true);
    setTimeout(() => {
      if (
        selectedFilters.meter.length === 0 &&
        selectedFilters.mode.length === 0 &&
        selectedFilters.type.length === 0
      ) {
        setFilteredNames(allNames);
        setIsFiltering(false);
        return;
      }
      const filtered = allNames.filter(name => {
        const songInfo = setsData.find(d => d.name === name);
        if (!songInfo) return false;
        const meterMatch = selectedFilters.meter.length === 0 ||
          selectedFilters.meter.includes(songInfo.meter);
        const modeMatch = selectedFilters.mode.length === 0 ||
          selectedFilters.mode.includes(songInfo.mode);
        const typeMatch = selectedFilters.type.length === 0 ||
          selectedFilters.type.includes(songInfo.type);
        return meterMatch && modeMatch && typeMatch;
      });
      setFilteredNames(filtered);
      setShowFilterMenu(false);
      setIsFiltering(false);
    }, 300);
  };

  // Função para limpar todos os filtros
  const clearFilters = () => {
    setSelectedFilters({
      meter: [],
      mode: [],
      type: []
    });
    setFilteredNames(allNames);
    setShowFilterMenu(false);
  };

  // Função para alternar seleção de filtro
  const toggleFilter = (category, value) => {
    setSelectedFilters(prev => {
      const newFilters = { ...prev };
      if (newFilters[category].includes(value)) {
        // Remover o valor se já estiver selecionado
        newFilters[category] = newFilters[category].filter(item => item !== value);
      } else {
        // Adicionar o valor se não estiver selecionado
        newFilters[category] = [...newFilters[category], value];
      }
      return newFilters;
    });
  };

  // Filtragem de dados memorizada
  const variations = useMemo(() => {
    if (!selectedName || pitchData.length === 0) return [];
    return pitchData.filter(d => d.name === selectedName);
  }, [selectedName, pitchData]);

  // Construção de heatmapData memorizada
  const heatmapData = useMemo(() => {
    if (variations.length === 0) return [];
    const data = [];
    variations.forEach(variation => {
      variation.midiValues.forEach((pitch, idx) => {
        data.push({ x: idx, y: pitch });
      });
    });
    return data;
  }, [variations]);

  // Outros cálculos memorizados
  const { xMax, yExtent, filteredHeatmapData } = useMemo(() => {
    if (heatmapData.length === 0) return { xMax: 0, yExtent: [0, 0], filteredHeatmapData: [] };

    const xMax = d3.max(heatmapData, d => d.x);
    const yExtent = d3.extent(heatmapData, d => d.y);

    const xStart = Math.floor((zoomRange[0] / 100) * xMax);
    const xEnd = Math.ceil((zoomRange[1] / 100) * xMax);

    const filteredData = heatmapData.filter(d => d.x >= xStart && d.x <= xEnd);

    return { xMax, yExtent, filteredHeatmapData: filteredData };
  }, [heatmapData, zoomRange]);

  // Atualiza o gráfico toda vez que o nome selecionado, os dados ou o zoom mudarem
  useEffect(() => {
    if (!selectedName || pitchData.length === 0) return;

    // Seleciona o SVG e define suas dimensões
    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    svg.selectAll("*").remove(); // Limpa o SVG antes de redesenhar

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Filtra as variações do nome selecionado
    const variations = pitchData.filter(d => d.name === selectedName);

    // Constrói uma matriz com os dados de tempo (x) e pitch (y)
    const heatmapData = [];
    variations.forEach(variation => {
      variation.midiValues.forEach((pitch, idx) => {
        heatmapData.push({ x: idx, y: pitch });
      });
    });

    // Define escalas de eixos com base nos dados
    const xMax = d3.max(heatmapData, d => d.x);
    const yExtent = d3.extent(heatmapData, d => d.y);

    // Calcula o range de X baseado no zoom
    const xStart = Math.floor((zoomRange[0] / 100) * xMax);
    const xEnd = Math.ceil((zoomRange[1] / 100) * xMax);

    const xScale = d3.scaleLinear().domain([xStart, xEnd]).range([0, width]);
    const yScale = d3.scaleLinear().domain([yExtent[0], yExtent[1] + 1]).range([height, 0]);

    // MODIFICADO: Ajustar o número de bins desejados baseado no zoom
    const zoomRatio = (xEnd - xStart) / xMax; // Proporção da área visível
    const baseDesiredBinCount = 200; // Valor base para visualização completa
    const desiredBinCount = Math.max(100, Math.round(baseDesiredBinCount * (1 / zoomRatio)));
    const binSizeX = Math.max(1, Math.floor(xMax / desiredBinCount));
    const binSizeY = 1;

    // Agrupa TODOS os dados por bin para determinar a escala de cores global
    const fullBins = d3.rollup(
      heatmapData,
      v => v.length,
      d => Math.floor(d.x / binSizeX),
      d => Math.floor(d.y / binSizeY)
    );

    // Calcula o máximo global para a escala de cores
    const globalMaxCount = d3.max(Array.from(fullBins.values()).flatMap(yMap => Array.from(yMap.values())));

    // Define escala de cor baseada no máximo GLOBAL
    const color = d3.scaleLinear()
      .domain([1, globalMaxCount])
      .range(["#82813E", "#CC5C25"])
      .interpolate(d3.interpolateLab);

    // MUDANÇA: Converter os bins para array e DEPOIS filtrar por zoom
    const allDensity = [];
    for (let [xBin, yMap] of fullBins.entries()) {
      for (let [yBin, count] of yMap.entries()) {
        allDensity.push({
          x: xBin * binSizeX,
          y: yBin * binSizeY,
          count
        });
      }
    }

    // MUDANÇA: Filtrar os bins que estão na área de zoom
    const density = allDensity.filter(d => d.x >= xStart && d.x <= xEnd);

    // Identificar bins de alta frequência baseado no máximo GLOBAL
    const highFrequencyThreshold = globalMaxCount * 0.75;
    const highFrequencyBins = density.filter(d => d.count >= highFrequencyThreshold);

    // Ordenar por contagem (do maior para o menor)
    highFrequencyBins.sort((a, b) => b.count - a.count);

    // Encontrar meter e mode para o nome selecionado no sets.csv
    let meterAndMode = { meter: "Desconhecido", mode: "Desconhecido" };

    if (setsData.length > 0) {
      const songInfo = setsData.find(d => d.name === selectedName);
      if (songInfo) {
        meterAndMode = {
          meter: songInfo.meter || "Desconhecido",
          mode: songInfo.mode || "Desconhecido"
        };
      }
    }

    // Armazenar informações sobre bins de alta frequência com meter e mode
    setHighFrequencyInfo(highFrequencyBins.map(bin => ({
      ...bin,
      meter: meterAndMode.meter,
      mode: meterAndMode.mode
    })));

    // Remover tooltip existente para evitar duplicação
    d3.select(".midi-chart-tooltip").remove();

    // Criar o tooltip unificado para todo o aplicativo
    const tooltip = d3.select(".midi-chart-container")
      .append("div")
      .attr("class", "midi-chart-tooltip")
      .style("position", "absolute")
      .style("background", "#fff")
      .style("padding", "8px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("box-shadow", "0 2px 5px rgba(0,0,0,0.2)")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 1000)
      .style("font-size", "12px");

    // ============ CRIAÇÃO DA LAYER DE INTERAÇÃO ============

    // Primeiro: criar um grupo para a camada de brush
    const brushLayer = g.append("g")
      .attr("class", "brush-layer");

    // Segundo: criar um grupo para os elementos visuais
    const vizLayer = g.append("g")
      .attr("class", "viz-layer");

    // Desenha os retângulos do heatmap na camada de visualização
    vizLayer.selectAll("rect.heatmap-cell")
      .data(density)
      .enter()
      .append("rect")
      .attr("class", d => d.count >= highFrequencyThreshold ? "heatmap-cell high-frequency" : "heatmap-cell")
      .attr("x", d => xScale(d.x))
      .attr("y", d => yScale(d.y + binSizeY))
      .attr("width", Math.max(1, xScale(binSizeX) - xScale(0)))
      .attr("height", yScale(yExtent[0]) - yScale(yExtent[0] + binSizeY))
      .attr("rx", 2)
      .attr("ry", 2)
      .attr("fill", d => color(d.count))
      .attr("stroke", d => d.count >= highFrequencyThreshold && highlightHighFrequency ? "#fff" : "none")
      .attr("stroke-width", d => d.count >= highFrequencyThreshold && highlightHighFrequency ? 1 : 0)
      .style("opacity", d => highlightHighFrequency ?
        (d.count >= highFrequencyThreshold ? 1 : 0.3) : 1)
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(
            `Tempo (x): ${d.x}<br/>
             Pitch (y): ${d.y}<br/>
             Contagem: ${d.count}${d.count >= highFrequencyThreshold ? '<br/><strong>Alta frequência!</strong>' : ''}`
          );
      })
      .on("mousemove", event => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });

    // Adiciona linhas horizontais para cada valor de pitch (melhor leitura)
    for (let yVal = yExtent[0]; yVal <= yExtent[1]; yVal++) {
      vizLayer.append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", yScale(yVal))
        .attr("y2", yScale(yVal))
        .attr("stroke", "#888")
        .attr("stroke-opacity", 0.15)
        .attr("stroke-width", 1);
    }

    // Eixo X
    g.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("font-family", fontText)
      .style("font-size", "14px");

    // Eixo Y
    g.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .style("font-family", fontText)
      .style("font-size", "14px");

    // ============ LEGENDA DE CORES ============

    const legendHeight = 200;
    const legendWidth = 20;

    // MUDANÇA: Escala da legenda baseada no máximo GLOBAL
    const legendScale = d3.scaleLinear()
      .domain([1, globalMaxCount])
      .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale)
      .tickValues([1, ...d3.ticks(1, globalMaxCount, 4), globalMaxCount])
      .tickFormat(d3.format(".0f"));

    // Gradiente de cor para a legenda
    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
      .attr("id", "legend-gradient")
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "0%")
      .attr("y2", "0%");

    // Adiciona stops (faixas de cor) ao gradiente baseado no máximo GLOBAL
    const legendSteps = 10;
    for (let i = 0; i < legendSteps; i++) {
      const t = i / (legendSteps - 1);
      const value = 1 + t * (globalMaxCount - 1);
      linearGradient.append("stop")
        .attr("offset", `${t * 100}%`)
        .attr("stop-color", color(value));
    }

    // Retângulo da legenda com gradiente
    svg.append("g")
      .attr("transform", `translate(${width + margin.left + 200}, ${margin.top})`) // Aumentado de 20 para 40
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)");

    // Eixo da legenda
    svg.append("g")
      .attr("transform", `translate(${width + margin.left + 200 + legendWidth}, ${margin.top})`) // Aumentado de 20 para 40
      .call(legendAxis)
      .selectAll("text")
      .style("font-family", fontText)
      .style("font-size", "12px");

    // Título da legenda
    svg.append("text")
      .attr("x", width + margin.left + 170) // Aumentado de 10 para 30
      .attr("y", margin.top - 10)
      .text("Frequência")
      .style("font-family", fontText)
      .style("font-size", "12px")
      .style("font-weight", "bold");

    // ============ FUNCIONALIDADE DE BRUSH/ZOOM DIRETO NO GRÁFICO ============

    // Brush para seleção de área - agora na camada de brush
    const brush = d3.brushX()
      .extent([[0, 0], [width, height]])
      .on("start", brushStarted)
      .on("brush", brushing)
      .on("end", brushEnded);

    // Adiciona o brush à camada de brush
    brushLayer.call(brush);

    // Funções para controlar a interação entre brush e tooltip
    let isBrushing = false;

    function brushStarted() {
      // Marca que começamos a usar o brush
      isBrushing = true;
      // Esconde o tooltip durante o brushing para evitar conflito visual
      tooltip.style("opacity", 0);
    }

    function brushing() {
      // Mantém a flag ativa durante o brushing
      isBrushing = true;
    }

    function brushEnded(event) {
      // Depois de um pequeno atraso, permite que o tooltip funcione novamente
      setTimeout(() => {
        isBrushing = false;
      }, 300);

      if (!event.selection) return; // Se não houver seleção, não faz nada

      // Converte a seleção de pixels para o domínio de dados
      const [x0, x1] = event.selection.map(x => xScale.invert(x));

      // Converte para percentagens do total
      const newStart = Math.max(0, Math.round((x0 / xMax) * 100));
      const newEnd = Math.min(100, Math.round((x1 / xMax) * 100));

      // Atualiza o estado de zoom
      setZoomRange([newStart, newEnd]);

      // Reset do brush após uso
      brushLayer.call(brush.move, null);
    }

    // Atualiza os handlers de eventos do tooltip para verificar se estamos brushing
    vizLayer.selectAll("rect.heatmap-cell")
      .on("mouseover", (event, d) => {
        if (!isBrushing) {
          tooltip
            .style("opacity", 1)
            .html(
              `Tempo (x): ${d.x}<br/>
               Pitch (y): ${d.y}<br/>
               Contagem: ${d.count}`
            );
        }
      });

  }, [selectedName, pitchData, zoomRange, highlightHighFrequency, setsData]);

  // Efeito para criar e atualizar o minimap
  useEffect(() => {
    if (!selectedName || heatmapData.length === 0) return;

    // Seleciona o SVG do minimap e configura
    const svg = d3.select(miniMapRef.current)
      .attr("width", miniMapWidth + miniMapMargin.left + miniMapMargin.right)
      .attr("height", miniMapHeight + miniMapMargin.top + miniMapMargin.bottom);

    svg.selectAll("*").remove(); // Limpa o minimap antes de redesenhar

    const g = svg.append("g")
      .attr("transform", `translate(${miniMapMargin.left}, ${miniMapMargin.top})`);

    // Define escalas para o minimap
    const xScale = d3.scaleLinear()
      .domain([0, xMax])
      .range([0, miniMapWidth]);

    const yExtent = d3.extent(heatmapData, d => d.y);
    const yScale = d3.scaleLinear()
      .domain([yExtent[0], yExtent[1] + 1])
      .range([miniMapHeight - miniMapMargin.bottom, 0]);

    // Simplifica os dados para o minimap (menos detalhes)
    const binSizeX = Math.max(1, Math.floor(xMax / 100));
    const binSizeY = 1;

    const bins = d3.rollup(
      heatmapData,
      v => v.length,
      d => Math.floor(d.x / binSizeX),
      d => Math.floor(d.y / binSizeY)
    );

    const miniDensity = [];
    for (let [xBin, yMap] of bins.entries()) {
      for (let [yBin, count] of yMap.entries()) {
        miniDensity.push({
          x: xBin * binSizeX,
          y: yBin * binSizeY,
          count
        });
      }
    }

    // Escala de cor simplificada para o minimap
    const maxCount = d3.max(miniDensity, d => d.count);
    const color = d3.scaleLinear()
      .domain([1, maxCount])
      .range(["#82813E", "#CC5C25"])
      .interpolate(d3.interpolateLab);

    // Obter referência ao tooltip existente
    const tooltip = d3.select(".midi-chart-tooltip");

    // Desenha os retângulos do minimap
    g.selectAll("rect.minimap-cell")
      .data(miniDensity)
      .enter()
      .append("rect")
      .attr("class", "minimap-cell")
      .attr("x", d => xScale(d.x))
      .attr("y", d => yScale(d.y + binSizeY))
      .attr("width", Math.max(1, xScale(binSizeX) - xScale(0)))
      .attr("height", yScale(yExtent[0]) - yScale(yExtent[0] + binSizeY))
      .attr("fill", d => color(d.count))
      .attr("stroke", "none")
      .attr("opacity", 0.7)
      // Adicionar eventos de tooltip também ao minimap
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(
            `Tempo (x): ${d.x}<br/>
             Pitch (y): ${d.y}<br/>
             Contagem: ${d.count}`
          );
      })
      .on("mousemove", event => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });

    // Eixo X do minimap
    g.append("g")
      .attr("transform", `translate(0, ${miniMapHeight - miniMapMargin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .selectAll("text")
      .style("font-family", fontText)
      .style("font-size", "10px");

    // Retângulo indicador da área com zoom
    const zoomLeft = (zoomRange[0] / 100) * miniMapWidth;
    const zoomRight = (zoomRange[1] / 100) * miniMapWidth;

    const zoomIndicator = g.append("rect")
      .attr("class", "zoom-indicator")
      .attr("x", zoomLeft)
      .attr("y", 0)
      .attr("width", zoomRight - zoomLeft)
      .attr("height", miniMapHeight - miniMapMargin.bottom)
      .attr("fill", "rgba(255, 255, 255, 0.2)")
      .attr("stroke", "#CC5C25")
      .attr("stroke-width", 2)
      .style("cursor", "move")
      .call(d3.drag()
        .on("start", () => setIsDragging(true))
        .on("drag", dragged)
        .on("end", () => setIsDragging(false))
      );

    // Alças de redimensionamento nas bordas do indicador
    const handleWidth = 8;

    // Alça esquerda
    g.append("rect")
      .attr("class", "resize-handle left")
      .attr("x", zoomLeft - handleWidth / 2)
      .attr("y", 0)
      .attr("width", handleWidth)
      .attr("height", miniMapHeight - miniMapMargin.bottom)
      .attr("fill", "#CC5C25")
      .attr("opacity", 0.8)
      .style("cursor", "ew-resize")
      .call(d3.drag().on("drag", draggedLeft));

    // Alça direita
    g.append("rect")
      .attr("class", "resize-handle right")
      .attr("x", zoomRight - handleWidth / 2)
      .attr("y", 0)
      .attr("width", handleWidth)
      .attr("height", miniMapHeight - miniMapMargin.bottom)
      .attr("fill", "#CC5C25")
      .attr("opacity", 0.8)
      .style("cursor", "ew-resize")
      .call(d3.drag().on("drag", draggedRight));

    // Funções para manipulação dos elementos de zoom
    function dragged(event) {
      const zoomWidth = zoomRange[1] - zoomRange[0];
      const newLeft = Math.max(0, Math.min(100 - zoomWidth, (event.x / miniMapWidth) * 100));
      setZoomRange([newLeft, newLeft + zoomWidth]);
    }

    function draggedLeft(event) {
      const newStart = Math.max(0, Math.min(zoomRange[1] - 1, (event.x / miniMapWidth) * 100));
      setZoomRange([newStart, zoomRange[1]]);
    }

    function draggedRight(event) {
      const newEnd = Math.max(zoomRange[0] + 1, Math.min(100, (event.x / miniMapWidth) * 100));
      setZoomRange([zoomRange[0], newEnd]);
    }

  }, [selectedName, heatmapData, zoomRange, xMax]);

  return (
    <div className="midi-chart-container">
      {/* Loading overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">{loadingText}</div>
          </div>
        </div>
      )}

      <div className="controls-header">
        {/* Botão para abrir/fechar menu de filtros — agora antes do select */}
        <button
          className={`filter-toggle-btn ${showFilterMenu ? 'open' : 'closed'}`}
          onClick={() => setShowFilterMenu(!showFilterMenu)}
        >
          <svg className="filter-icon" width="14" height="14" viewBox="0 0 24 24">
            <path
              fill="white"
              d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39c.51-.66.04-1.61-.79-1.61H5.04c-.83 0-1.3.95-.79 1.61z"
            />
          </svg>
          {showFilterMenu ? "Fechar Filtros" : "Filtrar Músicas"}
        </button>

        {/* Dropdown de seleção de nome/música */}
        {filteredNames.length === 0 ? (
          <div className="no-results-container">
            Nenhum resultado encontrado para os filtros selecionados.<br />
            <button className="clear-filters-btn" onClick={clearFilters}>
              Limpar filtros
            </button>
          </div>
        ) : (
          <select
            className="music-select"
            onChange={(e) => setSelectedName(e.target.value)}
            value={selectedName || ""}
          >
            {filteredNames.map((name, idx) => (
              <option key={idx} value={name}>{name}</option>
            ))}
          </select>
        )}

        {/* Número de variações disponíveis */}
        <div className="variations-count">
          {selectedName && pitchData.length > 0 && (
            (() => {
              const variations = pitchData.filter(d => d.name === selectedName);
              return `Nº de variações: ${variations.length}`;
            })()
          )}
        </div>
        <button className={`highlight-toggle-btn ${highlightHighFrequency ? 'active' : 'inactive'}`}
          onClick={() => setHighlightHighFrequency(!highlightHighFrequency)}>
          {highlightHighFrequency ? "Mostrar todos os bins" : "Destacar bins de alta frequência"}
        </button>
      </div>

      {/* Menu de filtros (pop-up) */}
      {showFilterMenu && (
        <div className="filter-menu">
          <h3>Filtrar por atributos musicais</h3>

          <div className="filter-categories">
            {/* Filtro de Compasso (Meter) */}
            <div className="filter-category">
              <h4>Compasso (Meter)</h4>
              <div className="filter-options">
                {availableFilters.meter.map((meter, idx) => (
                  <label key={idx} className="filter-option">
                    <input
                      type="checkbox"
                      checked={selectedFilters.meter.includes(meter)}
                      onChange={() => toggleFilter("meter", meter)}
                    />
                    {meter}
                  </label>
                ))}
              </div>
            </div>

            {/* Filtro de Modo (Mode) */}
            <div className="filter-category">
              <h4>Modo Musical (Mode)</h4>
              <div className="filter-options">
                {availableFilters.mode.map((mode, idx) => (
                  <label key={idx} className="filter-option">
                    <input
                      type="checkbox"
                      checked={selectedFilters.mode.includes(mode)}
                      onChange={() => toggleFilter("mode", mode)}
                    />
                    {mode}
                  </label>
                ))}
              </div>
            </div>

            {/* Filtro de Tipo (Type) */}
            <div className="filter-category">
              <h4>Tipo (Type)</h4>
              <div className="filter-options">
                {availableFilters.type.map((type, idx) => (
                  <label key={idx} className="filter-option">
                    <input
                      type="checkbox"
                      checked={selectedFilters.type.includes(type)}
                      onChange={() => toggleFilter("type", type)}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="filter-buttons">
            <button className="filter-clear-btn" onClick={clearFilters}>
              Limpar Filtros
            </button>
            <button className="filter-apply-btn" onClick={applyFilters}>
              Aplicar Filtros
            </button>
          </div>

          {/* Contador de resultados */}
          <div className="results-counter">
            {filteredNames.length} / {allNames.length} músicas
          </div>

          {/* Indicador de carregamento */}
          {isFiltering && (
            <div className="filtering-overlay">
              <span className="filtering-text">
                Filtrando músicas...
              </span>
            </div>
          )}
        </div>
      )}

      {/* Elemento SVG onde o gráfico será desenhado */}
      <svg ref={svgRef}></svg>



      {/* Minimap para visualização geral e controle de zoom */}
      <div className="minimap-container">
        {/* <h4>Visualização geral:</h4>
        <svg ref={miniMapRef}></svg> */}
        {/* Instruções para o zoom */}
        <div className="zoom-instructions">
          <p>
            <strong>Dicas de zoom:</strong> Arraste no gráfico principal para criar uma seleção e ampliar essa área.
            Para ajustar a visualização use este minimap: arraste a área destacada ou use as alças laterais para redimensionar.
          </p>
        </div>
         <div className="action-buttons">
        <button className="zoom-reset-btn" onClick={() => setZoomRange([0, 100])}>
          Zoom Reset
        </button>
      </div>
      </div>

     

      {/* Card de informações sobre bins de alta frequência */}
      {highlightHighFrequency && highFrequencyInfo.length > 0 && (
        <div className="high-frequency-card">
          <h3>Bins de Alta Frequência ({highFrequencyInfo.length})</h3>

          {/* Informações sobre meter e mode */}
          {highFrequencyInfo.length > 0 && (
            <div className="song-info">
              <strong>Informações da música:</strong><br />
              Compasso (meter): {highFrequencyInfo[0].meter}<br />
              Modo musical (mode): {highFrequencyInfo[0].mode}
            </div>
          )}

          <p className="frequency-description">
            Os seguintes padrões aparecem com alta frequência nas variações desta música:
          </p>
          <table className="frequency-table">
            <thead>
              <tr>
                <th>Tempo (X)</th>
                <th>Pitch (Y)</th>
                <th>Frequência</th>
              </tr>
            </thead>
            <tbody>
              {highFrequencyInfo.slice(0, 10).map((bin, idx) => (
                <tr key={idx}>
                  <td>{bin.x}</td>
                  <td>{bin.y}</td>
                  <td>{bin.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {highFrequencyInfo.length > 10 && (
            <p className="table-note">
              Mostrando os 10 bins mais frequentes de {highFrequencyInfo.length} totais.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MidiHeatmapComparison;