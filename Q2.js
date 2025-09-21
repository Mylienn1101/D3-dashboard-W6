// (function () {
//   const csvPath = "data/Data.csv";
//   const containerId = "#chart2";

//   function parseMoney(v) {
//     if (!v) return 0;
//     return Number(String(v).replace(/[^\d\.\-]/g, "")) || 0;
//   }

//   d3.dsv(";", csvPath).then(rawData => {
//     const data = rawData.map(d => ({
//       groupCode: d.MaNhomHang,
//       groupName: `[${d.MaNhomHang}] ${d.TenNhomHang}`,
//       value: parseMoney(d.ThanhTien)
//     }));

//     const grouped = d3.rollups(
//       data,
//       v => d3.sum(v, d => d.value),
//       d => d.groupName
//     );

//     const flat = grouped.map(([groupName, totalValue]) => ({
//       groupName,
//       value: totalValue
//     })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

//     const margin = { top: 50, right: 60, bottom: 40, left: 340 };
//     const barHeight = 30;
//     const innerWidth = 1000;
//     const plotHeight = flat.length * barHeight;
//     const svgWidth = margin.left + innerWidth + margin.right;
//     const svgHeight = margin.top + plotHeight + margin.bottom;

//     const svg = d3.select(containerId).append("svg")
//       .attr("width", svgWidth)
//       .attr("height", svgHeight);

//     const plot = svg.append("g")
//       .attr("transform", `translate(${margin.left},${margin.top})`);

//     const x = d3.scaleLinear()
//       .domain([0, d3.max(flat, d => d.value)]).nice()
//       .range([0, innerWidth]);

//     const y = d3.scaleBand()
//       .domain(flat.map(d => d.groupName))
//       .range([0, plotHeight])
//       .padding(0.18);

//     const color = d3.scaleOrdinal()
//       .domain(flat.map(d => d.groupName))
//       .range(d3.schemeTableau10);

//     // Grid line trục X
//     plot.append("g")
//       .attr("class", "x-axis")
//       .attr("transform", `translate(0, ${plotHeight})`)
//       .call(d3.axisBottom(x).ticks(5).tickFormat(d => `${d / 1e6}M`))
//       .call(g => g.selectAll(".tick line")
//         .attr("y1", -plotHeight)
//         .attr("stroke", "#ccc")
//         .attr("stroke-dasharray", "2,2")
//       );

//     // Trục Y
//     plot.append("g")
//       .call(d3.axisLeft(y).tickSize(0))
//       .selectAll("text").style("font-size", "12px");

//     // Tooltip
//     const tooltip = d3.select("body").append("div")
//       .attr("id", "tooltip")
//       .style("position", "absolute")
//       .style("visibility", "hidden")
//       .style("background", "#fff")
//       .style("border", "1px solid #ccc")
//       .style("padding", "6px")
//       .style("font-size", "12px")
//       .style("border-radius", "4px")
//       .style("box-shadow", "0 2px 6px rgba(0,0,0,0.2)");

//     // Bars
//     plot.selectAll(".bar")
//       .data(flat)
//       .join("rect")
//       .attr("class", "bar")
//       .attr("x", 0)
//       .attr("y", d => y(d.groupName))
//       .attr("height", y.bandwidth())
//       .attr("width", d => x(d.value))
//       .attr("fill", d => color(d.groupName))
//       .on("mouseover", (event, d) => {
//         tooltip.style("visibility", "visible")
//           .html(`
//             <strong>Nhóm hàng:</strong> ${d.groupName}<br/>
//             <strong>Doanh số bán:</strong> ${Math.round(d.value / 1e6).toLocaleString()} triệu VND
//           `);
//       })
//       .on("mousemove", event => {
//         tooltip.style("top", (event.pageY - 10) + "px")
//                .style("left", (event.pageX + 10) + "px");
//       })
//       .on("mouseout", () => {
//         tooltip.style("visibility", "hidden");
//       });

//     // Data labels
//     plot.selectAll(".barlabel")
//       .data(flat)
//       .join("text")
//       .attr("class", "barlabel")
//       .attr("x", d => x(d.value) + 8)
//       .attr("y", d => y(d.groupName) + y.bandwidth() / 2 + 4)
//       .attr("text-anchor", "start")
//       .attr("fill", "#000")
//       .style("font-weight", 600)
//       .text(d => `${Math.round(d.value / 1e6).toLocaleString()} triệu VND`);

//     // Title
//     plot.append("text")
//       .attr("x", innerWidth / 2)
//       .attr("y", -30)
//       .attr("text-anchor", "middle")
//       .style("font-size", "18px")
//       .style("font-weight", "700")
//       .text("Doanh số bán hàng theo Nhóm hàng");

//     console.log("[Q2] Vẽ xong.");
//   }).catch(err => {
//     console.error("[Q2] Lỗi load CSV:", err);
//   });
// })();

(function () {
  const csvPath = "data/Data.csv";
  const containerId = "#chart2";

  function parseMoney(v) {
    if (!v) return 0;
    return Number(String(v).replace(/[^\d\.\-]/g, "")) || 0;
  }

  d3.dsv(";", csvPath).then(rawData => {
    const data = rawData.map(d => ({
      groupName: `[${d.MaNhomHang}] ${d.TenNhomHang}`,
      value: parseMoney(d.ThanhTien),
      quantity: parseMoney(d.SL)
    }));

    const grouped = d3.rollups(
      data,
      v => ({
        totalValue: d3.sum(v, d => d.value),
        totalQuantity: d3.sum(v, d => d.quantity)
      }),
      d => d.groupName
    );

    const flat = grouped.map(([groupName, stats]) => ({
      groupName,
      value: stats.totalValue,
      quantity: stats.totalQuantity
    })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

    const margin = { top: 50, right: 60, bottom: 40, left: 340 };
    const barHeight = 30;
    const innerWidth = 1000;
    const plotHeight = flat.length * barHeight;
    const svgWidth = margin.left + innerWidth + margin.right;
    const svgHeight = margin.top + plotHeight + margin.bottom;

    const svg = d3.select(containerId).append("svg")
      .attr("width", svgWidth)
      .attr("height", svgHeight);

    const plot = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain([0, d3.max(flat, d => d.value)]).nice()
      .range([0, innerWidth]);

    const y = d3.scaleBand()
      .domain(flat.map(d => d.groupName))
      .range([0, plotHeight])
      .padding(0.18);

    const color = d3.scaleOrdinal()
      .domain(flat.map(d => d.groupName))
      .range(d3.schemeTableau10);

    // Trục X + Grid line
    plot.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${plotHeight})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => `${d / 1e6}M`))
      .call(g => g.selectAll(".tick line")
        .attr("y1", -plotHeight)
        .attr("stroke", "#ccc")
        .attr("stroke-dasharray", "2,2")
      );

    // Trục Y
    plot.append("g")
      .call(d3.axisLeft(y).tickSize(0))
      .selectAll("text").style("font-size", "12px");

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .attr("id", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "#fff")
      .style("border", "1px solid #ccc")
      .style("padding", "6px")
      .style("font-size", "12px")
      .style("border-radius", "4px")
      .style("box-shadow", "0 2px 6px rgba(0,0,0,0.2)");

    // Bars
    plot.selectAll(".bar")
      .data(flat)
      .join("rect")
      .attr("class", "bar")
      .attr("x", 0)
      .attr("y", d => y(d.groupName))
      .attr("height", y.bandwidth())
      .attr("width", d => x(d.value))
      .attr("fill", d => color(d.groupName))
      .on("mouseover", (event, d) => {
        tooltip.style("visibility", "visible")
          .html(`
            <strong>Nhóm hàng:</strong> ${d.groupName}<br/>
            <strong>Doanh số bán:</strong> ${Math.round(d.value / 1e6).toLocaleString()} triệu VND<br/>
            <strong>Số lượng bán:</strong> ${d.quantity.toLocaleString()} SKUs
          `);
      })
      .on("mousemove", event => {
        tooltip.style("top", (event.pageY - 10) + "px")
               .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

    // Data labels
    plot.selectAll(".barlabel")
      .data(flat)
      .join("text")
      .attr("class", "barlabel")
      .attr("x", d => x(d.value) + 8)
      .attr("y", d => y(d.groupName) + y.bandwidth() / 2 + 4)
      .attr("text-anchor", "start")
      .attr("fill", "#000")
      .style("font-weight", 600)
      .text(d => `${Math.round(d.value / 1e6).toLocaleString()} triệu VND`);

    // Title
    plot.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", -30)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "700")
      .text("Doanh số bán hàng theo Nhóm hàng");

    console.log("[Q2] Vẽ xong.");
  }).catch(err => {
    console.error("[Q2] Lỗi load CSV:", err);
  });
})();