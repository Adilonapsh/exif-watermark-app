"use client";

import { useState, type RefObject } from "react";
import { formatShutterSpeed, formatDirection } from "./utils";

// Dynamic import for exifr to handle browser compatibility
let exifrParser: any = null;

const loadExifr = async () => {
  if (!exifrParser) {
    try {
      const exifrModule = await import("exifr");
      exifrParser =
        exifrModule.parse || exifrModule.default?.parse || exifrModule.default;
    } catch (error) {
      console.warn("Failed to load exifr, using fallback EXIF extraction");
      exifrParser = null;
    }
  }
  return exifrParser;
};

export function useExifProcessor(canvasRef: RefObject<HTMLCanvasElement>) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");

  const processImage = async (
    file: File,
    imagePreview: string,
    manualLocation?: string,
    currentLocation?: { lat: number; lng: number },
    manualDateTimeIso?: string,
    dateOptions?: {
      showHours?: boolean
      showMinutes?: boolean
      showSeconds?: boolean
      randomizeSeconds?: boolean
    }
  ) => {
    setIsProcessing(true);
    setProcessingStep(`Mengekstrak data EXIF dari ${file.name}...`);

    try {
      // Extract EXIF data
      const exif = await extractExifData(file);

      // Override location if manual location is provided
      if (manualLocation?.trim()) {
        setProcessingStep("Mencari lokasi...");
        const manualLocationData = await geocodeAddress(manualLocation);
        if (manualLocationData) {
          exif.location = manualLocationData;
          exif.coordinates = manualLocationData.coordinates;
        }
      } else if (
        currentLocation &&
        (!exif.coordinates.lat || !exif.coordinates.lng)
      ) {
        setProcessingStep("Memproses lokasi saat ini...");
        // const locationData = await formatLocation(
        //   currentLocation.lat,
        //   currentLocation.lng
        // );
        // exif.location = locationData;
        exif.location = "Jalan Cikempong\nPakansari\nKecamatan Cibinong\nKabupaten Bogor\nJawa Barat";
        exif.coordinates = currentLocation;
      }

      // Override date/time if provided manually
      if (manualDateTimeIso && manualDateTimeIso.trim()) {
        const parsed = new Date(manualDateTimeIso);
        if (!isNaN(parsed.getTime())) {
          const secondsValue = (() => {
            if (dateOptions?.showSeconds === false) return null;
            if (dateOptions?.randomizeSeconds) return Math.floor(Math.random() * 60);
            return parsed.getSeconds();
          })();

          const parts: string[] = [];
          const timeParts: string[] = [];

          parts.push(
            parsed.toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          );

          const includeHours = dateOptions?.showHours !== false;
          const includeMinutes = dateOptions?.showMinutes !== false;
          const includeSeconds = dateOptions?.showSeconds !== false;

          if (includeHours) {
            timeParts.push(parsed.getHours().toString().padStart(2, "0"));
          }
          if (includeMinutes) {
            const mm = parsed.getMinutes().toString().padStart(2, "0");
            if (!includeHours) {
              // If hours are hidden but minutes shown, still show minutes alone
              timeParts.push(mm);
            } else {
              timeParts.push(mm);
            }
          }
          if (includeSeconds && secondsValue !== null) {
            timeParts.push(secondsValue.toString().padStart(2, "0"));
          }

          if (timeParts.length > 0) {
            parts.push(timeParts.join(":"));
          }

          exif.dateTime = parts.join(", ");
        }
      }

      setProcessingStep("Membuat watermark...");

      // Create watermarked image
      const watermarkedImage = await createWatermarkedImage(imagePreview, exif);
      setProcessingStep("Selesai!");

      return {
        processedImage: watermarkedImage,
        exifData: exif,
      };
    } catch (error) {
      console.error("Error processing image:", error);
      setProcessingStep("Terjadi kesalahan");
      return null;
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProcessingStep(""), 2000);
    }
  };

  const geocodeAddress = async (address: string): Promise<any> => {
    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
          address
        )}&key=dc9f6a38bfde456e8133077e829459c4&language=id&pretty=1`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          address: result.formatted,
          coordinates: {
            lat: result.geometry.lat,
            lng: result.geometry.lng,
          },
        };
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
    }

    return {
      address: address,
      coordinates: { lat: null, lng: null },
    };
  };

  const extractExifData = async (file: File): Promise<any> => {
    try {
      const parser = await loadExifr();

      if (parser) {
        // Use exifr if available
        const exifData = await parser(file, {
          gps: true,
          exif: true,
          ifd0: true,
          ifd1: true,
          interop: true,
          makerNote: true,
          userComment: true,
          translateKeys: false,
          translateValues: false,
          reviveValues: true,
          sanitize: false,
          mergeOutput: true,
          silentErrors: true,
        });

        return parseExifData(exifData, file);
      } else {
        // Fallback to basic file metadata extraction
        return extractBasicMetadata(file);
      }
    } catch (error) {
      console.error("Error extracting EXIF data:", error);
      return extractBasicMetadata(file);
    }
  };

  const extractBasicMetadata = async (file: File): Promise<any> => {
    const now = new Date();

    // Try to get file modification date
    let fileDate = now;
    if (file.lastModified) {
      fileDate = new Date(file.lastModified);
    }

    const dateTime =
      fileDate.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
      ", " +
      fileDate.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

    return {
      dateTime,
      location: {
        address:
          "Jalan Cikempong\nPakansari\nKecamatan Cibinong\nKabupaten Bogor\nJawa Barat",
        coordinates: { lat: -6.4817, lng: 106.837 },
      },
      camera: {
        make: "Unknown",
        model: "Unknown",
        focalLength: "N/A",
        aperture: "N/A",
        iso: "N/A",
        shutterSpeed: "N/A",
      },
      altitude: "N/A",
      speed: "0km/h",
      direction: "N/A",
      coordinates: { lat: -6.4817, lng: 106.837 },
      originalExif: {},
    };
  };

  const parseExifData = (exifData: any, file: File): any => {
    console.log(exifData);
    let dateTime =
      new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
      ", " +
      new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

    if (
      exifData?.DateTime ||
      exifData?.DateTimeOriginal ||
      exifData?.CreateDate ||
      exifData?.["306"]
    ) {
      const dateStr =
        exifData.DateTime ||
        exifData.DateTimeOriginal ||
        exifData.CreateDate ||
        exifData?.["306"];
      console.log(dateStr);
      if (dateStr instanceof Date) {
        dateTime =
          dateStr.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }) +
          ", " +
          dateStr.getHours().toString().padStart(2, "0") +
          ":" +
          dateStr.getMinutes().toString().padStart(2, "0") +
          ":" +
          dateStr.getSeconds().toString().padStart(2, "0");
      } else if (typeof dateStr === "string") {
        const [datePart, timePart] = dateStr.split(" ");
        if (datePart && timePart) {
          const [year, month, day] = datePart.split(":");
          const [hour, minute, second] = timePart.split(":");
          const date = new Date(
            Number.parseInt(year),
            Number.parseInt(month) - 1,
            Number.parseInt(day),
            Number.parseInt(hour),
            Number.parseInt(minute),
            Number.parseInt(second)
          );

          dateTime =
            date.toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }) +
            ", " +
            date.getHours().toString().padStart(2, "0") +
            ":" +
            date.getMinutes().toString().padStart(2, "0") +
            ":" +
            date.getSeconds().toString().padStart(2, "0");
        }
      }
    }

    // Extract GPS coordinates
    let coordinates = { lat: null, lng: null };
    if (exifData?.latitude && exifData?.longitude) {
      coordinates = {
        lat: exifData.latitude,
        lng: exifData.longitude,
      };
    }

    // Extract camera info - preserve all original metadata
    const camera = {
      make: exifData?.Make || exifData?.["271"] || "Unknown",
      model: exifData?.Model || exifData?.["272"] || "Unknown",
      focalLength: exifData?.FocalLength ? `${exifData.FocalLength}mm` : "N/A",
      aperture:
        exifData?.FNumber || exifData?.["33437"]
          ? `f/${exifData.FNumber || exifData?.["33437"]}`
          : "N/A",
      iso:
        exifData?.ISO || exifData?.["34855"]
          ? `ISO ${exifData.ISO || exifData?.["34855"]}`
          : "N/A",
      shutterSpeed:
        exifData?.ExposureTime || exifData?.["33434"]
          ? formatShutterSpeed(exifData.ExposureTime || exifData?.["33434"])
          : "N/A",
    };

    const altitude = exifData?.["6"] ? `${Math.round(exifData["6"])}m` : "N/A";
    const speed = exifData?.["13"]
      ? `${Math.round(exifData?.["13"] * 1.852)}km/h`
      : "0km/h";
    const direction = exifData?.GPSImgDirection
      ? formatDirection(exifData.GPSImgDirection)
      : "N/A";

    return {
      dateTime,
      location: {
        address: "Lokasi tidak tersedia",
        coordinates,
      },
      camera,
      altitude,
      speed,
      direction,
      coordinates,
      originalExif: exifData,
    };
  };

  const formatLocation = async (
    lat: number | undefined,
    lng: number | undefined
  ): Promise<any> => {
    if (!lat || !lng) {
      return {
        address:
          "Jalan Cikempong\nPakansari\nKecamatan Cibinong\nKabupaten Bogor\nJawa Barat",
        coordinates: { lat: -6.4817, lng: 106.837 },
      };
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&zoom=18&format=jsonv2`
      );
      const data = await response.json();

      if (data && data.address) {
        const components = data.address;
        const addressParts = [];

        if (components.road) {
          addressParts.push(components.road);
        }

        if (components.suburb) {
          addressParts.push(components.suburb);
        }

        if (components.city || components.town || components.village) {
          addressParts.push(
            components.city || components.town || components.village
          );
        }

        if (components.county) {
          addressParts.push(`${components.county}`);
        }

        if (components.state) {
          addressParts.push(`${components.state}`);
        }

        if (components.country) {
          addressParts.push(components.country);
        }

        const formattedAddress =
          addressParts.length > 0 ? addressParts.join("\n") : data.display_name;

        return {
          address: formattedAddress,
          coordinates: { lat, lng },
        };
      }
    } catch (error) {
      console.error("Error getting location:", error);
    }

    return {
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      coordinates: { lat, lng },
    };
  };

  const createWatermarkedImage = async (
    imageSrc: string,
    exif: any
  ): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        addWatermarks(ctx, canvas.width, canvas.height, exif).then(() => {
          const watermarkedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
          resolve(watermarkedDataUrl);
        });
      };
      img.src = imageSrc;
    });
  };

  const addWatermarks = async (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    exif: any
  ) => {
    const fontSize = Math.max(14, width * 0.015);
    const padding = 20;
    const lineHeight = fontSize * 1.3;
    const mapSize = Math.min(width * 0.2, height * 0.2);

    const textLines = [];

    // Date and time (larger font)
    textLines.push({
      text: exif.dateTime,
      font: `bold ${fontSize * 1.2}px Arial`,
      size: fontSize * 1.2,
    });

    // Camera info
    if (exif.camera.make !== "Unknown") {
      const cameraText = `${exif.camera.make} ${exif.camera.model}`;
      textLines.push({
        text: cameraText,
        font: `${fontSize}px Arial`,
        size: fontSize,
      });
    }

    // Camera settings
    if (exif.camera.focalLength !== "N/A") {
      const settingsText = `${exif.camera.focalLength} ${exif.camera.aperture} ${exif.camera.shutterSpeed} ${exif.camera.iso}`;
      textLines.push({
        text: settingsText,
        font: `${fontSize}px Arial`,
        size: fontSize,
      });
    }

    // Location info - use fallback if not available
    let locationAddress = exif.location.address;
    if (!locationAddress || locationAddress === "Lokasi tidak tersedia") {
      // const location = await formatLocation(
      //   exif.coordinates.lat,
      //   exif.coordinates.lng
      // );
      locationAddress =
        "Jalan Cikempong\nPakansari\nKecamatan Cibinong\nKabupaten Bogor\nJawa Barat";
    }

    const locationLines = locationAddress.split("\n");
    locationLines.forEach((line: string) => {
      textLines.push({
        text: line.trim(),
        font: `${fontSize}px Arial`,
        size: fontSize,
      });
    });

    // Coordinates, altitude, speed, direction
    const additionalInfo = [];
    if (exif.coordinates.lat && exif.coordinates.lng) {
      additionalInfo.push(
        `${exif.coordinates.lat.toFixed(6)}, ${exif.coordinates.lng.toFixed(6)}`
      );
    }
    if (exif.altitude !== "N/A") {
      additionalInfo.push(`• Alt: ${exif.altitude}`);
    }

    if (additionalInfo.length > 0) {
      textLines.push({
        text: additionalInfo.join(" "),
        font: `${fontSize * 0.9}px Arial`,
        size: fontSize * 0.9,
      });
    }

    let maxTextWidth = 0;
    textLines.forEach((line) => {
      ctx.font = line.font;
      const textWidth = ctx.measureText(line.text).width;
      maxTextWidth = Math.max(maxTextWidth, textWidth);
    });

    const textHeight = textLines.length * lineHeight + padding * 2;
    const textBackgroundWidth = maxTextWidth + padding * 2;

    const textStartX = width - textBackgroundWidth;
    const textStartY = height - textHeight;

    // Draw text background
    // ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    // ctx.fillRect(textStartX, textStartY, textBackgroundWidth, textHeight);

    // Draw text
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    let currentY = textStartY + padding + fontSize;

    textLines.forEach((line, index) => {
      ctx.font = line.font;
      ctx.fillText(line.text, textStartX + padding, currentY);
      currentY += lineHeight * (index === 0 ? 1.2 : 1);
    });

    const mapX = padding;
    const mapY = height - mapSize - padding;

    const mapImage = new Image();
    mapImage.crossOrigin = "anonymous";

    await new Promise((resolve, reject) => {
      mapImage.onload = () => {
        // Draw map image maintaining aspect ratio
        const aspectRatio = mapImage.width / mapImage.height;
        const drawWidth = mapSize;
        const drawHeight = mapSize;

        ctx.fillStyle = "white";
        ctx.fillRect(mapX, mapY, mapSize, mapSize);

        ctx.drawImage(mapImage, mapX, mapY, drawWidth, drawHeight);

        // // Add border to map
        // ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
        // ctx.lineWidth = 5;
        // ctx.strokeRect(mapX, mapY, mapSize, mapSize);

        // Add location marker in center
        const centerX = mapX + mapSize / 2;
        const centerY = mapY + mapSize / 2;
        const markerSize = mapSize * 0.08;

        // Draw outer circle
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(centerX, centerY, markerSize * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Draw inner circle
        ctx.fillStyle = "#dc2626";
        ctx.beginPath();
        ctx.arc(centerX, centerY, markerSize * 0.2, 0, Math.PI * 2);
        ctx.fill();

        resolve(true);
      };

      mapImage.onerror = () => {
        reject(new Error("Failed to load map image"));
      };

      mapImage.src = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${exif.coordinates.lng ?? 0},${exif.coordinates.lat ?? 0},15,0,0/600x400?access_token=pk.eyJ1IjoiYWRpbG9uYXBzaCIsImEiOiJja3g1anppcjUyY3d0Mm5wMnA5bW15N3h3In0.7VIkHFr2up0hLZpI3XOYvQ`;
    });

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  };

  return {
    processImage,
    isProcessing,
    processingStep,
  };
}
