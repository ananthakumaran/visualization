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
  schemeOrRd
} from 'd3-scale-chromatic';
import india from './data/india.json';
import indiaStates from './data/india.states.json';
import population from './data/population.json';
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

function density(data) {
  if (!data || !data.total || !data.Area) {
    return 0;
  }
  return (data.total / data.Area).toFixed(2);
}
let districtPopulation = [];
each(population, (d) => {
  const code = parseInt(d.District.replace(/[^0-9]/g, ''), 10);
  d['District'] = code;
  d['total'] = parseInt(d["Total Population Person"], 10);
  d['Area'] = parseInt(d.Area, 10);
  districtPopulation[code] = d;
});

let path = geoPath().projection(geoMercator().fitSize([1000, 1000], districts));
let normalized = map(districts.features, (d) => {
  let data = districtPopulation[d.properties.censuscode];
  return density(data);
});

function title(properties) {
  let data = districtPopulation[properties.censuscode] || {};
  let den = density(data) ? density(data) + " km²" : "Data Not Available";
  let ar = data.Area ? data.Area + " km²" : "Data Not Available";
  return `Density: ${den}\nTotal: ${data.total || "Data Not Available"}\nArea: ${ar}\nDistrict: ${properties.DISTRICT}\nState: ${properties.ST_NM}`;
}

let r = scaleSqrt()
    .domain(extent(map(normalized, x => x/Math.PI)))
    .range([0, height/12]);

let svg = select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

svg.append("g")
  .attr("class", "districts")
  .selectAll("circle")
  .data(districts.features)
  .enter().append("circle")
  .attr("transform", d => `translate(${geoPath().projection(projection).centroid(d)})`)
  .attr("r", (d, i) => r(normalized[i]/Math.PI))
  .attr("fill", "transparent")
  .style("stroke", (d, i) => '#3182bd')
  .style("stroke-opacity", 0.5)
  .on("mouseenter", function () { select(this).style('stroke-opacity', 1); })
  .on("mouseleave", function () { select(this).style('stroke-opacity', 0.5); })
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
  .attr("stroke-opacity", 0.1)
  .style("fill", 'none');
