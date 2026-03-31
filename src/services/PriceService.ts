import { PriceData } from '../models/types';

export class PriceService {
  static alphaApiKey = process.env.EXPO_PUBLIC_ALPHA_VANTAGE_API_KEY || 'SWQRNMYI0MA4ZYVJ';
  static finnhubApiKey = process.env.EXPO_PUBLIC_FINNHUB_API_KEY || '';

  /**
   * Universal fetcher that routes to correct API based on region
   */
  static async fetchLivePrice(ticker: string, region: 'US' | 'IN'): Promise<PriceData> {
      if (region === 'US') {
          return this.fetchFinnhubPrice(ticker);
      } else {
          return this.fetchAlphaVantagePrice(ticker);
      }
  }

  /**
   * FINNHUB API for US Stocks
   */
  static async fetchFinnhubPrice(ticker: string): Promise<PriceData> {
      if (!this.finnhubApiKey) {
          throw new Error("Missing Finnhub API Key");
      }

      const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${this.finnhubApiKey}`;
      
      try {
          const response = await fetch(url);
          const data = await response.json();
          
          if (data.c === 0 && data.d === null && data.dp === null) {
              throw new Error(`Ticker ${ticker} not found on Finnhub.`);
          }

          return {
              currentPrice: data.c,
              previousPrice: data.pc,
              dailyChangePercent: data.dp
          };
      } catch (error: any) {
          console.error(`Finnhub Error for ${ticker}:`, error.message);
          throw new Error(`Failed to fetch Finnhub API for ${ticker}. Check your connection or ticker.`);
      }
  }

  /**
   * ALPHA VANTAGE API for Indian Stocks
   */
  static async fetchAlphaVantagePrice(ticker: string): Promise<PriceData> {
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&outputsize=compact&apikey=${this.alphaApiKey}`;
      
      try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.Information || data.Note) {
            console.warn('AlphaVantage Rate Limit:', data);
            throw new Error(`AlphaVantage API limit reached for ${ticker}.`);
        }

        if (data['Error Message']) {
            throw new Error(`Ticker ${ticker} not found on AlphaVantage.`);
        }

        const timeSeries = data['Time Series (Daily)'];
        if (!timeSeries) throw new Error(`Invalid or missing Time Series data for ${ticker}.`);

        const dates = Object.keys(timeSeries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        
        if (dates.length > 0) {
            const currentPrice = parseFloat(timeSeries[dates[0]]['4. close']);
            const previousPrice = dates.length > 1 ? parseFloat(timeSeries[dates[1]]['4. close']) : currentPrice;
            const dailyChangePercent = previousPrice === 0 ? 0 : ((currentPrice - previousPrice) / previousPrice) * 100;

            return { currentPrice, previousPrice, dailyChangePercent };
        } else {
            throw new Error(`No recent trading data for ${ticker}`);
        }
      } catch (error: any) {
        console.error(`AlphaVantage Error for ${ticker}:`, error.message);
        throw error;
      }
  }
  static async searchTicker(query: string, region: 'US' | 'IN'): Promise<{ symbol: string, name: string, type: string }[]> {
      const trimmed = query.trim();
      if (!trimmed) return [];

      try {
          if (region === 'US') {
              if (!this.finnhubApiKey) throw new Error("Missing Finnhub API Key");
              const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(trimmed)}&token=${this.finnhubApiKey}`;
              const res = await fetch(url);
              const json = await res.json();
              if (json.result && json.result.length > 0) {
                  return json.result.map((item: any) => ({
                      symbol: item.symbol,
                      name: item.description,
                      type: item.type
                  }));
              }
          } else {
              const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(trimmed)}&apikey=${this.alphaApiKey}`;
              const res = await fetch(url);
              const json = await res.json();
              if (json.bestMatches && json.bestMatches.length > 0) {
                  return json.bestMatches.map((item: any) => ({
                      symbol: item['1. symbol'],
                      name: item['2. name'],
                      type: item['3. type']
                  }));
              }
          }
      } catch (e) {
          console.error("Search API Error:", e);
      }
      return [];
  }
}
