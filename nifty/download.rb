require 'date'
require 'pp'

start = Date.new(2013, 5)
today = Date.today.prev_month

while start < today
  # https://www.nseindia.com/content/indices/indices_dataApr2013.zip
  # puts `cd data && wget http://amc.ppfas.com/downloads/portfolio-disclosure/Monthly-Portfolio-#{start.strftime("%B-%Y")}.xls`
  #
  time = start.strftime("%b%Y")
  # `curl 'https://www.nseindia.com/content/indices/indices_data#{time}.zip' -H 'Pragma: no-cache' -H 'Accept-Encoding: gzip, deflate, br' -H 'Accept-Language: en-US,en;q=0.8,hi;q=0.6,ta;q=0.4' -H 'Upgrade-Insecure-Requests: 1' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36' -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8' -H 'Referer: https://www.nseindia.com/products/content/equities/indices/archieve_indices.htm' -H 'Connection: keep-alive' -H 'Cache-Control: no-cache' --compressed > data/#{time}.zip`
  # puts time
  # puts `unzip data/#{time}.zip -d data/#{start.strftime('%Y-%m')}`
  # puts `unzip data/#{time}.zip -d data/#{start.strftime('%Y-%m')}`
  folder = start.strftime('%Y-%m')
  # file = "nifty50_#{time}.pdf"

  filename = 'niftysmallcap100'
  puts `tabula -i -g -t -p all data/#{folder}/cnxsmallcap_#{time}.pdf -o data/#{folder}/#{filename}.csv`
  puts `tabula -i -g -t -p all data/#{folder}/niftysmallcap100_#{time}.pdf -o data/#{folder}/#{filename}.csv`
  puts `ruby merge.rb < data/#{folder}/#{filename}.csv > data/#{folder}/#{filename}-corrected.csv`

  puts `ruby merge.rb < data/#{folder}/#{filename}.csv > data/#{folder}/#{filename}-corrected.csv`
  puts `xsv table < data/#{folder}/#{filename}-corrected.csv`
  if $? != 0
    puts "wrong conversion"
    exit
  end

  # puts start.strftime('%Y-%m')
  puts `csv2json < data/#{folder}/#{filename}-corrected.csv > data/#{folder}/#{filename}.json`
  start = start.next_month
end
