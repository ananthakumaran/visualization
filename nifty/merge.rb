require 'pp'

def row(line)
  line.strip.split(',')
end

def header?(row)
  row[1] == 'Symbol' ||
    row[0] == 'Symbol'
end

def empty?(row)
  row[0] == '""'
end

def merge(prev, current)
  if prev[1] == ''
    missing = prev[2]
    if current[2] == ''
      current[2] = missing
    else
      current[2] = missing + ' ' + current[2]
    end
  else
    missing = prev[1]
    if current[1] == ''
      current[1] = missing
    else
      current[1] = missing + ' ' + current[1]
    end
  end
  current
end

def clean(row)
  row.select { |x| x != '' }
end



prev = nil
puts 'Symbol,Security Name,Industry,Close Price,Index Mcap (Rs. Crores),Weightage(%)'
$stdin.each_line do |line|
  current = row(line)
  next if header?(current)
  if !empty?(current)
    if prev
      current = merge(prev, current)
      prev = nil
    end
    # pp current
    puts clean(current).join(',')
  else
    # pp current
    prev = current
  end
end
