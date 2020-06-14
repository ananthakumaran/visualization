require 'date'

categories = {equity: "SEQ", debt: "SDT", hybrid: "SHY", solution: "SSO", other: "SOTH"}
sub_categories = {
  'SEQ_LC' => 'Large Cap',
  'SEQ_LMC' => 'Large &amp; Mid Cap',
  'SEQ_MLC' => 'Multi Cap',
  'SEQ_MC' => 'Mid Cap',
  'SEQ_SC' => 'Small Cap',
  'SEQ_VAL' => 'Value',
  'SEQ_ELSS' => 'ELSS',
  'SEQ_CONT' => 'Contra',
  'SEQ_DIVY' => 'Dividend Yield',
  'SEQ_FOC' => 'Focused',
  'SEQ_SCTH' => 'Sectoral / Thematic',
  'SSO_CHILD' => "Children's",
  'SSO_RETR' => 'Retirement',
  'SOTH_IXETF' => 'Index Funds/ ETFs',
  'SOTH_FOFS' => 'FoFs (Overseas/Domestic)',
  'SDT_LND' => 'Long Duration',
  'SDT_MLD' => 'Medium to Long Duration',
  'SDT_MD' => 'Medium Duration',
  'SDT_SD' => 'Short Duration',
  'SDT_LWD' => 'Low Duration',
  'SDT_USD' => 'Ultra Short Duration',
  'SDT_LIQ' => 'Liquid',
  'SDT_MM' => 'Money Market',
  'SDT_OVNT' => 'Overnight',
  'SDT_DB' => 'Dynamic Bond',
  'SDT_CB' => 'Corporate Bond',
  'SDT_CR' => 'Credit Risk',
  'SDT_BPSU' => 'Banking and PSU',
  'SDT_FL' => 'Floater',
  'SDT_FMP' => 'FMP',
  'SDT_GL' => 'Gilt',
  'SDT_GL10CD' => 'Gilt with 10 year constant duration',
  'SHY_AH' => 'Aggressive Hybrid',
  'SHY_BH' => 'Balanced Hybrid',
  'SHY_CH' => 'Conservative Hybrid',
  'SHY_EQS' => 'Equity Savings',
  'SHY_AR' => 'Arbitrage',
  'SHY_MAA' => 'Multi Asset Allocation',
  'SHY_DAABA' => 'Dynamic Asset Allocation or Balanced Advantage'
}

def download(sub_category, date)
  category, _ = sub_category.split("_")
  date_string = date.strftime("%d-%b-%Y")
  puts "downloading #{sub_category}-#{date_string}"
  puts `curl -s 'https://www.valueresearchonline.com/amfi/fund-performance-data/?end-type=1&primary-category=#{category}&category=#{sub_category}&amc=ALL&nav-date=#{date_string}' > data/#{sub_category}:#{date_string}.html`
end

debt_categories = [
  'SDT_LND',
  'SDT_MLD',
  'SDT_MD',
  'SDT_SD',
  'SDT_LWD',
  'SDT_USD',
  'SDT_LIQ',
  'SDT_MM',
  'SDT_OVNT',
  'SDT_DB',
  'SDT_CB',
  'SDT_CR',
  'SDT_BPSU',
  'SDT_FL',
  'SDT_FMP',
  'SDT_GL',
  'SDT_GL10CD',
  'SHY_AR'
]
debt_categories.each do |sub_category|
  start = Date.new(2020, 5, 15)
  today = Date.today
  while start < today
    download(sub_category, start)
    start = start.next_day
  end
end
