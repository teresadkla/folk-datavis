d3.csv("sets.csv").then(data => {
  // Remove duplicados por settingOrder + settingId
  const uniqueData = Array.from(
    d3.group(data, d => `${d.settingOrder}-${d.settingId}`),
    ([, values]) => values[0]
  );

  const typeMeterMap = {};
  const typeModeCount = {};

  uniqueData.forEach(d => {
    if (!typeMeterMap[d.type]) {
      typeMeterMap[d.type] = d.meter;
    }

    if (!typeModeCount[d.type]) {
      typeModeCount[d.type] = {};
    }

    if (!typeModeCount[d.type][d.mode]) {
      typeModeCount[d.type][d.mode] = 0;
    }

    typeModeCount[d.type][d.mode]++;
  });

  const types = Object.keys(typeMeterMap);
  const uniqueMeters = [...new Set(Object.values(typeMeterMap))];
  const uniqueModes = [...new Set(uniqueData.map(d => d.mode))];

  // Escala de cor
  const meterColorScale = d3.scaleOrdinal()
    .domain(uniqueMeters)
    .range(d3.schemeSet2.concat(d3.schemeSet3).slice(0, uniqueMeters.length));

  const modeColorScale = d3.scaleOrdinal()
    .domain(uniqueModes)
    .range(d3.schemePastel1.concat(d3.schemePastel2).slice(0, uniqueModes.length));

  // Escala de tamanho
  const maxModeCount = d3.max(Object.values(typeModeCount), modeCounts =>
    d3.max(Object.values(modeCounts))
  );

  const radiusScale = d3.scaleSqrt()
    .domain([1, maxModeCount])
    .range([4, 20]); // ajusta como quiseres

  const svg = d3.select("svg");
  const width = +svg.attr("width");
  const height = +svg.attr("height");
  const padding = { top: 60, right: 200, bottom: 60, left: 100 };

  // Escalas posicionais
  const xScale = d3.scalePoint()
    .domain(types)
    .range([padding.left, width - padding.right])
    .padding(0.5);

  const yScale = d3.scalePoint()
    .domain(uniqueModes)
    .range([padding.top, height - padding.bottom])
    .padding(0.5);

  // Eixos
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

  svg.append("g")
    .attr("transform", `translate(0, ${height - padding.bottom})`)
    .call(xAxis)
    .selectAll("text")
    .attr("transform", "rotate(-30)")
    .style("text-anchor", "end");

  svg.append("g")
    .attr("transform", `translate(${padding.left}, 0)`)
    .call(yAxis);

  // Bolinha do meter (uma por type, no topo)
  types.forEach(type => {
    svg.append("circle")
      .attr("cx", xScale(type))
      .attr("cy", padding.top - 25)
      .attr("r", 6)
      .attr("fill", meterColorScale(typeMeterMap[type]))
      .attr("stroke", "#444");
  });

  // Bolinhas do mode (por tamanho)
  types.forEach(type => {
    const modes = Object.keys(typeModeCount[type]);

    modes.forEach(mode => {
      const count = typeModeCount[type][mode];
      const size = radiusScale(count);

      svg.append("circle")
        .attr("cx", xScale(type))
        .attr("cy", yScale(mode))
        .attr("r", size)
        .attr("fill", modeColorScale(mode))
        .attr("stroke", "#444")
        .attr("stroke-width", 0.5);
    });
  });

  // Legenda Meter
  const legendMeter = svg.append("g")
    .attr("transform", `translate(${width - 150}, 40)`);

  legendMeter.append("text")
    .text("Meter")
    .attr("font-weight", "bold")
    .attr("font-size", "16px");

  uniqueMeters.forEach((meter, i) => {
    const row = legendMeter.append("g")
      .attr("transform", `translate(0, ${25 + i * 20})`);

    row.append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 6)
      .attr("fill", meterColorScale(meter));

    row.append("text")
      .attr("x", 15)
      .attr("y", 5)
      .text(meter);
  });

  // Legenda Mode
  const legendMode = svg.append("g")
    .attr("transform", `translate(${width - 150}, ${80 + uniqueMeters.length * 20})`);

  legendMode.append("text")
    .text("Mode")
    .attr("font-weight", "bold")
    .attr("font-size", "16px");

  uniqueModes.forEach((mode, i) => {
    const row = legendMode.append("g")
      .attr("transform", `translate(0, ${25 + i * 20})`);

    row.append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 6)
      .attr("fill", modeColorScale(mode));

    row.append("text")
      .attr("x", 15)
      .attr("y", 5)
      .text(mode);
  });
});
