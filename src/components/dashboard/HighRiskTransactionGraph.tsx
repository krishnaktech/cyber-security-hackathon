import React, { useState, useEffect, useId } from 'react';
import {
  Activity,
  AlertTriangle,
  Play,
  Pause,
  Clock,
  Flame,
  Radio,
  ChevronRight,
} from 'lucide-react';
import { FundFlowStep } from '../../types/forensic';
import { RiskBadge } from '../common/RiskBadge';

interface TimeDataPoint {
  id: string;
  timeLabel: string;
  timestamp: string;
  count: number;
  amount: number;
  anomaly: string;
  severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  topAccount: string;
}

interface HighRiskTransactionGraphProps {
  fundFlowSteps?: FundFlowStep[];
  onInspectEntity?: (id: string) => void;
}

// Canonical seeded intervals aligned with case timeline (10:00 to 10:35)
const INITIAL_DATA_POINTS: TimeDataPoint[] = [
  {
    id: 'pt-1',
    timeLabel: '10:00',
    timestamp: '10:00:00',
    count: 1,
    amount: 12000,
    anomaly: 'Unusual reconnaissance activity',
    severity: 'MEDIUM',
    topAccount: 'recon@ip',
  },
  {
    id: 'pt-2',
    timeLabel: '10:05',
    timestamp: '10:05:21',
    count: 3,
    amount: 50000,
    anomaly: 'Victim initial siphon transfer',
    severity: 'HIGH',
    topAccount: 'victim@okhdfc',
  },
  {
    id: 'pt-3',
    timeLabel: '10:07',
    timestamp: '10:07:03',
    count: 6,
    amount: 48000,
    anomaly: 'Rapid hop passthrough (<2 min hop)',
    severity: 'CRITICAL',
    topAccount: 'mule1@upi',
  },
  {
    id: 'pt-4',
    timeLabel: '10:10',
    timestamp: '10:09:44',
    count: 8,
    amount: 45000,
    anomaly: 'Layering via intermediary mule account',
    severity: 'CRITICAL',
    topAccount: 'mule2@upi',
  },
  {
    id: 'pt-5',
    timeLabel: '10:14',
    timestamp: '10:14:10',
    count: 4,
    amount: 25000,
    anomaly: 'Simultaneous fractional fan-out split',
    severity: 'HIGH',
    topAccount: 'mule3@axis',
  },
  {
    id: 'pt-6',
    timeLabel: '10:16',
    timestamp: '10:16:35',
    count: 7,
    amount: 40000,
    anomaly: 'Rapid cashout liquidation at ATM terminal',
    severity: 'CRITICAL',
    topAccount: 'ATM-LOC-402',
  },
  {
    id: 'pt-7',
    timeLabel: '10:20',
    timestamp: '10:20:18',
    count: 5,
    amount: 18000,
    anomaly: 'Proxy IP gateway session colocation',
    severity: 'HIGH',
    topAccount: '103.10.10.1',
  },
  {
    id: 'pt-8',
    timeLabel: '10:25',
    timestamp: '10:25:40',
    count: 2,
    amount: 9500,
    anomaly: 'Cross-tower handover burst',
    severity: 'MEDIUM',
    topAccount: 'CELL-D',
  },
  {
    id: 'pt-9',
    timeLabel: '10:30',
    timestamp: '10:30:15',
    count: 4,
    amount: 22000,
    anomaly: 'Residual balance sweep attempt',
    severity: 'HIGH',
    topAccount: 'cashout@paytm',
  },
  {
    id: 'pt-10',
    timeLabel: '10:35',
    timestamp: '10:35:00',
    count: 3,
    amount: 15000,
    anomaly: 'Active surveillance session monitoring',
    severity: 'HIGH',
    topAccount: 'DEV-RN11-982',
  },
];

export const HighRiskTransactionGraph: React.FC<HighRiskTransactionGraphProps> = ({
  onInspectEntity,
}) => {
  const [dataPoints, setDataPoints] = useState<TimeDataPoint[]>(INITIAL_DATA_POINTS);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<TimeDataPoint | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [lastAlert, setLastAlert] = useState<{ time: string; msg: string; account: string }>({
    time: '10:16:35',
    msg: 'ATM Cashout Spike: ₹40,000 withdrawn at ATM-LOC-402 after 2-hop rapid routing',
    account: 'ATM-LOC-402',
  });

  const gradientId = useId();

  // Simulated live real-time stream: adds dynamic fluctuations and advances time
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setDataPoints(prev => {
        const last = prev[prev.length - 1];
        // Parse last timestamp and advance by 10-30 seconds
        const parts = last.timestamp.split(':').map(Number);
        let [hh, mm, ss] = parts;
        ss += 15;
        if (ss >= 60) {
          ss -= 60;
          mm += 1;
        }
        if (mm >= 60) {
          mm -= 60;
          hh = (hh + 1) % 24;
        }
        const timeStr = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
        const labelStr = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;

        // Random dynamic risk count (2 to 8)
        const countPool = [2, 3, 5, 4, 7, 3, 6, 8, 4, 5, 6, 3];
        const randomCount = countPool[Math.floor(Math.random() * countPool.length)];
        const amounts = [15000, 32000, 48000, 24000, 52000, 19000, 45000];
        const randomAmount = amounts[Math.floor(Math.random() * amounts.length)];
        const anomalies = [
          'Rapid Hop Passthrough (<2 min)',
          'Layering via Mule B Account',
          'High Velocity Co-located IP Session',
          'Device Fingerprint IMEI Switching',
          'Suspicious Cashout Window Triggered',
        ];
        const accounts = ['mule2@upi', 'mule1@upi', 'cashout@paytm', 'ACC-77182', '103.10.10.1'];
        const randomIdx = Math.floor(Math.random() * anomalies.length);

        const newPoint: TimeDataPoint = {
          id: `pt-${Date.now()}`,
          timeLabel: labelStr,
          timestamp: timeStr,
          count: randomCount,
          amount: randomAmount,
          anomaly: anomalies[randomIdx],
          severity: randomCount >= 6 ? 'CRITICAL' : randomCount >= 4 ? 'HIGH' : 'MEDIUM',
          topAccount: accounts[randomIdx],
        };

        if (randomCount >= 5) {
          setLastAlert({
            time: timeStr,
            msg: `High-Risk Spike: ${randomCount} flagged transactions (₹${randomAmount.toLocaleString('en-IN')}) via ${accounts[randomIdx]}`,
            account: accounts[randomIdx],
          });
        }

        // Keep last 12 points for clean responsive graph
        const next = [...prev.slice(1), newPoint];
        return next;
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [isLive]);

  // Graph Dimensions & Layout calculations
  const svgWidth = 900;
  const svgHeight = 220;
  const padLeft = 45;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 35;
  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  const maxVal = 10;
  const thresholdVal = 5;

  const getX = (index: number) => {
    return padLeft + (index / (dataPoints.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return padTop + chartHeight - (val / maxVal) * chartHeight;
  };

  // Build SVG path
  const linePoints = dataPoints.map((pt, i) => `${getX(i)},${getY(pt.count)}`);
  const linePath = linePoints.length > 0 ? `M ${linePoints.join(' L ')}` : '';
  const areaPath =
    linePoints.length > 0
      ? `M ${getX(0)},${padTop + chartHeight} L ${linePoints.join(' L ')} L ${getX(
          dataPoints.length - 1
        )},${padTop + chartHeight} Z`
      : '';

  const thresholdY = getY(thresholdVal);

  const totalHighRiskCount = dataPoints.reduce((acc, p) => acc + p.count, 0);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden text-[#1E1B4B]">
      {/* Graph Top Controls Bar */}
      <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-white flex items-center justify-between gap-3">
        {/* Left Title & Status Beacon */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#383278]">
            <Activity className="w-4 h-4 text-[#ED1B24]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider flex items-center gap-1.5">
                <span>Real-Time High-Risk Transaction Velocity</span>
              </h2>
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF1F2] border border-[#FECDD3] text-[10px] font-bold text-[#ED1B24]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ED1B24] animate-pulse" />
                  <span>LIVE STREAMING</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F1F5F9] border border-[#CBD5E1] text-[10px] font-medium text-[#64748B]">
                  <span>PAUSED</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Stats: Total Flagged */}
        <div className="flex items-center ml-auto text-right">
          <div>
            <span className="text-[10px] text-[#4A4A6A] block uppercase font-bold tracking-wider">Total Flagged</span>
            <span className="text-base font-black text-[#ED1B24] font-mono">{totalHighRiskCount}</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="p-4 relative bg-white select-none">
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-44 sm:h-52"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Kerala Cyberdome Red Gradient */}
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ED1B24" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#ED1B24" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines & Y-Axis Labels */}
            {[0, 2, 4, 6, 8, 10].map(val => {
              const y = getY(val);
              return (
                <g key={val}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={svgWidth - padRight}
                    y2={y}
                    stroke="#F1F5F9"
                    strokeDasharray={val === 0 ? undefined : '3 3'}
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 10}
                    y={y + 3}
                    fill="#94A3B8"
                    fontSize="10"
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Critical Alert Threshold Line (5 txns) */}
            <line
              x1={padLeft}
              y1={thresholdY}
              x2={svgWidth - padRight}
              y2={thresholdY}
              stroke="#ED1B24"
              strokeDasharray="4 4"
              strokeWidth="1.2"
              strokeOpacity="0.7"
            />
            <text
              x={svgWidth - padRight - 8}
              y={thresholdY - 5}
              fill="#ED1B24"
              fontSize="9"
              fontWeight="bold"
              textAnchor="end"
              fontFamily="monospace"
            >
              THRESHOLD (≥ 5 TXNS)
            </text>

            {/* Gradient Filled Area */}
            {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}

            {/* Clean Chart Line */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#ED1B24"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data Points and Hover Target Slices */}
            {dataPoints.map((pt, i) => {
              const cx = getX(i);
              const cy = getY(pt.count);
              const isHovered = hoveredPoint?.id === pt.id;
              const isLatest = i === dataPoints.length - 1;

              return (
                <g key={pt.id}>
                  {/* Invisible broad hover column */}
                  <rect
                    x={cx - (chartWidth / dataPoints.length) / 2}
                    y={padTop}
                    width={chartWidth / dataPoints.length}
                    height={chartHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={e => {
                      setHoveredPoint(pt);
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoverPos({ x: rect.left + rect.width / 2, y: rect.top });
                    }}
                    onMouseLeave={() => setHoveredPoint(null)}
                    onClick={() => onInspectEntity?.(pt.topAccount)}
                  />

                  {/* Vertical guide line on hover */}
                  {isHovered && (
                    <line
                      x1={cx}
                      y1={padTop}
                      x2={cx}
                      y2={padTop + chartHeight}
                      stroke="#737373"
                      strokeDasharray="2 2"
                      strokeWidth="1"
                    />
                  )}

                  {/* Point circle */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 5.5 : isLatest ? 4.5 : 3.5}
                    fill={pt.count >= 5 ? '#ED1B24' : pt.count >= 3 ? '#D97706' : '#383278'}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    className="transition-all duration-150"
                  />

                  {/* X-Axis Time Label */}
                  <text
                    x={cx}
                    y={padTop + chartHeight + 18}
                    fill={isHovered ? '#1E1B4B' : isLatest ? '#ED1B24' : '#64748B'}
                    fontSize="9"
                    fontWeight={isHovered || isLatest ? 'bold' : 'normal'}
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {pt.timeLabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Hover Popover Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-white border border-[#CBD5E1] rounded-xl shadow-xl p-3 text-xs font-mono space-y-1.5 min-w-[260px]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1.5">
              <span className="text-[#4A4A6A] text-[10px] flex items-center gap-1 font-sans font-medium">
                <Clock className="w-3 h-3 text-[#383278]" />
                Interval: <strong className="text-[#1E1B4B]">{hoveredPoint.timestamp}</strong>
              </span>
              <RiskBadge level={hoveredPoint.severity} />
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[#4A4A6A] text-[11px] font-sans">Flagged Txns:</span>
              <span className="font-bold text-[#ED1B24] text-xs">
                {hoveredPoint.count} transactions
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#4A4A6A] text-[11px] font-sans">Volume at Risk:</span>
              <span className="font-bold text-emerald-700 text-xs">
                ₹{hoveredPoint.amount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-[10px] text-[#1E1B4B] pt-1 border-t border-[#E2E8F0] font-sans">
              <span className="text-[#4A4A6A] block font-medium">Primary Anomaly:</span>
              <span className="text-[#D97706] font-semibold">{hoveredPoint.anomaly}</span>
            </div>
            <div className="text-[10px] text-[#383278] pt-0.5 flex items-center justify-between font-sans">
              <span>Target: <span className="font-mono font-semibold">{hoveredPoint.topAccount}</span></span>
              <span className="text-[#ED1B24] font-semibold text-[10px]">Click to inspect</span>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Ticker Footer */}
      <div className="px-5 py-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#ED1B24] shrink-0 animate-ping" />
          <span className="text-[#ED1B24] font-bold uppercase text-[10px] shrink-0">
            Latest Incident [{lastAlert.time}]:
          </span>
          <span className="truncate text-[#1E1B4B] font-medium font-sans">
            {lastAlert.msg}
          </span>
        </div>

        {onInspectEntity && (
          <button
            type="button"
            onClick={() => onInspectEntity(lastAlert.account)}
            className="text-[#ED1B24] hover:text-[#D0151D] text-[11px] font-bold flex items-center gap-1 shrink-0 ml-auto transition-colors cursor-pointer"
          >
            <span>Triage Entity ({lastAlert.account})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
