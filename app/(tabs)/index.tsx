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
        ? `Foto salva diva!\n ${latitude.toFixed(5)}, ${longitude?.toFixed(5)}`
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
        <Text style={styles.searchIcon}></Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por título..."
          placeholderTextColor="#6B7DB3"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Text style={{ color: "#6B7DB3", fontSize: 18, paddingRight: 8 }}>✕</Text>
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
            <Text style={styles.emptyIcon}>{search ? " " : " "}</Text>
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
            activeOpacity={0.85}
          >
            <Image source={{ uri: item.image_uri }} style={styles.cardImg} />
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.cardDate}>
                {new Date(item.created_at!).toLocaleDateString("pt-BR")}
              </Text>
              {item.latitude != null && (
                <Text style={styles.cardCoords} numberOfLines={1}>
                 {item.latitude.toFixed(3)}, {item.longitude?.toFixed(3)}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabTxt}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nova Foto</Text>
            <TouchableOpacity onPress={() => { setModalVisible(false); setSelectedImage(null); setTitle(""); }}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Título da foto..."
            placeholderTextColor="#6B7DB3"
            value={title}
            onChangeText={setTitle}
          />

          <View style={styles.row}>
            <TouchableOpacity style={styles.btn} onPress={takePhoto}>
              <Text style={styles.btnTxt}>Câmera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { backgroundColor: "#7C3AED" }]} onPress={pickFromGallery}>
              <Text style={styles.btnTxt}>Galeria</Text>
            </TouchableOpacity>
          </View>

          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.preview} />
          ) : (
            <View style={styles.previewPlaceholder}>
              <Text style={{ fontSize: 48 }}></Text>
              <Text style={{ color: "#6B7DB3", marginTop: 8 }}>Nenhuma imagem selecionada</Text>
            </View>
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={savePhoto}>
            <Text style={styles.saveBtnTxt}>Salvar</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A1A" },

  searchContainer: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#13132B", marginHorizontal: 16, marginVertical: 12,
    borderRadius: 12, borderWidth: 1, borderColor: "#2D2D5E", paddingHorizontal: 12,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: {
    flex: 1, height: 44, color: "#E0E7FF", fontSize: 15,
  },

  grid: { paddingHorizontal: 8, paddingBottom: 100 },
  card: {
    width: CARD_SIZE, margin: 8, backgroundColor: "#13132B",
    borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: "#2D2D5E",
    shadowColor: "#6366F1", shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  cardImg: { width: "100%", height: CARD_SIZE, backgroundColor: "#1E1E3F" },
  cardInfo: { padding: 8 },
  cardTitle: { textAlign: "center", fontWeight: "700", fontSize: 13, color: "#E0E7FF" },
  cardDate: { textAlign: "center", fontSize: 11, color: "#818CF8", marginTop: 2 },
  cardCoords: { textAlign: "center", fontSize: 10, color: "#A78BFA", marginTop: 2 },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 120 },
  emptyIcon: { fontSize: 60 },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#C7D2FE", marginTop: 16 },
  emptySubtext: { fontSize: 14, color: "#6B7DB3", marginTop: 8 },

  fab: {
    position: "absolute", bottom: 32, right: 24,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: "#6366F1", justifyContent: "center", alignItems: "center",
    shadowColor: "#6366f1", shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  fabTxt: { color: "#FFF", fontSize: 34, lineHeight: 38 },

  modal: { flex: 1, backgroundColor: "#0A0A1A", padding: 20 },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 24,
  },
  modalTitle: { fontSize: 22, fontWeight: "700", color: "#E0E7FF" },
  modalClose: { fontSize: 22, color: "#6B7DB3" },

  input: {
    backgroundColor: "#13132B", height: 50, borderRadius: 12,
    paddingHorizontal: 14, fontSize: 16, marginBottom: 16,
    borderWidth: 1, borderColor: "#2D2D5E", color: "#E0E7FF",
  },
  row: { flexDirection: "row", gap: 12, marginBottom: 20 },
  btn: {
    flex: 1, backgroundColor: "#3b4fcc", height: 46,
    borderRadius: 12, justifyContent: "center", alignItems: "center",
  },
  btnTxt: { color: "#FFF", fontWeight: "600", fontSize: 15 },

  preview: {
    width: "100%", height: 220, borderRadius: 14,
    marginBottom: 20, backgroundColor: "#1E1E3F",
  },
  previewPlaceholder: {
    width: "100%", height: 220, borderRadius: 14, marginBottom: 20,
    backgroundColor: "#13132B", borderWidth: 1, borderColor: "#2D2D5E",
    justifyContent: "center", alignItems: "center",
  },

  saveBtn: {
    backgroundColor: "#6366F1", height: 52, borderRadius: 14,
    justifyContent: "center", alignItems: "center",
    shadowColor: "#6366F1", shadowOpacity: 0.4, shadowRadius: 8,
  },
  saveBtnTxt: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});