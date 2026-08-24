import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface DigitalClockProps {
  theme: 'off-white' | 'black';
}

export const DigitalClock: React.FC<DigitalClockProps> = ({ theme }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isDark = theme === 'black';

  const timeString = format(time, 'hh:mm:ss');
  const ampm = format(time, 'a');
  const dateString = format(time, 'EEEE, MMMM d, yyyy');

  return (
    <div
      className={'p-4 text-center select-none ' + (
        isDark ? 'bg-[#202c33] border-[#2a3942] text-[#e9edef]' : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
      )}
    >
      <div className="inline-flex items-baseline gap-2 justify-center">
        <span
          className={'text-3xl sm:text-4xl font-mono font-extrabold tracking-tight ' + (
            isDark ? 'text-[#e9edef]' : 'text-slate-900'
          )}
        >
          {timeString}
        </span>
        <span className="text-xs sm:text-sm font-mono font-bold text-[#16697A] dark:text-[#489fb5] uppercase tracking-wider">
          {ampm}
        </span>
      </div>
      <p className={'text-[11px] font-semibold mt-1 tracking-wide ' + (isDark ? 'text-[#8696a0]' : 'text-slate-500')}>
        {dateString}
      </p>
    </div>
  );
};
