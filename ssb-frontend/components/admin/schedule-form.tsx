"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, AlertTriangle, Users, MapPin, X, Zap } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

interface ScheduleFormProps {
  onClose: () => void
  onSaved?: (schedule: any) => void
  mode?: "create" | "edit"
  initialSchedule?: any
}

export function ScheduleForm({ onClose, onSaved, mode = "create", initialSchedule }: ScheduleFormProps) {
  const [date, setDate] = useState<Date>()
  const [route, setRoute] = useState("")
  const [bus, setBus] = useState("")
  const [driver, setDriver] = useState("")
  const [tripType, setTripType] = useState("")
  const [startTime, setStartTime] = useState("")
  const [routes, setRoutes] = useState<any[]>([])
  const [buses, setBuses] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [routeStops, setRouteStops] = useState<any[]>([])
  const [availableStudents, setAvailableStudents] = useState<any[]>([])
  const [selectedStudents, setSelectedStudents] = useState<Record<number, { maHocSinh: number; thuTuDiem: number; maDiem: number; source: 'suggestion' | 'manual' }>>({})
  const [loadingStops, setLoadingStops] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [conflictError, setConflictError] = useState<{
    message: string
    conflicts: Array<{
      scheduleId: number
      conflictType: 'bus' | 'driver' | 'both'
      bus: string
      driver: string
      time: string
      date: string
    }>
  } | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [r, b, d] = await Promise.all([
          apiClient.getRoutes({ limit: 100 }),
          apiClient.getBuses({ limit: 100 }),
          apiClient.getDrivers({ limit: 100 }),
        ])
        const rItems = ((r as any).data && Array.isArray((r as any).data) ? (r as any).data : (r as any).data?.data) || []
        const bItems = ((b as any).data && Array.isArray((b as any).data) ? (b as any).data : (b as any).data?.data) || []
        const dItems = ((d as any).data && Array.isArray((d as any).data) ? (d as any).data : (d as any).data?.data) || []
        if (mounted) {
          setRoutes(rItems)
          setBuses(bItems)
          setDrivers(dItems)
        }
      } catch (e) {
        console.error(e)
      }
    })()
    return () => { mounted = false }
  }, [])

  // Load route stops and suggestions when route is selected
  useEffect(() => {
    if (route) {
      setLoadingStops(true)
      
      // Load route stops
      const loadStops = apiClient.getRouteStops(parseInt(route))
        .then((res: any) => {
          const stops = (res as any).data || []
          const sortedStops = stops.sort((a: any, b: any) => (a.sequence || 0) - (b.sequence || 0))
          setRouteStops(sortedStops)
          return sortedStops
        })
        .catch((err: any) => {
          console.error("Failed to load route stops:", err)
          setRouteStops([])
          return []
        })

      // Load stop suggestions (if available)
      const loadSuggestions = apiClient.getRouteStopSuggestions(parseInt(route))
        .then((res: any) => {
          const data = (res as any).data || {}
          const stopsWithSuggestions = data.stops || []
          
          console.log("[ScheduleForm] Loaded stop suggestions:", {
            totalStops: stopsWithSuggestions.length,
            totalStudents: data.totalStudents || 0,
          })

          // Auto-populate selectedStudents từ suggestions nếu chưa có assignments
          // Sử dụng functional update để tránh dependency issue
          setSelectedStudents((current) => {
            if (stopsWithSuggestions.length > 0 && Object.keys(current).length === 0) {
            const suggestions: Record<number, { maHocSinh: number; thuTuDiem: number; maDiem: number; source: 'suggestion' | 'manual' }> = {}
            
            stopsWithSuggestions.forEach((stop: any) => {
              if (stop.students && Array.isArray(stop.students) && stop.students.length > 0) {
                stop.students.forEach((student: any) => {
                  suggestions[student.maHocSinh] = {
                    maHocSinh: student.maHocSinh,
                    thuTuDiem: stop.sequence,
                    maDiem: stop.maDiem,
                    source: 'suggestion', // Đánh dấu là từ suggestion
                  }
                })
              }
            })

              if (Object.keys(suggestions).length > 0) {
                console.log("[ScheduleForm] Auto-populating from suggestions:", Object.keys(suggestions).length, "students")
                
                toast({
                  title: "Đã tải gợi ý",
                  description: `Đã tự động gán ${Object.keys(suggestions).length} học sinh từ gợi ý. Bạn có thể chỉnh sửa trước khi lưu.`,
                })
                
                return suggestions
              }
            }
            return current
          })

          return stopsWithSuggestions
        })
        .catch((err: any) => {
          // Không bắt buộc phải có suggestions, chỉ log warning
          console.warn("[ScheduleForm] No stop suggestions available (this is OK if route was created manually):", err)
          return []
        })

      // Wait for both to complete
      Promise.all([loadStops, loadSuggestions])
        .finally(() => setLoadingStops(false))
    } else {
      setRouteStops([])
    }
  }, [route])

  // Load available students
  useEffect(() => {
    setLoadingStudents(true)
    // Backend giới hạn limit từ 1-100, nên dùng 100 và có thể cần gọi nhiều lần nếu có > 100 học sinh
    apiClient.getStudents({ limit: 100 })
      .then((res: any) => {
        const data = (res as any).data || []
        const items = Array.isArray(data) ? data : data?.data || []
        setAvailableStudents(items)
        // TODO: Nếu có pagination và cần load thêm, có thể gọi thêm các page tiếp theo
      })
      .catch((err: any) => {
        console.error("Failed to load students:", err)
        setAvailableStudents([])
      })
      .finally(() => setLoadingStudents(false))
  }, [])

  // Load existing students when editing
  useEffect(() => {
    if (mode === "edit" && initialSchedule?.id) {
      apiClient.getScheduleStudents(initialSchedule.id)
        .then((res: any) => {
          const data = (res as any).data || {}
          const studentsByStop = data.studentsByStop || []
          const existing: Record<number, { maHocSinh: number; thuTuDiem: number; maDiem: number; source: 'suggestion' | 'manual' }> = {}
          studentsByStop.forEach((stop: any) => {
            stop.students.forEach((student: any) => {
              existing[student.maHocSinh] = {
                maHocSinh: student.maHocSinh,
                thuTuDiem: stop.thuTuDiem,
                maDiem: stop.maDiem,
                source: 'manual', // Khi edit, coi như manual (không biết được source gốc)
              }
            })
          })
          setSelectedStudents(existing)
        })
        .catch((err: any) => {
          console.error("Failed to load schedule students:", err)
        })
    }
  }, [mode, initialSchedule])

  // Tính khoảng cách giữa 2 điểm (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371 // Radius of Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance in km
  }

  // Tính điểm matching địa chỉ (fallback khi không có tọa độ)
  const calculateAddressMatch = (studentAddr: string, stopName: string, stopAddr: string) => {
    if (!studentAddr || !stopName) return Infinity
    
    // Tách các từ khóa từ tên trạm (ví dụ: "Trạm Nguyễn Văn Linh" -> ["Nguyễn", "Văn", "Linh"])
    const stopKeywords = stopName.replace("Trạm", "").replace("Điểm", "").trim().split(/\s+/).filter(k => k.length > 2)
    
    // Kiểm tra xem địa chỉ học sinh có chứa từ khóa nào không
    let matchCount = 0
    stopKeywords.forEach(keyword => {
      if (keyword.length > 2 && studentAddr.toLowerCase().includes(keyword.toLowerCase())) {
        matchCount++
      }
    })
    
    // Trả về điểm (càng thấp càng tốt, 0 = không match)
    return matchCount > 0 ? 1 / matchCount : Infinity
  }

  // Tự động gán học sinh vào điểm dừng gần nhất
  const handleAutoAssign = () => {
    if (!route || routeStops.length === 0 || availableStudents.length === 0) {
      toast({
        title: "Thông báo",
        description: "Vui lòng chọn tuyến đường và đảm bảo có học sinh",
        variant: "default",
      })
      return
    }

    const newAssignments: Record<number, { maHocSinh: number; thuTuDiem: number; maDiem: number; source: 'suggestion' | 'manual' }> = {}
    
    // Lọc học sinh chưa được gán
    const unassignedStudents = availableStudents.filter(
      (s: any) => !selectedStudents[s.maHocSinh || s.id]
    )

    unassignedStudents.forEach((student: any) => {
      const studentAddress = student.diaChi || ""
      const studentLat = student.viDo || student.lat
      const studentLng = student.kinhDo || student.lng
      
      // Tìm điểm dừng gần nhất
      let nearestStop: any = null
      let minDistance = Infinity

      routeStops.forEach((stop: any) => {
        const stopLat = stop.viDo || stop.lat
        const stopLng = stop.kinhDo || stop.lng
        
        // Nếu có tọa độ cả học sinh và điểm dừng, tính khoảng cách
        if (studentLat && studentLng && stopLat && stopLng && 
            !isNaN(studentLat) && !isNaN(studentLng) && 
            !isNaN(stopLat) && !isNaN(stopLng)) {
          const distance = calculateDistance(
            studentLat,
            studentLng,
            stopLat,
            stopLng
          )
          if (distance < minDistance) {
            minDistance = distance
            nearestStop = stop
          }
        } else {
          // Fallback: Matching theo địa chỉ
          const stopName = stop.tenDiem || stop.name || ""
          const stopAddress = stop.address || stop.diaChi || ""
          
          const matchScore = calculateAddressMatch(studentAddress, stopName, stopAddress)
          if (matchScore < minDistance) {
            minDistance = matchScore
            nearestStop = stop
          }
        }
      })

      if (nearestStop) {
        const studentId = student.maHocSinh || student.id
        newAssignments[studentId] = {
          maHocSinh: studentId,
          thuTuDiem: nearestStop.sequence,
          maDiem: nearestStop.maDiem || nearestStop.id,
          source: 'manual', // Auto-assign từ FE cũng coi là manual
        }
      }
    })

    // Merge với assignments hiện tại (ưu tiên assignments cũ)
    setSelectedStudents({
      ...selectedStudents,
      ...newAssignments,
    })

    toast({
      title: "Thành công",
      description: `Đã tự động gán ${Object.keys(newAssignments).length} học sinh vào điểm dừng`,
    })
  }

  // Populate form when editing or when routeId is provided (wizard mode)
  useEffect(() => {
    if (mode === "edit" && initialSchedule) {
      if (initialSchedule.raw?.ngayChay) {
        const [year, month, day] = initialSchedule.raw.ngayChay.split('-')
        setDate(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)))
      }
      setRoute(String(initialSchedule.routeId || initialSchedule.raw?.maTuyen || initialSchedule.maTuyen || ''))
      setBus(String(initialSchedule.busId || initialSchedule.raw?.maXe || ''))
      setDriver(String(initialSchedule.driverId || initialSchedule.raw?.maTaiXe || ''))
      setTripType(initialSchedule.tripType || initialSchedule.raw?.loaiChuyen || '')
      setStartTime(initialSchedule.startTime || initialSchedule.raw?.gioKhoiHanh || '')
    } else if (mode === "create" && initialSchedule?.routeId) {
      // Pre-fill routeId in wizard mode
      setRoute(String(initialSchedule.routeId || initialSchedule.maTuyen || ''))
    }
  }, [mode, initialSchedule])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!date || !route || !bus || !driver || !tripType || !startTime) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ thông tin",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      setConflictError(null) // Clear previous conflicts
      
      // Format date correctly without timezone conversion
      const yyyy = date.getFullYear()
      const mm = `${date.getMonth() + 1}`.padStart(2, '0')
      const dd = `${date.getDate()}`.padStart(2, '0')
      const ngayChay = `${yyyy}-${mm}-${dd}`
      
      // Build students array from selectedStudents (loại bỏ source, chỉ gửi maHocSinh, thuTuDiem, maDiem)
      const studentsArray = Object.values(selectedStudents).map(s => ({
        maHocSinh: s.maHocSinh,
        thuTuDiem: s.thuTuDiem,
        maDiem: s.maDiem,
      }))
      
      console.log("[ScheduleForm] Submitting schedule with students:", {
        studentsCount: studentsArray.length,
        students: studentsArray.slice(0, 3),
        selectedStudentsKeys: Object.keys(selectedStudents).length,
        suggestionsCount: Object.values(selectedStudents).filter(s => s.source === 'suggestion').length,
        manualCount: Object.values(selectedStudents).filter(s => s.source === 'manual').length,
      })
      
      // 🔥 TASK 3: Luôn gửi students[] (kể cả rỗng) để backend không phải auto-assign
      const payload = {
        maTuyen: parseInt(route),
        maXe: parseInt(bus),
        maTaiXe: parseInt(driver),
        loaiChuyen: tripType,
        gioKhoiHanh: startTime,
        ngayChay: ngayChay,
        dangApDung: true,
        students: studentsArray, // Luôn gửi, kể cả rỗng
      }
      
      console.log("[ScheduleForm] Payload:", {
        ...payload,
        students: payload.students ? `${payload.students.length} students` : 'none',
      })
      
      if (mode === "edit" && initialSchedule?.id) {
        const response = await apiClient.updateSchedule(initialSchedule.id, payload)
        toast({ title: "Thành công", description: "Đã cập nhật lịch trình" })
        if (onSaved && response.data) {
          onSaved(response.data)
        }
        onClose()
      } else {
        try {
          const response = await apiClient.createSchedule(payload)
          toast({ title: "Thành công", description: "Đã tạo lịch trình mới" })
          if (onSaved && response.data) {
            onSaved(response.data)
          }
          onClose()
        } catch (createErr: any) {
          // Re-throw conflict errors để wizard có thể handle
          if (createErr?.status === 409 || createErr?.response?.status === 409 || createErr?.conflict) {
            throw createErr
          }
          throw createErr
        }
      }
    } catch (err: any) {
      // M1-M3: Handle 409 conflict with details
      if (err?.status === 409 || err?.response?.status === 409 || err?.conflict) {
        const conflictData = err?.response?.data || err?.data || err
        const conflicts = conflictData.details?.conflicts || conflictData.conflicts || []
        
        setConflictError({
          message: conflictData.message || "Xung đột lịch trình",
          conflicts: conflicts,
        })
        
        toast({
          title: "Xung đột lịch trình",
          description: "Xe buýt hoặc tài xế đã có lịch trình trùng thời gian",
          variant: "destructive",
        })
        
        // Nếu có onSaved callback, không gọi nó khi có conflict
        // Wizard sẽ handle conflict error riêng
      } else if (err?.status === 400 || err?.response?.status === 400) {
        // 🔥 Handle validation errors (INVALID_STUDENT_ASSIGNMENT)
        const errorData = err?.response?.data || err?.data || err
        const validationErrors = errorData?.details?.errors || errorData?.errors || []
        
        if (validationErrors.length > 0) {
          const errorMessages = validationErrors.map((e: any) => e.message || e).join('\n')
          toast({
            title: "Lỗi phân công học sinh",
            description: errorMessages,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Lỗi validation",
            description: errorData?.message || "Dữ liệu không hợp lệ",
            variant: "destructive",
          })
        }
      } else {
        toast({ 
          title: "Không thành công", 
          description: err?.message || (mode === "edit" ? "Cập nhật lịch thất bại" : "Tạo lịch thất bại"), 
          variant: "destructive" 
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* M1-M3: Conflict Error Banner */}
      {conflictError && conflictError.conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Xung đột lịch trình</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-2">{conflictError.message}</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {conflictError.conflicts.map((conflict, idx) => (
                <li key={idx}>
                  {conflict.conflictType === 'bus' && (
                    <>Xe <strong>{conflict.bus}</strong> đã có lịch trình vào {conflict.time} ngày {conflict.date}</>
                  )}
                  {conflict.conflictType === 'driver' && (
                    <>Tài xế <strong>{conflict.driver}</strong> đã có lịch trình vào {conflict.time} ngày {conflict.date}</>
                  )}
                  {conflict.conflictType === 'both' && (
                    <>Xe <strong>{conflict.bus}</strong> và tài xế <strong>{conflict.driver}</strong> đã có lịch trình vào {conflict.time} ngày {conflict.date}</>
                  )}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label>Ngày chạy *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP", { locale: vi }) : "Chọn ngày"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="route">Tuyến đường *</Label>
        <Select value={route} onValueChange={setRoute}>
          <SelectTrigger id="route">
            <SelectValue placeholder="Chọn tuyến" />
          </SelectTrigger>
          <SelectContent>
            {routes.map((r: any) => (
              <SelectItem key={r.maTuyen || r.id || r._id} value={String(r.maTuyen || r.id || r._id)}>
                {r.tenTuyen || r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bus">Xe buýt *</Label>
          <Select value={bus} onValueChange={setBus}>
            <SelectTrigger id="bus">
              <SelectValue placeholder="Chọn xe" />
            </SelectTrigger>
            <SelectContent>
              {buses.map((b: any) => (
                <SelectItem key={b.maXe || b.id || b._id} value={String(b.maXe || b.id || b._id)}>
                  {b.bienSoXe || b.plateNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="driver">Tài xế *</Label>
          <Select value={driver} onValueChange={setDriver}>
            <SelectTrigger id="driver">
              <SelectValue placeholder="Chọn tài xế" />
            </SelectTrigger>
            <SelectContent>
              {drivers.map((d: any) => (
                <SelectItem key={d.maTaiXe || d.id || d._id} value={String(d.maTaiXe || d.id || d._id)}>
                  {d.hoTen || d.ten || d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tripType">Loại chuyến *</Label>
        <Select value={tripType} onValueChange={setTripType}>
          <SelectTrigger id="tripType">
            <SelectValue placeholder="Chọn loại chuyến" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="don_sang">Đón sáng</SelectItem>
            <SelectItem value="tra_chieu">Trả chiều</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="startTime">Giờ khởi hành *</Label>
        <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
      </div>

      {/* Student Assignment Section */}
      {route && routeStops.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Phân công học sinh vào điểm dừng
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoAssign}
                disabled={loadingStops || loadingStudents || availableStudents.length === 0}
              >
                <Zap className="w-4 h-4 mr-2" />
                Tự động gán
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingStops ? (
              <p className="text-sm text-muted-foreground">Đang tải danh sách điểm dừng...</p>
            ) : (
              routeStops.map((stop: any) => {
                const stopStudents = Object.values(selectedStudents).filter(
                  (s) => s.thuTuDiem === stop.sequence && s.maDiem === stop.maDiem
                )
                const availableForStop = availableStudents.filter(
                  (student: any) => !selectedStudents[student.maHocSinh || student.id]
                )

                return (
                  <div key={`${stop.sequence}_${stop.maDiem}`} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <div>
                          <p className="font-medium">
                            Điểm {stop.sequence}: {stop.tenDiem || stop.name}
                          </p>
                          {stop.address && (
                            <p className="text-xs text-muted-foreground">{stop.address}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {stopStudents.length} học sinh
                      </Badge>
                    </div>

                    {/* Selected students for this stop */}
                    {stopStudents.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm">Học sinh đã chọn:</Label>
                        <div className="flex flex-wrap gap-2">
                          {stopStudents.map((selected) => {
                            const student = availableStudents.find(
                              (s: any) => (s.maHocSinh || s.id) === selected.maHocSinh
                            )
                            if (!student) return null
                            return (
                              <Badge
                                key={selected.maHocSinh}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {student.hoTen || student.name}
                                {/* 🔥 TASK 3: Hiển thị badge phân biệt suggestion vs manual */}
                                {selected.source === 'suggestion' && (
                                  <Badge variant="outline" className="ml-1 text-xs px-1 py-0 bg-blue-50 text-blue-700 border-blue-200">
                                    Gợi ý
                                  </Badge>
                                )}
                                {selected.source === 'manual' && (
                                  <Badge variant="outline" className="ml-1 text-xs px-1 py-0 bg-green-50 text-green-700 border-green-200">
                                    Thêm tay
                                  </Badge>
                                )}
                                <X
                                  className="w-3 h-3 cursor-pointer ml-1"
                                  onClick={() => {
                                    const newSelected = { ...selectedStudents }
                                    delete newSelected[selected.maHocSinh]
                                    setSelectedStudents(newSelected)
                                  }}
                                />
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Add student dropdown */}
                    {availableForStop.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm">Thêm học sinh:</Label>
                        <Select
                          onValueChange={(value) => {
                            const studentId = parseInt(value)
                            const student = availableStudents.find(
                              (s: any) => (s.maHocSinh || s.id) === studentId
                            )
                            if (student) {
                              setSelectedStudents({
                                ...selectedStudents,
                                [studentId]: {
                                  maHocSinh: studentId,
                                  thuTuDiem: stop.sequence,
                                  maDiem: stop.maDiem,
                                  source: 'manual', // Đánh dấu là thêm tay
                                },
                              })
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn học sinh..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableForStop.map((student: any) => (
                              <SelectItem
                                key={student.maHocSinh || student.id}
                                value={String(student.maHocSinh || student.id)}
                              >
                                {student.hoTen || student.name} {student.lop ? `(${student.lop})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )
              })
            )}
            {Object.keys(selectedStudents).length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  Tổng cộng: <strong>{Object.keys(selectedStudents).length}</strong> học sinh đã được phân công
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Hủy
        </Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={submitting}>
          {submitting 
            ? "Đang lưu..." 
            : mode === "edit" 
              ? "Cập nhật lịch trình" 
              : "Tạo lịch trình"}
        </Button>
      </div>
    </form>
  )
}
