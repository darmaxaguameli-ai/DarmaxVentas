import React from 'react';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  className = '',
  disabled = false,
  ...props
}) => {
  const baseClasses = 
    'flex h-12 w-full items-center justify-center rounded-lg px-6 text-base font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

  const variantClasses = {
    primary: 
      'bg-primary text-white hover:bg-primary/90 focus-visible:outline-primary',
    secondary: 
      'bg-gray-500 text-white hover:bg-gray-600 focus-visible:outline-gray-600',
    danger: 
      'bg-red-500 text-white hover:bg-red-600 focus-visible:outline-red-600',
  };

  const combinedClasses = `
    ${baseClasses} 
    ${variantClasses[variant] || variantClasses.primary} 
    ${className}
  `;

  return (
    <button
      type={type}
      onClick={onClick}
      className={combinedClasses.trim()}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
