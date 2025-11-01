"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Plus, Trash2, GripVertical, MapPin, Navigation, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"
import { Badge } from "@/components/ui/badge"

type Route = { id?: string | number; name: string; stops?: any[] }

interface Stop {
  id: string
  name: string
  address: string
  estimatedTime: string
  latitude?: string
  longitude?: string
}

interface RouteFormProps {
  onClose: () => void
  onCreated?: (route?: Route) => void
  onUpdated?: (route?: Route) => void
  mode?: "create" | "edit"
  initial?: Partial<Route>
}

export function RouteForm({ onClose, onCreated, onUpdated, mode = "create", initial }: RouteFormProps) {
  const [routeName, setRouteName] = useState(String((initial as any)?.tenTuyen || (initial as any)?.name || ""))
  const [diemBatDau, setDiemBatDau] = useState(String((initial as any)?.diemBatDau || ""))
  const [diemKetThuc, setDiemKetThuc] = useState(String((initial as any)?.diemKetThuc || ""))
  const [stops, setStops] = useState<Stop[]>(
    Array.isArray((initial as any)?.stops) && (initial as any)?.stops.length > 0
      ? ((initial as any)?.stops || []).map((s: any, idx: number) => ({
          id: String(s.maDiem || s.id || idx + 1),
          name: s.tenDiem || s.tenDiemDung || s.name || "",
          address: s.diaChi || s.address || "",
          estimatedTime: s.thoiGianDung || s.estimatedTime || "",
          latitude: String(s.viDo || s.latitude || ""),
          longitude: String(s.kinhDo || s.longitude || ""),
        }))
      : [{ id: "1", name: "", address: "", estimatedTime: "", latitude: "", longitude: "" }]
  )
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const addStop = () => {
    setStops([...stops, { id: Date.now().toString(), name: "", address: "", estimatedTime: "", latitude: "", longitude: "" }])
  }

  const removeStop = (id: string) => {
    if (stops.length <= 1) {
      toast({
        title: "Không thể xóa",
        description: "Tuyến đường cần ít nhất một điểm dừng",
        variant: "destructive",
      })
      return
    }
    setStops(stops.filter((stop) => stop.id !== id))
  }

  const updateStop = (id: string, field: keyof Stop, value: string) => {
    setStops(stops.map((stop) => (stop.id === id ? { ...stop, [field]: value } : stop)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!routeName.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên tuyến",
        variant: "destructive",
      })
      return
    }

    const validStops = stops.filter((s) => s.name.trim())
    if (validStops.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng thêm ít nhất một điểm dừng",
        variant: "destructive",
      })
      return
    }

    // Validate GPS coordinates if provided
    for (const stop of validStops) {
      if (stop.latitude && stop.longitude) {
        const lat = parseFloat(stop.latitude)
        const lng = parseFloat(stop.longitude)
        if (isNaN(lat) || lat < -90 || lat > 90) {
          toast({
            title: "Lỗi",
            description: `Vĩ độ không hợp lệ tại điểm "${stop.name}"`,
            variant: "destructive",
          })
          return
        }
        if (isNaN(lng) || lng < -180 || lng > 180) {
          toast({
            title: "Lỗi",
            description: `Kinh độ không hợp lệ tại điểm "${stop.name}"`,
            variant: "destructive",
          })
          return
        }
      }
    }

    try {
      setSubmitting(true)

      // Prepare route data
      const routePayload: any = {
        tenTuyen: routeName.trim(),
      }

      if (diemBatDau.trim()) routePayload.diemBatDau = diemBatDau.trim()
      if (diemKetThuc.trim()) routePayload.diemKetThuc = diemKetThuc.trim()

      if (mode === "edit" && initial?.id != null) {
        // Update existing route
        await apiClient.updateRoute(initial.id as any, routePayload)

        // Update stops
        const routeId = initial.id
        const existingStops = await apiClient.getRouteStops(routeId)
        const existingStopsData = (existingStops as any).data || []

        // For now, just update the route info
        // In production, you might want to add/update/delete stops separately
        toast({
          title: "Thành công",
          description: "Đã cập nhật tuyến đường",
        })
        onUpdated?.()
        onClose()
      } else {
        // Create new route
        const result = await apiClient.createRoute(routePayload)
        const newRouteId = (result as any).data?.maTuyen || (result as any).data?.id

        if (newRouteId && validStops.length > 0) {
          // Create stops for the new route
          const stopsPayload = validStops.map((stop, idx) => ({
            tenDiem: stop.name.trim(),
            diaChi: stop.address.trim() || undefined,
            kinhDo: stop.longitude ? parseFloat(stop.longitude) : undefined,
            viDo: stop.latitude ? parseFloat(stop.latitude) : undefined,
            thuTu: idx + 1,
            thoiGianDung: stop.estimatedTime || undefined,
          }))

          // Add stops one by one
          for (const stopPayload of stopsPayload) {
            if (stopPayload.tenDiem && stopPayload.kinhDo && stopPayload.viDo) {
              try {
                await apiClient.addRouteStop(newRouteId, stopPayload)
              } catch (err) {
                console.error("Lỗi khi thêm điểm dừng:", err)
              }
            }
          }
        }

        toast({
          title: "Thành công",
          description: "Đã thêm tuyến đường mới",
        })
        onCreated?.()
        onClose()
      }
    } catch (err: any) {
      console.error("Lỗi:", err)
      toast({
        title: "Không thành công",
        description: err?.message || mode === "edit" ? "Cập nhật tuyến thất bại" : "Tạo tuyến thất bại",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Route Basic Info */}
      <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
        <div className="space-y-2">
          <Label htmlFor="routeName">Tên tuyến *</Label>
          <Input
            id="routeName"
            placeholder="VD: Tuyến 1 - Quận 1 → Quận 7"
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="diemBatDau">Điểm bắt đầu</Label>
            <Input
              id="diemBatDau"
              placeholder="VD: Trường TH ABC"
              value={diemBatDau}
              onChange={(e) => setDiemBatDau(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="diemKetThuc">Điểm kết thúc</Label>
            <Input
              id="diemKetThuc"
              placeholder="VD: Khu dân cư XYZ"
              value={diemKetThuc}
              onChange={(e) => setDiemKetThuc(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stops Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <Label className="text-base">Điểm dừng</Label>
            <Badge variant="outline" className="text-xs">
              {stops.filter((s) => s.name.trim()).length} điểm
            </Badge>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addStop}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm điểm dừng
          </Button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {stops.map((stop, index) => (
            <Card key={stop.id} className="p-4 border-border/50 hover:border-primary/50 transition-colors">
              <div className="flex gap-3">
                <div className="flex items-center">
                  <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary border-2 border-primary/20">
                      {index + 1}
                    </div>
                    <Input
                      placeholder="Tên điểm dừng *"
                      value={stop.name}
                      onChange={(e) => updateStop(stop.id, "name", e.target.value)}
                      className="font-medium"
                    />
                  </div>

                  <Input
                    placeholder="Địa chỉ chi tiết"
                    value={stop.address}
                    onChange={(e) => updateStop(stop.id, "address", e.target.value)}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        Vĩ độ
                      </Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="10.762622"
                        value={stop.latitude}
                        onChange={(e) => updateStop(stop.id, "latitude", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        Kinh độ
                      </Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="106.660172"
                        value={stop.longitude}
                        onChange={(e) => updateStop(stop.id, "longitude", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Thời gian dừng (phút) VD: 2"
                      type="number"
                      min="0"
                      value={stop.estimatedTime}
                      onChange={(e) => updateStop(stop.id, "estimatedTime", e.target.value)}
                      className="w-32"
                    />
                    <span className="text-xs text-muted-foreground">phút</span>
                  </div>
                </div>

                <div className="flex items-start pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStop(stop.id)}
                    disabled={stops.length === 1}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {stops.filter((s) => s.name.trim()).length === 0 && (
          <div className="text-center text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg border border-dashed">
            Chưa có điểm dừng nào. Vui lòng thêm ít nhất một điểm dừng.
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Hủy
        </Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={submitting}>
          {submitting ? "Đang lưu..." : mode === 'edit' ? "Cập nhật tuyến" : "Thêm tuyến đường"}
        </Button>
      </div>
    </form>
  )
}
