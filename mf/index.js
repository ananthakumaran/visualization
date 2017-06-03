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
  shuffle
} from 'underscore';

all.forEach((portfolio) => {
  portfolio.date = moment(portfolio.date, 'MMM-YYYY');
});

const tickers = unique(flatten(map(all, (month) => {
  return pluck(month.values, 1);
})));

const data = sortBy(all.map((portfolio) => {
  let values = {date: portfolio.date};
  tickers.forEach((ticker) => {
    const item = find(portfolio.values, (value) => value[1] === ticker);
    if (item) {
      let rs = parseFloat(item[4].replace(/ /, '').replace(/,/, ''));
      values[ticker] = rs;
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

let width = Math.max(Math.max(document.documentElement.clientWidth, window.innerWidth || 0), 1300) - 20;
let height = Math.max(Math.max(document.documentElement.clientHeight, window.innerHeight || 0), 700) - 20;

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
    .curve(d3.curveBasis);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

svg.selectAll("path")
  .data(series)
  .enter().append("path")
  .attr("d", area)
  .style("fill", function(d, i) { return color(tickerVolume[d.key]); });


svg.selectAll("path")
  .data(series)
  .enter().append("path")
  .attr("d", area)
  .style("fill", function(d, i) { return color(tickerVolume[d.key]); });

