import "./globals.css";
import Background from "@/components/Background";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProtectedLayout from "@/components/ProtectedLayout";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="min-h-full">
      <body className="min-h-full relative overflow-x-hidden">
        <Background />

        <ProtectedLayout>
          <main className="relative z-10">
            <Navbar />
            <div className="container w-full m-auto">{children}</div>
          </main>
          <Footer/>
        </ProtectedLayout>
      </body>
    </html>
  );
}
