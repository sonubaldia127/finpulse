require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const YahooFinance = require('yahoo-finance2').default;

// Instantiate YahooFinance with notice suppression directly in the constructor
const yahooFinance = new YahooFinance({
    suppressNotices: ['yahooSurvey', 'ripHistorical']
});

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// The 20 specific Energy/Power sector tickers
const tickers = [
    'NTPC.NS', 'POWERGRID.NS', 'TATAPOWER.NS', 'ADANIPOWER.NS', 'ADANIGREEN.NS',
    'WAAREERTL.NS', 'DEEPINDS.NS', 'UTLSOLAR.NS', 'PRABHA.NS', 'JSWENERGY.NS',
    'NHPC.NS', 'SJVN.NS', 'RECLTD.NS', 'PFC.NS', 'IREDA.NS',
    'CESC.NS', 'TORNTPOWER.NS', 'SUZLON.NS', 'KPIGREEN.NS', 'KEC.NS'
];

async function syncRealData() {
    console.log(`[${new Date().toISOString()}] Starting live data sync...`);
    
    try {
        // Wipe old records to prevent duplicates/unique key collisions
        console.log("Emptying old table records for a clean sync...");
        await supabase.from('historical_prices').delete().neq('ticker', 'TEMP_SEED');
        await supabase.from('stocks').delete().neq('ticker', 'TEMP_SEED');

        console.log("Fetching real-time and 1-Year historical data from Yahoo Finance...\n");

        const today = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        
        const formatDate = (date) => date.toISOString().split('T')[0];

        for (const ticker of tickers) {
            try {
                // 1. Fetch real-time fundamentals
                const quote = await yahooFinance.quote(ticker);
                
                const name = quote.longName || quote.shortName || ticker;
                const price = quote.regularMarketPrice || 0;
                const rawMarketCap = quote.marketCap;
                
                let marketCap = 'N/A';
                if (rawMarketCap) {
                    if (rawMarketCap >= 1e12) {
                        marketCap = (rawMarketCap / 1e12).toFixed(2) + 'T';
                    } else {
                        marketCap = (rawMarketCap / 1e7).toFixed(2) + ' Cr'; // Crores
                    }
                }

                const peRatio = quote.trailingPE || quote.forwardPE || null;
                const eps = quote.epsTrailingTwelveMonths || null;

                // Save live fundamental stock data to Supabase
                const { error: stockErr } = await supabase.from('stocks').upsert({
                    ticker, name, price, market_cap: marketCap, pe_ratio: peRatio, eps
                });
                if (stockErr) throw stockErr;

                // 2. Fetch genuine 1-Year daily historical data using chart()
                const chartData = await yahooFinance.chart(ticker, {
                    period1: formatDate(oneYearAgo),
                    period2: formatDate(today),
                    interval: '1d'
                });

                const quotes = chartData.quotes || [];

                if (quotes.length === 0) {
                    console.log(`⚠ No historical data available for ${ticker}`);
                    continue;
                }

                // Map and safely filter out invalid quotes
                const priceRows = quotes
                    .filter(day => day && day.date && day.close !== null && day.close !== undefined)
                    .map(day => ({
                        ticker,
                        date: day.date instanceof Date ? day.date.toISOString().split('T')[0] : new Date(day.date).toISOString().split('T')[0],
                        close_price: Number(day.close.toFixed(2))
                    }));

                // Upload clean price rows
                if (priceRows.length > 0) {
                    const { error: histErr } = await supabase.from('historical_prices').insert(priceRows);
                    if (histErr) throw histErr;
                }

                console.log(`✓ Live data synced for ${ticker}`);

            } catch (error) {
                console.error(`✕ Failed to sync ${ticker}: ${error.message}`);
            }

            // 500ms rate limit buffer
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log("\nDatabase populated perfectly with real data!");
        process.exit(0);

    } catch (err) {
        console.error("Fatal error during sync process:", err);
        process.exit(1);
    }
}

// Trigger script execution
syncRealData();
