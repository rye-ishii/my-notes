import { initDatabase } from "@/database/db";
import PhotosRepository, { PhotoType } from "@/database/repositories/notes.repository";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

const repo = new PhotosRepository();

function spreadOverlapping(photos: PhotoType[]): (PhotoType & { displayLat: number; displayLng: number })[] {
  const seen = new Map<string, number>();
  return photos.map((p) => {
    const key = `${p.latitude!.toFixed(5)},${p.longitude!.toFixed(5)}`;
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    const angle = (count * 137.5 * Math.PI) / 180;
    const radius = count === 0 ? 0 : 0.0002 * Math.sqrt(count);
    return {
      ...p,
      displayLat: p.latitude! + radius * Math.cos(angle),
      displayLng: p.longitude! + radius * Math.sin(angle),
    };
  });
}

export default function MapScreen() {
  const [photos, setPhotos] = useState<PhotoType[]>([]);
  const [mapKey, setMapKey] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoType | null>(null);

  useFocusEffect(
    useCallback(() => {
      initDatabase();
      try {
        const all = repo.getAll();
        const withLocation = all.filter((p) => p.latitude != null && p.longitude != null);
        
        console.log("Total de fotos:", all.length);
        console.log("Fotos com localização:", withLocation.length);
        if (withLocation.length > 0) {
          console.log("Primeira foto:", withLocation[0].title, withLocation[0].latitude);
        }
        
        setPhotos(withLocation);
      } catch (error) {
        console.log("Erro ao carregar fotos:", error);
      }
      
      setMapKey((k) => k + 1);
    }, [])
  );

  const spread = spreadOverlapping(photos);

  const initialRegion =
    photos.length > 0
      ? {
          latitude: photos[0].latitude!,
          longitude: photos[0].longitude!,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }
      : {
          latitude: -23.27,
          longitude: -51.17,
          latitudeDelta: 3,
          longitudeDelta: 3,
        };

  return (
    <View style={styles.container}>
      {photos.length === 0 && (
        <View style={styles.emptyBanner}>
          <Text style={styles.emptyTxt}>Nenhuma foto com localização</Text>
        </View>
      )}
      
      <MapView
        key={mapKey}
        style={styles.map}
        initialRegion={initialRegion}
      >
        {spread.map((photo) => (
          <Marker
            key={photo.id}
            coordinate={{
              latitude: photo.displayLat,
              longitude: photo.displayLng,
            }}
            onPress={() => {
              console.log("Marcador clicado!", photo.title);
              setSelectedPhoto(photo);
            }}
          >
            <Text style={styles.marker}>📍</Text>
          </Marker>
        ))}
      </MapView>

      {/* Modal para exibir a foto ao clicar no marcador */}
      <Modal 
        visible={selectedPhoto !== null} 
        transparent={true} 
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedPhoto(null)}
        >
          <View style={styles.modalContent}>
            {selectedPhoto && (
              <>
                <Image 
                  source={{ uri: selectedPhoto.image_uri }} 
                  style={styles.modalImage}
                  onError={(e) => console.log("Erro ao carregar imagem no modal:", e.nativeEvent.error)}
                />
                <Text style={styles.modalTitle}>{selectedPhoto.title}</Text>
                <Text style={styles.modalDate}>
                  {new Date(selectedPhoto.created_at!).toLocaleDateString("pt-BR")}
                </Text>
                {selectedPhoto.latitude && selectedPhoto.longitude && (
                  <Text style={styles.modalCoords}>
                    📍 {selectedPhoto.latitude.toFixed(5)}, {selectedPhoto.longitude.toFixed(5)}
                  </Text>
                )}
                <TouchableOpacity 
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedPhoto(null)}
                >
                  <Text style={styles.modalCloseText}>Fechar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  emptyBanner: {
    position: "absolute", 
    top: 16, 
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)", 
    paddingHorizontal: 16,
    paddingVertical: 8, 
    borderRadius: 20, 
    zIndex: 1,
  },
  emptyTxt: { 
    color: "#ffffff", 
    fontSize: 13 
  },
  
  // Apenas o emoji 📍 como marcador
  marker: {
    fontSize: 30,
  },
  
  // Estilos do Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 20,
    width: "85%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D2B48C",
  },
  modalImage: {
    width: 250,
    height: 250,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "#2A2A2A",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#D2B48C",
    textAlign: "center",
    marginBottom: 8,
  },
  modalDate: {
    fontSize: 14,
    color: "#808080",
    marginBottom: 4,
  },
  modalCoords: {
    fontSize: 12,
    color: "#8B7355",
    marginTop: 4,
    marginBottom: 16,
  },
  modalCloseBtn: {
    backgroundColor: "#D2B48C",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  modalCloseText: {
    color: "#000000",
    fontWeight: "bold",
    fontSize: 14,
  },
});