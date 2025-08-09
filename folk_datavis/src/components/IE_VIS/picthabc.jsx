// ABCVisualizer.jsx
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as ABCJS from "abcjs";
import "../../css/abc.css";

const ABCVisualizer = ({ abc, name, onClose }) => {
  const [synthControl, setSynthControl] = useState(null);
  const [visualObj, setVisualObj] = useState(null);
  const svgRef = useRef();
  const noteElements = useRef(null);

  useEffect(() => {
    if (abc) renderABC(abc, name);
  }, [abc, name]);

  const renderABC = async (abc, name) => {
    const abcWithHeader = `X:1\nT:${name}\nM:4/4\nK:C\n%%MIDI program 49\n${abc}`;
    const visual = ABCJS.parseOnly(abcWithHeader)[0];
    setVisualObj(visual);

    const midiValues = extractPitchValues(visual);
    drawRadialDotPlot(midiValues);

    if (synthControl) synthControl.pause();

    const newSynthControl = new ABCJS.synth.SynthController();
    setSynthControl(newSynthControl);

    const synth = new ABCJS.synth.CreateSynth();
    await synth.init({ visualObj: visual });
    await newSynthControl.setTune(visual, false);
    await synth.prime();

    attachNoteAnimation(visual, newSynthControl);
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
    const radiusScale = d3.scaleLinear().domain([-24, 24]).range([40, 250]);
    const colorScale = d3.scaleLinear()
      .domain(d3.extent(midiValues))
      .range(["#82813E", "#5193AE"]);

    const pitchLevels = [-24, -12, 0, 12, 24];
    g.selectAll("circle.axis")
      .data(pitchLevels)
      .enter()
      .append("circle")
      .attr("r", (d) => radiusScale(d))
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-dasharray", "2,2");

    g.selectAll("text.pitch-label")
      .data(pitchLevels)
      .enter()
      .append("text")
      .attr("y", (d) => -radiusScale(d))
      .attr("dy", "-0.35em")
      .attr("text-anchor", "middle")
      .text((d) => `MIDI ${60 + d}`)
      .attr("font-size", "10px")
      .attr("fill", "#666");

    noteElements.current = g
      .selectAll("circle.note")
      .data(midiValues)
      .enter()
      .append("circle")
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

  return (
    <div className="abc-popup">
      <button onClick={onClose}>x</button>
      <h3>{name}</h3>
      <svg ref={svgRef} width="600" height="600"></svg>
      <div className="controls-abc">
        <button onClick={() => synthControl?.play()}>Play</button>
        <button onClick={() => synthControl?.pause()}>Pause</button>
      </div>
    </div>
  );
};

export default ABCVisualizer;
