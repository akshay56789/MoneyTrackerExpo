import * as SQLite from 'expo-sqlite';
import { Asset, Portfolio, Transaction } from '../models/types';

const db = SQLite.openDatabaseSync('moneytracker.db');

export const initDB = () => {
    db.execSync(`
        CREATE TABLE IF NOT EXISTS portfolios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            currency TEXT NOT NULL
        );
    `);
    db.execSync(`
        CREATE TABLE IF NOT EXISTS assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            portfolioId INTEGER NOT NULL,
            tickerSymbol TEXT NOT NULL,
            assetType TEXT NOT NULL,
            totalUnits REAL NOT NULL DEFAULT 1,
            averageCost REAL NOT NULL DEFAULT 0
        );
    `);
    db.execSync(`
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            portfolioId INTEGER NOT NULL,
            tickerSymbol TEXT NOT NULL,
            type TEXT NOT NULL,
            units REAL NOT NULL,
            price REAL NOT NULL,
            date TEXT NOT NULL
        );
    `);
    
    // Migrations
    try { db.execSync(`ALTER TABLE assets ADD COLUMN name TEXT;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE assets ADD COLUMN currentPrice REAL;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE transactions ADD COLUMN name TEXT;`); } catch (e) {}
    
    // Phase 3 migrations: moving to value-based tracking
    try { db.execSync(`ALTER TABLE assets ADD COLUMN totalInvested REAL DEFAULT 0;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE assets ADD COLUMN currentValue REAL DEFAULT 0;`); } catch (e) {}
};

export const getPortfolios = (): Portfolio[] => {
    return db.getAllSync<Portfolio>(`SELECT * FROM portfolios;`);
};

export const createPortfolio = (name: string, currency: string): number => {
    const result = db.runSync(
        `INSERT INTO portfolios (name, currency) VALUES (?, ?);`,
        name, currency
    );
    return result.lastInsertRowId;
};

export const updatePortfolio = (id: number, name: string): void => {
    db.runSync(
        `UPDATE portfolios SET name = ? WHERE id = ?;`,
        name, id
    );
};

export const getAssetsByPortfolio = (portfolioId: number): Asset[] => {
    return db.getAllSync<Asset>(
        `SELECT * FROM assets WHERE portfolioId = ?;`,
        portfolioId
    );
};

export const getAllAssets = (): Asset[] => {
    return db.getAllSync<Asset>(`SELECT * FROM assets;`);
};

export const createAsset = (asset: Asset): number => {
    const invested = asset.totalInvested || 0;
    const value = asset.currentValue || 0;
    
    const result = db.runSync(
        `INSERT INTO assets (portfolioId, tickerSymbol, name, assetType, totalInvested, currentValue, totalUnits, averageCost) VALUES (?, ?, ?, ?, ?, ?, 1, 0);`,
        asset.portfolioId, asset.tickerSymbol, asset.name || '', asset.assetType, invested, value
    );
    return result.lastInsertRowId;
};

export const updateAsset = (id: number, asset: Asset): void => {
    const invested = asset.totalInvested || 0;
    const value = asset.currentValue || 0;
    
    db.runSync(
        `UPDATE assets SET tickerSymbol = ?, name = ?, assetType = ?, totalInvested = ?, currentValue = ?, totalUnits = 1, averageCost = 0 WHERE id = ?;`,
        asset.tickerSymbol, asset.name || '', asset.assetType, invested, value, id
    );
}

export const deleteAsset = (id: number, portfolioId: number, tickerSymbol: string): void => {
    db.runSync(`DELETE FROM assets WHERE id = ?;`, id);
    db.runSync(`DELETE FROM transactions WHERE portfolioId = ? AND tickerSymbol = ?;`, portfolioId, tickerSymbol);
};

// ... Transactions remain unchanged ...
export const getTransactions = (portfolioId?: number): Transaction[] => {
    if (portfolioId) {
        return db.getAllSync<Transaction>(
            `SELECT * FROM transactions WHERE portfolioId = ? ORDER BY date DESC;`,
            portfolioId
        );
    }
    return db.getAllSync<Transaction>(`SELECT * FROM transactions ORDER BY date DESC;`);
};

export const createTransaction = (tx: Transaction): number => {
    const result = db.runSync(
        `INSERT INTO transactions (portfolioId, tickerSymbol, name, type, units, price, date) VALUES (?, ?, ?, ?, ?, ?, ?);`,
        tx.portfolioId, tx.tickerSymbol, tx.name || '', tx.type, tx.units, tx.price, tx.date
    );
    return result.lastInsertRowId;
};

export const updateTransaction = (id: number, tx: Transaction): void => {
    db.runSync(
        `UPDATE transactions SET tickerSymbol = ?, name = ?, type = ?, units = ?, price = ?, date = ? WHERE id = ?;`,
        tx.tickerSymbol, tx.name || '', tx.type, tx.units, tx.price, tx.date, id
    );
};

export const deleteTransaction = (id: number): void => {
    db.runSync(`DELETE FROM transactions WHERE id = ?;`, id);
};
