import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const NetworkDiagram = () => {
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Limpa o SVG antes de desenhar novamente
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const defs = svg.append("defs");

    const turbulenceFilter = defs.append("filter")
      .attr("id", "linkTurbulence")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    turbulenceFilter.append("feTurbulence")
      .attr("type", "turbulence")
      .attr("baseFrequency", "0.01 0.02")
      .attr("numOctaves", "20")
      .attr("seed", "15")
      .attr("result", "turbulence");

    turbulenceFilter.append("feDisplacementMap")
      .attr("in", "SourceGraphic")
      .attr("in2", "turbulence")
      .attr("scale", "10")
      .attr("xChannelSelector", "R")
      .attr("yChannelSelector", "G");

    const container = svg.append("g");

    svg.call(
      d3.zoom()
        .scaleExtent([0.2, 5])
        .on("zoom", (event) => {
          container.attr("transform", event.transform);
        })
    );

    const tooltip = d3.select(tooltipRef.current);
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const sizeScale = d3.scaleLinear().range([5, 25]);

    d3.csv("VIMEO_V5.csv").then(data => {
      const themeCounts = {};
      const themeRegionCounts = {};
      const regionSet = new Set();

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

      const repeatedThemes = Object.keys(themeCounts).filter(t => themeCounts[t] > 13);
      const nodes = [];
      const links = [];
      const nodeByName = {};

      const maxThemeCount = d3.max(Object.values(themeCounts));
      sizeScale.domain([1, maxThemeCount]);

      repeatedThemes.forEach(theme => {
        const node = { id: theme, type: "tema", count: themeCounts[theme] };
        nodes.push(node);
        nodeByName[theme] = node;
      });

      regionSet.forEach(region => {
        const node = { id: region, type: "regiao" };
        nodes.push(node);
        nodeByName[region] = node;
      });

      Object.entries(themeRegionCounts).forEach(([key, count]) => {
        const [tema, regiao] = key.split("||");
        if (repeatedThemes.includes(tema)) {
          links.push({ source: tema, target: regiao, value: count });
        }
      });

      const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(90).strength(1))
        .force("charge", d3.forceManyBody().strength(-1500))
        .force("center", d3.forceCenter(width / 2, height / 2));

      const link = container.append("g")
        .attr("class", "links")
        .selectAll("path")
        .data(links)
        .join("path")
        .attr("stroke", "brown")
        .attr("stroke-width", d => Math.sqrt(d.value))
        .attr("stroke-opacity", 0.6)
        .attr("fill", "none")
        .attr("filter", "url(#linkTurbulence)");

      const node = container.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", d => d.type === "tema" ? sizeScale(d.count) : 10)
        .attr("fill", d => d.type === "regiao" ? color(d.id) : "#69b3a2")
        .attr("fill-opacity", 0.9)
        .on("mouseover", (event, d) => {
          if (d.type === "tema") {
            tooltip
              .style("display", "block")
              .html(`<strong>${d.id}</strong><br/>Ocorrências: ${d.count}`);
          }
        })
        .on("mousemove", event => {
          tooltip
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", () => {
          tooltip.style("display", "none");
        })
        .on("click", (event, d) => {
          if (d.type === "tema") highlightConnections(d.id);
          event.stopPropagation();
        })
        .call(drag(simulation));

      const label = container.append("g")
        .selectAll("text")
        .data(nodes)
        .join("text")
        .text(d => d.type === "regiao" ? d.id : "")
        .attr("font-size", "10px")
        .attr("dx", 10)
        .attr("dy", "0.35em")
        .style("opacity", 0);

      simulation.on("tick", () => {
        link.attr("d", d => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.2;
          return `M${d.source.x},${d.source.y} A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });
        node.attr("cx", d => d.x).attr("cy", d => d.y);
        label.attr("x", d => d.x).attr("y", d => d.y);
      });

      function drag(simulation) {
        return d3.drag()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          });
      }

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

      svg.on("click", () => resetHighlight());

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
      <div ref={tooltipRef} className="tooltip" style={{
        position: 'absolute', background: '#fff', border: '1px solid #ccc',
        padding: '5px 10px', borderRadius: '5px', pointerEvents: 'none',
        fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: 'none'
      }} />
    </div>
  );
};

export default NetworkDiagram;
