export type FilterKind = 'lowpass' | 'highpass' | 'peaking';

export interface FilterSettings {
  type: FilterKind;
  frequency: number;
  q: number;
  gain: number;
}

export const DEFAULT_SETTINGS: FilterSettings = {
  type: 'lowpass',
  frequency: 2200,
  q: 0.8,
  gain: 0,
};

export const FILTER_LABELS: Record<FilterKind, string> = {
  lowpass: 'Low-pass',
  highpass: 'High-pass',
  peaking: 'Bell EQ',
};

export const PRESETS: Array<{ name: string; note: string; settings: FilterSettings }> = [
  { name: 'Under a blanket', note: 'Cuts away bright detail', settings: { type: 'lowpass', frequency: 850, q: 0.7, gain: 0 } },
  { name: 'Tiny radio', note: 'Removes weight and rumble', settings: { type: 'highpass', frequency: 720, q: 0.9, gain: 0 } },
  { name: 'Nasal spotlight', note: 'Pushes the center forward', settings: { type: 'peaking', frequency: 1450, q: 2.2, gain: 9 } },
];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function frequencyToPosition(frequency: number): number {
  return Math.log10(frequency / 20) / Math.log10(20000 / 20);
}

export function positionToFrequency(position: number): number {
  return 20 * Math.pow(1000, clamp(position, 0, 1));
}

export function formatFrequency(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)} kHz`;
  return `${Math.round(value)} Hz`;
}

export function describeChange(settings: FilterSettings): string {
  const frequency = formatFrequency(settings.frequency);
  if (settings.type === 'lowpass') {
    return `Frequencies above ${frequency} roll away. Expect less brightness and detail.`;
  }
  if (settings.type === 'highpass') {
    return `Frequencies below ${frequency} roll away. Expect less weight and rumble.`;
  }
  const direction = settings.gain >= 0 ? 'boosted' : 'reduced';
  const width = settings.q < 0.8 ? 'broad area' : settings.q > 3 ? 'narrow band' : 'focused area';
  return `A ${width} around ${frequency} is ${direction} by ${Math.abs(settings.gain).toFixed(1)} dB.`;
}

export function sanitizeSettings(params: URLSearchParams): { settings: FilterSettings; invalid: boolean } {
  const candidateType = params.get('type');
  let invalid = false;
  const type: FilterKind = candidateType === 'highpass' || candidateType === 'peaking' || candidateType === 'lowpass'
    ? candidateType
    : DEFAULT_SETTINGS.type;
  if (candidateType && candidateType !== type) invalid = true;

  const parse = (key: string, fallback: number, min: number, max: number): number => {
    const raw = params.get(key);
    if (raw === null) return fallback;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < min || value > max) {
      invalid = true;
      return fallback;
    }
    return value;
  };

  return {
    settings: {
      type,
      frequency: parse('frequency', DEFAULT_SETTINGS.frequency, 20, 20000),
      q: parse('q', DEFAULT_SETTINGS.q, 0.3, 12),
      gain: parse('gain', DEFAULT_SETTINGS.gain, -15, 15),
    },
    invalid,
  };
}

export function settingsToQuery(settings: FilterSettings): string {
  const params = new URLSearchParams({
    type: settings.type,
    frequency: String(Math.round(settings.frequency)),
    q: settings.q.toFixed(1),
  });
  if (settings.type === 'peaking') params.set('gain', settings.gain.toFixed(1));
  return params.toString();
}
