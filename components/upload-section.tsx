"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Upload, ImageIcon, Camera, MapPin, Navigation, Plus, Loader2, CheckCircle, X } from "lucide-react"

interface UploadSectionProps {
  selectedImages: File[]
  onFilesSelect: (files: File[]) => void
  onProcessImages: (manualLocation?: string, currentLocation?: { lat: number; lng: number }) => void
  isProcessing: boolean
  processingStep: string
  onReset: () => void
}

export function UploadSection({
  selectedImages,
  onFilesSelect,
  onProcessImages,
  isProcessing,
  processingStep,
  onReset,
}: UploadSectionProps) {
  const [showLocationInput, setShowLocationInput] = useState(false)
  const [manualLocation, setManualLocation] = useState("")
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const imageFiles = files.filter((file) => file.type.startsWith("image/"))
    onFilesSelect(imageFiles)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files)
    const imageFiles = files.filter((file) => file.type.startsWith("image/"))
    onFilesSelect(imageFiles)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsGettingLocation(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setIsGettingLocation(false)
        },
        (error) => {
          console.error("Error getting location:", error)
          setIsGettingLocation(false)
        },
      )
    }
  }

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index)
    onFilesSelect(newImages)
  }

  const handleProcess = () => {
    onProcessImages(manualLocation.trim() || undefined, currentLocation || undefined)
  }

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Upload className="w-5 h-5 text-blue-600" />
          </div>
          Upload Foto
        </CardTitle>
        <CardDescription className="text-base">
          Pilih satu atau beberapa foto untuk mengekstrak metadata EXIF dan menambahkan watermark
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
            selectedImages.length > 0
              ? "border-green-300 bg-green-50/50"
              : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/50"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          {selectedImages.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedImages.slice(0, 6).map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file) || "/placeholder.svg"}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg shadow-md"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeImage(index)
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {selectedImages.length > 6 && (
                  <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 text-sm">+{selectedImages.length - 6} lainnya</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="font-medium text-gray-700">{selectedImages.length} foto dipilih</p>
                <p className="text-sm text-gray-500">
                  Total: {(selectedImages.reduce((acc, file) => acc + file.size, 0) / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button variant="outline" size="sm" onClick={onReset}>
                  Pilih Foto Lain
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-700 mb-2">Drag & drop foto di sini</p>
                <p className="text-gray-500">atau klik untuk memilih file (bisa multiple)</p>
                <p className="text-sm text-gray-400 mt-2">Mendukung JPG, PNG, HEIC dengan data EXIF</p>
              </div>
            </div>
          )}
        </div>

        {selectedImages.length > 0 && (
          <div className="space-y-4">
            <Separator />

            {/* Location Options */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Opsi Lokasi
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={() => setShowLocationInput(!showLocationInput)}
                  variant={showLocationInput ? "default" : "outline"}
                  size="sm"
                  className="justify-start"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Lokasi Manual
                </Button>
                <Button
                  onClick={getCurrentLocation}
                  variant={currentLocation ? "default" : "outline"}
                  size="sm"
                  disabled={isGettingLocation}
                  className="justify-start"
                >
                  {isGettingLocation ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4 mr-2" />
                  )}
                  Lokasi Saat Ini
                </Button>
              </div>

              {showLocationInput && (
                <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                  <Label htmlFor="location" className="text-sm font-medium">
                    Alamat atau Nama Tempat
                  </Label>
                  <Input
                    id="location"
                    placeholder="Contoh: Monas, Jakarta atau Jl. Sudirman No. 1"
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    className="bg-white"
                  />
                </div>
              )}

              {currentLocation && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div className="text-sm">
                    <p className="font-medium text-green-800">Lokasi saat ini berhasil didapat</p>
                    <p className="text-green-600">
                      {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Process Button */}
            <Button
              onClick={handleProcess}
              disabled={isProcessing}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isProcessing ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <div className="text-left">
                    <div>Memproses...</div>
                    {processingStep && <div className="text-sm opacity-80">{processingStep}</div>}
                  </div>
                </div>
              ) : (
                <>
                  <Camera className="w-5 h-5 mr-2" />
                  Tambahkan Watermark ({selectedImages.length} foto)
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
