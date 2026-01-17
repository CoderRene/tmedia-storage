import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";
import { StyleSheet, TouchableOpacity, useColorScheme, Platform } from "react-native";
import Modal from "react-native-modal";
import RNFS from 'react-native-fs';
import { useEffect, useState } from "react";
import { Bounce, Pulse } from "react-native-animated-spinkit";
import { ThemedButton } from "@/components/ThemedButton";
import { useIndexService as useHomeService } from "../index.service";
import Toast from "react-native-toast-message";
import { ThemedIcon } from "@/components/ThemedIcon";
import { PermissionsAndroid } from 'react-native';

type FolderSelectionProps = {
  open: boolean;
  onClose: () => void;
};

type FolderType = {
  view: React.JSX.Element;
  item: RNFS.ReadDirItem
}

export function FolderUploadSelection({ open, onClose }: FolderSelectionProps) {

  const DCIMPath = RNFS.DownloadDirectoryPath.split('Download')[0] + 'DCIM';

  const colorTheme = useColorScheme();
  const bgColor = useThemeColor({}, 'background');
  const iconColor = useThemeColor({}, 'icon');

  const [showProgressbarModal, setShowProgressbarModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [openConfirmation, setOpenConfirmation] = useState(false);
  const [isFetchingFiles, setIsFetchingFiles] = useState(false);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<RNFS.ReadDirItem | null>(null);
  const [files, setFiles] = useState<RNFS.ReadDirItem[]>([]);

  const { chunkFolderItemsUpload } = useHomeService();

  useEffect(() => {
    if (!open) return;

    const loadFolders = async () => {
      if (Platform.OS === 'android') {
        const permission = Platform.Version >= 33 ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
        const granted = await PermissionsAndroid.request(
          permission,
          {
            title: 'Storage Permission',
            message: 'This app needs access to your storage to read folders.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        console.log('Permission granted:', granted);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          const message = granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN 
            ? 'Permission denied. Please enable storage permission in app settings.' 
            : 'Cannot access storage without permission.';
          Toast.show({
            type: 'error',
            text1: 'Permission Denied',
            text2: message,
          });
          return;
        }
      }

      const views: FolderType[] = [];

      try {
        const result = await RNFS.readDir(DCIMPath);
        let i = 0;
        for (const item of result) {
          views.push({
            view: (
              <ThemedView >
                <ThemedText key={i} type="default" style={{ ...styles.item, borderColor: iconColor }}>{item.name}</ThemedText>
              </ThemedView>
            ),
            item: item,
          });
          i++;
        }

        setFolders(views);
      } catch (error) {
        console.error('Error reading DCIM:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to read DCIM folder.',
        });
      }
    };

    loadFolders();
  }, [open]);

  const readDir = async (item: RNFS.ReadDirItem) => {
    setIsFetchingFiles(true);
    setOpenConfirmation(true);

    console.log('item: ', item.path);

    setTimeout(async () => {
      try {
        const result = await RNFS.readDir(item.path);
        console.log('readDir result:', result);
        setFiles(result);
        setIsFetchingFiles(false);
      } catch (error) {
        console.error('Error reading directory:', error);
        setIsFetchingFiles(false);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to read folder contents.',
        });
      }
    }, 1000);
  }

  return (
    <>
      <Modal isVisible={showProgressbarModal}>
        <ThemedView style={styles.modalContainer}>
          <Bounce size={100} color={iconColor} />
          <ThemedView style={{ alignItems: 'center' }}>
            <ThemedText>Uploading... Please wait...</ThemedText>
            <ThemedText>{uploadProgress}%</ThemedText>
          </ThemedView>
        </ThemedView>
      </Modal>

      <Modal isVisible={openConfirmation}>
        <ThemedView style={styles.confirmationContainer}>
          <ThemedText type="subtitle" style={{ marginBottom: 16 }}>{isFetchingFiles ? 'Reading' : 'Confirm'}</ThemedText>
          <ThemedView style={styles.confirmationModalSubContainer}>
            {isFetchingFiles && (<Pulse size={100} color={iconColor} />)}
            <ThemedText type="default">{isFetchingFiles ? 'Reading folder... Please wait...' : `We will about to upload ${files.length} file(s). Are you sure?`}</ThemedText>
            {!isFetchingFiles && (
              <ThemedView style={styles.confirmationModalBtns}>
                <ThemedButton btnText="NO" txtColor={colorTheme === 'dark' ? 'black' : 'white'} onPress={() => setOpenConfirmation(false)} />
                <ThemedButton btnText="YES" txtColor={colorTheme === 'dark' ? 'black' : 'white'}
                  onPress={() => {
                    setShowProgressbarModal(true);
                    setOpenConfirmation(false);
                    chunkFolderItemsUpload(selectedFolder?.name || '', files,
                      (progress) => setUploadProgress(progress),
                      (hasError) => {
                        if (!hasError) {
                          Toast.show({
                            type: 'success',
                            text1: 'Success',
                            text2: 'Files uploaded successfully',
                          });
                        }
                        setShowProgressbarModal(false);
                        onClose();
                      }
                    )
                  }}
                />
              </ThemedView>
            )}
          </ThemedView>
        </ThemedView>
      </Modal>

      <Modal isVisible={open} style={{ ...styles.container, backgroundColor: bgColor }}>
        <ThemedView style={styles.subContainer}>
          <ThemedText type="subtitle">DCIM</ThemedText>
          <ThemedText type="default">Select a folder to upload</ThemedText>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <ThemedIcon name="close-outline" size={30} color={iconColor} />
          </TouchableOpacity>

          <ThemedView style={styles.itemsContainer}>
            {folders.length === 0 && <ThemedText type="default">No item(s) found</ThemedText>}
            {folders.map((folder) => (
              <TouchableOpacity onPress={() => {
                setSelectedFolder(folder.item);
                readDir(folder.item);
              }}
              >
                {folder.view}
              </TouchableOpacity>
            ))}
          </ThemedView>
        </ThemedView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  subContainer: {
    position: 'relative',
    borderRadius: 10,
    padding: 16,
    width: '100%',
    height: '100%',
  },
  itemsContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: 8,
  },
  itemContainer: {
    flexDirection: 'row',
  },
  item: {
    borderBottomWidth: 1,
    padding: 8,
  },
  confirmationContainer: {
    borderRadius: 10,
    padding: 16,
  },
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    borderRadius: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  confirmationModalSubContainer: {
    flexDirection: 'column',
    alignItems: 'center'
  },
  confirmationModalBtns: {
    flexDirection: 'row',
    marginTop: 16
  }
});