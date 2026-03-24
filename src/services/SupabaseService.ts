import { supabase } from './supabaseClient';
import { Portfolio, Asset, Transaction } from '../models/types';

/**
 * SupabaseService — A cloud mirror of DatabaseService.
 * 
 * All operations are scoped to a user_id (when auth is added later).
 * For now, we use a single hardcoded user_id for cloud sync.
 */

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

// ─── Portfolios ────────────────────────────────────────────

export const cloudGetPortfolios = async (): Promise<any[]> => {
    const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', DEFAULT_USER_ID)
        .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const cloudUpsertPortfolio = async (portfolio: Portfolio): Promise<void> => {
    const { error } = await supabase
        .from('portfolios')
        .upsert({
            id: portfolio.id?.toString(),
            user_id: DEFAULT_USER_ID,
            name: portfolio.name,
            currency: portfolio.currency || 'USD',
        }, { onConflict: 'id' });
    if (error) throw error;
};

// ─── Assets ────────────────────────────────────────────────

export const cloudGetAssets = async (): Promise<any[]> => {
    const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const cloudUpsertAsset = async (asset: Asset, cloudPortfolioId: string): Promise<void> => {
    const { error } = await supabase
        .from('assets')
        .upsert({
            id: asset.id?.toString(),
            portfolio_id: cloudPortfolioId,
            ticker_symbol: asset.tickerSymbol,
            name: asset.name || '',
            asset_type: asset.assetType,
            region: asset.region || 'US',
            total_units: asset.totalUnits || 0,
            average_cost: asset.averageCost || 0,
            total_invested: asset.totalInvested || 0,
            current_value: asset.currentValue || 0,
            daily_change_percent: asset.dailyChangePercent || 0,
        }, { onConflict: 'id' });
    if (error) throw error;
};

// ─── Transactions ──────────────────────────────────────────

export const cloudGetTransactions = async (): Promise<any[]> => {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const cloudUpsertTransaction = async (tx: Transaction, cloudPortfolioId: string): Promise<void> => {
    const { error } = await supabase
        .from('transactions')
        .upsert({
            id: tx.id?.toString(),
            portfolio_id: cloudPortfolioId,
            ticker_symbol: tx.tickerSymbol,
            name: tx.name || '',
            type: tx.type,
            units: tx.units,
            price: tx.price,
            date: tx.date,
        }, { onConflict: 'id' });
    if (error) throw error;
};

// ─── Full Sync (Push Local → Cloud) ───────────────────────

export const pushToCloud = async (
    portfolios: Portfolio[],
    assets: Asset[],
    transactions: Transaction[]
): Promise<{ success: boolean; error?: string }> => {
    try {
        // 1. Push all portfolios
        for (const p of portfolios) {
            await cloudUpsertPortfolio(p);
        }

        // 2. Push all assets (map local portfolioId to cloud)
        for (const a of assets) {
            await cloudUpsertAsset(a, a.portfolioId.toString());
        }

        // 3. Push all transactions
        for (const tx of transactions) {
            await cloudUpsertTransaction(tx, tx.portfolioId.toString());
        }

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message || 'Cloud sync failed' };
    }
};

// ─── Full Sync (Pull Cloud → Local) ──────────────────────

export const pullFromCloud = async (): Promise<{
    portfolios: any[];
    assets: any[];
    transactions: any[];
} | null> => {
    try {
        const portfolios = await cloudGetPortfolios();
        const assets = await cloudGetAssets();
        const transactions = await cloudGetTransactions();
        return { portfolios, assets, transactions };
    } catch (e: any) {
        return null;
    }
};
