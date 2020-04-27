require 'pry'
require 'nokogiri'
require 'json'
require 'date'

funds = {}

Dir.glob("data/*.html").each do |path|
  category, date = File.basename(path, ".html").split(":")
  html = IO.read(path)
  if html =~ /The underlying data is unavailable./
    puts "ignoring #{date}"
  else
    doc = Nokogiri::XML(html)
    names = doc.xpath('//tbody/tr/td[1]').children.to_a.filter { |n| n.name == "text" }.map(&:text)
    values = doc.xpath('//tbody/tr/td[last()]').children.map(&:text)
    names.zip(values).each do |name, value|
      unless funds[name]
        funds[name] = {
          'category' => category,
          'aum' => {}
        }
      end
      funds[name]['aum'][date] = value
    end
  end
end

results = []
funds.each do |name, fund|
  results << {
    name: name,
    category: fund['category'],
    points: fund['aum'].map do |date, value|
      [Date.parse(date).to_time.to_i, value.gsub(',', '').strip.to_f]
    end.sort
  }
end

IO.write("funds.json", JSON.pretty_generate(funds))

IO.write("data.json", JSON.pretty_generate(results))
