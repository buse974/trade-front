import { useState, useEffect } from 'react';

interface Config {
  stopLoss: number;
  takeProfit: number;
  positionSize: number;
  interval: number;
  enabled: boolean;
}

interface Props {
  config: Config | null;
  onConfigChange: (config: Partial<Config>) => void;
}

export function Controls({ config, onConfigChange }: Props) {
  const [local, setLocal] = useState<Config>({
    stopLoss: 5,
    takeProfit: 10,
    positionSize: 10,
    interval: 30,
    enabled: false,
  });

  useEffect(() => {
    if (config) setLocal(config);
  }, [config]);

  const handleChange = (key: keyof Config, value: number | boolean) => {
    const updated = { ...local, [key]: value };
    setLocal(updated);
    onConfigChange({ [key]: value });
  };

  return (
    <div className="controls-container">
      <h3>Contrôles</h3>

      <div className="control-row">
        <label>Bot actif</label>
        <button
          className={`toggle ${local.enabled ? 'active' : ''}`}
          onClick={() => handleChange('enabled', !local.enabled)}
        >
          {local.enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="control-row">
        <label>Stop Loss: {local.stopLoss}%</label>
        <input
          type="range"
          min="1"
          max="20"
          step="0.5"
          value={local.stopLoss}
          onChange={e => handleChange('stopLoss', parseFloat(e.target.value))}
        />
      </div>

      <div className="control-row">
        <label>Take Profit: {local.takeProfit}%</label>
        <input
          type="range"
          min="1"
          max="50"
          step="0.5"
          value={local.takeProfit}
          onChange={e => handleChange('takeProfit', parseFloat(e.target.value))}
        />
      </div>

      <div className="control-row">
        <label>Taille position: {local.positionSize}%</label>
        <input
          type="range"
          min="1"
          max="50"
          step="1"
          value={local.positionSize}
          onChange={e => handleChange('positionSize', parseFloat(e.target.value))}
        />
      </div>

      <div className="control-row">
        <label>Intervalle: {local.interval}s</label>
        <input
          type="range"
          min="5"
          max="120"
          step="5"
          value={local.interval}
          onChange={e => handleChange('interval', parseFloat(e.target.value))}
        />
      </div>
    </div>
  );
}
