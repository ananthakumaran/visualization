require 'date'
require 'pp'

start = Date.new(2014, 3)
today = Date.today

while start < today
  puts `cd data && wget http://amc.ppfas.com/downloads/portfolio-disclosure/Monthly-Portfolio-#{start.strftime("%B-%Y")}.xls`
  start = start.next_month
end
