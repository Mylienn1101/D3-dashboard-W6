(function () {
  const csvPath = "data/Data.csv";
  const containerId = "#chart12";

  d3.dsv(";", csvPath).then(data => {
    data.forEach(d => {
      d.ThanhTien = +d.ThanhTien;
    });

    const chiTieuKhachHang = d3.rollup(
      data,
      v => d3.sum(v, d => d.ThanhTien),
      d => d.MaKhachHang
    );

    const chiTieuArray = Array.from(chiTieuKhachHang, ([khachHang, tongTien]) => ({
      khachHang,
      tongTien
    }));

    const maxValue = d3.max(chiTieuArray, d => d.tongTien);
    const thresholds = d3.range(0, maxValue + 50000, 50000);
    thresholds[0] = 0;

    const bins = d3.bin()
      .domain([0, maxValue])
      .thresholds(thresholds)
      (chiTieuArray.map(d => d.tongTien));

    const margin = { top: 40, right: 20, bottom: 60, left: 60 };
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
      .text("Phân phối Mức chi trả của Khách hàng");

    const x = d3.scaleLinear()
      .domain([0, maxValue])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, 1600])
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

    const tickValues = d3.range(0, maxValue + 50000, 50000);

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .tickValues(tickValues)
        .tickFormat(d => `${d / 1000}K`)
      )
      .selectAll("text")
      .style("font-size", "10px")
      .attr("transform", "rotate(-90)")
      .style("text-anchor", "end");

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .style("font-size", "10px");

    svg.selectAll("rect")
      .data(bins)
      .enter().append("rect")
      .attr("x", d => x(d.x0) + 2) // thêm khoảng cách giữa các cột
      .attr("y", d => y(d.length))
      .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 4)) // khoảng cách giữa các cột
      .attr("height", d => height - y(d.length))
      .attr("fill", "steelblue")
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 0.7);
        tooltip.transition().duration(100).style("opacity", 1);
        tooltip.html(`
          <div style="font-weight:700">Đã chi tiêu Từ ${d.x0.toLocaleString()} đến ${d.x1.toLocaleString()}</div>
          <div>Số lượng KH: ${d.length.toLocaleString()}</div>
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