/** Weather & Atmosphere System */
export type WeatherType = 'sunny'|'rainy'|'starry'|'rainbow'|'snowy';

export interface WeatherState { type:WeatherType; intensity:number; moodBonus:number; }

const WEATHER_POOL: WeatherState[] = [
  { type:'sunny', intensity:0.7, moodBonus:5 },
  { type:'sunny', intensity:0.5, moodBonus:3 },
  { type:'sunny', intensity:0.9, moodBonus:8 },
  { type:'rainy', intensity:0.6, moodBonus:-2 },
  { type:'rainy', intensity:0.8, moodBonus:-4 },
  { type:'starry', intensity:0.7, moodBonus:4 },
  { type:'starry', intensity:0.5, moodBonus:2 },
  { type:'rainbow', intensity:1, moodBonus:15 },
  { type:'snowy', intensity:0.7, moodBonus:2 },
];

let currentWeather: WeatherState = WEATHER_POOL[0];
let lastWeatherChange = 0;

export const getWeather = (): WeatherState => {
  const now = Date.now();
  // Change weather every 30-60 minutes
  if (now - lastWeatherChange > 1800000 + Math.random() * 1800000) {
    // Rainbow is rare (5% chance)
    const roll = Math.random();
    if (roll < 0.05) currentWeather = { type:'rainbow', intensity:1, moodBonus:15 };
    else currentWeather = WEATHER_POOL[Math.floor(Math.random() * (WEATHER_POOL.length - 1))]; // skip rainbow
    lastWeatherChange = now;
  }
  return currentWeather;
};

export const weatherIcons: Record<WeatherType, string> = { sunny:'☀️', rainy:'🌧️', starry:'⭐', rainbow:'🌈', snowy:'❄️' };
export const weatherLabels: Record<WeatherType, string> = { sunny:'Sunny', rainy:'Rainy', starry:'Starry Night', rainbow:'Rainbow!', snowy:'Snowy' };
