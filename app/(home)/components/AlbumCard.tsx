import { Icon } from "@/components/Icon";
import { ThemedText } from "@/components/ThemedText";
import { memo } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import FastImage from "react-native-fast-image";
import { TouchableOpacityProps } from "react-native-gesture-handler";

const API_URL = process.env.EXPO_PUBLIC_API_ENDPOINT;

export type AlbumCardProps = TouchableOpacityProps &  {
  folder: string;
  thumbnailPath: string;
  iconColor: string;
}

const AlbumCardMemo = memo(({ folder, thumbnailPath, iconColor, ...rest }: AlbumCardProps) => {

  return (
    <TouchableOpacity style={styles.listItem} key={folder}
      {...rest}
    >
        {thumbnailPath.includes('undefined') ? (
          <Icon name='image-outline' size={100} color={iconColor} />
        ) : (
          <FastImage 
            style={styles.image} source={{uri: `${API_URL}/media/${thumbnailPath}`}}
            renderToHardwareTextureAndroid={true}
          />
        )}
        <ThemedText type='default'>{folder}</ThemedText>
    </TouchableOpacity>
  )
}, (prevProps, nextProps) => {

  if (prevProps.folder !== nextProps.folder || prevProps.thumbnailPath !== nextProps.thumbnailPath) 
    return false;

  else return true;
});

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  image: {
    width: 100, 
    height: 100, 
    borderRadius: 5
  }
});

export default AlbumCardMemo;