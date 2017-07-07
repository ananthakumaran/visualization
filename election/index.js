import result1977 from './data/1977.json';
import result1980 from './data/1980.json';
import result1984 from './data/1984.json';
import result1989 from './data/1989.json';
import result1991 from './data/1991.json';
import result1996 from './data/1996.json';
import result2001 from './data/2001.json';
import result2006 from './data/2006.json';
import tamilnadu from './data/tamilnadu.json';
import result2map from './data/result2map.json';

import {
  feature,
} from 'topojson-client';

import {
  select,
  stack,
  scaleBand,
  scaleLinear,
  scaleOrdinal,
  line,
  curveMonotoneY,
  curveLinearClosed,
  axisBottom
} from 'd3';

import * as d3 from 'd3';

import * as _ from 'underscore';

function party(d) {
  switch(d.party) {
  case "ADK":
  case "ADMK":
  case "AIADMK":
  case "ADK(JR)":
  case "ADK(JL)":
    return 'ADMK';
  case "DMK":
    return 'DMK';
  case "INC":
  case "INC(I)":
    return 'INC';
  case "BJP":
  case "JP":
    return 'BJP';
  default:
    return 'Others';
  }
  // "ADK", "INC", "CPM", "DMK", "JNP", "CPI", "FBL", "IND", "GKC", "INC(I)", "JNP(JP)", "AKD", "ADK(JL)", "ADK(JR)", "JL)", "PMK", "TMK", "ICS(SCS)", "JD", "ADMK", "TMC(M)", "JP", "BJP", "MADMK", "C(M)", "AIADMK", "MDMK", "CPI(M)", "I(M)", "VCK", "DMDK"
}

const years = [1977, 1980, 1984, 1989, 1991, 1996, 2001, 2006];
const all = [result1977, result1980, result1984, result1989, result1991, result1996, result2001, result2006];
const allByConstituency = _.map(all, r => {
  return _.reduce(r, (a, k) => (a[k.constituency] = k, a), {});
});
const parties = ["ADMK", "DMK", "INC", "BJP", "Others"];
const partyIndex = (p) => parties.indexOf(p);
const data = _.map(all, (d, i) => {
  const grouped = _.groupBy(d, party);
  const result = {};
  result.year = years[i];
  _.each(parties, party => {
    result[party] = (grouped[party] && grouped[party].length) || 0;
  });
  return result;
});
const mapid2contituency = _.reduce(result2map, (a, k) => (a[k.id] = k.constituency, a), {});

const stacked = stack().keys(parties)(data);
const flow = _.map(_.initial(all), (r, i) => {
  const grouped = _.groupBy(r, party);
  let toBase = _.mapObject(_.groupBy(all[i+1], party), d => d.length);
  return _.map(parties, from => {
    let base = 0;
    return _.chain(grouped[from])
      .groupBy(w => {
        return party(allByConstituency[i+1][w.constituency]);
      })
      .pairs()
      .sortBy(d => partyIndex(d[0]))
      .reverse()
      .map(([to, changes]) => {
        const result = {
          fromBase: base,
          toBase: toBase[to] - changes.length,
          from,
          to,
          size: changes.length,
          fromPoint: stacked[partyIndex(from)][i],
          toPoint: stacked[partyIndex(to)][i+1],
          fromYear: years[i],
          toYear: years[i+1]
        };
        base += changes.length;
        toBase[to] -= changes.length;
        return result;
      })
      .value();
  });
});

function title(d) {
  return `Party: ${d.constituency.party}\nConstituency: ${d.properties.AC_NAME}\nWinner: ${d.constituency.winner}`;
}

let height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
let width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
let svg = select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

const legendHeight = 30;
let flowHeight = height * 4/6;
let mapWidth = width / all.length;
let mapHeight = (height * 2/6) - legendHeight;

let mapg = svg.append("g")
    .attr('transform', `translate(0,${legendHeight})`);

let padPercentage = 0.85;
let flowg = svg.append("g")
    .attr('transform', `translate(${(mapWidth/2 - (mapWidth * (1 - padPercentage)))},${mapHeight})`);

var x = scaleBand()
    .rangeRound([0, width - (mapWidth * padPercentage)])
    .paddingInner(padPercentage)
    .domain(years);

let pad = 30;
var y = scaleLinear()
    .domain([0, 234])
    .rangeRound([flowHeight, pad]);
//var color = '#a6cee3,#1f78b4,#b2df8a,#33a02c,#fb9a99'.split(',');
var color = '#4daf4a,#e41a1c,#377eb8,#ff7f00,#984ea3'.split(',');
var z = scaleOrdinal()
    .domain(parties)
    .range(['#2ca25f', '#de2d26', '#3182bd', '#fdae6b', '#636363'])
    .range(color);

flowg.append("g")
  .selectAll("g")
  .data(stacked)
  .enter().append("g")
  .attr("fill", function(d) { return z(d.key); })
  .selectAll("rect")
  .data(function(d) { return d; })
  .enter().append("rect")
  .attr("x", function(d) { return x(d.data.year); })
  .attr("y", function(d) { return y(d[1]); })
  .attr("height", function(d) { return y(d[0]) - y(d[1]); })
  .attr("width", x.bandwidth());


flowg.append("g")
  .selectAll("g")
  .data(stacked)
  .enter().append("g")
  .attr("fill", function(d) { return z(d.key); })
  .selectAll("rect")
  .data(function(d) { return d; })
  .enter().append("rect")
  .attr("x", function(d) { return x(d.data.year); })
  .attr("y", function(d) { return y(d[1]); })
  .attr("height", function(d) { return y(d[0]) - y(d[1]); })
  .attr("width", x.bandwidth());

const l = line().curve(curveLinearClosed);
flowg.append("g")
  .selectAll("g")
  .data(flow)
  .enter().append("g")
  .selectAll("g")
  .data(d => d)
  .enter().append("g")
  .selectAll("path")
  .data(d => d)
  .enter().append("path")
  .attr("d", d => {
    let x0 = x(d.fromYear) + x.bandwidth(),
        x1 = x(d.toYear),
        fy1 = y(d.fromPoint[1] - d.fromBase),
        fy0 = y(d.fromPoint[1] - d.fromBase - d.size),
        ty1 = y(d.toPoint[1] - d.toBase),
        ty0 = y(d.toPoint[1] - d.toBase - d.size);
    return l([
        [x0, fy0],
        [x1, ty0],
        [x1, ty1],
        [x0, fy1]
      ]);
  })
  .attr("fill-opacity", 0.5)
  .attr("fill", function(d) { return z(d.from); });

flowg.append("g")
  .selectAll("g")
  .data(stacked)
  .enter().append("g")
  .selectAll("text")
  .data(function(d) { return d; })
  .enter().append("text")
  .attr("class", "count")
  .style("display", d => d[1] == d[0] ? "none" : null)
  .attr("x", function(d) { return x(d.data.year) + x.bandwidth()/2; })
  .attr("y", function(d) { return y(d[1]) + ((y(d[0]) - y(d[1])) / 2) + 4; })
  .text(d => d[1] - d[0]);

flowg.append("g")
  .selectAll("g")
  .data(flow)
  .enter().append("g")
  .selectAll("g")
  .data(d => d)
  .enter().append("g")
  .selectAll("path")
  .data(d => d)
  .enter().append("text")
  .attr("class", "inflow")
  .attr("display", d => d.size > 9 ? null : "none")
  .attr("dx", -2)
  .attr("x", d => x(d.toYear))
  .attr("y", d => y(d.toPoint[1] - d.toBase - (d.size/2)) + 3)
  .text(d => d.size);

flowg.append("g")
  .attr("class", "axis")
  .attr("transform", `translate(0,${flowHeight})`)
  .call(axisBottom(x));


let constituencies = feature(tamilnadu, tamilnadu.objects['-']);
let mapPad = 3;
let projection = d3.geoMercator()
    .fitExtent([[mapPad, mapPad], [mapWidth - mapPad, mapHeight - mapPad]], constituencies);

mapg.append("g")
  .selectAll("g")
  .data(allByConstituency)
  .enter().append("g")
  .attr("transform", (d, i) => `translate(${i * mapWidth},0)`)
  .selectAll("path")
  .data(data => {
    return constituencies.features.map(f => {
      f = _.clone(f);
      f.constituency = data[mapid2contituency[f.properties.AC_NO]];
      return f;
    });
  })
  .enter().append("path")
  .attr("d", d3.geoPath().projection(projection))
  .attr("fill", d => z(party(d.constituency)))
  .attr("fill-opacity", 0.8)
  .attr("stroke", d => z(party(d.constituency)))
  .attr("stroke-width", "0.5px")
  .append("title")
  .text(title);

let legend = svg.append("g")
    .attr('transform', `translate(350, 5)`)
    .selectAll("g")
    .data(parties)
    .enter()
    .append("g");

const legendWidth = 80;
legend
  .append("rect")
  .attr("x", (d, i) => i * legendWidth)
  .attr("y", 5)
  .attr("fill", d => z(d))
  .attr("height", 15)
  .attr("width", 15);

legend
  .append("text")
  .attr("x", (d, i) => i * legendWidth + 20)
  .attr("y", 17)
  .text(d => d);

