import React, { forwardRef } from 'react';
import Image from 'next/image';

interface Template1Props {
  qrCodeSrc: string | null;
  onQrLoad?: () => void;
}

export const Template1 = forwardRef<HTMLDivElement, Template1Props>(
  ({ qrCodeSrc, onQrLoad }, ref) => {
    return (
      <div
        ref={ref}
        className="relative overflow-hidden flex flex-col items-center bg-[#faf8f7] shrink-0"
        style={{
          width: '800px',
          minWidth: '800px',
          height: '1000px',
          minHeight: '1000px',
        }}
      >


        {/* Bottom Curved Background */}
        <div
          className="absolute bg-[#eadbdc]"
          style={{
            width: '2000px',
            height: '2000px',
            borderRadius: '50%',
            bottom: '-50%', // Adjusted to put the curve at the right height
            left: '50%',
            transform: 'translateX(-50%) translateY(50%)',
            zIndex: 0,
          }}
        />

        {/* Top Ornament */}
        <div className="flex items-center justify-center w-full px-16 mt-12 z-10 relative">
          <div className="flex-1 border-t border-[#3c3c3c]" />
          <div className="mx-4 flex items-center justify-center">
            <svg
              width="120"
              height="30"
              viewBox="0 0 120 30"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M55,15 C55,2 25,2 25,15 C25,28 55,28 65,15"
                stroke="#3c3c3c"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M65,15 C65,2 95,2 95,15 C95,28 65,28 55,15"
                stroke="#3c3c3c"
                strokeWidth="1.5"
                fill="none"
              />
              <rect
                x="52.5"
                y="7.5"
                width="15"
                height="15"
                transform="rotate(45 60 15)"
                stroke="#3c3c3c"
                strokeWidth="1.5"
                fill="#faf8f7"
              />
              <rect
                x="57"
                y="12"
                width="6"
                height="6"
                transform="rotate(45 60 15)"
                stroke="#3c3c3c"
                strokeWidth="1"
                fill="none"
              />
            </svg>
          </div>
          <div className="flex-1 border-t border-[#3c3c3c]" />
        </div>

        {/* Main Title */}
        <div className="relative z-10 text-center flex flex-col items-center mt-6">
          <h1
            className="text-[#3c3c3c]"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '150px',
              lineHeight: '1',
              letterSpacing: '0.05em',
            }}
          >
            SCAN
          </h1>
          <h2
            className="text-[#4a4a4a]"
            style={{
              fontFamily: "'Great Vibes', cursive",
              fontSize: '110px',
              marginTop: '-20px', // Re-add negative margin so it elegantly overlaps "SCAN"
              zIndex: 20,
              fontWeight: 400,
            }}
          >
            Here
          </h2>
        </div>

        {/* Subtitle */}
        <div
          className="text-[#3c3c3c] text-center relative z-10 mt-6 flex flex-col items-center gap-3 w-full"
          style={{
            fontFamily: "'Montserrat', sans-serif",
            letterSpacing: '0.35em',
            fontSize: '22px',
            fontWeight: 500,
            lineHeight: '1',
          }}
        >
          <span className="w-full">TO VIEW MENU AND</span>
          <span className="w-full">PLACE ORDER</span>
        </div>

        {/* QR Code Section */}
        <div className="relative z-10 mt-14 flex justify-center items-center">
          {/* Subtle Pink Shadow Effect */}
          <div className="absolute inset-0 bg-[#f4a1a1] opacity-70 blur-xl scale-105 translate-y-4 rounded-lg z-0"></div>
          
          <div className="bg-white p-4 shadow-lg relative z-10 rounded-xl">
            <div className="w-[320px] h-[320px] relative flex items-center justify-center">
              {qrCodeSrc ? (
                <Image
                  src={qrCodeSrc}
                  alt="QR Code"
                  width={310}
                  height={310}
                  onLoad={onQrLoad}
                  className="object-contain"
                  style={{ width: '100%', height: '100%' }}
                  unoptimized // For data urls to render smoothly during capture
                />
              ) : (
                <span className="text-gray-400 font-medium">QR CODE</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div
          className="absolute bottom-8 text-[#3c3c3c] text-center w-full z-10"
          style={{
            fontFamily: "'Montserrat', sans-serif",
            letterSpacing: '0.18em',
            fontSize: '18px',
            fontWeight: 500,
          }}
        >
          <span>Powered by Tichsy</span>
        </div>
      </div>
    );
  }
);

Template1.displayName = 'Template1';
