(function () {
  const csvPath = "data/Data.csv";
  const containerId = "#chart5";

  const parseDateTime = d3.timeParse("%d/%m/%Y %H:%M");

  function parseMoney(v) {
    if (!v) return 0;
    return Number(String(v).replace(/[^\d\.\-]/g, "")) || 0;
  }

  d3.dsv(";", csvPath).then(rawData => {
    // Bước 1: gom theo ngày và tháng
    const dayMonthMap = new Map();

    rawData.forEach(d => {
      const dateObj = parseDateTime(d.ThoiGianTaoDon);
      if (!dateObj) return;

      const day = dateObj.getDate();
      const month = dateObj.getMonth() + 1;
      const key = `${day}-${month}`;

      const value = parseMoney(d.ThanhTien);
      const quantity = parseMoney(d.SL);

      if (!dayMonthMap.has(key)) {
        dayMonthMap.set(key, { day, value: 0, quantity: 0 });
      }

      const entry = dayMonthMap.get(key);
      entry.value += value;
      entry.quantity += quantity;
    });

    // Bước 2: gom trung bình theo ngày
    const dayStats = new Map();

    for (const entry of dayMonthMap.values()) {
      const day = entry.day;
      if (!dayStats.has(day)) {
        dayStats.set(day, []);
      }
      dayStats.get(day).push(entry);
    }

    const flat = Array.from(dayStats.entries())
      .map(([day, entries]) => {
        const totalValue = d3.sum(entries, d => d.value);
        const totalQuantity = d3.sum(entries, d => d.quantity);
        const count = entries.length || 1;
        return {
          day,
          dayLabel: `Ngày ${String(day).padStart(2, "0")}`,
          value: totalValue / count,
          quantity: totalQuantity / count
        };
      })
      .sort((a, b) => a.day - b.day);

    // Layout
    const margin = { top: 60, right: 40, bottom: 100, left: 80 };
    const innerWidth = 1200;
    const innerHeight = 400;
    const svgWidth = margin.left + innerWidth + margin.right;
    const svgHeight = margin.top + innerHeight + margin.bottom;

    const svg = d3.select(containerId).append("svg")
      .attr("width", svgWidth)
      .attr("height", svgHeight);

    const plot = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(flat.map(d => d.dayLabel))
      .range([0, innerWidth])
      .padding(0.2);

    const yMax = Math.ceil(d3.max(flat, d => d.value) / 2_000_000) * 2_000_000;
    const yTicks = d3.range(0, yMax + 1, 2_000_000);

    const y = d3.scaleLinear()
      .domain([0, yMax])
      .range([innerHeight, 0]);

    const color = d3.scaleSequential()
      .domain([0, flat.length - 1])
      .interpolator(d3.interpolateSpectral);

    // Trục X
    plot.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(45)")
      .style("text-anchor", "start")
      .style("font-size", "11px");

    // Trục Y + grid ngang
    plot.append("g")
      .call(d3.axisLeft(y)
        .tickValues(yTicks)
        .tickFormat(d => d === 0 ? "0" : `${d / 1e6}M`)
      )
      .call(g => g.selectAll(".tick line")
        .attr("x2", innerWidth)
        .attr("stroke", "#ccc")
        .attr("stroke-dasharray", "2,2")
      );

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
      .attr("x", d => x(d.dayLabel))
      .attr("y", d => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", d => innerHeight - y(d.value))
      .attr("fill", (_, i) => color(i))
      .on("mouseover", (event, d) => {
        tooltip.style("visibility", "visible")
          .html(`
            <strong>${d.dayLabel}</strong><br/>
            Doanh số bán TB: ${Math.round(d.value).toLocaleString()} VND<br/>
            Số lượng bán TB: ${Math.round(d.quantity).toLocaleString()} SKUs
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
      .attr("x", d => x(d.dayLabel) + x.bandwidth() / 2)
      .attr("y", d => y(d.value) - 6)
      .attr("text-anchor", "middle")
      .attr("fill", "#000")
      .style("font-size", "11px")
      .style("font-weight", 600)
      .text(d => `${(d.value / 1e6).toFixed(1)} tr`);

    // Title
    plot.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", -30)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "700")
      .text("Doanh số bán hàng trung bình theo Ngày trong tháng");

    console.log("[Q5] Vẽ xong.");
  }).catch(err => {
    console.error("[Q5] Lỗi load CSV:", err);
  });
})();