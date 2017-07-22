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
import * as _ from 'underscore';
import {csvParse} from 'd3-dsv';

const format = (x) => Math.round(x).toLocaleString('en-IN');

function sum(list) {
  return reduce(list, (acc, v) => v + acc, 0);
}

function getScrollbarWidth() {
  var outer = document.createElement("div");
  outer.style.visibility = "hidden";
  outer.style.width = "100px";
  outer.style.msOverflowStyle = "scrollbar";
  document.body.appendChild(outer);
  var widthNoScroll = outer.offsetWidth;
  outer.style.overflow = "scroll";
  var inner = document.createElement("div");
  inner.style.width = "100%";
  outer.appendChild(inner);
  var widthWithScroll = inner.offsetWidth;
  outer.parentNode.removeChild(outer);
  return widthNoScroll - widthWithScroll;
}

function renderSlider(all, grouping) {
  let dates = _.map(all, ([d, v]) => d);
  let total = _.map(all, ([d, v]) => sum(_.pluck(v, 'total')));
  let lastYearIndex = all.length - 1;
  let sliderPad = 0;

  let width = Math.max(Math.max(document.documentElement.clientWidth, window.innerWidth || 0) - getScrollbarWidth(), 1200);
  let sliderWidth = width - 2 * sliderPad;
  let sliderHeight = 150;
  var axisTranslate = `translate(${sliderPad}, ${sliderHeight - 30})`;
  let height = Math.max(Math.max(document.documentElement.clientHeight, window.innerHeight || 0), 700) - sliderHeight;

  var x = d3.scaleLinear()
      .domain([0, lastYearIndex])
      .range([0, sliderWidth])
      .clamp(true);

  var y = d3.scaleLinear()
      .domain([0, d3.max(total)])
      .range([sliderHeight - 50, 0]);

  var line = d3.line()
      .x(function(d, i) { return x(i); })
      .y(function(d) { return y(d); })
      .curve(d3.curveMonotoneX);

  var xaxis = d3.scalePoint()
      .domain(_.range(dates.length))
      .range([0, sliderWidth])
      .padding(0);

  let svg = d3.select("body")
      .append("svg")
      .attr('height', sliderHeight)
      .attr('width', width);

  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", axisTranslate)
    .call(d3.axisBottom(xaxis)
          .tickSize(-sliderHeight)
          .tickFormat((d, i) => dates[i].format("MMM-YY")))
    .select(".domain")
    .attr('transform', 'translate(0, -9)')
    .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "halo");

  svg.append("path")
    .attr("transform", 'translate(0, 10)')
    .attr("d", line(total))
    .attr("fill", "none")
    .attr("stroke", "#00bcd4");

  svg.append("g")
    .attr("transform", 'translate(0, 10)')
    .selectAll(".point")
    .data(total)
    .enter()
    .append("circle")
    .attr("class", (d, i) => `point year-${i}`)
    .attr("fill", "#00bcd4")
    .attr("r", "3")
    .attr("cx", (d, i) => x(i))
    .attr("cy", d => y(d));

  svg.append("g")
    .attr("transform", 'translate(0, 10)')
    .selectAll(".value")
    .data(total)
    .enter()
    .append("text")
    .attr("class", "value")
    .attr("fill", "#00bcd4")
    .attr("x", (d, i) => x(i))
    .attr("y", d => y(d) + 15)
    .text(d => format(d));

  var slider = svg.append("g")
    .attr("class", "slider")
    .attr("transform", `translate(0, ${sliderHeight/2})`);

  let drag = d3.drag()
      .on("start.interrupt", function() { slider.interrupt(); })
      .on("start drag", function() { focus(Math.round(x.invert(d3.event.x))); });

  slider.append("line")
    .attr("class", "track-overlay")
    .attr("stroke-width", sliderHeight + 'px')
    .attr("x1", x.range()[0])
    .attr("x2", x.range()[1])
    .call(drag);

  var handle = slider.insert("path", '.track-overlay')
      .attr("class", "handle")
      .attr('d', 'M-5.5,-2.5v10l6,5.5l6,-5.5v-10z');

  let tree = d3.select("body")
      .append("svg")
      .style('height', height + 'px')
      .style('width', width + 'px')
      .attr('class', 'tree');


  var treemap = d3.treemap()
      .size([width, height])
      .padding(0)
      .round(true);

  let lastScaleX = 1, lastScaleY = 1, currentRoot = null;
  function renderTreemap(all, grouping, tree, treemap, width, height) {
    const backHeight = 20;
    height = height - backHeight;
    let data = [{id: 'AUM'}];

    function buildTree(all, past, keys) {
      let current = _.first(keys);
      let rest = _.rest(keys);
      _.each(_.groupBy(all, current), (group, key) => {
        let newPast = past.concat([key]);
        if (rest.length) {
          data.push({
            id: newPast.join('.')
          });
          buildTree(group, newPast, rest);
        } else {
          data.push({
            id: newPast.join('.'),
            value: sum(_.pluck(group, 'total'))
          });
        }
      });
    }
    buildTree(all, ['AUM'], grouping);

    var stratify = d3.stratify()
      .parentId(function(d) { return d.id.substring(0, d.id.lastIndexOf(".")); });

    var root = stratify(data)
      .sum(function(d) { return d.value; })
      .sort(function(a, b) { return b.height - a.height || b.value - a.value; });

    const grandParent = x => x.parent && x.parent.parent;
    const immediateChild = x => x.parent === currentRoot ? x : immediateChild(x.parent);
    const rootG = tree
      .selectAll('.root')
      .data([0]);

    const backG = tree
      .selectAll('.back')
      .data([0]);

    const backEnter = backG.enter()
      .append('g')
      .attr('class', 'back');

    backEnter.append('rect')
      .attr("width", width)
      .attr("height", 20);

    backEnter.append('text')
      .attr("x", 10)
      .attr("y", 15);

    const rootGEnter = rootG.enter()
      .append("g")
      .attr('class', 'root');

    const labelRoot = tree
      .selectAll('.labelRoot')
      .data([0]);

    const labelRootEnter = labelRoot.enter()
      .append("g")
      .attr('class', 'labelRoot');

    function renderTree(newRoot) {
      var t = d3.transition()
        .duration(500)
        .ease(d3.easeLinear);

      let w = newRoot.x1 - newRoot.x0,
      h = newRoot.y1 - newRoot.y0;

      backEnter.merge(backG)
        .select('rect')
        .on('click', () => {
          if (currentRoot.parent) {
            renderTree(currentRoot.parent);
          }
        });

      const backLabel = newRoot.id.replace(/\./g, ' → ') + (newRoot.parent ? '  ↑  ' : '');
      backEnter.merge(backG).select('text').text(backLabel);

      const scaleX = width/w;
      const scaleY = height/h;
      const translateX = -newRoot.x0 * scaleX;
      const translateY = -newRoot.y0 * scaleY + backHeight;

      rootG.merge(rootGEnter).transition(t).attr('transform', `translate(${translateX},${translateY}),scale(${scaleX},${scaleY})`);
      labelRoot.merge(labelRootEnter).transition(t).attr('transform', `translate(${translateX},${translateY})`);

      currentRoot = newRoot;

      const nodes = _.chain(root.descendants())
        .filter(d => d.parent === currentRoot ||
                grandParent(d) === currentRoot)
        .sortBy(d => -d.depth)
        .value();

      const sorted = _.chain(nodes)
        .filter(d => d.parent === currentRoot)
        .map(d => d.id)
        .sortBy('value')
        .value();

      var colorScale = d3.scaleSequential(d3.interpolateRainbow)
        .domain([0, sorted.length]);
      const color = (t) => colorScale(sorted.indexOf(t));

      const rect = rootG.merge(rootGEnter)
        .selectAll(".node")
        .data(nodes, d => d.id);

      const updateRects = (selection) => {
        selection
          .style('opacity', d => grandParent(d) === currentRoot || (d.parent === currentRoot && !d.children) ? 1 : 0)
          .style('stroke-width', 1/(scaleX + scaleY))
          .attr("x", d => d.x0)
          .attr("y", d => d.y0)
          .attr("width", d => d.x1 - d.x0)
          .attr("height", d => d.y1 - d.y0);

      };
      rect.exit().transition(t).remove();
      rect.enter()
        .append("rect")
        .attr("class", "node")
        .attr("title", function(d) { return d.id + "\n" + format(d.value); })
        .call(updateRects)
        .merge(rect)
        .style('cursor', d => (d.parent !== currentRoot) ? 'pointer' : null)
        .on('click', (d) => {
          if (d.parent !== currentRoot) {
            renderTree(immediateChild(d));
          }
        })
        .attr("fill", function(d) {
          if(root === d || (d.parent === currentRoot && d.children)) {
            return 'transparent';
          } else {
            return color(d.parent !== currentRoot ? d.parent.id : d.id);
          }
        })
        .attr('pointer-events', d => grandParent(d) === currentRoot || (d.parent === currentRoot && !d.children) ? null : 'none')
        .transition(t)
        .call(updateRects);

      const label = labelRoot.merge(labelRootEnter)
        .selectAll('.node-label-wrapper')
        .data(nodes, d => d.id);

      label.exit().remove();
      const updateLabels = (selection, scaleX, scaleY) => {
        selection
          .attr("x", d => scaleX * d.x0)
          .attr("y", d => scaleY * d.y0)
          .attr("width", d => (scaleX * (d.x1 - d.x0)) + 'px')
          .attr("height", d => (scaleY * (d.y1 - d.y0)) + 'px')
          .style('opacity', d => d.parent === currentRoot ? 1 : 0);
      };

      const labelEnter = label.enter()
        .append('foreignObject')
        .attr("pointer-events", "none")
        .attr('class', 'node-label-wrapper')
        .call(updateLabels, lastScaleX, lastScaleY);

      const labelDiv = labelEnter.append('xhtml:div');
      labelDiv.append('div').attr('class', 'node-label');
      labelDiv.append('div').attr('class', 'node-value');

      labelEnter.merge(label)
        .select("div.node-label")
        .text(d => _.last(d.id.split('.')));

      labelEnter.merge(label)
        .select("div.node-value")
        .text(d => format(d.value));

      labelEnter
        .merge(label)
        .style('pointer-events', d => d.parent === currentRoot ? null : 'none')
        .transition(t)
        .call(updateLabels, scaleX, scaleY);

      lastScaleX = scaleX;
      lastScaleY = scaleY;
    }

    treemap(root);
    let newRoot = root;
    if (currentRoot) {
      root.each((d) => {
        if (currentRoot.id === d.id) {
          newRoot = d;
        }
      });
    }
    renderTree(newRoot);
  }

  function focus(i) {
    const t = d3.transition()
          .duration(500)
          .ease(d3.easeLinear);
    svg.selectAll("circle").transition(t).attr("r", "3");
    svg.selectAll(`circle.year-${i}`).transition(t).attr("r", "6");
    var dx = 0;
    if (i === 0) {
      dx = 8;
    } else if (i === dates.length - 1) {
      dx = -8;
    }
    handle.transition(t)
      .attr("transform", `translate(${xaxis(i) + dx}, ${(sliderHeight/2) - 42})`);
    renderTreemap(all[i][1], grouping, tree, treemap, width, height);
  }

  focus(dates.length - 2);
}


function render(data, symbols, symbolLabel, label, stream) {
  const symbolVolume = {};
  symbols.forEach((ticker) => {
    symbolVolume[ticker] = sum(pluck(data, ticker));
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
    .tickFormat((t, i) => moment(t).format('MMM-YY'))
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

const data = [
  ['March-2011', require('./data/March-2011.csv')],
  ['June-2011', require('./data/June-2011.csv')],
  ['September-2011', require('./data/September-2011.csv')],
  ['December-2011', require('./data/December-2011.csv')],
  ['March-2012', require('./data/March-2012.csv')],
  ['June-2012', require('./data/June-2012.csv')],
  ['September-2012', require('./data/September-2012.csv')],
  ['December-2012', require('./data/December-2012.csv')],
  ['March-2013', require('./data/March-2013.csv')],
  ['June-2013', require('./data/June-2013.csv')],
  ['September-2013', require('./data/September-2013.csv')],
  ['December-2013', require('./data/December-2013.csv')],
  ['March-2014', require('./data/March-2014.csv')],
  ['June-2014', require('./data/June-2014.csv')],
  ['September-2014', require('./data/September-2014.csv')],
  ['December-2014', require('./data/December-2014.csv')],
  ['March-2015', require('./data/March-2015.csv')],
  ['June-2015', require('./data/June-2015.csv')],
  ['September-2015', require('./data/September-2015.csv')],
  ['December-2015', require('./data/December-2015.csv')],
  ['March-2016', require('./data/March-2016.csv')],
  ['June-2016', require('./data/June-2016.csv')],
  ['September-2016', require('./data/September-2016.csv')],
  ['December-2016', require('./data/December-2016.csv')],
  ['March-2017', require('./data/March-2017.csv')],
  ['June-2017', require('./data/June-2017.csv')],
];

function renderAUMByField(all, field, label) {
  const groups = _.chain(all)
    .map(([d, v]) => {
      return _.uniq(_.pluck(v, field));
    }).flatten()
    .unique()
    .value();
  const labels = {};
  const data = _.sortBy(_.map(all, ([d, v]) => {
    let values = {date: d};
    groups.forEach((group) => {
      values[group] = sum(_.map(v, x => {
        if (x[field] === group) {
          return x.total;
        } else {
          return 0;
        }
      }));
      labels[group] = group;
    });
    return values;
  }), 'date');

  render(data, groups, labels, "AUM by " + label, true);
}

const schemes = csvParse(require('./data/schemes.csv'));
const schemesById = {}; _.each(schemes, s => schemesById[s.id] = s);

const start = moment('2011', 'YYYY');
const all = _.filter(data, ([d, v]) => moment(d, 'MMM-YYYY') >= start).map(([d, v]) => {
  let rows = csvParse(v).map(x => {
    let scheme = schemesById[x.id];
    x.total = parseFloat(x.total)/100;
    x.name = scheme.name.replace(/\./g, '');
    x.AMC = scheme.AMC;
    x.category = scheme.category;
    x.groupName =  (scheme['Scheme Name'] ? scheme['Scheme Name'] : x.name).replace(/\./g, '');
    return x;
  });
  return [moment(d, 'MMMM-YYYY'), rows];
});

renderAUMByField(all, 'category', 'Category');
renderSlider(all, ['category', 'AMC', 'groupName']);
renderAUMByField(all, 'AMC', 'AMC');
renderSlider(all, ['AMC', 'category', 'groupName']);
// renderSlider(all, ['AMC', 'groupName']);
// renderSlider(all, ['category', 'groupName']);
