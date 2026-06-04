import { WeatherData, HourlyPoint, ForecastType } from "@/lib/types";
import { REGION_COORDS } from "@/lib/weather/constants";
import { forecastLabelFromDate } from "@/lib/weather/dates";
import { wmoToCondition } from "@/lib/weather/wmo";
import { buildTags, buildSummary, pickHeadlineCondition, pmToFineDust, uvToLabel } from "@/lib/weather/derive";
import { analyzeHourly } from "@/lib/weather/analyze";

const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

interface OMForecast {
  current?: {
    time: string;
    temperature_2m: number;
    weather_code: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: (number | null)[];
    weather_code: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    uv_index_max: (number | null)[];
  };
}

// 실시간 데이터: Open-Meteo (무료·키 불필요). 케이웨더 키가 생기면 이 함수만 교체.
export async function fetchRealWeather(
  date: string,
  forecastType: ForecastType,
  region: string
): Promise<WeatherData> {
  const coord = REGION_COORDS[region] ?? REGION_COORDS["서울"];

  const params = new URLSearchParams({
    latitude: String(coord.lat),
    longitude: String(coord.lon),
    hourly: "temperature_2m,precipitation_probability,weather_code,relative_humidity_2m,wind_speed_10m",
    daily: "temperature_2m_max,temperature_2m_min,uv_index_max",
    current: "temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m",
    timezone: "Asia/Seoul",
    forecast_days: "7",
    wind_speed_unit: "ms",
  });
  const forecastUrl = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coord.lat}&longitude=${coord.lon}&current=pm10,pm2_5&timezone=Asia/Seoul`;

  const [fRes, aqRes] = await Promise.all([
    fetch(forecastUrl, { cache: "no-store" }),
    fetch(aqUrl, { cache: "no-store" }).catch(() => null),
  ]);
  if (!fRes.ok) throw new Error(`open-meteo forecast ${fRes.status}`);
  const j = (await fRes.json()) as OMForecast;

  let pm25: number | null = null;
  if (aqRes && aqRes.ok) {
    const aj = (await aqRes.json()) as { current?: { pm2_5?: number } };
    pm25 = aj?.current?.pm2_5 ?? null;
  }

  // 대상 날짜 결정 (요청 날짜가 예보 범위 안이면 사용, 아니면 오늘)
  const targetDate = date && j.daily.time.includes(date) ? date : j.daily.time[0];
  const di = j.daily.time.indexOf(targetDate);
  const hi = Math.round(j.daily.temperature_2m_max[di]);
  const lo = Math.round(j.daily.temperature_2m_min[di]);
  const uv = j.daily.uv_index_max[di];

  const nowKey = j.current?.time ? j.current.time.slice(0, 13) : null; // "YYYY-MM-DDTHH"

  const hourly: HourlyPoint[] = [];
  for (let i = 0; i < j.hourly.time.length; i++) {
    const t = j.hourly.time[i];
    if (!t.startsWith(targetDate)) continue;
    const wc = wmoToCondition(j.hourly.weather_code[i]);
    const hourNum = Number(t.slice(11, 13));
    hourly.push({
      time: t,
      hourLabel: `${hourNum}시`,
      temp: Math.round(j.hourly.temperature_2m[i]),
      condition: wc.label,
      conditionCode: wc.code,
      emoji: wc.emoji,
      precipProb: Math.round(j.hourly.precipitation_probability[i] ?? 0),
      humidity: Math.round(j.hourly.relative_humidity_2m[i] ?? 0),
      windSpeed: Math.round(j.hourly.wind_speed_10m[i] ?? 0),
      isNow: nowKey ? t.slice(0, 13) === nowKey : false,
    });
  }

  const headline = pickHeadlineCondition(hourly.map((h) => h.conditionCode));
  const precipitation = hourly.length ? Math.max(...hourly.map((h) => h.precipProb)) : 0;
  const humidity = hourly.length
    ? Math.round(avg(hourly.map((h) => h.humidity)))
    : Math.round(j.current?.relative_humidity_2m ?? 0);
  const windSpeed = hourly.length
    ? Math.max(...hourly.map((h) => h.windSpeed))
    : Math.round(j.current?.wind_speed_10m ?? 0);
  const fineDust = pmToFineDust(pm25);
  const uvIndex = uvToLabel(uv);
  const tags = buildTags({ cond: headline.code, tempHigh: hi, tempLow: lo, precipitation, windSpeed, fineDust });
  const analysis = analyzeHourly(hourly, hi, lo, forecastLabelFromDate(targetDate));

  return {
    region,
    date: targetDate,
    forecastType,
    forecastLabel: forecastLabelFromDate(targetDate),
    tempHigh: hi,
    tempLow: lo,
    condition: headline.label,
    conditionCode: headline.code,
    conditionEmoji: headline.emoji,
    precipitation,
    humidity,
    windSpeed,
    fineDust,
    uvIndex,
    summary: buildSummary(forecastLabelFromDate(targetDate), hi, lo, precipitation, fineDust),
    tags,
    hourly,
    analysis,
    source: "open-meteo",
    observedAt: j.current?.time ?? "",
  };
}
