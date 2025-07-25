export const theme = {
  colors: {
    bg:     '#101215',  // dark charcoal
    card:   '#16181B',
    text:   '#FFFFFF',
    muted:  '#9EA2A8',
    accent: '#35FF7B',  // Whoop-green
  },
  spacing: (n: number) => n * 4,          // 1 → 4 px
  fonts: {
    headline: 'BasierCircle-CondensedBold',
    body:     'BasierCircle-Regular',
  },
} as const;
