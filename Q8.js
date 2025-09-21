(function () {
  const csvPath = "data/Data.csv";
  const containerId = "#chart8";
  const parseDateTime = d3.timeParse("%d/%m/%Y %H:%M");

  d3.dsv(";", csvPath).then(rawData => {
    const records = rawData.map(d => {
      const dt = parseDateTime(d.ThoiGianTaoDon);
      if (!dt) return null;
      const month = dt.getMonth() + 1;
      const monthLabel = `T${String(month).padStart(2, "0")}`;
      const groupLabel = `[${d.MaNhomHang}] ${d.TenNhomHang}`;
      return {
        orderId: d.MaDonHang,
        monthLabel,
        groupLabel
      };
    }).filter(d => d);

    const totalOrdersPerMonth = d3.rollups(
      d3.group(records, d => `${d.orderId}-${d.monthLabel}`),
      v => v.length,
      d => d[0].split("-")[1]
    );
    const totalMap = new Map(totalOrdersPerMonth);

    const uniqueOrderGroup = Array.from(
      d3.group(records, d => `${d.orderId}-${d.monthLabel}-${d.groupLabel}`),
      ([key, v]) => v[0]
    );

    const groupMonthCounts = d3.rollups(
      uniqueOrderGroup,
      v => v.length,
      d => d.monthLabel,
      d => d.groupLabel
    );

    const seriesMap = new Map();
    groupMonthCounts.forEach(([month, groups]) => {
      const total = totalMap.get(month) || 1;
      groups.forEach(([label, count]) => {
        if (!seriesMap.has(label)) seriesMap.set(label, []);
        seriesMap.get(label).push({
          month,
          probability: count / total,
          count
        });
      });
    });

    const months = d3.range(1, 13).map(m => `T${String(m).padStart(2, "0")}`);
    const series = Array.from(seriesMap.entries()).map(([label, values]) => {
      const map = new Map(values.map(d => [d.month, d]));
      return {
        label,
        values: months.map(m => ({
          month: m,
          probability: map.has(m) ? map.get(m).probability : 0,
          count: map.has(m) ? map.get(m).count : 0
        }))
      };
    });

    const margin = { top: 60, right: 40, bottom: 100, left: 80 };
    const w = 1000, h = 400;
    const svg = d3.select(containerId).append("svg")
      .attr("width", w + margin.left + margin.right)
      .attr("height", h + margin.top + margin.bottom + 60);

    const plot = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scalePoint()
      .domain(months)
      .range([0, w])
      .padding(0.5);

    const y = d3.scaleLinear()
      .domain([0.2, 0.7])
      .range([h, 0]);

    const color = d3.scaleOrdinal()
      .domain(series.map(d => d.label))
      .range(d3.schemeSet2);

    plot.append("g")
      .attr("transform", `translate(0, ${h})`)
      .call(d3.axisBottom(x)
        .tickFormat(m => `Tháng ${m.slice(1)}`)
      )
      .selectAll("text")
      .style("font-size", "11px");

    plot.append("g")
      .call(d3.axisLeft(y)
        .tickValues(d3.range(0.2, 0.71, 0.1))
        .tickFormat(d => `${Math.round(d * 100)}%`)
      )
      .selectAll("text")
      .style("font-size", "11px");

    plot.append("g")
      .attr("transform", `translate(0, ${h})`)
      .call(d3.axisBottom(x)
        .tickSize(-h)
        .tickFormat("")
      )
      .call(g => g.selectAll(".tick line")
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

    series.forEach(s => {
      const line = d3.line()
        .x(d => x(d.month))
        .y(d => y(d.probability));

      plot.append("path")
        .datum(s.values)
        .attr("fill", "none")
        .attr("stroke", color(s.label))
        .attr("stroke-width", 2)
        .attr("d", line);

      plot.selectAll(`.dot-${s.label}`)
        .data(s.values)
        .join("circle")
        .attr("cx", d => x(d.month))
        .attr("cy", d => y(d.probability))
        .attr("r", 4)
        .attr("fill", color(s.label))
        .on("mouseover", (e, d) => {
          tooltip.style("visibility", "visible")
            .html(`
              <strong>Nhóm hàng:</strong> ${s.label}<br/>
              Tháng: Tháng ${d.month.slice(1)}<br/>
              Số đơn bán: ${d.count.toLocaleString()}<br/>
              Xác suất bán: ${(d.probability * 100).toFixed(1)}%
            `);
        })
        .on("mousemove", e => {
          tooltip.style("top", (e.pageY - 10) + "px")
                 .style("left", (e.pageX + 10) + "px");
        })
        .on("mouseout", () => {
          tooltip.style("visibility", "hidden");
        });
    });

    const legend = svg.append("g")
      .attr("transform", `translate(${margin.left + w / 2}, ${margin.top + h + 40})`);

    const legendItems = series.map(s => s.label);
    const colCount = 3;
    const itemWidth = 250;
    const itemHeight = 20;

    legendItems.forEach((label, i) => {
      const row = Math.floor(i / colCount);
      const col = i % colCount;
      const xPos = (col - 1) * itemWidth;
      const yPos = row * itemHeight;

      const g = legend.append("g")
        .attr("transform", `translate(${xPos}, ${yPos})`);

      g.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", color(label));

      g.append("text")
        .attr("x", 18)
        .attr("y", 10)
        .text(label)
        .style("font-size", "11px");
    });

    plot.append("text")
      .attr("x", w / 2)
      .attr("y", -30)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "700")
      .text("Xác suất bán hàng theo Nhóm hàng");
  });
})();