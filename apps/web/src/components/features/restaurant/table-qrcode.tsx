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
  tableSlug,
}: {
  qrCodeData: string;
  qrCodeImage?: string;
  qrCodeName?: string;
  tableSlug: string;
}) => {
  const qrCode = useRef<QRCodeStyling | null>(null);
  const [open, setOpen] = useState(false);
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const isQrLayerActive = useCallback(() => {
    const url = new URL(window.location.href);
    return (
      url.searchParams.get("table") === tableSlug &&
      url.searchParams.get("qr") === "true"
    );
  }, [tableSlug]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.set("table", tableSlug);
      url.searchParams.set("qr", "true");
      window.history.pushState(
        { overlay: "qr", table: tableSlug },
        "",
        url.toString(),
      );
      return;
    }

    if (isQrLayerActive()) {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        const url = new URL(window.location.href);
        url.searchParams.delete("qr");
        window.history.replaceState(
          { overlay: "sheet", table: tableSlug },
          "",
          url.toString(),
        );
        setOpen(false);
      }
      return;
    }

    setOpen(false);
  };

  useEffect(() => {
    const syncFromHistory = () => {
      const shouldBeOpen = isQrLayerActive();
      setOpen((prev) => (prev === shouldBeOpen ? prev : shouldBeOpen));
    };

    syncFromHistory();
    window.addEventListener("popstate", syncFromHistory);
    return () => {
      window.removeEventListener("popstate", syncFromHistory);
    };
  }, [isQrLayerActive]);

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
    },
    [open, qrCodeData, qrCodeImage]
  );

  useEffect(() => {
    if (ref.current === null || !isImageLoaded) {
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
  }, [isImageLoaded]);

  const onButtonClick = useCallback(() => {
    if (ref.current === null || !isImageLoaded || !imageUrl) {
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
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="text-secondary-foreground bg-background hover:bg-accent"
            >
              <IconQrcode />
            </Button>
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
                  src={qrSrc || "/dark-icon.svg"}
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
                  Powered by Tichsy
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
