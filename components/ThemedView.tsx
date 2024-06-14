import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  colorType?: "background" | "text" | "tint" | "icon" | "tabIconDefault" | "tabIconSelected";
};

export function ThemedView({ style, lightColor, darkColor, colorType, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, colorType || 'background');

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
