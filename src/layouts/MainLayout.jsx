// layouts/MainLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer"

export default function MainLayout() {
  return (
    <div
      className="min-h-dvh bg-white text-neutral-900"
      style={{ fontFamily: '"Playfair Display", serif' }}
    >
      {/* Masthead shown on ALL pages */}
      <header className="max-w-screen-xl mx-auto px-6 pt-10 pb-6 text-center">
        <h1 className="text-5xl md:text-6xl font-semibold tracking-[0.18em] m-0">
          COLORED
        </h1>
      </header>
      <div className="border-t border-neutral-200" />

      {/* Nav + divider */}
      <Navbar />
      <div className="border-t border-neutral-200" />

      {/* Page content */}
      <main className="max-w-screen-xl mx-auto px-6 py-8">
        <Outlet />
      </main>
        <Footer />
    </div>
  );
}
