import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "../../css/mapstyles.css";

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

    g.select(".lines-group").selectAll("line").remove();

    if (clickedDistrict) {
      const temasSelecionados = new Set(clickedDistrict.temas);

      const relatedCoords = circles.filter(d => {
        if (d.distrito === clickedDistrict.distrito) return false;
        return d.temas.some(t => temasSelecionados.has(t));
      });

      const newLines = relatedCoords.map(d => ({
        x1: clickedDistrict.cx,
        y1: clickedDistrict.cy,
        x2: d.cx,
        y2: d.cy,
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
        .selectAll("line")
        .data(newLines)
        .join("line")
        .attr("x1", d => d.x1)
        .attr("y1", d => d.y1)
        .attr("x2", d => d.x2)
        .attr("y2", d => d.y2)
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.5)
        .attr("stroke-width", 1.8)
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
