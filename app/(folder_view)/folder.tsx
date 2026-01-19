import { ThemedIcon } from '@/components/ThemedIcon';
import { ThemedView } from '@/components/ThemedView';
import { Link, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../context';
import { ThemedText } from '@/components/ThemedText';
import Modal from "react-native-modal";
import { Bounce } from 'react-native-animated-spinkit';
import { useThemeColor } from '@/hooks/useThemeColor';
import { SectionGrid } from 'react-native-super-grid';
import { useFolderService } from './folder.service';
import { Asset, launchImageLibrary } from 'react-native-image-picker';
import EnhancedImageViewing from 'react-native-image-viewing/dist/ImageViewing';
import { useDeletionFunc } from './hooks/useDeletionFunc';
import ImageCard from './components/ImageCard';

const API_URL = process.env.EXPO_PUBLIC_API_ENDPOINT;

const screenDimensions = Dimensions.get('window');

export type MediaType = {
  id: number;
  name: string;
  path: string;
  date: string;
  index?: number;
  isVideo: number;
}

export default function FolderView() {
  const { state } = useAppContext();
  const { getMedia, uploadMedia, downloadMedia } = useFolderService();
  const router = useRouter();
  const {
    isTriggerFromSelectAll,
    deleteView,
    deletionSelected,
    handleDeleteImage,
    setDeleteView,
    setDeletionSelected,
    isSelectAll,
    setIsSelectAll,
    onExitDeleteView,
    showDeletionModal,
    handleImageSelection,

  } = useDeletionFunc(() => {
    reset();
  });

  const [loadedImages, setLoadedImages] = useState<number[]>([]); // [index, index, index, ...
  const [rerenderImages, setRerenderImages] = useState(false);
  const [viewImage, setViewImage] = useState({
    visible: false,
    index: 0,
  });
  const [isViewingVideo, setIsViewingVideo] = useState(false);

  const [media, setMedia] = useState<{ [index: string]: MediaType[] }[]>([]);
  const [showProgressbarModal, setShowProgressbarModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    total: 0,
    done: 1,
    progress: '0%',
  });
  const [downloadProgress, setDownloadProgress] = useState({
    isDownloading: false,
    progress: '0%',
  });
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 10,
  });

  const iconColor = useThemeColor({}, 'icon');

  useEffect(() => {
    fetchMedia();
  }, [rerenderImages]);

  useEffect(() => {
    if (isSelectAll) {
      setDeletionSelected(media.map(item => item[Object.keys(item)[0]]).flat());
    } else if (isTriggerFromSelectAll.current) {
      setDeletionSelected([]);
    }
  }, [isSelectAll]);

  const fetchMedia = async () => {
    const data = await getMedia(state.selectedFolder, pagination.offset, pagination.limit)
    if (!data) return;

    // group by date
    const groupedMedia: { [index: string]: MediaType[] } = {};
    for (const mediaItem of data as any) {
      const date = new Date(mediaItem.date).toDateString();
      if (!groupedMedia[date]) groupedMedia[date] = [];
      groupedMedia[date].push(mediaItem);
    }

    // if the date already exists, append data to the existing date
    const mediaCopy = [...media];
    for (const key in groupedMedia) {
      const _media = mediaCopy.find((item) => Object.keys(item).find(a => a === key));

      if (_media) {
        _media[key] = [..._media[key], ...groupedMedia[key]];
        mediaCopy.splice(mediaCopy.findIndex((item) => Object.keys(item).find(a => a === key)), 1, { [key]: _media[key] });
      } else {
        mediaCopy.push({ [key]: groupedMedia[key] });
      }
    }

    const sortedGroupedMedia = mediaCopy.sort((a, b) => {
      const aKey = Object.keys(a)[0];
      const bKey = Object.keys(b)[0];
      return new Date(bKey).getTime() - new Date(aKey).getTime();
    });

    setMedia(sortedGroupedMedia);

    if (isSelectAll) {
      setDeletionSelected(sortedGroupedMedia.map(item => item[Object.keys(item)[0]]).flat());
    }

    setPagination({
      ...pagination,
      offset: pagination.offset + pagination.limit
    });
  }

  /**
   * Function to handle the change of the image being viewed
   * @param index the index of the image being viewed
   */
  const onImageViewIndexChange = (index: number) => {
    const allMedia = media.map(item => item[Object.keys(item)[0]]).flat();
    const totalMedia = allMedia.length;

    // Update whether current index is a video so overlays update correctly
    const curr = allMedia[index];
    setIsViewingVideo(curr?.isVideo === 1);

    if (index === totalMedia - 2) fetchMedia();
  }

  /**
   * Function to handle the picking of pictures or videos
   */
  const onAddBtnPress = () => {
    setShowProgressbarModal(true);

    launchImageLibrary({
      mediaType: 'mixed',
      selectionLimit: 50,
    }, (response) => {
      if (response.didCancel) {
        setShowProgressbarModal(false);
        return;
      };

      startUploading(response.assets || []);
    });
  }

  /**
   * Function to handle the uploading of pictures or videos
   * @param media the selected media to upload
   */
  const startUploading = async (media: Asset[]) => {
    setUploadProgress((prev) => ({ ...prev, total: media.length }));

    let done = 0;
    for (const mediaItem of media) {
      const isVideo = mediaItem.type?.startsWith('video');

      const result = await uploadMedia(state.selectedFolder, mediaItem, isVideo || false,
        (progress) => {
          setUploadProgress((prev) => ({ ...prev, progress: progress }));
        });

      if (result) {
        done++;
        setUploadProgress((prev) => ({ ...prev, done: done }));
      }
    }

    reset();
    setTimeout(() => {
      setShowProgressbarModal(false);
      setUploadProgress((prev) => ({ ...prev, done: 1, progress: '0%' }));
    }, 1000);
  }

  /**
   * Function to generate the sections grid data for the images
   */
  const generateSectionsGridData = useMemo(() => {
    const mediaCopy = [...media];

    media.forEach((item, index) => {
      const key = Object.keys(item)[0];
      const itemCopy = [...item[key]];

      item[key].forEach((mediaItem, index2) => {
        const prevBatchIndex = index === 0 ? 0 : index - 1;

        if (index === 0 && prevBatchIndex === 0) {
          itemCopy.splice(index2, 1, { ...mediaItem, index: index2 });
          return;
        }

        if (index2 === 0) {
          const prevBatch = mediaCopy[prevBatchIndex][Object.keys(mediaCopy[prevBatchIndex])[0]];
          const prevBatchLastItemIndex = prevBatch[prevBatch.length - 1]?.index;

          itemCopy.splice(index2, 1, { ...mediaItem, index: (prevBatchLastItemIndex || 0) + 1 });
          return;
        }

        const prevItemIndex = itemCopy[index2 - 1].index;
        itemCopy.splice(index2, 1, { ...mediaItem, index: (prevItemIndex || -1) + 1 });
      });

      mediaCopy.splice(index, 1, { [key]: itemCopy });
    })

    return mediaCopy.map((item) => {
      const key = Object.keys(item)[0];
      return {
        title: key,
        data: item[key],
      }
    });
  }, [media]);

  /**
   * Function to generate the image viewing data
   */
  const generateImageViewingData = useMemo(() => {
    return media.map(item => item[Object.keys(item)[0]].map((mediaItem) => ({ uri: mediaItem.isVideo ? `${API_URL}/media/${mediaItem.path.split('.')[0]}-thumbnail.jpg` : `${API_URL}/media/${mediaItem.path}` }))).flat()
  }, [media])

  const reset = () => {
    setPagination({
      ...pagination,
      offset: 0,
    });
    setMedia([]); // clear the media
    setRerenderImages(!rerenderImages);
  }

  const renderImages = useCallback(({ item }: { item: MediaType }) => {

    return (
      <ImageCard
        isImageLoaded={loadedImages.includes(item.index || -1)}
        onImageLoad={() => setLoadedImages((prev) => [...prev, item.index || -1])}
        isDeleteView={deleteView}
        onLongPress={() => setDeleteView(true)}
        onPress={() => {
          setViewImage({ index: item.index || 0, visible: true });
          setIsViewingVideo(item.isVideo === 1);
        }}
        onSelectImage={() => handleImageSelection(item)}
        item={item}
        isSelected={deletionSelected.find((a: any) => a.id === item.id) ? true : false}
      />
    )
  }, [isSelectAll, deletionSelected, deleteView, loadedImages]);

  return (
    <ThemedView nativeID='root' style={styles.container}>
      <Modal isVisible={showProgressbarModal}>
        <ThemedView style={styles.modalContainer}>
          <Bounce size={100} color={iconColor} />
          <ThemedView style={{ alignItems: 'center' }}>
            <ThemedText>Uploading... {uploadProgress.done} out of {uploadProgress.total}</ThemedText>
            <ThemedText>{uploadProgress.progress}%</ThemedText>
          </ThemedView>
        </ThemedView>
      </Modal>

      <Modal isVisible={showDeletionModal.show}>
        <ThemedView style={styles.modalContainer}>
          <Bounce size={100} color={iconColor} />
          <ThemedText>Deleting... Please wait...</ThemedText>
          <ThemedText>{showDeletionModal.itemLeft} item(s) left</ThemedText>
        </ThemedView>
      </Modal>

      <EnhancedImageViewing
        images={generateImageViewingData}
        imageIndex={viewImage.index}
        visible={viewImage.visible}
        onRequestClose={() => {
          if (downloadProgress.isDownloading) return; // prevent closing if downloading

          setViewImage((prev) => ({ ...prev, visible: false })); 
          setIsViewingVideo(false); 
        }}
        keyExtractor={(_, index) => index.toString()}
        onImageIndexChange={onImageViewIndexChange}
        FooterComponent={({ imageIndex }) => {
          const allMedia = media.map(item => item[Object.keys(item)[0]]).flat();
          const currentMedia = allMedia[imageIndex];

          const downloadBtnUI = (
            <View style={styles.downloadFooterWrapper} pointerEvents="box-none">
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => {
                  downloadMedia(currentMedia.path);
                }}
              >
                <ThemedIcon name={'cloud-download'} color={'#00FF00'} size={18} />
                <ThemedText color={'#00FF00'} fontSize={11}>Download</ThemedText>
              </TouchableOpacity>
            </View>
          );

          // Only render if parent state says the current item is a video
          if (!isViewingVideo || currentMedia?.isVideo !== 1)
            return (
              <>
                {downloadBtnUI}
              </>
            );

          return (
            <>
              {downloadBtnUI}
              <ThemedView style={styles.footerWrapper} pointerEvents="box-none">
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => {
                    setIsViewingVideo(false);
                    setViewImage(prev => ({ ...prev, visible: false }));
                    router.push({
                      pathname: '/(folder_view)/video-player',
                      params: { uri: `${API_URL}/media/${currentMedia.path}` }
                    });
                  }}
                >
                  <ThemedIcon name={'play'} color={'#DC143C'} size={50} />
                </TouchableOpacity>
              </ThemedView>
            </>
          )
        }}
      />

      <ThemedView nativeID='header' style={styles.headerContainer}>
        {!deleteView && (
          <>
            <TouchableOpacity>
              <Link href={'(home)'}>
                <ThemedIcon name="arrow-back" />
              </Link>
            </TouchableOpacity>

            <ThemedText>{state.selectedFolder}</ThemedText>

            <TouchableOpacity onPress={onAddBtnPress}>
              <ThemedIcon name="add-outline" style={styles.addIcon} />
            </TouchableOpacity>
          </>
        )}
        {deleteView && (
          <>
            <TouchableOpacity onPress={onExitDeleteView}>
              <ThemedIcon name="close" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.selectAllContainer}
              onPress={() => {
                isTriggerFromSelectAll.current = true;
                setIsSelectAll(!isSelectAll);
              }}
            >
              <ThemedIcon name="checkbox-outline" color={isSelectAll ? '#00FF00' : undefined} />
              <ThemedText color={isSelectAll ? '#00FF00' : undefined} >SELECT ALL</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDeleteImage}>
              <ThemedIcon name="trash-bin" color={'#DC143C'} />
            </TouchableOpacity>
          </>
        )}
      </ThemedView>

      <ThemedView nativeID='mediaContainer' style={styles.sectionGrid}>
        {media.length === 0 && (
          <ThemedView style={styles.emptyContainer}>
            <ThemedIcon name='trash-bin-outline' size={100} color={iconColor} />
            <ThemedText>Oops! You haven't uploaded yet.</ThemedText>
          </ThemedView>
        )}
        <SectionGrid
          itemDimension={140}
          scrollIndicatorInsets={{ top: 10, bottom: 10 }}
          onEndReached={() => fetchMedia()}
          onEndReachedThreshold={0.8}
          sections={generateSectionsGridData}
          renderItem={renderImages}
          extraData={deletionSelected}
          renderSectionHeader={({ section }) => (<ThemedText colorType='icon'>{section.title}</ThemedText>)}
        />
      </ThemedView>

    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  footerWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -screenDimensions.height * .55 }],
  },
  downloadFooterWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 20,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButton: {
    width: 'auto',
    height: 35,
    paddingHorizontal: 10,
    columnGap: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,.35)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    borderRadius: 8,
  },
  addIcon: {
    width: 35,
    height: 35,
  },
  sectionGrid: {
    paddingBottom: 16,
    paddingTop: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  }
});