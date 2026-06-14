/**
 * Refiqo design tokens — dark theme with a violet accent, derived from the
 * `/screens` mockups. Single source of truth for colors/spacing/typography.
 */

export const colors = {
  // surfaces — from the dashboard Figma spec
  background: '#040914',
  backgroundDeep: '#020610',
  surface: '#0B1020',
  surfaceAlt: '#141B2D',
  surfaceElevated: '#1E253A',
  card: 'rgba(255, 255, 255, 0.05)',

  // brand / accent
  primary: '#6A3EFF',
  primaryDark: '#4F2DCF',
  primaryBright: '#7C3CFF',
  primaryLink: '#8B5CF6',
  primaryMuted: 'rgba(106, 62, 255, 0.2)',

  // status
  success: '#10B981',
  successSolid: '#059669',
  successMuted: 'rgba(16, 185, 129, 0.1)',
  warning: '#F59E0B',
  warningMuted: 'rgba(245, 158, 11, 0.1)',
  danger: '#EF4444',
  dangerMuted: 'rgba(239, 68, 68, 0.1)',
  info: '#3B82F6',

  // text
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0F172A',

  // lines / inputs
  border: 'rgba(255, 255, 255, 0.08)',
  inputBg: 'rgba(255, 255, 255, 0.05)',
  inputBorder: 'rgba(255, 255, 255, 0.1)',

  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.7)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 30, fontWeight: '800' as const, lineHeight: 36 },
  h1: { fontSize: 24, fontWeight: '700' as const, lineHeight: 30 },
  h2: { fontSize: 20, fontWeight: '700' as const, lineHeight: 26 },
  h3: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 21 },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const, lineHeight: 21 },
  small: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '500' as const, lineHeight: 14 },
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  glow: {
    shadowColor: '#6A3EFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  },
} as const;

/** Brand gradients — mirror the onboarding HTML (`--grad-purple` / `--grad-purple-blue`). */
export const gradients = {
  brand: ['#8B5CF6', '#4F7CFF'] as const, // purple → blue (primary button / accents)
  purple: ['#7C5CFF', '#5B3DF0'] as const, // purple → deep purple (chips, markers)
} as const;

export const theme = { colors, spacing, radii, typography, shadow, gradients };
export type Theme = typeof theme;
