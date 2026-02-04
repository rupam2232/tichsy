import React, { useCallback, useEffect, useRef, useState } from "react";
import QRCodeStyling from "qr-code-styling";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { IconQrcode } from "@tabler/icons-react";
import Image from "next/image";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { toPng } from "html-to-image";
import { Button } from "@repo/ui/components/button";
import { toast } from "sonner";

const TableQRCode = ({
  qrCodeData,
  qrCodeImage,
  qrCodeName = "table-qrcode",
}: {
  qrCodeData: string;
  qrCodeImage?: string;
  qrCodeName?: string;
}) => {
  const qrCode = useRef<QRCodeStyling | null>(null);
  const [open, setOpen] = useState(false);
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setOpen(true);
      window.history.pushState({ qrCodeData }, "", window.location.href);
    } else {
      window.history.back();
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setOpen(false);
    };

    if (open) {
      window.addEventListener("popstate", handlePopState);
    }
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [open]);

  useEffect(
    () => {
      if (open) {
        if (!qrCode.current) {
          qrCode.current = new QRCodeStyling({
            width: 1200,
            height: 1200,
            image: qrCodeImage,
            data: qrCodeData || "Data not available",
            margin: 40,
            dotsOptions: {
              color: "#000000",
              type: "rounded",
            },
            backgroundOptions: {
              color: "#ffffff",
            },
            imageOptions: {
              crossOrigin: "anonymous",
              margin: 20,
            },
            qrOptions: {
              errorCorrectionLevel: "H", // High error correction for logo overlay
            },
          });
        }
        qrCode.current.getRawData("png").then((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            setQrSrc(reader.result as string); // Base64 data URL
          };
          reader.readAsDataURL(blob as Blob);
        });
      }
      return () => {
        if (qrSrc) URL.revokeObjectURL(qrSrc);
      };
    },
    // eslint-disable-next-line
    [open, qrCodeData, qrCodeImage]
  );

  useEffect(() => {
    if (ref.current === null || !isImageLoaded) {
      console.log("Ref is null or image not loaded yet");
      return;
    }
    toPng(ref.current, { cacheBust: true, pixelRatio: 2 })
      .then((dataUrl) => {
        setImageUrl(dataUrl);
      })
      .catch((err) => {
        toast.error("Failed to generate QR Code image");
        console.error(err);
      });
  }, [isImageLoaded, ref]);

  const onButtonClick = useCallback(() => {
    if (ref.current === null || !isImageLoaded || !imageUrl) {
      console.log("Ref is null or image not loaded yet");
      return;
    }
    try {
      const link = document.createElement("a");
      link.download = `${qrCodeName.replaceAll(" ", "-")}.png`;
      link.href = imageUrl;
      link.click();
    } catch (error) {
      toast.error("Failed to download QR Code");
      console.error(error);
    }
  }, [isImageLoaded, imageUrl, qrCodeName]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger className="w-min [&_svg]:size-6! p-5 bg-transparent hover:bg-secondary/10 border border-accent-foreground/60">
            <IconQrcode />
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Generate QR Code</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogTitle className="sr-only">Download QR Code</DialogTitle>
        <ScrollArea className="overflow-y-auto h-[90vh]">
          <DialogHeader className="p-6">
            {imageUrl ? (
              <Image
                src={imageUrl}
                width={300}
                height={300}
                alt="Generated QR Code"
                className="object-contain mx-auto h-2/3!"
                draggable={false}
              />
            ) : (
              <div className="w-[300px] h-[385px] animate-pulse bg-gray-200 mx-auto"></div>
            )}
            <Button onClick={onButtonClick} className="w-2/3 mx-auto">
              Download
            </Button>

            <div className="object-contain w-full flex justify-center my-4 absolute top-[-9999px]">
              <div
                ref={ref}
                className="flex items-center justify-center flex-col p-4 bg-gray-100"
                style={{ width: "400px", height: "400px" }}
              >
                {/* QR Code */}
                <Image
                  src={qrSrc || "/placeholder-logo.png"}
                  alt="QR Code"
                  width={250}
                  height={250}
                  style={{ marginBottom: "5px" }}
                  onLoad={() => setIsImageLoaded(true)}
                  draggable={false}
                  className={`object-contain rounded-md ${qrSrc ? "" : "hidden"}`}
                />

                <p
                  style={{
                    fontSize: "10px",
                    color: "#333",
                    textAlign: "center",
                  }}
                >
                  Powered by {process.env.NEXT_PUBLIC_APP_NAME || "POS App"}
                </p>
              </div>
            </div>
            <DialogClose />
          </DialogHeader>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TableQRCode;
