let abcData = [];
let nameData = [];
let currentIndex = 0;
let synthControl = null;
let visualObj = null;

// Carregar CSV
fetch('sets.csv')
  .then(response => response.text())
  .then(csvText => {
    const results = Papa.parse(csvText, { header: true });
    results.data.forEach(row => {
      if (row.abc) {
        abcData.push(row.abc);
        nameData.push(row.name || "Sem nome");
      }
    });
    if (abcData.length > 0) {
      renderABC(currentIndex);
    }
  });

function renderABC(index) {
  let abc = abcData[index]; // Troque 'const' por 'let' para permitir alteração
  const name = nameData[index];
  if (!abc) return;

  // Garante que o instrumento seja sempre o 49 (Strings)
  if (!abc.startsWith("%%MIDI program 49")) {
    abc = "%%MIDI program 49\n" + abc;
  }

  // Mostrar nome da música
  document.getElementById("musicName").textContent = name;

  // Desenhar partitura
  visualObj = ABCJS.renderAbc("notation", abc)[0];

  // Extrair valores de pitch MIDI
  const midiValues = extractPitchValues(visualObj);
  
  // Imprimir no console
  console.log(`Valores MIDI para "${name}":`);
  console.log(midiValues);
  
  // Desenhar o gráfico radial diretamente com os valores MIDI
  drawRadialDotPlot(midiValues);

  // Criar novo controlo de áudio
  if (synthControl) synthControl.pause();
  synthControl = new ABCJS.synth.SynthController();
  synthControl.load("#audio-controls", null, { displayLoop: false });

  const synth = new ABCJS.synth.CreateSynth();
  synth.init({ visualObj }).then(() => {
    synthControl.setTune(visualObj, false).then(() => {
      console.log("Pronto para tocar.");

      // Gerar o áudio (prime) e desenhar a waveform
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
  
  // Percorrer todas as vozes e extrair as notas
  visualObj.lines.forEach(line => {
    if (!line.staff) return;
    
    line.staff.forEach(staff => {
      if (!staff.voices) return;
      
      staff.voices.forEach(voice => {
        voice.forEach(element => {
          if (element.el_type === "note" && element.pitches) {
            // Para notas regulares, adicionar valores MIDI
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
  // Implementação do cálculo MIDI baseado nos valores de pitch do abcjs
  // A notação MIDI: C4 (dó central) = 60
  // No abcjs, o pitch é relativo ao dó central (C4)
  const C4 = 60; // MIDI para C4 (dó central)
  return C4 + pitch.pitch;
}

//-------------------------------desenhar o gráfico radial com d3.js-------------------
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

  // Eixos circulares (pitch)
  const pitchLevels = [-24, -12, 0, 12, 24];
  g.selectAll("circle.axis")
    .data(pitchLevels)
    .enter()
    .append("circle")
    .attr("r", d => radiusScale(d))
    .attr("fill", "none")
    .attr("stroke", "#ccc")
    .attr("stroke-dasharray", "2,2");

  // Labels de pitch
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

  // Notas musicais
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

  // Gradiente de cor (legenda tempo)
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

  // Texto explicativo da legenda
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", legendY - 10)
    .attr("text-anchor", "middle")
    .text("Início → Fim")
    .attr("font-size", "10px")
    .attr("fill", "#444");

  // Ticks de tempo
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

document.getElementById("exportPitchBtn").onclick = () => {
  if (abcData.length === 0) {
    alert("Nenhuma música carregada!");
    return;
  }

  const allPitches = [];

  abcData.forEach((abc, idx) => {
    const tempVisualObj = ABCJS.renderAbc("notation", abc)[0];
    const midiValues = extractPitchValues(tempVisualObj);
    allPitches.push({
      name: nameData[idx] || `Sem_nome_${idx + 1}`,
      midiValues: midiValues
    });
  });

  const json = JSON.stringify(allPitches, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `todas_musicas_pitch.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

function drawWaveform(audioBuffer) {
  console.log("Waveform gerada para o buffer de áudio", audioBuffer);
}