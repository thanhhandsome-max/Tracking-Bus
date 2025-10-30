"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
<<<<<<< HEAD
import { apiClient } from '@/lib/api'

// Type Bus (chuẩn hóa field dùng cho form)
=======
import { apiClient } from "@/lib/api"

type UIStatus = "active" | "maintenance" | "inactive"
type BEStatus = "hoat_dong" | "bao_tri" | "ngung_hoat_dong"

const UI_TO_BE: Record<UIStatus, BEStatus> = {
  active: "hoat_dong",
  maintenance: "bao_tri",
  inactive: "ngung_hoat_dong",
}

const BE_TO_UI: Record<BEStatus, UIStatus> = {
  hoat_dong: "active",
  bao_tri: "maintenance",
  ngung_hoat_dong: "inactive",
}

>>>>>>> origin/VThang
type Bus = {
  id?: string | number
  // FE naming
  plateNumber?: string
  capacity?: number
<<<<<<< HEAD
  trangThai?: string
  status?: string
  model?: string
=======
  status?: UIStatus
  model?: string
  // BE naming
  bienSoXe?: string
  sucChua?: number
  trangThai?: BEStatus
  dongXe?: string
>>>>>>> origin/VThang
}

// Props form chuẩn
interface BusFormProps {
  onClose: () => void
<<<<<<< HEAD
  onSuccess?: () => void
  initialBus?: Bus | null
  mode?: 'edit' | 'create'
=======
  mode?: "create" | "edit"
  initialBus?: Bus | null
>>>>>>> origin/VThang
  onCreated?: (bus: any) => void
  onUpdated?: (bus: any) => void
}

<<<<<<< HEAD
export function BusForm({ onClose, onSuccess, initialBus, mode = 'create', onCreated, onUpdated }: BusFormProps) {
  const [plateNumber, setPlateNumber] = useState(initialBus?.plateNumber || initialBus?.bienSoXe || "")
  const [model, setModel] = useState(initialBus?.model || "")
  const [capacity, setCapacity] = useState(
    initialBus?.capacity?.toString() ||
    initialBus?.sucChua?.toString() ||
    ""
  )
  const [status, setStatus] = useState(
    initialBus?.status === 'hoat_dong' || initialBus?.status === 'active' ? 'active'
      : initialBus?.status === 'bao_tri' || initialBus?.status === 'maintenance' ? 'maintenance'
      : initialBus?.status === 'ngung_hoat_dong' || initialBus?.status === 'inactive' ? 'inactive'
      : initialBus?.trangThai === 'hoat_dong' ? 'active'
      : initialBus?.trangThai === 'bao_tri' ? 'maintenance'
      : initialBus?.trangThai === 'ngung_hoat_dong' ? 'inactive'
      : 'active'
  )
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
=======
function deriveUIStatus(bus?: Bus | null): UIStatus {
  if (!bus) return "active"
  if (bus.status) return bus.status as UIStatus
  if (bus.trangThai) return BE_TO_UI[bus.trangThai]
  return "active"
}

function BusForm({ onClose, mode = "create", initialBus = null, onCreated, onUpdated }: BusFormProps) {
  const { toast } = useToast()

  const [plateNumber, setPlateNumber] = useState<string>(
    (initialBus?.bienSoXe as string) || (initialBus?.plateNumber as string) || ""
  )
  const [capacity, setCapacity] = useState<string>(
    initialBus?.sucChua != null
      ? String(initialBus.sucChua)
      : initialBus?.capacity != null
      ? String(initialBus.capacity)
      : ""
  )
  const [model, setModel] = useState<string>(
    (initialBus?.dongXe as string) || (initialBus?.model as string) || ""
  )
  const [status, setStatus] = useState<UIStatus>(deriveUIStatus(initialBus))
  const [submitting, setSubmitting] = useState(false)
>>>>>>> origin/VThang

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedPlate = plateNumber.trim()
    const numCapacity = Number(capacity)

    if (!trimmedPlate || !Number.isFinite(numCapacity) || numCapacity <= 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập biển số và sức chứa hợp lệ",
        variant: "destructive",
      })
      return
    }
<<<<<<< HEAD
    setSubmitting(true)
    try {
      let beStatus = status
      if (status === 'active') beStatus = 'hoat_dong'
      else if (status === 'maintenance') beStatus = 'bao_tri'
      else if (status === 'inactive') beStatus = 'ngung_hoat_dong'
      if (mode === 'edit' && initialBus && initialBus.id !== undefined) {
        await apiClient.updateBus(initialBus.id, {
          bienSoXe: plateNumber,
          dongXe: model,
          sucChua: parseInt(capacity, 10),
          trangThai: beStatus
        })
        toast({ title: "Cập nhật thành công", description: "Thông tin xe đã được lưu" })
        onUpdated?.(initialBus)
      } else if (mode !== 'edit') {
        await apiClient.createBus({
          bienSoXe: plateNumber,
          dongXe: model,
          sucChua: parseInt(capacity, 10),
          trangThai: beStatus
        })
        toast({ title: "Thành công", description: "Đã thêm xe buýt mới" })
        onCreated?.({ plateNumber, model, capacity, beStatus })
      }
      if (onSuccess) onSuccess()
    } catch (err: any) {
      toast({ title: "Lỗi", description: err?.message || "Thao tác thất bại", variant: "destructive" })
    } finally {
      setSubmitting(false)
      onClose()
=======

    const payload = {
      bienSoXe: trimmedPlate,
      dongXe: model?.trim() || undefined,
      sucChua: numCapacity,
      trangThai: UI_TO_BE[status],
    } as const

    try {
      setSubmitting(true)

      if (mode === "edit" && initialBus?.id != null) {
        const res = await apiClient.updateBus(initialBus.id, payload)
        const updated = (res as any)?.data ?? res
        toast({ title: "Thành công", description: "Đã cập nhật xe buýt" })
        onUpdated?.(updated)
        onClose()
      } else {
        const res = await apiClient.createBus(payload)
        const created = (res as any)?.data ?? res
        toast({ title: "Thành công", description: "Đã thêm xe buýt mới" })
        onCreated?.(created)
        onClose()
      }
    } catch (err: any) {
      toast({
        title: "Không thành công",
        description: err?.message || "Có lỗi xảy ra khi lưu dữ liệu",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
>>>>>>> origin/VThang
    }
  }

  const submitText = mode === "edit" ? (submitting ? "Đang lưu..." : "Lưu thay đổi") : submitting ? "Đang lưu..." : "Thêm xe buýt"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            min={1}
            placeholder="45"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="model">Dòng xe</Label>
        <Input
          id="model"
          placeholder="Hyundai County"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Trạng thái</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as UIStatus)}>
          <SelectTrigger id="status">
            <SelectValue placeholder="Chọn trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Hoạt động</SelectItem>
            <SelectItem value="maintenance">Bảo trì</SelectItem>
            <SelectItem value="inactive">Ngưng hoạt động</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-3 pt-4">
<<<<<<< HEAD
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Hủy</Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={submitting}>{mode === 'edit' ? 'Lưu thay đổi' : 'Thêm xe buýt'}</Button>
=======
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Hủy
        </Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={submitting}>
          {submitText}
        </Button>
>>>>>>> origin/VThang
      </div>
    </form>
  )
}
<<<<<<< HEAD
=======

export { BusForm }
export default BusForm
>>>>>>> origin/VThang
