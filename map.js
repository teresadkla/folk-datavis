const width = 800;
const height = 600;

const svg = d3.select("#map")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

Promise.all([
  d3.json("portugal.json"), // topojson com os distritos
  d3.csv("VIMEO_V5.csv", d3.autoType)
]).then(([mapData, musicData]) => {
  const districts = topojson.feature(mapData, mapData.objects.distritos);

  // Agrupar músicas por distrito
  const musicCount = d3.rollup(
    musicData,
    v => v.length,
    d => d["Distrito/Ilha"]
  );

  // Escala para os círculos
  const radiusScale = d3.scaleSqrt()
    .domain([0, d3.max(musicCount.values())])
    .range([0, 30]);

  // Projeção e path
  const projection = d3.geoMercator()
    .fitSize([width, height], districts);
  const path = d3.geoPath().projection(projection);

  // Desenhar o mapa
  svg.selectAll("path")
    .data(districts.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", "#ccc")
    .attr("stroke", "#333");

  // Adicionar círculos
  svg.selectAll("circle")
    .data(districts.features)
    .enter()
    .append("circle")
    .attr("cx", d => projection(d3.geoCentroid(d))[0])
    .attr("cy", d => projection(d3.geoCentroid(d))[1])
    .attr("r", d => {
      const count = musicCount.get(d.properties.name) || 0;
      return radiusScale(count);
    })
    .append("title")
    .text(d => {
      const count = musicCount.get(d.properties.name) || 0;
      return `${d.properties.name}: ${count} músicas`;
    });
});
