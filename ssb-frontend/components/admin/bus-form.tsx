"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from '@/lib/api'

interface BusFormProps {
  onClose: () => void
  onSuccess?: () => void
  initialBus?: any
  mode?: 'edit' | 'create'
}

export function BusForm({ onClose, onSuccess, initialBus, mode }: BusFormProps) {
  const [plateNumber, setPlateNumber] = useState(initialBus?.plateNumber || "")
  const [model, setModel] = useState(initialBus?.model || "")
  const [capacity, setCapacity] = useState(initialBus?.capacity?.toString() || "")
  const [status, setStatus] = useState(
    initialBus?.status === 'hoat_dong' || initialBus?.status === 'active' ? 'active'
      : initialBus?.status === 'bao_tri' || initialBus?.status === 'maintenance' ? 'maintenance'
      : initialBus?.status === 'ngung_hoat_dong' || initialBus?.status === 'inactive' ? 'inactive' : 'active'
  )
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!plateNumber || !capacity) {
      toast({ title: "Lỗi", description: "Vui lòng nhập đầy đủ thông tin", variant: "destructive" })
      return
    }
    setSubmitting(true)
    try {
      let beStatus = status
      if (status === 'active') beStatus = 'hoat_dong'
      else if (status === 'maintenance') beStatus = 'bao_tri'
      else if (status === 'inactive') beStatus = 'ngung_hoat_dong'
      if (mode === 'edit' && initialBus) {
        await apiClient.updateBus(initialBus.id, {
          bienSoXe: plateNumber,
          dongXe: model,
          sucChua: parseInt(capacity, 10),
          trangThai: beStatus
        })
        toast({ title: "Cập nhật thành công", description: "Thông tin xe đã được lưu" })
      } else {
        await apiClient.createBus({
          bienSoXe: plateNumber,
          dongXe: model,
          sucChua: parseInt(capacity, 10),
          trangThai: beStatus
        })
        toast({ title: "Thành công", description: "Đã thêm xe buýt mới" })
      }
      if (onSuccess) onSuccess()
      else window.location.reload()
    } catch (err: any) {
      toast({ title: "Lỗi", description: err?.message || "Thao tác thất bại", variant: "destructive" })
    } finally {
      setSubmitting(false)
      onClose()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="plateNumber">Biển số xe *</Label>
          <Input id="plateNumber" placeholder="51A-12345" value={plateNumber} onChange={e => setPlateNumber(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity">Sức chứa *</Label>
          <Input id="capacity" type="number" placeholder="45" value={capacity} onChange={e => setCapacity(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="model">Dòng xe</Label>
        <Input id="model" placeholder="Hyundai County" value={model} onChange={e => setModel(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Trạng thái</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger id="status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Hoạt động</SelectItem>
            <SelectItem value="maintenance">Bảo trì</SelectItem>
            <SelectItem value="inactive">Ngưng hoạt động</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Hủy</Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={submitting}>{mode === 'edit' ? 'Lưu thay đổi' : 'Thêm xe buýt'}</Button>
      </div>
    </form>
  )
}

