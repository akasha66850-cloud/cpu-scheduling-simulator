import React from 'react';

export default function Badge({ children, variant = 'default', className = '' }) {
  let baseClasses = 'inline-flex items-center px-[8px] py-[2px] rounded-[10px] text-[10px] font-medium leading-tight';
  let variantClasses = '';

  switch (variant) {
    case 'success':
    case 'green':
      variantClasses = 'bg-[rgba(63,185,80,0.15)] text-green';
      break;
    case 'danger':
    case 'red':
      variantClasses = 'bg-[rgba(248,81,73,0.15)] text-red';
      break;
    case 'warning':
    case 'orange':
      variantClasses = 'bg-[rgba(227,179,65,0.15)] text-orange';
      break;
    case 'info':
    case 'blue':
    case 'cyan':
      variantClasses = 'bg-[rgba(47,129,247,0.15)] text-accent';
      break;
    case 'purple':
      variantClasses = 'bg-[rgba(188,140,255,0.15)] text-purple';
      break;
    case 'outline':
      variantClasses = 'bg-transparent border border-border text-text-secondary';
      break;
    default:
      variantClasses = 'bg-overlay text-text-primary';
      break;
  }

  return (
    <span className={`${baseClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
}
