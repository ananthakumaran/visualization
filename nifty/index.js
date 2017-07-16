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
  values,
  filter,
  shuffle
} from 'underscore';

function sum(list) {
  return reduce(list, (acc, v) => v + acc, 0);
}

function getScrollbarWidth() {
  var outer = document.createElement("div");
  outer.style.visibility = "hidden";
  outer.style.width = "100px";
  outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps

  document.body.appendChild(outer);

  var widthNoScroll = outer.offsetWidth;
  // force scrollbars
  outer.style.overflow = "scroll";

  // add innerdiv
  var inner = document.createElement("div");
  inner.style.width = "100%";
  outer.appendChild(inner);

  var widthWithScroll = inner.offsetWidth;

  // remove divs
  outer.parentNode.removeChild(outer);

  return widthNoScroll - widthWithScroll;
}

function render(data, symbols, symbolLabel, label, stream) {
  const symbolVolume = {};
  symbols.forEach((ticker) => {
    symbolVolume[ticker] = parseInt(sum(pluck(data, ticker)));
  });
  const symbolVolumeSorted = sortBy(values(symbolVolume), identify).reverse();

  var stack = d3.stack()
      .keys(symbols.sort())
      .order(d3.stackOrderNone);
  if (stream) {
    stack.offset(d3.stackOffsetWiggle);
  }

  var series = stack(data);

  let width = Math.max(Math.max(document.documentElement.clientWidth, window.innerWidth || 0) - getScrollbarWidth(), 1200);
  let height = Math.max(Math.max(document.documentElement.clientHeight, window.innerHeight || 0), 700);

  let margin = {
    top: 60,
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
      .domain([0, symbols.length]);

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
    .tickFormat((t, i) => i%2 == 0 ? moment(t).format('MMM YY') : '')
    .scale(x);

  svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(${margin.left}, 15)`)
    .call(xAxis);

  svg.append('text')
    .attr('transform', 'translate(10, 40)')
    .attr('class', 'main-label')
    .text(label);

  var paths = svg.append('g').selectAll("path")
    .data(series)
    .enter();

  paths.append("path")
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
    .attr("d", area)
    .style("fill", function(d, i) { return color(symbolVolumeSorted.indexOf(symbolVolume[d.key])); })
    .append('title')
    .text((d) => symbolLabel[d.key]);

  function canPlace(point, polygon, ticker, fontHeight, fontWidth) {
    const length = symbolLabel[ticker].length * fontWidth;
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

  const fontSize = [];
  function centroid(d, i) {
    var polygon = [];
    var heights = [];
    let fontHeight = 12;
    let fontWidth = 5;
    d.forEach((datum) => {
      heights.push(y(datum[0]) - y(datum[1]));
      polygon.push([x(datum.data.date), y(datum[0])]);
    });
    clone(d).reverse().forEach((datum) => {
      polygon.push([x(datum.data.date), y(datum[1])]);
    });

    const center = d3.polygonCentroid(polygon);
    if (canPlace(center, polygon, d.key, fontHeight, fontWidth)) {
      fontSize[i] = fontHeight;
      return center;
    }
    for (let [fontHeight, fontWeight] of [[12, 5], [10, 4], [8, 3], [6, 2.5]]) {
      for (let datum of shuffle(d)) {
        let y1 = y(datum[1]);
        let y0 = y(datum[0]);
        let point = [x(datum.data.date), y0 - ((y0 - y1) / 2)];
        if (canPlace(point, polygon, d.key, fontHeight, fontWidth)) {
          fontSize[i] = fontHeight;
          return point;
        }
      }
    }
    return [-1000, -1000];
  }

  paths.append("text")
    .attr('transform', (d, i) => {
      const c = centroid(d, i);
      return `translate(${margin.left + c[0]}, ${margin.top + c[1]})`;
    })
    .attr("dy", "0.32em")
    .style('fill', 'white')
    .style('font-size', (d, i) => fontSize[i] + 'px')
    .style('text-anchor', 'middle')
    .style('font-family', 'sans-serif')
    .text((d) => symbolLabel[d.key]);

}

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


function renderWeight(all, label) {
  all.forEach((portfolio) => {
    portfolio.date = moment(portfolio.date, 'MMM-YYYY');
  });

  const symbols = unique(flatten(map(all, (month) => {
    return pluck(month, 'Symbol');
  })));

  const symbolLabel = {};
  const data = sortBy(all.map((month, i) => {
    const date = moment(folders[i], 'YYYY-MM');
    let values = {date: date};
    symbols.forEach((symbol) => {
      const item = find(month, (value) => value.Symbol === symbol);
      if (item) {
        let rs = parseFloat(item['Weightage(%)'].replace(/ /, '').replace(/,/, ''));
        values[symbol] = rs;
        symbolLabel[symbol] = item['Security Name'].replace(/ltd|corpn?|inc|[*.]|\(.*$/ig, '').trim();
      } else {
        values[symbol] = 0;
      }
    });
    return values;
  }), 'date');

  render(data, symbols, symbolLabel, label);
}

function renderMarketCap(all, label) {
  all.forEach((portfolio) => {
    portfolio.date = moment(portfolio.date, 'MMM-YYYY');
  });

  const symbols = unique(flatten(map(all, (month) => {
    return pluck(month, 'Symbol');
  })));

  const symbolLabel = {};
  const data = sortBy(all.map((month, i) => {
    const date = moment(folders[i], 'YYYY-MM');
    let values = {date: date};
    symbols.forEach((symbol) => {
      const item = find(month, (value) => value.Symbol === symbol);
      if (item) {
        let rs = parseFloat(item['Index Mcap (Rs. Crores)'].replace(/ /, '').replace(/,/, ''));
        values[symbol] = rs;
        symbolLabel[symbol] = item['Security Name'].replace(/ltd|corpn?|inc|[*.]|\(.*$/ig, '').trim();
      } else {
        values[symbol] = 0;
      }
    });
    return values;
  }), 'date');

  render(data, symbols, symbolLabel, label,true);
}

function renderSectorCap(all, label) {
  all.forEach((portfolio) => {
    portfolio.date = moment(portfolio.date, 'MMM-YYYY');
  });

  const symbols = unique(flatten(map(all, (month) => {
    return pluck(month, 'Industry');
  })));

  const symbolLabel = {};
  const data = sortBy(all.map((month, i) => {
    const date = moment(folders[i], 'YYYY-MM');
    let values = {date: date};
    symbols.forEach((symbol) => {
      symbolLabel[symbol] = symbol.toLowerCase();
      const items = filter(month, (value) => value.Industry === symbol);
      values[symbol] = sum(map(items, (item) => {
        return parseFloat(item['Index Mcap (Rs. Crores)'].replace(/ /, '').replace(/,/, ''));
      }));
    });
    return values;
  }), 'date');

  render(data, symbols, symbolLabel, label,true);
}

function renderSectorWeight(all, label) {
  all.forEach((portfolio) => {
    portfolio.date = moment(portfolio.date, 'MMM-YYYY');
  });

  const symbols = unique(flatten(map(all, (month) => {
    return pluck(month, 'Industry');
  })));

  const symbolLabel = {};
  const data = sortBy(all.map((month, i) => {
    const date = moment(folders[i], 'YYYY-MM');
    let values = {date: date};
    symbols.forEach((symbol) => {
      symbolLabel[symbol] = symbol.toLowerCase();
      const items = filter(month, (value) => value.Industry === symbol);
      values[symbol] = sum(map(items, (item) => {
        return parseFloat(item['Weightage(%)'].replace(/ /, '').replace(/,/, ''));
      }));
    });
    return values;
  }), 'date');

  render(data, symbols, symbolLabel, label);
}

const nifty50 = map(folders, folder => require('./data/' + folder + '/nifty50.json'));
renderMarketCap(nifty50, 'Nifty 50 Market Cap');
renderWeight(nifty50, 'Nifty 50 Weightage (%)');
renderSectorCap(nifty50, 'Nifty 50 Sector Wise Market Cap');
renderSectorWeight(nifty50, 'Nifty 50 Sector Wise Weightage (%)');

const niftynext50 = map(folders, folder => require('./data/' + folder + '/niftynext50.json'));
renderMarketCap(niftynext50, 'Nifty Next 50 Market Cap');
renderWeight(niftynext50, 'Nifty Next 50 Weightage (%)');
renderSectorCap(niftynext50, 'Nifty Next 50 Sector Wise Market Cap');
renderSectorWeight(niftynext50, 'Nifty Next 50 Sector Wise Weightage (%)');

const nifty100 = map(folders, folder => require('./data/' + folder + '/nifty100.json'));
renderMarketCap(nifty100, 'Nifty 100 Market Cap');
renderWeight(nifty100, 'Nifty 100 Weightage (%)');
renderSectorCap(nifty100, 'Nifty 100 Sector Wise Market Cap');
renderSectorWeight(nifty100, 'Nifty 100 Sector Wise Weightage (%)');

const nifty200 = map(folders, folder => require('./data/' + folder + '/nifty200.json'));
renderMarketCap(nifty200, 'Nifty 200 Market Cap');
renderWeight(nifty200, 'Nifty 200 Weightage (%)');
renderSectorCap(nifty200, 'Nifty 200 Sector Wise Market Cap');
renderSectorWeight(nifty200, 'Nifty 200 Sector Wise Weightage (%)');

const nifty500 = map(folders, folder => require('./data/' + folder + '/nifty500.json'));
renderMarketCap(nifty500, 'Nifty 500 Market Cap');
renderWeight(nifty500, 'Nifty 500 Weightage (%)');
renderSectorCap(nifty500, 'Nifty 500 Sector Wise Market Cap');
renderSectorWeight(nifty500, 'Nifty 500 Sector Wise Weightage (%)');

const niftymidcap50 = map(folders, folder => require('./data/' + folder + '/niftymidcap50.json'));
renderMarketCap(niftymidcap50, 'Nifty Midcap 50 Market Cap');
renderWeight(niftymidcap50, 'Nifty Midcap 50 Weightage (%)');
renderSectorCap(niftymidcap50, 'Nifty Midcap 50 Sector Wise Market Cap');
renderSectorWeight(niftymidcap50, 'Nifty Midcap 50 Sector Wise Weightage (%)');

const niftysmallcap100 = map(folders, folder => require('./data/' + folder + '/niftysmallcap100.json'));
renderMarketCap(niftysmallcap100, 'Nifty Smallcap 100 Market Cap');
renderWeight(niftysmallcap100, 'Nifty Smallcap 100 Weightage (%)');
renderSectorCap(niftysmallcap100, 'Nifty Smallcap 100 Sector Wise Market Cap');
renderSectorWeight(niftysmallcap100, 'Nifty Smallcap 100 Sector Wise Weightage (%)');
