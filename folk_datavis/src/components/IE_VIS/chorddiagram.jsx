import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as abcjs from "abcjs";
import Papa from "papaparse";
import ABCVisualizer from "./picthabc";
import MidiComparison from "./melodicline"; 
import "../../css/chord.css";

const ChordDiagramABC = () => {
  const svgRef = useRef();
  const [musicData, setMusicData] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedPair, setSelectedPair] = useState(null);


  useEffect(() => {
    Papa.parse("/sets.csv", {
      download: true,
      header: true,
      complete: (result) => {
        const allTunes = result.data.filter(d => d.name && d.abc);
        const randomTunes = d3.shuffle(allTunes).slice(0, 6);
        setMusicData(randomTunes);
      }
    });
  }, []);

  useEffect(() => {
    if (musicData.length < 6) return;

    const extractNotes = (abcText) => {
      let cleaned = abcText
        .replace(/~+/g, '')           // Remove ornaments
        .replace(/\(\d+\.[^)]*\)/g, '') // Remove triplets like (3.g.f.e
        .replace(/[|:]/g, '')         // Remove bar lines and repeat marks
        .replace(/\d+/g, '')          // Remove numbers (durations)
        .replace(/[.,]/g, '')         // Remove dots and commas
        .replace(/[\s\n]/g, '');      // Remove whitespace and newlines
      return cleaned.match(/[A-Ga-g]/g) || [];
    };

    const similarity = Array.from({ length: 6 }, (_, i) =>
      Array.from({ length: 6 }, (_, j) => {
        if (i === j) return { value: 1, shared: [], notesA: [], notesB: [], sharedNotes: [], attributeMatches: { mode: true, type: true, meter: true } };
        const notesA = extractNotes(musicData[i].abc);
        const notesB = extractNotes(musicData[j].abc);
        const sharedNotes = notesA.filter(note => notesB.includes(note));
        const uniqueSharedNotes = [...new Set(sharedNotes)];
        const allUniqueNotes = [...new Set([...notesA, ...notesB])];
        const noteSimilarity = uniqueSharedNotes.length / allUniqueNotes.length;

        const tuneA = musicData[i];
        const tuneB = musicData[j];
        const attributeMatches = {
          mode: tuneA.mode === tuneB.mode,
          type: tuneA.type === tuneB.type,
          meter: tuneA.meter === tuneB.meter
        };
        const matchingAttributes = Object.values(attributeMatches).filter(match => match).length;
        const attributeSimilarity = matchingAttributes / 3;

        const combinedSimilarity = (noteSimilarity * 0.7) + (attributeSimilarity * 0.3);
        return {
          value: combinedSimilarity,
          shared: uniqueSharedNotes,
          notesA, notesB, sharedNotes,
          totalNotesA: notesA.length,
          totalNotesB: notesB.length,
          sharedCount: sharedNotes.length,
          uniqueNotesA: [...new Set(notesA)].length,
          uniqueNotesB: [...new Set(notesB)].length,
          noteSimilarity,
          attributeSimilarity,
          attributeMatches
        };
      })
    );

    const matrix = similarity.map(row => row.map(cell => cell.value));
    for (let i = 0; i < matrix.length; i++) matrix[i][i] = 0;

    const width = 500;
    const height = 500;
    const innerRadius = width / 2 - 50;
    const outerRadius = innerRadius + 15;

    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const chord = d3.chord().padAngle(0.05).sortSubgroups(d3.descending);
    const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
    const ribbon = d3.ribbon().radius(innerRadius);
    const chords = chord(matrix);
    const filteredChords = chords.filter(d => d.source.index !== d.target.index);

    const tooltip = d3.select("body")
      .selectAll(".chord-tooltip")
      .data([0])
      .join("div")
      .attr("class", "chord-tooltip")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "10px")
      .style("border-radius", "5px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("font-size", "12px")
      .style("max-width", "350px")
      .style("z-index", "1000");

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const svgWidth = 800;
    const svgHeight = 800;
    const translateX = (svgWidth - width) / 2 + width / 2;
    const translateY = (svgHeight - height) / 2 + height / 2;

    svg
      .attr("viewBox", [0, 0, svgWidth, svgHeight])
      .append("g")
      .attr("transform", `translate(${translateX},${translateY})`);

    const g = svg.select("g");

    const group = g
      .append("g")
      .selectAll("g")
      .data(chords.groups)
      .join("g");

    group
      .append("path")
      .attr("fill", d => color(d.index))
      .attr("stroke", "#000")
      .attr("stroke-width", 1)
      .attr("d", arc)
      .on("click", (event, d) => {
        setSelected(musicData[d.index]);
      });

    group
      .append("text")
      .each(d => {
        d.angle = (d.startAngle + d.endAngle) / 2;
      })
      .attr("dy", ".35em")
      .attr("transform", d => `rotate(${(d.angle * 180) / Math.PI - 90}) translate(${outerRadius + 8})${d.angle > Math.PI ? " rotate(180)" : ""}`)
      .attr("text-anchor", d => (d.angle > Math.PI ? "end" : "start"))
      .attr("font-size", "11px")
      .text(d => musicData[d.index].name);

    g.append("g")
      .attr("fill-opacity", 0.67)
      .selectAll("path")
      .data(filteredChords)
      .join("path")
      .attr("d", ribbon)
      .attr("fill", d => color(d.target.index))
      .attr("stroke", d => d3.rgb(color(d.target.index)).darker())
      .on("mouseover", (event, d) => {
        const sourceIdx = d.source.index;
        const targetIdx = d.target.index;
        const simData = similarity[sourceIdx][targetIdx];
        const sourceName = musicData[sourceIdx].name;
        const targetName = musicData[targetIdx].name;
        const tuneA = musicData[sourceIdx];
        const tuneB = musicData[targetIdx];

        const attributeInfo = `
          <strong>Mode:</strong> ${tuneA.mode || 'N/A'} ${simData.attributeMatches.mode ? '✓' : '✗'} ${tuneB.mode || 'N/A'}<br/>
          <strong>Type:</strong> ${tuneA.type || 'N/A'} ${simData.attributeMatches.type ? '✓' : '✗'} ${tuneB.type || 'N/A'}<br/>
          <strong>Meter:</strong> ${tuneA.meter || 'N/A'} ${simData.attributeMatches.meter ? '✓' : '✗'} ${tuneB.meter || 'N/A'}
        `;

        const tooltipContent = `
  <strong>${sourceName} ↔ ${targetName}</strong><br/>
  <strong>Similaridade Total:</strong> ${(simData.value * 100).toFixed(1)}%<br/>
  <strong>Similaridade de Notas:</strong> ${(simData.noteSimilarity * 100).toFixed(1)}%<br/>
  <strong>Similaridade de Atributos:</strong> ${(simData.attributeSimilarity * 100).toFixed(1)}%<br/>
  <hr style="margin: 5px 0; border: 0.5px solid #ccc;">
  ${attributeInfo}<br/>
  <hr style="margin: 5px 0; border: 0.5px solid #ccc;">
  <strong>Notas totais:</strong> ${simData.totalNotesA} ↔ ${simData.totalNotesB}<br/>
  <strong>Notas únicas:</strong> ${simData.uniqueNotesA} ↔ ${simData.uniqueNotesB}<br/>
  <strong>Notas únicas partilhadas:</strong><br/>
  ${simData.shared.join(', ') || 'Nenhuma'}<br/>
   <small><em>Similaridade: 70% notas + 30% atributos</em></small>
`;

        tooltip.html(tooltipContent)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px")
          .transition().duration(200).style("opacity", 1);
      })
      .on("mousemove", (event) => {
        tooltip.style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(200).style("opacity", 0);
      });

    return () => {
      d3.select("body").selectAll(".chord-tooltip").remove();
    };
  }, [musicData]);

  return (
    <div>
      <svg ref={svgRef} width={800} height={800} />
      {selected && (
        <div className="popup-overlay">
          <div className="popup-content">
            <ABCVisualizer
              abc={selected.abc}
              name={selected.name}
              onClose={() => setSelected(null)}
            />
          </div>
        </div>
      )}
      {selectedPair && (
        <div className="popup-overlay">
          <div className="popup-content">
            <MidiComparison
              pitchData={musicData}
              nameA={selectedPair.nameA}
              nameB={selectedPair.nameB}
              onClose={() => setSelectedPair(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChordDiagramABC;
