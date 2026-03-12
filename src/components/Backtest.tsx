import { useState, useRef, useEffect } from 'react';
import { createChart, AreaSeries } from 'lightweight-charts';
import type { IChartApi } from 'lightweight-charts';

const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://api.trade.51.77.223.61.nip.io';

interface BacktestResult {
  symbol: string;
  month: string;
  capital: number;
  finalValue: number;
  pnl: number;
  pnlPercent: number;
  trades: any[];
  capitalHistory: { time: number; value: number }[];
  metrics: {
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: number;
    maxDrawdown: number;
    bestTrade: number;
    worstTrade: number;
  };
  dataPoints: number;
}

export function Backtest() {
  const [symbol, setSymbol] = useState('SOL');
  const [month, setMonth] = useState('2025-01');
  const [capital, setCapital] = useState(100);
  const [stopLoss, setStopLoss] = useState(5);
  const [takeProfit, setTakeProfit] = useState(10);
  const [positionSize, setPositionSize] = useState(100);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const runBacktest = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/backtest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, month, capital, stopLoss, takeProfit, positionSize }),
      });
      const data = await res.json();
      if (res.ok) setResult(data);
      else setResult(null);
    } catch {
      setResult(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!result || !chartContainerRef.current) return;

    if (chartRef.current) chartRef.current.remove();

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { color: '#1a1a2e' }, textColor: '#a0a0b0' },
      grid: { vertLines: { color: '#2a2a3e' }, horzLines: { color: '#2a2a3e' } },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: { timeVisible: true },
    });

    const isProfit = result.pnl >= 0;

    const series = chart.addSeries(AreaSeries, {
      lineColor: isProfit ? '#26a69a' : '#ef5350',
      topColor: isProfit ? 'rgba(38, 166, 154, 0.3)' : 'rgba(239, 83, 80, 0.3)',
      bottomColor: isProfit ? 'rgba(38, 166, 154, 0.05)' : 'rgba(239, 83, 80, 0.05)',
      lineWidth: 2,
    });

    series.setData(result.capitalHistory.map(d => ({
      time: d.time as any,
      value: d.value,
    })));

    series.createPriceLine({
      price: result.capital,
      color: '#a0a0b0',
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: 'Capital initial',
    });

    chartRef.current = chart;

    const ro = new ResizeObserver(() => {
      if (chartContainerRef.current) chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    });
    ro.observe(chartContainerRef.current);

    return () => { ro.disconnect(); chart.remove(); };
  }, [result]);

  return (
    <div className="bt-layout">
      <div className="bt-sidebar">
        <h3>Parametres</h3>

        <div className="bt-field">
          <label>Crypto</label>
          <select value={symbol} onChange={e => setSymbol(e.target.value)} className="backtest-select">
            <option value="SOL">SOL</option>
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
            <option value="DOGE">DOGE</option>
            <option value="SHIB">SHIB</option>
            <option value="PEPE">PEPE</option>
          </select>
        </div>

        <div className="bt-field">
          <label>Mois</label>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="backtest-input" />
        </div>

        <div className="bt-field">
          <label>Capital: <strong>${capital}</strong></label>
          <input type="range" min={10} max={10000} step={10} value={capital} onChange={e => setCapital(Number(e.target.value))} />
        </div>

        <div className="bt-field">
          <label>Stop Loss: <strong>{stopLoss}%</strong></label>
          <input type="range" min={1} max={50} step={0.5} value={stopLoss} onChange={e => setStopLoss(Number(e.target.value))} />
        </div>

        <div className="bt-field">
          <label>Take Profit: <strong>{takeProfit}%</strong></label>
          <input type="range" min={1} max={100} step={0.5} value={takeProfit} onChange={e => setTakeProfit(Number(e.target.value))} />
        </div>

        <div className="bt-field">
          <label>Position Size: <strong>{positionSize}%</strong></label>
          <input type="range" min={10} max={100} step={5} value={positionSize} onChange={e => setPositionSize(Number(e.target.value))} />
        </div>

        <button className="backtest-btn" onClick={runBacktest} disabled={loading}>
          {loading ? 'Calcul...' : 'Lancer'}
        </button>
      </div>

      <div className="bt-main">
        {!result && !loading && (
          <div className="bt-empty">
            Configure tes parametres et lance un backtest
          </div>
        )}

        {loading && (
          <div className="bt-empty">Calcul en cours...</div>
        )}

        {result && (
          <>
            <div className="bt-header-result">
              <div className="bt-symbol">{result.symbol}/USDT</div>
              <div className="bt-period">{result.month}</div>
              <div className={`bt-pnl ${result.pnl >= 0 ? 'positive' : 'negative'}`}>
                {result.pnl >= 0 ? '+' : ''}{result.pnl.toFixed(2)}$
                <span className="bt-pnl-pct">({result.pnlPercent >= 0 ? '+' : ''}{result.pnlPercent.toFixed(1)}%)</span>
              </div>
              <div className="bt-capital-range">
                ${result.capital.toFixed(0)} → ${result.finalValue.toFixed(2)}
              </div>
            </div>

            <div ref={chartContainerRef} className="bt-chart" />

            <div className="bt-metrics-grid">
              <div className="bt-metric">
                <span className="bt-metric-label">Trades</span>
                <span className="bt-metric-value">{result.metrics.totalTrades}</span>
              </div>
              <div className="bt-metric">
                <span className="bt-metric-label">Wins</span>
                <span className="bt-metric-value positive">{result.metrics.wins}</span>
              </div>
              <div className="bt-metric">
                <span className="bt-metric-label">Losses</span>
                <span className="bt-metric-value negative">{result.metrics.losses}</span>
              </div>
              <div className="bt-metric">
                <span className="bt-metric-label">Win Rate</span>
                <span className="bt-metric-value">{result.metrics.winRate.toFixed(0)}%</span>
              </div>
              <div className="bt-metric">
                <span className="bt-metric-label">Max Drawdown</span>
                <span className="bt-metric-value negative">-{result.metrics.maxDrawdown.toFixed(1)}%</span>
              </div>
              <div className="bt-metric">
                <span className="bt-metric-label">Best Trade</span>
                <span className="bt-metric-value positive">+${result.metrics.bestTrade.toFixed(2)}</span>
              </div>
              <div className="bt-metric">
                <span className="bt-metric-label">Worst Trade</span>
                <span className="bt-metric-value negative">${result.metrics.worstTrade.toFixed(2)}</span>
              </div>
              <div className="bt-metric">
                <span className="bt-metric-label">Data Points</span>
                <span className="bt-metric-value">{result.dataPoints.toLocaleString()}</span>
              </div>
            </div>

            <div className="bt-trades-list">
              <h4>Historique trades</h4>
              <div className="bt-trades-scroll">
                {result.trades.map((t, i) => (
                  <div key={i} className="bt-trade-row">
                    <span className={`bt-trade-type ${t.type === 'BUY' ? 'buy' : 'sell'}`}>{t.type}</span>
                    <span className="bt-trade-price">${t.price.toFixed(4)}</span>
                    <span className="bt-trade-qty">{t.qty.toFixed(4)}</span>
                    {t.pnl !== undefined && (
                      <span className={`bt-trade-pnl ${t.pnl >= 0 ? 'positive' : 'negative'}`}>
                        {t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(2)}$
                      </span>
                    )}
                    <span className="trade-reason">{t.reason || ''}</span>
                    <span className="bt-trade-time">{new Date(t.time).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
