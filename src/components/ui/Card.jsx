import React from 'react';

export default function Card({ children, className = '', ...props }) {
  return (
    <div 
      className={`bg-surface border border-border rounded-[8px] overflow-hidden ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, icon: Icon, meta, className = '' }) {
  return (
    <div className={`p-[12px_16px] border-b border-border-muted flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-2 text-text-primary text-[13px] font-semibold">
        {Icon && <Icon className="w-4 h-4 text-text-secondary" />}
        {title}
      </div>
      {meta && (
        <div className="text-[11px] text-text-muted">{meta}</div>
      )}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return (
    <div className={`p-[16px] ${className}`}>
      {children}
    </div>
  );
}
