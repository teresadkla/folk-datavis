// Definir largura e altura com base no tamanho da janela
const width = window.innerWidth;
const height = window.innerHeight;

// Selecionar o elemento SVG e definir suas dimensões
const svg = d3.select("svg")
              .attr("width", width)
              .attr("height", height);

// Adicionar definições para filtros
const defs = svg.append("defs");



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

// Escala de tamanho dos nós, baseada no número de ocorrências
const sizeScale = d3.scaleLinear().range([5, 25]);

// Função para processar os dados
function processData(csvFile, nodeTypeMap) {
  // Carregar os dados do CSV
  d3.csv(csvFile).then(data => {
    const itemCounts = {};          // contador de itens (temas/names)
    const itemCategoryCounts = {};  // contador de ligações item-categoria
    const categorySet = new Set();  // conjunto de categorias únicas (regiões/modes)

    // Extrair nomes das colunas baseado no tipo de arquivo
    const itemColumn = nodeTypeMap.itemColumn;
    const categoryColumn = nodeTypeMap.categoryColumn;
    const itemType = nodeTypeMap.itemType;
    const categoryType = nodeTypeMap.categoryType;
    const minCount = nodeTypeMap.minCount || 10;

    // Processar os dados para contar ocorrências
    data.forEach(d => {
      const item = d[itemColumn];
      const category = d[categoryColumn];

      categorySet.add(category); // adicionar categoria ao conjunto

      // Contar quantas vezes cada item aparece
      if (!itemCounts[item]) itemCounts[item] = 0;
      itemCounts[item]++;

      // Contar quantas vezes cada par item-categoria aparece
      const key = `${item}||${category}`;
      if (!itemCategoryCounts[key]) itemCategoryCounts[key] = 0;
      itemCategoryCounts[key]++;
    });

    // Filtrar itens que aparecem mais de X vezes
    const repeatedItems = Object.keys(itemCounts).filter(t => itemCounts[t] > minCount);

    const nodes = [];        // lista de nós (itens e categorias)
    const links = [];        // lista de ligações entre itens e categorias
    const nodeByName = {};   // mapa de nome -> nó (para acesso rápido)

    // Definir domínio da escala de tamanho dos itens
    const maxItemCount = d3.max(Object.values(itemCounts));
    sizeScale.domain([1, maxItemCount]);

    // Criar nós para itens repetidos
    repeatedItems.forEach(item => {
      const node = {
        id: item,
        type: itemType,
        count: itemCounts[item]
      };
      nodes.push(node);
      nodeByName[item] = node;
    });

    // Criar nós para categorias
    categorySet.forEach(category => {
      const node = {
        id: category,
        type: categoryType
      };
      nodes.push(node);
      nodeByName[category] = node;
    });

    // Criar ligações entre itens repetidos e suas respectivas categorias
    Object.entries(itemCategoryCounts).forEach(([key, count]) => {
      const [item, category] = key.split("||");

      if (repeatedItems.includes(item)) {
        links.push({
          source: item,
          target: category,
          value: count
        });
      }
    });

    // Limpar visualização anterior
    container.selectAll("*").remove();

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
      .attr("r", d => d.type === itemType ? sizeScale(d.count) : 10)
      .attr("fill", d => d.type === categoryType ? color(d.id) : "#69b3a2")
      .attr("fill-opacity", 0.9)
      .on("mouseover", (event, d) => {
        if (d.type === itemType) {
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
        if (d.type === itemType) {
          highlightConnections(d.id); // destacar ligações desse item
        }
        event.stopPropagation(); // impedir propagação do clique
      })
      .call(drag(simulation)); // aplicar comportamento de arrastar

    // Criar rótulos com nomes dos nós
    const label = container.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text(d => d.type === categoryType ? d.id : "") // só categorias têm texto
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

    // Destacar as ligações e nós associados a um item selecionado
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
        n.type === categoryType && links.some(l =>
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
}

// Criar interface de controle para escolher o arquivo
const controls = d3.select("body")
  .append("div")
  .attr("class", "controls")
  .style("position", "absolute")
  .style("top", "10px")
  .style("left", "10px")
  .style("background-color", "rgba(255,255,255,0.8)")
  .style("padding", "10px")
  .style("border-radius", "5px")
  .style("z-index", "1000");

// Adicionar seletor de arquivo
controls.append("div")
  .text("Selecione o arquivo de dados:")
  .style("margin-bottom", "5px");

const fileSelect = controls.append("select")
  .style("margin-right", "10px");

fileSelect.append("option")
  .attr("value", "sets")
  .text("sets.csv");

fileSelect.append("option")
  .attr("value", "vimeo")
  .text("VIMEO_V5.csv");

// Adicionar slider para limiar de contagem mínima
controls.append("div")
  .text("Limiar de contagem mínima:")
  .style("margin-top", "10px")
  .style("margin-bottom", "5px");

const thresholdInput = controls.append("input")
  .attr("type", "range")
  .attr("min", "1")
  .attr("max", "500")
  .attr("value", "10")
  .style("width", "100%");

const thresholdValue = controls.append("div")
  .text("10")
  .style("text-align", "center");

// Atualizar o valor exibido quando o slider é movido
thresholdInput.on("input", function() {
  thresholdValue.text(this.value);
});

// Adicionar botão para carregar os dados
controls.append("button")
  .text("Carregar Dados")
  .style("margin-top", "10px")
  .style("padding", "5px 10px")
  .on("click", function() {
    const selectedFile = fileSelect.node().value;
    const threshold = parseInt(thresholdInput.node().value);
    
    if (selectedFile === "sets") {
      processData("sets.csv", {
        itemColumn: "name",
        categoryColumn: "mode",
        itemType: "name",
        categoryType: "mode",
        minCount: threshold
      });
    } else if (selectedFile === "vimeo") {
      processData("VIMEO_V5.csv", {
        itemColumn: "Tema",
        categoryColumn: "Região",
        itemType: "tema",
        categoryType: "regiao",
        minCount: threshold
      });
    }
  });

// Adicionar estilos para o tooltip
d3.select("head").append("style").html(`
  .tooltip {
    position: absolute;
    background-color: white;
    border: 1px solid #ddd;
    padding: 8px;
    border-radius: 4px;
    pointer-events: none;
    display: none;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
`);

// Carregar dados iniciais (sets.csv por padrão)
processData("sets.csv", {
  itemColumn: "name",
  categoryColumn: "mode",
  itemType: "name",
  categoryType: "mode",
  minCount: 10
});