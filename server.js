require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to your online Supabase database
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Allow frontend communication
app.use(cors());
app.use(express.json());

// Endpoint 1: Fetch fundamental metrics for all 20 companies
app.get('/stocks', async (req, res) => {
    try {
        const { data, error } = await supabase.from('stocks').select('*');
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint 2: Fetch detailed info + 1 year history for a single company
app.get('/stocks/:ticker', async (req, res) => {
    try {
        const { ticker } = req.params;
        
        // Fetch fundamental data
        const { data: stock, error: stockErr } = await supabase.from('stocks').select('*').eq('ticker', ticker).single();
        if (stockErr) throw stockErr;

        // Fetch historical trends for graphs (sorted by date)
        const { data: history, error: histErr } = await supabase.from('historical_prices').select('date, close_price').eq('ticker', ticker).order('date', { ascending: true });
        if (histErr) throw histErr;

        res.json({ ...stock, history });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint 3: Fetch an aggregated view (highest price, lowest PE, total market value)
app.get('/market-summary', async (req, res) => {
    try {
        const { data: stocks, error } = await supabase.from('stocks').select('*');
        if (error) throw error;

        // Basic backend mathematical analytics for dashboard cards
        const totalCompanies = stocks.length;
        const highestPriceStock = stocks.reduce((max, s) => s.price > max.price ? s : max, stocks[0]);
        const lowestPEStock = stocks.filter(s => s.pe_ratio).reduce((min, s) => s.pe_ratio < min.pe_ratio ? s : min, stocks[0]);

        res.json({
            totalCompanies,
            highestPrice: { ticker: highestPriceStock.ticker, price: highestPriceStock.price },
            bestValue: { ticker: lowestPEStock.ticker, pe: lowestPEStock.pe_ratio }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start listening for network requests
app.listen(PORT, () => {
    console.log(`Server successfully active on http://localhost:${PORT}`);
});