// ABCVisualizer.jsx
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as ABCJS from "abcjs";
import Papa from "papaparse";
import "../../css/abc.css";

const ABCVisualizer = () => {
  const [abcData, setAbcData] = useState([]);
  const [nameData, setNameData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [synthControl, setSynthControl] = useState(null);
  const [visualObj, setVisualObj] = useState(null);
  const svgRef = useRef();
  const noteElements = useRef(null);

  useEffect(() => {
    fetch("/sets.csv")
      .then((res) => res.text())
      .then((csvText) => {
        const results = Papa.parse(csvText, { header: true });
        const abcArr = [];
        const nameArr = [];
        results.data.forEach((row) => {
          if (row.abc) {
            const meter = row.meter || "4/4";
            const mode = row.mode || "C";
            const abcWithHeaders = `X:1\nT:${row.name || "Sem nome"}\nM:${meter}\nK:${mode}\n%%MIDI program 49\n${row.abc}`;
            abcArr.push(abcWithHeaders);
            nameArr.push(row.name || "Sem nome");
          }
        });
        setAbcData(abcArr);
        setNameData(nameArr);
      });
  }, []);

  useEffect(() => {
    if (abcData.length > 0) renderABC(currentIndex);
  }, [abcData, currentIndex]);

  const renderABC = async (index) => {
    const abc = abcData[index];
    const name = nameData[index];
    if (!abc) return;

    document.getElementById("musicName").textContent = name;

    const visual = ABCJS.renderAbc("notation", abc)[0];
    setVisualObj(visual);

    const midiValues = extractPitchValues(visual);
    drawRadialDotPlot(midiValues);

    if (synthControl) synthControl.pause();

    const newSynthControl = new ABCJS.synth.SynthController();
    newSynthControl.load("#audio-controls", null, { displayLoop: false });
    setSynthControl(newSynthControl);

    const synth = new ABCJS.synth.CreateSynth();
    await synth.init({ visualObj: visual });
    await newSynthControl.setTune(visual, false);
    await synth.prime();

    attachNoteAnimation(visual, newSynthControl);
    drawWaveform(synth.audioBuffer);
  };

  const extractPitchValues = (visual) => {
    const midiValues = [];
    visual?.lines?.forEach((line) => {
      line.staff?.forEach((staff) => {
        staff.voices?.forEach((voice) => {
          voice.forEach((el) => {
            if (el.el_type === "note" && el.pitches) {
              el.pitches.forEach((p) => {
                midiValues.push(60 + p.pitch);
              });
            }
          });
        });
      });
    });
    return midiValues;
  };

  const drawRadialDotPlot = (midiValues) => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const centerX = width / 2;
    const centerY = height / 2;
    const g = svg.append("g").attr("transform", `translate(${centerX},${centerY})`);

    const angleStep = (2 * Math.PI) / midiValues.length;
    const midiMin = d3.min(midiValues);
    const midiMax = d3.max(midiValues);

    const radiusScale = d3.scaleLinear().domain([-24, 24]).range([40, 250]);
    const colorScale = d3.scaleSequential(d3.interpolatePlasma).domain([midiMin, midiMax]);

    const pitchLevels = [-24, -12, 0, 12, 24];
    g.selectAll("circle.axis")
      .data(pitchLevels)
      .enter()
      .append("circle")
      .attr("r", (d) => radiusScale(d))
      .attr("class", "axis-circle");

    g.selectAll("text.pitch-label")
      .data(pitchLevels)
      .enter()
      .append("text")
      .attr("y", (d) => -radiusScale(d))
      .attr("dy", "-0.35em")
      .attr("text-anchor", "middle")
      .attr("class", "pitch-label")
      .text((d) => `MIDI ${60 + d}`);

    noteElements.current = g
      .selectAll("circle.note")
      .data(midiValues)
      .enter()
      .append("circle")
      .attr("class", "note-dot")
      .attr("cx", (d, i) => Math.cos(i * angleStep) * radiusScale(d - 60))
      .attr("cy", (d, i) => Math.sin(i * angleStep) * radiusScale(d - 60))
      .attr("r", 4)
      .attr("fill", (d) => colorScale(d))
      .attr("opacity", 0.8);
  };

  const attachNoteAnimation = (visual, controller) => {
    controller.setTune(visual, false, {
      noteListener: (note) => {
        const index = note.noteIndex;
        if (typeof index !== "number") return;
        noteElements.current
          .attr("r", (d, i) => (i === index ? 10 : 4))
          .attr("opacity", (d, i) => (i === index ? 1 : 0.6));
      },
    });
  };

  const drawWaveform = (audioBuffer) => {
    console.log("Waveform gerada para o buffer de áudio", audioBuffer);
  };

  return (
    <div className="abc-container">
      <h2 id="musicName">Carregando...</h2>
      <div id="notation" className="notation-area"></div>
      <div id="audio-controls" className="audio-controls"></div>
      <svg ref={svgRef} width="600" height="600"></svg>
      <div className="controls">
        <button onClick={() => synthControl?.play()}>Play</button>
        <button onClick={() => synthControl?.pause()}>Pause</button>
        <button onClick={() => setCurrentIndex((prev) => (prev - 1 + abcData.length) % abcData.length)}>Prev</button>
        <button onClick={() => setCurrentIndex((prev) => (prev + 1) % abcData.length)}>Next</button>
      </div>
    </div>
  );
};

export default ABCVisualizer;
