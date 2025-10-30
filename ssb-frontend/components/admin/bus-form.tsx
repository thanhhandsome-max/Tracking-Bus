"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"

type Bus = {
  id?: string | number
  bienSoXe?: string
  plateNumber?: string
  sucChua?: number
  capacity?: number
  trangThai?: string
  status?: string
}

interface BusFormProps {
  onClose: () => void
  onCreated?: (bus: any) => void
  onUpdated?: (bus: any) => void
  mode?: "create" | "edit"
  initialBus?: Bus | null
}

export function BusForm({ onClose, onCreated, onUpdated, mode = "create", initialBus = null }: BusFormProps) {
  const [plateNumber, setPlateNumber] = useState<string>(
    (initialBus?.bienSoXe as string) || (initialBus?.plateNumber as string) || ""
  )
  const [capacity, setCapacity] = useState<string>(
    initialBus?.sucChua !== undefined
      ? String(initialBus?.sucChua)
      : initialBus?.capacity !== undefined
      ? String(initialBus?.capacity)
      : ""
  )
  const [status, setStatus] = useState<string>((initialBus?.trangThai as string) || (initialBus?.status as string) || "active")
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!plateNumber || !capacity) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ thông tin",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        bienSoXe: plateNumber.trim(),
        sucChua: Number(capacity),
        trangThai: status,
      }
      if (mode === "edit" && initialBus?.id != null) {
        const res = await apiClient.updateBus(initialBus.id, payload)
        const updated = (res as any).data || res
        toast({ title: "Thành công", description: "Đã cập nhật xe buýt" })
        onUpdated?.(updated)
        onClose()
      } else {
        const res = await apiClient.createBus(payload)
        const created = (res as any).data || res
        toast({ title: "Thành công", description: "Đã thêm xe buýt mới" })
        onCreated?.(created)
        onClose()
      }
    } catch (err: any) {
      toast({ title: "Không thành công", description: err?.message || "Tạo xe thất bại", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="plateNumber">Biển số xe *</Label>
          <Input
            id="plateNumber"
            placeholder="51A-12345"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="capacity">Sức chứa *</Label>
          <Input
            id="capacity"
            type="number"
            placeholder="45"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Trạng thái</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Hoạt động</SelectItem>
            <SelectItem value="maintenance">Bảo trì</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Hủy
        </Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={submitting}>
          {submitting ? "Đang lưu..." : "Thêm xe buýt"}
        </Button>
      </div>
    </form>
  )
}
