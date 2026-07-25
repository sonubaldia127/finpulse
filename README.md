# FinPulse - Real-Time Stock Tracking & Analytics Dashboard

FinPulse is an automated financial tracking platform designed to fetch real-time market metrics and historical stock performance for 20 leading Indian Energy and Power sector companies listed on the National Stock Exchange (NSE). 

The platform features an automated serverless CI/CD pipeline via GitHub Actions that continuously keeps the cloud database synchronized, alongside a responsive frontend interface.

---

## 🌐 Project Links & Status

* **GitHub Repository (Public):** [https://github.com/sonubaldia127/finpulse](https://github.com/sonubaldia127/finpulse)
* **Live Application:** (https://finpulse-m9csd5zhu-sb-sofi-algo.vercel.app)

---

## 📋 Technology Stack Mapping

Below is the complete breakdown of technologies used across each architectural layer, fulfilling all project guidelines:

| Layer | Technology Choice | Implementation in FinPulse |
| :--- | :--- | :--- |
| **Language** | Node.js (JavaScript ES6+) | Used JavaScript runtime for both backend sync scripts and web server logic. |
| **Data Source** | `yahoo-finance2` (yFinance API) | Fetches real-time price quotes, fundamentals (Market Cap, P/E Ratio, EPS), and 1-year historical daily charts for NSE tickers. |
| **Backend API / Server** | Express.js (Node.js API) | Serves API endpoints, handles server routes (`server.js`), and interfaces with Supabase. |
| **Database** | Supabase (PostgreSQL) | Managed cloud PostgreSQL database hosting two main tables: `stocks` (real-time fundamentals) and `historical_prices` (1-year chart data). |
| **Frontend** | HTML5 / CSS3 / JavaScript | Responsive frontend interface rendering interactive data tables and dynamic stock performance charts using `Chart.js`. |
| **Version Control & CI/CD** | Git + GitHub + GitHub Actions | Public GitHub repository with automated workflow (`sync.yml`) executing cloud synchronization every 15 minutes. |

---

## 🏗️ System Architecture & Automated Workflow

1. **Scheduled Data Extraction:**
   - A GitHub Actions cron workflow (`.github/workflows/sync.yml`) automatically triggers on an **Ubuntu / Node.js 22** environment every 15 minutes during trading days.
2. **Ingestion Script (`fetchData.js`):**
   - Queries Yahoo Finance for 20 specified NSE energy tickers (`NTPC.NS`, `TATAPOWER.NS`, `SUZLON.NS`, etc.).
   - Parses, cleans, and formats financial indicators (converting raw Market Cap into Crores/Trillions).
3. **Database Upsert (Supabase):**
   - Truncates outdated historical price batches and performs `upsert` operations into Supabase PostgreSQL tables.
4. **Dashboard Visualization:**
   - The frontend queries Supabase in real-time to populate interactive dashboards and historical price trend charts.

---

## 🛠️ Third-Party Libraries & External Services

* **`@supabase/supabase-js`:** Cloud PostgreSQL database SDK for real-time querying and data storage.
* **`yahoo-finance2`:** Financial data fetching API for live market pricing and daily price histories.
* **`dotenv`:** Environment variable management to keep API keys secure locally.
* **`Chart.js`:** Client-side charting library used to render historical stock performance graphs.

---

## 🤖 AI Assistance Acknowledgment

In accordance with academic and submission transparency standards:
* **Gemini (Google AI):** Used as a developer tool during project setup for debugging Node.js dependency compatibility issues, configuring GitHub Actions workflow files (`sync.yml`), fixing Node 22 runtime dependencies, and formatting technical documentation.

---

## 🚀 Local Setup & Installation

### Prerequisites
* **Node.js:** v22.0.0 or higher
* **Git** installed on your system

### Installation Steps

1. **Clone the Public Repository:**
   ```bash
   git clone [https://github.com/sonubaldia127/finpulse.git](https://github.com/sonubaldia127/finpulse.git)
   cd finpulse
