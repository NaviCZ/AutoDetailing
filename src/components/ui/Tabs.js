// src/components/ui/Tabs.js
import React, { useState } from 'react';

export function Tabs({ defaultValue, children }) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { activeTab, onTabChange: setActiveTab });
    }
    return child;
  });

  return <div className="space-y-4">{childrenWithProps}</div>;
}

export function TabsList({ children }) {
  return <div className="flex space-x-2 border-b">{children}</div>;
}

export function TabsTrigger({ children, value, activeTab, onTabChange }) {
  const isActive = value === activeTab;
  return (
    <button
      onClick={() => onTabChange(value)}
      className={`px-4 py-2 ${isActive ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ children, value, activeTab }) {
  if (value !== activeTab) return null;
  return <div className="mt-4">{children}</div>;
}