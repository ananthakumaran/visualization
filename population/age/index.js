var d3 = require('d3'),
    _ = require('underscore'),
    $ = require('jquery'),
    age = require('raw!./data/age.csv');

function group(list, n) {
  var result = [];
  while (list.length > 0) {
    result.push(_.take(list, n));
    list = _.drop(list, n);
  }
  return result;
}

function sum(rows, property) {
  return _.chain(rows)
    .pluck(property)
    .reduce((s, v) => {
      return s + v;
    }, 0)
    .value();
}

var ageRaw = d3.csv.parse(age);
var ages = _.chain(ageRaw)
      .filter(row => (row.age !== '100+' || row.age !== 'Age not stated'))
      .map(row => {
        return _.mapObject(row, (val, key) => {
          if (key === 'state') {
            return val;
          }
          return parseInt(val, 10);
        });
      })
      .value();

var ageGroupedByState = _.groupBy(ages, 'state');

var color = d3.scale.category20().domain(_.range(0, _.size(ageGroupedByState) * 2));

var totalWidth = $('body').width();
var column = Math.floor(totalWidth / 500) || 1;
var width = (totalWidth / column) - 40;

var i = 0;
_.each(ageGroupedByState, function (distribution, name) {
  renderBars(distribution, name, i++, width);
});

function renderBars(distribution, name, i, totalWidth) {
  var totalMale = sum(distribution, 'male');
  var totalFemale = sum(distribution, 'female');
  var margin = {
    top: 15,
    left: 40,
    right: 0,
    bottom: 25
  };

  var bucketSize = 5;
  var height = 125, width = totalWidth - margin.left - margin.right;
  var x = d3.scale.ordinal().domain(_.range(0, distribution.length / bucketSize)).rangeRoundBands([0, width], 0.15);
  var y = d3.scale.linear().domain([0, 0.15]).range([height, 0]);

  var svg = d3.select("body").append("svg")
        .attr('class', 'state-distribution')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height * 2 + margin.top + margin.bottom);

  var xAxis = d3.svg.axis().scale(x).orient('bottom').tickFormat((i) => i*5).tickSize(-height);
  svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(${margin.left}, ${margin.top + 2 * height})`)
    .call(xAxis);

  svg.append('g')
    .attr('class', 'male')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
    .selectAll('.bars')
    .data(group(distribution, bucketSize))
    .enter()
    .append('rect')
    .style('fill', color(2*i))
    .attr('x', (d, i) => x(i))
    .attr('y', d => y(sum(d, 'male') / totalMale))
    .attr('width', x.rangeBand())
    .attr('height', d => height - y(sum(d, 'male') / totalMale));

  svg.append('g')
    .attr('class', 'female')
    .attr('transform', `translate(${margin.left}, ${margin.top + height})`)
    .selectAll('.bars')
    .data(group(distribution, bucketSize))
    .enter()
    .append('rect')
    .style('fill', color(2*i + 1))
    .attr('x', (d, i) => x(i))
    .attr('y', 0)
    .attr('width', x.rangeBand())
    .attr('height', d => height - y(sum(d, 'female') / totalFemale));

  var tickValues = [0, 0.05, 0.10, 0.15];
  var formatY = (x) => (x * 100) + '%';
  var yAxis = d3.svg.axis().scale(y).orient('left').tickValues(tickValues).tickFormat(formatY).tickSize(5);
  svg.append('g')
    .attr('class', 'y axis')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
    .call(yAxis);

  var yGridAxis = d3.svg.axis().scale(y).orient('left').tickValues(tickValues).tickSize(-width);
  svg.append('g')
    .attr('class', 'grid axis')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
    .call(yGridAxis);

  var y1Axis = d3.svg.axis().scale(y.copy().range([0, height])).orient('left').tickValues(_.without(tickValues, 0)).tickFormat(formatY).tickSize(5);
  svg.append('g')
    .attr('class', 'y1 axis')
    .attr('transform', `translate(${margin.left}, ${margin.top + height})`)
    .call(y1Axis);

  var y1GridAxis = d3.svg.axis().scale(y.copy().range([0, height])).orient('left').tickValues(_.without(tickValues, 0)).tickSize(-width);
  svg.append('g')
    .attr('class', 'grid axis')
    .attr('transform', `translate(${margin.left}, ${margin.top + height})`)
    .call(y1GridAxis);

  svg.append('text')
    .attr('transform', `translate(${margin.left + width - 50}, ${margin.top + 14})`)
    .attr('class', 'state-name')
    .attr('text-anchor', 'end')
    .text(name);

  svg.append('text')
    .attr('transform', `translate(${margin.left + width}, ${margin.top + 80}), rotate(-90)`)
    .attr('class', 'gender')
    .text('Male');

  svg.append('text')
    .attr('transform', `translate(${margin.left + width}, ${margin.top + 2 * height - 50}), rotate(-90)`)
    .attr('class', 'gender')
    .text('Female');
}
