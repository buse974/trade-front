import { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, LineSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';

interface PricePoint {
  price: number;
  timestamp: number;
}

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface Props {
  symbol: string;
  data: PricePoint[];
  color?: string;
}

const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : `https://api.trade.51.77.223.61.nip.io`;

const RANGES = ['1d', '7d', '30d', '90d', '1y', 'all'] as const;

export function PriceChart({ symbol, data, color = '#2196F3' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const [range, setRange] = useState<string>('7d');
  const [loading, setLoading] = useState(true);

  // Create chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#1a1a2e' },
        textColor: '#a0a0b0',
      },
      grid: {
        vertLines: { color: '#2a2a3e' },
        horzLines: { color: '#2a2a3e' },
      },
      width: containerRef.current.clientWidth,
      height: 200,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 0,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    const lineSeries = chart.addSeries(LineSeries, {
      color,
      lineWidth: 2,
      visible: false,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    lineSeriesRef.current = lineSeries;

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [color]);

  // Fetch historical data
  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/history/${symbol}?range=${range}`)
      .then(r => r.json())
      .then((candles: CandleData[]) => {
        if (candleSeriesRef.current && candles.length > 0) {
          candleSeriesRef.current.setData(candles as any);
          candleSeriesRef.current.applyOptions({ visible: true });
          if (lineSeriesRef.current) lineSeriesRef.current.applyOptions({ visible: false });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [symbol, range]);

  // Update with live data
  useEffect(() => {
    if (!candleSeriesRef.current || data.length === 0) return;

    const last = data[data.length - 1];
    candleSeriesRef.current.update({
      time: Math.floor(last.timestamp / 1000) as any,
      open: last.price,
      high: last.price,
      low: last.price,
      close: last.price,
    });
  }, [data]);

  return (
    <div className="chart-container">
      <div className="chart-header">
        <span className="chart-symbol">{symbol}</span>
        <div className="chart-ranges">
          {RANGES.map(r => (
            <button
              key={r}
              className={`range-btn ${range === r ? 'active' : ''}`}
              onClick={() => setRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
        {data.length > 0 && (
          <span className="chart-price">${data[data.length - 1].price.toFixed(4)}</span>
        )}
        {loading && <span className="chart-loading">...</span>}
      </div>
      <div ref={containerRef} />
    </div>
  );
}
