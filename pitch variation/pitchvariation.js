let abcData = [];
let nameData = [];
let currentIndex = 0;
let synthControl = null;
let visualObj = null;

const uniqueNames = new Set();
const songMap = new Map();

// Carrega o CSV com as músicas e popula os arrays e mapas
fetch('/sets.csv')
  .then(response => response.text())
  .then(csvText => {
    const results = Papa.parse(csvText, { header: true });
    results.data.forEach(row => {
      if (row.abc) {
        const name = row.name || "Sem nome";
        abcData.push(row.abc);
        nameData.push(name);

        // Agrupa variações pelo nome da música
        if (!songMap.has(name)) songMap.set(name, []);
        songMap.get(name).push(row.abc);
        uniqueNames.add(name);
      }
    });

    // Preenche o dropdown com os nomes únicos das músicas
    const select = document.getElementById("musicSelect");
    uniqueNames.forEach(name => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });

    // Atualiza visualização ao trocar seleção
    select.addEventListener("change", () => {
      const selected = select.value;
      renderByName(selected);
    });

    // Renderiza a primeira música ao carregar
    if (abcData.length > 0) {
      renderByName([...uniqueNames][0]);
    }
  });

// Renderiza música ou suas variações agrupadas por nome
function renderByName(name) {
  const variations = songMap.get(name);
  if (variations.length === 1) {
    renderABC(variations[0], name);
  } else {
    // Extrai histogramas de pitch para cada variação
    const histograms = variations.map(abc => {
      const visual = ABCJS.renderAbc("notation", abc)[0];
      return extractPitchValues(visual);
    });

    // Constrói histogramas de contagem de pitch (0-127)
    const pitchHistograms = histograms.map(pitchArray => {
      console.log("histograma", pitchArray);
      const pitchCounts = {};
      pitchArray.forEach(val => {
        pitchCounts[val] = (pitchCounts[val] || 0) + 1;
      });
      console.log({
        name,
        pitchCounts
      });
      const counts = new Array(128).fill(0);
      pitchArray.forEach(val => counts[val]++);
      return counts;
    });



    /* eps: controla o quão "próximos" os histogramas precisam ser para formar um cluster.
       minPTS: controla o tamanho mínimo de um grupo para ser considerado um cluster.*/

    /*Dois histogramas são agrupados no mesmo cluster se a distância entre 
    eles for menor que eps (1) e tiverem pelo menos minPts vizinhos (2)*/

    // Ajuste eps/minPts para tentar obter 3 clusters
    const clusters = dbscan(pitchHistograms, 1, 2);

    // Agrupa histogramas por cluster
    const clusterMap = {};
    pitchHistograms.forEach((hist, i) => {
      const clusterId = clusters[i];
      if (!clusterMap[clusterId]) clusterMap[clusterId] = [];
      clusterMap[clusterId].push(hist);
    });

    // Seleciona os três clusters mais numerosos
    const sortedClusters = Object.entries(clusterMap)
      .filter(([id]) => id !== "-1") // ignora ruído
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 3);

    // Mostra no console as três tendências principais
    sortedClusters.forEach(([clusterId, hists], idx) => {
      console.log(`Tendência ${idx + 1} (Cluster ${clusterId}):`, hists);
    });

    // Visualiza os clusters normalmente
    drawClusteredDots(pitchHistograms, clusters);
    document.getElementById("musicName").textContent = `${name} (${variations.length}x)`;
  }
}

// Renderiza uma música individual, visualização e áudio
function renderABC(abc, name) {
  // Garante que o instrumento MIDI está definido
  if (!abc.startsWith("%%MIDI program 49")) {
    abc = "%%MIDI program 49\n" + abc;
  }

  visualObj = ABCJS.renderAbc("notation", abc)[0];

  // Extrai valores de pitch MIDI
  const midiValues = extractPitchValues(visualObj);
  document.getElementById("musicName").textContent = `${name}`;

  // Desenha visualizações
  drawRadialDotPlot(midiValues);
  drawHistogram(midiValues);

  // Controla reprodução de áudio
  if (synthControl) synthControl.pause();
  synthControl = new ABCJS.synth.SynthController();
  synthControl.load("#audio-controls", null, { displayLoop: false });

  const synth = new ABCJS.synth.CreateSynth();
  synth.init({ visualObj }).then(() => {
    synthControl.setTune(visualObj, false).then(() => {
      synth.prime().then(() => {
        if (synth.audioBuffer) drawWaveform(synth.audioBuffer);
      });
    });
  });
}

// Extrai valores de pitch MIDI de um objeto visual ABCJS
function extractPitchValues(visualObj) {
  const midiValues = [];
  if (!visualObj || !visualObj.lines) return midiValues;

  visualObj.lines.forEach(line => {
    line.staff?.forEach(staff => {
      staff.voices?.forEach(voice => {
        voice.forEach(element => {
          if (element.el_type === "note" && element.pitches) {
            element.pitches.forEach(pitch => {
              midiValues.push(60 + pitch.pitch); // 60 é o C central
            });
          }
        });
      });
    });
  });

  return midiValues;
}

// ---------- DBSCAN ------------
// Calcula a distância Euclidiana entre dois vetores
function euclideanDist(a, b) {
  return Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0));
}

// Algoritmo DBSCAN para clusterização de histogramas de pitch
function dbscan(data, eps, minPts) {
  const labels = new Array(data.length).fill(undefined);
  let clusterId = 0;

  // Encontra vizinhos dentro do raio eps
  function regionQuery(point) {
    return data.map((other, i) => (euclideanDist(point, other) < eps ? i : -1)).filter(i => i >= 0);
  }

  // Expande o cluster a partir de um ponto
  function expandCluster(pointIdx, neighbors) {
    labels[pointIdx] = clusterId;

    let i = 0;
    while (i < neighbors.length) {
      const neighborIdx = neighbors[i];
      if (labels[neighborIdx] === undefined) {
        labels[neighborIdx] = clusterId;
        const moreNeighbors = regionQuery(data[neighborIdx]);
        if (moreNeighbors.length >= minPts) {
          neighbors = neighbors.concat(moreNeighbors);
        }
      }
      i++;
    }
  }

  // Percorre todos os pontos e aplica DBSCAN
  for (let i = 0; i < data.length; i++) {
    if (labels[i] !== undefined) continue;
    const neighbors = regionQuery(data[i]);
    if (neighbors.length < minPts) {
      labels[i] = -1; // marca como ruído
    } else {
      expandCluster(i, neighbors);
      clusterId++;
    }
  }

  return labels;
}

// ---------- Visualização Clusters ------------
// Desenha os histogramas de pitch agrupados por cluster em um gráfico radial
function drawClusteredDots(data, clusters) {
  // Seleciona o SVG e limpa qualquer visualização anterior
  const svg = d3.select("#radialPlot");
  svg.selectAll("*").remove();

  // Obtém dimensões do SVG
  const width = +svg.attr("width");
  const height = +svg.attr("height");

  // Cria um grupo centralizado no meio do SVG
  const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);

  // Escala de cores para clusters
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // Agrupa índices dos histogramas por cluster
  const clusterMap = {};
  data.forEach((hist, i) => {
    const clusterId = clusters[i];
    // Inicializa array para cada cluster, se necessário
    if (!clusterMap[clusterId]) clusterMap[clusterId] = [];
    clusterMap[clusterId].push(i); // Guarda o índice do histograma
  });

  // Obtém apenas clusters válidos (ignora ruído, "-1")
  const uniqueClusters = Object.keys(clusterMap).filter(id => id !== "-1");

  // Parâmetros para os anéis radiais
  const baseRadius = 20; // Raio do primeiro anel
  const ringGap = 20;    // Distância entre anéis
  const pointRadius = 6; // Raio de cada ponto

  // Para cada cluster, desenha um anel de pontos
  uniqueClusters.forEach((clusterId, ringIdx) => {
    const indices = clusterMap[clusterId]; // Índices dos pontos deste cluster
    const n = indices.length;              // Quantidade de pontos no cluster
    const ringRadius = baseRadius + ringIdx * ringGap; // Raio do anel para este cluster

    // Distribui os pontos uniformemente ao longo do círculo do anel
    indices.forEach((dataIdx, i) => {
      const angle = (2 * Math.PI * i) / n; // Ângulo para cada ponto
      const x = Math.cos(angle) * ringRadius; // Coordenada X
      const y = Math.sin(angle) * ringRadius; // Coordenada Y

      // Desenha o círculo para cada ponto
      g.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", pointRadius)
        .attr("fill", color(clusterId))
        .attr("opacity", 0.85)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5);
    });
  });

  // ---------- Legenda dos clusters ----------
  // Cria um grupo para a legenda no canto superior esquerdo do SVG
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(20, 20)`);

  // Para cada cluster, mostra uma cor e os 3 pitches mais frequentes
  uniqueClusters.forEach((clusterId, i) => {
    // Soma os histogramas do cluster para encontrar os pitches mais comuns
    const hists = clusterMap[clusterId].map(idx => data[idx]);
    const summed = hists.reduce((acc, hist) => acc.map((v, i) => v + hist[i]), new Array(128).fill(0));
    // Seleciona os 3 pitches mais frequentes neste cluster
    const topPitches = summed
      .map((count, midi) => ({ midi, count }))
      .filter(d => d.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(d => d.midi)
      .join(", ");

    // Retângulo colorido da legenda
    legend.append("rect")
      .attr("x", 0)
      .attr("y", i * 22)
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", color(clusterId));

    // Texto da legenda com o número do cluster e os pitches principais
    legend.append("text")
      .attr("x", 26)
      .attr("y", i * 22 + 13)
      .text(`Cluster ${clusterId} (MIDI: ${topPitches})`)
      .attr("font-size", "13px")
      .attr("fill", "#333");
  });
}
