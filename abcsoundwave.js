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
  const abc = abcData[index];
  const name = nameData[index];
  if (!abc) return;

  // Mostrar nome da música
  document.getElementById("musicName").textContent = name;

  // Desenhar partitura
  visualObj = ABCJS.renderAbc("notation", abc)[0];

  // Extrair valores de pitch MIDI
  const midiValues = extractPitchValues(visualObj);
  
  // Imprimir no console
  console.log(`Valores MIDI para "${name}":`);
  console.log(midiValues);

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

  const lines = abcData.map((abc, idx) => {
    const tempVisualObj = ABCJS.renderAbc("notation", abc)[0];
    const midiValues = extractPitchValues(tempVisualObj);
    return JSON.stringify({
      name: nameData[idx] || `Sem_nome_${idx + 1}`,
      midiValues: midiValues
    });
  });

  const blob = new Blob([lines.join('\n')], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `pitch_compressed.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Assumindo que você tem esta função em seu código original
function drawWaveform(audioBuffer) {
  // Implemente a função de desenho da waveform aqui se necessário
  console.log("Waveform gerada para o buffer de áudio", audioBuffer);
}



