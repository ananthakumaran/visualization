var d3 = require('d3'),
    $ = require('jquery'),
    _ = require('underscore'),
    age = require('raw!./data/age.csv');

d3.selection.prototype.moveToFront = function () {
  return this.each(function () {
    this.parentNode.appendChild(this);
  });
};

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

_.each(ageGroupedByState, (points, state) => {
  _.each(points, (p) => {
    p.malePercentage = p.male * 100/ totalByState[state];
    p.femalePercentage = p.female * 100/ totalByState[state];
  });
});

function pointId(state, gender) {
  return [state, gender].join('-').replace(/[^a-zA-Z0-9]/g, '_');
}

function render(totalWidth) {
  var margin = {
    top: 15,
    left: 40,
    right: 20,
    bottom: 25
  };

  var height = 325, width = totalWidth - margin.left - margin.right;
  var x = d3.scale.linear().domain([0, 100]).range([0, width]);
  var y = d3.scale.linear().domain([0, 3]).range([height, 0]);

  var svg = d3.select("body").append("svg")
        .attr('class', 'state-distribution')
        .attr("width", totalWidth)
        .attr("height", height * 2 + margin.top + margin.bottom);

  var xAxis = d3
        .svg
        .axis()
        .scale(x)
        .tickValues(_.map(_.range(1, 11), i => i * 10))
        .orient('bottom');

  svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(${margin.left}, ${margin.top + height})`)
    .call(xAxis);

  var currentState = svg.append('text')
        .attr('transform', `translate(${margin.left + width / 2}, ${margin.top + 50})`)
        .attr('class', 'current-state')
        .text('');

  svg.append('text')
    .attr('transform', `translate(${margin.left + width}, ${margin.top + height - 100}), rotate(-90)`)
    .attr('class', 'gender')
    .text('Male');

  svg.append('text')
    .attr('transform', `translate(${margin.left + width}, ${margin.top + height + 100}), rotate(-90)`)
    .attr('class', 'gender')
    .text('Female');

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
        .y(p => y(p.malePercentage))
        .x(p => x(p.age));

  svg.selectAll('path.male')
    .data(_.values(ageGroupedByState))
    .enter()
    .append('path')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
    .attr('class', 'male')
    .attr('id', (d, i) => pointId(_.keys(ageGroupedByState)[i], 'male'))
    .attr('d', d => maleLine(d));

  var fy = y.copy().range([0, height]);

  var femaleLine = d3.svg
        .line()
        .y(p => fy(p.femalePercentage))
        .x(p => x(p.age));

  svg.selectAll('path.female')
    .data(_.values(ageGroupedByState))
    .enter()
    .append('path')
    .attr('transform', `translate(${margin.left}, ${margin.top + height})`)
    .attr('class', 'female')
    .attr('id', (d, i) => pointId(_.keys(ageGroupedByState)[i], 'female'))
    .attr('d', d => femaleLine(d));

  var voronoiG = svg.append('g')
        .attr('class', 'voronoi')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

  var voronoiData = _.chain(ageGroupedByState)
        .map((points, state) => {
          return _.chain(points)
            .map((point) => {
              return [
                {x: x(point.age), y: y(point.malePercentage), point: point},
                {x: x(point.age), y: height + fy(point.femalePercentage), point: point},
              ];
            })
            .flatten(true)
            .value();
        })
        .flatten(true)
        .value();

  var voronoi = d3.geom.voronoi()
        .clipExtent([0, 0], [width, 2*height])
        .x(d => d.x)
        .y(d => d.y);

  voronoiG.selectAll('path')
    .data(voronoi(voronoiData))
    .enter()
    .append('path')
    .attr("d", d => "M" + d.join("L") + "Z")
    .style('pointer-events', 'all')
    .on('mouseover', (d) => {
      var point = d.point.point;
      _.each(['male', 'female'], gender => {
        d3.select('#' + pointId(point.state, gender))
          .classed('selected', true)
          .moveToFront();
      });
      currentState.text(point.state);
    })
    .on('mouseout', (d) => {
      _.each(['male', 'female'], gender => {
        d3.select('#' + pointId(d.point.point.state, gender))
          .classed('selected', false);
      });
      currentState.text('');
    });
}

$().ready(function () {
  var width = $('body').width() * 0.8;
  render(width);
});
