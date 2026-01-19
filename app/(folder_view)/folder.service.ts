import axios from "axios";
import { Asset } from "react-native-image-picker";
import { MediaType } from "./folder";
import Toast from "react-native-toast-message";
// @ts-ignore
import RNExif from 'react-native-exif';
import RNFS from 'react-native-fs';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_ENDPOINT;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowAlert: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export function useFolderService() {
  const uploadMedia = async (folder: string, media: Asset, isVideo: boolean, onProgress: (progress: string) => void) => {
    // Get actual creation date from media timestamp or EXIF if available
    let creationDate = new Date(media.timestamp || Date.now()).toISOString();
    if (!isVideo) {
      try {
        let exif = await RNExif.getExif(media.uri);
        exif = exif.exif;
        
        if (exif.DateTimeOriginal) {
          const parts = exif.DateTimeOriginal.split(' ');
          const datePart = parts[0].replace(/:/g, '-');
          const timePart = parts[1];
          const formattedDate = `${datePart}T${timePart}`;
          creationDate = new Date(formattedDate).toISOString();
        } else if (exif.DateTime) {
          const parts = exif.DateTime.split(' ');
          const datePart = parts[0].replace(/:/g, '-');
          const timePart = parts[1];
          const formattedDate = `${datePart}T${timePart}`;
          
          creationDate = new Date(formattedDate).toISOString();
        }
      } catch (e) {
        console.warn('Failed to read EXIF for', media.uri, e);
      }
    }
    

    const data = new FormData();
    // @ts-ignore
    data.append('file', {
      uri: media.uri,
      type: media.type,
      name: media.fileName || 'media.jpg',
    });

    try {
      await axios.post(`${API_URL}/folder/media/upload`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: {
          isVideo,
          folder: folder,
          creationDate,
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          onProgress(`${progress}`);
        },
      });

      onProgress('100');
      return true;
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message,
      });
      console.error("Failed to upload media", err.message);
      return null;
    }
  }

  const downloadMedia = async (path: string, onProgress?: (progress: number) => void) => {
    try {
      const fileName = path.split('/').pop();
      const uri = `${API_URL}/media/${encodeURIComponent(path)}`;
      const dest = `${RNFS.DownloadDirectoryPath}/${fileName}`;

      // request permission (Android 13 and iOS)
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Notifications disabled',
          text2: 'Enable notifications to see download progress',
        });
      } else {
        // create channel on Android (must exist before sending)
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('downloads', {
            name: 'Downloads',
            importance: Notifications.AndroidImportance.MAX,
          });
        }

        // keep track of a single notification id so progress updates replace the same notification
        // present an initial notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Downloading',
            body: `Downloading... ${fileName}`,
            sticky: true,
            color: '#2196F3',
          },
          trigger: null,
        });

        const dl = RNFS.downloadFile({
          fromUrl: uri,
          toFile: dest,
          progressDivider: 1,
          progress: async (res) => {
            const pct = res.contentLength ? (res.bytesWritten / res.contentLength) * 100 : null;
            if (pct !== null) {
              onProgress?.(pct);
            }
          },
        });
        
        const result = await dl.promise;
        if (result.statusCode === 200) {

          await Notifications.dismissAllNotificationsAsync();
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Download Complete',
              body: `File downloaded to ${dest}`,
              color: '#4CAF50',
            },
            trigger: null,
          });
        } else {
          throw new Error(`Download failed with status code ${result.statusCode}`);
        }
      }
    } catch (err) {
      
    }
  }
  
  const getMedia = async (folder: string, offset: number, limit: number) => {
    try {
      const response = await axios.get(`${API_URL}/folder/media`, {
        params: {
          folder,
          offset,
          limit,
        }
      });

      return response.data.payload;
    } catch (err) {
      console.error("Failed to fetch media", err);
      return err
    }
  }

  const deleteMedia = async (media: MediaType, isSelectAll: boolean) => {
    try {
      const response = await axios.delete(`${API_URL}/folder/media`, {
        params: {
          id: media.id,
          path: media.path,
          isSelectAll,
        }
      });

      return response.data.payload;
    } catch (err) {
      console.error("Failed to delete media", err);
      return err;
    }
  }

  return { uploadMedia, getMedia, deleteMedia, downloadMedia };
}