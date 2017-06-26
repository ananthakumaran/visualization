.PHONY: data/india.json data/india.geojson data/houseless.json data/india.states.json

build: data/houseless.json data/india.json data/india.states.json

data/houseless.json: data/houseless.xls
	xlsx data/houseless.xls | \
	xsv search -s Level 'DISTRICT' | xsv search -s TRU 'Total' | xsv select District,Name,TOT_HL_P | \
	csvtojson > data/houseless.json

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
minify: index.bundle.js
	uglifyjs index.bundle.js -c -m -o index.bundle.js
