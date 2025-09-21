// (function () {
//   const csvPath = "data/Data.csv";
//   const containerId = "#chart9";

//   d3.dsv(";", csvPath).then(rawData => {
//     const records = rawData.map(d => ({
//       orderId: d.MaDonHang,
//       groupCode: d.MaNhomHang,
//       groupLabel: `[${d.MaNhomHang}] ${d.TenNhomHang}`,
//       itemCode: d.MaMatHang,
//       itemLabel: `[${d.MaMatHang}] ${d.TenMatHang}`
//     }));

//     const uniqueOrders = Array.from(
//       d3.group(records, d => `${d.orderId}-${d.groupCode}-${d.itemCode}`),
//       ([key, v]) => v[0]
//     );

//     const totalByGroup = d3.rollups(
//       uniqueOrders,
//       v => new Set(v.map(d => d.orderId)).size,
//       d => d.groupCode
//     );
//     const totalMap = new Map(totalByGroup);

//     const itemStats = d3.rollups(
//       uniqueOrders,
//       v => new Set(v.map(d => d.orderId)).size,
//       d => d.groupCode,
//       d => d.itemLabel
//     ).flatMap(([groupCode, items]) => {
//       const total = totalMap.get(groupCode) || 1;
//       const groupLabel = records.find(r => r.groupCode === groupCode)?.groupLabel || `[${groupCode}]`;
//       return items.map(([itemLabel, count]) => ({
//         groupCode,
//         groupLabel,
//         itemLabel,
//         count,
//         total,
//         probability: count / total
//       }));
//     });

//     const groups = ['BOT', 'SET', 'THO', 'TMX', 'TTC'];
//     const groupedData = groups.map(code => {
//       return {
//         groupCode: code,
//         groupLabel: records.find(r => r.groupCode === code)?.groupLabel || `[${code}]`,
//         items: itemStats
//           .filter(d => d.groupCode === code)
//           .sort((a, b) => b.probability - a.probability) // ✅ sort cao → thấp
//       };
//     });

//     // Layout
//     const margin = { top: 40, right: 20, bottom: 40, left: 250 };
//     const chartW = 500, chartH = 220;
//     const paddingX = 60, paddingY = 80;
//     const svgW = chartW * 3 + paddingX * 4;
//     const svgH = chartH * 2 + paddingY * 3;

//     const svg = d3.select(containerId).append("svg")
//       .attr("width", svgW)
//       .attr("height", svgH);

//     svg.append("text")
//       .attr("x", svgW / 2)
//       .attr("y", 30)
//       .attr("text-anchor", "middle")
//       .style("font-size", "20px")
//       .style("font-weight", "700")
//       .text("Q9. Xác suất bán hàng của Mặt hàng theo Nhóm hàng");

//     const tooltip = d3.select("body").append("div")
//       .style("position", "absolute")
//       .style("visibility", "hidden")
//       .style("background", "#fff")
//       .style("border", "1px solid #ccc")
//       .style("padding", "6px")
//       .style("font-size", "12px")
//       .style("border-radius", "4px")
//       .style("box-shadow", "0 2px 6px rgba(0,0,0,0.2)");

//     groupedData.forEach((group, idx) => {
//       const row = Math.floor(idx / 3);
//       const col = idx % 3;
//       const xOffset = col * (chartW + paddingX) + paddingX;
//       const yOffset = row * (chartH + paddingY) + 60;

//       const g = svg.append("g")
//         .attr("transform", `translate(${xOffset},${yOffset})`);

//       g.append("rect")
//         .attr("x", -20)
//         .attr("y", -20)
//         .attr("width", chartW + 40)
//         .attr("height", chartH + 40)
//         .attr("fill", "none")
//         .attr("stroke", "#999")
//         .attr("stroke-width", 1);

//       const data = group.items;
//       const xMax = Math.ceil(d3.max(data, d => d.probability) * 100 / 10) * 10;
//       const x = d3.scaleLinear().domain([0, xMax / 100]).range([0, chartW]);
//       const y = d3.scaleBand().domain(data.map(d => d.itemLabel)).range([0, chartH]).padding(0.25);
//       const color = d3.scaleOrdinal().domain(data.map(d => d.itemLabel)).range(d3.schemeSet2);

//       g.append("g")
//         .attr("transform", `translate(0, ${chartH})`)
//         .call(d3.axisBottom(x)
//           .tickValues(d3.range(0, xMax / 100 + 0.01, 0.1))
//           .tickFormat(d => `${Math.round(d * 100)}%`)
//         )
//         .selectAll("text")
//         .style("font-size", "11px");

//       g.append("g")
//         .call(d3.axisLeft(y))
//         .selectAll("text")
//         .style("font-size", "11px");

//       g.append("g")
//         .attr("transform", `translate(0, ${chartH})`)
//         .call(d3.axisBottom(x)
//           .tickSize(-chartH)
//           .tickFormat("")
//         )
//         .call(g => g.selectAll(".tick line")
//           .attr("stroke", "#ccc")
//           .attr("stroke-dasharray", "2,2")
//         );

//       g.selectAll(".bar")
//         .data(data)
//         .join("rect")
//         .attr("x", 0)
//         .attr("y", d => y(d.itemLabel))
//         .attr("height", y.bandwidth())
//         .attr("width", d => x(d.probability))
//         .attr("fill", d => color(d.itemLabel))
//         .on("mouseover", (e, d) => {
//           tooltip.style("visibility", "visible")
//             .html(`
//               <strong>Mặt hàng:</strong> ${d.itemLabel}<br/>
//               Nhóm hàng: ${group.groupLabel}<br/>
//               Số đơn bán: ${d.count.toLocaleString()}<br/>
//               Xác suất bán: ${(d.probability * 100).toFixed(1)}%
//             `);
//         })
//         .on("mousemove", e => {
//           tooltip.style("top", (e.pageY - 10) + "px")
//                  .style("left", (e.pageX + 10) + "px");
//         })
//         .on("mouseout", () => {
//           tooltip.style("visibility", "hidden");
//         });

//       g.selectAll(".barlabel")
//         .data(data)
//         .join("text")
//         .attr("x", d => x(d.probability) + 6)
//         .attr("y", d => y(d.itemLabel) + y.bandwidth() / 2 + 4)
//         .attr("fill", "#000")
//         .style("font-size", "11px")
//         .text(d => `${(d.probability * 100).toFixed(1)}%`);

//       g.append("text")
//         .attr("x", chartW / 2)
//         .attr("y", -10)
//         .attr("text-anchor", "middle")
//         .style("font-size", "13px")
//         .style("font-weight", "bold")
//         .text(group.groupLabel);
//     });
//   });
// })();




// (function () {
//   const csvPath = "data/Data.csv";
//   const containerId = "#chart9";

//   d3.dsv(";", csvPath).then(data => {
//     const grouped = d3.group(data, d => `[${d.MaNhomHang}] ${d.TenNhomHang}`);
//     const totalOrdersByGroup = new Map();

//     grouped.forEach((items, groupName) => {
//       const uniqueOrders = new Set(items.map(d => d.MaDonHang)).size;
//       totalOrdersByGroup.set(groupName, uniqueOrders);
//     });

//     const container = d3.select(containerId)
//       .style("display", "grid")
//       .style("grid-template-columns", "repeat(3, 1fr)")
//       .style("gap", "20px");

//     const tooltip = d3.select("body").append("div")
//       .attr("class", "tooltip")
//       .style("position", "absolute")
//       .style("text-align", "left")
//       .style("padding", "5px")
//       .style("background", "rgba(0, 0, 0, 0.7)")
//       .style("color", "#fff")
//       .style("border-radius", "5px")
//       .style("pointer-events", "none")
//       .style("font-size", "11px")
//       .style("opacity", 0);

//     grouped.forEach((items, groupName) => {
//       const totalOrders = totalOrdersByGroup.get(groupName);
//       const itemCounts = d3.rollups(
//         items,
//         v => new Set(v.map(d => d.MaDonHang)).size,
//         d => `[${d.MaMatHang}] ${d.TenMatHang}`
//       );

//       const processed = itemCounts.map(([label, count]) => ({
//         label,
//         count,
//         probability: count / totalOrders
//       })).sort((a, b) => b.probability - a.probability);

//       const chartDiv = container.append("div").attr("class", "chart");

//       chartDiv.append("h4")
//         .text(groupName)
//         .style("text-align", "center")
//         .style("color", "darkblue")
//         .style("font-size", "17px")
//         .style("font-weight", "bold")
//         .style("margin-bottom", "5px");

//       const svg = chartDiv.append("svg")
//         .attr("width", 500)
//         .attr("height", 350);

//       const margin = { top: 40, right: 20, bottom: 60, left: 150 };
//       const width = 400 - margin.left - margin.right;
//       const height = 250 - margin.top - margin.bottom;

//       const x = d3.scaleLinear()
//         .domain([0, d3.max(processed, d => d.probability)])
//         .range([0, width]);

//       const y = d3.scaleBand()
//         .domain(processed.map(d => d.label))
//         .range([0, height])
//         .padding(0.3);

//       const color = d3.scaleOrdinal(d3.schemeSet2);

//       const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

//       g.append("g")
//         .call(d3.axisLeft(y).tickSize(0))
//         .selectAll("text")
//         .style("font-size", "9px");

//       g.append("g")
//         .attr("transform", `translate(0,${height})`)
//         .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(".0%")));

//       g.selectAll(".bar")
//         .data(processed)
//         .enter()
//         .append("rect")
//         .attr("class", "bar")
//         .attr("x", 0)
//         .attr("y", d => y(d.label))
//         .attr("width", d => x(d.probability))
//         .attr("height", y.bandwidth())
//         .attr("fill", d => color(d.label))
//         .on("mouseover", function (event, d) {
//           d3.select(this).attr("opacity", 0.7);
//           tooltip.transition().duration(200).style("opacity", 1);
//           tooltip.html(`
//             <strong>Mặt hàng:</strong> ${d.label}<br>
//             <strong>Nhóm hàng:</strong> ${groupName}<br>
//             <strong>Số lượng đơn:</strong> ${d.count.toLocaleString()} SKUs<br>
//             <strong>Xác suất:</strong> ${(d.probability * 100).toFixed(1)}%
//           `)
//             .style("left", (event.pageX + 15) + "px")
//             .style("top", (event.pageY - 28) + "px");
//         })
//         .on("mouseout", function () {
//           d3.select(this).attr("opacity", 1);
//           tooltip.transition().duration(300).style("opacity", 0);
//         });

//       g.selectAll(".label")
//         .data(processed)
//         .enter()
//         .append("text")
//         .attr("class", "label")
//         .attr("x", d => x(d.probability) + 5)
//         .attr("y", d => y(d.label) + y.bandwidth() / 2)
//         .attr("dy", "0.35em")
//         .style("font-size", "11px")
//         .text(d => `${(d.probability * 100).toFixed(1)}%`);
//     });
//   });
// })();





(function () {
  const csvPath = "data/Data.csv";
  const containerId = "#chart9";

  d3.dsv(";", csvPath).then(data => {
    const grouped = d3.group(data, d => `[${d.MaNhomHang}] ${d.TenNhomHang}`);
    const totalOrdersByGroup = new Map();

    grouped.forEach((items, groupName) => {
      const uniqueOrders = new Set(items.map(d => d.MaDonHang)).size;
      totalOrdersByGroup.set(groupName, uniqueOrders);
    });

    // Tiêu đề tổng 
    const titleSvg = d3.select(containerId)
      .append("svg")
      .attr("width", 1200)
      .attr("height", 50);

    titleSvg.append("text")
      .attr("x", 600)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .style("font-size", "20px")
      .style("font-weight", "700")
      .style("fill", "black")
      .text("Xác suất bán hàng của Mặt hàng theo Nhóm hàng");

    const container = d3.select(containerId)
      .append("div")
      .style("display", "grid")
      .style("grid-template-columns", "repeat(3, 1fr)")
      .style("gap", "20px");

    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("text-align", "left")
      .style("padding", "5px")
      .style("background", "rgba(0, 0, 0, 0.7)")
      .style("color", "#fff")
      .style("border-radius", "5px")
      .style("pointer-events", "none")
      .style("font-size", "11px")
      .style("opacity", 0);

    grouped.forEach((items, groupName) => {
      const totalOrders = totalOrdersByGroup.get(groupName);
      const itemCounts = d3.rollups(
        items,
        v => new Set(v.map(d => d.MaDonHang)).size,
        d => `[${d.MaMatHang}] ${d.TenMatHang}`
      );

      const processed = itemCounts.map(([label, count]) => ({
        label,
        count,
        probability: count / totalOrders
      })).sort((a, b) => b.probability - a.probability);

      const chartDiv = container.append("div").attr("class", "chart");

      const svg = chartDiv.append("svg")
        .attr("width", 400)
        .attr("height", 350);

      const margin = { top: 50, right: 20, bottom: 60, left: 150 };
      const width = 400 - margin.left - margin.right;
      const height = 250 - margin.top - margin.bottom;

      const x = d3.scaleLinear()
        .domain([0, d3.max(processed, d => d.probability)])
        .range([0, width]);

      const y = d3.scaleBand()
        .domain(processed.map(d => d.label))
        .range([0, height])
        .padding(0.3);

      const color = d3.scaleOrdinal(d3.schemeSet2);

      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      // Tiêu đề từng biểu đồ con
      svg.append("text")
        .attr("x", 200) // 400 / 2
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .style("font-size", "17px")
        .style("font-weight", "bold")
        .style("fill", "darkblue")
        .text(groupName);

      g.append("g")
        .call(d3.axisLeft(y).tickSize(0))
        .selectAll("text")
        .style("font-size", "9px");

      g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(".0%")));

      g.selectAll(".bar")
        .data(processed)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => y(d.label))
        .attr("width", d => x(d.probability))
        .attr("height", y.bandwidth())
        .attr("fill", d => color(d.label))
        .on("mouseover", function (event, d) {
          d3.select(this).attr("opacity", 0.7);
          tooltip.transition().duration(200).style("opacity", 1);
          tooltip.html(`
            <strong>Mặt hàng:</strong> ${d.label}<br>
            <strong>Nhóm hàng:</strong> ${groupName}<br>
            <strong>Số lượng đơn:</strong> ${d.count.toLocaleString()} SKUs<br>
            <strong>Xác suất:</strong> ${(d.probability * 100).toFixed(1)}%
          `)
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
          d3.select(this).attr("opacity", 1);
          tooltip.transition().duration(300).style("opacity", 0);
        });

      g.selectAll(".label")
        .data(processed)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(d.probability) + 5)
        .attr("y", d => y(d.label) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .style("font-size", "11px")
        .text(d => `${(d.probability * 100).toFixed(1)}%`);
    });
  });
})();