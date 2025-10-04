import moment from 'moment';
import { XMLParser } from 'fast-xml-parser';
import axios from 'axios';

const ECB_URL = 'https://www.bank.lv/vk/ecb.xml';
const ECB_DATE_FORMAT = 'YYYYMMDD';
const DATE_FORMAT = 'YYYY-MM-DD';

export class EuropeRatesProvider {
  constructor() {
    this.parser = null;
  }

  async init() {
    this.parser = new XMLParser();
  }

  async dispose() {
    if (this.parser) {
      this.parser = null;
    }
  }

  getMainCurrency() {
    return 'EUR';
  }

  async getRates(date) {
    if (!this.parser) {
      throw new Error("Europe provider wasn't initialized properly.");
    }

    const formattedDate = moment(date, DATE_FORMAT).format(ECB_DATE_FORMAT);
    const url = `${ECB_URL}?date=${formattedDate}`;
    
    const response = await axios.get(url);
    const data = this.parser.parse(response.data);
    const rates = data?.CRates?.Currencies?.Currency;
    
    if (!rates || !Array.isArray(rates)) {
      throw new Error('ECB Rates gathering issue.');
    }

    const result = {};
    rates.forEach(rate => {
      const currency = rate.ID;
      const rateValue = rate.Rate;
      result[currency] = rateValue.toString();
    });
    
    return result;
  }
}

