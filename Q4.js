(function () {
  const csvPath = "data/Data.csv";
  const containerId = "#chart4";

  const parseDateTime = d3.timeParse("%d/%m/%Y %H:%M");
  const formatDate = d => d.toISOString().split("T")[0]; // yyyy-mm-dd

  const weekdayVN = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];
  const weekdayOrder = [...weekdayVN];

  function parseMoney(v) {
    if (!v) return 0;
    return Number(String(v).replace(/[^\d\.\-]/g, "")) || 0;
  }

  d3.dsv(";", csvPath).then(rawData => {
    // Bước 1: gom theo ngày duy nhất
    const dailyMap = new Map();

    rawData.forEach(d => {
      const dateObj = parseDateTime(d.ThoiGianTaoDon);
      if (!dateObj) return;

      const dateStr = formatDate(dateObj);
      const value = parseMoney(d.ThanhTien);
      const quantity = parseMoney(d.SL);

      const weekday = weekdayVN[(dateObj.getDay() + 6) % 7]; // chuyển về chuẩn Việt Nam

      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, {
          value: 0,
          quantity: 0,
          weekday
        });
      }

      const entry = dailyMap.get(dateStr);
      entry.value += value;
      entry.quantity += quantity;
    });

    // Bước 2: gom theo thứ trong tuần
    const weekdayStats = new Map();

    for (const entry of dailyMap.values()) {
      const day = entry.weekday;
      if (!weekdayStats.has(day)) {
        weekdayStats.set(day, []);
      }
      weekdayStats.get(day).push(entry);
    }

    const flat = weekdayOrder.map(day => {
      const entries = weekdayStats.get(day) || [];
      const totalValue = d3.sum(entries, d => d.value);
      const totalQuantity = d3.sum(entries, d => d.quantity);
      const count = entries.length || 1;
      return {
        weekday: day,
        value: totalValue / count,
        quantity: totalQuantity / count
      };
    });

    // Layout
    const margin = { top: 60, right: 40, bottom: 60, left: 80 };
    const innerWidth = 1000;
    const innerHeight = 400;
    const svgWidth = margin.left + innerWidth + margin.right;
    const svgHeight = margin.top + innerHeight + margin.bottom;

    const svg = d3.select(containerId).append("svg")
      .attr("width", svgWidth)
      .attr("height", svgHeight);

    const plot = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(flat.map(d => d.weekday))
      .range([0, innerWidth])
      .padding(0.2);

    const yMax = Math.ceil(d3.max(flat, d => d.value) / 2_000_000) * 2_000_000;
    const yTicks = d3.range(0, yMax + 1, 2_000_000);

    const y = d3.scaleLinear()
      .domain([0, yMax])
      .range([innerHeight, 0]);

    const color = d3.scaleOrdinal()
      .domain(flat.map(d => d.weekday))
      .range(d3.schemePastel1);

    // Trục X
    plot.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("font-size", "12px");

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
      .attr("x", d => x(d.weekday))
      .attr("y", d => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", d => innerHeight - y(d.value))
      .attr("fill", d => color(d.weekday))
      .on("mouseover", (event, d) => {
        tooltip.style("visibility", "visible")
          .html(`
            <strong>${d.weekday}</strong><br/>
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
      .attr("x", d => x(d.weekday) + x.bandwidth() / 2)
      .attr("y", d => y(d.value) - 6)
      .attr("text-anchor", "middle")
      .attr("fill", "#000")
      .style("font-weight", 600)
      .text(d => `${Math.round(d.value).toLocaleString()} VND`);

    // Title
    plot.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", -30)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "700")
      .text("Doanh số bán hàng trung bình theo Ngày trong tuần");

    console.log("[Q4] Vẽ xong.");
  }).catch(err => {
    console.error("[Q4] Lỗi load CSV:", err);
  });
})();