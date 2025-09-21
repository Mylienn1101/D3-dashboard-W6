(function () {
  const csvPath = "data/Data.csv";
  const containerId = "#chart7";

  d3.dsv(";", csvPath).then(rawData => {
    const orders = rawData.map(d => ({
      orderId: d["MaDonHang"],
      groupLabel: `[${d["MaNhomHang"]}] ${d["TenNhomHang"]}`
    }));

    const totalOrders = new Set(orders.map(d => d.orderId)).size;

    const uniqueOrderGroup = Array.from(
      d3.group(orders, d => `${d.orderId}-${d.groupLabel}`),
      ([key, v]) => v[0]
    );

    const groupCounts = d3.rollups(
      uniqueOrderGroup,
      v => v.length,
      d => d.groupLabel
    ).map(([label, count]) => ({
      label,
      count,
      probability: count / totalOrders,
      displayProb: count / totalOrders * 100
    }));

    groupCounts.sort((a, b) => b.probability - a.probability);

    const margin = { top: 60, right: 40, bottom: 60, left: 250 };
    const w = 1000, h = 40 * groupCounts.length;
    const svg = d3.select(containerId).append("svg")
      .attr("width", w + margin.left + margin.right)
      .attr("height", h + margin.top + margin.bottom);

    const plot = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const y = d3.scaleBand()
      .domain(groupCounts.map(d => d.label))
      .range([0, h])
      .padding(0.25);

    const x = d3.scaleLinear()
      .domain([0, 1])
      .range([0, w]);

    const color = d3.scaleSequential()
      .domain([0, groupCounts.length - 1])
      .interpolator(d3.interpolateSpectral);

    plot.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("font-size", "11px");

    plot.append("g")
      .attr("transform", `translate(0, ${h})`)
      .call(d3.axisBottom(x)
        .tickValues(d3.range(0, 1.01, 0.1))
        .tickFormat(d => `${Math.round(d * 100)}%`)
      )
      .selectAll("text")
      .style("font-size", "11px");

    // ✅ Grid dọc trục X — đặt đúng vị trí
    plot.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0, ${h})`)
      .call(d3.axisBottom(x)
        .tickValues(d3.range(0, 1.01, 0.1))
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

    plot.selectAll(".bar")
      .data(groupCounts)
      .join("rect")
      .attr("x", 0)
      .attr("y", d => y(d.label))
      .attr("height", y.bandwidth())
      .attr("width", d => x(d.probability))
      .attr("fill", (_, i) => color(i))
      .on("mouseover", (e, d) => {
        tooltip.style("visibility", "visible")
          .html(`
            <strong>Nhóm hàng:</strong> ${d.label}<br/>
            Số đơn bán: ${d.count.toLocaleString()}<br/>
            Xác suất bán: ${d.displayProb.toFixed(1)}%
          `);
      })
      .on("mousemove", e => {
        tooltip.style("top", (e.pageY - 10) + "px")
               .style("left", (e.pageX + 10) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

    // ✅ Data label: làm tròn 1 chữ số, giữ dấu chấm
    plot.selectAll(".barlabel")
      .data(groupCounts)
      .join("text")
      .attr("x", d => x(d.probability) + 6)
      .attr("y", d => y(d.label) + y.bandwidth() / 2 + 4)
      .attr("fill", "#000")
      .style("font-size", "11px")
      .text(d => `${d.displayProb.toFixed(1)}%`);

    plot.append("text")
      .attr("x", w / 2)
      .attr("y", -30)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "700")
      .text("Xác suất bán hàng theo Nhóm hàng");
  });
})();