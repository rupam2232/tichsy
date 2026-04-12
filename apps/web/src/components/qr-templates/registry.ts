import { Template0 } from "./template-0";
import { Template1 } from "./template-1";
import { Template2 } from "./template-2";
import { Options } from "qr-code-styling";
import React from "react";

export interface QRTemplate {
  id: string;
  name: string;
  thumbnailUrl?: string;
  component: React.ComponentType<{
    qrCodeSrc: string | null;
    onQrLoad?: () => void;
    ref?: React.Ref<HTMLDivElement>;
  }>;
  qrOptions: Partial<Options>;
}

export const TEMPLATES: QRTemplate[] = [
  {
    id: "template-0",
    name: "Standard Base",
    component: Template0,
    qrOptions: {
      backgroundOptions: { color: "#ffffff" },
      dotsOptions: { color: "#000000", type: "square" },
    },
  },
  {
    id: "template-1",
    name: "Elegant Blush",
    thumbnailUrl: "https://res.cloudinary.com/rupam-mondal/image/upload/v1775820588/template-1_bcmvxv.png",
    component: Template1,
    qrOptions: {
      backgroundOptions: { color: "#ffffff" },
      dotsOptions: { color: "#000000", type: "rounded" },
    },
  },
  {
    id: "template-2",
    name: "Café Sketch",
    thumbnailUrl: "https://res.cloudinary.com/rupam-mondal/image/upload/v1775820587/template-2_d1go63.png",
    component: Template2,
    qrOptions: {
      backgroundOptions: { color: "#ebdcc2" },
      dotsOptions: { color: "#2b1810", type: "rounded" },
    },
  },
];
