import { db } from "../db";

export type PhotoType = {
  id?: number;
  title: string;
  image_uri: string;
  latitude: number | null;
  longitude: number | null;
  created_at?: string;
};

export default class PhotosRepository {
  create(photo: Omit<PhotoType, "id" | "created_at">) {
    const stmt = db.prepareSync(`
      INSERT INTO photos (title, image_uri, latitude, longitude, created_at)
      VALUES ($title, $image_uri, $latitude, $longitude, $created_at)
    `);
    try {
      return stmt.executeSync({
        $title: photo.title,
        $image_uri: photo.image_uri,
        $latitude: photo.latitude,
        $longitude: photo.longitude,
        $created_at: new Date().toISOString(),
      });
    } finally {
      stmt.finalizeSync();
    }
  }

  getAll(): PhotoType[] {
    return db.getAllSync<PhotoType>(
      "SELECT * FROM photos ORDER BY created_at DESC"
    );
  }

  delete(id: number) {
    const stmt = db.prepareSync("DELETE FROM photos WHERE id = $id");
    try {
      return stmt.executeSync({ $id: id });
    } finally {
      stmt.finalizeSync();
    }
  }
}