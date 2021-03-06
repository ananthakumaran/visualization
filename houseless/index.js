import {
  scaleLog,
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
  schemeRdPu
} from 'd3-scale-chromatic';
import india from './data/india.json';
import indiaStates from './data/india.states.json';
import houseless from './data/houseless.json';
import {
  feature,
} from 'topojson-client';

import {
  map,
  each
} from 'underscore';

let height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
let width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

let districts = feature(india, india.objects['-']);
let states = feature(indiaStates, indiaStates.objects['-']);
const b = india.bbox;
const pad = 30;
let projection = geoMercator()
    .fitExtent([[pad, pad], [width - pad, height - pad]], districts);


let districtHouseless = [];
each(houseless, (d) => districtHouseless[parseInt(d.District, 10)] = parseInt(d.TOT_HL_P, 10));

let path = geoPath().projection(geoMercator().fitSize([1000, 1000], districts));
let normalized = map(districts.features, (d) => {
  return districtHouseless[d.properties.censuscode] || 0;
});

function title(properties) {
  return `Count: ${districtHouseless[properties.censuscode] || 'Data Not Available'} \nDistrict: ${properties.DISTRICT}\nState: ${properties.ST_NM}`;
}

let domain = extent(normalized);
let color = scaleThreshold()
    .domain([100, 1000, 2000, 3000, 5000, 10000, 15000, 30000])
    .range(schemeRdPu[9]);

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

let x = scaleSqrt()
    .domain([0, 35000])
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
