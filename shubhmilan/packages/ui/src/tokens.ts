/**
 * Design tokens — warm editorial matrimonial palette.
 *
 * Brand archetype: calm, premium, considered. Burgundy + gold echo Indian wedding
 * tradition without the loud Bollywood reds. Cream surfaces and warm neutrals
 * keep the UI feeling like an editorial magazine, not a generic SaaS.
 */

export const colors = {
  primary: '#8B1E3F',
  primaryDark: '#5F1029',
  primaryLight: '#A83D5F',
  primary50: '#FBF1F4',
  primary100: '#F4DCE3',
  primary200: '#E8B4C2',
  primaryRing: 'rgba(139, 30, 63, 0.18)',

  accent: '#C8A45C',
  accentDark: '#9E7F3F',
  accentLight: '#E0C58D',
  accent50: '#FBF6EB',

  bg: '#FBF7F2',
  surface: '#FFFFFF',
  surfaceAlt: '#F5EFE7',
  surfaceMuted: '#F0E9E0',

  ink: '#1A1718',
  text: '#3A3236',
  textMuted: '#6B6166',
  textSubtle: '#8E858A',

  border: '#EAE3DC',
  borderStrong: '#D6CCC1',
  hairline: '#F0E9E0',

  success: '#2E7D5B',
  success50: '#E6F1EB',
  danger: '#B83A3A',
  danger50: '#F8E8E8',
  dangerRing: 'rgba(184, 58, 58, 0.18)',
  warn: '#B57A00',
  warn50: '#FFF5E0',
  info: '#1E5FA8',
  info50: '#E7F0FA',
} as const;

export const fonts = {
  body: 'Inter',
  display: 'PlayfairDisplay',
} as const;

export const radii = { xs: 6, sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
  display: 44,
} as const;

export const lineHeights = {
  tight: 1.15,
  snug: 1.3,
  normal: 1.5,
  relaxed: 1.65,
} as const;

export const shadows = {
  xs: { shadowColor: '#1A1718', shadowOpacity: 0.04, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  card: { shadowColor: '#1A1718', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  lg: { shadowColor: '#1A1718', shadowOpacity: 0.10, shadowRadius: 40, shadowOffset: { width: 0, height: 16 }, elevation: 6 },
  ring: { shadowColor: '#8B1E3F', shadowOpacity: 0.18, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 },
} as const;

export const motion = {
  fast: 120,
  base: 180,
  slow: 280,
  easeOut: 'ease-out',
} as const;

export const tierColors = {
  BASIC: colors.textMuted,
  VERIFIED: colors.success,
  PREMIUM: colors.accent,
} as const;

/**
 * Dark palette — matches the light palette structurally so either can be assigned to the
 * same variable name. Screens that need dark mode resolve at runtime via useAppTheme() in
 * apps/mobile — the raw `colors` export above stays the light default for back-compat.
 */
export const darkColors = {
  primary: '#E85A82',
  primaryDark: '#B34265',
  primaryLight: '#F08AA7',
  primary50: '#2A1921',
  primary100: '#3A2530',
  primary200: '#4F2F3F',
  primaryRing: 'rgba(232, 90, 130, 0.24)',

  accent: '#DCBD78',
  accentDark: '#B89A5E',
  accentLight: '#EBD49A',
  accent50: '#2A2418',

  bg: '#13100F',
  surface: '#1C1816',
  surfaceAlt: '#231E1C',
  surfaceMuted: '#2A2522',

  ink: '#F5EFE7',
  text: '#D8D2CB',
  textMuted: '#8E858A',
  textSubtle: '#6B6166',

  border: '#2D2825',
  borderStrong: '#3A3431',
  hairline: '#231E1C',

  success: '#3FC288',
  success50: '#1A2822',
  danger: '#E87166',
  danger50: '#2A1A1A',
  dangerRing: 'rgba(232, 113, 102, 0.24)',
  warn: '#E0AD4A',
  warn50: '#2A2215',
  info: '#5B9BDD',
  info50: '#1A2028',
} as const;

export type Colors = typeof colors;
export type Radii = typeof radii;
export type Spacing = typeof spacing;
