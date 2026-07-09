import React from 'react';

interface LoaderProps {
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ message = 'Processing...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="relative w-16 h-16 mb-4">
        {/* Animated outer rings */}
        <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30 animate-ping"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      </div>
      <p className="text-muted-foreground font-medium animate-pulse text-sm">{message}</p>
    </div>
  );
};
