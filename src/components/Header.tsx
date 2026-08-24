import React from 'react';
import { Sparkles, MapPin } from 'lucide-react';

interface HeaderProps {
  onOpenLocations: () => void;
  locationCount: number;
  theme: 'off-white' | 'black';
}

export const Header: React.FC<HeaderProps> = ({
  onOpenLocations,
  locationCount,
  theme,
}) => {
  const isDark = theme === 'black';

  return (
    <header
      className={'sticky top-0 z-30 backdrop-blur-xl border-b px-4 py-2.5 transition-all shadow-xs ' + (
        isDark
          ? 'bg-[#202c33]/95 border-[#2a3942]'
          : 'bg-white/95 border-slate-200'
      )}
    >
      <div className="max-w-xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#16697A] flex items-center justify-center shadow-md shadow-[#16697A]/20 flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Location notes */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenLocations}
            className={'p-2 rounded-xl border relative transition-all ' + (
              isDark
                ? 'bg-[#111b21] hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef] border-[#2a3942]'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200'
            )}
            title="Saved Locations & Notes"
          >
            <MapPin className="w-4 h-4 text-[#16697A] dark:text-[#489fb5]" />
            {locationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#16697A] text-white text-[9px] font-bold flex items-center justify-center">
                {locationCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
