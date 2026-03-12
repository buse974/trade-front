import { useState, useRef, useEffect } from 'react';
import { createChart, AreaSeries } from 'lightweight-charts';
import type { IChartApi } from 'lightweight-charts';

const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://api.trade.51.77.223.61.nip.io';

interface Profile {
  stopLoss: number;
  takeProfit: number;
  positionSize: number;
  enabled: boolean;
}

interface Profiles {
  bullish: Profile;
  exhaustion: Profile;
  bearish: Profile;
  reversal: Profile;
}

interface BacktestResult {
  symbol: string;
  month: string;
  capital: number;
  finalValue: number;
  pnl: number;
  pnlPercent: number;
  trades: any[];
  capitalHistory: { time: number; value: number; profile: string }[];
  profileHistory: { time: number; profile: string; d1: number; d2: number }[];
  metrics: {
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: number;
    maxDrawdown: number;
    bestTrade: number;
    worstTrade: number;
    profileDistribution: Record<string, string>;
  };
  dataPoints: number;
}

const PROFILE_META: Record<string, { label: string; desc: string; color: string }> = {
  bullish:    { label: 'Haussier',      desc: 'D1 > 0, D2 > 0', color: '#26a69a' },
  exhaustion: { label: 'Essoufflement', desc: 'D1 > 0, D2 < 0', color: '#ff9800' },
  bearish:    { label: 'Baissier',      desc: 'D1 < 0, D2 < 0', color: '#ef5350' },
  reversal:   { label: 'Retournement',  desc: 'D1 < 0, D2 > 0', color: '#42a5f5' },
};

const DEFAULT_PROFILES: Profiles = {
  bullish:    { stopLoss: 8, takeProfit: 15, positionSize: 80, enabled: true },
  exhaustion: { stopLoss: 3, takeProfit: 5, positionSize: 30, enabled: true },
  bearish:    { stopLoss: 0, takeProfit: 0, positionSize: 0, enabled: false },
  reversal:   { stopLoss: 4, takeProfit: 8, positionSize: 40, enabled: true },
};

export function Backtest() {
  const [symbol, setSymbol] = useState('SOL');
  const [month, setMonth] = useState('2025-01');
  const [capital, setCapital] = useState(100);
  const [window, setWindow] = useState(60);
  const [profiles, setProfiles] = useState<Profiles>({ ...DEFAULT_PROFILES });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const updateProfile = (key: keyof Profiles, field: string, value: number | boolean) => {
    setProfiles(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const runBacktest = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/backtest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, month, capital, window, profiles }),
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
      height: 350,
      timeScale: { timeVisible: true },
    });

    const isProfit = result.pnl >= 0;
    const series = chart.addSeries(AreaSeries, {
      lineColor: isProfit ? '#26a69a' : '#ef5350',
      topColor: isProfit ? 'rgba(38, 166, 154, 0.3)' : 'rgba(239, 83, 80, 0.3)',
      bottomColor: isProfit ? 'rgba(38, 166, 154, 0.05)' : 'rgba(239, 83, 80, 0.05)',
      lineWidth: 2,
    });

    const validData = result.capitalHistory.filter(d => d.time && isFinite(d.value));
    if (validData.length > 0) {
      series.setData(validData.map(d => ({ time: d.time as any, value: d.value })));
      series.createPriceLine({
        price: result.capital,
        color: '#a0a0b0',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'Capital initial',
      });
    }

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
        <h3>General</h3>

        <div className="bt-field">
          <label>Crypto</label>
          <select value={symbol} onChange={e => setSymbol(e.target.value)} className="backtest-select">
            {['SOL', 'BTC', 'ETH', 'DOGE', 'SHIB', 'PEPE'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
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
          <label>Fenetre derivee: <strong>{window} min</strong></label>
          <input type="range" min={10} max={240} step={10} value={window} onChange={e => setWindow(Number(e.target.value))} />
        </div>

        <div className="bt-profiles">
          {(Object.keys(PROFILE_META) as Array<keyof Profiles>).map(key => {
            const meta = PROFILE_META[key];
            const prof = profiles[key];
            return (
              <div key={key} className="bt-profile" style={{ borderLeftColor: meta.color }}>
                <div className="bt-profile-header">
                  <span className="bt-profile-name" style={{ color: meta.color }}>{meta.label}</span>
                  <span className="bt-profile-desc">{meta.desc}</span>
                  <button
                    className={`bt-profile-toggle ${prof.enabled ? 'on' : 'off'}`}
                    onClick={() => updateProfile(key, 'enabled', !prof.enabled)}
                  >
                    {prof.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                {prof.enabled && (
                  <div className="bt-profile-sliders">
                    <div className="bt-slider">
                      <label>SL: {prof.stopLoss}%</label>
                      <input type="range" min={1} max={50} step={0.5} value={prof.stopLoss}
                        onChange={e => updateProfile(key, 'stopLoss', Number(e.target.value))} />
                    </div>
                    <div className="bt-slider">
                      <label>TP: {prof.takeProfit}%</label>
                      <input type="range" min={1} max={100} step={0.5} value={prof.takeProfit}
                        onChange={e => updateProfile(key, 'takeProfit', Number(e.target.value))} />
                    </div>
                    <div className="bt-slider">
                      <label>Size: {prof.positionSize}%</label>
                      <input type="range" min={10} max={100} step={5} value={prof.positionSize}
                        onChange={e => updateProfile(key, 'positionSize', Number(e.target.value))} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button className="backtest-btn" onClick={runBacktest} disabled={loading}>
          {loading ? 'Calcul...' : 'Lancer'}
        </button>
      </div>

      <div className="bt-main">
        {!result && !loading && (
          <div className="bt-empty">Configure tes profils et lance un backtest</div>
        )}

        {loading && <div className="bt-empty">Calcul en cours...</div>}

        {result && (
          <>
            <div className="bt-header-result">
              <div className="bt-symbol">{result.symbol}/USDT</div>
              <div className="bt-period">{result.month}</div>
              <div className={`bt-pnl ${result.pnl >= 0 ? 'positive' : 'negative'}`}>
                {result.pnl >= 0 ? '+' : ''}{result.pnl.toFixed(2)}$
                <span className="bt-pnl-pct">({result.pnlPercent >= 0 ? '+' : ''}{result.pnlPercent.toFixed(1)}%)</span>
              </div>
              <div className="bt-capital-range">${result.capital} → ${result.finalValue.toFixed(2)}</div>
            </div>

            <div ref={chartContainerRef} className="bt-chart" />

            {/* Profile distribution bar */}
            {result.metrics.profileDistribution && (
              <div className="bt-profile-bar">
                {(Object.keys(PROFILE_META) as string[]).map(key => {
                  const pct = parseInt(result.metrics.profileDistribution[key] || '0');
                  if (pct === 0) return null;
                  return (
                    <div
                      key={key}
                      className="bt-profile-segment"
                      style={{ width: `${pct}%`, background: PROFILE_META[key].color }}
                      title={`${PROFILE_META[key].label}: ${pct}%`}
                    >
                      {pct > 8 && <span>{PROFILE_META[key].label} {pct}%</span>}
                    </div>
                  );
                })}
              </div>
            )}

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
              <h4>Historique trades ({result.trades.length})</h4>
              <div className="bt-trades-scroll">
                {result.trades.map((t, i) => (
                  <div key={i} className="bt-trade-row">
                    <span className={`bt-trade-type ${t.type === 'BUY' ? 'buy' : 'sell'}`}>{t.type}</span>
                    <span className="bt-trade-price">${t.price.toFixed(4)}</span>
                    {t.pnl !== undefined && (
                      <span className={`bt-trade-pnl ${t.pnl >= 0 ? 'positive' : 'negative'}`}>
                        {t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(2)}$
                      </span>
                    )}
                    <span className="bt-trade-profile" style={{ color: PROFILE_META[t.profile]?.color }}>
                      {PROFILE_META[t.profile]?.label || t.profile}
                    </span>
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
