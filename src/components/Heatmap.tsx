interface Props {
  matrix: number[][];
  symbols: string[];
}

function getColor(value: number): string {
  if (value >= 0.8) return '#00c853';
  if (value >= 0.5) return '#4caf50';
  if (value >= 0.2) return '#8bc34a';
  if (value >= -0.2) return '#9e9e9e';
  if (value >= -0.5) return '#ff9800';
  if (value >= -0.8) return '#f44336';
  return '#b71c1c';
}

export function Heatmap({ matrix, symbols }: Props) {
  if (symbols.length < 2 || matrix.length === 0) {
    return (
      <div className="heatmap-container">
        <h3>Corrélation</h3>
        <p className="muted">En attente de données...</p>
      </div>
    );
  }

  return (
    <div className="heatmap-container">
      <h3>Corrélation</h3>
      <div className="heatmap-grid" style={{
        display: 'grid',
        gridTemplateColumns: `60px repeat(${symbols.length}, 1fr)`,
        gap: '2px',
      }}>
        {/* Header row */}
        <div />
        {symbols.map(s => (
          <div key={`h-${s}`} className="heatmap-label">{s}</div>
        ))}

        {/* Data rows */}
        {matrix.map((row, i) => (
          <div key={`row-${i}`} style={{ display: 'contents' }}>
            <div className="heatmap-label">{symbols[i]}</div>
            {row.map((val, j) => (
              <div
                key={`${i}-${j}`}
                className="heatmap-cell"
                style={{ backgroundColor: getColor(val) }}
                title={`${symbols[i]}/${symbols[j]}: ${val.toFixed(2)}`}
              >
                {val.toFixed(2)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
