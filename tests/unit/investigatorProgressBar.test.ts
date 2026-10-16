// RiskWeave AI - Investigator Progress Bar Unit Tests
import { describe, it, expect } from 'vitest';
import { getWorkloadTheme } from '../../src/components/InvestigatorProgressBar';

describe('InvestigatorProgressBar Logic & Theming', () => {
  it('PB01: Computes green / teal available theme when workload is low', () => {
    const theme = getWorkloadTheme(1, 5); // 20%
    expect(theme.statusLabel).toBe('Capacity available');
    expect(theme.barColor).toContain('bg-teal');
    expect(theme.textColor).toContain('text-teal');
  });

  it('PB02: Computes amber warning theme when workload reaches 75%', () => {
    const theme = getWorkloadTheme(3, 4); // 75%
    expect(theme.statusLabel).toBe('Near capacity');
    expect(theme.barColor).toContain('bg-amber');
    expect(theme.textColor).toContain('text-amber');
  });

  it('PB03: Computes rose / full theme when workload reaches 100%', () => {
    const theme = getWorkloadTheme(4, 4); // 100%
    expect(theme.statusLabel).toBe('At capacity');
    expect(theme.barColor).toContain('bg-rose');
    expect(theme.textColor).toContain('text-rose');
  });

  it('PB04: Correctly handles overflow when workload exceeds max capacity', () => {
    const theme = getWorkloadTheme(6, 5); // 120%
    expect(theme.statusLabel).toBe('Over capacity');
    expect(theme.barColor).toContain('bg-rose');
  });

  it('PB05: Gracefully handles edge cases like 0 max capacity', () => {
    const theme = getWorkloadTheme(0, 0);
    expect(theme).toBeDefined();
    expect(theme.statusLabel).toBe('Capacity available');
  });
});
