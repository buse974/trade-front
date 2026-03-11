interface PriceData {
  symbol: string;
  price: number;
  change24h?: number;
  speed?: number;
  source?: string;
}

interface Props {
  prices: Record<string, PriceData>;
}

function getSpeedClass(speed: number): string {
  if (speed > 0.5) return 'spike-up';
  if (speed > 0.1) return 'positive';
  if (speed < -0.5) return 'spike-down';
  if (speed < -0.1) return 'negative';
  return '';
}

export function CryptoList({ prices }: Props) {
  const sortedSymbols = ['BTC', 'ETH', 'SOL', 'DOGE', 'SHIB', 'JUP', 'WIF', 'PEPE'];
  const available = sortedSymbols.filter(s => prices[s]);

  return (
    <div className="crypto-list-container">
      <h3>Prix temps réel</h3>
      <div className="crypto-list">
        {available.length === 0 && <p className="muted">Connexion aux feeds...</p>}
        {available.map(symbol => {
          const data = prices[symbol];
          const speedClass = getSpeedClass(data.speed || 0);

          return (
            <div key={symbol} className={`crypto-row ${speedClass}`}>
              <span className="crypto-symbol">{symbol}</span>
              <span className="crypto-price">
                ${data.price < 0.01 ? data.price.toFixed(8) : data.price.toFixed(2)}
              </span>
              {data.change24h !== undefined && (
                <span className={data.change24h >= 0 ? 'positive' : 'negative'}>
                  {data.change24h >= 0 ? '+' : ''}{data.change24h.toFixed(2)}%
                </span>
              )}
              <span className="crypto-source">{data.source}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
