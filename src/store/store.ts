import { create } from 'zustand';
import { Asset, Portfolio, PriceData, Transaction } from '../models/types';
import {
    getPortfolios, createPortfolio, updatePortfolio,
    getAllAssets, createAsset, updateAsset, deleteAsset,
    getTransactions, createTransaction, updateTransaction, deleteTransaction
} from '../db/DatabaseService';
import { PriceService } from '../services/PriceService';
import { Alert } from 'react-native';

interface AppState {
    portfolios: Portfolio[];
    assets: Asset[];
    transactions: Transaction[];
    livePrices: Record<string, PriceData>;
    loading: boolean;
    syncing: boolean; // separate state for manual sync
    loadData: () => void;
    addPortfolio: (name: string) => void;
    editPortfolio: (id: number, name: string) => void;
    addAsset: (asset: Asset) => Promise<void>;
    editAsset: (id: number, asset: Asset) => Promise<void>;
    removeAsset: (id: number, portfolioId: number, tickerSymbol: string) => void;
    addManualTransaction: (tx: Transaction) => void;
    editTransaction: (id: number, tx: Transaction) => void;
    removeTransaction: (id: number) => void;
    syncPrices: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
    portfolios: [],
    assets: [],
    transactions: [],
    livePrices: {},
    loading: true,
    syncing: false,

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
                    region: 'US',
                    assetType: 'Stock' as any,
                    totalUnits: 1,
                    averageCost: 325.23,
                    totalInvested: 325.23,
                    currentValue: 302.35
                });
                createAsset({
                    portfolioId: pf1,
                    tickerSymbol: 'ASML',
                    name: 'ASML Holding',
                    region: 'US',
                    assetType: 'Stock' as any,
                    totalUnits: 1,
                    averageCost: 216.82,
                    totalInvested: 216.82,
                    currentValue: 206.24
                });
                createAsset({
                    portfolioId: pf1,
                    tickerSymbol: 'SMH',
                    name: 'VanEck Semiconductor ETF',
                    region: 'US',
                    assetType: 'ETF' as any,
                    totalUnits: 1,
                    averageCost: 337.60,
                    totalInvested: 337.60,
                    currentValue: 337.01
                });
                createAsset({
                    portfolioId: pf1,
                    tickerSymbol: 'EWY',
                    name: 'iShares MSCI South Korea ETF',
                    region: 'US',
                    assetType: 'ETF' as any,
                    totalUnits: 1,
                    averageCost: 433.64,
                    totalInvested: 433.64,
                    currentValue: 415.52
                });
            }
            ports = getPortfolios();
        }

        const assets = getAllAssets();
        const transactions = getTransactions();

        // Reconstruct livePrices purely from DB cache to prevent $0 values when offline/unsynced
        const cachedPrices: Record<string, PriceData> = {};
        assets.forEach(a => {
            if (a.dailyChangePercent !== undefined) {
                // We only need dailyChangePercent for the metric UI
                cachedPrices[a.tickerSymbol] = {
                    currentPrice: a.totalUnits > 0 ? a.currentValue / a.totalUnits : a.currentValue,
                    previousPrice: a.totalUnits > 0 ? a.currentValue / a.totalUnits : a.currentValue,
                    dailyChangePercent: a.dailyChangePercent || 0
                };
            }
        });

        set({ portfolios: ports, assets, transactions, livePrices: cachedPrices, loading: false });
    },

    addPortfolio: (name: string) => {
        createPortfolio(name, 'USD');
        set({ portfolios: getPortfolios() });
    },

    editPortfolio: (id: number, name: string) => {
        updatePortfolio(id, name);
        set({ portfolios: getPortfolios() });
    },

    addAsset: async (asset: Asset) => {
        try {
            // Test API connection immediately
            const priceData = await PriceService.fetchLivePrice(asset.tickerSymbol, asset.region);
            
            // Cache the retrieved percent in SQLite so it survives restarts
            asset.dailyChangePercent = priceData.dailyChangePercent;
            createAsset(asset);
            
            const { livePrices } = get();
            set({ 
                assets: getAllAssets(),
                livePrices: { ...livePrices, [asset.tickerSymbol]: priceData }
            });

        } catch (error: any) {
            // Re-throw to UI for Alert display
            throw error;
        }
    },

    editAsset: async (id: number, asset: Asset) => {
        try {
            // Re-verify in case they changed the ticker
            const priceData = await PriceService.fetchLivePrice(asset.tickerSymbol, asset.region);
            
            asset.dailyChangePercent = priceData.dailyChangePercent;
            updateAsset(id, asset);
            
            const { livePrices } = get();
            set({ 
                assets: getAllAssets(),
                livePrices: { ...livePrices, [asset.tickerSymbol]: priceData }
            });
        } catch (error: any) {
            throw error;
        }
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

    syncPrices: async () => {
        set({ syncing: true });
        const { assets, livePrices } = get();
        const updatedPrices = { ...livePrices };
        let hasErrors = false;

        for (const asset of assets) {
            try {
                const priceData = await PriceService.fetchLivePrice(asset.tickerSymbol, asset.region);
                updatedPrices[asset.tickerSymbol] = priceData;
                
                // Recalculate current value automatically since market price changed
                asset.currentValue = priceData.currentPrice * (asset.totalUnits || 0);
                asset.dailyChangePercent = priceData.dailyChangePercent;
                
                updateAsset(asset.id!, asset);
            } catch (e) {
                hasErrors = true;
            }
        }
        
        set({ livePrices: updatedPrices, assets: getAllAssets(), syncing: false });

        if (hasErrors) {
            Alert.alert(
                "Sync Complete with Errors", 
                "Some assets failed to sync. Please ensure their tickers and regions are correct."
            );
        }
    }
}));
