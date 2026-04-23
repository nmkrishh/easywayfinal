import React, { useState, useEffect } from 'react';

export default function IntroPage({ onEnter }) {
  const [startVisible, setStartVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setStartVisible(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-black z-50">
      {/* Background Video with a dark fade */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
      >
        <source src="/car_drift.mp4" type="video/mp4" />
      </video>
      
      {/* Simple Elegant Text Button with Pulsing Effect */}
      <div 
        className={`
          absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20
          transition-all duration-1500 ease-out
          ${startVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
      >
        <button 
          onClick={onEnter}
          className="
            text-white text-3xl tracking-[0.2em] uppercase font-extralight
            transition-all duration-700
            hover:tracking-[0.3em] animate-pulse
            px-8 py-4 border border-transparent hover:border-white/20 rounded
          "
          style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
        >
          Enter
        </button>
      </div>
    </div>
  );
}
