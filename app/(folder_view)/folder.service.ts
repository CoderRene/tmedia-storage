import axios from "axios";
import { Asset } from "react-native-image-picker";
import { MediaType } from "./folder";
import Toast from "react-native-toast-message";

const API_URL = process.env.EXPO_PUBLIC_API_ENDPOINT;

export function useFolderService() {
  const uploadMedia = async (folder: string, media: Asset, isVideo: boolean, onProgress: (progress: string) => void) => {
    const data = new FormData();
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
          creationDate: new Date().toISOString(),
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          onProgress(`${progress}`);
        },
      });

      onProgress('100');
      return true;
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to upload media',
      });
      console.error("Failed to upload media", err);
      return null;
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

  return { uploadMedia, getMedia, deleteMedia };
}