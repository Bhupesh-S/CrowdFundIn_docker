import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({ current, goal, className = '' }) => {
  const percentage = Math.min((current / goal) * 100, 100);
  
  return (
    <div className={`progress ${className}`}>
      <div 
        className="progress-bar" 
        style={{ width: `${percentage}%` }}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
};

export default ProgressBar;
