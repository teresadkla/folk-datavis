// Seleciona o elemento SVG e obtém as suas dimensões
const svg = d3.select("svg");
const width = +svg.attr("width");
const height = +svg.attr("height");

// Cria um grupo centralizado no meio do SVG
const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);

// Seleciona o elemento de tooltip (deve existir no HTML)
const tooltip = d3.select(".tooltip");

// Função para converter datas em objetos Date
const parseDate = d3.timeParse("%Y-%m-%d");
// Escala de cores para os temas
const color = d3.scaleOrdinal(d3.schemeCategory10);

// Configuração do zoom e pan
const zoom = d3.zoom()
  .scaleExtent([0.5, 10])
  .on("zoom", (event) => {
    g.attr("transform", event.transform);
  });

// Aplica o zoom ao SVG
svg.call(zoom);

// Carrega os dados do CSV
d3.csv("/VIMEO_V5.csv").then(data => {
  // Converte a string da data para objeto Date
  data.forEach(d => {
    d.date = parseDate(d.Data);
  });

  // Ordena os dados por data
  data.sort((a, b) => d3.ascending(a.date, b.date));

  // Conta quantas vezes cada tema aparece
  const temaCounts = d3.rollup(data, v => v.length, d => d.Tema);
  // Filtra para mostrar apenas temas com mais de uma ocorrência
  const filteredData = data.filter(d => temaCounts.get(d.Tema) > 1);

  // Parâmetros da espiral
  const a = 5;
  const b = 10;
  const spacing = 15;

  // Array para guardar os pontos da espiral
  const spiralPoints = [];
  let angle = 0;

  // Calcula as coordenadas (x, y) para cada ponto na espiral
  for (let i = 0; i < filteredData.length; i++) {
    const r = a + b * angle; // raio da espiral
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);

    // Guarda as coordenadas no objeto de dados
    filteredData[i].x = x;
    filteredData[i].y = y;
    spiralPoints.push({ x, y });

    // Calcula o próximo ângulo para manter o espaçamento constante
    const dr = b;
    const ds = Math.sqrt(r * r + dr * dr);
    angle += spacing / ds;
  }

  // Cria a linha da espiral
  const spiralLine = d3.line()
    .x(d => d.x)
    .y(d => d.y)
    .curve(d3.curveCardinal);

  // Desenha a espiral no SVG
  g.append("path")
    .datum(spiralPoints)
    .attr("d", spiralLine)
    .attr("fill", "none")
    .attr("stroke", "#999")
    .attr("stroke-width", 1);

  // Desenha os círculos para cada ponto (evento)
  g.selectAll("circle")
    .data(filteredData)
    .enter()
    .append("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", 7)
    .attr("fill", d => color(d.Tema))
    .attr("opacity", 1)
    // Mostra tooltip ao passar o rato
    .on("mouseover", (event, d) => {
      tooltip.style("opacity", 1)
        .html(`<strong>${d.Tema}</strong><br>${d.Data}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
    })
    // Esconde tooltip ao sair com o rato
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
    })
    // Ao clicar, destaca apenas os círculos do mesmo tema
    .on("click", function(event, clickedDatum) {
      const selectedTheme = clickedDatum.Tema;

      g.selectAll("circle")
        .transition()
        .duration(300)
        .attr("opacity", d => d.Tema === selectedTheme ? 1 : 0.1);
    });
});
