// Definir largura e altura com base no tamanho da janela
const width = window.innerWidth;
const height = window.innerHeight;

// Selecionar o elemento SVG e definir suas dimensões
const svg = d3.select("svg")
              .attr("width", width)
              .attr("height", height);

// Adicionar definições para filtros
const defs = svg.append("defs");

// Criar filtro de turbulência
const turbulenceFilter = defs.append("filter")
    .attr("id", "linkTurbulence")
    .attr("x", "-50%")
    .attr("y", "-50%")
    .attr("width", "200%")
    .attr("height", "200%");

// Adicionar o elemento feTurbulence
turbulenceFilter.append("feTurbulence")
    .attr("type", "turbulence")
    .attr("baseFrequency", "0.01 0.02")  // controla a "ondulação"
    .attr("numOctaves", "20")             // controla a complexidade
    .attr("seed", "15")                  // valor semente para o padrão
    .attr("result", "turbulence");

// Adicionar deslocamento baseado na turbulência
turbulenceFilter.append("feDisplacementMap")
    .attr("in", "SourceGraphic")
    .attr("in2", "turbulence")
    .attr("scale", "10")                // intensidade do efeito
    .attr("xChannelSelector", "R")
    .attr("yChannelSelector", "G");

// Criar um grupo 'g' dentro do SVG para aplicar zoom e pan
const container = svg.append("g");

// Adicionar funcionalidade de zoom e pan ao SVG
svg.call(
  d3.zoom()
    .scaleExtent([0.2, 5]) // limites de zoom
    .on("zoom", (event) => {
      container.attr("transform", event.transform); // aplicar transformação ao grupo
    })
);

// Criar tooltip invisível inicialmente
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip");

// Escala de cores para regiões (categorias distintas)
const color = d3.scaleOrdinal(d3.schemeCategory10);

// Escala de tamanho dos nós (temas), baseada no número de ocorrências
const sizeScale = d3.scaleLinear().range([5, 25]);

// Carregar os dados do CSV
d3.csv("VIMEO_V5.csv").then(data => {
  const themeCounts = {};          // contador de temas
  const themeRegionCounts = {};   // contador de ligações tema-região
  const regionSet = new Set();    // conjunto de regiões únicas

  // Processar os dados para contar ocorrências
  data.forEach(d => {
    const tema = d.Tema;
    const regiao = d.Região;

    regionSet.add(regiao); // adicionar região ao conjunto

    // Contar quantas vezes cada tema aparece
    if (!themeCounts[tema]) themeCounts[tema] = 0;
    themeCounts[tema]++;

    // Contar quantas vezes cada par tema-região aparece
    const key = `${tema}||${regiao}`;
    if (!themeRegionCounts[key]) themeRegionCounts[key] = 0;
    themeRegionCounts[key]++;
  });

  // Filtrar temas que aparecem mais de DEZ vezes (modificado)
  const repeatedThemes = Object.keys(themeCounts).filter(t => themeCounts[t] > 13);

  const nodes = [];        // lista de nós (temas e regiões)
  const links = [];        // lista de ligações entre temas e regiões
  const nodeByName = {};   // mapa de nome -> nó (para acesso rápido)

  // Definir domínio da escala de tamanho dos temas
  const maxThemeCount = d3.max(Object.values(themeCounts));
  sizeScale.domain([1, maxThemeCount]);

  // Criar nós para temas repetidos
  repeatedThemes.forEach(theme => {
    const node = {
      id: theme,
      type: "tema",
      count: themeCounts[theme]
    };
    nodes.push(node);
    nodeByName[theme] = node;
  });

  // Criar nós para regiões
  regionSet.forEach(region => {
    const node = {
      id: region,
      type: "regiao"
    };
    nodes.push(node);
    nodeByName[region] = node;
  });

  // Criar ligações entre temas repetidos e suas respetivas regiões
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

  // Criar simulação física da rede
  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(90).strength(1))
    .force("charge", d3.forceManyBody().strength(-1000)) // repulsão entre nós
    .force("center", d3.forceCenter(width / 2, height / 2)); // centralizar rede

  // Criar elementos de ligação (curvas) com efeito de turbulência
  const link = container.append("g")
    .attr("class", "links")
    .selectAll("path")
    .data(links)
    .join("path")
    .attr("stroke", "brown")
    .attr("stroke-width", d => Math.sqrt(d.value))
    .attr("stroke-opacity", 0.6)
    .attr("fill", "none")
    .attr("filter", "url(#linkTurbulence)"); // Aplicar o filtro de turbulência

  // Criar nós como círculos
  const node = container.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", d => d.type === "tema" ? sizeScale(d.count) : 10)
    .attr("fill", d => d.type === "regiao" ? color(d.id) : "#69b3a2")
    .attr("fill-opacity", 0.9)
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
    .on("click", (event, d) => {
      if (d.type === "tema") {
        highlightConnections(d.id); // destacar ligações desse tema
      }
      event.stopPropagation(); // impedir propagação do clique
    })
    .call(drag(simulation)); // aplicar comportamento de arrastar

  // Criar rótulos com nomes dos nós
  const label = container.append("g")
  .selectAll("text")
  .data(nodes)
  .join("text")
  .text(d => d.type === "regiao" ? d.id : "") // só regiões têm texto
  .attr("font-size", "10px")
  .attr("dx", 10)
  .attr("dy", "0.35em")
  .style("opacity", 0); // começa escondido

  // Atualizar posições a cada tick da simulação
  simulation.on("tick", () => {
    // Desenhar ligações como arcos curvos
    link.attr("d", d => {
      const dx = d.target.x - d.source.x;
      const dy = d.target.y - d.source.y;
      const dr = Math.sqrt(dx * dx + dy * dy) * 1.2;
      return `M${d.source.x},${d.source.y} A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
    });

    // Atualizar posição dos nós
    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);

    // Atualizar posição dos rótulos
    label
      .attr("x", d => d.x)
      .attr("y", d => d.y);
  });

  // Função para permitir arrastar os nós
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

  // Destacar as ligações e nós associados a um tema selecionado
  function highlightConnections(selectedId) {
    node.style("opacity", n =>
      n.id === selectedId || links.some(l =>
        (l.source.id === selectedId && l.target.id === n.id) ||
        (l.target.id === selectedId && l.source.id === n.id)
      ) ? 1 : 0.1
    );

    link.style("opacity", l =>
      l.source.id === selectedId || l.target.id === selectedId ? 1 : 0.1
    );

    label.style("opacity", n =>
      n.type === "regiao" && links.some(l =>
        (l.source.id === selectedId && l.target.id === n.id) ||
        (l.target.id === selectedId && l.source.id === n.id)
      ) ? 1 : 0
    );
  }

  // Reset ao clicar fora de qualquer nó
  svg.on("click", () => {
    resetHighlight();
  });

  // Função para restaurar a opacidade padrão
  function resetHighlight() {
    node.style("opacity", 1);
    link.style("opacity", 0.6);
    label.style("opacity", 0);
  }
});