import { LyricsResult, Mood, Duration, WeatherData, ConditionCode, Persona } from "@/lib/types";

const MOOD_META: Record<
  Mood,
  { ko: string; suno: string[]; bpm: string; en: string }
> = {
  upbeat: { ko: "발랄·신나는", suno: ["Upbeat Pop", "K-pop", "Bright", "Energetic"], bpm: "128 BPM", en: "energetic upbeat bright" },
  calm: { ko: "차분·잔잔한", suno: ["Calm", "Acoustic", "Soft Pop", "Mellow"], bpm: "84 BPM", en: "calm soft mellow" },
  hiphop: { ko: "힙합·트렌디", suno: ["Hip-Hop", "Trap", "Boom Bap", "Catchy Hook"], bpm: "92 BPM", en: "trendy hip-hop groovy" },
  ballad: { ko: "감성 발라드", suno: ["Ballad", "Emotional", "Piano", "K-Ballad"], bpm: "72 BPM", en: "emotional cinematic ballad" },
  kids: { ko: "동요·키즈", suno: ["Kids", "Nursery", "Cheerful", "Simple Melody"], bpm: "110 BPM", en: "cute playful nursery" },
};

export function moodLabel(m: Mood): string {
  return MOOD_META[m].ko;
}

const CONDITION_EN: Record<ConditionCode, string> = {
  sunny: "sunny clear blue sky",
  partly: "partly cloudy sky",
  cloudy: "overcast grey clouds",
  rain: "rainy day with raindrops",
  shower: "passing rain showers",
  snow: "snowy white scenery",
  thunder: "dramatic thunderstorm",
};

const HOOKS: Record<Mood, string[]> = {
  upbeat: ["오늘도 좋은 날, 날씨송 시작!", "비가 와도 OK, 맑아도 OK!", "날씨 체크 완료, 출발해 볼까!"],
  calm: ["천천히 호흡해요, 오늘의 하늘", "포근하게 안아주는 오늘 날씨", "조용히 스며드는 하루의 시작"],
  hiphop: ["Yeah, 날씨 브리핑 나가신다", "체크체크, 오늘 기온 몇 도?", "우산 챙겨 fresh하게 ride"],
  ballad: ["그대에게 전하는 오늘의 하늘", "창밖을 바라보면 떠오르는 날씨", "이 노래에 담은 오늘의 마음"],
  kids: ["해님 안녕! 구름도 안녕!", "오늘 날씨 어때요? 같이 불러요!", "우산 쓰고 폴짝폴짝!"],
};

function rpick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateLyrics(weather: WeatherData, mood: Mood, duration: Duration, persona?: Persona): LyricsResult {
  const m = MOOD_META[mood];
  const { region, condition, tempHigh, tempLow, precipitation, forecastLabel, conditionEmoji } = weather;
  const tagWords = weather.tags.map((t) => t.label);
  const hook = rpick(HOOKS[mood]);
  const headline = tagWords[0] ?? "기분 좋은 하루";

  const intro = `[Intro]\n${conditionEmoji} ${region}, ${forecastLabel}\n${m.ko} 멜로디로 시작해요`;

  const verse = `[Verse]\n아침 창문 열어보니 ${condition}, 오늘의 ${region}\n낮 최고 ${tempHigh}도 아침 최저 ${tempLow}도\n${
    precipitation >= 50
      ? `우산은 꼭 챙겨요, 비 소식이 있으니까`
      : `하늘을 올려다봐요, 기분 좋은 하루의 시작`
  }`;

  const chorus = `[Chorus]\n${hook}\n${region}의 오늘은 ${condition}, ${tempHigh}도\n${headline}, 잊지 말아요\nWeatherCast와 함께하는 ${forecastLabel}`;

  const outro = `[Outro]\n오늘도 안전한 하루 되세요\n${region}의 날씨였습니다 ${conditionEmoji}`;

  let lyrics: string;
  if (duration === 15) {
    lyrics = `${chorus}`;
  } else if (duration === 30) {
    lyrics = `${verse}\n\n${chorus}`;
  } else {
    lyrics = `${intro}\n\n${verse}\n\n${chorus}\n\n${outro}`;
  }

  const narration = `안녕하세요, ${forecastLabel}입니다. 오늘 ${region}은 ${condition}, 낮 최고 ${tempHigh}도까지 오르겠습니다. ${
    precipitation >= 50 ? `강수확률이 ${precipitation}%로 우산을 챙기시는 게 좋겠습니다. ` : ""
  }${
    weather.fineDust === "나쁨" || weather.fineDust === "매우나쁨"
      ? `미세먼지가 ${weather.fineDust} 수준이니 외출 시 마스크 착용하세요. `
      : ""
  }자세한 날씨, 노래로 전해드릴게요!`;

  const videoPrompt = `Vertical 9:16 short-form music video, a virtual K-pop weather caster idol singing and dancing, ${CONDITION_EN[weather.conditionCode]}, ${m.en} mood, dynamic camera moves, vivid colors, clean broadcast studio with LED weather map showing ${tempHigh}°C, Korean weather graphics overlay, lip-sync close-ups, high detail, 4k`;

  const thumbnailText = `${region} ${condition}\n${tempHigh}° / ${tempLow}°`;

  const thumbnailPrompt = `YouTube Shorts thumbnail, bold Korean title "${region} ${condition}", cute virtual weather idol character, ${CONDITION_EN[weather.conditionCode]} background, ${m.en} color palette, big readable typography, high contrast, eye-catching`;

  const title = `${region} ${condition} 날씨송 · ${persona ? persona.name : m.ko}`;

  return {
    title,
    lyrics,
    narration,
    sunoStyleTags: m.suno,
    videoPrompt,
    thumbnailText,
    thumbnailPrompt,
    source: "mock",
  };
}
