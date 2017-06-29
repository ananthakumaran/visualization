.PHONY: data/india.json data/india.geojson data/population.json data/india.states.json

build: data/population.json data/india.json data/india.states.json

data/population.json:
	xsv cat rows data/PCA*.CSV | xsv search -s Level 'DISTRICT' | xsv search -s TRU 'Total' | xsv select "State,District,Name,Area,Total Population Person,\"Population in the age group 0-6 Person\",Literates Population Person" | \
	csvtojson > data/population.json

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
minify: index.bundle.js
	uglifyjs index.bundle.js -c -m -o index.bundle.js
