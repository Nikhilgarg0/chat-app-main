import "./globals.css";

export const metadata = {
  title: "NEXUS",
  description: "Complete platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}