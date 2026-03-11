import { useEffect, useRef } from 'react';
import { createChart, LineSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';

interface PricePoint {
  price: number;
  timestamp: number;
}

interface Props {
  symbol: string;
  data: PricePoint[];
  color?: string;
}

export function PriceChart({ symbol, data, color = '#2196F3' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null);

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
        secondsVisible: true,
      },
      crosshair: {
        mode: 0,
      },
    });

    const series = chart.addSeries(LineSeries, {
      color,
      lineWidth: 2,
    });

    chartRef.current = chart;
    seriesRef.current = series;

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

  useEffect(() => {
    if (!seriesRef.current || data.length === 0) return;

    const chartData = data.map(d => ({
      time: Math.floor(d.timestamp / 1000) as any,
      value: d.price,
    }));

    seriesRef.current.setData(chartData);
  }, [data]);

  return (
    <div className="chart-container">
      <div className="chart-header">
        <span className="chart-symbol">{symbol}</span>
        {data.length > 0 && (
          <span className="chart-price">${data[data.length - 1].price.toFixed(4)}</span>
        )}
      </div>
      <div ref={containerRef} />
    </div>
  );
}
