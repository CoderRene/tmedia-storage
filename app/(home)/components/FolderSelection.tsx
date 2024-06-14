import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";
import { StyleSheet, TouchableOpacity } from "react-native";
import Modal from "react-native-modal";
import RNFS from 'react-native-fs';
import { useEffect, useState } from "react";
import { Bounce, Pulse } from "react-native-animated-spinkit";
import { ThemedButton } from "@/components/ThemedButton";
import { useIndexService as useHomeService } from "../index.service";
import Toast from "react-native-toast-message";
import { ThemedIcon } from "@/components/ThemedIcon";

type FolderSelectionProps = {
  open: boolean;
  onClose: () => void;
};

type FolderType = {
  view: React.JSX.Element;
  item: RNFS.ReadDirItem
}

export function FolderUploadSelection({open, onClose}: FolderSelectionProps) {

  const DCIMPath = RNFS.DownloadDirectoryPath.split('Download')[0] + 'DCIM';

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

    const views: FolderType[] = [];

    RNFS.readDir(DCIMPath).then((result) => {
      let i = 0;
      for (const item of result) {
        views.push({
          view: (
            <ThemedView >
              <ThemedText key={i} type="default" style={{...styles.item, borderColor: iconColor}}>{item.name}</ThemedText> 
            </ThemedView>
          ),
          item: item,
        });
        i++;
      }

      setFolders(views);
    });
  }, [open]);

  const readDir = (item: RNFS.ReadDirItem) => {
    setIsFetchingFiles(true);
    setOpenConfirmation(true);

    setTimeout(() => {
      RNFS.readDir(item.path).then((result) => {
        setFiles(result);
        setIsFetchingFiles(false);
      });
    }, 1000);
  }

  return (
    <>
      <Modal isVisible={showProgressbarModal}>
        <ThemedView style={styles.modalContainer}>
          <Bounce size={100} color={iconColor} />
          <ThemedView style={{alignItems: 'center'}}>
            <ThemedText>Uploading... Please wait...</ThemedText>
            <ThemedText>{uploadProgress}%</ThemedText>
          </ThemedView>
        </ThemedView>
      </Modal>

      <Modal isVisible={openConfirmation}>
        <ThemedView style={styles.confirmationContainer}>
          <ThemedText type="subtitle" style={{marginBottom: 16}}>{isFetchingFiles ? 'Reading' : 'Confirm'}</ThemedText>
          <ThemedView style={styles.confirmationModalSubContainer}>
            {isFetchingFiles && ( <Pulse size={100} color={iconColor} /> )}
            <ThemedText type="default">{isFetchingFiles ? 'Reading folder... Please wait...' : `We will about to upload ${files.length} file(s). Are you sure?`}</ThemedText>
            {!isFetchingFiles && (
              <ThemedView style={styles.confirmationModalBtns}>
                <ThemedButton btnText="YES" 
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
                <ThemedButton btnText="NO" onPress={() => setOpenConfirmation(false)}/>
              </ThemedView>
            )}
          </ThemedView>
        </ThemedView>
      </Modal>

      <Modal isVisible={open} style={{...styles.container, backgroundColor: bgColor}}>
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