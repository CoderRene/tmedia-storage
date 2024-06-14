import { ImageSourcePropType, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { IconProps } from '@expo/vector-icons/build/createIconSet';
import { ComponentProps } from 'react';

export type ThemedIconProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  lightIcon?: ImageSourcePropType;
  darkIcon?: ImageSourcePropType;
};

export function ThemedIcon({ style, ...rest }: IconProps<ComponentProps<typeof Ionicons>['name']>) {
  const iconColor = useThemeColor({}, 'icon');

  return <Ionicons size={28} style={[{ marginBottom: -3, color: rest.color || iconColor }, style]} {...rest} />
  // return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
