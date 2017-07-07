.PHONY: election.json data/tamilnadu.json

index.bundle.js: index.js
	node_modules/webpack/bin/webpack.js index.js index.bundle.js
minify: index.bundle.js
	uglifyjs index.bundle.js -c -m -o index.bundle.js

data/tamilnadu.json:
	geo2topo < data/s22.geojson | toposimplify -p .000001 | topoquantize 1e5 > data/tamilnadu.json

election.json:
	csvtojson data/1977.csv > data/1977.json
	csvtojson data/1980.csv > data/1980.json
	csvtojson data/1984.csv > data/1984.json
	csvtojson data/1989.csv > data/1989.json
	csvtojson data/1991.csv > data/1991.json
	csvtojson data/1996.csv > data/1996.json
	csvtojson data/2001.csv > data/2001.json
	csvtojson data/2006.csv > data/2006.json
	csvtojson data/result2map.csv > data/result2map.json
