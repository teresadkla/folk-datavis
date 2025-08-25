// Crie um container com scroll horizontal
d3.select("body")
  .append("div")
  .attr("id", "scroll-container")
  .style("width", "1000px") // ajuste conforme necessário
  .style("overflow-x", "auto")
  .style("border-bottom", "1px solid #ccc");

// Mova o SVG para dentro do container
d3.select("#scroll-container")
  .append("svg")
  .attr("width", 1500) // largura inicial grande, pode ser ajustada dinamicamente
 ; // altura conforme necessário

// Adiciona slider DENTRO do scroll-container
const sliderContainer = d3.select("#scroll-container").append("div")
  .style("width", "100%")
  .style("margin", "10px 0 0 0")
  .style("text-align", "center")
  .style("position", "sticky")
  .style("top", "0")
  .style("background", "#fff")
  .style("z-index", "10");

sliderContainer.append("label")
  .attr("for", "settingorder-slider")
  .style("margin-right", "10px")
  .text("settingorder:");

const slider = sliderContainer.append("input")
  .attr("type", "range")
  .attr("min", 1)
  .attr("max", 128)
  .attr("value", 1)
  .attr("id", "settingorder-slider")
  .style("width", "80%");

const sliderValue = sliderContainer.append("span")
  .style("margin-left", "10px")
  .text("1");

d3.csv("/sets.csv").then(data => {
    const svg = d3.select("svg");
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const padding = { top: 0, right: 100, bottom: 60, left: 100 };
  
    // Escala horizontal para os types
    const xScale = d3.scalePoint()
      .range([padding.left, width - padding.right])
      .padding(0.5);

    // Escala de cor para os types
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
  
    // Layout vertical com espaçamento entre bolinhas
    const dotSpacing = 10;

    // Parâmetros para layout dos dots
    const dotsPerCol = 60;      // Máximo de dots por coluna
    const colSpacing = 18;      // Espaço horizontal entre colunas
    const typeSpacing = 30;     // Espaço extra entre types
  
    // Tooltip
    const tooltip = d3.select("body").append("div")
      .style("position", "absolute")
      .style("padding", "6px 10px")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("border-radius", "6px")
      .style("pointer-events", "none")
      .style("font-size", "12px")
      .style("display", "none");
  
    // Base vertical para começar os dots (a linha do eixo X)
    const yBase = height - padding.bottom;
  
    // Função para desenhar os círculos com base no settingorder selecionado
    function updateDots(settingorder) {
      svg.selectAll("circle").remove();
      svg.selectAll(".type-label").remove();

      // Filtrar dados conforme o settingorder
      const filteredRaw = data.filter(d => +d.settingorder === settingorder);
  
      // Remover duplicadas com base na coluna "abc"
      const seenAbc = new Set();
      const filteredData = filteredRaw.filter(d => {
        if (seenAbc.has(d.abc)) return false;
        seenAbc.add(d.abc);
        return true;
      });
  
      const typeMap = d3.group(filteredData, d => d.type);
      const types = Array.from(typeMap.keys());
  
      xScale.domain(types);
  
      let xStart = padding.left;
      types.forEach(type => {
        const songs = typeMap.get(type);
        const numCols = Math.ceil(songs.length / dotsPerCol);
      
        // Label alinhada ao início dos dots deste type
        svg.append("text")
          .attr("class", "type-label")
          .attr("x", xStart)
          .attr("y", yBase + 25) // ajuste conforme necessário
          .attr("text-anchor", "start")
          .attr("font-size", 13)
          .attr("fill", "#333")
          .attr("transform", `rotate(-30,${xStart},${yBase + 25})`)
          .text(type);

        songs.forEach((song, i) => {
          const col = Math.floor(i / dotsPerCol);
          const row = i % dotsPerCol;
          const cx = xStart + col * colSpacing;
          const cy = yBase - row * dotSpacing;
      
          svg.append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", 4)
            .attr("fill", colorScale(type))
            .on("mouseover", () => {
              tooltip.style("display", "block").text(song.name);
            })
            .on("mousemove", (event) => {
              tooltip.style("left", (event.pageX + 10) + "px")
                     .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", () => {
              tooltip.style("display", "none");
            });
        });
      
        xStart += numCols * colSpacing + typeSpacing;
      });
      svg.attr("width", xStart + padding.right);
    }
  
    // Atualiza gráfico ao mover o slider
    slider.on("input", function() {
      const value = +this.value;
      sliderValue.text(value);
      updateDots(value);
    });
  
    // Desenha os dots iniciais
    updateDots(1);
  
    // Eixo X com os types
    // svg.append("g")
    //   .attr("transform", `translate(0, ${height - padding.bottom})`)
    //   .call(xAxis)
    //   .selectAll("text")
    //   .attr("transform", "rotate(-30)")
    //   .style("text-anchor", "end");
  });
