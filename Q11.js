(function () {
  const csvPath = "data/Data.csv";
  const containerId = "#chart11";

  d3.dsv(";", csvPath).then(data => {
    const purchaseCounts = d3.rollups(
      data,
      v => new Set(v.map(d => d.MaDonHang)).size,
      d => d.MaKhachHang
    );

    const distribution = d3.rollups(
      purchaseCounts,
      v => v.length,
      d => d[1]
    ).map(([LanMua, SoKhach]) => ({
      LanMua: +LanMua,
      SoKhach: SoKhach
    })).sort((a, b) => a.LanMua - b.LanMua);

    const margin = { top: 40, right: 20, bottom: 50, left: 60 };
    const width = 1200;
    const height = 500;

    const svg = d3.select(containerId)
      .append("svg")
      .attr("width", width)
      .attr("height", height + margin.top + margin.bottom);

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .style("font-size", "20px")
      .style("font-weight", "bold")
      .style("fill", "black")
      .text("Phân phối Lượt mua hàng");

    const x = d3.scaleBand()
      .domain(distribution.map(d => d.LanMua))
      .range([margin.left, width - margin.right])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, 5000])
      .range([height, margin.top]);

    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "rgba(0,0,0,0.8)")
      .style("color", "#fff")
      .style("padding", "8px")
      .style("border-radius", "6px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("font-size", "10px");

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .style("font-size", "10px");

    svg.selectAll(".bar")
      .data(distribution)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.LanMua))
      .attr("y", d => y(d.SoKhach))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.SoKhach))
      .attr("fill", "steelblue")
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 0.7);
        tooltip.transition().duration(100).style("opacity", 1);
        tooltip.html(`
          <div style="font-weight:700">Đã mua ${d.LanMua} lần</div>
          <div>Số lượng KH: ${d.SoKhach.toLocaleString()}</div>
        `)
          .style("left", (event.pageX + 12) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 1);
        tooltip.transition().duration(200).style("opacity", 0);
      });
  });
})();