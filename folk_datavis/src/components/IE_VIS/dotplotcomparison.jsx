import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "../../css/comparison.css";

const MidiCoparisonDotPlot = () => {
  const svgRef = useRef();
  const [allNames, setAllNames] = useState([]);
  const [pitchData, setPitchData] = useState([]);
  const [selectedName, setSelectedName] = useState(null);

  const margin = { top: 50, right: 100, bottom: 50, left: 70 };
  const width = 1200 - margin.left - margin.right;
  const height = 800 - margin.top - margin.bottom;

  useEffect(() => {
    Promise.all([
      d3.csv("/sets.csv"),
      d3.json("/pitch_compressed.json"),
    ]).then(([csvData, jsonData]) => {
      const names = [...new Set(csvData.map(d => d.name))];
      setAllNames(names);
      setPitchData(jsonData);
      setSelectedName(names[0]);
    });
  }, []);

  useEffect(() => {
    if (!selectedName || pitchData.length === 0) return;

    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    svg.selectAll("*").remove(); // clear previous chart

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const xScale = d3.scaleLinear().range([0, width]);
    const yScale = d3.scaleLinear().range([height, 0]);
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const xAxis = g.append("g").attr("transform", `translate(0,${height})`);
    const yAxis = g.append("g");

    const variations = pitchData
      .map((d, i) => ({ ...d, variation_id: i }))
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

    xAxis.call(d3.axisBottom(xScale));
    yAxis.call(d3.axisLeft(yScale));

    let currentlySelected = null;

    const circles = g.selectAll("circle")
      .data(allNotes, d => d.name + d.NoteIndex + d.variation_id)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.NoteIndex))
      .attr("cy", d => yScale(d.Pitch_MIDI))
      .attr("r", 6)
      .attr("fill", d => color(d.variation_id))
      .attr("opacity", 0.5)
      .attr("class", d => `variation-${d.variation_id}`)
      .on("click", handleClick);

    circles.append("title").text(d => `Pitch: ${d.Pitch_MIDI}`);

    function handleClick(event, d) {
      const selectedVariation = d.variation_id;
      if (currentlySelected === selectedVariation) {
        resetView();
        currentlySelected = null;
        return;
      }

      currentlySelected = selectedVariation;

      g.selectAll("circle")
        .transition().duration(200)
        .attr("opacity", 0.0)
        .attr("r", 4);

      g.selectAll(`.variation-${selectedVariation}`)
        .transition().duration(200)
        .attr("opacity", 0.5)
        .attr("r", 7);
    }

    function resetView() {
      g.selectAll("circle")
        .transition().duration(200)
        .attr("opacity", 0.5)
        .attr("r", 6);
    }

    svg.on("click", function (event) {
      if (event.target.tagName === "svg") {
        resetView();
        currentlySelected = null;
      }
    });

    console.log("Variações encontradas para", selectedName, variations.length);
  }, [selectedName, pitchData]);

  return (
    <div className="midi-chart-container">
      <select
        className="music-select"
        onChange={(e) => setSelectedName(e.target.value)}
        value={selectedName || ""}
      >
        {allNames.map((name, idx) => (
          <option key={idx} value={name}>{name}</option>
        ))}
      </select>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default MidiCoparisonDotPlot;
