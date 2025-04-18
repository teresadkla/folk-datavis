const width = window.innerWidth;
const height = window.innerHeight;
const svg = d3.select("svg")
              .attr("width", width)
              .attr("height", height);

// Grupo para aplicar zoom e pan
const container = svg.append("g");

// Zoom & Pan
svg.call(
  d3.zoom()
    .scaleExtent([0.2, 5])
    .on("zoom", (event) => {
      container.attr("transform", event.transform);
    })
);

// Tooltip
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip");

// Cor para regiões
const color = d3.scaleOrdinal(d3.schemeCategory10);

// Escala de tamanho dos nós de tema
const sizeScale = d3.scaleLinear().range([6, 20]);

// Carregar CSV
d3.csv("VIMEO_V5.csv").then(data => {
  const themeCounts = {};
  const themeRegionCounts = {};
  const regionSet = new Set();

  // Contagem de temas e temas por região
  data.forEach(d => {
    const tema = d.Tema;
    const regiao = d.Região;

    regionSet.add(regiao);

    // Contagem total do tema
    if (!themeCounts[tema]) themeCounts[tema] = 0;
    themeCounts[tema]++;

    // Contagem por tema + região
    const key = `${tema}||${regiao}`;
    if (!themeRegionCounts[key]) themeRegionCounts[key] = 0;
    themeRegionCounts[key]++;
  });

  // Filtrar apenas temas repetidos
  const repeatedThemes = Object.keys(themeCounts).filter(t => themeCounts[t] > 1);

  const nodes = [];
  const links = [];
  const nodeByName = {};

  // Atualizar escala
  const maxThemeCount = d3.max(Object.values(themeCounts));
  sizeScale.domain([1, maxThemeCount]);

  // Criar nós de temas
  repeatedThemes.forEach(theme => {
    const node = {
      id: theme,
      type: "tema",
      count: themeCounts[theme]
    };
    nodes.push(node);
    nodeByName[theme] = node;
  });

  // Criar nós de regiões
  regionSet.forEach(region => {
    const node = {
      id: region,
      type: "regiao"
    };
    nodes.push(node);
    nodeByName[region] = node;
  });

  // Criar links
  Object.entries(themeRegionCounts).forEach(([key, count]) => {
    const [tema, regiao] = key.split("||");

    if (repeatedThemes.includes(tema)) {
      links.push({
        source: tema,
        target: regiao,
        value: count
      });
    }
  });

  // Força
  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(100).strength(0.3))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2));

  // Links
  const link = container.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("stroke", "#999")
    .attr("stroke-width", d => Math.sqrt(d.value))
    .attr("stroke-opacity", 0.6);

  // Nós
  const node = container.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", d => d.type === "tema" ? sizeScale(d.count) : 10)
    .attr("fill", d => d.type === "regiao" ? color(d.id) : "#69b3a2")
    .on("mouseover", (event, d) => {
      if (d.type === "tema") {
        tooltip
          .style("display", "block")
          .html(`<strong>${d.id}</strong><br/>Ocorrências: ${d.count}`);
      }
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", () => {
      tooltip.style("display", "none");
    })
    .call(drag(simulation));

  // Labels
  const label = container.append("g")
    .selectAll("text")
    .data(nodes)
    .join("text")
    .text(d => d.id)
    .attr("font-size", "10px")
    .attr("dx", 10)
    .attr("dy", "0.35em");

  // Simulação
  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);

    label
      .attr("x", d => d.x)
      .attr("y", d => d.y);
  });

  // Função de arrasto
  function drag(simulation) {
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }
});
