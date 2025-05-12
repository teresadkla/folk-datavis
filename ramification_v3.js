// Definir largura e altura com base no tamanho da janela
const width = window.innerWidth;
const height = window.innerHeight;

// Selecionar o elemento SVG e definir suas dimensões
const svg = d3.select("svg")
              .attr("width", width)
              .attr("height", height);

// Criar tooltip
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("padding", "6px")
  .style("background", "white")
  .style("border", "1px solid #ccc")
  .style("display", "none");

// Criar grupo principal
const container = svg.append("g")
                     .attr("transform", "translate(50,50)");

// Adicionar funcionalidade de zoom e pan
svg.call(
  d3.zoom()
    .scaleExtent([0.2, 5])
    .on("zoom", (event) => {
      container.attr("transform", event.transform);
    })
);

// Carregar os dados do CSV
d3.csv("VIMEO_V5.csv").then(data => {
  const themeCounts = {};

  // Contar ocorrências de cada tema
  data.forEach(d => {
    const tema = d.Tema;
    if (!themeCounts[tema]) themeCounts[tema] = 0;
    themeCounts[tema]++;
  });

  // Converter em array de objetos e ordenar por número de ocorrências
  const sortedThemes = Object.entries(themeCounts)
    .map(([tema, count]) => ({ name: tema, count }))
    .sort((a, b) => d3.descending(a.count, b.count));

  // Criar hierarquia "falsa" para o tree layout
  const root = d3.hierarchy({ name: "Temas", children: sortedThemes })
    .sum(d => d.count);

  // Definir layout de árvore
  const treeLayout = d3.tree().size([height - 100, width - 200]);
  treeLayout(root);

  // Criar links entre os nós
  container.selectAll("path.link")
    .data(root.links())
    .enter()
    .append("path")
    .attr("class", "link")
    .attr("fill", "none")
    .attr("stroke", "#ccc")
    .attr("stroke-width", 2)
    .attr("d", d3.linkHorizontal()
      .x(d => d.y)
      .y(d => d.x)
    );

  // Criar nós
  const node = container.selectAll("g.node")
    .data(root.descendants())
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.y},${d.x})`);

  node.append("circle")
    .attr("r", d => d.depth === 0 ? 10 : Math.sqrt(d.data.count) * 1.5)
    .attr("fill", d => d.depth === 0 ? "#69b3a2" : "steelblue")
    .on("mouseover", (event, d) => {
      if (d.depth > 0) {
        tooltip
          .style("display", "block")
          .html(`<strong>${d.data.name}</strong><br/>Ocorrências: ${d.data.count}`);
      }
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", () => tooltip.style("display", "none"));

  node.append("text")
    .attr("dx", 10)
    .attr("dy", 3)
    .text(d => d.depth === 0 ? "" : d.data.name)
    .style("font-size", "12px");
});
