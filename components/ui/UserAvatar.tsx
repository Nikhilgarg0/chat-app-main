export default function UserAvatar({
  avatarUrl,
  displayName,
  size = 32
}: {
  avatarUrl?: string;
  displayName?: string;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      <img 
        src={avatarUrl} 
        style={{ 
          width: size, 
          height: size, 
          borderRadius: "50%",
          objectFit: "cover"
        }} 
        alt={displayName || "User Avatar"} 
        referrerPolicy="no-referrer"
      />
    );
  }
  
  return (
    <div style={{
      width: size, 
      height: size,
      borderRadius: "50%",
      background: "var(--accent)",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.4,
      fontWeight: 600
    }}>
      {displayName?.[0]?.toUpperCase() || "?"}
    </div>
  );
}
