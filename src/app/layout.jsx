import './globals.css';
import Background from '@/components/Background';
import Navbar from '@/components/Navbar';

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="min-h-full">
      <body className="min-h-full relative overflow-x-hidden">
        {/* Background layers */}
        <Background />

        {/* Content wrapper with safe z-index */}
        <main className="relative z-10">          
      <Navbar/>
          {children}
        </main>
      </body>
    </html>
  );
}
