import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import "../../css/ramification.css";

// Importar o script perlin.js do public
const script = document.createElement('script');
script.src = '/perlin.js';
document.head.appendChild(script);

const NetworkDiagram = () => {
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
  
    // Define dimensões fixas para o container do SVG
    const width = 1000;
    const height = 800;

    // Limpa o SVG antes de desenhar novamente
    d3.select(svgRef.current).selectAll("*").remove();

    // Cria o SVG, define dimensões e viewBox para responsividade
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");


    // Grupo principal para aplicar zoom/pan
    const container = svg.append("g")
      .attr("transform", `scale(0.8) translate(${width * 0.10}, ${height * 0.10})`); // Aplica escala e centra


    // Seletores e escalas
    const tooltip = d3.select(tooltipRef.current);
    const color = d3.scaleOrdinal(d3.schemeCategory10); // Cores para regiões
    const sizeScale = d3.scaleLinear().range([5, 25]); // Escala para tamanho dos nós

    // Carrega dados CSV
    d3.csv("VIMEO_V8.csv").then(data => {
      // Contadores auxiliares
      const themeCounts = {}; // Ocorrências por tema
      const themeRegionCounts = {}; // Ocorrências por tema+região
      const regionSet = new Set(); // Conjunto de regiões

      // Processa cada linha do CSV
      data.forEach(d => {
        const tema = d.Tema;
        const regiao = d.Região;
        regionSet.add(regiao);
        if (!themeCounts[tema]) themeCounts[tema] = 0;
        themeCounts[tema]++;
        const key = `${tema}||${regiao}`;
        if (!themeRegionCounts[key]) themeRegionCounts[key] = 0;
        themeRegionCounts[key]++;
      });

      // Filtra temas com mais de 13 ocorrências
      const repeatedThemes = Object.keys(themeCounts).filter(t => themeCounts[t] > 13);
      const nodes = [];
      const links = [];
      const nodeByName = {};

      // Define domínio da escala de tamanho
      const maxThemeCount = d3.max(Object.values(themeCounts));
      sizeScale.domain([1, maxThemeCount]);

      // Cria nós para temas
      repeatedThemes.forEach(theme => {
        const node = { id: theme, type: "tema", count: themeCounts[theme] };
        nodes.push(node);
        nodeByName[theme] = node;
      });

      // Cria nós para regiões
      regionSet.forEach(region => {
        const node = { id: region, type: "regiao" };
        nodes.push(node);
        nodeByName[region] = node;
      });

      // Cria ligações entre temas e regiões
      Object.entries(themeRegionCounts).forEach(([key, count]) => {
        const [tema, regiao] = key.split("||");
        if (repeatedThemes.includes(tema)) {
          links.push({ source: tema, target: regiao, value: count });
        }
      });

      // Inicializa simulação de forças
      const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(90).strength(1))
        .force("charge", d3.forceManyBody().strength(-1500))
        .force("center", d3.forceCenter(width / 2, height / 2)); // Centro do SVG

      // Desenha as ligações (links)
      const link = container.append("g")
        .attr("class", "links")
        .selectAll("path")
        .data(links)
        .join("path")
        .attr("stroke", "#6B3F21")
        .attr("stroke-width", d => Math.sqrt(d.value))
        .attr("stroke-opacity", 0.6)
        .attr("fill", "none");
        // .attr("filter", "url(#linkTurbulence)");

      // Desenha os nós (temas e regiões)
      const node = container.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", d => d.type === "tema" ? sizeScale(d.count) : 10) // Tamanho depende do tipo
        // .attr("fill", d => d.type === "regiao" ? color(d.id) : "#C33512")//Cor dos temas
        .attr("fill", d => d.type === "regiao" ? "#E09D2C" : "#C33512")//Cor dos temas

        .attr("fill-opacity", 0.9)
        // Tooltip ao passar por cima de temas
        .on("mouseover", (event, d) => {
          if (d.type === "tema") {
            tooltip
              .style("display", "block")
              .html(`<strong>${d.id}</strong><br/>Ocorrências: ${d.count}`);
          }
        })
        // Move tooltip com o rato
        .on("mousemove", event => {
          tooltip
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 20}px`);
        })
        // Esconde tooltip ao sair
        .on("mouseout", () => {
          tooltip.style("display", "none");
        })
        // Destaca conexões ao clicar num tema
        .on("click", (event, d) => {
          if (d.type === "tema") highlightConnections(d.id);
          event.stopPropagation();
        })
        // Permite arrastar os nós
        .call(drag(simulation));

      // Adiciona rótulos apenas às regiões
      const label = container.append("g")
        .selectAll("text")
        .data(nodes)
        .join("text")
        .text(d => d.type === "regiao" ? d.id : "")
        .attr("font-size", "10px")
        .attr("dx", 10)
        .attr("dy", "0.35em")
        .style("opacity", 0);




      // Atualiza posições a cada tick da simulação
 simulation.on("tick", () => {
    link.attr("d", d => {
      const dx = d.target.x - d.source.x;
      const dy = d.target.y - d.source.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Ponto de controle para a curva (ponto médio com offset perpendicular)
      const midX = (d.source.x + d.target.x) / 2;
      const midY = (d.source.y + d.target.y) / 2;
      
      // Criar offset perpendicular para a curva
      const perpX = -dy / distance;
      const perpY = dx / distance;
      
      // Intensidade da curva baseada na distância
      const curveIntensity = Math.min(distance * 0.5, 50);
      
      // Aplicar ruído de Perlin ao ponto de controle
      const time = Date.now() * 0.0001; // para animação suave
      const noiseScale = 0.02;
      const perlinOffset = noise.perlin3(midX * noiseScale, midY * noiseScale, time) * 100;
      
      // Ponto de controle final com ruído
      const controlX = midX + (perpX * curveIntensity) + perlinOffset;
      const controlY = midY + (perpY * curveIntensity) + perlinOffset;
      
      // Criar curva de Bézier quadrática com múltiplos pontos para aplicar ruído
      const segments = 300;// estava 15
      let path = `M ${d.source.x} ${d.source.y}`;
      
      for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const t2 = t * t;
        const mt = 1 - t;
        const mt2 = mt * mt;
        
        // Ponto na curva de Bézier
        const x = mt2 * d.source.x + 2 * mt * t * controlX + t2 * d.target.x;
        const y = mt2 * d.source.y + 2 * mt * t * controlY + t2 * d.target.y;
        
        // Aplicar ruído de Perlin adicional a cada segmento
        const segmentNoise = noise.perlin3(x * noiseScale * 2, y * noiseScale * 2, time) * 8;
        const segmentNoiseY = noise.perlin3(y * noiseScale * 2, x * noiseScale * 2, time + 100) * 8;
        
        path += ` L ${x + segmentNoise} ${y + segmentNoiseY}`;
      }
      
      return path;
    });

    node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

    label
        .attr("x", d => d.x)
        .attr("y", d => d.y);
  });


      // Função para permitir arrastar nós
     function drag(simulation) {
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
  }

      // Destaca conexões de um tema selecionado
      function highlightConnections(selectedId) {
        node.style("opacity", n =>
          n.id === selectedId || links.some(l =>
            (l.source.id === selectedId && l.target.id === n.id) ||
            (l.target.id === selectedId && l.source.id === n.id)) ? 1 : 0.1
        );
        link.style("opacity", l =>
          l.source.id === selectedId || l.target.id === selectedId ? 1 : 0.1
        );
        label.style("opacity", n =>
          n.type === "regiao" && links.some(l =>
            (l.source.id === selectedId && l.target.id === n.id) ||
            (l.target.id === selectedId && l.source.id === n.id)) ? 1 : 0
        );
      }

      // Ao clicar fora, remove o destaque
      svg.on("click", () => resetHighlight());

      // Restaura opacidades originais
      function resetHighlight() {
        node.style("opacity", 1);
        link.style("opacity", 0.6);
        label.style("opacity", 0);
      }
    });
  }, []);

  return (
    <div>
      <svg ref={svgRef}></svg>
      {/* Tooltip customizado */}
      <div ref={tooltipRef} className="tooltip_roots" />
    </div>
  );
};

export default NetworkDiagram;
