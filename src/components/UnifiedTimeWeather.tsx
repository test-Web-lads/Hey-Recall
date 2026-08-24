import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Droplets, Wind } from 'lucide-react';

interface UnifiedTimeWeatherProps {
  theme: 'off-white' | 'black';
}

interface WeatherState {
  temperature: number;
  conditionCode: number;
  humidity: number;
  windSpeed: number;
  locationName: string;
}

export const UnifiedTimeWeather: React.FC<UnifiedTimeWeatherProps> = ({ theme }) => {
  const isDark = theme === 'black';

  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [unitCelsius, setUnitCelsius] = useState(true);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchWeather = (lat: number, lon: number, locName: string = 'Current Area') => {
    setLoadingWeather(true);
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=${unitCelsius ? 'celsius' : 'fahrenheit'}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.current) {
          setWeather({
            temperature: Math.round(data.current.temperature_2m),
            conditionCode: data.current.weather_code,
            humidity: Math.round(data.current.relative_humidity_2m),
            windSpeed: Math.round(data.current.wind_speed_10m),
            locationName: locName,
          });
        }
      })
      .catch(() => {
        setWeather({
          temperature: unitCelsius ? 20 : 68,
          conditionCode: 0,
          humidity: 50,
          windSpeed: 6,
          locationName: 'Local Weather',
        });
      })
      .finally(() => setLoadingWeather(false));
  };

  const loadLocationWeather = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeather(pos.coords.latitude, pos.coords.longitude, 'Nearby');
        },
        () => {
          fetchWeather(40.7128, -74.006, 'New York');
        },
        { timeout: 5000 }
      );
    } else {
      fetchWeather(40.7128, -74.006, 'New York');
    }
  };

  useEffect(() => {
    loadLocationWeather();
  }, [unitCelsius]);

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="w-5 h-5 text-amber-500" />;
    if (code <= 3) return <Cloud className="w-5 h-5 text-teal-400" />;
    if (code <= 48) return <Cloud className="w-5 h-5 text-slate-400" />;
    if (code <= 67) return <CloudRain className="w-5 h-5 text-blue-400" />;
    if (code <= 77) return <CloudSnow className="w-5 h-5 text-sky-200" />;
    if (code <= 99) return <CloudLightning className="w-5 h-5 text-amber-400" />;
    return <Sun className="w-5 h-5 text-amber-500" />;
  };

  const getWeatherLabel = (code: number) => {
    if (code === 0) return 'Sunny';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 48) return 'Foggy';
    if (code <= 67) return 'Rain';
    if (code <= 77) return 'Snow';
    if (code <= 99) return 'Storm';
    return 'Clear';
  };

  const timeString = format(time, 'hh:mm:ss');
  const ampm = format(time, 'a');
  const dateString = format(time, 'EEE, MMM d, yyyy');

  return (
    <div
      className={'rounded-2xl border p-3.5 sm:p-4 shadow-xs transition-all select-none ' + (
        isDark
          ? 'bg-[#202c33] border-[#2a3942] text-[#e9edef]'
          : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
      )}
    >
      <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-[#2a3942] gap-3">
        {/* Left Half (50%): Digital Clock & Date */}
        <div className="flex flex-col justify-center pr-2">
          <div className="flex items-baseline gap-1">
            <span
              className={'text-xl sm:text-2xl font-mono font-extrabold tracking-tight ' + (
                isDark ? 'text-[#e9edef]' : 'text-slate-900'
              )}
            >
              {timeString}
            </span>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-[#16697A] dark:text-[#489fb5] uppercase">
              {ampm}
            </span>
          </div>
          <p className={'text-[11px] font-semibold mt-0.5 truncate ' + (isDark ? 'text-[#8696a0]' : 'text-slate-500')}>
            {dateString}
          </p>
        </div>

        {/* Right Half (50%): Weather & Temperature */}
        <div className="flex items-center justify-between pl-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className={'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ' + (
              isDark ? 'bg-[#111b21] border border-[#2a3942]' : 'bg-slate-50 border border-slate-200'
            )}>
              {weather ? getWeatherIcon(weather.conditionCode) : <Sun className="w-5 h-5 text-amber-500" />}
            </div>

            <div className="min-w-0">
              <button
                type="button"
                onClick={() => setUnitCelsius(!unitCelsius)}
                className="flex items-baseline gap-0.5 text-left hover:opacity-80 transition-opacity cursor-pointer"
                title="Toggle °C / °F"
              >
                <span className="text-base sm:text-lg font-extrabold tracking-tight">
                  {loadingWeather ? '--' : weather?.temperature}
                </span>
                <span className="text-[11px] font-bold text-[#16697A] dark:text-[#489fb5]">
                  {unitCelsius ? '°C' : '°F'}
                </span>
              </button>
              <p className={'text-[10px] sm:text-[11px] font-medium leading-tight truncate ' + (isDark ? 'text-[#8696a0]' : 'text-slate-500')}>
                {weather ? getWeatherLabel(weather.conditionCode) : 'Sunny'}
              </p>
            </div>
          </div>

          <div className={'hidden sm:flex flex-col items-end text-[10px] space-y-0.5 ' + (isDark ? 'text-[#8696a0]' : 'text-slate-400')}>
            <div className="flex items-center gap-1">
              <Droplets className="w-3 h-3 text-blue-400" />
              <span>{weather?.humidity ?? 50}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Wind className="w-3 h-3 text-teal-400" />
              <span>{weather?.windSpeed ?? 5}{unitCelsius ? 'km/h' : 'mph'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
