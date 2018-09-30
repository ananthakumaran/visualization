import * as d3 from "d3";
import * as _ from "lodash";
import direct from "./data/direct.json";
import total from "./data/total.json";
import gdp from "./data/gdp.json";
import cost from "./data/cost.json";
import assessees from "./data/assessees.json";
import state from "./data/state.json";
const years = _.map(direct, d => d["Financial Year"]);

const format = (x) => {
  if (x > 100) {
    return Math.round(x).toLocaleString('en-IN');
  } else {
    return x;
  }
};

/** @type {function(HTMLElement, {[key: string]: number | string}[], string[]): any} */
const bars = function (element, data, keys) {
  const margin = {top: 10, right: 10, bottom: 60, left: 80};
  const height = 200;
  const width = element.parentElement.offsetWidth;

  const points = _.map(keys, key => {
    return _.map(data, d => {
      /** @type [string, number] */
      const p = [d.year, d[key]];
      return p;
     });
  });

  const y = d3.scaleLinear()
        .domain([0, d3.max(_.map(points, p => d3.max(_.map(p, d => d[1]))))])
        .rangeRound([height - margin.bottom, margin.top]);

  const x = d3.scalePoint()
        .domain(years)
        .range([margin.left, width - margin.right])
        .padding(0.5);

  const yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .attr("class", "axis")
        .call(d3.axisLeft(y).ticks(7).tickFormat(format).tickSizeInner(-width))
        .call(g => g.selectAll(".domain").remove());

  const xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .attr("class", "axis")
        .call(d3.axisBottom(x).tickSizeOuter(0).tickFormat(x => x.replace(/^20/, '')))
        .call(g => g.selectAll(".domain").remove())
        // .selectAll("text")
        // .style("text-anchor", "end")
        // .attr("dx", "-.8em")
        // .attr("dy", ".15em")
        // .attr("transform", "rotate(-65)")
  ;

  const color = d3.scaleOrdinal()
        .domain(keys)
        .range(d3.schemeSet2);

  const svg = d3.select(element)
        .attr("height", height)
        .attr("width", width);

  var line = d3.line()
      .defined(function(d) { return d[1]; })
      .x(function(d, i) { return x(d[0]); })
      .y(function(d) { return y(d[1]); })
      .curve(d3.curveMonotoneX);

  svg.selectAll('*').remove();

  svg.append("g")
    .call(xAxis);

  svg.append("g")
    .call(yAxis);

  svg.append("g")
    .selectAll("path")
    .data(points)
    .enter()
    .append("path")
    .attr("fill", "none")
    .attr("stroke", (d, i) => color(keys[i]))
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("stroke-width", 1.5)
    .attr("d", line);

  const enter = svg.append("g")
    .selectAll("g")
    .data(points)
    .enter()
    .append('g')
    .attr("fill", (d, i) => color(keys[i]))
    .selectAll('circle')
    .data(p => p)
        .enter();

  enter.append("circle")
    .attr("r", d => d[1] ? 1.5 : 0)
    .attr("cx", d => x(d[0]))
    .attr("cy", d => d[1] && y(d[1]));

  enter.append("circle")
    .attr("fill", "transparent")
    .attr("r", d => d[1] ? 10 : 0)
    .attr("cx", d => x(d[0]))
    .attr("cy", d => d[1] && y(d[1]))
    .append("title")
    .text(d => format(d[1]));


  const g = svg.append("g")
        .selectAll("g")
        .data(keys)
        .enter().append("g")
        .attr("transform", (d, i) => `translate(${margin.left + 15},${(i * 25) + margin.top})`);

  g.append("rect")
    .attr("width", 19)
    .attr("height", 3)
    .attr("fill", color);

  g.append("text")
    .attr("x", 24)
    .attr("y", 0)
    .attr("dy", "0.35em")
    .text(d => d);
};




bars(document.getElementById('total'), _.map(total, d => ({
  year: d["Financial Year"],
  direct: d["Direct Taxes"],
  indirect: d["Indirect Taxes"],
  total: d["Total Taxes"]
})), ['direct', 'indirect', 'total']);

bars(document.getElementById('direct'), _.map(direct, d => ({
  year: d["Financial Year"],
  corporate: d["Corporate Tax"],
  personal: d["Personal Income Tax"],
  other: d["Other Direct Tax"],
  total: d.Total
})), ['corporate', 'personal', 'other']);

bars(document.getElementById('rate'), _.map(gdp, d => ({
  year: d["Financial year"],
  gdp: parseFloat(d["GDP Growth Rate"].replace(/%/, '')),
  tax: parseFloat(d["Tax Growth Rate"].replace(/%/, ''))
})), ['gdp', 'tax']);

bars(document.getElementById('buoyancy'), _.map(gdp, d => ({
  year: d["Financial year"],
  buoyancy: d["Buoyancy Factor"]
})), ['buoyancy']);

const currentGDP = _.map(gdp, d => d["GDP Current Market Price"]);
bars(document.getElementById('total-ratio'), _.map(total, (d, i) => ({
  year: d["Financial Year"],
  direct: (d["Direct Taxes"] / currentGDP[i]) * 100,
  indirect: (d["Indirect Taxes"] / currentGDP[i]) * 100,
  total: (d["Total Taxes"] / currentGDP[i]) * 100
})), ['total', 'direct', 'indirect']);


bars(document.getElementById('expenditure'), _.map(cost, d => ({
  year: d["Financial Year"],
  expenditure: d["Total Expenditure"]
})), ['expenditure']);

bars(document.getElementById('cost-ratio'), _.map(cost, d => ({
  year: d["Financial Year"],
  ratio: parseFloat(d["Cost of Collection"].replace(/%/, ''))
})), ['ratio']);


const categories = _.map(assessees, a => a["PAN Category"]);

const x = ['Association of Person', 'Body of Individuals', 'Company', 'Firm', 'Government', 'Hindu Undivided Family', 'Artificial Juridical Person', 'Local Authority', 'Individual', 'Trust', 'Total'];

const assessesData = _.map(years, y => {
  return _.merge({
    year: y
  }, _.chain(categories)
                 .map(c => {
                   let value = _.find(assessees, a => a["PAN Category"] == c)[y];
                   if (_.isString(value)) {
                     value = parseInt(value.replace(/,/g, ''), 10);
                   }
                   return [c, value];
                 })
                 .fromPairs()
                 .value());
});

bars(document.getElementById('assesses-total'), assessesData, ['Total', 'Individual']);
bars(document.getElementById('assesses-1'), assessesData, ['Hindu Undivided Family', 'Company', 'Firm', 'Trust', 'Association of Person']);
bars(document.getElementById('assesses-2'), assessesData, ['Body of Individuals', 'Government', 'Artificial Juridical Person', 'Local Authority']);


const name = _.map(state, a => a.Name);
const stateData = _.map(years, y => {
  return _.merge({
    year: y
  }, _.chain(name)
                 .map(c => {
                   let value = _.find(state, a => a.Name == c)[y];
                   if (_.isString(value)) {
                     value = parseInt(value.replace(/,/g, ''), 10);
                   }
                   return [c, value];
                 })
                 .fromPairs()
                 .value());
});

const ordered = _.chain(_.last(stateData))
      .omit(['year'])
      .toPairs()
      .sortBy(a => a[1])
      .map(a => a[0])
      .reverse()
      .chunk(4)
      .value();

_.each(ordered, (list, i) => {
  if (i == 0) {
    bars(document.getElementById(`states-0`), stateData, _.take(list, 1));
    bars(document.getElementById(`states-${i + 1}`), stateData, _.drop(list, 1));
  } else {
    bars(document.getElementById(`states-${i + 1}`), stateData, list);
  }
});
