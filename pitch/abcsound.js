let abcData = [];
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
        console.log("ABC lido do CSV:", row.abc); // Debug
        abcData.push(row.abc);
      }
    });
    if (abcData.length > 0) {
      renderABC(currentIndex);
    }
  });

function renderABC(index) {
  const abc = abcData[index];
  if (!abc) return;

  // Desenhar partitura
  visualObj = ABCJS.renderAbc("notation", abc)[0];

  // Criar novo controlo de áudio
  if (synthControl) synthControl.pause();
  synthControl = new ABCJS.synth.SynthController();
  synthControl.load("#audio-controls", null, { displayLoop: false });

  const synth = new ABCJS.synth.CreateSynth();
  synth.init({ visualObj }).then(() => {
    synthControl.setTune(visualObj, false).then(() => {
      console.log("Pronto para tocar.");
    });
  });
}

document.getElementById("playBtn").onclick = () => {
  if (synthControl) synthControl.play();
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
