// src/components/ui/Button.js
import React from 'react';

export const Button = ({ children, variant = 'default', onClick, className = '' }) => {
  const variants = {
    default: 'bg-blue-500 text-white',
    outline: 'border border-blue-500 text-blue-500'
  };

  return (
    <button className={`px-4 py-2 rounded ${variants[variant]} ${className}`} onClick={onClick}>
      {children}
    </button>
  );
};
export default Button;