const svg = d3.select("svg");
const margin = { top: 100, right: 50, bottom: 20, left: 150 };
const width = +svg.attr("width") - margin.left - margin.right;
const height = +svg.attr("height") - margin.top - margin.bottom;
const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

let startIndex = 0;
const pageSize = 40;

// Adiciona o tooltip (apenas uma vez)
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("background", "#fff")
  .style("border", "1px solid #ccc")
  .style("padding", "6px 10px")
  .style("border-radius", "4px")
  .style("pointer-events", "none")
  .style("opacity", 0);

function renderHeatmap(data, names, types, countMap) {
  g.selectAll("*").remove(); // Limpa o gráfico

  // Pega apenas 20 nomes a partir do índice atual
  const visibleNames = names.slice(startIndex, startIndex + pageSize);

  // Escalas
  const xScale = d3.scaleBand().domain(types).range([0, width]).padding(0.1);
  const yScale = d3.scaleBand().domain(visibleNames).range([0, height]).padding(0.1);
  const colorScale = d3.scaleSequential(d3.interpolatePlasma)
    .domain([1, d3.max(Array.from(countMap.values(), m => d3.max(m.values())))]);

  // Eixos
  g.append("g")
    .call(d3.axisLeft(yScale));
  g.append("g")
    .attr("transform", `translate(0,-10)`)
    .call(d3.axisTop(xScale))
    .selectAll("text")
    .attr("transform", "rotate(0)")
    .style("text-anchor", "center");

  // Gridlines horizontais (para cada música)
  g.selectAll(".y-grid")
    .data(visibleNames)
    .enter()
    .append("line")
    .attr("class", "y-grid")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", d => yScale(d) + yScale.bandwidth() / 2)
    .attr("y2", d => yScale(d) + yScale.bandwidth() / 2)
    .attr("stroke", "#888")
    .attr("stroke-opacity", 0.2)
    .attr("stroke-width", 1);

  // Gridlines verticais (para cada tipo)
  g.selectAll(".x-grid")
    .data(types)
    .enter()
    .append("line")
    .attr("class", "x-grid")
    .attr("y1", 0)
    .attr("y2", height)
    .attr("x1", d => xScale(d) + xScale.bandwidth() / 2)
    .attr("x2", d => xScale(d) + xScale.bandwidth() / 2)
    .attr("stroke", "#888")
    .attr("stroke-opacity", 0.2)
    .attr("stroke-width", 1);

  // Desenhar bolinhas
  for (const [name, typeMap] of countMap) {
    if (!visibleNames.includes(name)) continue;
    for (const [type, count] of typeMap) {
      g.append("circle")
        .attr("cx", xScale(type) + xScale.bandwidth() / 2)
        .attr("cy", yScale(name) + yScale.bandwidth() / 2)
        .attr("r", 5)
        .attr("fill", colorScale(count))
        // .attr("class", "dot")
        .attr("stroke", "none") 
        .on("mouseover", function(event) {
          tooltip.transition().duration(100).style("opacity", 1);
          tooltip.html(`<strong>${name}</strong><br>${type}: <b>${count}</b> variações`);
        })
        .on("mousemove", function(event) {
          tooltip
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function() {
          tooltip.transition().duration(200).style("opacity", 0);
        });
    }
  }
}

// Adiciona botão de filtro acima do gráfico
d3.select("body")
  .insert("button", ":first-child")
  .attr("id", "filter-multi-type")
  .text("Mostrar apenas músicas com mais de um tipo");

let filterActive = false;

// Carregar dados e inicializar
d3.csv("/sets.csv").then(data => {
  const countMap = d3.rollup(
    data,
    v => v.length,
    d => d.name,
    d => d.type
  );
  const names = Array.from(new Set(data.map(d => d.name))).sort();
  const types = Array.from(new Set(data.map(d => d.type))).sort();

  // Função para filtrar nomes com mais de um tipo
  function getFilteredNames() {
    return Array.from(countMap.entries())
      .filter(([name, typeMap]) => typeMap.size > 1)
      .map(([name]) => name)
      .sort();
  }

  // Eventos dos botões
  d3.select("#nav-up").on("click", () => {
    if (startIndex > 0) {
      startIndex -= pageSize;
      renderHeatmap(
        data,
        filterActive ? getFilteredNames() : names,
        types,
        countMap
      );
    }
  });

  d3.select("#nav-down").on("click", () => {
    const currentNames = filterActive ? getFilteredNames() : names;
    if (startIndex + pageSize < currentNames.length) {
      startIndex += pageSize;
      renderHeatmap(
        data,
        currentNames,
        types,
        countMap
      );
    }
  });

  d3.select("#filter-multi-type").on("click", function () {
    filterActive = !filterActive;
    startIndex = 0;
    d3.select(this).text(
      filterActive
        ? "Mostrar todas as músicas"
        : "Mostrar apenas músicas com mais de um tipo"
    );
    renderHeatmap(
      data,
      filterActive ? getFilteredNames() : names,
      types,
      countMap
    );
  });

  renderHeatmap(data, names, types, countMap);
});
