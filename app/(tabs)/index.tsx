import { initDatabase } from "@/database/db";
import PhotosRepository, { PhotoType } from "@/database/repositories/notes.repository";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
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
  const [isSaving, setIsSaving] = useState(false); // Estado para evitar duplo clique

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

  // Função otimizada para tirar foto com qualidade reduzida
  async function takePhoto() {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) { 
      Alert.alert("Permissão necessária", "Permita o acesso à câmera"); 
      return; 
    }
    
    const result = await ImagePicker.launchCameraAsync({ 
      allowsEditing: true,  // Permitir edição rápida
      quality: 0.4,  // Qualidade reduzida para arquivo menor (mais rápido)
      base64: false,  // Não gerar base64 (mais rápido)
      exif: false,  // Não extrair metadados (mais rápido)
    });
    
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  }

  // Função otimizada para escolher da galeria
  async function pickFromGallery() {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) { 
      Alert.alert("Permissão necessária", "Permita o acesso à galeria"); 
      return; 
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({ 
      allowsEditing: false, 
      quality: 0.4,  // Mesma qualidade reduzida
    });
    
    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  }

  // Função savePhoto otimizada e rápida
  async function savePhoto() {
    if (!title.trim() || !selectedImage) {
      Alert.alert("Atenção", "Preencha o título e selecione uma imagem");
      return;
    }
    
    if (isSaving) return; // Evita duplo clique
    setIsSaving(true);
    
    try {
      let latitude: number | null = null;
      let longitude: number | null = null;
      
      // Tentar obter localização rapidamente com menor precisão
      const { granted, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      if (granted) {
        try {
          const loc = await Location.getCurrentPositionAsync({ 
            accuracy: Location.Accuracy.Lowest, // Menor precisão = mais rápido
            timeInterval: 3000 // Timeout de 3 segundos
          });
          latitude = loc.coords.latitude;
          longitude = loc.coords.longitude;
        } catch (locError) {
          console.log("Erro ao obter localização:", locError);
          // Continua salvando sem localização
        }
      } else {
        // Não bloqueia o salvamento se a localização for negada
        console.log("Permissão de localização negada");
      }
      
      // Salvar no banco de dados
      repo.create({ 
        title: title.trim(), 
        image_uri: selectedImage, 
        latitude, 
        longitude 
      });
      
      // Feedback de sucesso
      Alert.alert(
        "Sucesso", 
        latitude 
          ? `✅ Foto salva com localização!\n📍 ${latitude.toFixed(5)}, ${longitude?.toFixed(5)}` 
          : "⚠️ Foto salva (localização não disponível)"
      );
      
      // Limpar e fechar modal
      setTitle("");
      setSelectedImage(null);
      setModalVisible(false);
      loadPhotos(); // Recarregar lista
      
    } catch (e: any) {
      Alert.alert("Erro", `Falha ao salvar: ${e?.message ?? e}`);
    } finally {
      setIsSaving(false);
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
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar fotos..."
          placeholderTextColor="#8B7355"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id!.toString()}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {search ? "Nenhuma foto encontrada" : "Nenhuma foto ainda"}
            </Text>
            <Text style={styles.emptySubtext}>
              {search ? `Sem resultados para "${search}"` : "Toque em + para adicionar uma foto"}
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
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <View style={styles.cardMeta}>
                <Text style={styles.cardDate}>
                  {new Date(item.created_at!).toLocaleDateString("pt-BR")}
                </Text>
                {item.latitude != null && (
                  <Text style={styles.cardCoords} numberOfLines={1}>
                    📍 {item.latitude.toFixed(5)}, {item.longitude?.toFixed(5)}
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
            <Text style={styles.modalTitle}>Nova Foto</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => { setModalVisible(false); setSelectedImage(null); setTitle(""); setIsSaving(false); }}
            >
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Título da foto"
            placeholderTextColor="#8B7355"
            value={title}
            onChangeText={setTitle}
            editable={!isSaving}
          />

          <View style={styles.row}>
            <TouchableOpacity 
              style={styles.btn} 
              onPress={takePhoto} 
              activeOpacity={0.8}
              disabled={isSaving}
            >
              <Text style={styles.btnTxt}>📷 Câmera</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btn, styles.btnSecondary]} 
              onPress={pickFromGallery} 
              activeOpacity={0.8}
              disabled={isSaving}
            >
              <Text style={styles.btnTxt}>🖼️ Galeria</Text>
            </TouchableOpacity>
          </View>

          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.preview} />
          ) : (
            <View style={styles.previewPlaceholder}>
              <Text style={styles.previewLabel}>Nenhuma imagem selecionada</Text>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]} 
            onPress={savePhoto} 
            activeOpacity={0.85}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.saveBtnTxt}>Salvar Foto</Text>
            )}
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },

  searchContainer: {
    backgroundColor: "#1A1A1A",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3D2B1F",
    paddingHorizontal: 14,
    height: 44,
    justifyContent: "center",
  },
  searchInput: {
    color: "#FFFFFF",
    fontSize: 14,
  },

  grid: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 110,
  },
  card: {
    width: CARD_SIZE,
    margin: 8,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#3D2B1F",
  },
  cardImg: {
    width: "100%",
    height: CARD_SIZE,
    backgroundColor: "#2A2A2A",
  },
  cardInfo: {
    padding: 10,
  },
  cardTitle: {
    fontWeight: "600",
    fontSize: 13,
    color: "#D2B48C",
    marginBottom: 4,
  },
  cardMeta: {
    gap: 2,
  },
  cardDate: {
    fontSize: 10,
    color: "#808080",
  },
  cardCoords: {
    fontSize: 10,
    color: "#8B7355",
  },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#D2B48C",
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 13,
    color: "#808080",
    marginTop: 8,
    textAlign: "center",
  },

  fab: {
    position: "absolute",
    bottom: 36,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#D2B48C",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#8B7355",
  },
  fabTxt: {
    color: "#000000",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "300",
  },

  modal: {
    flex: 1,
    backgroundColor: "#000000",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
    paddingTop: 12,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#D2B48C",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#3D2B1F",
    justifyContent: "center",
    alignItems: "center",
  },
  modalClose: {
    fontSize: 14,
    color: "#808080",
    fontWeight: "600",
  },

  input: {
    backgroundColor: "#1A1A1A",
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#3D2B1F",
    color: "#FFFFFF",
  },

  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  btn: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D2B48C",
  },
  btnSecondary: {
    borderColor: "#8B7355",
    backgroundColor: "#0D0D0D",
  },
  btnTxt: {
    color: "#D2B48C",
    fontWeight: "500",
    fontSize: 14,
  },

  preview: {
    width: "100%",
    height: 210,
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: "#1A1A1A",
  },
  previewPlaceholder: {
    width: "100%",
    height: 210,
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: "#0D0D0D",
    borderWidth: 1,
    borderColor: "#3D2B1F",
    justifyContent: "center",
    alignItems: "center",
  },
  previewLabel: {
    color: "#808080",
    fontSize: 13,
  },

  saveBtn: {
    backgroundColor: "#D2B48C",
    height: 52,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#8B7355",
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnTxt: {
    color: "#000000",
    fontWeight: "600",
    fontSize: 16,
  },
});