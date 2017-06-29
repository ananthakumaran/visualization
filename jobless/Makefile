.PHONY: data/india.json data/india.geojson data/population.json data/india.states.json data/jobless.xls data/jobless.json

data/jobless.json:
	for file in data/*.xlsx; do \
		xlsx "$$file" | xsv search -n -s 5 'Total' | xsv search -s Marginal 'Non-workers seeking / available for work' | xsv search -s 'Educational ' 'Total' | xsv select 'State,District,Area,Total' > "$$file.csv"; \
	done
	xsv cat rows data/jobless*.csv | csvtojson > data/jobless.json

data/population.json:
	xsv cat rows data/PCA*.CSV | xsv search -s Level 'DISTRICT' | xsv search -s TRU 'Total' | xsv select 'State,District,Name,Area,Total Population Person,Total Worker Population Person' | \
	csvtojson > data/population.json


data/jobless.xls:
	curl http://www.censusindia.gov.in/2011census/B-series/B-16/DDW-[01-35]00B-16.xlsx -o data/jobless-#1.xlsx

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
