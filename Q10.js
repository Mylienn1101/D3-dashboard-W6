(function () {
  const csvPath = "data/Data.csv";
  const containerId = "#chart10";

  const pad2 = n => String(n).padStart(2, "0");
  const monthLabels = Array.from({length:12}, (_,i) => `T${pad2(i+1)}`);
  const parseDate = d3.timeParse("%d/%m/%Y %H:%M");

  d3.dsv(";", csvPath).then(raw => {
    if (!raw || raw.length === 0) {
      console.error("[Q10] Không có dữ liệu hoặc không tìm thấy file:", csvPath);
      return;
    }

    const rows = raw.map(d => {
      let dt = parseDate(d.ThoiGianTaoDon);
      if (!dt) {
        const parts = String(d.ThoiGianTaoDon).split(" ");
        if (parts.length >= 2) {
          const datePart = parts[0];
          const timePart = parts.slice(1).join(" ");
          const p2 = d3.timeParse("%d/%m/%Y %H:%M:%S")(datePart + " " + timePart);
          dt = p2 || null;
        }
      }
      const month = dt ? (dt.getMonth() + 1) : (new Date().getMonth()+1);
      const thangLabel = `T${pad2(month)}`;

      return {
        orderId: d.MaDonHang,
        rawDate: d.ThoiGianTaoDon,
        date: dt,
        thang: thangLabel,
        maNhom: d.MaNhomHang,
        tenNhom: d.TenNhomHang,
        maMat: d.MaMatHang,
        tenMat: d.TenMatHang
      };
    });

    // drop duplicates
    const uniqueMap = new Map();
    rows.forEach(r => {
      const key = `${r.orderId}||${r.thang}||${r.maNhom}||${r.maMat}`;
      if (!uniqueMap.has(key)) uniqueMap.set(key, r);
    });
    const unique = Array.from(uniqueMap.values());

    // group by month + group
    const byMonthGroup = d3.group(unique, d => d.thang, d => d.maNhom);

    const merged = [];
    for (const [thang, mapNhom] of byMonthGroup) {
      for (const [maNhom, items] of mapNhom) {
        const totalOrders = new Set(items.map(d => d.orderId)).size;
        const countsByItem = d3.rollups(items,
          v => new Set(v.map(d => d.orderId)).size,
          d => d.maMat
        );
        for (const [maMat, count] of countsByItem) {
          const rec = items.find(d => d.maMat === maMat);
          const tenMat = rec ? rec.tenMat : maMat;
          const tenNhom = rec ? rec.tenNhom : `[${maNhom}]`;
          merged.push({
            thang,
            maNhom,
            tenNhom,
            maMat,
            tenMat,
            count,
            totalOrders,
            prob: totalOrders > 0 ? count / totalOrders : 0
          });
        }
      }
    }

    const groups = Array.from(d3.group(merged, d => d.maNhom).entries());
    const preferOrder = ["BOT","SET","THO","TMX","TTC"];
    groups.sort((a,b) => {
      const ia = preferOrder.indexOf(a[0]); const ib = preferOrder.indexOf(b[0]);
      if (ia === -1 && ib === -1) return a[0].localeCompare(b[0]);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

    const container = d3.select(containerId);
    if (container.empty()) {
      console.error(`[Q10] Không tìm thấy container ${containerId} trên trang.`);
      return;
    }
    container.selectAll("*").remove();

    container.append("svg").attr("width", "100%").attr("height", 50)
      .append("text")
      .attr("x", "50%").attr("y", 32)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "700")
      .text("Xác suất bán hàng của Mặt hàng theo Nhóm hàng theo Tháng");

    const grid = container.append("div")
      .attr("class", "q10-grid")
      .style("display", "grid")
      .style("grid-template-columns", "repeat(3, 1fr)")
      .style("gap", "18px");

    const tooltip = d3.select("body").append("div")
      .attr("class", "q10-tooltip")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("padding", "8px")
      .style("background", "rgba(0,0,0,0.8)")
      .style("color", "#fff")
      .style("border-radius", "6px")
      .style("font-size", "12px")
      .style("opacity", 0);

    groups.forEach(([maNhom, values]) => {
      const div = grid.append("div")
        .attr("class", "q10-chart")
        .style("background","#fff")
        .style("padding","6px")
        .style("border-radius","6px")
        .style("box-shadow","0 1px 3px rgba(0,0,0,0.06)");

      const groupLabel = `[${maNhom}] ${values[0] ? values[0].tenNhom : ""}`;
      div.append("div")
        .style("font-weight","700")
        .style("color","#0b5cff")
        .style("margin-bottom","6px")
        .text(groupLabel);

      const W = 360, H = 260;
      const margin = {top: 10, right: 10, bottom: 40, left: 60};
      const innerW = W - margin.left - margin.right;
      const innerH = H - margin.top - margin.bottom;

      const svg = div.append("svg").attr("width", W).attr("height", H);
      const plot = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      const itemsMap = d3.group(values, d => d.maMat + "|" + d.tenMat);
      const seriesList = Array.from(itemsMap.entries()).map(([key, recs]) => {
        const [maMat, tenMat] = key.split("|");
        const byMonth = new Map(recs.map(r => [r.thang, r]));
        const arr = monthLabels.map(m => {
          const r = byMonth.get(m);
          return { thang: m, prob: r ? r.prob : 0, count: r ? r.count : 0, maMat, tenMat, maNhom };
        });
        return { maMat, tenMat, data: arr };
      });

      const x = d3.scalePoint().domain(monthLabels).range([0, innerW]).padding(0.5);
      const maxProb = d3.max(seriesList, s => d3.max(s.data, d => d.prob)) || 0.01;
      const y = d3.scaleLinear().domain([0, Math.min(1, maxProb * 1.15)]).range([innerH, 0]);

      const yAxis = d3.axisLeft(y).tickFormat(d3.format(".0%")).ticks(5);
      plot.append("g")
        .call(yAxis)
        .call(g => g.selectAll(".tick line")
          .attr("x2", innerW)
          .attr("stroke-opacity", 0.12)
          .attr("stroke","#000"));

      plot.append("g")
        .attr("transform", `translate(0,${innerH})`)
        .call(d3.axisBottom(x))
        .selectAll("text").style("font-size","10px").attr("transform","rotate(-20)").style("text-anchor","end");

      const color = d3.scaleOrdinal(d3.schemeTableau10).domain(seriesList.map(s => s.maMat));
      const line = d3.line().x(d => x(d.thang)).y(d => y(d.prob)).curve(d3.curveMonotoneX);

      plot.append("g").selectAll("path")
        .data(seriesList)
        .enter()
        .append("path")
        .attr("fill","none")
        .attr("stroke", d => color(d.maMat))
        .attr("stroke-width", 2)
        .attr("d", d => line(d.data));

      const dotsG = plot.append("g");
      seriesList.forEach(s => {
        dotsG.selectAll(`.dot-${s.maMat}`)
          .data(s.data)
          .enter()
          .append("circle")
          .attr("cx", d => x(d.thang))
          .attr("cy", d => y(d.prob))
          .attr("r", 3.5)
          .attr("fill", color(s.maMat))
          .attr("stroke","#fff")
          .style("cursor","pointer")
          .on("mouseover", (event, d) => {
            tooltip.transition().duration(100).style("opacity", 1);
            tooltip.html(`
              <div style="font-weight:700">${d.thang} | Mặt hàng [${d.maMat}] ${d.tenMat}</div>
              <div style="font-size:12px">Nhóm hàng: ${groupLabel} | SL Đơn Bán: ${d.count.toLocaleString()}</div>
              <div style="margin-top:4px">Xác suất Bán / Nhóm hàng: <strong>${(d.prob*100).toFixed(1)}%</strong></div>
            `)
            .style("left", (event.pageX + 12) + "px")
            .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseout", () => tooltip.transition().duration(200).style("opacity", 0));
      });

      const legend = div.append("div").style("margin-top","6px").style("font-size","11px");
      seriesList.forEach(s => {
        const item = legend.append("span").style("display","inline-block").style("margin-right","8px");
        item.append("span")
          .style("display","inline-block")
          .style("width","10px").style("height","10px")
          .style("background", color(s.maMat))
          .style("vertical-align","middle")
          .style("margin-right","4px");
        item.append("span").text(`[${s.maMat}] ${s.tenMat}`);
      });
    });

  }).catch(err => console.error("[Q10] Lỗi load CSV:", err));
})();
