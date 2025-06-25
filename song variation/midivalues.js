// Adiciona as animações de notas ao tocar a música com ABCJS

let abcData = [];
let nameData = [];
let currentIndex = 0;
let synthControl = null;
let visualObj = null;
let noteElements = [];

// Carregar CSV
fetch('/sets.csv')
  .then(response => response.text())
  .then(csvText => {
    const results = Papa.parse(csvText, { header: true });
    results.data.forEach(row => {
      if (row.abc) {
        let meter = row.meter || "4/4";
        let mode = row.mode || "C";

        let abcWithHeaders = `X:1\nT:${row.name || "Sem nome"}\nM:${meter}\nK:${mode}\n%%MIDI program 49\n${row.abc}`;
        abcData.push(abcWithHeaders);
        nameData.push(row.name || "Sem nome");
      }
    });
    if (abcData.length > 0) {
      renderABC(currentIndex);
    }
  });

function renderABC(index) {
  let abc = abcData[index];
  const name = nameData[index];
  if (!abc) return;

  document.getElementById("musicName").textContent = name;

  visualObj = ABCJS.renderAbc("notation", abc)[0];

  const midiValues = extractPitchValues(visualObj);
  drawRadialDotPlot(midiValues);

  if (synthControl) synthControl.pause();
  synthControl = new ABCJS.synth.SynthController();
  synthControl.load("#audio-controls", null, { displayLoop: false });

  const synth = new ABCJS.synth.CreateSynth();
  synth.init({ visualObj }).then(() => {
    synthControl.setTune(visualObj, false).then(() => {
      synth.prime().then(() => {
        attachNoteAnimation(visualObj);
        drawWaveform(synth.audioBuffer);
      });
    });
  });
}

function extractPitchValues(visualObj) {
  const midiValues = [];
  if (!visualObj || !visualObj.lines) return midiValues;

  visualObj.lines.forEach(line => {
    if (!line.staff) return;
    line.staff.forEach(staff => {
      if (!staff.voices) return;
      staff.voices.forEach(voice => {
        voice.forEach(element => {
          if (element.el_type === "note" && element.pitches) {
            element.pitches.forEach(pitch => {
              const midiValue = calculateMIDIValue(pitch);
              midiValues.push(midiValue);
            });
          }
        });
      });
    });
  });

  return midiValues;
}

function calculateMIDIValue(pitch) {
  const C4 = 60;
  return C4 + pitch.pitch;
}

function drawRadialDotPlot(midiValues) {
  const svg = d3.select("#radialPlot");
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
    .attr("r", d => radiusScale(d))
    .attr("fill", "none")
    .attr("stroke", "#ccc")
    .attr("stroke-dasharray", "2,2");

  g.selectAll("text.pitch-label")
    .data(pitchLevels)
    .enter()
    .append("text")
    .attr("y", d => -radiusScale(d))
    .attr("dy", "-0.35em")
    .attr("text-anchor", "middle")
    .text(d => `MIDI ${60 + d}`)
    .attr("font-size", "10px")
    .attr("fill", "#666");

  noteElements = g.selectAll("circle.note")
    .data(midiValues)
    .enter()
    .append("circle")
    .attr("cx", (d, i) => {
      const angle = i * angleStep;
      const r = radiusScale(d - 60);
      return Math.cos(angle) * r;
    })
    .attr("cy", (d, i) => {
      const angle = i * angleStep;
      const r = radiusScale(d - 60);
      return Math.sin(angle) * r;
    })
    .attr("r", 4)
    .attr("fill", d => colorScale(d))
    .attr("opacity", 0.8);
}

function attachNoteAnimation(visualObj) {
    synthControl.setTune(visualObj, false, {
      noteListener: (note) => {
        const index = note.noteIndex;
        if (typeof index !== "number") return;
  
        noteElements.attr("r", (d, i) => i === index ? 10 : 4)
                    .attr("opacity", (d, i) => i === index ? 1 : 0.6);
      }
    });
  }
  

//----------------Interação com os botões-------------------

document.getElementById("playBtn").onclick = () => {
  const abc = abcData[currentIndex];
  const meterMatch = abc.match(/M:([^\n]+)/);
  const modeMatch = abc.match(/K:([^\n]+)/);
  const meter = meterMatch ? meterMatch[1].trim() : "Desconhecido";
  const mode = modeMatch ? modeMatch[1].trim() : "Desconhecido";
  console.log(`Meter: ${meter} | Mode: ${mode}`);

  if (synthControl && synthControl.synth && synthControl.synth.audioBuffer) {
    drawWaveform(synthControl.synth.audioBuffer);
    synthControl.play();
  } else if (synthControl) {
    synthControl.play();
  }
};

document.getElementById("pauseBtn").onclick = () => {
  if (synthControl) synthControl.pause();
};

document.getElementById("prevBtn").onclick = () => {
  currentIndex = (currentIndex - 1 + abcData.length) % abcData.length;
  renderABC(currentIndex);
};

document.getElementById("nextBtn").onclick = () => {
  currentIndex = (currentIndex + 1) % abcData.length;
  renderABC(currentIndex);
};

function drawWaveform(audioBuffer) {
  console.log("Waveform gerada para o buffer de áudio", audioBuffer);
}
