"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Clock, Camera, MapPin } from "lucide-react"

interface ProcessedImage {
  original: File
  processed: string
  exif: any
}

interface ExifDataDisplayProps {
  processedImages: ProcessedImage[]
}

export function ExifDataDisplay({ processedImages }: ExifDataDisplayProps) {
  return (
    <Card className="mt-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-purple-100 rounded-lg">
            <AlertCircle className="w-5 h-5 text-purple-600" />
          </div>
          Informasi Metadata EXIF
        </CardTitle>
        <CardDescription className="text-base">
          Data yang diekstrak dari foto dan ditambahkan sebagai watermark
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {processedImages.map((processedImage, index) => (
            <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
              <h3 className="font-semibold text-lg mb-4 text-gray-800">{processedImage.original.name}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Date & Time */}
                <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-800">Tanggal & Waktu</h4>
                  </div>
                  <p className="text-blue-700 font-medium">{processedImage.exif.dateTime}</p>
                </div>

                {/* Camera Info */}
                <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-800">Kamera</h4>
                  </div>
                  <div>
                    <p className="text-green-700 font-medium">
                      {processedImage.exif.camera.make} {processedImage.exif.camera.model}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      {processedImage.exif.camera.focalLength} • {processedImage.exif.camera.aperture} •{" "}
                      {processedImage.exif.camera.shutterSpeed} • {processedImage.exif.camera.iso}
                    </p>
                  </div>
                </div>

                {/* Location */}
                {processedImage.exif.location.address !== "Lokasi tidak tersedia" && (
                  <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-red-600" />
                      <h4 className="font-semibold text-red-800">Lokasi</h4>
                    </div>
                    <div>
                      <p className="text-red-700 font-medium">{processedImage.exif.location.address}</p>
                      {processedImage.exif.coordinates.lat && (
                        <p className="text-sm text-red-600 mt-1">
                          {processedImage.exif.coordinates.lat.toFixed(6)},{" "}
                          {processedImage.exif.coordinates.lng.toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional metadata in smaller cards */}
                {processedImage.exif.direction !== "N/A" && (
                  <div className="space-y-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 text-sm">Arah</h4>
                    <p className="text-yellow-700">{processedImage.exif.direction}</p>
                  </div>
                )}

                {processedImage.exif.altitude !== "N/A" && (
                  <div className="space-y-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h4 className="font-semibold text-indigo-800 text-sm">Ketinggian</h4>
                    <p className="text-indigo-700">{processedImage.exif.altitude}</p>
                  </div>
                )}

                {processedImage.exif.speed !== "0km/h" && (
                  <div className="space-y-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-800 text-sm">Kecepatan</h4>
                    <p className="text-orange-700">{processedImage.exif.speed}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
