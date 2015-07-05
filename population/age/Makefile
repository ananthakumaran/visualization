data/age.xls:
	curl http://www.censusindia.gov.in/2011census/C-series/c-13/DDW-0000C-13.xls > data/age.xls

data/age.csv: data/age.xls
	bundle install
	./xls2csv

index.bundle.js: index.js
	node_modules/webpack/bin/webpack.js index.js index.bundle.js

comparison.bundle.js: comparison.js
	node_modules/webpack/bin/webpack.js comparison.js comparison.bundle.js

minify: index.bundle.js comparison.bundle.js
	uglifyjs index.bundle.js -c -m -o index.bundle.js
	uglifyjs comparison.bundle.js -c -m -o comparison.bundle.js

setup:
	npm install
	bower install
