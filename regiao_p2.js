const svg = d3.select("#chart");
const margin = { top: 60, right: 20, bottom: 120, left: 200 };
const innerWidth = +svg.attr("width") - margin.left - margin.right;
const innerHeight = +svg.attr("height") - margin.top - margin.bottom;

const temasPorPagina = 10;
let paginaAtual = 0;

d3.csv("VIMEO_V5.csv").then(data => {
    const temaCount = d3.rollup(data, v => v.length, d => d.Tema);
    const temasRepetidos = new Set([...temaCount.entries()].filter(d => d[1] > 1).map(d => d[0]));
    const filtered = data.filter(d => temasRepetidos.has(d.Tema));

    const counts = d3.rollups(filtered,
        v => v.length,
        d => d.Tema,
        d => d.Região
    );

    const processed = [];
    counts.forEach(([tema, regData]) => {
        regData.forEach(([regiao, count]) => {
            processed.push({ tema, regiao, count });
        });
    });

    const regioes = [...new Set(processed.map(d => d.regiao))];
    const todosTemas = [...new Set(processed.map(d => d.tema))];

    const xScale = d3.scalePoint()
        .domain(regioes)
        .range([0, innerWidth])
        .padding(0.5);

    const rScale = d3.scaleSqrt()
        .domain([1, d3.max(processed, d => d.count)])
        .range([4, 20]);

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    const eixoYGroup = g.append("g");
    const circlesGroup = g.append("g");

    function atualizarPagina() {
        const temasVisiveis = todosTemas.slice(paginaAtual * temasPorPagina, (paginaAtual + 1) * temasPorPagina);

        const yScale = d3.scalePoint()
            .domain(temasVisiveis)
            .range([0, innerHeight])
            .padding(0.5);

        eixoYGroup.call(d3.axisLeft(yScale));

        const visiveis = processed.filter(d => temasVisiveis.includes(d.tema));

        const circles = circlesGroup.selectAll("circle")
            .data(visiveis, d => d.tema + d.regiao);

        circles.exit().remove();

        circles
            .transition().duration(500)
            .attr("cx", d => xScale(d.regiao))
            .attr("cy", d => yScale(d.tema))
            .attr("r", d => rScale(d.count));

        circles.enter()
            .append("circle")
            .attr("cx", d => xScale(d.regiao))
            .attr("cy", d => yScale(d.tema))
            .attr("r", d => rScale(d.count))
            .attr("fill", "#4682B4")
            .on("click", showDetails)
            .append("title")
            .text(d => `${d.tema} (${d.regiao}): ${d.count}`);
    }

    d3.select("#btn-down").on("click", () => {
        const max = Math.floor((todosTemas.length - 1) / temasPorPagina);
        if (paginaAtual < max) { paginaAtual++; atualizarPagina(); }
    });
    d3.select("#btn-up").on("click", () => {
        if (paginaAtual > 0) { paginaAtual--; atualizarPagina(); }
    });

    atualizarPagina();

    function showDetails(datum) {
        const tema = datum.tema;
        const regiao = datum.regiao;

        // filtra só as linhas da música clicada e da mesma região
        const detalhes = data.filter(d => d.Tema === tema && d.Região === regiao);

        const categoria = [...new Set(detalhes.map(d => d.Categorias))].join(", ");
        const autores = [...new Set(detalhes.map(d => d.Nome))];
        const instrumentos = d3.rollup(detalhes, v => v.length, d => d.Instrumento);
        const total = d3.sum([...instrumentos.values()]);

        const instrArray = [...instrumentos.entries()].map(([instr, cnt]) => ({
            instrumento: instr,
            percent: cnt / total * 100
        }));

        const div = d3.select("#detalhes");
        div.html(""); // limpa

        div.append("h3").text(`🎵 Tema: ${tema}`);
        div.append("p").text(`Região: ${regiao}`);
        div.append("p").text(`Categoria: ${categoria}`);
        div.append("p").text(`Autores: ${autores.join(", ")}`);

        const w = 500, h = 40;
        const x = d3.scaleLinear().domain([0, 100]).range([0, w]);
        const color = d3.scaleOrdinal(d3.schemeSet3).domain(instrArray.map(d => d.instrumento));

        const svg2 = div.append("svg").attr("width", w + 50).attr("height", h + 50)
            .append("g").attr("transform", "translate(30,10)");

        let acc = 0;
        instrArray.forEach(d => {
            svg2.append("rect")
                .attr("x", x(acc))
                .attr("y", 0)
                .attr("height", h)
                .attr("width", x(d.percent))
                .attr("fill", color(d.instrumento));

            svg2.append("text")
                .attr("x", x(acc + d.percent / 2))
                .attr("y", h / 2 + 5)
                .attr("text-anchor", "middle")
                .style("fill", "white")
                .style("font-size", "12px")
                .text(`${d.instrumento}: ${d.percent.toFixed(1)}%`);

            acc += d.percent;
        });
    }

});
