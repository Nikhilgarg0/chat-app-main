import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function uploadAvatar(file: File, firebaseUid: string): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image.");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Image must be smaller than 2MB.");
  }

  const timestamp = Date.now();
  const filename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
  const path = `avatars/${firebaseUid}/${timestamp}-${filename}`;
  const storageRef = ref(storage, path);

  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);
  
  return url;
}
