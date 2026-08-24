import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Droplets, Wind, MapPin, RefreshCw } from 'lucide-react';

interface WeatherWidgetProps {
  theme: 'off-white' | 'black';
}

interface WeatherData {
  temperature: number;
  conditionCode: number;
  humidity: number;
  windSpeed: number;
  locationName: string;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ theme }) => {
  const isDark = theme === 'black';

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unitCelsius, setUnitCelsius] = useState(true); // Default to Celsius

  const fetchWeather = (lat: number, lon: number, locName: string = 'Current Area') => {
    setLoading(true);
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
          temperature: unitCelsius ? 22 : 72,
          conditionCode: 0,
          humidity: 48,
          windSpeed: 8,
          locationName: 'Local Weather',
        });
      })
      .finally(() => setLoading(false));
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
      fetchWeather(40.7128, -74.006, 'Local Area');
    }
  };

  useEffect(() => {
    loadLocationWeather();
  }, [unitCelsius]);

  const getWeatherInfo = (code: number) => {
    if (code === 0) return { label: 'Clear Sky', icon: <Sun className="w-6 h-6 text-amber-500 animate-spin-slow" /> };
    if (code <= 3) return { label: 'Partly Cloudy', icon: <Cloud className="w-6 h-6 text-teal-400" /> };
    if (code <= 48) return { label: 'Foggy', icon: <Cloud className="w-6 h-6 text-slate-400" /> };
    if (code <= 67) return { label: 'Rainy', icon: <CloudRain className="w-6 h-6 text-blue-400" /> };
    if (code <= 77) return { label: 'Snowy', icon: <CloudSnow className="w-6 h-6 text-sky-200" /> };
    if (code <= 99) return { label: 'Thunderstorm', icon: <CloudLightning className="w-6 h-6 text-amber-400" /> };
    return { label: 'Clear', icon: <Sun className="w-6 h-6 text-amber-500" /> };
  };

  const weatherInfo = weather ? getWeatherInfo(weather.conditionCode) : { label: 'Sunny', icon: <Sun className="w-6 h-6 text-amber-500" /> };

  return (
    <div
      className={'p-4 sm:p-5 transition-all ' + (
        isDark ? 'bg-[#202c33] border-[#2a3942] text-[#e9edef]' : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1 text-xs sm:text-sm font-bold text-[#16697A] dark:text-[#489fb5]">
          <MapPin className="w-4 h-4" />
          <span>{weather?.locationName || 'Live Weather'}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setUnitCelsius(!unitCelsius)}
            className={'text-xs font-bold px-2.5 py-0.5 rounded-full border transition-all ' + (
              isDark ? 'border-[#2a3942] text-[#8696a0]' : 'border-slate-200 text-slate-500'
            )}
            title="Toggle °C / °F"
          >
            {unitCelsius ? '°C' : '°F'}
          </button>
          <button
            type="button"
            onClick={loadLocationWeather}
            className={'p-1 rounded-lg transition-transform active:rotate-180 ' + (
              isDark ? 'text-[#8696a0]' : 'text-slate-400'
            )}
            title="Refresh weather"
          >
            <RefreshCw className={'w-3.5 h-3.5 ' + (loading ? 'animate-spin' : '')} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={'w-12 h-12 rounded-2xl flex items-center justify-center ' + (
            isDark ? 'bg-[#111b21] border border-[#2a3942]' : 'bg-slate-50 border border-slate-200'
          )}>
            {weatherInfo.icon}
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {loading ? '--' : weather?.temperature}
              </span>
              <span className="text-sm font-bold text-[#16697A] dark:text-[#489fb5]">
                {unitCelsius ? '°C' : '°F'}
              </span>
            </div>
            <p className={'text-xs sm:text-sm font-semibold ' + (isDark ? 'text-[#8696a0]' : 'text-slate-500')}>
              {weatherInfo.label}
            </p>
          </div>
        </div>

        <div className={'text-right text-xs space-y-1 ' + (isDark ? 'text-[#8696a0]' : 'text-slate-500')}>
          <div className="flex items-center justify-end gap-1">
            <Droplets className="w-3.5 h-3.5 text-blue-400" />
            <span>Humidity: {weather?.humidity ?? 50}%</span>
          </div>
          <div className="flex items-center justify-end gap-1">
            <Wind className="w-3.5 h-3.5 text-teal-400" />
            <span>Wind: {weather?.windSpeed ?? 5} {unitCelsius ? 'km/h' : 'mph'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
