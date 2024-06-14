import { StyleSheet, FlatList, TouchableOpacity, Animated, RefreshControl } from 'react-native';
import FastImage from 'react-native-fast-image';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedIcon } from '@/components/ThemedIcon';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ThemedInput } from '@/components/ThemedInput';
import { AnimationConstants } from '@/constants/Animation';
import Toast from 'react-native-toast-message';
import Modal from "react-native-modal";
import { Pulse } from 'react-native-animated-spinkit';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Icon } from '@/components/Icon';
import { useRouter } from 'expo-router';
import { ActionType, useAppContext } from '../context';
import { useIndexService as useHomeService } from './index.service';
import { FolderUploadSelection } from './components/FolderSelection';
import { usePermissions } from '@/hooks/usePermissions';
import AlbumCardMemo from './components/AlbumCard';
import { ThemedModal } from '@/components/ThemedModal';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedConfirmationModal } from '@/components/ThemedConfirmationModal';

const API_URL = process.env.EXPO_PUBLIC_API_ENDPOINT;

export default function HomeScreen() {
  const [homeFolders, setHomeFolders] = useState<{folder: string, thumbnailPath: string}[]>([]);
  const [toggleAddFolder, setToggleAddFolder] = useState(false);
  const [isContactingServer, setIsContactingServer] = useState(false);
  const [openFolderSelection, setOpenFolderSelection] = useState(false);
  const [openEditDeleteModal, setOpenEditDeleteModal] = useState(false);
  const [openDeleteConfirmationModal, setOpenDeleteConfirmationModal] = useState(false);
  const [grabbedAlbumInfo, setGrabbedAlbumInfo] = useState<{folder:string; newFolderName:string; thumbnailPath:string}>({folder: '', newFolderName: '', thumbnailPath: ''});

  const { dispatch } = useAppContext();
  const { addHomeFolder, getHomeFolders, deleteHomeFolder, editHomeFolder } = useHomeService();
  const { requestPermissions } = usePermissions();

  const router = useRouter();
  const iconColor = useThemeColor({}, 'icon');
  const fadeAnim = useRef(new Animated.Value(0)).current; // Initial value for opacity: 0
  const rotationAnim = useRef(new Animated.Value(0)).current; // Initial value for rotation: 0

  useEffect(() => {
    requestPermissions(async () => {
      await getFolders();
    });
  }, []);

  const getFolders = async () => {
    setIsContactingServer(true);

    const folders = await getHomeFolders();
    if (!folders) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch home folders',
      });

      setIsContactingServer(false);
      return;
    }

    setHomeFolders(folders);
    setIsContactingServer(false);
  }

  const toggleAddFolderVisibility = () => {
    if (!toggleAddFolder)
      setToggleAddFolder(true);

    Animated.timing(
      fadeAnim,
      {
        toValue: !toggleAddFolder ? 1 : 0,
        duration: AnimationConstants.duration,
        useNativeDriver: true,
      }
    ).start(({ finished }) => {
      if (toggleAddFolder && finished)
        setToggleAddFolder(false);
    });

    Animated.timing(
      rotationAnim,
      {
        toValue: !toggleAddFolder ? 48 : 0,
        duration: AnimationConstants.duration,
        useNativeDriver: true,
      }
    ).start();
  };

  const onAddBtnPress = async (inputText: string) => {
    if (inputText.length === 0) {
      Toast.show({
        type: 'info',
        text1: 'Empty album name',
        text2: 'Album name cannot be empty',
      });
      return;
    }

    const data = await addHomeFolder(inputText);
    if (!data) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add folder',
      });
      return;
    }

    setHomeFolders([...homeFolders, {folder: inputText, thumbnailPath: 'undefined'}]);

    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: data,
    });
  }

  const onDeleteAlbum = async () => {
    if (!grabbedAlbumInfo) return;

    const data = await deleteHomeFolder(grabbedAlbumInfo.folder);
    if (!data) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete folder',
      });
      return;
    }

    setHomeFolders(homeFolders.filter((folder) => folder.folder !== grabbedAlbumInfo.folder));
    setOpenEditDeleteModal(false);
    setOpenDeleteConfirmationModal(false);

    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Album deleted successfully',
    });
  }

  const onSaveEditAlbum = async () => {
    if (!grabbedAlbumInfo) return;

    const data = await editHomeFolder(grabbedAlbumInfo.folder, grabbedAlbumInfo.newFolderName);
    if (!data) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to edit folder',
      });
      return;
    }

    setHomeFolders(homeFolders.map((folder) => {
      if (folder.folder === grabbedAlbumInfo.folder) {
        return {folder: grabbedAlbumInfo.folder, thumbnailPath: grabbedAlbumInfo.thumbnailPath};
      }
      return folder;
    }));

    setOpenEditDeleteModal(false);
    await getFolders();

    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Album edited successfully',
    });
  }

  const renderAlbums = useCallback(({ item }: {item: {folder:string; thumbnailPath:string}}) => ( 
    <AlbumCardMemo
      onPress={() => {
        dispatch({type: ActionType.SELECT_FOLDER, payload: item.folder});
        router.navigate('(folder_view)/folder');
      }}
      onLongPress={() => {
        setGrabbedAlbumInfo({newFolderName: item.folder, folder: item.folder, thumbnailPath: item.thumbnailPath});
        setOpenEditDeleteModal(true);
      }}
      folder={item.folder} 
      thumbnailPath={item.thumbnailPath} 
      iconColor={iconColor}
    />
  ), [homeFolders]);

  return (
    <ThemedView style={styles.rootContainer}>
      <ThemedConfirmationModal
        isVisible={openDeleteConfirmationModal}
        title='Delete Album'
        warningMsg='Are you sure you want to delete this album?'
        onPressYes={onDeleteAlbum}
        onPressNo={() => setOpenDeleteConfirmationModal(false)}
        noTxt='NO'
        yesTxt='YES'
      />

      <ThemedModal title='Edit Album' isVisible={openEditDeleteModal} onPressClose={() => setOpenEditDeleteModal(false)}>
        <ThemedView style={styles.editDeleteAlbumModalContainer}>
          {grabbedAlbumInfo?.thumbnailPath.includes('undefined') ? (
            <Icon name='image-outline' size={100} color={iconColor} style={styles.editDeleteImage} />
          ) : (
            <FastImage 
              style={[{width: 100, height: 100}, styles.editDeleteImage]} source={{uri: `${API_URL}/media/${grabbedAlbumInfo?.thumbnailPath}`}}
            />
          )}
          <ThemedInput 
            style={styles.editAlbumInput} 
            value={grabbedAlbumInfo.newFolderName} 
            onChangeText={(txt) => setGrabbedAlbumInfo((prev) => ({...prev, newFolderName: txt}))} 
            placeholder='New album name...' 
            btnText='SAVE' 
            onBtnPress={onSaveEditAlbum}
          />

          <ThemedButton 
            btnText='DELETE'
            txtColor='white'
            style={styles.deleteBtn}
            onPress={async () => {
              setOpenDeleteConfirmationModal(true);
            }}
          />
        </ThemedView>
      </ThemedModal>

      <Modal 
        isVisible={isContactingServer}
      >
        <ThemedView style={styles.modalContainer}>
          <Pulse size={100} color={iconColor} />
          <ThemedText type='defaultSemiBold'>Contacting the server. Please wait...</ThemedText>
        </ThemedView>
      </Modal>

      <FolderUploadSelection open={openFolderSelection} onClose={() => setOpenFolderSelection(false)} />

      <ThemedView style={styles.addFolderContainer}>

        <TouchableOpacity onPress={toggleAddFolderVisibility}>
          <Animated.View style={{transform: [{rotate: rotationAnim.interpolate({inputRange: [0, 48], outputRange: ['0deg', '-48deg']})}]}}>
            <ThemedIcon name='add' size={styles.icon.width}/>
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setOpenFolderSelection(true)}>
          <ThemedIcon name='folder' style={styles.folderIcon} size={styles.icon.width} />
        </TouchableOpacity>
      </ThemedView>

      {toggleAddFolder && (
        <Animated.View style={[{opacity: fadeAnim}, styles.addNewAlbumInputContainer]}>
          <ThemedInput placeholder='Album name...' label='Add new album' btnText='ADD' onBtnPress={onAddBtnPress}/>
        </Animated.View> 
      )}

      <ThemedText type='title' style={styles.titleContainer}>Albums</ThemedText>

      {homeFolders.length === 0 && (
        <ThemedText type='default' style={{textAlign: 'center'}}>No albums found</ThemedText> 
      )}

      <FlatList
        data={homeFolders}
        renderItem={renderAlbums}
        extraData={homeFolders}
        ItemSeparatorComponent={() => <ThemedView style={styles.itemSeparator} colorType='icon' />}
        refreshControl={<RefreshControl refreshing={isContactingServer} onRefresh={async () => await getFolders()} />}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    borderRadius: 8,
  },
  addFolderContainer: {
    position: 'relative',
    padding: 8, 
    alignItems: 'center', 
    flexDirection: 'row', 
    justifyContent: 'flex-end'
  },
  icon: {
    width: 30,
  },
  folderIcon: {
    marginLeft: 10
  },
  addNewAlbumInputContainer: {
    flexDirection: 'row', 
    paddingLeft: 8, 
    paddingRight: 8
  },
  itemSeparator: {
    height: 1, 
    marginHorizontal: 16 
  },
  editDeleteAlbumModalContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
  },
  editDeleteImage: {
    marginBottom: 16,
    borderRadius: 5
  },
  editAlbumInput: {
    width: 220,
  },
  deleteBtn: {
    marginTop: 8, 
    width: '100%', 
    backgroundColor: 'red',
  }
});
