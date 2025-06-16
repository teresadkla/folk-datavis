const svg = d3.select("#chart");
const width = +svg.attr("width");
const height = +svg.attr("height");
const margin = { top: 60, right: 20, bottom: 120, left: 200 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

// Quantidade de temas visíveis por "página"
const temasPorPagina = 10;
let paginaAtual = 0;

d3.csv("/VIMEO_V5.csv").then(data => {
  // Conta e filtra temas repetidos
  const temaCount = d3.rollup(data, v => v.length, d => d.Tema);
  const temasRepetidos = new Set([...temaCount.entries()].filter(d => d[1] > 1).map(d => d[0]));
  const filteredData = data.filter(d => temasRepetidos.has(d.Tema));

  // Conta ocorrências por tema e região
  const counts = d3.rollups(filteredData,
    v => v.length,
    d => d.Tema,
    d => d.Região
  );

  const processed = [];
  counts.forEach(([tema, regiaoData]) => {
    regiaoData.forEach(([regiao, count]) => {
      // Busca a categoria do primeiro item correspondente
      const categoria = filteredData.find(d => d.Tema === tema && d.Região === regiao)?.Categorias || "";
      processed.push({ tema, regiao, count, categoria });
    });
  });

  const regioes = [...new Set(processed.map(d => d.regiao))];
  const todosTemas = [...new Set(processed.map(d => d.tema))];

  // Escalas
  const xScale = d3.scalePoint()
    .domain(regioes)
    .range([0, innerWidth])
    .padding(0.5);

  const rScale = d3.scaleSqrt()
    .domain([1, d3.max(processed, d => d.count)])
    .range([4, 30]);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Remova/comente o eixo X fixo antigo
  // g.append("g")
  //   .attr("transform", `translate(0,0)`)
  //   .call(d3.axisBottom(xScale))
  //   .selectAll("text")
  //   .attr("transform", "rotate(-45)")
  //   .style("text-anchor", "end");

  const eixoYGroup = g.append("g");

  const circlesGroup = g.append("g");

  // Função para atualizar a página (eixo Y e círculos)
  function atualizarPagina() {
    const temasVisiveis = todosTemas.slice(
      paginaAtual * temasPorPagina,
      (paginaAtual + 1) * temasPorPagina
    );

    const yScale = d3.scalePoint()
      .domain(temasVisiveis)
      .range([0, innerHeight])
      .padding(0.5);

    // Atualiza eixo Y
    eixoYGroup.call(d3.axisLeft(yScale));

    // Filtra os dados visíveis
    const visiveis = processed.filter(d => temasVisiveis.includes(d.tema));

    // Bind dos dados aos círculos
    const circles = circlesGroup.selectAll("circle")
      .data(visiveis, d => d.tema + d.regiao); // chave única por tema e região

    // Remove círculos antigos
    circles.exit().remove();

    // Atualiza existentes
    circles
      .transition()
      .duration(500)
      .attr("cx", d => xScale(d.regiao))
      .attr("cy", d => yScale(d.tema))
      .attr("r", d => rScale(d.count));

    // Adiciona novos
    circles.enter()
      .append("circle")
      .attr("cx", d => xScale(d.regiao))
      .attr("cy", d => yScale(d.tema))
      .attr("r", d => rScale(d.count))
      .attr("fill", "#4682B4")
      .on("click", function(event, d) {
        // Busca todos os artistas para o tema e região
        const artistas = filteredData
          .filter(item => item.Tema === d.tema && item.Região === d.regiao)
          .map(item => item.Nome)
          .filter((v, i, a) => a.indexOf(v) === i); // remove duplicados

        // Busca todos os instrumentos para o tema e região
        const instrumentos = filteredData
          .filter(item => item.Tema === d.tema && item.Região === d.regiao)
          .map(item => item.Instrumento)
          .flatMap(instr => instr ? instr.split(",").map(i => i.trim()) : []) // separa por vírgula se houver vários
          .filter((v, i, a) => v && a.indexOf(v) === i); // remove duplicados e vazios

        d3.select("#categoria-info")
          .html(
        
            `
             <strong>Tema:</strong> ${d.tema} (${d.regiao})<br>
            <strong>Categoria:</strong> ${d.categoria}<br>
             <strong>Artistas:</strong> ${artistas.join(", ")}<br>
             <strong>Instrumentos:</strong> ${instrumentos.join(", ")}`
          );
      })
      .append("title")
      .text(d => `${d.tema} (${d.regiao}): ${d.count}`);

    // Remove linhas verticais antigas
    g.selectAll(".x-grid").remove();

    // Adiciona linhas verticais para cada região visível
    g.selectAll(".x-grid")
      .data(regioes)
      .enter()
      .append("line")
      .attr("class", "x-grid")
      .attr("x1", d => xScale(d))
      .attr("x2", d => xScale(d))
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "#ccc")
      .attr("stroke-dasharray", "2,2");

    // Atualiza eixo X
    g.selectAll(".x-axis").remove();
    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0,0)")
      .call(d3.axisTop(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "start");
  }

  // Botões de navegação
  d3.select("#btn-down").on("click", () => {
    const maxPagina = Math.floor(todosTemas.length / temasPorPagina);
    if (paginaAtual < maxPagina) {
      paginaAtual++;
      atualizarPagina();
    }
  });

  d3.select("#btn-up").on("click", () => {
    if (paginaAtual > 0) {
      paginaAtual--;
      atualizarPagina();
    }
  });

  // Primeira renderização
  atualizarPagina();
});
