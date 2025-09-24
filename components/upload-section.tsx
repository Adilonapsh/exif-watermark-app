"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Upload, ImageIcon, Camera, MapPin, Navigation, Plus, Loader2, CheckCircle, X } from "lucide-react"

import { Feature, Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import 'ol/ol.css';
import VectorLayer from "ol/layer/Vector"
import VectorSource from "ol/source/Vector"
import { Point } from "ol/geom"
import Style from "ol/style/Style"
import Icon from "ol/style/Icon"

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

  const mapRef = useRef<Map | null>(null);
  const mapElement = useRef<HTMLDivElement>(null);
  const vectorSourceRef = useRef<VectorSource>(new VectorSource());

  useEffect(() => {
    if (!showLocationInput) return;
    if (!mapElement.current) return;
    if (mapRef.current) return;

    const baseLayer = new TileLayer({
      source: new OSM(),
    });

    // Buat layer untuk marker
    const markerLayer = new VectorLayer({
      source: vectorSourceRef.current,
    });

    // Inisialisasi map
    const map = new Map({
      target: mapElement.current,
      layers: [baseLayer, markerLayer],
      view: new View({
        center: fromLonLat([106.83330170527103, -6.49479442693621]),
        zoom: 17,
      }),
    });

    map.on("click", (evt) => {
      const [lon, lat] = toLonLat(evt.coordinate);
      setCurrentLocation({ lat, lng: lon });

      // Clear marker sebelumnya
      vectorSourceRef.current.clear();

      // Tambah marker baru
      const marker = new Feature({
        geometry: new Point(evt.coordinate),
      });

      marker.setStyle(
        new Style({
          image: new Icon({
            src: "https://cdn-icons-png.flaticon.com/512/684/684908.png", // icon marker
            scale: 0.05,
            anchor: [0.5, 1],
          }),
        })
      );

      vectorSourceRef.current.addFeature(marker);
    });

    mapRef.current = map;

    // ensure proper sizing after container becomes visible
    setTimeout(() => map.updateSize(), 0);

    return () => {
      if (mapRef.current) {
        mapRef.current.setTarget(undefined);
        mapRef.current = null;
      }
    };
  }, [showLocationInput, selectedImages]);

  // Update size whenever the location input is toggled visible
  useEffect(() => {
    if (showLocationInput && mapRef.current) {
      mapRef.current.updateSize();
    }
  }, [showLocationInput]);


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
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${selectedImages.length > 0
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    <div>
                      <Label htmlFor="latitude" className="text-sm font-medium">
                        Latitude
                      </Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        placeholder="-6.175392"
                        value={currentLocation?.lat ?? ""}
                        onChange={(e) => {
                          const lat = e.target.value === "" ? null : parseFloat(e.target.value)
                          setCurrentLocation((prev) => ({
                            lat: lat ?? 0,
                            lng: prev?.lng ?? 0,
                          }))
                        }}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="longitude" className="text-sm font-medium">
                        Longitude
                      </Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        placeholder="106.827153"
                        value={currentLocation?.lng ?? ""}
                        onChange={(e) => {
                          const lng = e.target.value === "" ? null : parseFloat(e.target.value)
                          setCurrentLocation((prev) => ({
                            lat: prev?.lat ?? 0,
                            lng: lng ?? 0,
                          }))
                        }}
                        className="bg-white"
                      />
                    </div>

                  </div>
                  <div ref={mapElement} style={{ width: "100%", height: "40vh" }} />

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
