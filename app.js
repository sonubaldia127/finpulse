const API_URL = 'https://finpulse-sdjp.onrender.com';
let allStocks = [];
let priceChart = null;
let compChart = null;
let checkedTickers = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchStocks();
});

async function fetchStocks() {
    try {
        const res = await fetch(`${API_URL}/stocks`);
        allStocks = await res.json();
        
        // Sort stocks alphabetically by ticker
        allStocks.sort((a, b) => a.ticker.localeCompare(b.ticker));

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
        
        const isChecked = checkedTickers.includes(stock.ticker) ? 'checked' : '';

        row.innerHTML = `
            <td onclick="event.stopPropagation()"><input type="checkbox" class="stock-checkbox" value="${stock.ticker}" ${isChecked}></td>
            <td><strong>${stock.ticker}</strong></td>
            <td>${stock.name}</td>
            <td>₹${stock.price.toFixed(2)}</td>
            <td>${stock.market_cap}</td>
            <td>${stock.pe_ratio || 'N/A'}</td>
            <td>${stock.eps || 'N/A'}</td>
        `;
        
        // Listen for checkbox changes
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

            // Automatically trigger comparison or hide it based on selection count
            if (checkedTickers.length === 2) {
                runComparisonAnalysis();
            } else {
                document.getElementById('comparison-matrix').style.display = 'none';
            }
        });

        row.addEventListener('click', () => loadStockChart(stock.ticker, stock.name));
        tbody.appendChild(row);
    });
}

// Comparative Engine: Overlay two datasets on the same Chart.js line graph
async function runComparisonAnalysis() {
    if (checkedTickers.length !== 2) return;

    try {
        const res1 = await fetch(`${API_URL}/stocks/${checkedTickers[0]}`);
        const stock1 = await res1.json();

        const res2 = await fetch(`${API_URL}/stocks/${checkedTickers[1]}`);
        const stock2 = await res2.json();

        // Show the Comparison Matrix section
        document.getElementById('comparison-matrix').style.display = 'block';

        // Populate Matrix Text Fields
        document.getElementById('compare-stock1-name').innerText = stock1.name;
        document.getElementById('compare-stock2-name').innerText = stock2.name;

        document.getElementById('compare-price1').innerText = `₹${stock1.price.toFixed(2)}`;
        document.getElementById('compare-price2').innerText = `₹${stock2.price.toFixed(2)}`;

        document.getElementById('compare-cap1').innerText = stock1.market_cap;
        document.getElementById('compare-cap2').innerText = stock2.market_cap;

        document.getElementById('compare-pe1').innerText = stock1.pe_ratio || 'N/A';
        document.getElementById('compare-pe2').innerText = stock2.pe_ratio || 'N/A';

        document.getElementById('compare-eps1').innerText = stock1.eps || 'N/A';
        document.getElementById('compare-eps2').innerText = stock2.eps || 'N/A';

        // Render Combined Multi-Line Chart
        const dates = stock1.history.map(item => item.date);
        const prices1 = stock1.history.map(item => item.close_price);
        const prices2 = stock2.history.map(item => item.close_price);

        if (compChart) {
            compChart.destroy();
        }

        const ctx = document.getElementById('comparisonChart').getContext('2d');
        compChart = new Chart(ctx, {
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
                    x: { 
                        display: true,
                        ticks: {
                            maxTicksLimit: 12 // Limits x-axis to roughly 12 labels (months)
                        }
                    }
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
                    x: { 
                        display: true,
                        ticks: {
                            maxTicksLimit: 12 // Limits x-axis to roughly 12 labels (months)
                        }
                    }
                }
            }
        });
    } catch (err) {
        console.error("Chart load failed:", err);
    }
}