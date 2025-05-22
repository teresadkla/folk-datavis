d3.csv("sets.csv").then(data => {
    const svg = d3.select("svg");
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const padding = { top: 60, right: 100, bottom: 60, left: 100 };
  
    // Escala horizontal para os types
    const xScale = d3.scalePoint()
      .range([padding.left, width - padding.right])
      .padding(10);
  
    // Layout vertical com espaçamento entre bolinhas
    const dotSpacing = 10;
  
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
  
      types.forEach(type => {
        const songs = typeMap.get(type);
        const x = xScale(type);
  
        songs.forEach((song, i) => {
          const y = yBase - i * dotSpacing;
  
          svg.append("circle")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", 4)
            .attr("fill", "#444")
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
      });
    }
  
    // Adiciona slider ao body
    const sliderContainer = d3.select("body").append("div")
      .style("width", width + "px")
      .style("margin", "30px auto 0 auto")
      .style("text-align", "center");
  
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
      .style("width", (width - 100) + "px");
  
    const sliderValue = sliderContainer.append("span")
      .style("margin-left", "10px")
      .text("1");
  
    // Atualiza gráfico ao mover o slider
    slider.on("input", function() {
      const value = +this.value;
      sliderValue.text(value);
      updateDots(value);
    });
  
    // Desenha os dots iniciais
    updateDots(1);
  
    // Eixo X com os types
    const xAxis = d3.axisBottom(xScale);
    svg.append("g")
      .attr("transform", `translate(0, ${height - padding.bottom})`)
      .call(xAxis)
      .selectAll("text")
      .attr("transform", "rotate(-30)")
      .style("text-anchor", "end");
  });
  