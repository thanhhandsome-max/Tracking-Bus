"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Navigation } from "lucide-react"

const mockRouteDetail = {
  id: "1",
  name: "Tuyến 1 - Quận 1",
  stops: [
    { id: "1", name: "Điểm 1", address: "123 Nguyễn Huệ, Q1", time: "06:30", students: 5 },
    { id: "2", name: "Điểm 2", address: "456 Lê Lợi, Q1", time: "06:38", students: 8 },
    { id: "3", name: "Điểm 3", address: "789 Pasteur, Q1", time: "06:45", students: 6 },
    { id: "4", name: "Điểm 4", address: "321 Hai Bà Trưng, Q1", time: "06:52", students: 7 },
    { id: "5", name: "Trường TH ABC", address: "999 Trần Hưng Đạo, Q1", time: "07:00", students: 0 },
  ],
}

interface RouteDetailProps {
  routeId: string
}

export function RouteDetail({ routeId }: RouteDetailProps) {
  return (
    <div className="space-y-6">
      {/* Map Visualization */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-success/5">
              <div className="absolute inset-0 opacity-10">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="route-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#route-grid)" />
                </svg>
              </div>
            </div>

            {/* Route Line */}
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
              <path
                d="M 50 200 Q 150 150, 250 180 T 450 160 T 650 180"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                fill="none"
                strokeDasharray="5,5"
              />
            </svg>

            {/* Stop Markers */}
            {[50, 250, 450, 650].map((x, i) => (
              <div
                key={i}
                className="absolute w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shadow-lg"
                style={{ left: `${x}px`, top: i % 2 === 0 ? "180px" : "140px", zIndex: 2 }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stops List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Danh sách điểm dừng</h3>
        {mockRouteDetail.stops.map((stop, index) => (
          <Card key={stop.id} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      index === mockRouteDetail.stops.length - 1
                        ? "bg-success/10 text-success"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {index === mockRouteDetail.stops.length - 1 ? <Navigation className="w-5 h-5" /> : index + 1}
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">{stop.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3" />
                        {stop.address}
                      </div>
                    </div>
                    {stop.students > 0 && (
                      <Badge variant="outline" className="border-primary text-primary">
                        {stop.students} học sinh
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{stop.time}</span>
                    {index > 0 && <span className="text-muted-foreground">• +{index * 8} phút</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
