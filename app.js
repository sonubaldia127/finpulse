const API_URL = 'http://localhost:3000';
let allStocks = [];
let priceChart = null;
let checkedTickers = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchMarketSummary();
    fetchStocks();

    document.getElementById('search-bar').addEventListener('input', filterAndRenderData);
    document.getElementById('pe-filter').addEventListener('input', filterAndRenderData);
    document.getElementById('compare-trigger-btn').addEventListener('click', runComparisonAnalysis);
});

async function fetchMarketSummary() {
    try {
        const res = await fetch(`${API_URL}/market-summary`);
        const summary = await res.json();
        document.getElementById('total-count').innerText = `${summary.totalCompanies} Companies`;
        document.getElementById('highest-stock').innerText = `${summary.highestPrice.ticker} (₹${summary.highestPrice.price})`;
        document.getElementById('best-value-stock').innerText = `${summary.bestValue.ticker} (P/E: ${summary.bestValue.pe})`;
    } catch (err) {
        console.error("Summary fetch error:", err);
    }
}

async function fetchStocks() {
    try {
        const res = await fetch(`${API_URL}/stocks`);
        allStocks = await res.json();
        renderTable(allStocks);
        
        if(allStocks.length > 0) {
            loadStockChart(allStocks[0].ticker, allStocks[0].name);
        }
    } catch (err) {
        console.error("Error loading stocks:", err);
    }
}

function renderTable(stocks) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    stocks.forEach(stock => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td onclick="event.stopPropagation()"><input type="checkbox" class="stock-checkbox" value="${stock.ticker}"></td>
            <td><strong>${stock.ticker}</strong></td>
            <td>${stock.name}</td>
            <td>₹${stock.price.toFixed(2)}</td>
            <td>${stock.market_cap}</td>
            <td>${stock.pe_ratio || 'N/A'}</td>
            <td>${stock.eps || 'N/A'}</td>
        `;
        
        // Listen for checkbox changes to maintain a maximum list of 2 items
        const cb = row.querySelector('.stock-checkbox');
        cb.addEventListener('change', (e) => {
            if (e.target.checked) {
                if (checkedTickers.length >= 2) {
                    alert("Please select a maximum of 2 stocks for comparative analysis.");
                    e.target.checked = false;
                    return;
                }
                checkedTickers.push(stock.ticker);
            } else {
                checkedTickers = checkedTickers.filter(t => t !== stock.ticker);
            }
        });

        row.addEventListener('click', () => loadStockChart(stock.ticker, stock.name));
        tbody.appendChild(row);
    });
}

function filterAndRenderData() {
    const searchQuery = document.getElementById('search-bar').value.toLowerCase();
    const maxPE = parseFloat(document.getElementById('pe-filter').value);

    const filtered = allStocks.filter(stock => {
        const matchesSearch = stock.name.toLowerCase().includes(searchQuery) || stock.ticker.toLowerCase().includes(searchQuery);
        const matchesPE = isNaN(maxPE) || (stock.pe_ratio && stock.pe_ratio <= maxPE);
        return matchesSearch && matchesPE;
    });

    renderTable(filtered);
}

// 4. Comparative Engine: Overlay two datasets on the same Chart.js line graph
async function runComparisonAnalysis() {
    if (checkedTickers.length !== 2) {
        alert("Please select exactly 2 companies using the checkbox to run a side-by-side comparison.");
        return;
    }

    try {
        const res1 = await fetch(`${API_URL}/stocks/${checkedTickers[0]}`);
        const stock1 = await res1.json();

        const res2 = await fetch(`${API_URL}/stocks/${checkedTickers[1]}`);
        const stock2 = await res2.json();

        // Populate Matrix Text Fields
        document.getElementById('compare-empty-msg').style.display = 'none';
        document.getElementById('compare-data-box').style.display = 'block';

        document.getElementById('comp-name-1').innerText = stock1.name;
        document.getElementById('comp-price-1').innerText = `₹${stock1.price}`;
        document.getElementById('comp-cap-1').innerText = stock1.market_cap;
        document.getElementById('comp-pe-1').innerText = stock1.pe_ratio || 'N/A';
        document.getElementById('comp-eps-1').innerText = stock1.eps || 'N/A';

        document.getElementById('comp-name-2').innerText = stock2.name;
        document.getElementById('comp-price-2').innerText = `₹${stock2.price}`;
        document.getElementById('comp-cap-2').innerText = stock2.market_cap;
        document.getElementById('comp-pe-2').innerText = stock2.pe_ratio || 'N/A';
        document.getElementById('comp-eps-2').innerText = stock2.eps || 'N/A';

        // Render Combined Multi-Line Chart
        document.getElementById('chart-title').innerText = `${stock1.ticker} vs ${stock2.ticker} Performance Comparison`;

        const dates = stock1.history.map(item => item.date);
        const prices1 = stock1.history.map(item => item.close_price);
        const prices2 = stock2.history.map(item => item.close_price);

        if (priceChart) {
            priceChart.destroy();
        }

        const ctx = document.getElementById('historyChart').getContext('2d');
        priceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: stock1.ticker,
                        data: prices1,
                        borderColor: '#065f46',
                        backgroundColor: 'rgba(6, 95, 70, 0.05)',
                        fill: true,
                        tension: 0.1,
                        pointRadius: 1
                    },
                    {
                        label: stock2.ticker,
                        data: prices2,
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.05)',
                        fill: true,
                        tension: 0.1,
                        pointRadius: 1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: { display: false }
                }
            }
        });

    } catch (err) {
        console.error("Comparison analysis error:", err);
    }
}

async function loadStockChart(ticker, companyName) {
    try {
        const res = await fetch(`${API_URL}/stocks/${ticker}`);
        const data = await res.json();

        document.getElementById('chart-title').innerText = `${companyName} (${ticker}) 1-Year Trend`;

        const dates = data.history.map(item => item.date);
        const prices = data.history.map(item => item.close_price);

        if (priceChart) {
            priceChart.destroy();
        }

        const ctx = document.getElementById('historyChart').getContext('2d');
        priceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Closing Price (INR)',
                    data: prices,
                    borderColor: '#065f46',
                    backgroundColor: 'rgba(6, 95, 70, 0.1)',
                    fill: true,
                    tension: 0.1,
                    pointRadius: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { display: false }
                }
            }
        });
    } catch (err) {
        console.error("Chart load failed:", err);
    }
}