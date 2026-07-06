import React from 'react';

export default function Button({ 
  children, 
  variant = 'ghost', 
  onClick, 
  disabled, 
  className = '',
  icon: Icon,
  ...props 
}) {
  
  const baseClasses = 'inline-flex items-center justify-center gap-1.5 rounded-[5px] px-[12px] py-[7px] text-[12px] font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  let variantClasses = '';

  if (variant === 'primary') {
    variantClasses = 'bg-accent border border-accent text-text-primary hover:bg-accent-hover hover:border-accent-hover';
  } else if (variant === 'danger') {
    variantClasses = 'bg-transparent border border-[rgba(248,81,73,0.4)] text-red hover:bg-[rgba(248,81,73,0.1)] hover:border-red';
  } else if (variant === 'success') {
    variantClasses = 'bg-transparent border border-[rgba(63,185,80,0.4)] text-green hover:bg-[rgba(63,185,80,0.1)] hover:border-green';
  } else {
    // Default / Ghost
    variantClasses = 'bg-transparent border border-border text-text-secondary hover:border-accent hover:text-accent hover:bg-[rgba(47,129,247,0.08)]';
  }

  return (
    <button 
      className={`${baseClasses} ${variantClasses} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon className="w-[14px] h-[14px]" />}
      {children}
    </button>
  );
}
