import { StyleSheet, useColorScheme } from "react-native";
import Modal from "react-native-modal/dist/modal";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { ThemedButton } from "./ThemedButton";

type ThemedModalProps = {
  isVisible: boolean;
  title: string;
  warningMsg: string;
  noTxt: string;
  yesTxt: string;
  onPressNo: () => void;
  onPressYes: () => void;
};

export function ThemedConfirmationModal({ isVisible, title, onPressNo, onPressYes, noTxt, yesTxt, warningMsg }: ThemedModalProps) {

  const colorScheme = useColorScheme();

  return (
    <Modal isVisible={isVisible}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.headerContainer}>
          <ThemedText type="defaultSemiBold">{title}</ThemedText>
        </ThemedView>
        <ThemedText type="default">{warningMsg}</ThemedText>

        <ThemedView style={styles.btnsContainer}>
          <ThemedButton 
            btnText={noTxt}
            txtColor={colorScheme === 'dark' ? 'black' : 'white'}
            onPress={onPressNo}
          />
          <ThemedButton 
            btnText={yesTxt}
            txtColor={colorScheme === 'dark' ? 'black' : 'white'}
            onPress={onPressYes}
          />
        </ThemedView>
      </ThemedView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  btnsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  }
});