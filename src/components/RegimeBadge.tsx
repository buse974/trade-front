interface RegimePoint {
  regime: 'actif' | 'calme';
  proba: number;
  stale?: boolean;
  error?: string;
}

interface RegimeData {
  current: RegimePoint | null;
  all: Record<string, RegimePoint>;
}

interface Props {
  regime: RegimeData | null;
}

const HORIZONS: Array<{ key: string; label: string }> = [
  { key: '5m', label: '5m' },
  { key: '15m', label: '15m' },
  { key: '1h', label: '1h' },
];

export function RegimeBadge({ regime }: Props) {
  const current = regime?.current;
  const all = regime?.all || {};

  const isStale = !current || current.stale || current.error;
  const label = isStale ? 'ML…' : (current.regime === 'actif' ? 'ACTIF' : 'CALME');
  const cls = isStale ? 'stale' : current.regime;

  return (
    <div className={`regime-badge regime-${cls}`} title="Régime de marché prédit par XGBoost">
      <span className="regime-dot" />
      <span className="regime-label">{label}</span>
      {!isStale && (
        <span className="regime-proba">{(current.proba * 100).toFixed(0)}%</span>
      )}
      <span className="regime-horizons">
        {HORIZONS.map(h => {
          const p = all[h.key];
          if (!p) return (
            <span key={h.key} className="regime-h regime-h-stale" title={`${h.label}: ?`}>
              {h.label}
            </span>
          );
          return (
            <span
              key={h.key}
              className={`regime-h regime-h-${p.regime}`}
              title={`${h.label}: ${p.regime} ${(p.proba * 100).toFixed(0)}%`}
            >
              {h.label}
            </span>
          );
        })}
      </span>
    </div>
  );
}
