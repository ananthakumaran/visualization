import * as d3 from "d3";
import * as _ from "lodash";
import data from "./data.json";

/**
 * @param datum {{
    name: string;
    category: string;
    points: Array<[number, number]>;
}}
 */
function renderDiff(datum) {
  const info = {
    max: d3.max(datum.points, p => p[1]),
    min: d3.min(datum.points, p => p[1]),
    open: datum.points[0][1],
    close: _.last(datum.points)[1]
  };

  info.diff = info.close - info.open;
  if (info.max < 100) {
    return;
  }
  const margin = { top: 30, right: 150, bottom: 30, left: 40 };
  const width = 900;
  const height = 180;

  /**
   * @param array {Array<[number, number]>}
   * @returns {Array<[Date, number]>}
   */
  function diff(array) {
    return array.slice(1).map(function(n, i) {
      const d = array[i][1] == 0 || n[1] == 0 ? 0 : n[1] - array[i][1];
      return [new Date(n[0] * 1000), d];
    });
  }

  const red = d3.schemeSet1[0];
  const green = d3.schemeSet1[2];
  const lightGray = "#ededed";
  const points = diff(datum.points);
  const xrange = [new Date("2020-01-01"), new Date("2020-04-24")];
  const xsize = (xrange[1] - xrange[0]) / (60 * 60 * 24 * 1000);

  const yAxis = g =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .call(
        d3
          .axisLeft(y)
          .ticks(7, ".0f")
          .tickSize(-width + margin.left + margin.right)
      )
      .call(g => g.select(".domain").remove())
      .call(g =>
        g
          .selectAll(".tick line")
          .attr("stroke", lightGray)
          .attr("stroke-opacity", 0.5)
      )
      .call(g =>
        g
          .append("text")
          .attr("x", -margin.left)
          .attr("y", 15)
          .attr("text-anchor", "start")
          .text("AUM in crores - " + datum.name)
      );

  const xAxis = g =>
    g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(10)
          .tickSize(-height + margin.top + margin.bottom)
      )
      .call(g => g.select(".domain").remove())
      .call(g =>
        g
          .selectAll(".tick line")
          .attr("stroke", lightGray)
          .attr("stroke-opacity", 0.5)
      );

  const y = d3
    .scaleLinear()
    .domain(d3.extent(points.map(d => d[1])))
    .nice()
    .range([height - margin.bottom, margin.top]);

  const x = d3
    .scaleTime()
    .domain(xrange)
    .range([margin.left, width - margin.right]);

  const svg = d3
    .select("body")
    .append("svg")
    .attr("height", height)
    .attr("width", width);

  svg.append("g").call(xAxis);
  svg.append("g").call(yAxis);

  var barWidth = ((width - margin.left - margin.right) / xsize) * 0.8;
  svg
    .append("g")
    .selectAll("rect")
    .data(points)
    .join("rect")
    .attr("fill", (d, i) => (d[1] > 0 ? green : red))
    .attr("x", (d, i) => x(d[0]))
    .attr("y", d => y(Math.max(0, d[1])))
    .attr("height", d => Math.abs(y(0) - y(d[1])))
    .attr("width", barWidth);

  const format = d3.format(" > 9.2f");
  svg
    .append("foreignObject")
    .attr("x", width - margin.right + 10)
    .attr("y", 10)
    .attr("height", height)
    .attr("width", margin.right)
    .append("xhtml:table")
    .attr("class", "info-table").html(`
<tr><td>open</td><td class='amount'>${format(info.open)}</td></tr>
<tr><td>close</td><td class='amount'>${format(info.close)}</td></tr>
<tr><td>diff</td><td class='amount' style='color: ${
    info.diff >= 0 ? green : red
  }'>${format(info.diff)}</td></tr>
`);
}

data.forEach(datum => renderDiff(datum));
