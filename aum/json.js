const _ = require('lodash');
const cheerio = require('cheerio');
const glob = require('glob');
const fs = require('fs');
const util = require('util');
const path = require('path');

_.each(glob.sync('data/clean/*.html'), (file) => {
  const table = fs.readFileSync(file);
  const $ = cheerio.load(table);
  let start = false, newFund = false;
  let amc = null, category = null;

  const fd = fs.openSync('data/' + path.basename(file, '.html') + '.csv', 'w+');
  function printRow(row) {
    fs.writeSync(fd, _.map(row, (a) => {
      return JSON.stringify(a);
    }).join(',') + '\n');
  }


  printRow('AMC,category,id,name,total,total-fof'.split(','));
  $('tr').map((i, el) => {
    const ths = $(el).find('th').length;
    const tds = $(el).find('td').length;
    if (ths == 2) {
      start = true;
      newFund = true;
      return;
    }

    if (start) {
      if (ths == 1) {
        if (newFund) {
          newFund = false;
          amc =  _.trim($(el).text());
        } else {
          category = _.trim($(el).text());
        }
      } else if (ths === 3) {
        newFund = true;
        amc = null;
        category = null;
      } else if (tds === 4) {
        if (!amc || !category) {
          throw new Error("invalid state");
        }
        let result = [amc,category];
        result = result.concat($(el).find('td').map((i, el) => _.trim($(el).text())).get());
        printRow(result);
      }
    }
  });
  fs.closeSync(fd);
});
