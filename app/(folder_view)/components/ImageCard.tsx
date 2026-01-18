import { ThemedIcon } from "@/components/ThemedIcon";
import { ThemedView } from "@/components/ThemedView";
import { memo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import FastImage from "react-native-fast-image";
import { MediaType } from "../folder";
import { Fold } from 'react-native-animated-spinkit';
import { useThemeColor } from "@/hooks/useThemeColor";

const API_URL = process.env.EXPO_PUBLIC_API_ENDPOINT;

export type ImageCardProps = {
  item: MediaType; 
  isSelected: boolean;
  isDeleteView: boolean;
  isImageLoaded: boolean;
  onImageLoad: () => void;
  onLongPress: () => void;
  onPress: () => void;
  onSelectImage: () => void;
}

const ImageCard = memo(({ isSelected, item, onLongPress, onPress, onSelectImage, isImageLoaded, onImageLoad, isDeleteView }: ImageCardProps) => {
  const iconColor = useThemeColor({}, 'icon');
  const getFormattedFilePath = () => {
    const filePathChunks = item.path.split('.');
    const name = filePathChunks[0];

    // if video, return thumbnail path
    if (item.isVideo === 1)
      return `${name}-thumbnail.jpg`;

    // else return original image path
    return item.path;
  }

  return (
    <TouchableOpacity onLongPress={onLongPress} onPress={onPress} style={styles.sectionItemContainer}>
      <View style={styles.imageContainer}>
        <FastImage 
          style={styles.image} source={{uri: `${API_URL}/media/${getFormattedFilePath()}`}}
          onLoad={onImageLoad}
          renderToHardwareTextureAndroid={true}
        />
        {!isImageLoaded && (
          <Fold size={50} color={iconColor} style={styles.loaderIndicator} />
        )}
      </View>

      {item.isVideo === 1 && (
        <ThemedView style={styles.sectionPlayIconContainer}>
          <ThemedIcon name={'play'} color={'#DC143C'} size={50}/>
        </ThemedView>
      )}
      {isDeleteView && (
        <ThemedView style={styles.deleteViewContainer}>
          <TouchableOpacity onPress={onSelectImage}
          >
            <ThemedIcon 
              name={isSelected ? 'checkmark-circle' : 'remove-circle-outline'} 
              color={isSelected ? '#00FF00' : undefined} 
              size={30}
            />
          </TouchableOpacity>
        </ThemedView>
      )}
    </TouchableOpacity>
  )
}, (prevProps, nextProps) => {

  if (prevProps.isImageLoaded !== nextProps.isImageLoaded)
    return false;
  
  if (prevProps.isDeleteView !== nextProps.isDeleteView && prevProps.isSelected === nextProps.isSelected) 
    return false;

  else if (prevProps.isSelected !== nextProps.isSelected && prevProps.isDeleteView === nextProps.isDeleteView) 
    return false;

  else return true;
});

const styles = StyleSheet.create({
  sectionItemContainer: {
    position: 'relative',
  },
  sectionPlayIconContainer: {
    position: 'absolute',
    opacity: 0.7,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  deleteViewContainer: {
    position: 'absolute',
    opacity: 0.7,
    alignItems: 'flex-end',
    width: '100%',
    height: '100%',
  },
  imageContainer: {
    position: 'relative',
  },
  loaderIndicator: {
    position: 'absolute',
    top: 50,
    left: 50,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 150, 
    height: 150, 
    borderRadius: 5
  }
});


export default ImageCard;