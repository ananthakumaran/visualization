.PHONY: data/aum.csv data/schemes.csv data/all.csv

index.bundle.js: index.js
	node_modules/webpack/bin/webpack.js index.js index.bundle.js
minify: index.bundle.js
	uglifyjs index.bundle.js -c -m -o index.bundle.js

data/aum.csv:
	for file in data/full/*.csv; do \
                xsv select 'id,total' < "$$file" > "data/$$(basename $$file)"; \
	done


data/schemes.csv:
	xsv select 'AMC,Code,Scheme Name,Scheme Type,Scheme Category,Scheme NAV Name' < data/raw/schemes.csv > data/schemes.csv

setup:
	yarn

