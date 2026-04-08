"use client";

import React, { useRef, useState } from "react";
import UserAvatar from "./UserAvatar";
import { uploadAvatar } from "@/lib/uploadAvatar";
import { Camera, Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";

export default function AvatarUpload({
  currentAvatarUrl,
  displayName,
  onUploadComplete,
  onError,
}: {
  currentAvatarUrl?: string;
  displayName: string;
  onUploadComplete: (url: string) => void;
  onError: (msg: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorVisible, setErrorVisible] = useState<string | null>(null);

  const handleClick = () => {
    if (!isUploading) {
      inputRef.current?.click();
    }
  };

  const clearError = () => {
    setErrorVisible(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uid = auth.currentUser?.uid;
    if (!uid) {
      onError("Not authenticated.");
      setErrorVisible("Not authenticated.");
      return;
    }

    setIsUploading(true);
    clearError();

    try {
      const url = await uploadAvatar(file, uid);
      onUploadComplete(url);
    } catch (err: any) {
      const msg = err.message || "Failed to upload avatar.";
      onError(msg);
      setErrorVisible(msg);
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div 
        className="relative group cursor-pointer"
        onClick={handleClick}
        style={{ width: 100, height: 100 }}
      >
        <UserAvatar size={100} avatarUrl={currentAvatarUrl} displayName={displayName} />
        
        <div className={`absolute inset-0 rounded-full flex items-center justify-center transition-colors ${isUploading ? 'bg-black/50' : 'group-hover:bg-black/50 bg-black/0'}`}>
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          ) : (
            <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>
      
      <input 
        type="file" 
        accept="image/*" 
        style={{ display: 'none' }} 
        ref={inputRef}
        onChange={handleFileChange}
      />
      
      {errorVisible && (
        <span className="text-red-500 text-sm mt-2">{errorVisible}</span>
      )}
    </div>
  );
}
