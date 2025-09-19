import "./globals.css";
import Background from "@/components/Background";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProtectedLayout from "@/components/ProtectedLayout";

// 🔹 Metadata for favicon & app icons
export const metadata = {
  title: "Your App Name", // change if needed
  description: "Option Flow Analysis Platform",
  icons: {
    icon: "/images/option_flow.png", 
    shortcut: "/images/option_flow.png",  
    apple: "/images/fav_icons/apple-touch-icon.png", 
    other: [
      {
        rel: "icon",
        url: "/images/fav_icons/favicon-32x32.png",
        sizes: "32x32",
      },
      {
        rel: "icon",
        url: "/images/fav_icons/favicon-16x16.png",
        sizes: "16x16",
      },
      {
        rel: "manifest",
        url: "/images/fav_icons/site.webmanifest",
      },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="min-h-full">
      <body className="min-h-full relative overflow-x-hidden">
        <Background />

        <ProtectedLayout>
          <main className="relative z-10">
            <Navbar />
            <div className="w-full m-auto">{children}</div>
          </main>
          <Footer />
        </ProtectedLayout>
      </body>
    </html>
  );
}
