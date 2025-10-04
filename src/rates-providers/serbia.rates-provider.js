import moment from 'moment';
import axios from 'axios';

const NBS_PAGE_URL = 'https://webappcenter.nbs.rs/ExchangeRateWebApp/ExchangeRate/IndexByDate';
const NBS_DATE_FORMAT = 'DD.MM.YYYY.';
const DATE_FORMAT = 'YYYY-MM-DD';

export class SerbiaRatesProvider {
  async init() {
    // No initialization needed for HTTP requests
  }

  async dispose() {
    // No cleanup needed for HTTP requests
  }

  getMainCurrency() {
    return 'RSD';
  }

  async getRates(date) {
    const formattedDate = moment(date, DATE_FORMAT).format(NBS_DATE_FORMAT);
    const url = `${NBS_PAGE_URL}?isSearchExecuted=true&Date=${formattedDate}&ExchangeRateListTypeID=3`;
    
    const response = await axios.get(url);
    
    if (!response.data) {
      throw new Error('NBS Rates gathering issue - no data received.');
    }

    // Parse HTML to extract rates
    const html = response.data;
    const rates = {};

    // Extract table rows using regex
    // The table has structure: <tr><td>CURRENCY</td><td>CODE</td><td>COUNTRY</td><td>UNIT</td><td>RATE</td></tr>
    const tableRowRegex = /<td>([A-Z]{3})<\/td>\s*<td>\d+<\/td>\s*<td>.*?<\/td>\s*<td>(\d+)<\/td>\s*<td>([\d,]+)<\/td>/g;
    
    let match;
    while ((match = tableRowRegex.exec(html)) !== null) {
      const currency = match[1];
      const unit = parseInt(match[2]);
      const rate = parseFloat(match[3].replace(',', '.'));
      
      // Normalize rate to 1 unit of currency
      const normalizedRate = unit === 1 ? rate : rate / unit;
      rates[currency] = normalizedRate.toString();
    }

    if (Object.keys(rates).length === 0) {
      throw new Error('NBS Rates gathering issue - no rates found in response.');
    }

    return rates;
  }
}

