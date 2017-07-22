require 'pp'

def month(str)
  str.gsub('.html', '').split(/[ -]/).reject {|x| x == ""}.last(2).join('-')
end

Dir.glob('data/*.html').each do |html|
  base = File.basename(html)
  puts html
  loop do
    table = `pup table < '#{html}'`
    IO.write("data/clean/#{month(base)}.html", table)
    break if $? == 0
  end
end

