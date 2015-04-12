var width = 960,
    height = 600,
    d3 = require('d3'),
    _ = require('underscore'),
    topojson = require('topojson'),
    india = require('json!./data/india.json'),
    variation = require('raw!./data/variation.csv'),
    d3Tip = require('d3-tip');

var stateCode = {
  'AN': '35',
  'AP': '28',
  'AR': '12',
  'AS': '18',
  'BR': '10',
  'CH': '04',
  'CT': '22',
  'DN': '26',
  'DD': '25',
  'DL': '07',
  'GA': '30',
  'GJ': '24',
  'HR': '06',
  'HP': '02',
  'JK': '01',
  'JH': '20',
  'KA': '29',
  'KL': '32',
  'LD': '31',
  'MP': '23',
  'MH': '27',
  'MN': '14',
  'ML': '17',
  'MZ': '15',
  'NL': '13',
  'OR': '21',
  'PY': '34',
  'PB': '03',
  'RJ': '08',
  'SK': '11',
  'TN': '33',
  'TR': '16',
  'UT': '05',
  'UP': '09',
  'WB': '19'
};

variation = d3.csv.parse(variation);
var byStateCode = _.groupBy(variation, 'stateCode');
var totalPopulation = _.chain(byStateCode['00'])
      .groupBy('year')
      .mapObject(([d]) => ((+d.male) + (+d.female)))
      .value();
var years = [1901, 1911, 1921, 1931, 1941, 1951, 1961, 1971, 1981, 1991, 2001, 2011];
var selectedYear = 2011;
function population(d, year=selectedYear) {
  if (d.id) {
    var data = _.findWhere(byStateCode[stateCode[d.id]], {year: year.toString()});
    if (!data) {
      return 0;
    }
    return (+data.male) + (+data.female);
  }
  return 0;
}

var svg = d3.select("body").append("svg")
      .attr("width", width)
      .attr("height", height);

var topo = topojson.feature(india, india.objects.states);

var radius = d3.scale.sqrt()
      .domain([0, 20e7])
      .range([0, 30]);

function renderMap() {
  var projection = d3.geo.mercator()
        .scale(1100)
        .center([83, 25]);
  var path = d3.geo.path().projection(projection);

  svg.selectAll(".state")
    .data(topo.features)
    .enter()
    .append("path")
    .attr("class", d => `state ${d.id}`)
    .attr("d", path);

  var formatter = d3.format(',');
  var tip = d3Tip()
        .attr('class', 'd3-tip')
        .html(d => (`${d.properties.name}: ${formatter(population(d))}`));

  svg.call(tip);

  svg.append("g")
    .attr("class", "bubble")
    .selectAll("circle")
    .data(topo.features)
    .enter()
    .append("circle")
    .attr('class', _.property('id'))
    .attr("transform", d => `translate(${path.centroid(d)})`)
    .attr('stroke', 'rgb(124, 181, 236)')
    .attr('fill', 'rgba(124, 181, 236, 0.498039)')
    .attr('stroke-width', 1)
    .attr("r", d => radius(population(d)))
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide);

  var legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(550, 550)")
        .selectAll("g")
        .data([1e7, 10e7, 20e7])
        .enter().append("g");

  legend.append("circle")
    .attr("cy", d => -radius(d))
    .attr("r", radius);

  legend.append("text")
    .attr("y", d => -2 * radius(d))
    .attr("dy", "-.3em")
    .text(d3.format(".1s"));
}


var formatter = d3.format(',');
var barTip = d3Tip()
      .attr('class', 'd3-tip bar-tip')
      .html(d => `${formatter(d)}`);
svg.call(barTip);

function transition(year) {
  svg.selectAll('g.bubble circle')
    .data(topo.features)
    .transition()
    .attr("r", d => radius(population(d, year)));

  var target = svg.selectAll('.bars rect.bar')[0][_.findIndex(years, x => (x === year))];
  barTip.show(totalPopulation[year], target);
}

var lastYearIndex = years.length - 1;
var sliderWidth = 200;
var sliderX = 475;
var sliderY = 140;
var sliderTranslate = `translate(${sliderX}, ${sliderY})`;
var barHeight = 100;

function renderSlider() {
  var x = d3.scale.linear()
        .domain([0, lastYearIndex])
        .range([0, sliderWidth])
        .clamp(true);

  var xaxis = d3.scale.ordinal()
        .domain(_.range(years.length))
        .rangeBands([0, sliderWidth], 0.1, 0);

  var brush = d3.svg.brush()
        .x(x)
        .extent([0, 0])
        .on("brush", brushed);

  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", sliderTranslate)
    .call(d3.svg.axis()
          .scale(xaxis)
          .orient("bottom")
          .tickFormat(d => {
            var year = years[d];
            if (year === 1901 || year === 2001) {
              return year.toString();
            }
            return year.toString().substring(2);
          })
          .tickSize(0)
          .innerTickSize(5)
          .tickPadding([5]))
    .select(".domain")
    .attr('transform', 'translate(0, -9)')
    .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "halo");

  var slider = svg.append("g")
        .attr("class", "slider")
        .attr("transform", sliderTranslate)
        .call(brush);

  slider.selectAll(".extent,.resize")
    .remove();

  slider.select(".background")
    .style('cursor', 'ew-resize')
    .attr('transform', `translate(0, -${barHeight + 10})`)
    .attr("height", barHeight + 20 + 10);

  var handle = slider.append("path")
        .attr("class", "handle")
        .attr('d', 'M-5.5,-2.5v10l6,5.5l6,-5.5v-10z');

  slider
    .call(brush.event)
    .transition()
    .duration(500)
    .call(brush.extent([lastYearIndex, lastYearIndex]))
    .call(brush.event);

  function brushed() {
    var value = brush.extent()[0];

    if (d3.event.sourceEvent) {
      value = x.invert(d3.mouse(this)[0]);
      value = Math.round(value);
      brush.extent([value, value]);
    } else {
      value = Math.round(value);
    }

    handle.attr("transform", `translate(${xaxis(value) + 7}, -12)`);
    selectedYear = years[Math.round(value)];
    transition(selectedYear);
  }
}

function renderBar() {
  var populationValues = _.values(totalPopulation);

  var y = d3.scale.linear()
        .domain([0, totalPopulation[2011]])
        .range([barHeight, 0]);

  var x = d3.scale.ordinal()
        .domain(populationValues)
        .rangeBands([0, sliderWidth], 0.1, 0);

  svg.append('g')
    .attr('class', 'bars')
    .attr('transform', `translate(${sliderX}, ${sliderY - barHeight - 12})`)
    .selectAll('.bar')
    .data(populationValues)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr("x", x)
    .attr("y", y)
    .attr("height", d => (barHeight - y(d)))
    .attr("width", x.rangeBand());
  svg.append("g")
    .attr("class", "y axis")
    .attr("transform", `translate(${sliderX + sliderWidth + 2}, ${sliderY - barHeight - 12})`)
    .call(d3.svg.axis()
          .scale(y)
          .tickSize(4)
          .tickFormat(d => (`${d/1000000}M`))
          .ticks(5)
          .orient('right'));
}

function render() {
  renderBar();
  renderSlider();
  renderMap();
}

render();
