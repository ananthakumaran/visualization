.PHONY: data/india.json data/india.geojson data/population.json data/india.states.json

build: data/population.json data/india.json data/india.states.json

data/population.json:
	xsv cat rows data/PCA*.CSV | xsv search -s Level 'DISTRICT' | xsv search -s TRU 'Total' | xsv select 'State,District,Name,Area,Total Population Person' | \
	csvtojson > data/population.json

data/houseless.xls:
	curl http://www.censusindia.gov.in/2011-Documents/PCA_HL_2011_Release.xls > data/houseless.xls

data/india.geojson:
	shp2json ../maps/Census_2011/2011_Dist.shp > data/india.geojson

data/india.json: data/india.geojson
	geo2topo < data/india.geojson | toposimplify -p .001 | topoquantize 1e5 > data/india.json

data/india.states.json:
	shp2json ../maps/States/Admin2.shp | geo2topo | toposimplify -p .001 | topoquantize 1e5 > data/india.states.json

setup:
	yarn
	yarn global add shapefile xlsx topojson-server topojson-simplify topojson-client d3-geo-projection --prefix=/usr/local


index.bundle.js: index.js
	node_modules/webpack/bin/webpack.js index.js index.bundle.js

index.circle.bundle.js: index.circle.js
	node_modules/webpack/bin/webpack.js index.circle.js index.circle.bundle.js

minify: index.bundle.js index.circle.bundle.js
	uglifyjs index.bundle.js -c -m -o index.bundle.js
	uglifyjs index.circle.bundle.js -c -m -o index.circle.bundle.js
