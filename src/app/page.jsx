import React from "react";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/image/landing.jpg"
          alt="Landing Background"
          fill
          className="object-cover opacity-30"
          priority
        />
      </div>

      {/* Hero */}
      <section className="relative z-10 text-center py-28 px-6">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-accent-1 to-accent-2 bg-clip-text text-transparent">
          Smarter Options Insights
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-80 mb-8">
          Real-time PCR, OI, and Volume predictions in one clean dashboard.
        </p>
        <a
          href="/analysis"
          className="inline-block px-8 py-4 rounded-2xl font-semibold glass-card hover:shadow-accent-1/40 transition"
        >
          Get Started →
        </a>
      </section>

      {/* Features */}
      <section className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 px-6 pb-20 max-w-6xl mx-auto">
        {[
          {
            title: "Live Insights",
            text: "Track OI, PCR, and volume minute by minute.",
          },
          {
            title: "Smart Prediction",
            text: "Bullish/Bearish bias powered by dynamic lookback.",
          },
          {
            title: "Minimal Design",
            text: "Dark, responsive, distraction-free interface.",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="glass-card p-8 text-left hover:shadow-lg hover:shadow-accent-2/20 transition"
          >
            <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
            <p className="opacity-80">{item.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
