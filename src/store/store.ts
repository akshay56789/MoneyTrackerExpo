import { create } from 'zustand';
import { Asset, Portfolio, PriceData, Transaction } from '../models/types';
import {
    getPortfolios, createPortfolio, updatePortfolio,
    getAllAssets, createAsset, updateAsset, deleteAsset,
    getTransactions, createTransaction, updateTransaction, deleteTransaction
} from '../db/DatabaseService';
import { PriceService } from '../services/PriceService';

interface AppState {
    portfolios: Portfolio[];
    assets: Asset[];
    transactions: Transaction[];
    livePrices: Record<string, PriceData>;
    loading: boolean;
    loadData: () => void;
    addPortfolio: (name: string) => void;
    editPortfolio: (id: number, name: string) => void;
    addAsset: (asset: Asset) => void;
    editAsset: (id: number, asset: Asset) => void;
    removeAsset: (id: number, portfolioId: number, tickerSymbol: string) => void;
    addManualTransaction: (tx: Transaction) => void;
    editTransaction: (id: number, tx: Transaction) => void;
    removeTransaction: (id: number) => void;
    fetchPrices: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
    portfolios: [],
    assets: [],
    transactions: [],
    livePrices: {},
    loading: true,

    loadData: () => {
        set({ loading: true });
        let ports = getPortfolios();

        // Seed dummy data if no portfolios (other than maybe the default one with no assets) exist
        if (ports.length === 0 || (ports.length === 1 && getAllAssets().length === 0)) {
            // Clear if only the default one exists to start fresh with nice dummy data
            if (ports.length === 0) {
                const pf1 = createPortfolio('Tech Growth', 'USD');
                const pf2 = createPortfolio('Retirement Fund', 'USD');

                createAsset({
                    portfolioId: pf1,
                    tickerSymbol: 'NVDA',
                    name: 'NVIDIA Corporation',
                    assetType: 'Stock' as any,
                    totalInvested: 325.23,
                    currentValue: 302.35
                });
                createAsset({
                    portfolioId: pf1,
                    tickerSymbol: 'ASML',
                    name: 'ASML Holding',
                    assetType: 'Stock' as any,
                    totalInvested: 216.82,
                    currentValue: 206.24
                });
                createAsset({
                    portfolioId: pf1,
                    tickerSymbol: 'SMH',
                    name: 'VanEck Semiconductor ETF',
                    assetType: 'ETF' as any,
                    totalInvested: 337.60,
                    currentValue: 337.01
                });
                createAsset({
                    portfolioId: pf1,
                    tickerSymbol: 'EWY',
                    name: 'iShares MSCI South Korea ETF',
                    assetType: 'ETF' as any,
                    totalInvested: 433.64,
                    currentValue: 415.52
                });
            }
            ports = getPortfolios();
        }

        const assets = getAllAssets();
        const transactions = getTransactions();

        set({ portfolios: ports, assets, transactions, loading: false });
        get().fetchPrices();
    },

    addPortfolio: (name: string) => {
        createPortfolio(name, 'USD');
        set({ portfolios: getPortfolios() });
    },

    editPortfolio: (id: number, name: string) => {
        updatePortfolio(id, name);
        set({ portfolios: getPortfolios() });
    },

    addAsset: (asset: Asset) => {
        createAsset(asset);
        // Deprecating auto-transactions since units/price don't map cleanly to raw value tracking anymore
        set({ assets: getAllAssets() });
        get().fetchPrices();
    },

    editAsset: (id: number, asset: Asset) => {
        updateAsset(id, asset);
        set({ assets: getAllAssets() });
        get().fetchPrices();
    },

    removeAsset: (id: number, portfolioId: number, tickerSymbol: string) => {
        deleteAsset(id, portfolioId, tickerSymbol);
        set({ assets: getAllAssets(), transactions: getTransactions() });
    },

    addManualTransaction: (tx: Transaction) => {
        createTransaction(tx);
        set({ transactions: getTransactions() });
    },

    editTransaction: (id: number, tx: Transaction) => {
        updateTransaction(id, tx);
        set({ transactions: getTransactions() });
    },

    removeTransaction: (id: number) => {
        deleteTransaction(id);
        set({ transactions: getTransactions() });
    },

    fetchPrices: async () => {
        // With value-based tracking instead of unit-based tracking, the live AlphaVantage API
        // can still fetch the 1-Day % return for the ticker, which we apply to the current value.
        const { assets, livePrices } = get();
        const updatedPrices = { ...livePrices };

        for (const asset of assets) {
            if (!updatedPrices[asset.tickerSymbol]) {
                try {
                    const priceData = await PriceService.fetchLivePrice(asset.tickerSymbol);
                    updatedPrices[asset.tickerSymbol] = priceData;
                } catch (e) {
                    updatedPrices[asset.tickerSymbol] = {
                        currentPrice: asset.currentValue,
                        previousPrice: asset.currentValue,
                        dailyChangePercent: 0
                    };
                }
            }
        }
        set({ livePrices: updatedPrices });
    }
}));
