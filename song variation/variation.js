const svg = d3.select("svg");
const margin = { top: 30, right: 30, bottom: 40, left: 50 };
const width = +svg.attr("width") - margin.left - margin.right;
const height = +svg.attr("height") - margin.top - margin.bottom;

const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

const xScale = d3.scaleLinear().range([0, width]);
const yScale = d3.scaleLinear().range([height, 0]);
const color = d3.scaleOrdinal(d3.schemeCategory10);

const xAxis = g.append("g").attr("transform", `translate(0,${height})`);
const yAxis = g.append("g");

Promise.all([
  d3.csv("/sets.csv"),              // Apenas para extrair os "name"
  d3.json("pitch_compressed.json") // Contém os midiValues por nome
]).then(([csvData, pitchData]) => {

  const allNames = [...new Set(csvData.map(d => d.name))];

  const dropdown = d3.select("#musicSelect");
  dropdown.selectAll("option")
    .data(allNames)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d);

  dropdown.on("change", (event) => updateChart(event.target.value));

  updateChart(allNames[0]);

  function updateChart(selectedName) {
    // Filtra apenas os objetos com o nome selecionado
    const variations = pitchData
      .map((d, i) => ({ ...d, variation_id: i })) // adiciona um ID baseado na ordem
      .filter(d => d.name === selectedName);

    color.domain(variations.map(d => d.variation_id));

    const allNotes = [];

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

    const maxLen = d3.max(allNotes, d => d.NoteIndex);
    const pitchExtent = d3.extent(allNotes, d => d.Pitch_MIDI);

    xScale.domain([0, maxLen]);
    yScale.domain([pitchExtent[0] - 2, pitchExtent[1] + 2]);

    xAxis.transition().call(d3.axisBottom(xScale));
    yAxis.transition().call(d3.axisLeft(yScale));

    const allDots = g.selectAll("circle")
      .data(allNotes, d => d.name + d.NoteIndex + d.variation_id);

    allDots.exit().remove();

    allDots.enter()
      .append("circle")
      .attr("cx", d => xScale(d.NoteIndex))
      .attr("cy", d => yScale(d.Pitch_MIDI))
      .attr("r", 4)
      .attr("fill", d => color(d.variation_id))
      .attr("opacity", 0.5)  // Add opacity here
      .append("title").text(d => `Pitch: ${d.Pitch_MIDI}`);

    allDots
      .transition()
      .attr("cx", d => xScale(d.NoteIndex))
      .attr("cy", d => yScale(d.Pitch_MIDI))
      .attr("fill", d => color(d.variation_id))
      .attr("opacity", 0.5);  // Add opacity here

    console.log("Variações encontradas para", selectedName, variations.length);
  }
});
