
import React from 'react';
import { getProgressBarColor } from '../utils/progressColor';

interface ProgressBarProps {
  value: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value }) => {
  const normalizedValue = Math.max(0, Math.min(100, value));

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className={`${getProgressBarColor(normalizedValue)} h-2.5 rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${normalizedValue}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;
