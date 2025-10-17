"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface StudentFormProps {
  onClose: () => void
}

export function StudentForm({ onClose }: StudentFormProps) {
  const [studentName, setStudentName] = useState("")
  const [grade, setGrade] = useState("")
  const [parentName, setParentName] = useState("")
  const [parentPhone, setParentPhone] = useState("")
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!studentName || !grade || !parentName || !parentPhone) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ thông tin",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Thành công",
      description: "Đã thêm học sinh mới",
    })

    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="studentName">Tên học sinh *</Label>
          <Input
            id="studentName"
            placeholder="Nguyễn Văn A"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="grade">Lớp *</Label>
          <Input id="grade" placeholder="Lớp 5A" value={grade} onChange={(e) => setGrade(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="parentName">Tên phụ huynh *</Label>
          <Input
            id="parentName"
            placeholder="Nguyễn Văn X"
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="parentPhone">SĐT phụ huynh *</Label>
          <Input
            id="parentPhone"
            placeholder="0901234567"
            value={parentPhone}
            onChange={(e) => setParentPhone(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pickup">Điểm đón</Label>
          <Select>
            <SelectTrigger id="pickup">
              <SelectValue placeholder="Chọn điểm đón" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="point1">Điểm 1 - Quận 1</SelectItem>
              <SelectItem value="point3">Điểm 3 - Quận 3</SelectItem>
              <SelectItem value="point5">Điểm 5 - Quận 5</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dropoff">Điểm trả</Label>
          <Select>
            <SelectTrigger id="dropoff">
              <SelectValue placeholder="Chọn điểm trả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="school">Trường TH ABC</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Hủy
        </Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90">
          Thêm học sinh
        </Button>
      </div>
    </form>
  )
}
