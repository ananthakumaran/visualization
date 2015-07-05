var d3 = require('d3'),
    $ = require('jquery'),
    _ = require('underscore'),
    age = require('raw!./data/age.csv');

var ageRaw = d3.csv.parse(age);

var ages = _.chain(ageRaw)
      .filter(row => (row.age !== '100+' && row.age !== 'Age not stated'))
      .map(row => {
        return _.mapObject(row, (val, key) => {
          if (key === 'state') {
            return val;
          }
          val = parseInt(val, 10);
          if (!_.isFinite(val)) {
            console.log('val', row);
          }
          return val;
        });
      })
      .value();

var ageGroupedByState = _.groupBy(ages, 'state');
var totalByState = _.chain(ageGroupedByState)
      .map((distributions, state) => {
        return [state, _.reduce(distributions, (a, d) => a + d.male + d.female, 0)];
      })
      .object()
      .value();
var color = d3.scale.category20().domain(_.range(0, _.size(ageGroupedByState) * 2));


function render(totalWidth) {
  var margin = {
    top: 15,
    left: 40,
    right: 20,
    bottom: 25
  };

  var height = 350, width = totalWidth - margin.left - margin.right;
  var x = d3.scale.linear().domain([0, 100]).range([0, width]);
  var y = d3.scale.linear().domain([0, 3]).range([height, 0]);

  var svg = d3.select("body").append("svg")
        .attr('class', 'state-distribution')
        .attr("width", totalWidth)
        .attr("height", height * 2 + margin.top + margin.bottom);

  var xAxis = d3.svg.axis().scale(x).orient('bottom');

  svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(${margin.left}, ${margin.top + height})`)
    .call(xAxis);

  var yAxis = d3.svg.axis().scale(y).orient('left');
  svg.append('g')
    .attr('class', 'y axis')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
    .call(yAxis);

  var y1Axis = d3.svg.axis().scale(y.copy().domain([3, 0])).orient('left');
  svg.append('g')
    .attr('class', 'y axis')
    .attr('transform', `translate(${margin.left}, ${margin.top + height})`)
    .call(y1Axis);

  var maleLine = d3.svg
        .line()
        .y(p => y(p.male * 100/ totalByState[p.state]))
        .x(p => x(p.age));

  svg.selectAll('path.male')
    .data(_.values(ageGroupedByState))
    .enter()
    .append('path')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
    .attr('class', 'male')
    .attr('d', d => maleLine(d))
    .attr('stroke', (d, i) => color(i));

  var fy = y.copy().range([0, height]);

  var femalLine = d3.svg
        .line()
        .y(p => fy(p.female * 100/ totalByState[p.state]))
        .x(p => x(p.age));

  svg.selectAll('path.female')
    .data(_.values(ageGroupedByState))
    .enter()
    .append('path')
    .attr('transform', `translate(${margin.left}, ${margin.top + height})`)
    .attr('class', 'female')
    .attr('d', d => femalLine(d))
    .attr('stroke', (d, i) => color(i));

  console.log('total by state', totalByState);
}

$().ready(function () {
  var width = $('body').width() * 0.8;
  render(width);
});
