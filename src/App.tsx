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
        // Trade notifications could trigger a visual effect
        break;
    }
  }, []);

  const { connected, send } = useWebSocket(handleMessage);

  const handleConfigChange = useCallback((newConfig: any) => {
    send('config', newConfig);
  }, [send]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>TRADE BOT - SOL/USDC</h1>
        <div className="connection-status">
          <div className={`status-dot ${connected ? 'connected' : ''}`} />
          {connected ? 'Connecté' : 'Déconnecté'}
        </div>
      </header>

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
        <Backtest />
      </div>
    </div>
  );
}

export default App;
