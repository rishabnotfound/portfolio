"use client";

import React, { useEffect, useState } from 'react';

const ScrollIndicator = () => {
  const [strokeOffset, setStrokeOffset] = useState(360);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      
      // Show indicator only when scrolled (scrollTop > 0)
      setIsVisible(scrollTop > 0);

      // Calculate scroll progress
      const scrollPercentage = (scrollTop / maxScroll) * 360;
      setStrokeOffset(360 - scrollPercentage);
    };

    // Initial check on mount
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-all duration-500
      ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}
      md:flex hidden`} // Hidden on mobile, visible on desktop (md and above)
    >
      <svg className="w-12 h-12" viewBox="0 0 100 100">
        {/* Outer gray border */}
        <rect
          x="5"
          y="5"
          width="90"
          height="90"
          stroke="#ccc"
          opacity="0.2"
          strokeWidth="2"
          fill="none"
        />
        {/* Red gradient progress bar */}
        <defs>
          <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#ef4444', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#dc2626', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <rect
          x="5"
          y="5"
          width="90"
          height="90"
          stroke="url(#redGradient)"
          strokeWidth="2"
          fill="none"
          style={{
            strokeDasharray: 360,
            strokeDashoffset: strokeOffset,
            transition: 'none'
          }}
        />
      </svg>

      {/* Center SVG icon with animation */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 500 500" 
          width="30" 
          height="30" 
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <clipPath id="scroll-indicator-clip">
              <rect width="500" height="500" x="0" y="0" />
            </clipPath>
          </defs>
          <g clipPath="url(#scroll-indicator-clip)">
            <g transform="matrix(0.8281,-0.0032,0.0038,1,250,250)" opacity="1">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                fillOpacity="0"
                stroke="rgb(255,255,255)"
                strokeOpacity="1"
                strokeWidth="10"
                d="M139.47,-64.8 C139.47,-64.8 139.47,64.8 139.47,64.8 C139.47,141.77 76.97,204.27 0,204.27 C0,204.27 0,204.27 0,204.27 C-76.97,204.27 -139.47,141.77 -139.47,64.8 C-139.47,64.8 -139.47,-64.8 -139.47,-64.8 C-139.47,-141.77 -76.97,-204.27 0,-204.27 C0,-204.27 0,-204.27 0,-204.27 C76.97,-204.27 139.47,-141.77 139.47,-64.8z"
              />
            </g>
            <g transform="matrix(1,0.0172,-0.0172,1,250,146.08)" opacity="1">
              <g>
                <path
                  fillRule="evenodd"
                  fill="rgb(255,255,255)"
                  fillOpacity="1"
                  d="M0,-20.02 C11.05,-20.02 20.02,-11.05 20.02,0 C20.02,11.05 11.05,20.02 0,20.02 C-11.05,20.02 -20.02,11.05 -20.02,0 C-20.02,-11.05 -11.05,-20.02 0,-20.02z"
                />
                <animateTransform
                  attributeName="transform"
                  attributeType="XML"
                  type="translate"
                  values="0 0; 0 -60; 0 0"
                  keyTimes="0;0.5;1"
                  dur="1.5s"
                  repeatCount="indefinite"
                  additive="sum"
                />
              </g>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default ScrollIndicator;