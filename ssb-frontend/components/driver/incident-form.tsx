"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertTriangle,
  Car,
  Clock,
  MapPin,
  Camera,
  Upload,
  X,
  Zap,
  AlertCircle,
  Construction,
  UserX,
  FileText,
} from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"

interface IncidentFormProps {
  onClose: () => void
  tripId: string
}

const incidentCategories = [
  {
    value: "traffic",
    label: "Kẹt xe",
    icon: Car,
    description: "Tắc đường, ùn tắc giao thông",
    color: "text-warning",
  },
  {
    value: "breakdown",
    label: "Hỏng xe",
    icon: Construction,
    description: "Sự cố kỹ thuật, hư hỏng xe",
    color: "text-destructive",
  },
  {
    value: "accident",
    label: "Tai nạn",
    icon: AlertCircle,
    description: "Va chạm, tai nạn giao thông",
    color: "text-destructive",
  },
  {
    value: "student",
    label: "Học sinh",
    icon: UserX,
    description: "Vấn đề liên quan đến học sinh",
    color: "text-warning",
  },
  {
    value: "weather",
    label: "Thời tiết",
    icon: Zap,
    description: "Mưa lớn, thời tiết xấu",
    color: "text-info",
  },
  {
    value: "other",
    label: "Khác",
    icon: FileText,
    description: "Sự cố khác",
    color: "text-muted-foreground",
  },
]

const quickTemplates = [
  { label: "Kẹt xe nghiêm trọng", description: "Đường đang bị tắc nghẽn, dự kiến chậm 15-20 phút" },
  { label: "Xe hỏng nhẹ", description: "Xe gặp sự cố kỹ thuật nhỏ, đang xử lý" },
  { label: "Học sinh không đến", description: "Học sinh không có mặt tại điểm đón" },
  { label: "Thời tiết xấu", description: "Mưa lớn, di chuyển chậm hơn dự kiến" },
]

export function IncidentForm({ onClose, tripId }: IncidentFormProps) {
  const [type, setType] = useState("")
  const [severity, setSeverity] = useState("medium")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("Đang lấy vị trí...")
  const [affectedStudents, setAffectedStudents] = useState<string[]>([])
  const [witnessName, setWitnessName] = useState("")
  const [witnessPhone, setWitnessPhone] = useState("")
  const [photos, setPhotos] = useState<File[]>([])
  const { toast } = useToast()

  useState(() => {
    setTimeout(() => {
      setLocation("456 Lê Lợi, Quận 1, TP.HCM")
    }, 1000)
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!type || !description) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ thông tin",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Đã gửi báo cáo",
      description: "Admin sẽ nhận được thông báo ngay lập tức",
    })

    onClose()
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files)
      setPhotos([...photos, ...newPhotos])
    }
  }

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
  }

  const handleUseTemplate = (template: (typeof quickTemplates)[0]) => {
    setDescription(template.description)
  }

  const selectedCategory = incidentCategories.find((cat) => cat.value === type)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-border/50 bg-muted/30">
        <CardContent className="pt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Vị trí:</span>
            <span className="font-medium text-foreground">{location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Thời gian:</span>
            <span className="font-medium text-foreground">{new Date().toLocaleString("vi-VN")}</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label>Loại sự cố *</Label>
        <div className="grid grid-cols-2 gap-3">
          {incidentCategories.map((category) => {
            const Icon = category.icon
            return (
              <Card
                key={category.value}
                className={`cursor-pointer transition-all border-2 ${
                  type === category.value ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50"
                }`}
                onClick={() => setType(category.value)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 ${type === category.value ? "text-primary" : category.color}`} />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">{category.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{category.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Mức độ nghiêm trọng *</Label>
        <RadioGroup value={severity} onValueChange={setSeverity} className="grid grid-cols-4 gap-3">
          <div>
            <RadioGroupItem value="low" id="low" className="peer sr-only" />
            <Label
              htmlFor="low"
              className="flex flex-col items-center justify-center rounded-lg border-2 border-border/50 bg-background p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-success peer-data-[state=checked]:bg-success/5 cursor-pointer"
            >
              <span className="text-sm font-medium">Thấp</span>
            </Label>
          </div>
          <div>
            <RadioGroupItem value="medium" id="medium" className="peer sr-only" />
            <Label
              htmlFor="medium"
              className="flex flex-col items-center justify-center rounded-lg border-2 border-border/50 bg-background p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-info peer-data-[state=checked]:bg-info/5 cursor-pointer"
            >
              <span className="text-sm font-medium">Trung bình</span>
            </Label>
          </div>
          <div>
            <RadioGroupItem value="high" id="high" className="peer sr-only" />
            <Label
              htmlFor="high"
              className="flex flex-col items-center justify-center rounded-lg border-2 border-border/50 bg-background p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-warning peer-data-[state=checked]:bg-warning/5 cursor-pointer"
            >
              <span className="text-sm font-medium">Cao</span>
            </Label>
          </div>
          <div>
            <RadioGroupItem value="critical" id="critical" className="peer sr-only" />
            <Label
              htmlFor="critical"
              className="flex flex-col items-center justify-center rounded-lg border-2 border-border/50 bg-background p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-destructive peer-data-[state=checked]:bg-destructive/5 cursor-pointer"
            >
              <span className="text-sm font-medium">Nghiêm trọng</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>Mẫu nhanh (tùy chọn)</Label>
        <div className="grid grid-cols-2 gap-2">
          {quickTemplates.map((template, index) => (
            <Button
              key={index}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleUseTemplate(template)}
              className="justify-start text-left h-auto py-2 bg-transparent"
            >
              <div>
                <p className="text-xs font-medium">{template.label}</p>
                <p className="text-xs text-muted-foreground">{template.description.substring(0, 30)}...</p>
              </div>
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả chi tiết *</Label>
        <Textarea
          id="description"
          placeholder="Mô tả tình huống đang gặp phải..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
        />
      </div>

      <div className="space-y-2">
        <Label>Hình ảnh (tùy chọn)</Label>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("photo-upload")?.click()}
              className="bg-transparent"
            >
              <Camera className="w-4 h-4 mr-2" />
              Chụp ảnh
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("photo-upload")?.click()}
              className="bg-transparent"
            >
              <Upload className="w-4 h-4 mr-2" />
              Tải ảnh lên
            </Button>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(photo) || "/placeholder.svg"}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemovePhoto(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Học sinh liên quan (nếu có)</Label>
        <Card className="border-border/50">
          <CardContent className="pt-4 space-y-2">
            {["Nguyễn Văn A", "Trần Thị B", "Lê Văn C"].map((student) => (
              <div key={student} className="flex items-center gap-2">
                <Checkbox
                  id={student}
                  checked={affectedStudents.includes(student)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setAffectedStudents([...affectedStudents, student])
                    } else {
                      setAffectedStudents(affectedStudents.filter((s) => s !== student))
                    }
                  }}
                />
                <Label htmlFor={student} className="text-sm font-normal cursor-pointer">
                  {student}
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <Label>Thông tin nhân chứng (nếu có)</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Input placeholder="Tên nhân chứng" value={witnessName} onChange={(e) => setWitnessName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Input placeholder="Số điện thoại" value={witnessPhone} onChange={(e) => setWitnessPhone(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-2">
          <AlertTriangle
            className={`w-5 h-5 ${
              severity === "critical"
                ? "text-destructive"
                : severity === "high"
                  ? "text-warning"
                  : severity === "medium"
                    ? "text-info"
                    : "text-success"
            }`}
          />
          <span className="text-sm text-muted-foreground">
            Mức độ:{" "}
            <span className="font-medium text-foreground capitalize">
              {severity === "low"
                ? "Thấp"
                : severity === "medium"
                  ? "Trung bình"
                  : severity === "high"
                    ? "Cao"
                    : "Nghiêm trọng"}
            </span>
          </span>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
            Gửi báo cáo
          </Button>
        </div>
      </div>
    </form>
  )
}
