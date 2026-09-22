import React from 'react';

interface TabPanelProps {
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({ children, className = '' }: TabPanelProps) {
  return (
    <div className={`tab-panel ${className}`}>
      {children}
    </div>
  );
}