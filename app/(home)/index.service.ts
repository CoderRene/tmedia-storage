import axios from "axios";
import RNFS from 'react-native-fs';
import mime from 'react-native-mime-types';
import Toast from "react-native-toast-message";

const API_URL = process.env.EXPO_PUBLIC_API_ENDPOINT;

export function useIndexService() {
  const getHomeFolders = async () => {
    try {
      const response = await axios.get(`${API_URL}/home/folders`)
      return response.data.payload;
    } catch (err) {
      console.error('Error:', err);
      return undefined;
    }
  }

  const addHomeFolder = async (name: string) => {
    try {
      const response = await axios.post(`${API_URL}/home/folders`, {}, {
        params: {
          name
        }
      })
      return response.data.payload;
    } catch (err) {
      console.error('Error:', err);
      return undefined;
    }
  }

  const deleteHomeFolder = async (name: string) => {
    try {
      const response = await axios.delete(`${API_URL}/home/folders`, {
        params: {
          name
        }
      })
      return response.data.payload;
    } catch (err) {
      console.error('Error:', err);
      return undefined;
    }
  }

  const editHomeFolder = async (name: string, newName: string) => {
    try {
      const response = await axios.put(`${API_URL}/home/folders`, {}, {
        params: {
          name,
          newName
        }
      })
      return response.data.payload;
    } catch (err) {
      console.error('Error:', err);
      return undefined;
    }
  }

  const chunkFolderItemsUpload = async (folder: string, items: RNFS.ReadDirItem[], onProgress: (progress: number) => void, onComplete: (isError: boolean) => void) => {
    const chunk = 10;
    let offset = 0;
    let limit = chunk;

    let progress = 0;
    let hasError = false;

    const added = await addHomeFolder(folder);
    if (!added) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add folder',
      });
      return;
    }

    const notUploadedItems = [];

    while (true) {
      const itemsChunk = items.slice(offset, limit);
      progress = Math.round((offset / items.length) * 100);
      onProgress(progress);

      if (!itemsChunk.length || !(itemsChunk.length > 0)) break;

      const data = new FormData();
      for (const item of itemsChunk) {
        const _mime = mime.lookup(item.path);
        const isVideo = _mime && _mime?.startsWith('video');

        data.append('files', {
          uri: `file://${item.path}`,
          type: _mime,
          name: item.name,
        });
        data.append('creationDates', (item.mtime || new Date()).toISOString());
        data.append('isVideoValues', isVideo + '');
      }
      
      try {
        await axios.post(`${API_URL}/folder/media/multiple_upload`, data, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          params: {
            folder,
          },
        });
      } catch (err) {
        hasError = true;
        console.error('Error:', err);
        notUploadedItems.push(...itemsChunk);
      }

      offset += chunk;
      limit += chunk;
    }

    if (notUploadedItems.length > 0) {
      Toast.show({
        type: 'info',
        text1: 'Note',
        text2: 'Failed to upload some media',
      });
    }
    onComplete(hasError);
  }

  return { getHomeFolders, addHomeFolder, chunkFolderItemsUpload, deleteHomeFolder, editHomeFolder};
}