const width = 800;
const height = 900;

const svg = d3.select("#map")
  .attr("width", width)
  .attr("height", height);

const projection = d3.geoMercator()
  .center([-8, 39.5]) // centro de Portugal
  .scale(5000)
  .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

// Grupo para aplicar o zoom
const g = svg.append("g");

d3.json("Portugal.json").then(geojson => {
  g.selectAll("path")
    .data(geojson.features)
    .enter()
    .append("path")
    .attr("class", "distrito")
    .attr("d", path)
    .each(function(d) {
      console.log("Desenhando distrito:", d.properties.name);
    });

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
});

// Função de zoom
const zoom = d3.zoom()
  .scaleExtent([1, 8]) // limites de zoom
  .on("zoom", (event) => {
    g.attr("transform", event.transform);
  });

svg.call(zoom);

