import * as d3 from 'd3';
import all from './data/all.json';
import moment from 'moment';
import {
  unique,
  map,
  pluck,
  flatten,
  find,
  sortBy,
  reduce,
  shuffle,
  clone,
  any
} from 'underscore';

all.forEach((portfolio) => {
  portfolio.date = moment(portfolio.date, 'MMM-YYYY');
});

const tickers = unique(flatten(map(all, (month) => {
  return pluck(month.values, 1);
})));

const tickerLabel = {};
const data = sortBy(all.map((portfolio) => {
  let values = {date: portfolio.date};
  tickers.forEach((ticker) => {
    const item = find(portfolio.values, (value) => value[1] === ticker);
    if (item) {
      let rs = parseFloat(item[4].replace(/ /, '').replace(/,/, ''));
      values[ticker] = rs;
      tickerLabel[ticker] = item[0].replace(/ltd|corp|inc|[*.]|\(.*$/ig, '').trim();
    } else {
      values[ticker] = 0;
    }
  });
  return values;
}), 'date');

function sum(list) {
  return reduce(list, (acc, v) => v + acc, 0);
}

const tickerVolume = {};
tickers.forEach((ticker) => {
  tickerVolume[ticker] = sum(pluck(data, ticker));
});


var stack = d3.stack()
    .keys(shuffle(tickers))
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetWiggle);

var series = stack(data);

let width = Math.max(Math.max(document.documentElement.clientWidth, window.innerWidth || 0), 1200);
let height = Math.max(Math.max(document.documentElement.clientHeight, window.innerHeight || 0), 700);

var x = d3.scaleTime()
    .domain(d3.extent(data, function(d){ return d.date; }))
    .range([0, width]);


function stackMax(layer) {
  return d3.max(layer, function(d) { return d[1]; });
}

function stackMin(layer) {
  return d3.min(layer, function(d) { return d[0]; });
}

var y = d3.scaleLinear()
    .domain([d3.min(series, stackMin), d3.max(series, stackMax)])
    .range([height, 0]);

var color = d3.scaleSequential(d3.interpolateCool)
    .domain([0, d3.max(Object.values(tickerVolume))]);

var area = d3.area()
    .x(function(d) { return x(d.data.date); })
    .y0(function(d) { return y(d[0]); })
    .y1(function(d) { return y(d[1]); })
    .curve(d3.curveMonotoneX);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var paths = svg.selectAll("path")
    .data(series)
    .enter();

paths.append("path")
  .attr("d", area)
  .style("fill", function(d, i) { return color(tickerVolume[d.key]); })
  .append('title')
  .text((d) => tickerLabel[d.key]);


function canPlace(point, polygon, ticker) {
  const fontHeight = 14;
  const fontWidth = 6;
  const length = tickerLabel[ticker].length * fontWidth;
  const textBox = [
    [point[0] - (length/2), point[1] - (fontHeight/2)],
    [point[0] + (length/2), point[1] - (fontHeight/2)],
    [point[0] + (length/2), point[1] + (fontHeight/2)],
    [point[0] - (length/2), point[1] + (fontHeight/2)],
  ];
  if (any(textBox, (p) => !d3.polygonContains(polygon, p))) {
    return false;
  }
  return true;
}

function centroid(d) {
  var polygon = [];
  var heights = [];
  d.forEach((datum) => {
    heights.push(y(datum[0]) - y(datum[1]));
    polygon.push([x(datum.data.date), y(datum[0])]);
  });
  clone(d).reverse().forEach((datum) => {
    polygon.push([x(datum.data.date), y(datum[1])]);
  });

  const center = d3.polygonCentroid(polygon);
  if (canPlace(center, polygon, d.key)) {
    return center;
  }
  for (let datum of d) {
    let y1 = y(datum[1]);
    let y0 = y(datum[0]);
    let point = [x(datum.data.date), y0 - ((y0 - y1) / 2)];
    if (canPlace(point, polygon, d.key)) {
      return point;
    }
  }
  return [-1000, -1000];
}

paths.append("text")
  .attr('x', (d) => centroid(d)[0])
  .attr('y', (d) => centroid(d)[1])
  .attr("dy", "0.32em")
  .style('fill', 'white')
  .style('font-size', '12px')
  .style('text-anchor', 'middle')
  .style('font-family', 'sans-serif')
  .text((d) => tickerLabel[d.key]);
