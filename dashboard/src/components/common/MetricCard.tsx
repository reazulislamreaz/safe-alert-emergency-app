import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  subtext?: string;
  glowColor?: 'red' | 'blue' | 'amber' | 'emerald';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  icon: Icon,
  iconColor = 'text-brand-400',
  iconBg = 'bg-brand-500/10',
  subtext,
  glowColor,
  onClick,
}) => {
  const glowClasses = {
    red: 'hover:border-red-500/40 hover:shadow-glow-red',
    blue: 'hover:border-blue-500/40 hover:shadow-glow-blue',
    amber: 'hover:border-amber-500/40 hover:shadow-glow-amber',
    emerald: 'hover:border-emerald-500/40 hover:shadow-glow-emerald',
  };

  return (
    <div
      onClick={onClick}
      className={`glass-panel p-5 rounded-2xl transition-all duration-300 relative overflow-hidden group ${
        onClick ? 'cursor-pointer hover:-translate-y-1' : ''
      } ${glowColor ? glowClasses[glowColor] : 'hover:border-slate-700'}`}
    >
      {/* Subtle background glow effect */}
      <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            {title}
          </p>
          <h3 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
        </div>

        <div className={`p-3 rounded-xl border border-white/10 ${iconBg} ${iconColor} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(change || subtext) && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          {change && (
            <span
              className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md ${
                isPositive
                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                  : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {change}
            </span>
          )}
          {subtext && <span className="text-slate-400 font-medium">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
