import * as d3 from 'd3';
import moment from 'moment';
import {
  unique,
  map,
  pluck,
  flatten,
  find,
  sortBy,
  reduce,
  clone,
  any,
  identify,
  values
} from 'underscore';

const folders = [
  '2013-05',
  '2013-06',
  '2013-07',
  '2013-08',
  '2013-09',
  '2013-10',
  '2013-11',
  '2013-12',
  '2014-01',
  '2014-02',
  '2014-03',
  '2014-04',
  '2014-05',
  '2014-06',
  '2014-07',
  '2014-08',
  '2014-09',
  '2014-10',
  '2014-11',
  '2014-12',
  '2015-01',
  '2015-02',
  '2015-03',
  '2015-04',
  '2015-05',
  '2015-06',
  '2015-07',
  '2015-08',
  '2015-09',
  '2015-10',
  '2015-11',
  '2015-12',
  '2016-01',
  '2016-02',
  '2016-03',
  '2016-04',
  '2016-05',
  '2016-06',
  '2016-07',
  '2016-08',
  '2016-09',
  '2016-10',
  '2016-11',
  '2016-12',
  '2017-01',
  '2017-02',
  '2017-03',
  '2017-04',
  '2017-05',
  '2017-06'
];


const all = map(folders, folder => require('./data/' + folder + '/nifty50.json'));



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
      tickerLabel[ticker] = item[0].replace(/ltd|corpn?|inc|[*.]|\(.*$/ig, '').trim();
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
  tickerVolume[ticker] = parseInt(sum(pluck(data, ticker)));
});
const tickerVolumeSorted = sortBy(values(tickerVolume), identify).reverse();


var stack = d3.stack()
    .keys(tickers.sort())
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetWiggle);

var series = stack(data);

let width = Math.max(Math.max(document.documentElement.clientWidth, window.innerWidth || 0), 1200);
let height = Math.max(Math.max(document.documentElement.clientHeight, window.innerHeight || 0), 700);

let margin = {
  top: 40,
  left: 0,
  right: 0,
  bottom: 0
};

var x = d3.scaleLinear()
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
    .range([height - margin.top - margin.bottom, 0]);

var color = d3.scaleSequential(d3.interpolateRainbow)
    .domain([0, tickers.length]);

var area = d3.area()
    .x(function(d) { return x(d.data.date); })
    .y0(function(d) { return y(d[0]); })
    .y1(function(d) { return y(d[1]); })
    .curve(d3.curveMonotoneX);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);


var xAxis = d3.axisTop()
    .tickSize(-height)
    .tickValues(data.map(d => d.date))
    .tickFormat(t => moment(t).format('MMM YY'))
    .scale(x);

svg.append('g')
  .attr('class', 'x axis')
  .attr('transform', `translate(${margin.left}, 15)`)
  .call(xAxis);

var paths = svg.selectAll("path")
    .data(series)
    .enter();

paths.append("path")
  .attr('transform', `translate(${margin.left}, ${margin.top})`)
  .attr("d", area)
  .style("fill", function(d, i) { return color(tickerVolumeSorted.indexOf(tickerVolume[d.key])); })
  .append('title')
  .text((d) => tickerLabel[d.key]);


function canPlace(point, polygon, ticker) {
  const fontHeight = 12;
  const fontWidth = 5;
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
  .attr('transform', `translate(${margin.left}, ${margin.top})`)
  .attr('x', (d) => centroid(d)[0])
  .attr('y', (d) => centroid(d)[1])
  .attr("dy", "0.32em")
  .style('fill', 'white')
  .style('font-size', '12px')
  .style('text-anchor', 'middle')
  .style('font-family', 'sans-serif')
  .text((d) => tickerLabel[d.key]);

