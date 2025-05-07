const width = 800;
const height = 900;

const svg = d3.select("#map")
  .attr("width", width)
  .attr("height", height);

const projection = d3.geoMercator()
  .center([-8, 39.5]) // centro de Portugal
  .scale(6000)
  .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

// Grupo para aplicar o zoom
const g = svg.append("g");

// Criar tooltip
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("padding", "10px")
  .style("background", "white")
  .style("border", "1px solid #999")
  .style("border-radius", "8px")
  .style("pointer-events", "none")
  .style("opacity", 0);

d3.json("Portugal.json").then(geojson => {
  // Desenhar os distritos
  g.selectAll("path")
    .data(geojson.features)
    .enter()
    .append("path")
    .attr("class", "distrito")
    .attr("d", path)
    .each(function(d) {
      console.log("Desenhando distrito:", d.properties.name);
    });

  // Adicionar os nomes dos distritos
  g.selectAll("text")
    .data(geojson.features)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("transform", d => {
      const centroid = path.centroid(d);
      return `translate(${centroid})`;
    })
    .text(d => d.properties.name);

  // Carregar os dados do CSV
  d3.csv("VIMEO_V5.csv").then(data => {
    // Agrupar os temas por distrito
    const temasPorDistrito = d3.rollup(
      data,
      v => v.map(d => d["Tema"]),
      d => d["Distrito/Ilha"]
    );

    // Adicionar círculos no centro dos distritos
    g.selectAll("circle")
      .data(geojson.features)
      .enter()
      .append("circle")
      .attr("cx", d => path.centroid(d)[0])
      .attr("cy", d => path.centroid(d)[1])
      .attr("r", d => {
        const temas = temasPorDistrito.get(d.properties.name) || [];
        return Math.sqrt(temas.length) * 2; // escala ajustável
      })

      .attr("fill", "rgba(255, 0, 68, 0.6)")
      /* .attr("stroke", "#900")
      .attr("stroke-width", 1)*/
      .on("mouseover", function(event, d) {
        const temas = temasPorDistrito.get(d.properties.name) || [];
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(
          `<strong>${d.properties.name}</strong><br>${temas.length} temas:<br><ul>` +
          temas.slice(0, 10).map(t => `<li>${t}</li>`).join("") + 
          (temas.length > 10 ? "<li>...</li>" : "") +
          "</ul>"
        );
      })
      .on("mousemove", event => {
        tooltip.style("left", (event.pageX + 15) + "px")
               .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(300).style("opacity", 0);
      });
  });
});

// Função de zoom
const zoom = d3.zoom()
  .scaleExtent([1, 8]) // limites de zoom
  .on("zoom", (event) => {
    g.attr("transform", event.transform);
  });

svg.call(zoom);
