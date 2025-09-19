"use client";

import React from "react";

const AboutPage = () => {
  return (
    <div className="min-h-screen container m-auto w-full bg-gradient-to-br bg-transparent text-gray-100 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-white via-red-800 to-black">
          About Us
        </h1>

        {/* Intro */}
        <p className="text-lg md:text-xl text-center max-w-3xl mx-auto leading-relaxed text-gray-300 mb-12">
          The stock market is full of opportunities—but also full of noise.  
          Our platform filters out the noise and provides traders with **clear, actionable, and data-driven insights**.  
          Built for the Indian Capital Market with a strong focus on index options like  
          <span className="font-semibold text-purple-300"> Nifty 50</span>,  
          <span className="font-semibold text-pink-300"> Bank Nifty</span>,  
          <span className="font-semibold text-indigo-300"> Fin Nifty</span>, and  
          <span className="font-semibold text-yellow-300"> MidCap Nifty</span>.
        </p>

        {/* Offerings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Real-Time Option Chain */}
          <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl hover:shadow-purple-500/20 transition">
            <h2 className="text-xl font-bold text-purple-300 mb-3">📊 Real-Time Option Chain</h2>
            <p className="text-gray-300">
              View strike-wise OI, Volume, and LTP with ATM highlights.  
              Track OI & volume shifts to detect **big player movements**.
            </p>
          </div>

          {/* Expiry Automation */}
          <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl hover:shadow-pink-500/20 transition">
            <h2 className="text-xl font-bold text-pink-300 mb-3">🔄 Expiry Date Automation</h2>
            <p className="text-gray-300">
              No manual updates needed! Expiry dates auto-update for Nifty, Bank Nifty & Fin Nifty ensuring **zero downtime**.
            </p>
          </div>

          {/* Time-Wise Data */}
          <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl hover:shadow-indigo-500/20 transition">
            <h2 className="text-xl font-bold text-indigo-300 mb-3">🕒 Time-Wise & Historical Data</h2>
            <p className="text-gray-300">
              Data captured every few minutes during market hours.  
              Compare snapshots to spot **unusual movements**.
            </p>
          </div>

          {/* PCR */}
          <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl hover:shadow-green-500/20 transition">
            <h2 className="text-xl font-bold text-green-300 mb-3">📈 PCR (Put/Call Ratio) Analysis</h2>
            <p className="text-gray-300">
              Gauge market sentiment with **PCR by OI & Volume** in chart and table view.
            </p>
          </div>

          {/* Scalping */}
          <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl hover:shadow-yellow-500/20 transition">
            <h2 className="text-xl font-bold text-yellow-300 mb-3">⚡ Scalping-Friendly Tools</h2>
            <p className="text-gray-300">
              Spot quick intraday opportunities by analyzing **OI & Volume flows**.
            </p>
          </div>

          {/* Market Indices */}
          <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl hover:shadow-red-500/20 transition">
            <h2 className="text-xl font-bold text-red-300 mb-3">📉 Market Indices Dashboard</h2>
            <p className="text-gray-300">
              Live tracking of **Nifty 50, Bank Nifty, Fin Nifty & MidCap Nifty** with historical charts.
            </p>
          </div>
        </div>

        {/* Mission */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-pink-400 mb-4">🎯 Our Mission</h2>
          <p className="max-w-3xl mx-auto text-gray-300 leading-relaxed">
            We believe that **data-driven trading is the future**. Many traders lose not due to lack of skill,  
            but due to lack of timely insights.  
            Our mission: simplify complex data into **clear visuals** and empower traders to make smarter decisions.
          </p>
        </div>

        {/* Final Note */}
        <div className="mt-16 text-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl shadow-2xl p-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Smarter, Faster, Profitable Trading
          </h2>
          <p className="max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            With our platform, you no longer need to juggle multiple sources.  
            Everything you need—**Option Chain, PCR, Index Data, Expiry Tracking, and Analysis**—is in one place.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
