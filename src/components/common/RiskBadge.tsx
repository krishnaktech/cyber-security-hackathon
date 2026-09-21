import React from 'react';
import { RiskLevel } from '../../types/forensic';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  showScore?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  showScore = false,
  className = '',
  size = 'sm',
}) => {
  const getStyle = (lvl: RiskLevel) => {
    switch (lvl) {
      case 'CRITICAL':
        return 'bg-[#FFF1F2] text-[#ED1B24] border-[#FECDD3] font-bold';
      case 'HIGH':
        return 'bg-[#FFF1F2] text-[#E11D48] border-[#FECDD3] font-bold';
      case 'MEDIUM':
        return 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A] font-semibold';
      case 'LOW':
      default:
        return 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0] font-semibold';
    }
  };

  const pad = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border uppercase tracking-wider ${getStyle(
        level
      )} ${pad} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          level === 'CRITICAL'
            ? 'bg-[#ED1B24] shadow-[0_0_6px_rgba(237,27,36,0.6)]'
            : level === 'HIGH'
            ? 'bg-[#E11D48]'
            : level === 'MEDIUM'
            ? 'bg-[#D97706]'
            : 'bg-[#16A34A]'
        }`}
      />
      <span>{level}</span>
      {showScore && score !== undefined && (
        <span className="font-mono ml-0.5 font-bold opacity-90">{score}</span>
      )}
    </span>
  );
};
