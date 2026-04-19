export const colors = {
  primary: '#8b1e3f',
  primaryDark: '#5f1029',
  primaryLight: '#a83d5f',
  primary50: '#fdf3f6',
  primary100: '#f8dce5',
  accent: '#c8a45c',
  accentDark: '#9e7f3f',
  bg: '#fafafa',
  surface: '#ffffff',
  ink: '#1a1a1a',
  text: '#2e2e33',
  textMuted: '#6e6e78',
  border: '#e7e5ea',
  success: '#1e8a5f',
  success50: '#e6f5ee',
  danger: '#c0392b',
  danger50: '#fbecea',
  warn: '#b57a00',
  warn50: '#fff6e0',
  info: '#1e5fa8',
  info50: '#e7f0fa',
} as const;

export const fonts = {
  body: 'Inter',
  display: 'PlayfairDisplay',
} as const;

export const radii = { xs: 4, sm: 8, md: 12, lg: 18, xl: 24, pill: 999 } as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const fontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  xxxl: 34,
} as const;

export const shadows = {
  xs: { shadowColor: '#0f0f14', shadowOpacity: 0.04, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  card: { shadowColor: '#14141e', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  lg: { shadowColor: '#14141e', shadowOpacity: 0.1, shadowRadius: 40, shadowOffset: { width: 0, height: 16 }, elevation: 6 },
} as const;

export const tierColors = {
  BASIC: colors.textMuted,
  VERIFIED: colors.success,
  PREMIUM: colors.accent,
} as const;

export type Colors = typeof colors;
export type Radii = typeof radii;
export type Spacing = typeof spacing;
