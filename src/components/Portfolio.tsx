interface Position {
  qty: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
}

interface Stats {
  totalTrades: number;
  wins: number;
  losses: number;
  totalPnl: number;
  maxDrawdown: number;
  winRate: number;
}

interface Trade {
  type: string;
  symbol: string;
  qty: number;
  price: number;
  pnl?: number;
  reason?: string;
  timestamp: number;
}

interface PortfolioState {
  cash: number;
  totalValue: number;
  pnl: number;
  pnlPercent: number;
  positions: Record<string, Position>;
  stats: Stats;
  recentTrades: Trade[];
}

interface Props {
  portfolio: PortfolioState | null;
}

export function Portfolio({ portfolio }: Props) {
  if (!portfolio) {
    return (
      <div className="portfolio-container">
        <h3>Portfolio</h3>
        <p className="muted">En attente...</p>
      </div>
    );
  }

  const pnlClass = portfolio.pnl >= 0 ? 'positive' : 'negative';

  return (
    <div className="portfolio-container">
      <h3>Portfolio</h3>

      <div className="portfolio-summary">
        <div className="stat-box">
          <span className="stat-label">Capital</span>
          <span className="stat-value">${portfolio.totalValue.toFixed(2)}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Cash</span>
          <span className="stat-value">${portfolio.cash.toFixed(2)}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">P&L</span>
          <span className={`stat-value ${pnlClass}`}>
            {portfolio.pnl >= 0 ? '+' : ''}{portfolio.pnl.toFixed(2)}$
            ({portfolio.pnlPercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Open positions */}
      {Object.keys(portfolio.positions).length > 0 && (
        <div className="positions">
          <h4>Positions ouvertes</h4>
          {Object.entries(portfolio.positions).map(([symbol, pos]) => (
            <div key={symbol} className="position-row">
              <span>{symbol}</span>
              <span>{pos.qty.toFixed(4)} @ ${pos.entryPrice.toFixed(2)}</span>
              <span className={pos.unrealizedPnl >= 0 ? 'positive' : 'negative'}>
                {pos.unrealizedPnl >= 0 ? '+' : ''}{pos.unrealizedPnl.toFixed(2)}$
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="stats-row">
        <span>Trades: {portfolio.stats.totalTrades}</span>
        <span>Win: {portfolio.stats.winRate.toFixed(0)}%</span>
        <span>Max DD: {portfolio.stats.maxDrawdown.toFixed(2)}%</span>
      </div>

      {/* Recent trades */}
      {portfolio.recentTrades.length > 0 && (
        <div className="recent-trades">
          <h4>Derniers trades</h4>
          {portfolio.recentTrades.slice(-5).reverse().map((trade, i) => (
            <div key={i} className="trade-row">
              <span className={trade.type === 'BUY' ? 'positive' : 'negative'}>
                {trade.type}
              </span>
              <span>{trade.symbol} @ ${trade.price.toFixed(2)}</span>
              {trade.pnl !== undefined && (
                <span className={trade.pnl >= 0 ? 'positive' : 'negative'}>
                  {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}$
                </span>
              )}
              {trade.reason && <span className="trade-reason">{trade.reason}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
