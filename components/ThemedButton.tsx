import { useThemeColor } from "@/hooks/useThemeColor";
import { TouchableOpacity } from "react-native";
import { ThemedText } from "./ThemedText";
import { TouchableOpacityProps } from "react-native-gesture-handler";

export type ThemedButtonProps = TouchableOpacityProps & {
  btnText?: string;
  txtColor?: string;
};

export function ThemedButton({ style, ...rest }: ThemedButtonProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const color = useThemeColor({}, 'text');

  return (
    <TouchableOpacity style={[{ padding: 8, width: '20%', backgroundColor: color, marginLeft: 4, marginEnd: 4, borderRadius: 5}, style]} {...rest}>
      <ThemedText type='default' style={{ textAlign: 'center', color: rest.txtColor || color}}>{rest.btnText}</ThemedText>
    </TouchableOpacity>
  )
}