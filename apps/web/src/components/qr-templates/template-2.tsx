import React, { forwardRef } from "react";
import Image from "next/image";

interface Template2Props {
  qrCodeSrc: string | null;
  onQrLoad?: () => void;
}

export const Template2 = forwardRef<HTMLDivElement, Template2Props>(
  ({ qrCodeSrc, onQrLoad }, ref) => {
    return (
      <div
        ref={ref}
        className="relative overflow-hidden flex flex-col items-center bg-[#cba367] shrink-0"
        style={{
          width: "800px",
          minWidth: "800px",
          height: "1000px",
          minHeight: "1000px",
        }}
      >

        {/* Scan Text */}
        <div className="relative z-10 text-center flex flex-col items-center mb-4 mt-30">
          <h2
            className="text-[#2b1810]"
            style={{
              fontFamily: "'Kalam', cursive",
              fontSize: "70px",
              fontWeight: 700,
              lineHeight: "1",
              letterSpacing: "0.05em",
            }}
          >
            SCAN QR CODE
          </h2>
        </div>

        {/* Subtitle */}
        <div
          className="text-[#2b1810] text-center w-full z-10 flex flex-col items-center mt-6 leading-none"
          style={{
            fontFamily: "'Nunito', sans-serif",
            letterSpacing: "0.35em",
            fontSize: "22px",
            fontWeight: 500,
            lineHeight: "1",
          }}
        >
          <span className="w-full">TO VIEW MENU AND</span>
          <span className="w-full">PLACE ORDER</span>
        </div>

        {/* QR Code Section */}
        <div className="relative z-10 flex justify-center items-center my-2 mt-14">
          <div
            className="flex items-center justify-center bg-[#ebdcc2] overflow-hidden p-5 border-8 border-[#2b1810]"
            style={{
              borderRadius: "40px 35px 50px 35px / 35px 45px 35px 40px", // Inner wobble
            }}
          >
            <div
              className="bg-[#ebdcc2] flex items-center justify-center h-[400px] w-[400px]"
            >
              {qrCodeSrc ? (
                <Image
                  src={qrCodeSrc}
                  alt="QR Code"
                  width={400}
                  height={400}
                  onLoad={onQrLoad}
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <span
                  className="text-[#2b1810] font-medium opacity-50"
                  style={{ fontFamily: "'Kalam', cursive", fontSize: "24px" }}
                >
                  QR CODE
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Text */}
        <div
          className="absolute bottom-8 text-[#2b1810] text-center w-full z-10 flex flex-col items-center mt-12 leading-none"
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "18px",
            fontWeight: 700,
            letterSpacing: "0.02em",
          }}
        >
          <span>Powered by Tichsy</span>
        </div>
      </div>
    );
  },
);

Template2.displayName = "Template2";
