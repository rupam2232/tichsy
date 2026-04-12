import React, { useCallback, useEffect, useRef, useState } from "react";
import QRCodeStyling from "qr-code-styling";
import { TEMPLATES } from "@/components/qr-templates/registry";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { IconQrcode, IconLoader2, IconDownload } from "@tabler/icons-react";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { toPng } from "html-to-image";
import { Button } from "@repo/ui/components/button";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getOptimizedUrl } from "@/utils/imageOptimizer";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { cn } from "@repo/ui/lib/utils";

const TableQRCode = ({
  qrCodeData,
  qrCodeName = "table-qrcode",
  tableSlug,
}: {
  qrCodeData: string;
  qrCodeName?: string;
  tableSlug: string;
}) => {
  const [open, setOpen] = useState(false);
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const activeRestaurant = useSelector(
    (state: RootState) => state.restaurantsSlice.activeRestaurant,
  );

  const [isQrReady, setIsQrReady] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    TEMPLATES[0]?.id || "template-1",
  );

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

  useEffect(() => {
    if (!open) return;
    setIsQrReady(false); // Reset to track if new QR code image is ready
    setQrSrc(null);
    const activeTemplate =
      TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0];

    if (!activeTemplate || !activeRestaurant) return;

    const restaurantLogo = getOptimizedUrl(
      activeRestaurant.logoUrl,
      200,
      200,
      "r_max",
    );

    const options = {
      width: 1200,
      height: 1200,
      image: restaurantLogo,
      data: qrCodeData || "Data not available",
      margin: 40,
      dotsOptions: {
        color: "#000000",
        type: "rounded" as const,
        ...(activeTemplate.qrOptions.dotsOptions || {}),
      },
      backgroundOptions: {
        color: "#ffffff",
        ...(activeTemplate.qrOptions.backgroundOptions || {}),
      },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 20,
      },
      qrOptions: {
        errorCorrectionLevel: "H" as const, // High error correction for logo overlay
      },
    };

    const newQr = new QRCodeStyling(options);

    newQr.getRawData("png").then((blob) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrSrc(reader.result as string); // Base64 data URL
      };
      reader.readAsDataURL(blob as Blob);
    });
  }, [open, qrCodeData, activeRestaurant, selectedTemplateId]);

  const onButtonClick = useCallback(async () => {
    if (ref.current === null || !isQrReady || isDownloading) {
      return;
    }

    try {
      setIsDownloading(true);
      const dataUrl = await toPng(ref.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = `${qrCodeName.replaceAll(" ", "-")}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("QR Code downloaded successfully");
    } catch (error) {
      toast.error("Failed to generate QR Code image");
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  }, [isQrReady, isDownloading, qrCodeName]);

  const activeTemplateDef =
    TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0];
  const ActiveTemplate = activeTemplateDef?.component;

  if (!ActiveTemplate) return null;

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
      <DialogContent
        className="w-full max-w-screen max-h-screen"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-4 pb-0 h-min">
          <DialogTitle>Download QR Code</DialogTitle>
          <DialogDescription>
            Select a template below to preview and download your table&apos;s
            specific QR code.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col-reverse sm:flex-row h-[75vh] w-full border-t">
          {/* Sidebar Thumbnails (Static PNG) */}
          <div className="sm:min-w-0 sm:h-full min-h-0 sm:pb-2 max-w-[calc(100vw-1rem)] sm:max-w-[220px] overflow-x-auto overflow-y-hidden sm:overflow-y-auto sm:overflow-x-hidden rounded-md">
            <div className="sm:w-[220px] flex flex-row sm:flex-col gap-6 p-4 border-t sm:border-r">
              {TEMPLATES.map((t) => {
                const isSelected = selectedTemplateId === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTemplateId(t.id)}
                    className="cursor-pointer group flex flex-col items-center select-none"
                  >
                    <div
                      className={cn(
                        "sm:w-[140px] sm:h-[175px] w-[100px] h-[125px] relative overflow-hidden rounded-lg border-2 transition-all bg-muted",
                        isSelected
                          ? "border-primary shadow-md"
                          : "border-background",
                      )}
                    >
                      <Avatar className="w-full h-full rounded-none">
                        <AvatarImage
                          className="object-cover"
                          src={getOptimizedUrl(t.thumbnailUrl, 240, 275)}
                          draggable={false}
                        />
                        <AvatarFallback className="bg-white rounded-none">
                          <IconQrcode className="w-8 h-8 text-black" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <span
                      className={`text-sm mt-3 font-medium text-muted-foreground`}
                    >
                      {t.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Preview Area */}
          <div className="flex-1 flex flex-col items-center relative overflow-hidden">
            <ScrollArea className="w-full h-full sm:h-auto">
              <div className="flex flex-col items-center justify-center min-h-full py-4">
                <div className="flex flex-row items-center justify-center gap-6">
                  <div className="relative shadow-2xl rounded-sm transition-opacity duration-300 animate-in fade-in flex items-center justify-center overflow-hidden h-[300px] w-[200px]">
                    {!isQrReady && (
                      <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-xs">
                        <IconLoader2 className="animate-spin w-8 h-8 text-primary" />
                      </div>
                    )}
                    <div className="pointer-events-none select-none scale-30 origin-center">
                      <ActiveTemplate qrCodeSrc={qrSrc} />
                    </div>
                  </div>

                  {/* Mobile Download Button */}
                  <Button
                    onClick={onButtonClick}
                    disabled={!isQrReady || isDownloading}
                    size="icon"
                    type="button"
                    variant="ghost"
                    className="absolute sm:hidden top-0 right-5"
                  >
                    {isDownloading ? (
                      <IconLoader2 className="animate-spin" />
                    ) : (
                      <IconDownload />
                    )}
                  </Button>
                </div>
              </div>
            </ScrollArea>

            <div className="my-4 w-full sm:flex justify-center hidden">
              <Button
                onClick={onButtonClick}
                disabled={!isQrReady || isDownloading}
              >
                {isDownloading ? (
                  <>
                    <IconLoader2 className="animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <IconDownload />
                    Download
                  </>
                )}
              </Button>
            </div>

            {/* Hidden Active Component explicitly unscaled specifically for high-res PNG capturing */}
            <div className="absolute top-[-9999px] left-[-9999px] pointer-events-none">
              <ActiveTemplate
                ref={ref}
                qrCodeSrc={qrSrc}
                onQrLoad={() => setIsQrReady(true)}
              />
            </div>
          </div>
        </div>

        <DialogClose className="absolute right-4 top-4" />
      </DialogContent>
    </Dialog>
  );
};

export default TableQRCode;
