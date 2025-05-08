const width = 800;
const height = 900;

const svg = d3.select("#map")
  .attr("width", width)
  .attr("height", height);

const projection = d3.geoMercator()
  .center([-8, 39.5]) // centro de Portugal
  .scale(6000)
  .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

// Grupo para aplicar o zoom
const g = svg.append("g");

// Criar tooltip
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("padding", "10px")
  .style("background", "white")
  .style("border", "1px solid #999")
  .style("border-radius", "8px")
  .style("pointer-events", "none")
  .style("opacity", 0);

// Função para extrair o ano da data no formato "16 de Janeiro de 2011"
function extractYear(dateString) {
  const match = dateString.match(/(\d{1,2})\s+de\s+([a-zA-Z]+)\s+de\s+(\d{4})/);
  return match ? match[3] : null; // Retorna o ano (parte [3] da regex)
}

// Função para atualizar os círculos com base no filtro de ano
function updateCircles(filteredData, geojson, selectedYear) {
  console.log("Atualizando círculos...");

  // Agrupar os temas por distrito e por ano
  const temasPorDistritoAno = d3.rollup(
    filteredData,
    v => v.length,
    d => d["Distrito/Ilha"],
    d => extractYear(d["Data"])
  );

  g.selectAll("circle")
    .data(geojson.features)
    .join("circle")
    .attr("cx", d => path.centroid(d)[0])
    .attr("cy", d => path.centroid(d)[1])
    .attr("r", d => {
      const temasPorAno = temasPorDistritoAno.get(d.properties.name) || new Map();
      if (selectedYear) {
        // Se houver ano selecionado, mostra só desse ano
        return Math.sqrt(temasPorAno.get(selectedYear) || 0) * 2;
      } else {
        // Se não houver ano selecionado, soma todos os anos
        const total = Array.from(temasPorAno.values()).reduce((a, b) => a + b, 0);
        return Math.sqrt(total) * 2;
      }
    })
    .attr("fill", "rgba(255, 0, 68, 0.6)")
    .on("mouseover", function(event, d) {
      const temasPorAno = temasPorDistritoAno.get(d.properties.name) || new Map();
      let temasNoAno, label, temasLista;
      if (selectedYear) {
        temasNoAno = temasPorAno.get(selectedYear) || 0;
        // Filtra os temas desse distrito e ano
        temasLista = filteredData
          .filter(item => item["Distrito/Ilha"] === d.properties.name && extractYear(item["Data"]) === selectedYear)
          .map(item => item["Tema"]);
        label = `${temasNoAno} temas em ${selectedYear}`;
      } else {
        temasNoAno = Array.from(temasPorAno.values()).reduce((a, b) => a + b, 0);
        // Filtra todos os temas desse distrito
        temasLista = filteredData
          .filter(item => item["Distrito/Ilha"] === d.properties.name)
          .map(item => item["Tema"]);
        label = `${temasNoAno} temas no total`;
      }
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(
        `<strong>${d.properties.name}</strong><br>${label}<br><br><strong>Temas:</strong><br>${temasLista.length > 0 ? temasLista.join("<br>") : "Nenhum"}`
      );
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 15) + "px")
             .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().duration(300).style("opacity", 0);
    });
}

d3.json("Portugal.json").then(geojson => {
  // Desenhar os distritos
  g.selectAll("path")
    .data(geojson.features)
    .enter()
    .append("path")
    .attr("class", "distrito")
    .attr("d", path)
    .each(function(d) {
      console.log("Desenhando distrito:", d.properties.name);
    });

  // Adicionar os nomes dos distritos
  g.selectAll("text")
    .data(geojson.features)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("transform", d => {
      const centroid = path.centroid(d);
      return `translate(${centroid})`;
    })
    .text(d => d.properties.name);

  // Carregar os dados do CSV
  d3.csv("VIMEO_V5.csv").then(data => {
    console.log("Dados carregados:", data);

    // Filtro de ano
    const yearFilter = document.getElementById("yearFilter");
    yearFilter.addEventListener("change", (event) => {
      const selectedYear = event.target.value;
      console.log("Ano selecionado:", selectedYear);

      // Filtrar os dados pelo ano
      const filteredData = selectedYear 
        ? data.filter(d => extractYear(d["Data"]) === selectedYear) // Filtrar pelo ano extraído
        : data; // Caso não tenha ano selecionado, mostra todos

      updateCircles(filteredData, geojson, selectedYear);
    });

    // Inicializar a visualização com todos os dados
    updateCircles(data, geojson); // Não passa "2021"
  });
});

// Função de zoom
const zoom = d3.zoom()
  .scaleExtent([1, 8]) // limites de zoom
  .on("zoom", (event) => {
    g.attr("transform", event.transform);
  });

svg.call(zoom);
