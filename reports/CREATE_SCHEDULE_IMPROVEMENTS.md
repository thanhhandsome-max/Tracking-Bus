# Cải tiến Use Case: Create Schedule

**Mục tiêu:** Đạt 100% triển khai Use Case "Create Schedule"  
**Ngày tạo:** 2025-01-XX

---

## 🎯 Tổng quan

Hiện tại Use Case đã được triển khai **~85%**. Tài liệu này liệt kê các cải tiến cần thiết để đạt 100%.

---

## 📋 Danh sách cải tiến

### Priority 1: Critical (Cần triển khai ngay)

#### 1.1. Validation ngày quá khứ

**Mô tả:** Không cho phép tạo lịch trình với ngày chạy là quá khứ.

**Backend:**
```javascript
// File: ssb-backend/src/services/ScheduleService.js
// Location: Trong method create(), sau dòng 88

// Validate ngày chạy không được là quá khứ
const today = new Date();
today.setHours(0, 0, 0, 0);
const scheduleDate = new Date(ngayChay);
scheduleDate.setHours(0, 0, 0, 0);

if (scheduleDate < today) {
  throw new Error("INVALID_DATE_PAST");
}
```

**Controller:**
```javascript
// File: ssb-backend/src/controllers/ScheduleController.js
// Location: Trong catch block, sau dòng 311

if (serviceError.message === "INVALID_DATE_PAST") {
  return response.validationError(res, "Ngày chạy không được là quá khứ", [
    { field: "ngayChay", message: "Ngày chạy phải là hôm nay hoặc tương lai" }
  ]);
}
```

**Frontend:**
```typescript
// File: ssb-frontend/components/admin/schedule-form.tsx
// Location: Trong Calendar component, thêm disabled prop

<Calendar 
  mode="single" 
  selected={date} 
  onSelect={setDate} 
  initialFocus
  disabled={(date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }}
/>
```

**Validation Middleware (Optional):**
```javascript
// File: ssb-backend/src/middlewares/ValidationMiddleware.js
// Location: Trong validateSchedule(), thêm custom validation

ngayChay: Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .required()
  .custom((value, helpers) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduleDate = new Date(value);
    scheduleDate.setHours(0, 0, 0, 0);
    
    if (scheduleDate < today) {
      return helpers.error('date.past');
    }
    return value;
  })
  .messages({
    "string.pattern.base": "Ngày chạy không hợp lệ (VD: 2025-10-31)",
    "any.required": "Ngày chạy là bắt buộc",
    "date.past": "Ngày chạy không được là quá khứ",
  }),
```

---

#### 1.2. Action buttons trong conflict alert

**Mô tả:** Thêm nút "Quay lại chỉnh sửa" và "Hủy tạo lịch trình" trong conflict alert.

**Frontend:**
```typescript
// File: ssb-frontend/components/admin/schedule-form.tsx
// Location: Trong conflict alert (dòng 404-428), thêm buttons

{conflictError && conflictError.conflicts.length > 0 && (
  <Alert variant="destructive">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Xung đột lịch trình</AlertTitle>
    <AlertDescription className="mt-2">
      <p className="mb-2">{conflictError.message}</p>
      <ul className="list-disc list-inside space-y-1 text-sm mb-4">
        {conflictError.conflicts.map((conflict, idx) => (
          <li key={idx}>
            {/* ... existing conflict display ... */}
          </li>
        ))}
      </ul>
      
      {/* 🔥 NEW: Action buttons */}
      <div className="flex gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setConflictError(null);
            // Focus vào field đầu tiên để user có thể chỉnh sửa
            // (có thể thêm ref cho các input fields)
          }}
        >
          Quay lại chỉnh sửa
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            setConflictError(null);
            onClose();
          }}
        >
          Hủy tạo lịch trình
        </Button>
      </div>
    </AlertDescription>
  </Alert>
)}
```

---

### Priority 2: Important (Nên triển khai)

#### 2.1. Confirm dialog khi hủy

**Mô tả:** Hiển thị dialog xác nhận khi user click "Hủy" và form đã có thay đổi.

**Frontend:**
```typescript
// File: ssb-frontend/components/admin/schedule-form.tsx
// Location: Thêm state và logic

const [hasChanges, setHasChanges] = useState(false);

// Track changes
useEffect(() => {
  if (date || route || bus || driver || tripType || startTime) {
    setHasChanges(true);
  }
}, [date, route, bus, driver, tripType, startTime]);

// Update handleCancel
const handleCancel = () => {
  if (hasChanges) {
    if (confirm("Bạn có chắc muốn hủy? Dữ liệu đã nhập sẽ bị mất.")) {
      onClose();
    }
  } else {
    onClose();
  }
};

// Update button
<Button 
  type="button" 
  variant="outline" 
  onClick={handleCancel} 
  disabled={submitting}
>
  Hủy
</Button>
```

**Hoặc sử dụng Dialog component (Better UX):**
```typescript
// File: ssb-frontend/components/admin/schedule-form.tsx
// Location: Thêm state và Dialog

const [showCancelConfirm, setShowCancelConfirm] = useState(false);

const handleCancel = () => {
  if (hasChanges) {
    setShowCancelConfirm(true);
  } else {
    onClose();
  }
};

// Thêm Dialog component
<Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Xác nhận hủy</DialogTitle>
      <DialogDescription>
        Bạn có chắc muốn hủy? Dữ liệu đã nhập sẽ bị mất.
      </DialogDescription>
    </DialogHeader>
    <div className="flex justify-end gap-2 mt-4">
      <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>
        Không
      </Button>
      <Button variant="destructive" onClick={onClose}>
        Có, hủy
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

---

#### 2.2. UI sao chép lịch trình cải tiến

**Mô tả:** Tạo dialog để chọn lịch trình mẫu, sau đó tự động mở form với dữ liệu đã điền.

**Frontend:**
```typescript
// File: ssb-frontend/app/admin/schedule/page.tsx
// Location: Thêm state và Dialog

const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
const [selectedScheduleToCopy, setSelectedScheduleToCopy] = useState<Schedule | null>(null);

// Update handleDuplicate
const handleDuplicate = (schedule: Schedule) => {
  setSelectedScheduleToCopy(schedule);
  setIsCopyDialogOpen(true);
};

// Thêm Dialog component
<Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Sao chép lịch trình</DialogTitle>
      <DialogDescription>
        Chọn lịch trình mẫu để sao chép. Bạn có thể chỉnh sửa ngày và giờ sau đó.
      </DialogDescription>
    </DialogHeader>
    
    {/* Schedule selection */}
    <div className="space-y-2">
      <Label>Lịch trình mẫu</Label>
      <Select 
        value={selectedScheduleToCopy?.id || ""} 
        onValueChange={(id) => {
          const schedule = allSchedules.find(s => s.id === id);
          setSelectedScheduleToCopy(schedule || null);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Chọn lịch trình..." />
        </SelectTrigger>
        <SelectContent>
          {allSchedules.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.route} - {s.date} {s.startTime} ({s.tripType === 'don_sang' ? 'Đón sáng' : 'Trả chiều'})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="flex justify-end gap-2 mt-4">
      <Button variant="outline" onClick={() => setIsCopyDialogOpen(false)}>
        Hủy
      </Button>
      <Button 
        onClick={() => {
          if (selectedScheduleToCopy) {
            setIsCopyDialogOpen(false);
            setIsAddDialogOpen(true);
            // Pass schedule data to form via initialSchedule prop
            setEditingSchedule({
              ...selectedScheduleToCopy,
              // Reset date to today or allow user to choose
              date: new Date().toISOString().split('T')[0],
            });
          }
        }}
        disabled={!selectedScheduleToCopy}
      >
        Tiếp tục
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

**Update ScheduleForm để nhận initialSchedule từ copy:**
```typescript
// File: ssb-frontend/components/admin/schedule-form.tsx
// Location: Trong useEffect populate form (dòng 232-269)

// Đã có logic này, chỉ cần đảm bảo nó hoạt động với copy schedule
```

---

#### 2.3. Validation bus/driver đang hoạt động trong Service

**Mô tả:** Di chuyển validation từ Controller sang Service layer.

**Backend:**
```javascript
// File: ssb-backend/src/services/ScheduleService.js
// Location: Trong method create(), sau dòng 97

// Validate bus đang hoạt động
if (bus.trangThai !== "hoat_dong") {
  throw new Error("BUS_NOT_ACTIVE");
}

// Validate driver đang hoạt động
if (driver.trangThai !== "hoat_dong") {
  throw new Error("DRIVER_NOT_ACTIVE");
}
```

**Controller:**
```javascript
// File: ssb-backend/src/controllers/ScheduleController.js
// Location: Có thể giữ lại validation ở Controller như backup, hoặc xóa nếu đã có trong Service

// Update error handling
if (serviceError.message === "BUS_NOT_ACTIVE") {
  return response.validationError(res, "Xe buýt không đang hoạt động", [
    { field: "maXe", message: "Xe buýt phải đang hoạt động" }
  ]);
}

if (serviceError.message === "DRIVER_NOT_ACTIVE") {
  return response.validationError(res, "Tài xế không đang hoạt động", [
    { field: "maTaiXe", message: "Tài xế phải đang hoạt động" }
  ]);
}
```

---

### Priority 3: Nice to have (Có thể triển khai sau)

#### 3.1. Preview schedule trước khi lưu

**Mô tả:** Hiển thị summary của schedule sẽ được tạo trước khi submit.

**Frontend:**
```typescript
// File: ssb-frontend/components/admin/schedule-form.tsx
// Location: Thêm preview section trước submit button

{/* Preview Section */}
{date && route && bus && driver && tripType && startTime && (
  <Card className="border-primary/20 bg-primary/5">
    <CardHeader>
      <CardTitle className="text-sm">Xem trước lịch trình</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Ngày chạy:</span>
        <span className="font-medium">{format(date, "PPP", { locale: vi })}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Giờ khởi hành:</span>
        <span className="font-medium">{startTime}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Tuyến đường:</span>
        <span className="font-medium">{routes.find(r => String(r.maTuyen || r.id) === route)?.tenTuyen}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Xe buýt:</span>
        <span className="font-medium">{buses.find(b => String(b.maXe || b.id) === bus)?.bienSoXe}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Tài xế:</span>
        <span className="font-medium">{drivers.find(d => String(d.maTaiXe || d.id) === driver)?.hoTen}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Loại chuyến:</span>
        <Badge variant="outline">
          {tripType === 'don_sang' ? 'Đón sáng' : 'Trả chiều'}
        </Badge>
      </div>
    </CardContent>
  </Card>
)}
```

---

#### 3.2. Bulk create schedules cải tiến

**Mô tả:** Cải tiến UI cho bulk create với preview và confirmation.

**Frontend:**
```typescript
// File: ssb-frontend/app/admin/schedule/page.tsx
// Location: Cải tiến handleAutoAssign với preview

// Thêm preview dialog trước khi execute
const [showBulkPreview, setShowBulkPreview] = useState(false);
const [bulkPreviewData, setBulkPreviewData] = useState<any>(null);

const handleAutoAssignPreview = async () => {
  // Calculate preview data
  const datesToAssign = getDatesToAssign(autoAssignType, autoAssignStartDate);
  const routes = await apiClient.getRoutes({ limit: 100 });
  const totalSchedules = datesToAssign.length * routes.length * 2;
  
  setBulkPreviewData({
    dates: datesToAssign,
    totalSchedules,
    routes: routes.length,
  });
  setShowBulkPreview(true);
};

// Preview Dialog
<Dialog open={showBulkPreview} onOpenChange={setShowBulkPreview}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Xem trước phân công tự động</DialogTitle>
      <DialogDescription>
        Hệ thống sẽ tạo {bulkPreviewData?.totalSchedules} lịch trình cho {bulkPreviewData?.dates?.length} ngày.
      </DialogDescription>
    </DialogHeader>
    
    {/* Preview details */}
    <div className="space-y-2">
      <p className="text-sm">
        <strong>Số ngày:</strong> {bulkPreviewData?.dates?.length}
      </p>
      <p className="text-sm">
        <strong>Số tuyến:</strong> {bulkPreviewData?.routes}
      </p>
      <p className="text-sm">
        <strong>Tổng lịch trình:</strong> {bulkPreviewData?.totalSchedules} (mỗi ngày × mỗi tuyến × 2 chuyến)
      </p>
    </div>

    <div className="flex justify-end gap-2 mt-4">
      <Button variant="outline" onClick={() => setShowBulkPreview(false)}>
        Hủy
      </Button>
      <Button onClick={() => {
        setShowBulkPreview(false);
        handleAutoAssign();
      }}>
        Xác nhận và phân công
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

---

## 📊 Checklist triển khai

### Priority 1
- [ ] 1.1. Validation ngày quá khứ (Backend)
- [ ] 1.1. Validation ngày quá khứ (Frontend)
- [ ] 1.2. Action buttons trong conflict alert

### Priority 2
- [ ] 2.1. Confirm dialog khi hủy
- [ ] 2.2. UI sao chép lịch trình cải tiến
- [ ] 2.3. Validation bus/driver đang hoạt động trong Service

### Priority 3
- [ ] 3.1. Preview schedule trước khi lưu
- [ ] 3.2. Bulk create schedules cải tiến

---

## 🎯 Kết quả mong đợi

Sau khi triển khai các cải tiến trên:

1. **Validation đầy đủ:** Không cho phép tạo lịch trình với dữ liệu không hợp lệ
2. **UX tốt hơn:** User có thể xử lý conflicts và hủy một cách rõ ràng
3. **Copy schedule dễ dàng:** User có thể chọn lịch trình mẫu và chỉnh sửa nhanh chóng
4. **Code quality:** Logic validation tập trung ở Service layer

**Tỷ lệ hoàn thành dự kiến:** **100%** ✅

