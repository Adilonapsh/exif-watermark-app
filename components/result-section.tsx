"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ImageIcon, Download, CheckCircle, Archive } from "lucide-react"
import JSZip from "jszip"

interface ProcessedImage {
  original: File
  processed: string
  exif: any
}

interface ResultSectionProps {
  processedImages: ProcessedImage[]
  onReset: () => void
}

export function ResultSection({ processedImages, onReset }: ResultSectionProps) {
  const downloadSingleImage = (processedImage: ProcessedImage, index: number) => {
    const link = document.createElement("a")
    link.download = `watermarked-${processedImage.original.name}`
    link.href = processedImage.processed
    link.click()
  }

  const downloadAllAsZip = async () => {
    const zip = new JSZip()

    for (let i = 0; i < processedImages.length; i++) {
      const processedImage = processedImages[i]

      // Convert data URL to blob
      const response = await fetch(processedImage.processed)
      const blob = await response.blob()

      // Add to zip with original filename
      const filename = `watermarked-${processedImage.original.name}`
      zip.file(filename, blob)
    }

    // Generate and download zip
    const zipBlob = await zip.generateAsync({ type: "blob" })
    const link = document.createElement("a")
    link.download = `watermarked-photos-${new Date().toISOString().split("T")[0]}.zip`
    link.href = URL.createObjectURL(zipBlob)
    link.click()
  }

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-green-100 rounded-lg">
            <ImageIcon className="w-5 h-5 text-green-600" />
          </div>
          Hasil Watermark
        </CardTitle>
        <CardDescription className="text-base">Foto dengan metadata watermark dan peta lokasi</CardDescription>
      </CardHeader>
      <CardContent>
        {processedImages.length > 0 ? (
          <div className="space-y-6">
            {/* Image Grid */}
            <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
              {processedImages.map((processedImage, index) => (
                <div key={index} className="relative">
                  <img
                    src={processedImage.processed || "/placeholder.svg"}
                    alt={`Watermarked ${index + 1}`}
                    className="w-full rounded-xl shadow-lg"
                  />
                  <Badge className="absolute top-3 left-3 bg-green-500">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {index + 1}
                  </Badge>
                  <Button
                    onClick={() => downloadSingleImage(processedImage, index)}
                    size="sm"
                    className="absolute top-3 right-3 bg-black/50 hover:bg-black/70"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                onClick={downloadAllAsZip}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Archive className="w-4 h-4 mr-2" />
                Download ZIP ({processedImages.length})
              </Button>
              <Button
                onClick={() => downloadSingleImage(processedImages[0], 0)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                disabled={processedImages.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Pertama
              </Button>
              <Button variant="outline" onClick={onReset}>
                Proses Foto Baru
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-80 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mb-4">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg font-medium">Hasil watermark akan muncul di sini</p>
            <p className="text-gray-400 text-sm mt-1">Upload foto dan proses untuk melihat hasil</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
