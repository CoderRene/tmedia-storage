import { useRef, useState } from "react";
import { MediaType } from "../folder";
import { useFolderService } from "../folder.service";
import Toast from "react-native-toast-message";

export function useDeletionFunc(onDelete: () => void) {
  const [deleteView, setDeleteView] = useState(false);
  const [deletionSelected, setDeletionSelected] = useState<MediaType[]>([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [showDeletionModal, setShowDeletionModal] = useState({
    show: false,
    itemLeft: 0,
  });
  const { deleteMedia } = useFolderService();

  const isTriggerFromSelectAll = useRef(false);
  
  const handleDeleteImage = async () => {
    setShowDeletionModal((prev) => ({itemLeft: deletionSelected.length, show: true}));

    for (const selectedMedia of deletionSelected) {
      try {
        await deleteMedia(selectedMedia, isSelectAll); 
        setShowDeletionModal((prev) => ({...prev, itemLeft: prev.itemLeft - 1}));

        if (isSelectAll) break;
      } catch (err) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to delete media",
        });
      }
    }

    onExitDeleteView();
    setShowDeletionModal((prev) => ({...prev, show: false}));
    onDelete();
  }

  const handleImageSelection = (item: MediaType) => {
    setDeletionSelected((prev: any) => {
      if (prev.find((a: any) => a.id === item.id)) {
        if (isSelectAll) {
          isTriggerFromSelectAll.current = false;
          setIsSelectAll(false);
        }

        return prev.filter((a: any) => a.id !== item.id);
      } else {
        return [...prev, item];
      }
    })
  }

  const onExitDeleteView = () => {
    setDeleteView(false);
    setDeletionSelected([]);
    setIsSelectAll(false);
  }

  return {
    showDeletionModal,
    isTriggerFromSelectAll,
    isSelectAll,
    setIsSelectAll,
    deleteView, 
    setDeleteView, 
    deletionSelected, 
    setDeletionSelected, 
    handleDeleteImage,
    onExitDeleteView,
    handleImageSelection,
  };
}