import { useThemeColor } from "@/hooks/useThemeColor";
import { TextInput, TextInputProps, TouchableHighlight, TouchableOpacity } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { useState } from "react";

export type ThemedInputProps = TextInputProps & {
  lightColor?: string;
  darkColor?: string;
  label?: string;
  btnText?: string;
  onBtnPress?: (inputText: string) => void;
};

export function ThemedInput({
  style,
  ...rest
}: ThemedInputProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const color = useThemeColor({}, 'text');

  const [inputText, setInputText] = useState('');

  return (
    <ThemedView style={{ flexDirection: 'column'}}>
      {rest.label && (<ThemedText type='default'>{rest.label}</ThemedText>)}
      <ThemedView style={{ flexDirection: 'row', alignItems: 'center'}}>
        <TextInput style={[{ backgroundColor, borderColor, color, borderWidth: 1, borderRadius: 4, padding: 8, ...(rest.btnText ? {width: '79%'}: {width: '100%'}) }, style]} 
          placeholderTextColor={color} 
          cursorColor={color} 
          onChangeText={setInputText}
          value={inputText}
          {...rest} 
        />
        {rest.btnText && (
          <TouchableOpacity style={{ padding: 8, width: '20%', backgroundColor: color, marginLeft: 4, marginEnd: 4, borderRadius: 5}} 
            onPress={() => {
              rest.onBtnPress?.(inputText);
              setInputText('');
            }}
          >
            <ThemedText type='default' style={{ textAlign: 'center', color: backgroundColor}}>{rest.btnText}</ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>
    </ThemedView>
  );
}