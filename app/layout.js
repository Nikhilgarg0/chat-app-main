import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata = {
  title: "NEXUS",
  description: "Complete platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}