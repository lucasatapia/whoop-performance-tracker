// lib/chartTheme.ts
import { VictoryTheme } from 'victory';      // always from 'victory'
import { theme } from '@/theme';

export const chartTheme = {
  ...VictoryTheme.material,
  axis: {
    ...VictoryTheme.material.axis,
    style: {
      ...VictoryTheme.material.axis.style,
      tickLabels: { fill: theme.colors.text },
      axisLabel:  { fill: theme.colors.text },
    },
  },
  line: {
    ...VictoryTheme.material.line,
    style: { data: { strokeWidth: 2 } },
  },
};
