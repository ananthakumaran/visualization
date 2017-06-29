import {
  scaleThreshold,
  geoPath,
  select,
  geoMercator,
  extent,
  axisBottom,
  scaleLinear,
  scaleSqrt
} from 'd3';
import {
  schemeReds
} from 'd3-scale-chromatic';
import india from './data/india.json';
import indiaStates from './data/india.states.json';
import jobless from './data/jobless.json';
import population from './data/population.json';
import {
  feature,
} from 'topojson-client';

import {
  map,
  each,
  filter,
  reduce
} from 'underscore';

let height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
let width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

let districts = feature(india, india.objects['-']);
let states = feature(indiaStates, indiaStates.objects['-']);
const b = india.bbox;
const pad = 30;
let projection = geoMercator()
    .fitExtent([[pad, pad], [width - pad, height - pad]], districts);

let districtPopulation = [];
each(population, (d) => {
  const code = parseInt(d.District.replace(/[^0-9]/g, ''), 10);
  d['District'] = code;
  d['total'] = parseInt(d["Total Worker Population Person"], 10);
  d['Area'] = parseInt(d.Area, 10);
  districtPopulation[code] = d;
});


let districtJobless = {};
each(jobless, (d) => {
  d.Total = parseInt(d.Total, 10);
  var code = parseInt(d.District);
  if (districtJobless[code]) {
    districtJobless[code].push(d);
  } else {
    districtJobless[code] = [d];
  }
});

function totalJobless(list) {
  return reduce(list, (result, d) => result + d.Total, 0);
}

function unemploymentRate(seekers, workers) {
  if (!workers || !seekers) {
    return 0;
  }
  return (seekers/(workers + seekers)) * 100;
}

let path = geoPath().projection(geoMercator().fitSize([1000, 1000], districts));
let normalized = map(districts.features, (d) => {
  const total = totalJobless(districtJobless[d.properties.censuscode]);
  const workers = districtPopulation[d.properties.censuscode] && districtPopulation[d.properties.censuscode].total;
  return unemploymentRate(total, workers);
});

function title(properties) {
  const total = totalJobless(districtJobless[properties.censuscode]);
  const population = districtPopulation[properties.censuscode];
  const rate =  unemploymentRate(total, population && population.total);
  const percentage = rate ? rate.toFixed(2) : 'Data Not Available';
  return `Unemployment rate: ${percentage}\nNon-workers seeking work: ${total.toLocaleString()}\nTotal Workers: ${(population && population.total && population.total.toLocaleString()) || 'Data Not Available'}\nDistrict: ${properties.DISTRICT}\nState: ${properties.ST_NM}`;
}

let domain = extent(normalized);
let color = scaleThreshold()
    .domain([4, 6, 8, 10, 12, 20, 25, 40])
    .range(schemeReds[9]);

let svg = select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

svg.append("g")
  .attr("class", "districts")
  .selectAll("path")
  .data(districts.features)
  .enter().append("path")
  .attr("d", geoPath().projection(projection))
  .style("fill", (d, i) => color(normalized[i]))
  .append("title")
  .text((d) => title(d.properties));

svg.append("g")
  .attr("class", "states")
  .selectAll("path")
  .data(states.features)
  .enter().append("path")
  .attr("d", geoPath().projection(projection))
  .attr("stroke", "#000")
  .attr("stroke-width", 0.5)
  .attr("stroke-opacity", 0.2)
  .style("fill", 'none');

let x = scaleLinear()
    .domain([0, 50])
    .rangeRound([0, width]);

let g = svg.append("g")
    .attr("class", "key");

g.selectAll("rect")
  .data(color.range().map(function(d) {
    d = color.invertExtent(d);
    if (d[0] == null) d[0] = x.domain()[0];
    if (d[1] == null) d[1] = x.domain()[1];
    return d;
  }))
  .enter().append("rect")
  .attr("height", 8)
  .attr("x", function(d) { return x(d[0]); })
  .attr("width", function(d) { return x(d[1]) - x(d[0]); })
  .attr("fill", function(d) { return color(d[0]); });

g.call(axisBottom(x)
       .tickSize(13)
       .tickValues(color.domain()))
  .select(".domain")
  .remove();
