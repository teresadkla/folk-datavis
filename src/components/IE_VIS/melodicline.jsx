
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
const MidiComparison = ({ idA, idB, nameA, nameB, onClose }) => {

  const svgRef = useRef();
  const [pitchData, setPitchData] = useState([]);

  const margin = { top: 50, right: 100, bottom: 50, left: 70 };
  const width = 1500 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;

  useEffect(() => {
    Promise.all([
      d3.csv("sets.csv"),
      d3.json("pitch_compressed.json"),
    ]).then(([_, jsonData]) => {
      setPitchData(jsonData);
    });
  }, []);

  useEffect(() => {
    if (!pitchData.length || !nameA || !nameB) return;

    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);
    svg.selectAll("*").remove();
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

const selected = pitchData.filter(d => d.tune_id === idA || d.tune_id === idB);
    const allNotes = [];

    selected.forEach((variation, i) => {
      variation.midiValues.forEach((pitch, idx) => {
        allNotes.push({
          group: variation.name,
          variation_id: `${variation.name}_${i}`,
          Pitch_MIDI: pitch,
          NoteIndex: idx
        });
      });
    });

    const xScale = d3.scaleLinear()
      .domain([0, d3.max(allNotes, d => d.NoteIndex)])
      .range([0, width]);

    const yExtent = d3.extent(allNotes, d => d.Pitch_MIDI);
    const yScale = d3.scaleLinear()
      .domain([yExtent[0] - 2, yExtent[1] + 2])
      .range([height, 0]);

    g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale));
    g.append("g").call(d3.axisLeft(yScale));

    const color = d3.scaleOrdinal()
      .domain([nameA, nameB])
      .range(["#1f77b4", "#d62728"]);

    const lineGen = d3.line()
      .x(d => xScale(d.NoteIndex))
      .y(d => yScale(d.Pitch_MIDI));

    const grouped = d3.group(allNotes, d => d.variation_id);

    for (const [key, points] of grouped) {
      g.append("path")
        .datum(points)
        .attr("fill", "none")
        .attr("stroke", color(points[0].group))
        .attr("stroke-width", 2)
        .attr("d", lineGen)
        .attr("opacity", 0.7);
    }

  }, [pitchData, nameA, nameB]);

  return (
    <div className="midi-chart-container">
      <div style={{ marginBottom: "10px" }}>
        <strong>{nameA}</strong> vs <strong>{nameB}</strong>
        <button style={{ float: "right" }} onClick={onClose}>Fechar</button>
      </div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default MidiComparison;
