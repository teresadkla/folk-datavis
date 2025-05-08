// Seleciona o elemento <svg> e armazena a largura e altura como números
const svg = d3.select("svg");
const width = +svg.attr("width");
const height = +svg.attr("height");

// Cria um grupo <g> centralizado no meio do SVG, onde os elementos gráficos serão desenhados
const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);

// Seleciona o elemento de tooltip (dica de ferramenta) na interface
const tooltip = d3.select(".tooltip");

// Função para converter string de data ("YYYY-MM-DD") em objeto Date
const parseDate = d3.timeParse("%Y-%m-%d");

// Escala de cores categóricas para distinguir diferentes "temas"
const color = d3.scaleOrdinal(d3.schemeCategory10);

// --- ZOOM ---
// Configura comportamento de zoom com limites de escala entre 0.5x e 10x
const zoom = d3.zoom()
  .scaleExtent([0.5, 10])
  .on("zoom", (event) => {
    // Atualiza a transformação do grupo <g> com o valor de zoom atual
    g.attr("transform", event.transform);
  });

// Aplica o comportamento de zoom ao SVG
svg.call(zoom);

// Carrega os dados do CSV
d3.csv("VIMEO_V5.csv").then(data => {
  // Converte a string de data para objeto Date
  data.forEach(d => {
    d.date = parseDate(d.Data);
  });

  // Ordena os dados pela data (mais antiga primeiro)
  data.sort((a, b) => d3.ascending(a.date, b.date));

  // Conta quantas vezes cada Tema aparece
  const temaCounts = d3.rollup(data, v => v.length, d => d.Tema);

  // Filtra os dados para manter apenas os temas que se repetem
  const filteredData = data.filter(d => temaCounts.get(d.Tema) > 1);

  // Parâmetros da espiral (a = distância inicial do centro, b = espaçamento entre voltas)
  const a = 5;
  const b = 10;

  // Define a linha da espiral com interpolação suave (curva cardinal)
  const spiralLine = d3.line()
    .x(d => d.x)
    .y(d => d.y)
    .curve(d3.curveCardinal);

  // Calcula os pontos da espiral para os dados filtrados
  const spiralPoints = filteredData.map((d, i) => {
    const angle = i * 0.3;
    const radius = a + b * angle;
    d.x = radius * Math.cos(angle);
    d.y = radius * Math.sin(angle);
    return { x: d.x, y: d.y };
  });

  // Desenha a linha da espiral conectando todos os pontos
  g.append("path")
    .datum(spiralPoints)
    .attr("d", spiralLine)
    .attr("fill", "none")
    .attr("stroke", "#999")
    .attr("stroke-width", 1);

  // Desenha os círculos apenas para os dados filtrados
  g.selectAll("circle")
    .data(filteredData)
    .enter()
    .append("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", 7)
    .attr("fill", d => color(d.Tema))
    .attr("opacity", 1)
    .on("mouseover", (event, d) => {
      tooltip.style("opacity", 1)
        .html(`<strong>${d.Tema}</strong><br>${d.Data}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
    })
    .on("click", function(event, clickedDatum) {
      const selectedTheme = clickedDatum.Tema;

      g.selectAll("circle")
        .transition()
        .duration(300)
        .attr("opacity", d => d.Tema === selectedTheme ? 1 : 0.1);
    });
});
