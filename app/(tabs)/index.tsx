import { initDatabase } from "@/database/db";
import PhotosRepository, { PhotoType } from "@/database/repositories/notes.repository";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList, Image, Modal, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
 
const repo = new PhotosRepository();
const NUM_COLUMNS = 2;
const CARD_SIZE = (Dimensions.get("window").width - 48) / 2;
 
export default function GalleryScreen() {
  const [photos, setPhotos] = useState<PhotoType[]>([]);
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
 
  function loadPhotos() {
    try {
      setPhotos(repo.getAll());
    } catch {
      Alert.alert("Erro", "Falha ao carregar as fotos");
    }
  }
 
  useFocusEffect(useCallback(() => {
    initDatabase();
    loadPhotos();
  }, []));
 
  const filtered = photos.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );
 
  async function takePhoto() {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) { Alert.alert("Permissão necessária", "Permita o acesso à câmera"); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.7 });
    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  }
 
  async function pickFromGallery() {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) { Alert.alert("Permissão necessária", "Permita o acesso à galeria"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: false, quality: 0.7 });
    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  }
 
  async function savePhoto() {
    if (!title.trim() || !selectedImage) {
      Alert.alert("Atenção", "Preencha o título");
      return;
    }
    try {
      let latitude: number | null = null;
      let longitude: number | null = null;
      const { granted, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        Alert.alert("Localização negada", canAskAgain
          ? "Permita o acesso à localização para salvar a posição da foto."
          : "Vá em Ajustes > Privacidade > Localização e permita o acesso ao app."
        );
      } else {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        latitude = loc.coords.latitude;
        longitude = loc.coords.longitude;
      }
      repo.create({ title, image_uri: selectedImage, latitude, longitude });
      Alert.alert("Sucesso", latitude
        ? `Foto salva!\n ${latitude.toFixed(5)}, ${longitude?.toFixed(5)}`
        : "Foto salva sem localização."
      );
      setTitle("");
      setSelectedImage(null);
      setModalVisible(false);
      loadPhotos();
    } catch (e: any) {
      Alert.alert("Erro", `Falha ao salvar: ${e?.message ?? e}`);
    }
  }
 
  function deletePhoto(id: number) {
    Alert.alert("Excluir", "Remover esta foto?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => { repo.delete(id); loadPhotos(); } },
    ]);
  }
 
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
 
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por título..."
          placeholderTextColor="#4A5070"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
 
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id!.toString()}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>{search ? "🔍" : "📷"}</Text>
            <Text style={styles.emptyText}>
              {search ? "Nenhuma foto encontrada" : "Nenhuma foto ainda"}
            </Text>
            <Text style={styles.emptySubtext}>
              {search ? `Sem resultados para "${search}"` : "Toque em + para adicionar uma foto!"}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onLongPress={() => deletePhoto(item.id!)}
            activeOpacity={0.9}
          >
            <Image source={{ uri: item.image_uri }} style={styles.cardImg} />
            <View style={styles.cardOverlay} />
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <View style={styles.cardMeta}>
                <Text style={styles.cardDate}>
                  {new Date(item.created_at!).toLocaleDateString("pt-BR")}
                </Text>
                {item.latitude != null && (
                  <Text style={styles.cardCoords} numberOfLines={1}>
                    📍 {item.latitude.toFixed(2)}, {item.longitude?.toFixed(2)}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
 
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
        <Text style={styles.fabTxt}>+</Text>
      </TouchableOpacity>
 
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalEyebrow}>ADICIONAR</Text>
              <Text style={styles.modalTitle}>Nova Foto</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => { setModalVisible(false); setSelectedImage(null); setTitle(""); }}
            >
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
 
          <TextInput
            style={styles.input}
            placeholder="Título da foto..."
            placeholderTextColor="#4A5070"
            value={title}
            onChangeText={setTitle}
          />
 
          <View style={styles.row}>
            <TouchableOpacity style={styles.btn} onPress={takePhoto} activeOpacity={0.8}>
              <Text style={styles.btnIcon}>📷</Text>
              <Text style={styles.btnTxt}>Câmera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={pickFromGallery} activeOpacity={0.8}>
              <Text style={styles.btnIcon}>🖼️</Text>
              <Text style={styles.btnTxt}>Galeria</Text>
            </TouchableOpacity>
          </View>
 
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.preview} />
          ) : (
            <View style={styles.previewPlaceholder}>
              <Text style={styles.previewIcon}>🖼</Text>
              <Text style={styles.previewLabel}>Nenhuma imagem selecionada</Text>
            </View>
          )}
 
          <TouchableOpacity style={styles.saveBtn} onPress={savePhoto} activeOpacity={0.85}>
            <Text style={styles.saveBtnTxt}>Salvar Foto</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
 
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#080810",
  },
 

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10101F",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1E1E38",
    paddingHorizontal: 14,
    height: 48,
  },
  searchIcon: {
    fontSize: 18,
    color: "#4A5070",
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#CDD5F0",
    fontSize: 15,
    letterSpacing: 0.2,
  },
  searchClear: {
    color: "#4A5070",
    fontSize: 16,
    paddingRight: 4,
  },
 

  grid: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 110,
  },
  card: {
    width: CARD_SIZE,
    margin: 8,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#10101F",
    borderWidth: 1,
    borderColor: "#1C1C35",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  cardImg: {
    width: "100%",
    height: CARD_SIZE,
    backgroundColor: "#14142A",
  },
  
  cardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: CARD_SIZE * 0.45,
    backgroundColor: "transparent",
    
  },
  cardInfo: {
    padding: 10,
    paddingTop: 8,
    backgroundColor: "#10101F",
  },
  cardTitle: {
    fontWeight: "700",
    fontSize: 13,
    color: "#E2E8FF",
    letterSpacing: 0.1,
    marginBottom: 4,
  },
  cardMeta: {
    gap: 2,
  },
  cardDate: {
    fontSize: 10,
    color: "#4A5480",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  cardCoords: {
    fontSize: 10,
    color: "#5A6490",
    marginTop: 1,
  },
 

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#9AA3C8",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#3D4460",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
 
  
  fab: {
    position: "absolute",
    bottom: 36,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4F52CC",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4F52CC",
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    borderWidth: 1,
    borderColor: "#6366F1",
  },
  fabTxt: {
    color: "#FFF",
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "300",
  },
 
 
  modal: {
    flex: 1,
    backgroundColor: "#080810",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 28,
    paddingTop: 12,
  },
  modalEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.5,
    color: "#4F52CC",
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#E2E8FF",
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#10101F",
    borderWidth: 1,
    borderColor: "#1E1E38",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  modalClose: {
    fontSize: 14,
    color: "#4A5070",
    fontWeight: "600",
  },
 

  input: {
    backgroundColor: "#10101F",
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1E1E38",
    color: "#E2E8FF",
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  btn: {
    flex: 1,
    backgroundColor: "#14142B",
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4F52CC",
    flexDirection: "row",
    gap: 8,
  },
  btnSecondary: {
    borderColor: "#7C3AED",
    backgroundColor: "#130D20",
  },
  btnIcon: {
    fontSize: 16,
  },
  btnTxt: {
    color: "#CDD5F0",
    fontWeight: "600",
    fontSize: 14,
    letterSpacing: 0.2,
  },
 

  preview: {
    width: "100%",
    height: 210,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: "#10101F",
  },
  previewPlaceholder: {
    width: "100%",
    height: 210,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: "#0C0C1C",
    borderWidth: 1,
    borderColor: "#1E1E38",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  previewIcon: {
    fontSize: 40,
    opacity: 0.35,
  },
  previewLabel: {
    color: "#3D4460",
    fontSize: 13,
    letterSpacing: 0.2,
  },
 

  saveBtn: {
    backgroundColor: "#4F52CC",
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4F52CC",
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 1,
    borderColor: "#6366F1",
  },
  saveBtnTxt: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
