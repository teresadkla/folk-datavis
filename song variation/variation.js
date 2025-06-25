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

d3.csv("/sets.csv").then(data => {
 function abcToMidi(note) {
    const notes = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    let octave = 4; // padrão
    let n = note.match(/([A-Ga-g])([#b]?)(\d?)/);
    if (!n) return null;
    let pitch = notes[n[1].toUpperCase()];
    if (n[2] === "#") pitch += 1;
    if (n[2] === "b") pitch -= 1;
    if (n[3]) octave = +n[3];
    return 12 * (octave + 1) + pitch;
  }

  data.forEach(d => {
    d.Pitch_MIDI = d.Pitch_MIDI ? +d.Pitch_MIDI : abcToMidi(d.abc);
    d.Index = +d.Index || 0; // Assume que já tem uma ordem ou tempo, senão usa o índice do array
  });

  const allNames = [...new Set(data.map(d => d.name))];

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
    const filtered = data.filter(d => d.name === selectedName);

    // Identificar diferentes variações por setting_id
    const variations = [...new Set(filtered.map(d => d.setting_id))];
    color.domain(variations);

    const byVariation = d3.groups(filtered, d => d.setting_id);

    byVariation.forEach(([variation, notes]) => {
      console.log(`Variação: ${variation}`, notes.map(n => n.Pitch_MIDI));
    });

    let maxLen = 0;
    byVariation.forEach(([_, notes]) => {
      notes.forEach((d, i) => d.NoteIndex = i);
      if (notes.length > maxLen) maxLen = notes.length;
    });

    xScale.domain([0, maxLen]);
    const pitchExtent = d3.extent(filtered, d => d.Pitch_MIDI);
    yScale.domain([pitchExtent[0] - 2, pitchExtent[1] + 2]);

    xAxis.transition().call(d3.axisBottom(xScale));
    yAxis.transition().call(d3.axisLeft(yScale));

    // Usa o setting_id na key e na cor
    const allDots = g.selectAll("circle").data(filtered, d => d.name + d.NoteIndex + d.setting_id);

    allDots.exit().remove();

    allDots.enter()
      .append("circle")
      .attr("cx", d => xScale(d.NoteIndex))
      .attr("cy", d => yScale(d.Pitch_MIDI))
      .attr("r", 4)
      .attr("fill", d => color(d.setting_id))
      .append("title").text(d => `Pitch: ${d.Pitch_MIDI}`);

    allDots
      .transition()
      .attr("cx", d => xScale(d.NoteIndex))
      .attr("cy", d => yScale(d.Pitch_MIDI))
      .attr("fill", d => color(d.setting_id));

    console.log(filtered.map(d => d.setting_id));

    // Mostra apenas os setting_id únicos para o nome selecionado
    const uniqueSettingIds = [...new Set(filtered.map(d => d.setting_id))];
    console.log("setting_id únicos para", selectedName, uniqueSettingIds);

  }
});
