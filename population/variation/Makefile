.PHONY: variation.csv build data/india.json

build: data/variation.csv data/india.json index.bundle.js

data/variation.xls:
	curl http://www.censusindia.gov.in/2011census/PCA/A-2_Data_Tables/00%20A%202-India.xls > data/variation.xls

data/variation.csv: data/variation.xls
	bundle install
	./xls2csv

data/ne_10m_admin_1_states_provinces.shp:
	curl http://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_1_states_provinces.zip > data/ne_10m_admin_1_states_provinces.zip
	unzip data/ne_10m_admin_1_states_provinces.zip
	mv ne_10m_admin_1_states_provinces.* data

data/states.json: data/ne_10m_admin_1_states_provinces.shp
	ogr2ogr -f GeoJSON -where "ISO_A2 = 'IN'" data/states.json data/ne_10m_admin_1_states_provinces.shp

data/india.json: data/states.json
	topojson -o data/india.json --id-property postal --properties name=name -- data/states.json

setup:
	npm install
	bower install

index.bundle.js: index.js
	node_modules/webpack/bin/webpack.js index.js index.bundle.js
