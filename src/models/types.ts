export enum AssetType { Stock = "Stock", ETF = "ETF", MF = "MF" }

export interface Portfolio {
  id?: number;
  name: string;
  currency: string;
}

export interface Asset {
  id?: number;
  portfolioId: number;
  tickerSymbol: string;
  name?: string;
  region: 'US' | 'IN';
  assetType: AssetType;
  totalUnits: number;
  averageCost: number;
  totalInvested: number;
  currentValue: number;
  dailyChangePercent?: number;
}

export interface PriceData {
  currentPrice: number;
  previousPrice: number;
  dailyChangePercent: number;
}

export interface Transaction {
  id?: number;
  portfolioId: number;
  tickerSymbol: string;
  name?: string;
  type: 'buy' | 'sell';
  units: number;
  price: number;
  date: string;
}

export interface PortfolioStats {
  assetCount: number;
  totalInvested: number;
  currentValue: number;
  gain: number;
  gainPercent: number;
}
