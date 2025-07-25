// ui/Card.tsx
import React from 'react';
import { View, ViewProps } from 'react-native';
import { theme } from '@/theme';

const CardBase: React.FC<ViewProps> = ({ style, ...rest }) => (
  <View
    {...rest}
    style={[
      {
        backgroundColor: theme.colors.card,
        borderRadius: 12,
        padding: theme.spacing(4),
      },
      style,
    ]}
  />
);

export { CardBase as Card };        // named
export default CardBase;            // ⭐ default so Expo Router is happy if it ever scans it
