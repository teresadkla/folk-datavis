const svg = d3.select("svg");
const width = +svg.attr("width");
const height = +svg.attr("height");
const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);

const tooltip = d3.select(".tooltip");

const parseDate = d3.timeParse("%Y-%m-%d");
const color = d3.scaleOrdinal(d3.schemeCategory10);

// ZOOM
const zoom = d3.zoom()
  .scaleExtent([0.5, 10]) // limites: mínimo 0.5x, máximo 10x
  .on("zoom", (event) => {
    g.attr("transform", event.transform);
  });

svg.call(zoom);

d3.csv("VIMEO_V5.csv").then(data => {
  data.forEach(d => {
    d.date = parseDate(d.Data);
  });

  data.sort((a, b) => d3.ascending(a.date, b.date));

  const a = 5;
  const b = 10;

  const spiralLine = d3.line()
    .x(d => d.x)
    .y(d => d.y)
    .curve(d3.curveCardinal);

  const spiralPoints = data.map((d, i) => {
    const angle = i * 0.3;
    const radius = a + b * angle;
    d.x = radius * Math.cos(angle);
    d.y = radius * Math.sin(angle);
    return { x: d.x, y: d.y };
  });

  g.append("path")
    .datum(spiralPoints)
    .attr("d", spiralLine)
    .attr("fill", "none")
    .attr("stroke", "#999")
    .attr("stroke-width", 1);

  g.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", 6)
    .attr("fill", d => color(d.Tema))
    .on("mouseover", (event, d) => {
      tooltip.style("opacity", 1)
        .html(`<strong>${d.Tema}</strong><br>${d.Data}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
    });
});
