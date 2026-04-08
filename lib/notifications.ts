// Utility for handling browser notifications and sound

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    return false;
  }
  
  if (Notification.permission === "granted") {
    return true;
  }
  
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  
  return false;
}

export function showNotification(title: string, body: string, icon?: string): void {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }
  
  new Notification(title, { body, icon });
}

export function playNotificationSound(): void {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  try {
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // 440 Hz
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // Keep volume low
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04); // 40ms fade
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.04);
  } catch (e) {
    console.error("Failed to play notification sound", e);
  }
}
