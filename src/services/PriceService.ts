import { PriceData } from '../models/types';

export class PriceService {
  static apiKey = 'SWQRNMYI0MA4ZYVJ';

  static async fetchLivePrice(ticker: string): Promise<PriceData> {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&outputsize=compact&apikey=${this.apiKey}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.Information || data.Note) {
        console.warn('API Notice / Rate Limit:', data);
        return { currentPrice: 100, previousPrice: 95, dailyChangePercent: 5.26 }; // Fallback
      }

      const timeSeries = data['Time Series (Daily)'];
      if (!timeSeries) throw new Error('Invalid or missing Time Series data');

      const dates = Object.keys(timeSeries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      
      if (dates.length > 0) {
        const currentPrice = parseFloat(timeSeries[dates[0]]['4. close']);
        const previousPrice = dates.length > 1 ? parseFloat(timeSeries[dates[1]]['4. close']) : currentPrice;
        
        const dailyChangePercent = previousPrice === 0 ? 0 : ((currentPrice - previousPrice) / previousPrice) * 100;

        return { currentPrice, previousPrice, dailyChangePercent };
      }
    } catch (error) {
      console.error(`Error fetching real price for ${ticker}`, error);
    }
    
    return { currentPrice: 100, previousPrice: 95, dailyChangePercent: 5.26 };
  }
}
