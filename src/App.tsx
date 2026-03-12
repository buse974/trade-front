import { useState, useCallback } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { PriceChart } from './components/PriceChart';
import { CryptoList } from './components/CryptoList';
import { Portfolio } from './components/Portfolio';
import { Controls } from './components/Controls';
import { Heatmap } from './components/Heatmap';
import { Backtest } from './components/Backtest';
import './styles/global.css';

interface PriceData {
  symbol: string;
  price: number;
  change24h?: number;
  speed?: number;
  source?: string;
}

const CHART_COLORS: Record<string, string> = {
  BTC: '#f7931a',
  ETH: '#627eea',
  SOL: '#00ffa3',
  DOGE: '#c3a634',
};

function App() {
  const [page, setPage] = useState<'trading' | 'backtest'>('trading');
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [priceHistory, setPriceHistory] = useState<Record<string, Array<{ price: number; timestamp: number }>>>({});
  const [portfolio, setPortfolio] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [correlation, setCorrelation] = useState<{ matrix: number[][]; symbols: string[] }>({ matrix: [], symbols: [] });

  const handleMessage = useCallback((type: string, data: any) => {
    switch (type) {
      case 'init':
        setPrices(data.prices || {});
        setPortfolio(data.portfolio);
        setConfig(data.config);
        setCorrelation(data.correlation || { matrix: [], symbols: [] });
        break;

      case 'price':
        setPrices(prev => ({ ...prev, [data.symbol]: data }));
        setPriceHistory(prev => {
          const history = prev[data.symbol] || [];
          const updated = [...history, { price: data.price, timestamp: data.timestamp }];
          return { ...prev, [data.symbol]: updated.slice(-500) };
        });
        break;

      case 'portfolio':
        setPortfolio(data);
        break;

      case 'config':
        setConfig(data);
        break;

      case 'correlation':
        setCorrelation(data);
        break;

      case 'trade':
        break;
    }
  }, []);

  const { connected, send } = useWebSocket(handleMessage);

  const handleConfigChange = useCallback((newConfig: any) => {
    send('config', newConfig);
  }, [send]);

  return (
    <div className={page === 'trading' ? 'app' : 'app app-backtest'}>
      <header className="app-header">
        <nav className="app-nav">
          <button
            className={`nav-btn ${page === 'trading' ? 'active' : ''}`}
            onClick={() => setPage('trading')}
          >
            Trading
          </button>
          <button
            className={`nav-btn ${page === 'backtest' ? 'active' : ''}`}
            onClick={() => setPage('backtest')}
          >
            Backtest
          </button>
        </nav>
        <div className="connection-status">
          <div className={`status-dot ${connected ? 'connected' : ''}`} />
          {connected ? 'Connecte' : 'Deconnecte'}
        </div>
      </header>

      {page === 'trading' && (
        <>
          <div className="panel-left">
            <CryptoList prices={prices} />
            <Controls config={config} onConfigChange={handleConfigChange} />
          </div>

          <div className="panel-center">
            {['SOL', 'BTC', 'ETH', 'DOGE'].map(symbol => (
              <PriceChart
                key={symbol}
                symbol={symbol}
                data={priceHistory[symbol] || []}
                color={CHART_COLORS[symbol] || '#2196F3'}
              />
            ))}
            <Heatmap matrix={correlation.matrix} symbols={correlation.symbols} />
          </div>

          <div className="panel-right">
            <Portfolio portfolio={portfolio} />
          </div>
        </>
      )}

      {page === 'backtest' && (
        <div className="page-backtest">
          <Backtest />
        </div>
      )}
    </div>
  );
}

export default App;
