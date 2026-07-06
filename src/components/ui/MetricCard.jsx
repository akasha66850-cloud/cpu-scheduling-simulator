import React from 'react';

export default function MetricCard({ label, value, icon: Icon, colorClass = 'text-accent', tooltip }) {
  return (
    <div className="bg-elevated border border-elevated rounded-[5px] p-[10px_12px] flex flex-col items-center justify-center text-center relative group">
      {/* Icon and Label */}
      <div className="flex items-center gap-1.5 mb-1.5 text-text-muted">
        {Icon && <Icon className="w-[14px] h-[14px]" />}
        <span className="text-[10px] uppercase tracking-wide font-medium">{label}</span>
      </div>
      
      {/* Value */}
      <div className={`text-[18px] sm:text-[20px] font-bold ${colorClass}`}>
        {value}
      </div>

      {/* Optional Tooltip */}
      {tooltip && (
        <div className="absolute opacity-0 group-hover:opacity-100 bg-surface text-text-primary text-[11px] p-2 rounded-[5px] border border-border shadow-xl -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap pointer-events-none z-50 transition-opacity">
          {tooltip}
        </div>
      )}
    </div>
  );
}
