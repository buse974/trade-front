import { useState, useRef, useEffect } from 'react';
import { createChart, LineSeries, AreaSeries } from 'lightweight-charts';
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

  // Render chart
  useEffect(() => {
    if (!result || !chartContainerRef.current) return;

    if (chartRef.current) chartRef.current.remove();

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { color: '#1a1a2e' }, textColor: '#a0a0b0' },
      grid: { vertLines: { color: '#2a2a3e' }, horzLines: { color: '#2a2a3e' } },
      width: chartContainerRef.current.clientWidth,
      height: 250,
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

    // Baseline at initial capital
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
    <div className="backtest-panel">
      <h3>Backtest</h3>

      <div className="backtest-controls">
        <div className="backtest-row">
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

        <div className="backtest-row">
          <label>Mois</label>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="backtest-input" />
        </div>

        <div className="backtest-row">
          <label>Capital: ${capital}</label>
          <input type="range" min={10} max={10000} step={10} value={capital} onChange={e => setCapital(Number(e.target.value))} />
        </div>

        <div className="backtest-row">
          <label>Stop Loss: {stopLoss}%</label>
          <input type="range" min={1} max={50} step={0.5} value={stopLoss} onChange={e => setStopLoss(Number(e.target.value))} />
        </div>

        <div className="backtest-row">
          <label>Take Profit: {takeProfit}%</label>
          <input type="range" min={1} max={100} step={0.5} value={takeProfit} onChange={e => setTakeProfit(Number(e.target.value))} />
        </div>

        <div className="backtest-row">
          <label>Position Size: {positionSize}%</label>
          <input type="range" min={10} max={100} step={5} value={positionSize} onChange={e => setPositionSize(Number(e.target.value))} />
        </div>

        <button className="backtest-btn" onClick={runBacktest} disabled={loading}>
          {loading ? 'Calcul...' : 'Lancer le backtest'}
        </button>
      </div>

      {result && (
        <div className="backtest-results">
          <div className="backtest-summary">
            <div className={`backtest-pnl ${result.pnl >= 0 ? 'positive' : 'negative'}`}>
              {result.pnl >= 0 ? '+' : ''}{result.pnl.toFixed(2)}$ ({result.pnlPercent >= 0 ? '+' : ''}{result.pnlPercent.toFixed(1)}%)
            </div>
            <div className="backtest-final">
              ${result.capital.toFixed(0)} → ${result.finalValue.toFixed(2)}
            </div>
          </div>

          <div ref={chartContainerRef} className="backtest-chart" />

          <div className="backtest-metrics">
            <div className="stat-box">
              <span className="stat-label">Trades</span>
              <span className="stat-value">{result.metrics.totalTrades}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Win Rate</span>
              <span className="stat-value">{result.metrics.winRate.toFixed(0)}%</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Max Drawdown</span>
              <span className="stat-value negative">-{result.metrics.maxDrawdown.toFixed(1)}%</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Meilleur trade</span>
              <span className="stat-value positive">+${result.metrics.bestTrade.toFixed(2)}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Pire trade</span>
              <span className="stat-value negative">${result.metrics.worstTrade.toFixed(2)}</span>
            </div>
          </div>

          <div className="backtest-trades">
            <h4>Trades ({result.trades.length})</h4>
            {result.trades.slice(-20).map((t, i) => (
              <div key={i} className={`trade-row ${t.type === 'BUY' ? '' : t.pnl >= 0 ? 'positive' : 'negative'}`}>
                <span>{t.type === 'BUY' ? '🟢' : '🔴'} {t.type}</span>
                <span>${t.price.toFixed(4)}</span>
                {t.pnl !== undefined && <span>{t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(2)}$</span>}
                <span className="trade-reason">{t.reason || ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
