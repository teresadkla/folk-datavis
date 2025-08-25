import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "../../css/dotplotPT.css";

const fontText = getComputedStyle(document.documentElement)
  .getPropertyValue('--font-secondary')
  .trim();

const temasPorPagina = 20;
const regioesPorPagina = 23;

const getFlowerType = (count, tercils) => {
  if (count <= tercils[0]) return 'flower3';      // 0-33% (baixo)
  if (count <= tercils[1]) return 'flower4';      // 33-67% (médio)
  return 'flower5';                               // 67-100% (alto)
};

const getFlowerPath = (type) => {
  const paths = {
    flower3: "M74.31,113.78c.34,10.9-9.97,16.32-9.97,16.32-8.01-10.4-3.4-20.01-3.4-20.01-14.81,1.84-13.29-9.96-13.29-9.96,12.8,7.86,15.21-12.59,15.21-12.59,1.88-18.99,10.91-15.84,10.91-15.84,7.14.37,5.42,17.98,5.42,17.98-1.84,20.97,10.75,20.02,10.75,20.02-8.33,9.85-15.62,4.07-15.62,4.07h0ZM35.31,97.28c7.97-5.03,17.94-14.74,24.16-22.8,4.82-6.27,5.78-7.13,2.03-5.17-9.32,4.64-20.25,11.07-28.52,18.13-6.41,5.37-8.67,8.87-8.42,11.07,1.14,4.5,7.79.62,10.54-1.1,0,0,.21-.13.21-.13ZM9.65,36.1C.04,30.95.5,19.3.5,19.3c13.01-1.73,19.02,7.06,19.02,7.06,5.81-13.75,15.27-6.53,15.27-6.53-13.21,7.16,3.3,19.46,3.3,19.46,15.5,11.13,8.27,17.37,8.27,17.37-3.88,6-18.28-4.29-18.28-4.29-17.24-12.08-22.71-.7-22.71-.7-4.36-12.14,4.29-15.57,4.29-15.57h-.01ZM43.45,10.57c.37,9.41,3.8,22.9,7.66,32.32,3.02,7.31,3.29,8.57,3.46,4.34.64-10.39.54-23.07-1.44-33.76-1.45-8.24-3.34-11.94-5.38-12.83-4.47-1.27-4.43,6.44-4.32,9.68v.25h.02ZM109.26,18.95c9.27-5.75,19.12.47,19.12.47-5,12.13-15.63,12.94-15.63,12.94,9,11.9-1.98,16.49-1.98,16.49.41-15.02-18.5-6.88-18.5-6.88-17.39,7.86-19.17-1.52-19.17-1.52-3.25-6.36,12.86-13.68,12.86-13.68,19.09-8.89,11.97-19.32,11.97-19.32,12.69,2.29,11.34,11.5,11.34,11.5h-.01ZM114.47,60.98c-8.34-4.38-21.73-8.16-31.82-9.52-7.84-1.04-9.06-1.44-5.49.83,8.68,5.75,19.71,12,29.96,15.63,7.86,2.87,12.01,3.07,13.8,1.76,3.33-3.24-3.36-7.06-6.23-8.58l-.22-.11h0ZM64.41,46.55c4.84,0,8.77,3.93,8.77,8.77s-3.93,8.77-8.77,8.77-8.77-3.93-8.77-8.77,3.93-8.77,8.77-8.77Z", // adicionar path da flower3
    flower4: "M93.47,133.38c1.83,10.75-7.64,17.54-7.64,17.54-9.36-9.2-6.11-19.35-6.11-19.35-14.42,3.86-14.53-8.04-14.53-8.04,13.76,6.03,13.34-14.55,13.34-14.55-.74-19.07,8.63-17.19,8.63-17.19,7.12-.62,7.84,17.06,7.84,17.06,1.05,21.03,13.39,18.36,13.39,18.36-6.9,10.9-14.92,6.18-14.92,6.18h0ZM52.56,122.38c7.2-6.07,15.74-17.06,20.81-25.9,3.92-6.87,4.74-7.85,1.3-5.4-8.59,5.88-18.54,13.74-25.76,21.87-5.61,6.2-7.37,9.97-6.83,12.12,1.74,4.3,7.8-.45,10.29-2.54l.19-.16h0ZM18.19,93.47c-10.75,1.83-17.54-7.64-17.54-7.64,9.2-9.36,19.35-6.11,19.35-6.11-3.86-14.42,8.04-14.53,8.04-14.53-6.03,13.76,14.55,13.34,14.55,13.34,19.07-.74,17.19,8.63,17.19,8.63.62,7.12-17.06,7.84-17.06,7.84-21.03,1.05-18.36,13.39-18.36,13.39-10.9-6.9-6.18-14.92-6.18-14.92h.01ZM29.18,52.56c6.07,7.2,17.06,15.74,25.9,20.81,6.87,3.92,7.85,4.74,5.4,1.3-5.88-8.59-13.74-18.54-21.87-25.76-6.2-5.61-9.97-7.37-12.12-6.83-4.3,1.74.45,7.8,2.54,10.29l.16.19h-.01ZM58.1,18.19c-1.83-10.75,7.64-17.54,7.64-17.54,9.36,9.2,6.11,19.35,6.11,19.35,14.42-3.86,14.53,8.04,14.53,8.04-13.76-6.03-13.34,14.55-13.34,14.55.74,19.07-8.63,17.19-8.63,17.19-7.12.62-7.84-17.06-7.84-17.06-1.05-21.03-13.39-18.36-13.39-18.36,6.9-10.9,14.92-6.18,14.92-6.18h0ZM99,29.18c-7.2,6.07-15.74,17.06-20.81,25.9-3.92,6.87-4.74,7.85-1.3,5.4,8.59-5.88,18.54-13.74,25.76-21.87,5.61-6.2,7.37-9.97,6.83-12.12-1.74-4.3-7.8.45-10.29,2.54l-.19.16h0ZM133.38,58.1c10.75-1.83,17.54,7.64,17.54,7.64-9.2,9.36-19.35,6.11-19.35,6.11,3.86,14.42-8.04,14.53-8.04,14.53,6.03-13.76-14.55-13.34-14.55-13.34-19.07.74-17.19-8.63-17.19-8.63-.62-7.12,17.06-7.84,17.06-7.84,21.03-1.05,18.36-13.39,18.36-13.39,10.9,6.9,6.18,14.92,6.18,14.92h0ZM122.38,99c-6.07-7.2-17.06-15.74-25.9-20.81-6.87-3.92-7.85-4.74-5.4-1.3,5.88,8.59,13.74,18.54,21.87,25.76,6.2,5.61,9.97,7.37,12.12,6.83,4.3-1.74-.45-7.8-2.54-10.29l-.16-.19h.01ZM75.78,66.05c4.84,0,8.77,3.93,8.77,8.77s-3.93,8.77-8.77,8.77-8.77-3.93-8.77-8.77,3.93-8.77,8.77-8.77Z", // adicionar path da flower4
    flower5: "M88.69,128.43c1.9,10.74-7.53,17.59-7.53,17.59-9.41-9.14-6.23-19.31-6.23-19.31-14.39,3.95-14.58-7.95-14.58-7.95,13.8,5.94,13.24-14.64,13.24-14.64-.86-19.06,8.52-17.24,8.52-17.24,7.11-.66,7.94,17.01,7.94,17.01,1.18,21.02,13.51,18.27,13.51,18.27-6.83,10.94-14.88,6.27-14.88,6.27h.01ZM47.71,117.7c7.16-6.12,15.64-17.16,20.64-26.03,3.88-6.9,4.69-7.88,1.27-5.41-8.56,5.93-18.45,13.86-25.62,22.03-5.57,6.23-7.31,10.02-6.75,12.17,1.77,4.29,7.8-.5,10.28-2.61l.19-.16h0ZM19.68,104.53c-9.63,5.13-19.05-1.73-19.05-1.73,5.78-11.78,16.44-11.89,16.44-11.89-8.2-12.47,3.06-16.32,3.06-16.32-1.39,14.96,18.01,8.07,18.01,8.07,17.86-6.71,19.03,2.78,19.03,2.78,2.83,6.56-13.72,12.81-13.72,12.81-19.63,7.62-13.21,18.49-13.21,18.49-12.51-3.12-10.56-12.21-10.56-12.21ZM17.23,62.25c8.03,4.92,21.15,9.57,31.13,11.59,7.76,1.56,8.95,2.03,5.53-.46-8.28-6.3-18.88-13.27-28.87-17.56-7.65-3.37-11.79-3.85-13.66-2.66-3.53,3.01,2.89,7.26,5.65,8.97l.21.13h.01ZM21.1,31.52c-7.85-7.57-4.25-18.65-4.25-18.65,12.99,1.86,16.39,11.96,16.39,11.96,9.32-11.66,16.47-2.14,16.47-2.14-14.65,3.3-2.11,19.63-2.11,19.63,11.9,14.92,3.24,18.96,3.24,18.96-5.37,4.72-16.43-9.09-16.43-9.09-13.31-16.31-21.67-6.85-21.67-6.85-.9-12.87,8.35-13.82,8.35-13.82h0ZM60.55,16.12c-2.2,9.16-2.56,23.07-1.4,33.19.92,7.86.84,9.14,2.15,5.12,3.44-9.83,6.78-22.06,7.78-32.89.84-8.32.02-12.4-1.69-13.81-3.96-2.43-6.01,4.99-6.78,8.15,0,0-.06.24-.06.24ZM90.97,10.3C95.74.49,107.4.5,107.4.5c2.24,12.93-6.31,19.29-6.31,19.29,13.97,5.26,7.12,15,7.12,15-7.67-12.92-19.32,4.06-19.32,4.06-10.51,15.93-17.03,8.94-17.03,8.94-6.14-3.65,3.57-18.43,3.57-18.43,11.4-17.7-.19-22.72-.19-22.72,11.96-4.83,15.72,3.67,15.72,3.67h0ZM117.81,43.07c-9.39.74-22.74,4.69-32,8.92-7.19,3.3-8.43,3.62-4.2,3.63,10.41.23,23.07-.36,33.68-2.76,8.17-1.77,11.8-3.81,12.61-5.88,1.09-4.51-6.61-4.18-9.85-3.93l-.25.02h0ZM132.74,70.2c10.8,1.51,14.4,12.59,14.4,12.59-11.6,6.13-20.29-.04-20.29-.04-.69,14.91-12.07,11.41-12.07,11.41,9.92-11.28-9.83-17.12-9.83-17.12-18.4-5.07-13.76-13.43-13.76-13.43,1.57-6.97,18.64-2.3,18.64-2.3,20.36,5.37,21.55-7.2,21.55-7.2,8.29,9.88,1.37,16.09,1.37,16.09h0ZM109.87,105.85c-3.6-8.7-11.49-20.17-18.38-27.67-5.36-5.82-6.05-6.9-4.75-2.88,3,9.97,7.48,21.83,13.04,31.18,4.21,7.23,7.27,10.04,9.49,10.18,4.63-.36,1.93-7.57.7-10.58l-.1-.23ZM70.64,59.26c4.84,0,8.77,3.93,8.77,8.77s-3.93,8.77-8.77,8.77-8.77-3.93-8.77-8.77,3.93-8.77,8.77-8.77Z"  // adicionar path da flower5
  };
  return paths[type];
};

const GraficoTemasPorRegiao = ({ active }) => {
  const svgRef = useRef();
  const [dadosProcessados, setDadosProcessados] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [todasRegioes, setTodasRegioes] = useState([]);
  const [paginaTema, setPaginaTema] = useState(0);
  const [paginaRegiao, setPaginaRegiao] = useState(0);
  const [prevActive, setPrevActive] = useState(false);
  const [prevPaginaTema, setPrevPaginaTema] = useState(0);
  const [prevPaginaRegiao, setPrevPaginaRegiao] = useState(0);

  const [todosInstrumentos, setTodosInstrumentos] = useState([]);
  const [instrumentosSelecionados, setInstrumentosSelecionados] = useState([]);
  const [dadosFiltrados, setDadosFiltrados] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [modoVisualizacao, setModoVisualizacao] = useState('temas');
  const [todasCategorias, setTodasCategorias] = useState([]);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState([]);
  const [isDropdownCategoriaOpen, setIsDropdownCategoriaOpen] = useState(false);
  const [dadosVisualizacao, setDadosVisualizacao] = useState([]);
  const [itensEixoY, setItensEixoY] = useState([]);

  const totalPaginasTemas = Math.ceil(itensEixoY.length / temasPorPagina);

  const processarDadosPorCategoria = (dados) => {
    const expandedData = [];
    dados.forEach(item => {
      if (item.Categorias) {
        const categorias = item.Categorias.split(",").map(c => c.trim());
        categorias.forEach(categoria => {
          if (categoria) {
            expandedData.push({
              ...item,
              CategoriaPrincipal: categoria
            });
          }
        });
      }
    });

    const counts = d3.rollups(
      expandedData,
      v => v.length,
      d => d.CategoriaPrincipal,
      d => d.Região
    );

    const processed = [];
    counts.forEach(([categoria, regiaoData]) => {
      regiaoData.forEach(([regiao, count]) => {
        const instrumentos = expandedData
          .filter(item => item.CategoriaPrincipal === categoria && item.Região === regiao)
          .map(item => item.Instrumento)
          .flatMap(instr => (instr ? instr.split(",").map(i => i.trim()) : []))
          .filter((v, i, a) => v && a.indexOf(v) === i);

        processed.push({
          tema: categoria,
          regiao,
          count,
          categoria,
          instrumentos
        });
      });
    });

    return processed;
  };

  const processarDadosPorInstrumento = (dados) => {
    const expandedData = [];
    dados.forEach(item => {
      if (item.Instrumento) {
        const instrumentos = item.Instrumento.split(",").map(i => i.trim());
        instrumentos.forEach(instrumento => {
          if (instrumento) {
            expandedData.push({
              ...item,
              InstrumentoPrincipal: instrumento
            });
          }
        });
      }
    });

    const counts = d3.rollups(
      expandedData,
      v => v.length,
      d => d.InstrumentoPrincipal,
      d => d.Região
    );

    const processed = [];
    counts.forEach(([instrumento, regiaoData]) => {
      regiaoData.forEach(([regiao, count]) => {
        const categoria = expandedData.find(
          d => d.InstrumentoPrincipal === instrumento && d.Região === regiao
        )?.Categorias ?? "";

        processed.push({
          tema: instrumento,
          regiao,
          count,
          categoria,
          instrumentos: [instrumento]
        });
      });
    });

    return processed;
  };

  useEffect(() => {
    d3.csv("VIMEO_V8.csv").then((data) => {
      const temaCount = d3.rollup(data, v => v.length, d => d.Tema);
      const temasRepetidos = new Set([...temaCount.entries()].filter(([_, c]) => c > 1).map(([t]) => t));
      const filtrados = data.filter(d => temasRepetidos.has(d.Tema));

      const allInstruments = filtrados
        .map(item => item.Instrumento)
        .flatMap(instr => (instr ? instr.split(",").map(i => i.trim()) : []))
        .filter((v, i, a) => v && a.indexOf(v) === i)
        .sort();

      setTodosInstrumentos(allInstruments);

      const allCategories = filtrados
        .map(item => item.Categorias)
        .filter(cat => cat)
        .flatMap(cat => cat.split(",").map(c => c.trim()))
        .filter((v, i, a) => v && a.indexOf(v) === i)
        .sort();

      setTodasCategorias(allCategories);

      const counts = d3.rollups(
        filtrados,
        v => v.length,
        d => d.Tema,
        d => d.Região
      );

      const processed = [];
      counts.forEach(([tema, regiaoData]) => {
        regiaoData.forEach(([regiao, count]) => {
          const categoria = filtrados.find(
            d => d.Tema === tema && d.Região === regiao
          )?.Categorias ?? "";

          const instrumentos = filtrados
            .filter(item => item.Tema === tema && item.Região === regiao)
            .map(item => item.Instrumento)
            .flatMap(instr => (instr ? instr.split(",").map(i => i.trim()) : []))
            .filter((v, i, a) => v && a.indexOf(v) === i);

          processed.push({ tema, regiao, count, categoria, instrumentos });
        });
      });

      setFilteredData(filtrados);
      setDadosProcessados(processed);
      setDadosFiltrados(processed);
      setDadosVisualizacao(processed);
      setTodasRegioes(Array.from(new Set(processed.map(d => d.regiao))).sort(d3.ascending));
      setItensEixoY(Array.from(new Set(processed.map(d => d.tema))).sort(d3.ascending));
    });
  }, []);

  useEffect(() => {
    let dadosParaProcessar = dadosFiltrados.length > 0 ?
      filteredData.filter(d => {
        const temaNaLista = dadosFiltrados.some(df => df.tema === d.Tema && df.regiao === d.Região);
        return temaNaLista;
      }) : filteredData;

    let novosdados = [];

    switch (modoVisualizacao) {
      case 'temas':
        novosdados = dadosProcessados;
        break;
      case 'categorias':
        novosdados = processarDadosPorCategoria(dadosParaProcessar);
        break;
      case 'instrumentos':
        novosdados = processarDadosPorInstrumento(dadosParaProcessar);
        break;
      default:
        novosdados = dadosProcessados;
    }

    if (instrumentosSelecionados.length > 0 && modoVisualizacao !== 'instrumentos') {
      novosdados = novosdados.filter(d =>
        instrumentosSelecionados.some(instrumento =>
          d.instrumentos && d.instrumentos.includes(instrumento)
        )
      );
    }

    if (categoriasSelecionadas.length > 0 && modoVisualizacao !== 'categorias') {
      novosdados = novosdados.filter(d =>
        categoriasSelecionadas.some(categoria =>
          d.categoria && d.categoria.includes(categoria)
        )
      );
    }

    setDadosVisualizacao(novosdados);
    setItensEixoY(Array.from(new Set(novosdados.map(d => d.tema))).sort(d3.ascending));

    setPaginaTema(0);
    setPaginaRegiao(0);
  }, [modoVisualizacao, dadosProcessados, filteredData, instrumentosSelecionados, categoriasSelecionadas, dadosFiltrados]);

  useEffect(() => {
    if (!active) {
      setPrevActive(false);
      return;
    }

    const svg = d3.select(svgRef.current);
    const width = +svg.attr("width");
    const height = +svg.attr("height");

    const margin = { top: 60, right: 60, bottom: 120, left: 200 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .selectAll("g.container")
      .data([null])
      .join("g")
      .attr("class", "container")
      .attr("transform", `translate(${margin.left}, ${(height - innerHeight) / 2 + 60})`);

    const eixoYGroup = g.selectAll("g.y-axis").data([null]).join("g").attr("class", "y-axis");
    const imagesGroup = g.selectAll("g.images").data([null]).join("g").attr("class", "images");

    let tooltip = d3.select("body").select(".dotplot-tooltip");
    if (tooltip.empty()) {
      tooltip = d3.select("body")
        .append("div")
        .attr("class", "dotplot-tooltip")
        .style("position", "absolute")
        .style("padding", "10px")
        .style("background", "white")
        .style("color", "white")
        .style("border-radius", "5px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("font-family", fontText)
        .style("font-size", "12px")
        .style("box-shadow", "0 2px 5px rgba(0,0,0,0.3)")
        .style("z-index", "1000");
    }

    // Calcular intervalos fixos para determinar o tipo de flor (baseado nos valores mín/máx)
    const counts = dadosVisualizacao.map(d => d.count).filter(count => count > 0).sort(d3.ascending);
    const minCount = d3.min(counts);
    const maxCount = d3.max(counts);
    const range = maxCount - minCount;

    const intervalos = [
      minCount + range * 0.25,  // 33% do range
      minCount + range * 0.75   // 67% do range
    ];

    const getFlowerTypeIntervalos = (count, intervalos) => {
      if (count <= 0) return null; // Não mostrar flowers para valores 0 ou negativos
      if (count <= intervalos[0]) return 'flower3';      // Baixo
      if (count <= intervalos[1]) return 'flower4';      // Médio  
      return 'flower5';                                  // Alto
    };

    const rScale = d3.scaleSqrt().domain([1, d3.max(dadosVisualizacao, d => d.count)]).range([30, 70]);

    const regioesVisiveis = todasRegioes.slice(paginaRegiao * regioesPorPagina, (paginaRegiao + 1) * regioesPorPagina);
    const temasVisiveis = itensEixoY.slice(paginaTema * temasPorPagina, (paginaTema + 1) * temasPorPagina);

    const xScale = d3.scalePoint().domain(regioesVisiveis).range([0, innerWidth]).padding(0.5);
    const yScale = d3.scalePoint().domain(temasVisiveis).range([0, innerHeight]).padding(0.5);

    const visiveis = dadosVisualizacao.filter(
      d => temasVisiveis.includes(d.tema) && regioesVisiveis.includes(d.regiao) && d.count > 0
    ).map(d => ({
      ...d,
      flowerType: getFlowerTypeIntervalos(d.count, intervalos) // ← Usar intervalos fixos
    })).filter(d => d.flowerType !== null); // ← Remover entradas com flowerType null

    const paths = imagesGroup.selectAll("path.flower").data(visiveis, d => d.tema + d.regiao);

    const isPageChange = (prevPaginaTema !== paginaTema || prevPaginaRegiao !== paginaRegiao);
    const shouldAnimate = !prevActive || (prevActive !== active && !isPageChange);

    setPrevPaginaTema(paginaTema);
    setPrevPaginaRegiao(paginaRegiao);

    paths.exit()
      .transition()
      .duration(isPageChange ? 0 : 300)
      .style("opacity", 0)
      .attr("transform", d => {
        const x = xScale(d.regiao) - rScale(d.count) / 2;
        const y = yScale(d.tema) - rScale(d.count) / 2;
        return `translate(${x}, ${y}) scale(0)`;
      })
      .remove();

    const animatePaths = (selection, isNew = false) => {
      if (isPageChange) {
        selection
          .attr("transform", d => {
            const x = xScale(d.regiao) - rScale(d.count) / 2;
            const y = yScale(d.tema) - rScale(d.count) / 2;
            const scale = rScale(d.count) / 170; // Diminuir este número aumenta o tamanho geral
            return `translate(${x}, ${y}) scale(${scale})`;
          })
          .style("opacity", 1);
        return;
      }

      selection
        .attr("transform", d => {
          const x = xScale(d.regiao) - rScale(d.count) / 2;
          const y = yScale(d.tema) - rScale(d.count) / 2;
          return `translate(${x}, ${y}) scale(0)`;
        })
        .style("opacity", 0);

      selection
        .transition()
        .duration(700)
        .ease(d3.easeBackOut)
        .attr("transform", d => {
          const x = xScale(d.regiao) - rScale(d.count) / 2;
          const y = yScale(d.tema) - rScale(d.count) / 2;
          const scale = rScale(d.count) / 170; // Diminuir este número aumenta o tamanho geral
          return `translate(${x}, ${y}) scale(${scale})`;
        })
        .style("opacity", 1);
    };

    if (shouldAnimate) {
      animatePaths(paths);
    } else {
      paths
        .attr("transform", d => {
          const x = xScale(d.regiao) - rScale(d.count) / 2;
          const y = yScale(d.tema) - rScale(d.count) / 2;
          const scale = rScale(d.count) / 170; // Diminuir este número aumenta o tamanho geral
          return `translate(${x}, ${y}) scale(${scale})`;
        });
    }

    const createTooltipContent = (d) => {
      const labelModo = modoVisualizacao.charAt(0).toUpperCase() + modoVisualizacao.slice(1, -1);
      
      let content = `
        <div style="margin-bottom: 5px;">
          <strong>${labelModo}:</strong> ${d.tema}
        </div>
        <div style="margin-bottom: 5px;">
          <strong>Região:</strong> ${d.regiao}
        </div>
        <div style="margin-bottom: 5px;">
          <strong>Ocorrências:</strong> ${d.count}
        </div>
      `;

      if (modoVisualizacao === 'temas' || modoVisualizacao === 'instrumentos') {
        if (d.categoria) {
          content += `
            <div style="margin-bottom: 5px;">
              <strong>Categoria:</strong> ${d.categoria}
            </div>
          `;
        }
      }

      if (d.instrumentos && d.instrumentos.length > 0 && modoVisualizacao !== 'instrumentos') {
        const instrumentosLimitados = d.instrumentos.slice(0, 3);
        const instrumentosTexto = instrumentosLimitados.join(", ");
        const maisInstrumentos = d.instrumentos.length > 3 ? ` (+${d.instrumentos.length - 3} mais)` : "";
        
        content += `
          <div style="margin-bottom: 5px;">
            <strong>Instrumentos:</strong> ${instrumentosTexto}${maisInstrumentos}
          </div>
        `;
      }

      return content;
    };

    const enterPaths = paths.enter()
      .append("path")
      .attr("class", d => `flower ${d.flowerType}`)
      .attr("d", d => getFlowerPath(d.flowerType))
      .style("fill", "#474E95")
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .style("fill", "#6A5ACD")
          .style("opacity", 0.9);

        tooltip
          .html(createTooltipContent(d))
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px")
          .transition()
          .duration(200)
          .style("opacity", 1);
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .style("fill", "#474E95")
          .style("opacity", 1);

        tooltip
          .transition()
          .duration(200)
          .style("opacity", 0);
      })
      .on("click", (event, d) => {
        tooltip.style("opacity", 0);
        
        const artistas = filteredData
          .filter(item => {
            switch (modoVisualizacao) {
              case 'temas':
                return item.Tema === d.tema && item.Região === d.regiao;
              case 'categorias':
                return item.Categorias && item.Categorias.includes(d.tema) && item.Região === d.regiao;
              case 'instrumentos':
                return item.Instrumento && item.Instrumento.includes(d.tema) && item.Região === d.regiao;
              default:
                return false;
            }
          })
          .map(item => item.Nome)
          .filter((v, i, a) => a.indexOf(v) === i);

        const instrumentos = filteredData
          .filter(item => {
            switch (modoVisualizacao) {
              case 'temas':
                return item.Tema === d.tema && item.Região === d.regiao;
              case 'categorias':
                return item.Categorias && item.Categorias.includes(d.tema) && item.Região === d.regiao;
              case 'instrumentos':
                return item.Instrumento && item.Instrumento.includes(d.tema) && item.Região === d.regiao;
              default:
                return false;
            }
          })
          .map(item => item.Instrumento)
          .flatMap(instr => (instr ? instr.split(",").map(i => i.trim()) : []))
          .filter((v, i, a) => v && a.indexOf(v) === i);

        const labelModo = modoVisualizacao.charAt(0).toUpperCase() + modoVisualizacao.slice(1, -1);

        d3.select("#categoria-info")
          .style("display", "block")
          .html(`
            <button class="close-button">✕</button>
            <div class="card">
              <div class="header">
                <strong>${labelModo}:</strong> ${d.tema}
                <span class="regiao">${d.regiao}</span>
              </div>
              <hr>
              <div class="section">
                <strong>Categoria:</strong>
                <ul><li>${d.categoria}</li></ul>
              </div>
              <div class="section">
                <strong>Artistas:</strong>
                <ul>${artistas.map(nome => `<li>${nome}</li>`).join("")}</ul>
              </div>
              <div class="section">
                <strong>Instrumentos:</strong>
                <ul>${instrumentos.map(instr => `<li>${instr}</li>`).join("")}</ul>
              </div>
            </div>
          `);

        d3.select("#categoria-info .close-button").on("click", () => {
          d3.select("#categoria-info").style("display", "none");
        });
      });

    paths
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .style("fill", "#6A5ACD")
          .style("opacity", 0.9);

        tooltip
          .html(createTooltipContent(d))
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px")
          .transition()
          .duration(200)
          .style("opacity", 1);
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .style("fill", "#474E95")
          .style("opacity", 1);

        tooltip
          .transition()
          .duration(200)
          .style("opacity", 0);
      });

    enterPaths.selectAll("title").remove();
    paths.selectAll("title").remove();

    animatePaths(enterPaths, true);
    setPrevActive(true);

    g.selectAll(".x-grid").remove();
    g.selectAll(".y-grid").remove();

    g.selectAll(".x-grid")
      .data(regioesVisiveis)
      .enter()
      .append("line")
      .attr("class", "x-grid")
      .attr("x1", d => xScale(d))
      .attr("x2", d => xScale(d))
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "#ccc")
      .attr("stroke-dasharray", "2,2")
      .style("opacity", 0);

    g.selectAll(".y-grid")
      .data(temasVisiveis)
      .enter()
      .append("line")
      .attr("class", "y-grid")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", d => yScale(d))
      .attr("y2", d => yScale(d))
      .attr("stroke", "#eee")
      .attr("stroke-dasharray", "2,2")
      .style("opacity", 0);

    g.selectAll(".x-grid, .y-grid")
      .transition()
      .duration(600)
      .style("opacity", 1);

    imagesGroup.raise();

    eixoYGroup.call(d3.axisLeft(yScale));
    eixoYGroup.selectAll("text")
      .style("font-family", fontText)
      .style("font-size", "12px")
      .style("opacity", 0)
      .transition()
      .duration(600)
      .style("opacity", 1);

    g.selectAll(".x-axis").remove();
    g.append("g")
      .attr("class", "x-axis")
      .call(d3.axisTop(xScale).tickValues(regioesVisiveis))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "start")
      .style("font-family", fontText)
      .style("font-size", "12px")
      .style("opacity", 0)
      .transition()
      .duration(600)
      .style("opacity", 1);

  }, [active, dadosVisualizacao, itensEixoY, todasRegioes, paginaTema, paginaRegiao, prevActive, prevPaginaTema, prevPaginaRegiao, modoVisualizacao]);

  return (
    <div className="dotplotPT-container">
      <div className="dotplotPT-filters">
        <div className="modo-visualizacao">
          <label>Eixo Y - Visualizar por:</label>
          <select
            value={modoVisualizacao}
            onChange={(e) => setModoVisualizacao(e.target.value)}
            className="modo-select"
          >
            <option value="temas">Temas</option>
            <option value="categorias">Categorias</option>
            <option value="instrumentos">Instrumentos</option>
          </select>
        </div>

        {modoVisualizacao !== 'categorias' && (
          <div className="categoria-filter">
            <button
              className="filter-button"
              onClick={() => setIsDropdownCategoriaOpen(!isDropdownCategoriaOpen)}
            >
              {categoriasSelecionadas.length === 0
                ? "Filtrar por Categoria"
                : `${categoriasSelecionadas.length} categoria(s) selecionada(s)`}
            </button>

            {isDropdownCategoriaOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <button
                    className="select-all-button"
                    onClick={() => {
                      if (categoriasSelecionadas.length === todasCategorias.length) {
                        setCategoriasSelecionadas([]);
                      } else {
                        setCategoriasSelecionadas([...todasCategorias]);
                      }
                    }}
                  >
                    {categoriasSelecionadas.length === todasCategorias.length
                      ? "Desselecionar Todos"
                      : "Selecionar Todos"}
                  </button>
                  <button
                    className="close-dropdown"
                    onClick={() => setIsDropdownCategoriaOpen(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="instrumento-list">
                  {todasCategorias.map(categoria => (
                    <label key={categoria} className="instrumento-item">
                      <input
                        type="checkbox"
                        checked={categoriasSelecionadas.includes(categoria)}
                        onChange={() => {
                          if (categoriasSelecionadas.includes(categoria)) {
                            setCategoriasSelecionadas(
                              categoriasSelecionadas.filter(c => c !== categoria)
                            );
                          } else {
                            setCategoriasSelecionadas([...categoriasSelecionadas, categoria]);
                          }
                        }}
                      />
                      {categoria}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {modoVisualizacao !== 'instrumentos' && (
          <div className="instrumento-filter">
            <button
              className="filter-button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {instrumentosSelecionados.length === 0
                ? "Filtrar por Instrumento"
                : `${instrumentosSelecionados.length} instrumento(s) selecionado(s)`}
            </button>

            {isDropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <button
                    className="select-all-button"
                    onClick={() => {
                      if (instrumentosSelecionados.length === todosInstrumentos.length) {
                        setInstrumentosSelecionados([]);
                      } else {
                        setInstrumentosSelecionados([...todosInstrumentos]);
                      }
                    }}
                  >
                    {instrumentosSelecionados.length === todosInstrumentos.length
                      ? "Desselecionar Todos"
                      : "Selecionar Todos"}
                  </button>
                  <button
                    className="close-dropdown"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="instrumento-list">
                  {todosInstrumentos.map(instrumento => (
                    <label key={instrumento} className="instrumento-item">
                      <input
                        type="checkbox"
                        checked={instrumentosSelecionados.includes(instrumento)}
                        onChange={() => {
                          if (instrumentosSelecionados.includes(instrumento)) {
                            setInstrumentosSelecionados(
                              instrumentosSelecionados.filter(i => i !== instrumento)
                            );
                          } else {
                            setInstrumentosSelecionados([...instrumentosSelecionados, instrumento]);
                          }
                        }}
                      />
                      {instrumento}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="dotplotPT-info">
        <svg ref={svgRef} width={1200} height={1000} />
        <div id="categoria-info" style={{ marginTop: "1rem", fontSize: "14px" }}></div>
      </div>

      <div className="dotplotPT-controls">
        <div>
          <button onClick={() => setPaginaTema((p) => Math.max(p - 1, 0))} disabled={paginaTema === 0}>
            ↑
          </button>
          <span style={{ margin: "0 10px" }}>
            {modoVisualizacao.charAt(0).toUpperCase() + modoVisualizacao.slice(1, -1)} {paginaTema + 1}
          </span>
          <button
            onClick={() => setPaginaTema((p) => Math.min(p + 1, totalPaginasTemas - 1))}
            disabled={paginaTema >= totalPaginasTemas - 1}
          >
            ↓
          </button>
        </div>
      </div>
    </div>
  );
};

export default GraficoTemasPorRegiao;