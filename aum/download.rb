require 'json'

(0..11).each do |year|
  puts "year #{year}"
  list = `curl -s 'https://www.amfiindia.com/modules/AvergaeAUMQuarterByYearId' -H 'Pragma: no-cache' -H 'Origin: https://www.amfiindia.com' -H 'Accept-Encoding: gzip, deflate, br' -H 'Accept-Language: en-US,en;q=0.8,hi;q=0.6,ta;q=0.4' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36' -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' -H 'Accept: */*' -H 'Cache-Control: no-cache' -H 'X-Requested-With: XMLHttpRequest' -H 'Connection: keep-alive' -H 'Referer: https://www.amfiindia.com/research-information/aum-data/average-aum' --data 'AUmType=S&MF_Id=-1&Year_Id=#{year}' --compressed`
  list = JSON.parse(list)
  list.each do |v|
    interval = v['Text']
    puts "fetching #{interval}"
    `curl -s 'https://www.amfiindia.com/modules/AverageAUMDetails' -H 'Pragma: no-cache' -H 'Origin: https://www.amfiindia.com' -H 'Accept-Encoding: gzip, deflate, br' -H 'Accept-Language: en-US,en;q=0.8,hi;q=0.6,ta;q=0.4' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36' -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' -H 'Accept: */*' -H 'Cache-Control: no-cache' -H 'X-Requested-With: XMLHttpRequest' -H 'Connection: keep-alive' -H 'Referer: https://www.amfiindia.com/research-information/aum-data/average-aum' --data 'AUmType=S&AumCatType=Categorywise&MF_Id=-1&Year_Id=#{year}&Year_Quarter=#{interval.gsub(' ', '+')}' --compressed > 'data/#{interval}.html'`
  end
end

