// (function () {
//   const csvPath = "data/Data.csv";
//   const containerId = "#chart6";
//   const parseDateTime = d3.timeParse("%d/%m/%Y %H:%M");

//   function parseMoney(v) {
//     return Number(String(v).replace(/[^\d\.\-]/g, "")) || 0;
//   }

//   d3.dsv(";", csvPath).then(rawData => {
//     // Bước 1: gom theo (date, hour)
//     const dailyHourStats = new Map();

//     rawData.forEach(d => {
//       const dt = parseDateTime(d.ThoiGianTaoDon);
//       if (!dt) return;

//       const date = dt.toISOString().split("T")[0];
//       const hour = dt.getHours();
//       const key = `${date}-${hour}`;
//       const value = parseMoney(d.ThanhTien);
//       const quantity = parseMoney(d.SL);

//       if (!dailyHourStats.has(key)) {
//         dailyHourStats.set(key, { date, hour, value: 0, quantity: 0 });
//       }

//       const entry = dailyHourStats.get(key);
//       entry.value += value;
//       entry.quantity += quantity;
//     });

//     // Bước 2: gom theo hour → tính trung bình theo ngày
//     const groupedByHour = d3.group(Array.from(dailyHourStats.values()), d => d.hour);

//     const hours = d3.range(8, 24);
//     const flat = hours.map(h => {
//       const entries = groupedByHour.get(h) || [];

//       const groupedByDate = d3.rollups(
//         entries,
//         v => ({
//           value: d3.sum(v, d => d.value),
//           quantity: d3.sum(v, d => d.quantity)
//         }),
//         d => d.date
//       );

//       const avgValue = d3.mean(groupedByDate, d => d[1].value) || 0;
//       const avgQuantity = d3.mean(groupedByDate, d => d[1].quantity) || 0;

//       return {
//         hour: h,
//         label: `${String(h).padStart(2, "0")}:00-${String(h).padStart(2, "0")}:59`,
//         value: avgValue,
//         quantity: avgQuantity
//       };
//     });

//     // Layout
//     const margin = { top: 60, right: 40, bottom: 100, left: 80 };
//     const w = 1000, h = 400;
//     const svg = d3.select(containerId).append("svg")
//       .attr("width", w + margin.left + margin.right)
//       .attr("height", h + margin.top + margin.bottom);

//     const plot = svg.append("g")
//       .attr("transform", `translate(${margin.left},${margin.top})`);

//     const x = d3.scaleBand()
//       .domain(flat.map(d => d.label))
//       .range([0, w])
//       .padding(0.35);

//     const yMax = Math.ceil(d3.max(flat, d => d.value) / 200_000) * 200_000;
//     const y = d3.scaleLinear().domain([0, yMax]).range([h, 0]);

//     const color = d3.scaleSequential()
//       .domain([0, flat.length - 1])
//       .interpolator(d3.interpolateSpectral);

//     plot.append("g")
//       .attr("transform", `translate(0, ${h})`)
//       .call(d3.axisBottom(x))
//       .selectAll("text")
//       .attr("transform", "rotate(45)")
//       .style("text-anchor", "start")
//       .style("font-size", "11px");

//     plot.append("g")
//       .call(d3.axisLeft(y)
//         .tickValues(d3.range(0, yMax + 1, 200_000))
//         .tickFormat(d => d === 0 ? "0" : `${Math.round(d / 1000)}K`)
//       )
//       .call(g => g.selectAll(".tick line")
//         .attr("x2", w)
//         .attr("stroke", "#ccc")
//         .attr("stroke-dasharray", "2,2")
//       );

//     const tooltip = d3.select("body").append("div")
//       .style("position", "absolute")
//       .style("visibility", "hidden")
//       .style("background", "#fff")
//       .style("border", "1px solid #ccc")
//       .style("padding", "6px")
//       .style("font-size", "12px")
//       .style("border-radius", "4px")
//       .style("box-shadow", "0 2px 6px rgba(0,0,0,0.2)");

//     plot.selectAll(".bar")
//       .data(flat)
//       .join("rect")
//       .attr("x", d => x(d.label))
//       .attr("y", d => y(d.value))
//       .attr("width", x.bandwidth())
//       .attr("height", d => h - y(d.value))
//       .attr("fill", (_, i) => color(i))
//       .on("mouseover", (e, d) => {
//         tooltip.style("visibility", "visible")
//           .html(`
//             <strong>Khung giờ:</strong> ${d.label}<br/>
//             Doanh số bán TB: ${Math.round(d.value).toLocaleString()} VND<br/>
//             Số lượng bán TB: ${Math.round(d.quantity).toLocaleString()} SKUs
//           `);
//       })
//       .on("mousemove", e => {
//         tooltip.style("top", (e.pageY - 10) + "px")
//                .style("left", (e.pageX + 10) + "px");
//       })
//       .on("mouseout", () => {
//         tooltip.style("visibility", "hidden");
//       });

//     plot.selectAll(".barlabel")
//       .data(flat)
//       .join("text")
//       .attr("x", d => x(d.label) + x.bandwidth() / 2)
//       .attr("y", d => y(d.value) - 6)
//       .attr("text-anchor", "middle")
//       .attr("fill", "#000")
//       .style("font-size", "11px")
//       .style("font-weight", 600)
//       .text(d => `${Math.round(d.value).toLocaleString()} VND`);

//     plot.append("text")
//       .attr("x", w / 2)
//       .attr("y", -30)
//       .attr("text-anchor", "middle")
//       .style("font-size", "18px")
//       .style("font-weight", "700")
//       .text("Doanh số bán hàng trung bình theo Khung giờ");
//   });
// })();




(function () {
  const csvPath = "data/Data.csv";
  const containerId = "#chart6";
  const parseDateTime = d3.timeParse("%d/%m/%Y %H:%M");

  function parseMoney(v) {
    return Number(String(v).replace(/[^\d\.\-]/g, "")) || 0;
  }

  d3.dsv(";", csvPath).then(rawData => {
    // Bước 1: gom theo (date, hour)
    const dailyHourStats = new Map();

    rawData.forEach(d => {
      const dt = parseDateTime(d.ThoiGianTaoDon);
      if (!dt) return;

      const date = dt.toISOString().split("T")[0];
      const hour = dt.getHours();
      const key = `${date}-${hour}`;
      const value = parseMoney(d.ThanhTien);
      const quantity = parseMoney(d.SL);

      if (!dailyHourStats.has(key)) {
        dailyHourStats.set(key, { date, hour, value: 0, quantity: 0 });
      }

      const entry = dailyHourStats.get(key);
      entry.value += value;
      entry.quantity += quantity;
    });

    // Bước 2: gom theo hour → tính trung bình theo ngày
    const groupedByHour = d3.group(Array.from(dailyHourStats.values()), d => d.hour);

    const hours = d3.range(8, 24);
    const flat = hours.map(h => {
      const entries = groupedByHour.get(h) || [];

      const groupedByDate = d3.rollups(
        entries,
        v => ({
          value: d3.sum(v, d => d.value),
          quantity: d3.sum(v, d => d.quantity)
        }),
        d => d.date
      );

      const avgValue = d3.mean(groupedByDate, d => d[1].value) || 0;
      const avgQuantity = d3.mean(groupedByDate, d => d[1].quantity) || 0;

      return {
        hour: h,
        label: `${String(h).padStart(2, "0")}:00-${String(h).padStart(2, "0")}:59`,
        value: avgValue,
        quantity: avgQuantity
      };
    });

    // Layout
    const margin = { top: 60, right: 40, bottom: 100, left: 80 };
    const w = 1000, h = 400;
    const svg = d3.select(containerId).append("svg")
      .attr("width", w + margin.left + margin.right)
      .attr("height", h + margin.top + margin.bottom);

    const plot = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(flat.map(d => d.label))
      .range([0, w])
      .padding(0.35);

    const yMax = Math.ceil(d3.max(flat, d => d.value) / 200_000) * 200_000;
    const y = d3.scaleLinear().domain([0, yMax]).range([h, 0]);

    const color = d3.scaleSequential()
      .domain([0, flat.length - 1])
      .interpolator(d3.interpolateSpectral);

    plot.append("g")
      .attr("transform", `translate(0, ${h})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(45)")
      .style("text-anchor", "start")
      .style("font-size", "11px");

    plot.append("g")
      .call(d3.axisLeft(y)
        .tickValues(d3.range(0, yMax + 1, 200_000))
        .tickFormat(d => d === 0 ? "0" : `${Math.round(d / 1000)}K`)
      )
      .call(g => g.selectAll(".tick line")
        .attr("x2", w)
        .attr("stroke", "#ccc")
        .attr("stroke-dasharray", "2,2")
      );

    const tooltip = d3.select("body").append("div")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "#fff")
      .style("border", "1px solid #ccc")
      .style("padding", "6px")
      .style("font-size", "12px")
      .style("border-radius", "4px")
      .style("box-shadow", "0 2px 6px rgba(0,0,0,0.2)");

    plot.selectAll(".bar")
      .data(flat)
      .join("rect")
      .attr("x", d => x(d.label))
      .attr("y", d => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", d => h - y(d.value))
      .attr("fill", (_, i) => color(i))
      .on("mouseover", (e, d) => {
        tooltip.style("visibility", "visible")
          .html(`
            <strong>Khung giờ:</strong> ${d.label}<br/>
            Doanh số bán TB: ${Math.round(d.value).toLocaleString()} VND
          `);
      })
      .on("mousemove", e => {
        tooltip.style("top", (e.pageY - 10) + "px")
               .style("left", (e.pageX + 10) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

    plot.selectAll(".barlabel")
      .data(flat)
      .join("text")
      .attr("x", d => x(d.label) + x.bandwidth() / 2)
      .attr("y", d => y(d.value) - 6)
      .attr("text-anchor", "middle")
      .attr("fill", "#000")
      .style("font-size", "11px")
      .style("font-weight", 600)
      .text(d => `${Math.round(d.value).toLocaleString()} VND`);

    plot.append("text")
      .attr("x", w / 2)
      .attr("y", -30)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "700")
      .text("Doanh số bán hàng trung bình theo Khung giờ");
  });
})();




