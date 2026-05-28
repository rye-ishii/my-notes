import { initDatabase } from "@/database/db";
import PhotosRepository, { PhotoType } from "@/database/repositories/notes.repository";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import MapView, { Callout, Marker } from "react-native-maps";

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

  useFocusEffect(
    useCallback(() => {
      initDatabase();
      try {
        const all = repo.getAll();
        setPhotos(all.filter((p) => p.latitude != null && p.longitude != null));
      } catch {
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
          >
            <Callout tooltip={false}>
              <View style={styles.callout}>
                <Image
                  source={{ uri: photo.image_uri }}
                  style={styles.calloutImg}
                />
                <Text style={styles.calloutTitle}>{photo.title}</Text>
                <Text style={styles.calloutDate}>
                  {new Date(photo.created_at!).toLocaleDateString("pt-BR")}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  emptyBanner: {
    position: "absolute", top: 16, alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: 20, zIndex: 1,
  },
  emptyTxt: { color: "#ffffff", fontSize: 13 },
  callout: { width: 170, alignItems: "center", padding: 6 },
  calloutImg: {
    width: 150, height: 110, borderRadius: 8,
    marginBottom: 6, backgroundColor: "#E5E5EA",
  },
  calloutTitle: { fontWeight: "bold", fontSize: 13, textAlign: "center" },
  calloutDate: { fontSize: 11, color: "#666", marginTop: 2 },
});