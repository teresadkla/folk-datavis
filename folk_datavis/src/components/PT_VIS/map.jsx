import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "../../css/mapstyles.css";

// Importar o script perlin.js do public
const script = document.createElement('script');
script.src = '/perlin.js';
document.head.appendChild(script);

const width = 1500;
const height = 900;

const extractYear = (dateString) => {
  const match = dateString.match(/(\d{1,2})\s+de\s+([a-zA-Z]+)\s+de\s+(\d{4})/);
  return match ? match[3] : null;
};

const PortugalMap = () => {
  const svgRef = useRef();
  const [year, setYear] = useState("");
  const [data, setData] = useState([]);
  const [geojson, setGeojson] = useState(null);
  const [selectedDistrictData, setSelectedDistrictData] = useState(null);
  const [clickedDistrict, setClickedDistrict] = useState(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = svg.append("g");
    g.append("g").attr("class", "map-group");
    g.append("g").attr("class", "labels-group");
    g.append("g").attr("class", "circles-group");
    g.append("g").attr("class", "lines-group");

    const projectionMainland = d3.geoMercator()
      .center([-8, 39.5])
      .scale(6000)
      .translate([width / 2, height / 2]);

    const projectionAzores = d3.geoMercator()
      .center([-28, 38])
      .scale(12000)
      .translate([300, 780]);

    const projectionMadeira = d3.geoMercator()
      .center([-17, 32.6])
      .scale(14000)
      .translate([480, 800]);

    const pathMainland = d3.geoPath().projection(projectionMainland);
    const pathAzores = d3.geoPath().projection(projectionAzores);
    const pathMadeira = d3.geoPath().projection(projectionMadeira);

    Promise.all([
      d3.json("/Portugal.json"),
      d3.csv("VIMEO_V8.csv")
    ]).then(([geojsonData, csvData]) => {
      setGeojson(geojsonData);
      setData(csvData);

      g.select(".map-group")
        .selectAll("path")
        .data(geojsonData.features)
        .enter()
        .append("path")
        .attr("class", "distrito")
        .attr("opacity", 0.6)
        .attr("d", d => {
          const name = d.properties.name;
          if (name === "Azores") return pathAzores(d);
          if (name === "Madeira") return pathMadeira(d);
          return pathMainland(d);
        });

      g.select(".labels-group")
        .selectAll("text")
        .data(geojsonData.features)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("transform", d => {
          const name = d.properties.name;
          const centroid =
            name === "Azores" ? pathAzores.centroid(d) :
              name === "Madeira" ? pathMadeira.centroid(d) :
                pathMainland.centroid(d);
          return `translate(${centroid})`;
        })
        .text(d => d.properties.name);
    });

    return () => {
      svg.selectAll("*").remove();
    };
  }, []);

  // Função para criar linhas com Perlin noise
  const createPerlinLine = (sourceX, sourceY, targetX, targetY) => {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Ponto de controle para a curva (ponto médio com offset perpendicular)
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;
    
    // Criar offset perpendicular para a curva
    const perpX = -dy / distance;
    const perpY = dx / distance;
    
    // Intensidade da curva baseada na distância
    const curveIntensity = Math.min(distance * 0.5, 50);
    
    // Aplicar ruído de Perlin ao ponto de controle
    const time = Date.now() * 0.0001; // para animação suave
    const noiseScale = 0.02;
    const perlinOffset = window.noise ? window.noise.perlin3(midX * noiseScale, midY * noiseScale, time) * 100 : 0;
    
    // Ponto de controle final com ruído
    const controlX = midX + (perpX * curveIntensity) + perlinOffset;
    const controlY = midY + (perpY * curveIntensity) + perlinOffset;
    
    // Criar curva de Bézier quadrática com múltiplos pontos para aplicar ruído
    const segments = 300;
    let path = `M ${sourceX} ${sourceY}`;
    
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const t2 = t * t;
      const mt = 1 - t;
      const mt2 = mt * mt;
      
      // Ponto na curva de Bézier
      const x = mt2 * sourceX + 2 * mt * t * controlX + t2 * targetX;
      const y = mt2 * sourceY + 2 * mt * t * controlY + t2 * targetY;
      
      // Aplicar ruído de Perlin adicional a cada segmento
      const segmentNoise = window.noise ? window.noise.perlin3(x * noiseScale * 2, y * noiseScale * 2, time) * 8 : 0;
      const segmentNoiseY = window.noise ? window.noise.perlin3(y * noiseScale * 2, x * noiseScale * 2, time + 100) * 8 : 0;
      
      path += ` L ${x + segmentNoise} ${y + segmentNoiseY}`;
    }
    
    return path;
  };

  useEffect(() => {
    if (!geojson || !data.length) return;

    const filtered = year ? data.filter(d => extractYear(d["Data"]) === year) : data;
    const svg = d3.select(svgRef.current);
    const g = svg.select("g");

    const projectionMainland = d3.geoMercator()
      .center([-8, 39.5])
      .scale(6000)
      .translate([width / 2, height / 2]);

    const projectionAzores = d3.geoMercator()
      .center([-28, 38])
      .scale(12000)
      .translate([300, 780]);

    const projectionMadeira = d3.geoMercator()
      .center([-17, 32.6])
      .scale(14000)
      .translate([480, 800]);

    const pathMainland = d3.geoPath().projection(projectionMainland);
    const pathAzores = d3.geoPath().projection(projectionAzores);
    const pathMadeira = d3.geoPath().projection(projectionMadeira);

    const circles = geojson.features.map(d => {
      const name = d.properties.name;
      const centroid =
        name === "Azores" ? pathAzores.centroid(d) :
          name === "Madeira" ? pathMadeira.centroid(d) :
            pathMainland.centroid(d);

      return {
        distrito: name,
        cx: centroid[0],
        cy: centroid[1],
        temas: filtered
          .filter(item => item["Distrito/Ilha"] === name)
          .map(item => item["Tema"])
      };
    });

    g.select(".circles-group")
      .selectAll("circle")
      .data(circles)
      .join("circle")
      .attr("cx", d => d.cx)
      .attr("cy", d => d.cy)
      .attr("r", d => Math.sqrt(d.temas.length) * 2)
      .attr("fill", "#DB8671")//Red2
      .attr("fill-opacity", 0.5)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        setSelectedDistrictData({
          distrito: d.distrito,
          totalTemas: d.temas.length,
          temas: d.temas,
          ano: year
        });
        setClickedDistrict(d);
      });

    g.select(".lines-group").selectAll("path").remove();

    if (clickedDistrict) {
      const temasSelecionados = new Set(clickedDistrict.temas);

      const relatedCoords = circles.filter(d => {
        if (d.distrito === clickedDistrict.distrito) return false;
        return d.temas.some(t => temasSelecionados.has(t));
      });

      const newLines = relatedCoords.map(d => ({
        sourceX: clickedDistrict.cx,
        sourceY: clickedDistrict.cy,
        targetX: d.cx,
        targetY: d.cy,
        temasComuns: d.temas.filter(t => temasSelecionados.has(t)),
      }));

      const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip-line")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("padding", "6px 10px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "6px")
        .style("font-size", "14px")
        .style("pointer-events", "none")
        .style("opacity", 0);

      g.select(".lines-group")
        .selectAll("path")
        .data(newLines)
        .join("path")
        .attr("d", d => createPerlinLine(d.sourceX, d.sourceY, d.targetX, d.targetY))
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.5)
        .attr("stroke-width", 1.8)
        .attr("fill", "none")
        .on("mouseover", (event, d) => {
          tooltip.transition().duration(200).style("opacity", 0.95);
          const temasUnicos = [...new Set(d.temasComuns)];
          tooltip
            .html(`<strong>Temas comuns:</strong><br>${temasUnicos.join("<br>")}`)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 28}px`);
        })
        .on("mousemove", (event) => {
          tooltip
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 28}px`);
        })
        .on("mouseout", () => {
          tooltip.transition().duration(300).style("opacity", 0);
        });

      // Animação contínua das linhas com Perlin noise
      const animateLines = () => {
        g.select(".lines-group")
          .selectAll("path")
          .attr("d", d => createPerlinLine(d.sourceX, d.sourceY, d.targetX, d.targetY));
        
        requestAnimationFrame(animateLines);
      };
      
      // Iniciar animação apenas se o Perlin noise estiver disponível
      if (window.noise) {
        animateLines();
      }
    }
  }, [year, geojson, data, clickedDistrict]);

  const anosUnicos = [...new Set(data.map(d => extractYear(d["Data"])))].filter(Boolean).sort();

  return (
<div className="map-info">
  <div className="map-timeline-container">
    <svg ref={svgRef}></svg>
    <div className="timeline-container">
      <button
        className="timeline-button"
        onClick={() => {
          setYear("");
          setClickedDistrict(null);
        }}
      >
        Mostrar todos os anos
      </button>
      {anosUnicos.map((ano, index) => (
        <button
          className="timeline-button"
          key={index}
          onClick={() => {
            setYear(ano);
            setClickedDistrict(null);
          }}
        >
          {ano}
        </button>
      ))}
    </div>
  </div>

  {selectedDistrictData && (
    <div className="info-section-map">
      <button
        className="close-button"
        onClick={() => {
          setSelectedDistrictData(null);
          setClickedDistrict(null);
        }}
      >
        ×
      </button>
      <h2>{selectedDistrictData.distrito}</h2>
      <p>
        <strong>{selectedDistrictData.totalTemas}</strong> temas{" "}
        {selectedDistrictData.ano ? `em ${selectedDistrictData.ano}` : "no total"}
      </p>
      <h4>Temas:</h4>
      <ul>
        {selectedDistrictData.temas.map((tema, i) => (
          <li key={i}>{tema}</li>
        ))}
      </ul>
    </div>
  )}
</div>

  );
};

export default PortugalMap;