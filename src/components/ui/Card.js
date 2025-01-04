// src/components/ui/Card.js
import React from 'react';

export const Card = ({ children, className = '' }) => {
  return <div className={`bg-white shadow rounded-lg overflow-hidden ${className}`}>{children}</div>;
};

export const CardContent = ({ children, className = '' }) => {
  return <div className={`p-6 ${className}`}>{children}</div>;
};


export const CardHeader = ({ children, className = '' }) => {
  return (
    <div className={`border-b p-4 ${className}`}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className = '' }) => {
  return (
    <h2 className={`text-xl font-bold ${className}`}>
      {children}
    </h2>
  );
};