import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as abcjs from "abcjs";
import Papa from "papaparse";

const ChordDiagramABC = () => {
  const svgRef = useRef();
  const [musicData, setMusicData] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    // Load CSV data
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

    // Function to extract just the musical notes from ABC notation
    const extractNotes = (abcText) => {
      // Remove ornaments (~), triplets (3..), grace notes, and other symbols
      let cleaned = abcText
        .replace(/~+/g, '')           // Remove ornaments
        .replace(/\(\d+\.[^)]*\)/g, '') // Remove triplets like (3.g.f.e
        .replace(/[|:]/g, '')         // Remove bar lines and repeat marks
        // .replace(/\d+/g, '')          // Remove numbers (durations)
        .replace(/[.,]/g, '')         // Remove dots and commas
        .replace(/[\s\n]/g, '');      // Remove whitespace and newlines
      
      // Extract only valid note letters (A-G, a-g)
      return cleaned.match(/[A-Ga-g]/g) || [];
    };

    // Compute pairwise similarity with detailed info for 6 songs
    const similarity = Array.from({ length: 6 }, (_, i) =>
      Array.from({ length: 6 }, (_, j) => {
        if (i === j) return { 
          value: 1, 
          shared: [], 
          notesA: [], 
          notesB: [], 
          sharedNotes: [],
          attributeMatches: { mode: true, type: true, meter: true }
        };
        
        const notesA = extractNotes(musicData[i].abc);
        const notesB = extractNotes(musicData[j].abc);
        
        // Find shared notes
        const sharedNotes = notesA.filter(note => notesB.includes(note));
        const uniqueSharedNotes = [...new Set(sharedNotes)];
        
        // Calculate note similarity based on shared notes vs total unique notes
        const allUniqueNotes = [...new Set([...notesA, ...notesB])];
        const noteSimilarity = uniqueSharedNotes.length / allUniqueNotes.length;
        
        // Calculate attribute similarity
        const tuneA = musicData[i];
        const tuneB = musicData[j];
        
        const attributeMatches = {
          mode: tuneA.mode === tuneB.mode,
          type: tuneA.type === tuneB.type,
          meter: tuneA.meter === tuneB.meter
        };
        
        // Count matching attributes (out of 3)
        const matchingAttributes = Object.values(attributeMatches).filter(match => match).length;
        const attributeSimilarity = matchingAttributes / 3;
        
        // Combined similarity: 70% notes, 30% attributes
        const combinedSimilarity = (noteSimilarity * 0.7) + (attributeSimilarity * 0.3);
        
        return {
          value: combinedSimilarity,
          shared: uniqueSharedNotes,
          notesA: notesA,
          notesB: notesB,
          sharedNotes: sharedNotes,
          totalNotesA: notesA.length,
          totalNotesB: notesB.length,
          sharedCount: sharedNotes.length,
          uniqueNotesA: [...new Set(notesA)].length,
          uniqueNotesB: [...new Set(notesB)].length,
          noteSimilarity: noteSimilarity,
          attributeSimilarity: attributeSimilarity,
          attributeMatches: attributeMatches
        };
      })
    );

    // Extract just values for the chord diagram
    const matrix = similarity.map(row => row.map(cell => cell.value));
    
    // Set diagonal to 0 to remove self-connections (100% similarity)
    for (let i = 0; i < matrix.length; i++) {
      matrix[i][i] = 0;
    }
    
    const width = 500; // Reduced size
    const height = 500; // Reduced size
    const innerRadius = width / 2 - 50; // Adjusted for smaller size
    const outerRadius = innerRadius + 15; // Slightly thinner arcs

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const chord = d3.chord().padAngle(0.05).sortSubgroups(d3.descending); // Increased padding for clarity

    const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
    const ribbon = d3.ribbon().radius(innerRadius);

    const chords = chord(matrix);

    // Filter out ribbons that connect a node to itself (should be none now, but just in case)
    const filteredChords = chords.filter(d => d.source.index !== d.target.index);

    // Create tooltip
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
    
    // Center the diagram in the larger SVG
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
      .on("click", (event, d) => setSelected(musicData[d.index]));

    group
      .append("text")
      .each(d => {
        d.angle = (d.startAngle + d.endAngle) / 2;
      })
      .attr("dy", ".35em")
      .attr("transform", d => `rotate(${(d.angle * 180) / Math.PI - 90}) translate(${outerRadius + 8})${d.angle > Math.PI ? " rotate(180)" : ""}`)
      .attr("text-anchor", d => (d.angle > Math.PI ? "end" : "start"))
      .attr("font-size", "11px") // Smaller font for better fit
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
          ${simData.shared.join(', ')}<br/>
          <small><em>Similaridade: 70% notas + 30% atributos</em></small>
        `;
        
        tooltip.html(tooltipContent)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px")
          .transition()
          .duration(200)
          .style("opacity", 1);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", () => {
        tooltip.transition()
          .duration(200)
          .style("opacity", 0);
      });

    // Cleanup function
    return () => {
      d3.select("body").selectAll(".chord-tooltip").remove();
    };
  }, [musicData]);

  useEffect(() => {
    if (selected) {
      abcjs.renderAbc("abc-output", selected.abc);
      abcjs.renderMidi("midi-output", selected.abc, { responsive: "resize" });
    }
  }, [selected]);

  return (
    <div>
      <svg ref={svgRef} width={800} height={800} />
      {selected && (
        <div>
          <h3>{selected.name}</h3>
          <div id="abc-output"></div>
          <div id="midi-output"></div>
        </div>
      )}
    </div>
  );
};

export default ChordDiagramABC;
