import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "../../css/mapstyles.css";

const width = 1500;
const height = 900;

// Função para extrair o ano de uma string de data no formato "12 de Janeiro de 2020"
const extractYear = (dateString) => {
  const match = dateString.match(/(\d{1,2})\s+de\s+([a-zA-Z]+)\s+de\s+(\d{4})/);
  return match ? match[3] : null;
};

const PortugalMap = () => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [year, setYear] = useState("");
  const [data, setData] = useState([]);
  const [geojson, setGeojson] = useState(null);

  // Refs para os botões da timeline
  const yearButtonRefs = useRef({});

  // Efeito para inicializar o mapa e carregar dados
  useEffect(() => {
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = svg.append("g"); // Grupo principal para elementos do mapa
    g.append("g").attr("class", "lines-group"); // Grupo para as linhas

    // Projeção geográfica centrada em Portugal
    const projection = d3.geoMercator()
      .center([-8, 39.5])
      .scale(6000)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Tooltip customizado
    const tooltip = d3.select(tooltipRef.current)
      .style("position", "absolute")
      .style("padding", "10px")
      .style("background", "white")
      .style("border", "1px solid #999")
      .style("border-radius", "8px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    // Função para atualizar os círculos do mapa
    const updateCircles = (filteredData, geojsonData, selectedYear) => {
      // Agrupa os temas por distrito e ano
      const temasPorDistritoAno = d3.rollup(
        filteredData,
        v => v.length,
        d => d["Distrito/Ilha"],
        d => extractYear(d["Data"])
      );

      g.selectAll("circle")
        .data(geojsonData.features)
        .join("circle")
        .attr("cx", d => path.centroid(d)[0])
        .attr("cy", d => path.centroid(d)[1])
        // Raio proporcional
        // ao número de temas
        .attr("r", d => {
          const temasPorAno = temasPorDistritoAno.get(d.properties.name) || new Map();
          if (selectedYear) {
            return Math.sqrt(temasPorAno.get(selectedYear) || 0) * 2;
          } else {
            const total = Array.from(temasPorAno.values()).reduce((a, b) => a + b, 0);
            return Math.sqrt(total) * 2;
          }
        })
        .attr("fill", "rgba(255, 0, 68, 0.6)")
        // Tooltip ao passar o mouse
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

      // Desenha os distritos no mapa
      g.selectAll("path")
        .data(geojsonData.features)
        .enter()
        .append("path")
        .attr("class", "distrito")
        .attr("opacity", 0.6)
        .attr("d", path);

      // Adiciona os nomes dos distritos
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

      updateCircles(csvData, geojsonData, year); // Inicializa os círculos
    });

    // Limpa o SVG ao desmontar o componente
    return () => {
      svg.selectAll("*").remove();
    };
  }, []);

  // Efeito para atualizar círculos e linhas ao mudar o ano, geojson ou dados
  useEffect(() => {
    if (!geojson || !data.length) return;

    // Filtra os dados pelo ano selecionado (ou todos)
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

    // Atualiza os círculos de cada distrito
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

    // Atualiza as linhas que ligam o botão do ano aos distritos
    const linesGroup = g.select(".lines-group");
    linesGroup.selectAll("line").remove();

    // Calcula o centro do botão do ano selecionado OU do botão "Todos" se year === ""
    let centerX = width / 2;
    let centerY = 40; // fallback
    const yearKey = year === "" ? "" : year;
    if (yearButtonRefs.current[yearKey]) {
      const btn = yearButtonRefs.current[yearKey];
      const btnRect = btn.getBoundingClientRect();
      const svgRect = svgRef.current.getBoundingClientRect();
      // Corrige para coordenadas relativas ao SVG
      centerX = btnRect.left + btnRect.width / 2 - svgRect.left;
      centerY = btnRect.top + btnRect.height / 2 - svgRect.top + height; // +height para alinhar abaixo do SVG
    }

    geojson.features.forEach((d) => {
      const temasPorAno = temasPorDistritoAno.get(d.properties.name) || new Map();

      let shouldDraw = false;
      if (year) {
        shouldDraw = (temasPorAno.get(year) || 0) > 0;
      } else {
        const total = Array.from(temasPorAno.values()).reduce((a, b) => a + b, 0);
        shouldDraw = total > 0;
      }

      if (shouldDraw) {
        const [x, y] = path.centroid(d);

        // Calcula as coordenadas absolutas do botão
        const btn = yearButtonRefs.current[yearKey];
        const btnRect = btn.getBoundingClientRect();
        // Posição do centro do botão no viewport
        const btnCenterX = btnRect.left + btnRect.width / 2;
        const btnCenterY = btnRect.top + btnRect.height / 2;

        // Posição do SVG no viewport
        const svgRect = svgRef.current.getBoundingClientRect();

        // Posição do centroide do distrito relativa ao SVG
        const svgX = svgRect.left + x;
        const svgY = svgRect.top + y;

        // Cria uma linha SVG que começa fora do SVG (no botão) e termina no distrito
        // Para isso, usa o método .attr("x1", ...) e .attr("y1", ...) com valores negativos ou fora do SVG
        linesGroup
          .append("line")
          .attr("x1", btnCenterX - svgRect.left) // relativo ao SVG
          .attr("y1", btnCenterY - svgRect.top)  // relativo ao SVG
          .attr("x2", x)
          .attr("y2", y)
          .attr("stroke", "rgba(0,0,0,0.4)")
          .attr("stroke-width", 1.2);
      }
    });

  }, [year, geojson, data]);

  return (
    <div className="map-timeline-container">
      {/* SVG do mapa */}
      <svg ref={svgRef}></svg>
      {/* Tooltip customizado */}
      <div ref={tooltipRef} className="tooltip" />
      {/* Timeline (botões de ano) abaixo do mapa */}
      <div className="timeline-container" style={{ marginTop: "24px", marginBottom: "12px" }}>
        {Array.from({ length: 2025 - 2010 + 1 }, (_, i) => 2010 + i).map((yr) => (
          <button
            key={yr}
            ref={el => yearButtonRefs.current[yr] = el}
            onClick={() => setYear(String(yr))}
            className={`timeline-button${year === String(yr) ? " active" : ""}`}
          >
            {yr}
          </button>
        ))}
        {/* Botão para mostrar todos os anos */}
        <button
          ref={el => yearButtonRefs.current[""] = el}
          onClick={() => setYear("")}
          className={`timeline-button${year === "" ? " active" : ""}`}
        >
          Todos
        </button>
      </div>
    </div>
  );
};

export default PortugalMap;
