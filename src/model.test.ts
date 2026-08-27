import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  describeChange,
  formatFrequency,
  frequencyToPosition,
  positionToFrequency,
  sanitizeSettings,
  settingsToQuery,
} from './model';

describe('frequency scale', () => {
  it('maps the audible range logarithmically from zero to one', () => {
    expect(frequencyToPosition(20)).toBeCloseTo(0);
    expect(frequencyToPosition(20000)).toBeCloseTo(1);
    expect(positionToFrequency(0.5)).toBeCloseTo(632.46, 1);
  });

  it('round trips a filter frequency', () => {
    const frequency = 3450;
    expect(positionToFrequency(frequencyToPosition(frequency))).toBeCloseTo(frequency, 5);
  });

  it('clamps positions outside the control', () => {
    expect(positionToFrequency(-1)).toBe(20);
    expect(positionToFrequency(2)).toBe(20000);
  });
});

describe('shared settings', () => {
  it('accepts a valid bell EQ link', () => {
    const parsed = sanitizeSettings(new URLSearchParams('type=peaking&frequency=1450&q=2.2&gain=9'));
    expect(parsed.invalid).toBe(false);
    expect(parsed.settings).toEqual({ type: 'peaking', frequency: 1450, q: 2.2, gain: 9 });
  });

  it('falls back safely when shared values are invalid', () => {
    const parsed = sanitizeSettings(new URLSearchParams('type=comb&frequency=99999&q=nope&gain=50'));
    expect(parsed.invalid).toBe(true);
    expect(parsed.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('includes gain only when it affects the selected filter', () => {
    expect(settingsToQuery({ type: 'lowpass', frequency: 800, q: 0.7, gain: 12 })).not.toContain('gain');
    expect(settingsToQuery({ type: 'peaking', frequency: 800, q: 0.7, gain: -4 })).toContain('gain=-4.0');
  });
});

describe('teaching copy', () => {
  it('formats beginner-friendly frequencies', () => {
    expect(formatFrequency(850)).toBe('850 Hz');
    expect(formatFrequency(2200)).toBe('2.2 kHz');
  });

  it('describes each filter direction in words', () => {
    expect(describeChange({ type: 'lowpass', frequency: 1000, q: 1, gain: 0 })).toContain('above');
    expect(describeChange({ type: 'highpass', frequency: 1000, q: 1, gain: 0 })).toContain('below');
    expect(describeChange({ type: 'peaking', frequency: 1000, q: 4, gain: -6 })).toContain('reduced');
  });
});
