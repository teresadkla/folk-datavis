// Seleciona o elemento SVG e define as margens e dimensões do gráfico
const svg = d3.select("svg")
    .attr("width", 1200)  // Aumenta a largura do SVG
    .attr("height", 800); // Aumenta a altura do SVG

const margin = { 
    top: 50,     // Aumenta margem superior
    right: 100,  // Aumenta margem direita para legenda
    bottom: 50,  // Aumenta margem inferior
    left: 70     // Aumenta margem esquerda para labels do eixo
};

const width = +svg.attr("width") - margin.left - margin.right;
const height = +svg.attr("height") - margin.top - margin.bottom;

// Cria um grupo SVG com margem de segurança
const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

// Define as escalas para os eixos X e Y
const xScale = d3.scaleLinear().range([0, width]);     // Escala linear para índice das notas
const yScale = d3.scaleLinear().range([height, 0]);    // Escala linear para valores MIDI
const color = d3.scaleOrdinal(d3.schemeCategory10);    // Escala de cores para as variações

// Adiciona os eixos ao gráfico
const xAxis = g.append("g").attr("transform", `translate(0,${height})`);
const yAxis = g.append("g");

// Carrega dados de duas fontes diferentes
Promise.all([
  d3.csv("/sets.csv"),              // CSV com nomes das músicas
  d3.json("pitch_compressed.json")   // JSON com valores MIDI de cada variação
]).then(([csvData, pitchData]) => {

  // Extrai nomes únicos das músicas
  const allNames = [...new Set(csvData.map(d => d.name))];

  // Popula o dropdown com os nomes das músicas
  const dropdown = d3.select("#musicSelect");
  dropdown.selectAll("option")
    .data(allNames)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d);

  // Adiciona evento de mudança ao dropdown
  dropdown.on("change", (event) => updateChart(event.target.value));

  // Inicializa o gráfico com a primeira música
  updateChart(allNames[0]);

  function updateChart(selectedName) {
    // Filtra e prepara as variações da música selecionada
    const variations = pitchData
      .map((d, i) => ({ ...d, variation_id: i })) // Adiciona ID único para cada variação
      .filter(d => d.name === selectedName);

    // Atualiza o domínio das cores com os IDs das variações
    color.domain(variations.map(d => d.variation_id));

    // Array para armazenar todas as notas de todas as variações
    const allNotes = [];

    // Transforma os dados em um formato adequado para visualização
    variations.forEach(variation => {
      variation.midiValues.forEach((pitch, index) => {
        allNotes.push({
          name: variation.name,
          variation_id: variation.variation_id,
          Pitch_MIDI: pitch,
          NoteIndex: index
        });
      });
    });

    // Calcula os limites dos eixos
    const maxLen = d3.max(allNotes, d => d.NoteIndex);
    const pitchExtent = d3.extent(allNotes, d => d.Pitch_MIDI);

    // Atualiza os domínios das escalas
    xScale.domain([0, maxLen]);
    yScale.domain([pitchExtent[0] - 2, pitchExtent[1] + 2]);

    // Atualiza os eixos com transição
    xAxis.transition().call(d3.axisBottom(xScale));
    yAxis.transition().call(d3.axisLeft(yScale));

    // Join de dados para os círculos (notas)
    const allDots = g.selectAll("circle")
      .data(allNotes, d => d.name + d.NoteIndex + d.variation_id);

    // Remove círculos que não são mais necessários
    allDots.exit().remove();

    // Adiciona novos círculos com interatividade
    allDots.enter()
      .append("circle")
      .attr("cx", d => xScale(d.NoteIndex))
      .attr("cy", d => yScale(d.Pitch_MIDI))
      .attr("r", 6)
      .attr("fill", d => color(d.variation_id))
      .attr("opacity", 0.5)
      .attr("class", d => `variation-${d.variation_id}`)
      .on("click", handleClick)  // Muda para click
      .append("title")
      .text(d => `Pitch: ${d.Pitch_MIDI}`);

    // Atualiza círculos existentes com interatividade
    allDots
      .attr("class", d => `variation-${d.variation_id}`)
      .on("click", handleClick);  // Muda para click

    // Variável para controlar o estado atual
    let currentlySelected = null;

    // Função para handle do click
    function handleClick(event, d) {
      const selectedVariation = d.variation_id;
      
      // Se clicar na mesma variação que já está selecionada, reseta tudo
      if (currentlySelected === selectedVariation) {
        resetView();
        currentlySelected = null;
        return;
      }

      // Atualiza a variação selecionada
      currentlySelected = selectedVariation;
      
      // Reduz opacidade de todas as bolinhas
      g.selectAll("circle")
        .transition()
        .duration(200)
        .attr("opacity", 0.0)
        .attr("r", 4);
      
      // Aumenta opacidade apenas das bolinhas da mesma variação
      g.selectAll(`.variation-${selectedVariation}`)
        .transition()
        .duration(200)
        .attr("opacity", 0.5)
        .attr("r", 7);
    }

    // Função para resetar a visualização
    function resetView() {
      g.selectAll("circle")
        .transition()
        .duration(200)
        .attr("opacity", 0.5)
        .attr("r", 6);
    }

    // Adiciona click no fundo do SVG para resetar
    svg.on("click", function(event) {
      if (event.target.tagName === 'svg') {
        resetView();
        currentlySelected = null;
      }
    });

    console.log("Variações encontradas para", selectedName, variations.length);
  }
});
