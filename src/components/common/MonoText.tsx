import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MonoTextProps {
  value: string;
  truncate?: number;
  copyable?: boolean;
  className?: string;
  title?: string;
}

export const MonoText: React.FC<MonoTextProps> = ({
  value,
  truncate,
  copyable = true,
  className = '',
  title,
}) => {
  const [copied, setCopied] = useState(false);

  const display = truncate && value.length > truncate
    ? `${value.slice(0, Math.floor(truncate / 2))}...${value.slice(-Math.ceil(truncate / 2))}`
    : value;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-[#1E1B4B] bg-[#F8FAFC] px-1.5 py-0.5 rounded border border-[#CBD5E1] text-[11px] group ${className}`}
      title={title || value}
    >
      <span className="truncate">{display}</span>
      {copyable && (
        <button
          type="button"
          onClick={handleCopy}
          className="text-[#64748B] hover:text-[#ED1B24] opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
          title="Copy identifier"
        >
          {copied ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
        </button>
      )}
    </span>
  );
};
