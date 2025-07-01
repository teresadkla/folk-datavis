import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "../../css/mapstyles.css";

// Define dimensões do SVG
const width = 800;
const height = 900;

// Função auxiliar para extrair o ano de uma string de data
const extractYear = (dateString) => {
  const match = dateString.match(/(\d{1,2})\s+de\s+([a-zA-Z]+)\s+de\s+(\d{4})/);
  return match ? match[3] : null;
};

const PortugalMap = () => {
  const svgRef = useRef();      // Referência ao elemento SVG
  const tooltipRef = useRef();  // Referência ao tooltip
  const [year, setYear] = useState(""); // Estado para o ano selecionado
  const [data, setData] = useState([]); // Estado para os dados CSV
  const [geojson, setGeojson] = useState(null); // Estado para o GeoJSON

  // Efeito para inicializar o mapa e carregar dados
  useEffect(() => {
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = svg.append("g"); // Grupo principal para elementos do mapa

    // Projeção geográfica centrada em Portugal
    const projection = d3.geoMercator()
      .center([-8, 39.5])
      .scale(6000)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection); // Função para desenhar paths

    // Configuração do tooltip
    const tooltip = d3.select(tooltipRef.current)
      .style("position", "absolute")
      .style("padding", "10px")
      .style("background", "white")
      .style("border", "1px solid #999")
      .style("border-radius", "8px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    // Função para atualizar os círculos no mapa
    const updateCircles = (filteredData, geojsonData, selectedYear) => {
      // Agrupa os dados por distrito e ano, contando temas
      const temasPorDistritoAno = d3.rollup(
        filteredData,
        v => v.length,
        d => d["Distrito/Ilha"],
        d => extractYear(d["Data"])
      );

      // Desenha círculos nos centroides dos distritos
      g.selectAll("circle")
        .data(geojsonData.features)
        .join("circle")
        .attr("cx", d => path.centroid(d)[0])
        .attr("cy", d => path.centroid(d)[1])
        .attr("r", d => {
          // Calcula o raio do círculo conforme o número de temas
          const temasPorAno = temasPorDistritoAno.get(d.properties.name) || new Map();
          if (selectedYear) {
            return Math.sqrt(temasPorAno.get(selectedYear) || 0) * 2;
          } else {
            const total = Array.from(temasPorAno.values()).reduce((a, b) => a + b, 0);
            return Math.sqrt(total) * 2;
          }
        })
        .attr("fill", "rgba(255, 0, 68, 0.6)")
        // Eventos de tooltip
        .on("mouseover", function (event, d) {
          const temasPorAno = temasPorDistritoAno.get(d.properties.name) || new Map();
          let temasNoAno, label, temasLista;
          if (selectedYear) {
            temasNoAno = temasPorAno.get(selectedYear) || 0;
            temasLista = filteredData
              .filter(item => item["Distrito/Ilha"] === d.properties.name && extractYear(item["Data"]) === selectedYear)
              .map(item => item["Tema"]);
            label = `${temasNoAno} temas em ${selectedYear}`;
          } else {
            temasNoAno = Array.from(temasPorAno.values()).reduce((a, b) => a + b, 0);
            temasLista = filteredData
              .filter(item => item["Distrito/Ilha"] === d.properties.name)
              .map(item => item["Tema"]);
            label = `${temasNoAno} temas no total`;
          }

          tooltip.transition().duration(200).style("opacity", 1);
          tooltip.html(
            `<strong>${d.properties.name}</strong><br>${label}<br><br><strong>Temas:</strong><br>${temasLista.length > 0 ? temasLista.join("<br>") : "Nenhum"}`
          );
        })
        .on("mousemove", event => {
          tooltip.style("left", (event.pageX + 15) + "px")
                 .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
          tooltip.transition().duration(300).style("opacity", 0);
        });
    };

    // Carrega os dados GeoJSON e CSV
    Promise.all([
      d3.json("/Portugal.json"),
      d3.csv("/VIMEO_V5.csv")
    ]).then(([geojsonData, csvData]) => {
      setGeojson(geojsonData);
      setData(csvData);

      // Desenha os distritos como paths
      g.selectAll("path")
        .data(geojsonData.features)
        .enter()
        .append("path")
        .attr("class", "distrito")
        .attr("d", path);

      // Adiciona labels com o nome do distrito
      g.selectAll("text")
        .data(geojsonData.features)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("transform", d => {
          const centroid = path.centroid(d);
          return `translate(${centroid})`;
        })
        .text(d => d.properties.name);

      // Inicializa os círculos
      updateCircles(csvData, geojsonData, year);
    });

    // // Zoom interativo (comentado)
    // const zoom = d3.zoom()
    //   .scaleExtent([1, 8])
    //   .on("zoom", (event) => {
    //     g.attr("transform", event.transform);
    //   });
    // svg.call(zoom);

    // Limpeza ao desmontar o componente
    return () => {
      svg.selectAll("*").remove();
    };
  }, []);

  // Atualiza os círculos quando o ano, geojson ou dados mudam
  useEffect(() => {
    if (!geojson || !data.length) return;
    const filtered = year ? data.filter(d => extractYear(d["Data"]) === year) : data;
    const svg = d3.select(svgRef.current);
    const g = svg.select("g");
    const projection = d3.geoMercator()
      .center([-8, 39.5])
      .scale(6000)
      .translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);

    // Agrupa os temas por distrito e ano
    const temasPorDistritoAno = d3.rollup(
      filtered,
      v => v.length,
      d => d["Distrito/Ilha"],
      d => extractYear(d["Data"])
    );

    // Atualiza os círculos conforme o filtro de ano
    g.selectAll("circle")
      .data(geojson.features)
      .join("circle")
      .attr("cx", d => path.centroid(d)[0])
      .attr("cy", d => path.centroid(d)[1])
      .attr("r", d => {
        const temasPorAno = temasPorDistritoAno.get(d.properties.name) || new Map();
        if (year) {
          return Math.sqrt(temasPorAno.get(year) || 0) * 2;
        } else {
          const total = Array.from(temasPorAno.values()).reduce((a, b) => a + b, 0);
          return Math.sqrt(total) * 2;
        }
      })
      .attr("fill", "rgba(255, 0, 68, 0.6)");
  }, [year, geojson, data]);

  return (
    <div>
      {/* Container para gráfico e timeline */}
      <div className="map-timeline-container">
        {/* SVG do mapa */}
        <svg ref={svgRef}></svg>

        {/* Linha do tempo abaixo do gráfico */}
        <div className="timeline-container">
          {Array.from({ length: 2025 - 2010 + 1 }, (_, i) => 2010 + i).map((yr) => (
            <button
              key={yr}
              onClick={() => setYear(String(yr))}
              className={`timeline-button ${year === String(yr) ? "active" : ""}`}
            >
              {yr}
            </button>
          ))}
          <button
            onClick={() => setYear("")}
            className={`timeline-button ${year === "" ? "active" : ""}`}
          >
            Todos
          </button>
        </div>
      </div>

      {/* Tooltip para mostrar detalhes */}
      <div ref={tooltipRef} className="tooltip" />
    </div>
  );
  
  
};

export default PortugalMap;
