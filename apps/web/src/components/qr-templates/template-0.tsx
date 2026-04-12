import React, { forwardRef } from 'react';
import Image from 'next/image';

interface Template3Props {
  qrCodeSrc: string | null;
  onQrLoad?: () => void;
}

export const Template0 = forwardRef<HTMLDivElement, Template3Props>(
  ({ qrCodeSrc, onQrLoad }, ref) => {
    return (
      <div
        ref={ref}
        className="relative bg-white flex flex-col items-center justify-center shrink-0"
        style={{
          width: '800px',
          height: '1000px',
          minWidth: '800px',
          minHeight: '1000px',
        }}
      >
        <div className="flex-1 flex flex-col items-center justify-center w-full pb-16">
          {qrCodeSrc ? (
            <div className="w-[600px] h-[600px] flex items-center justify-center bg-white">
              <Image
                src={qrCodeSrc}
                alt="QR Code"
                width={600}
                height={600}
                onLoad={onQrLoad}
                draggable={false}
                priority
              />
            </div>
          ) : (
            <div className="w-[600px] h-[600px] bg-gray-100 animate-pulse rounded-xl" />
          )}
        </div>

        <div className="absolute bottom-12 w-full text-center">
          <p className="text-gray-400 font-normal text-lg tracking-wide">
            Powered by Tichsy
          </p>
        </div>
      </div>
    );
  }
);

Template0.displayName = 'Template0';
