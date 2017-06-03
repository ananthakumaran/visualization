const glob = require('glob');
const fs = require('fs');

const files = glob.sync('data/*.json');
let all = [];
files.forEach((file) => {
  let data = JSON.parse(fs.readFileSync(file));
  all.push(data);
});

fs.writeFileSync('data/all.json', JSON.stringify(all, null, 4));
