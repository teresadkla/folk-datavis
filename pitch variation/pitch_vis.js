let abcData = [];
let nameData = [];
let currentIndex = 0;
let synthControl = null;
let visualObj = null;

// Carregar CSV
fetch('/sets.csv')
  .then(response => response.text())
  .then(csvText => {
    const results = Papa.parse(csvText, { header: true });
    results.data.forEach(row => {
      if (row.abc) {
        let meter = row.meter || "4/4"; // valor padrão
        let mode = row.mode || "C";       // valor padrão

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
  console.log(`Valores MIDI para "${name}":`);
  console.log(midiValues);
  
  drawRadialDotPlot(midiValues);

  if (synthControl) synthControl.pause();
  synthControl = new ABCJS.synth.SynthController();
  synthControl.load("#audio-controls", null, { displayLoop: false });

  const synth = new ABCJS.synth.CreateSynth();
  synth.init({ visualObj }).then(() => {
    synthControl.setTune(visualObj, false).then(() => {
      console.log("Pronto para tocar.");
      synth.prime().then(() => {
        const audioBuffer = synth.audioBuffer;
        if (audioBuffer) {
          drawWaveform(audioBuffer);
        }
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
  const radiusScale = d3.scaleLinear().domain([-24, 24]).range([40, 250]);
  const colorScale = d3.scaleSequential(d3.interpolatePlasma).domain([0, midiValues.length]);

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

  g.selectAll("circle.note")
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
    .attr("fill", (d, i) => colorScale(i))
    .attr("opacity", 0.8);

  const legendWidth = 220;
  const legendHeight = 10;
  const legendX = width / 2 - legendWidth / 2;
  const legendY = height - 40;

  const defs = svg.append("defs");
  const gradient = defs.append("linearGradient")
    .attr("id", "color-gradient")
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "100%").attr("y2", "0%");

  for (let i = 0; i <= 100; i++) {
    gradient.append("stop")
      .attr("offset", `${i}%`)
      .attr("stop-color", colorScale(i / 100 * midiValues.length));
  }

  svg.append("rect")
    .attr("x", legendX)
    .attr("y", legendY)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#color-gradient)");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", legendY - 10)
    .attr("text-anchor", "middle")
    .text("Início → Fim")
    .attr("font-size", "10px")
    .attr("fill", "#444");

  const tickLabels = ["Início", "Meio", "Fim"];
  const tickPositions = [0, legendWidth / 2, legendWidth];

  svg.selectAll("text.legend-ticks")
    .data(tickLabels)
    .enter()
    .append("text")
    .attr("x", (d, i) => legendX + tickPositions[i])
    .attr("y", legendY + 20)
    .attr("text-anchor", (d, i) => i === 0 ? "start" : i === 2 ? "end" : "middle")
    .text(d => d)
    .attr("font-size", "9px")
    .attr("fill", "#555");
}

//----------------Interação com os botões-------------------

document.getElementById("playBtn").onclick = () => {
  // Extrai meter e mode da música atual
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
