"use client"

import { useState, useRef } from "react"
import { Camera } from "lucide-react"
import { UploadSection } from "./upload-section"
import { ResultSection } from "./result-section"
import { ExifDataDisplay } from "./exif-data-display"
import { useExifProcessor } from "@/hooks/use-exif-processor"

export function ExifWatermarkApp() {
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [processedImages, setProcessedImages] = useState<Array<{ original: File; processed: string; exif: any }>>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { processImage, isProcessing, processingStep } = useExifProcessor(canvasRef)

  const handleFilesSelect = (files: File[]) => {
    setSelectedImages(files)
    setProcessedImages([])
  }

  const handleProcessImages = async (
    manualLocation?: string,
    currentLocation?: { lat: number; lng: number },
    manualDateTimeIso?: string,
    dateOptions?: {
      showHours?: boolean
      showMinutes?: boolean
      showSeconds?: boolean
      randomizeSeconds?: boolean
    },
    styleOptions?: {
      showMap?: boolean
      showTextBackground?: boolean
    }
  ) => {
    const results = []

    for (const file of selectedImages) {
      const imagePreview = await createImagePreview(file)
      const result = await processImage(
        file,
        imagePreview,
        manualLocation,
        currentLocation,
        manualDateTimeIso,
        dateOptions,
        styleOptions
      )
      if (result) {
        results.push({
          original: file,
          processed: result.processedImage,
          exif: result.exifData,
        })
      }
    }

    setProcessedImages(results)
  }

  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.readAsDataURL(file)
    })
  }

  const resetApp = () => {
    setSelectedImages([])
    setProcessedImages([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-3">
            EXIF Metadata Watermark
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tambahkan informasi metadata foto sebagai watermark profesional dengan peta lokasi
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <UploadSection
            selectedImages={selectedImages}
            onFilesSelect={handleFilesSelect}
            onProcessImages={handleProcessImages}
            isProcessing={isProcessing}
            processingStep={processingStep}
            onReset={resetApp}
          />

          <ResultSection processedImages={processedImages} onReset={resetApp} />
        </div>

        {/* EXIF Data Display */}
        {processedImages.length > 0 && <ExifDataDisplay processedImages={processedImages} />}

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}
