// ABCVisualizer.jsx
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as ABCJS from "abcjs";
import Papa from "papaparse";
import "../../css/abc.css";

// Componente principal para visualização de músicas em ABC notation
const ABCVisualizer = () => {
  // Estados para armazenar dados ABC, nomes, índice atual, controle do sintetizador e objeto visual
  const [abcData, setAbcData] = useState([]);
  const [nameData, setNameData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [synthControl, setSynthControl] = useState(null);
  const [visualObj, setVisualObj] = useState(null);
  const svgRef = useRef(); // Referência ao SVG do D3
  const noteElements = useRef(null); // Referência aos círculos das notas no gráfico

  // Carrega e processa o CSV com as músicas ao montar o componente
  useEffect(() => {
    fetch("sets.csv")
      .then((res) => res.text())
      .then((csvText) => {
        const results = Papa.parse(csvText, { header: true });
        const abcArr = [];
        const nameArr = [];
        // Para cada linha do CSV, monta a string ABC com cabeçalhos
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

  // Renderiza a música atual sempre que abcData ou currentIndex mudar
  useEffect(() => {
    if (abcData.length > 0) renderABC(currentIndex);
  }, [abcData, currentIndex]);

  // Função principal para renderizar a notação, gráfico e áudio
  const renderABC = async (index) => {
    const abc = abcData[index];
    const name = nameData[index];
    if (!abc) return;

    // Atualiza o nome da música
    document.getElementById("musicName").textContent = name;

    // NÃO renderiza a notação ABC
    // const visual = ABCJS.renderAbc("notation", abc)[0];
    // Em vez disso, só gera o objeto visual para extração dos dados:
    const visual = ABCJS.parseOnly(abc)[0];
    setVisualObj(visual);

    // Extrai valores MIDI das notas para visualização
    const midiValues = extractPitchValues(visual);
    drawRadialDotPlot(midiValues);

    // Pausa o áudio anterior, se houver
    if (synthControl) synthControl.pause();

    // Cria novo controle de sintetizador para áudio
    const newSynthControl = new ABCJS.synth.SynthController();
    newSynthControl.load("#audio-controls", null, { displayLoop: false });
    setSynthControl(newSynthControl);

    // Inicializa o sintetizador e prepara o áudio
    const synth = new ABCJS.synth.CreateSynth();
    await synth.init({ visualObj: visual });
    await newSynthControl.setTune(visual, false);
    await synth.prime();

    // Liga a animação das notas à reprodução do áudio
    attachNoteAnimation(visual, newSynthControl);

    // (Opcional) Gera visualização de waveform do áudio
    drawWaveform(synth.audioBuffer);
  };

  // Extrai valores MIDI das notas do objeto visual da ABCJS
  const extractPitchValues = (visual) => {
    const midiValues = [];
    visual?.lines?.forEach((line) => {
      line.staff?.forEach((staff) => {
        staff.voices?.forEach((voice) => {
          voice.forEach((el) => {
            if (el.el_type === "note" && el.pitches) {
              el.pitches.forEach((p) => {
                midiValues.push(60 + p.pitch); // 60 = C4 (MIDI)
              });
            }
          });
        });
      });
    });
    return midiValues;
  };

  // Desenha o gráfico radial de pontos usando D3
  const drawRadialDotPlot = (midiValues) => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Limpa o SVG

    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const centerX = width / 2;
    const centerY = height / 2;
    const g = svg.append("g").attr("transform", `translate(${centerX},${centerY})`);

    const angleStep = (2 * Math.PI) / midiValues.length;
    const midiMin = d3.min(midiValues);
    const midiMax = d3.max(midiValues);

    // Escala radial para a distância dos pontos
    const radiusScale = d3.scaleLinear().domain([-24, 24]).range([40, 250]);
    // Escala de cor para os pontos
    const colorScale = d3.scaleSequential(d3.interpolatePlasma).domain([midiMin, midiMax]);

    // Desenha círculos de referência para diferentes alturas
    const pitchLevels = [-24, -12, 0, 12, 24];
    g.selectAll("circle.axis")
      .data(pitchLevels)
      .enter()
      .append("circle")
      .attr("r", (d) => radiusScale(d))
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-dasharray", "2,2")
      ;

    // Adiciona rótulos de altura (pitch)
    g.selectAll("text.pitch-label")
      .data(pitchLevels)
      .enter()
      .append("text")
      .attr("y", (d) => -radiusScale(d))
      .attr("dy", "-0.35em")
      .attr("text-anchor", "middle")
      .attr("class", "pitch-label")
      .text((d) => `MIDI ${60 + d}`)
      .attr("font-size", "10px")
      .attr("fill", "#666");

    // Desenha os pontos das notas
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

  // Liga a animação dos pontos à reprodução das notas
  const attachNoteAnimation = (visual, controller) => {
    controller.setTune(visual, false, {
      noteListener: (note) => {
        const index = note.noteIndex;
        if (typeof index !== "number") return;
        // Destaca o ponto correspondente à nota tocada
        noteElements.current
          .attr("r", (d, i) => (i === index ? 10 : 4))
          .attr("opacity", (d, i) => (i === index ? 1 : 0.6));
      },
    });
  };

  // (Opcional) Função para desenhar o waveform do áudio
  const drawWaveform = (audioBuffer) => {
    console.log("Waveform gerada para o buffer de áudio", audioBuffer);
  };

  // Renderização do componente
  return (
    <div className="abc-container">
            <svg className="abcsvg" ref={svgRef} width="600" height="600"></svg>

      <h2 id="musicName">Carregando...</h2>
      {/* <div id="notation" className="notation-area"></div> */}
      <div id="audio-controls" className="audio-controls"></div>
      <div className="controls-abc">
        <button onClick={() => synthControl?.play()}>Play</button>
        <button onClick={() => synthControl?.pause()}>Pause</button>
        <button onClick={() => setCurrentIndex((prev) => (prev - 1 + abcData.length) % abcData.length)}>Prev</button>
        <button onClick={() => setCurrentIndex((prev) => (prev + 1) % abcData.length)}>Next</button>
      </div>
    </div>
  );
};

export default ABCVisualizer;
