import FastImage from "react-native-fast-image";
import Modal from "react-native-modal/dist/modal";
import { Icon } from "./Icon";
import { ThemedInput } from "./ThemedInput";
import { ThemedView } from "./ThemedView";
import { PropsWithChildren } from "react";
import { useThemeColor } from "@/hooks/useThemeColor";
import { StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "./ThemedText";

type ThemedModalProps = PropsWithChildren<{
  isVisible: boolean;
  title: string;
  onPressClose: () => void;
}>;

export function ThemedModal({ isVisible, title, onPressClose, children }: ThemedModalProps) {
  const iconColor = useThemeColor({}, 'icon');

  return (
    <Modal isVisible={isVisible}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.headerContainer}>
          <ThemedText type="defaultSemiBold">{title}</ThemedText>
          <TouchableOpacity onPress={onPressClose}>
            <Icon name="close" size={30} color={iconColor} />
          </TouchableOpacity>
        </ThemedView>
        {children}
      </ThemedView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  }
});