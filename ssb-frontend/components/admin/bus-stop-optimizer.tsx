"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Zap,
  MapPin,
  Users,
  Route,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Settings,
  BarChart3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/api-client";
import SSBMap from "@/components/map/SSBMap";
import type { StopDTO } from "@/components/map/SSBMap";

interface OptimizationParams {
  r_walk: number;
  s_max: number;
  c_bus: number;
  max_stops: number | null;
  use_roads_api: boolean;
  use_places_api: boolean;
  split_virtual_nodes: boolean;
  school_location: {
    lat: number;
    lng: number;
  };
}

interface OptimizationResult {
  stops: Array<{
    maDiem: number;
    tenDiem: string;
    viDo: number;
    kinhDo: number;
    address?: string;
    studentCount?: number;
  }>;
  assignments: Array<{
    maHocSinh: number;
    maDiemDung: number;
    khoangCachMet: number;
  }>;
  stats: {
    totalStudents: number;
    assignedStudents: number;
    totalStops: number;
    averageStudentsPerStop: string;
    maxWalkDistance: number;
  };
}

interface VRPResult {
  routes: Array<{
    routeId: number;
    nodes: Array<{
      maDiem: number;
      tenDiem: string;
      viDo: number;
      kinhDo: number;
      demand: number;
    }>;
    totalDemand: number;
    stopCount: number;
    estimatedDistance: number;
  }>;
  stats: {
    totalStops: number;
    totalNodes: number;
    totalStudents: number;
    totalRoutes: number;
    totalDistance: string;
    averageStopsPerRoute: string;
    averageStudentsPerRoute: string;
  };
}

export function BusStopOptimizer() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"tier1" | "tier2" | "full">("full");
  
  const [params, setParams] = useState<OptimizationParams>({
    r_walk: 500,
    s_max: 25,
    c_bus: 40,
    max_stops: null,
    use_roads_api: true,
    use_places_api: true,
    split_virtual_nodes: true,
    school_location: {
      lat: 10.77653,
      lng: 106.700981,
    },
  });

  const [tier1Result, setTier1Result] = useState<OptimizationResult | null>(null);
  const [tier2Result, setTier2Result] = useState<VRPResult | null>(null);
  const [fullResult, setFullResult] = useState<{
    tier1: OptimizationResult;
    tier2: VRPResult;
    summary: any;
  } | null>(null);

  const [stats, setStats] = useState<any>(null);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await apiClient.getBusStopStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error: any) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleOptimizeTier1 = async () => {
    setLoading(true);
    try {
      const response = await apiClient.optimizeBusStops({
        r_walk: params.r_walk,
        s_max: params.s_max,
        max_stops: params.max_stops,
        use_roads_api: params.use_roads_api,
        use_places_api: params.use_places_api,
      });

      if (response.success && response.data) {
        const result = response.data as OptimizationResult;
        setTier1Result(result);
        await loadStats();
        
        // Kiểm tra nếu không có kết quả
        if (result.stats.totalStops === 0) {
          toast({
            title: "Cảnh báo",
            description: (result.stats as any).error || "Không tìm thấy học sinh có tọa độ hợp lệ. Vui lòng kiểm tra dữ liệu học sinh trong database.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Thành công",
            description: `Tối ưu hóa điểm dừng: ${result.stats.totalStops} điểm dừng, ${result.stats.assignedStudents} học sinh`,
          });
        }
      } else {
        throw new Error(response.error?.message || "Lỗi không xác định");
      }
    } catch (error: any) {
      console.error("Optimization error:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tối ưu hóa điểm dừng",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeTier2 = async () => {
    setLoading(true);
    try {
      const response = await apiClient.optimizeVRP({
        depot: params.school_location,
        capacity: params.c_bus,
        split_virtual_nodes: params.split_virtual_nodes,
      });

      if (response.success && response.data) {
        const result = response.data as VRPResult;
        setTier2Result(result);
        
        // Kiểm tra nếu không có kết quả
        if (result.stats.totalRoutes === 0) {
          toast({
            title: "Cảnh báo",
            description: "Không có điểm dừng nào có học sinh được gán. Vui lòng chạy Tầng 1 (Tối ưu điểm dừng) trước.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Thành công",
            description: `Tối ưu hóa tuyến xe: ${result.stats.totalRoutes} tuyến, ${result.stats.totalStudents} học sinh`,
          });
        }
      } else {
        throw new Error(response.error?.message || "Lỗi không xác định");
      }
    } catch (error: any) {
      console.error("VRP optimization error:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tối ưu hóa tuyến xe",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeFull = async () => {
    setLoading(true);
    try {
      const response = await apiClient.optimizeFull({
        school_location: params.school_location,
        r_walk: params.r_walk,
        s_max: params.s_max,
        c_bus: params.c_bus,
        max_stops: params.max_stops,
        use_roads_api: params.use_roads_api,
        use_places_api: params.use_places_api,
        split_virtual_nodes: params.split_virtual_nodes,
      });

      if (response.success && response.data) {
        const result = response.data as {
          tier1: OptimizationResult;
          tier2: VRPResult;
          summary: any;
        };
        setFullResult(result);
        setTier1Result(result.tier1);
        setTier2Result(result.tier2);
        await loadStats();
        
        // Kiểm tra nếu không có kết quả
        if (result.summary.totalStops === 0 || result.summary.totalRoutes === 0) {
          const errorMsg = (result.tier1?.stats as any)?.error 
            ? (result.tier1.stats as any).error 
            : "Không tìm thấy học sinh có tọa độ hợp lệ hoặc không có điểm dừng được tạo. Vui lòng kiểm tra dữ liệu học sinh trong database.";
          toast({
            title: "Cảnh báo",
            description: errorMsg,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Thành công",
            description: `Tối ưu hóa hoàn chỉnh: ${result.summary.totalStops} điểm dừng, ${result.summary.totalRoutes} tuyến xe`,
          });
        }
      } else {
        throw new Error(response.error?.message || "Lỗi không xác định");
      }
    } catch (error: any) {
      console.error("Full optimization error:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tối ưu hóa hoàn chỉnh",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Convert stops to StopDTO format for map
  const getStopsForMap = (): StopDTO[] => {
    const result = tier1Result || fullResult?.tier1;
    if (!result) return [];

    return result.stops.map((stop, index) => ({
      maDiem: stop.maDiem,
      tenDiem: stop.tenDiem,
      viDo: stop.viDo,
      kinhDo: stop.kinhDo,
      address: stop.address || null,
      sequence: index + 1,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tối Ưu Hóa Điểm Dừng & Tuyến Xe</h1>
          <p className="text-muted-foreground mt-2">
            Sử dụng thuật toán Greedy Maximum Coverage và VRP để tối ưu hóa hệ thống
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="full">
            <Zap className="w-4 h-4 mr-2" />
            Tối Ưu Hoàn Chỉnh
          </TabsTrigger>
          <TabsTrigger value="tier1">
            <MapPin className="w-4 h-4 mr-2" />
            Tầng 1: Điểm Dừng
          </TabsTrigger>
          <TabsTrigger value="tier2">
            <Route className="w-4 h-4 mr-2" />
            Tầng 2: Tuyến Xe
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Parameters Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Tham Số
              </CardTitle>
              <CardDescription>Điều chỉnh tham số tối ưu hóa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="r_walk">Bán kính đi bộ (mét)</Label>
                <Input
                  id="r_walk"
                  type="number"
                  value={params.r_walk}
                  onChange={(e) =>
                    setParams({ ...params, r_walk: parseInt(e.target.value) || 500 })
                  }
                  min={100}
                  max={2000}
                />
                <p className="text-xs text-muted-foreground">Khoảng cách tối đa học sinh đi bộ đến điểm dừng</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="s_max">Số học sinh tối đa/điểm dừng</Label>
                <Input
                  id="s_max"
                  type="number"
                  value={params.s_max}
                  onChange={(e) =>
                    setParams({ ...params, s_max: parseInt(e.target.value) || 25 })
                  }
                  min={1}
                  max={100}
                />
                <p className="text-xs text-muted-foreground">Giới hạn số học sinh tại mỗi điểm dừng</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="c_bus">Sức chứa xe buýt</Label>
                <Input
                  id="c_bus"
                  type="number"
                  value={params.c_bus}
                  onChange={(e) =>
                    setParams({ ...params, c_bus: parseInt(e.target.value) || 40 })
                  }
                  min={1}
                  max={100}
                />
                <p className="text-xs text-muted-foreground">Số học sinh tối đa mỗi xe buýt</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_stops">Số điểm dừng tối đa (tùy chọn)</Label>
                <Input
                  id="max_stops"
                  type="number"
                  value={params.max_stops || ""}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      max_stops: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  min={1}
                  placeholder="Không giới hạn"
                />
                <p className="text-xs text-muted-foreground">Để trống nếu không giới hạn</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="school_lat">Vĩ độ trường học</Label>
                <Input
                  id="school_lat"
                  type="number"
                  step="0.000001"
                  value={params.school_location.lat}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      school_location: {
                        ...params.school_location,
                        lat: parseFloat(e.target.value) || 10.77653,
                      },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="school_lng">Kinh độ trường học</Label>
                <Input
                  id="school_lng"
                  type="number"
                  step="0.000001"
                  value={params.school_location.lng}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      school_location: {
                        ...params.school_location,
                        lng: parseFloat(e.target.value) || 106.700981,
                      },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="use_roads_api"
                    checked={params.use_roads_api}
                    onChange={(e) =>
                      setParams({ ...params, use_roads_api: e.target.checked })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="use_roads_api" className="cursor-pointer">
                    Sử dụng Roads API
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  Snap điểm dừng lên đường lớn
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="use_places_api"
                    checked={params.use_places_api}
                    onChange={(e) =>
                      setParams({ ...params, use_places_api: e.target.checked })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="use_places_api" className="cursor-pointer">
                    Sử dụng Places API
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  Tìm địa điểm dễ nhận diện
                </p>
              </div>

              <Separator />

              <Button
                onClick={
                  activeTab === "full"
                    ? handleOptimizeFull
                    : activeTab === "tier1"
                    ? handleOptimizeTier1
                    : handleOptimizeTier2
                }
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang tối ưu hóa...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Chạy Tối Ưu Hóa
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Kết Quả
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TabsContent value="full" className="mt-0">
                {fullResult ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="text-2xl font-bold">{fullResult.summary.totalStops}</div>
                        <div className="text-sm text-muted-foreground">Điểm dừng</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-2xl font-bold">{fullResult.summary.totalRoutes}</div>
                        <div className="text-sm text-muted-foreground">Tuyến xe</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-2xl font-bold">{fullResult.summary.totalStudents}</div>
                        <div className="text-sm text-muted-foreground">Học sinh</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-2xl font-bold">
                          {fullResult.summary.averageStudentsPerStop}
                        </div>
                        <div className="text-sm text-muted-foreground">HS/Điểm dừng</div>
                      </div>
                    </div>

                    <div className="h-[500px] rounded-lg overflow-hidden border">
                      <SSBMap
                        center={params.school_location}
                        zoom={13}
                        stops={getStopsForMap()}
                        height="100%"
                      />
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold">Chi tiết Tuyến Xe</h3>
                      <ScrollArea className="h-[200px]">
                        {fullResult.tier2.routes.map((route) => (
                          <div key={route.routeId} className="p-3 border rounded-lg mb-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium">Tuyến {route.routeId}</span>
                                <Badge variant="outline" className="ml-2">
                                  {route.stopCount} điểm dừng
                                </Badge>
                                <Badge variant="outline" className="ml-2">
                                  {route.totalDemand} học sinh
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                ~{route.estimatedDistance.toFixed(1)} km
                              </div>
                            </div>
                          </div>
                        ))}
                      </ScrollArea>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Chưa có kết quả. Nhấn "Chạy Tối Ưu Hóa" để bắt đầu.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tier1" className="mt-0">
                {tier1Result ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="text-2xl font-bold">{tier1Result.stats.totalStops}</div>
                        <div className="text-sm text-muted-foreground">Điểm dừng</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-2xl font-bold">{tier1Result.stats.assignedStudents}</div>
                        <div className="text-sm text-muted-foreground">Học sinh</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-2xl font-bold">
                          {tier1Result.stats.averageStudentsPerStop}
                        </div>
                        <div className="text-sm text-muted-foreground">HS/Điểm dừng</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-2xl font-bold">{tier1Result.stats.maxWalkDistance}m</div>
                        <div className="text-sm text-muted-foreground">Đi bộ tối đa</div>
                      </div>
                    </div>

                    <div className="h-[400px] rounded-lg overflow-hidden border">
                      <SSBMap
                        center={params.school_location}
                        zoom={13}
                        stops={getStopsForMap()}
                        height="100%"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Chưa có kết quả. Nhấn "Chạy Tối Ưu Hóa" để bắt đầu.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tier2" className="mt-0">
                {tier2Result ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="text-2xl font-bold">{tier2Result.stats.totalRoutes}</div>
                        <div className="text-sm text-muted-foreground">Tuyến xe</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-2xl font-bold">{tier2Result.stats.totalStudents}</div>
                        <div className="text-sm text-muted-foreground">Học sinh</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-2xl font-bold">
                          {tier2Result.stats.averageStopsPerRoute}
                        </div>
                        <div className="text-sm text-muted-foreground">Điểm dừng/Tuyến</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-2xl font-bold">
                          {tier2Result.stats.averageStudentsPerRoute}
                        </div>
                        <div className="text-sm text-muted-foreground">HS/Tuyến</div>
                      </div>
                    </div>

                    <ScrollArea className="h-[500px]">
                      {tier2Result.routes.map((route) => (
                        <div key={route.routeId} className="p-4 border rounded-lg mb-3">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="font-semibold text-lg">Tuyến {route.routeId}</span>
                              <Badge variant="outline" className="ml-2">
                                {route.stopCount} điểm dừng
                              </Badge>
                              <Badge variant="outline" className="ml-2">
                                {route.totalDemand} học sinh
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ~{route.estimatedDistance.toFixed(1)} km
                            </div>
                          </div>
                          <div className="space-y-1">
                            {route.nodes.map((node, idx) => (
                              <div
                                key={idx}
                                className="text-sm p-2 bg-muted rounded flex items-center justify-between"
                              >
                                <span>
                                  {idx + 1}. {node.tenDiem}
                                </span>
                                <Badge variant="secondary">{node.demand} HS</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Route className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Chưa có kết quả. Nhấn "Chạy Tối Ưu Hóa" để bắt đầu.</p>
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Card>
        </div>
      </Tabs>

      {/* Stats Card */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Thống Kê Hiện Tại</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{stats.totalStops || 0}</div>
                <div className="text-sm text-muted-foreground">Tổng điểm dừng</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{stats.totalAssignedStudents || 0}</div>
                <div className="text-sm text-muted-foreground">Học sinh đã gán</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">
                  {stats.avgWalkDistance ? `${Math.round(stats.avgWalkDistance)}m` : "N/A"}
                </div>
                <div className="text-sm text-muted-foreground">Đi bộ trung bình</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{stats.maxWalkDistance || 0}m</div>
                <div className="text-sm text-muted-foreground">Đi bộ tối đa</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

