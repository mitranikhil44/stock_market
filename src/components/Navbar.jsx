'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const checkLogin = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await axios.get('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data.user);
      } catch (error) {
        console.error("Auth failed:", error);
      }
    };

    checkLogin();
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <nav className="bg-gray-900 text-white shadow-md px-4 sm:px-6 py-3 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold text-blue-400">
        📈 Option Flow
      </Link>

      {/* Hamburger button (mobile) */}
      <button
        onClick={toggleMenu}
        className="sm:hidden focus:outline-none text-white"
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Links (desktop) */}
      <div className="hidden sm:flex items-center gap-6">
        <Link href="/" className="hover:text-blue-300 text-sm">Home</Link>
        <Link href="/about" className="hover:text-blue-300 text-sm">About</Link>
        <Link href="/marketprice" className="hover:text-blue-300 text-sm">Market Price</Link>
        <Link href="/optiondata" className="hover:text-blue-300 text-sm">Option Data</Link>
        <Link href="/analysis" className="hover:text-blue-300 text-sm">Analysis</Link>
        {user ? (
          <>
            <span className="text-sm text-gray-300">Hi, {user.name || 'Trader'}</span>
            <Link href="/profile" className="bg-blue-600 text-sm px-3 py-1 rounded hover:bg-blue-500">
              Profile
            </Link>
          </>
        ) : (
          <>
           {/* <Link href="/login" className="bg-blue-600 text-sm px-3 py-1 rounded hover:bg-blue-500">
             Login / Signup
           </Link> */}
          .</>
        )}
      </div>

      {/* Dropdown Menu (mobile only) */}
      {menuOpen && (
        <div className="absolute top-16 left-0 w-full bg-gray-800 shadow-md flex flex-col items-start gap-4 px-6 py-4 sm:hidden z-50">
          <Link href="/" className="hover:text-blue-300 text-sm" onClick={toggleMenu}>Home</Link>
          <Link href="/about" className="hover:text-blue-300 text-sm" onClick={toggleMenu}>About</Link>
          <Link href="/marketprice" className="hover:text-blue-300 text-sm" onClick={toggleMenu}>Market Price</Link>
          <Link href="/optiondata" className="hover:text-blue-300 text-sm" onClick={toggleMenu}>Option Data</Link>
          <Link href="/analysis" className="hover:text-blue-300 text-sm" onClick={toggleMenu}>Analysis</Link>
          {user ? (
            <>
              <span className="text-sm text-gray-300">Hi, {user.name || 'Trader'}</span>
              <Link href="/profile" className="bg-blue-600 text-sm px-3 py-1 rounded hover:bg-blue-500" onClick={toggleMenu}>
                Profile
              </Link>
            </>
          ) : (
            <Link href="/login" className="bg-blue-600 text-sm px-3 py-1 rounded hover:bg-blue-500" onClick={toggleMenu}>
              Login / Signup
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
