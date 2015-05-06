
data/age.xls:
	curl http://www.censusindia.gov.in/2011census/C-series/c-13/DDW-0000C-13.xls > data/age.xls

data/age.csv: data/age.xls
	bundle install
	./xls2csv

index.bundle.js: index.js
	node_modules/webpack/bin/webpack.js index.js index.bundle.js

minify: index.bundle.js
	uglifyjs index.bundle.js -c -m -o index.bundle.js

setup:
	npm install
	bower install
