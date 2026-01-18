import { ThemedIcon } from '@/components/ThemedIcon';
import { ThemedView } from '@/components/ThemedView';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, Dimensions } from 'react-native';
import Video, { VideoRef } from 'react-native-video';

const { width, height } = Dimensions.get('window');

export default function VideoPlayerScreen() {
	const { uri } = useLocalSearchParams<{ uri: string }>();
	const router = useRouter();

	const videoRef = useRef<VideoRef>(null);


	return (
		<ThemedView style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
					<ThemedIcon name="close" size={32} color="#fff" />
				</TouchableOpacity>
			</View>

			<Video
				ref={videoRef}
				source={{ uri }}
				controls
				resizeMode="contain"
				style={styles.video}
			/>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000',
	},
	header: {
		position: 'absolute',
		top: 40,
		left: 0,
		right: 0,
		zIndex: 10,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
	},
	backButton: {
		padding: 8,
	},
	video: {
		width,
		height,
	},
});
