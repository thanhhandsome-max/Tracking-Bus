import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

// Query keys
export const routeKeys = {
  all: ['routes'] as const,
  lists: () => [...routeKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...routeKeys.lists(), filters] as const,
  details: () => [...routeKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...routeKeys.details(), id] as const,
  stops: (routeId: string | number) => [...routeKeys.detail(routeId), 'stops'] as const,
};

// Get route list
export function useRoutes(params?: { page?: number; limit?: number; search?: string; trangThai?: boolean }) {
  return useQuery({
    queryKey: routeKeys.list(params || {}),
    queryFn: async () => {
      const response = await apiClient.getRoutes(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch routes');
      }
      return response;
    },
    staleTime: 30000, // 30 seconds
  });
}

// Get route detail
export function useRouteDetail(routeId: string | number | null, enabled = true) {
  return useQuery({
    queryKey: routeKeys.detail(routeId!),
    queryFn: async ({ signal }) => {
      if (!routeId) throw new Error('Route ID is required');
      const response = await apiClient.getRouteById(routeId, signal);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch route');
      }
      // Ensure stops are sorted by sequence
      const data = response.data as any;
      if (data?.stops) {
        data.stops = data.stops.sort((a: any, b: any) => (a.sequence || 0) - (b.sequence || 0));
      }
      return data;
    },
    enabled: enabled && !!routeId,
    staleTime: 30000,
  });
}

// Get route stops
export function useRouteStops(routeId: string | number | null, enabled = true) {
  return useQuery({
    queryKey: routeKeys.stops(routeId!),
    queryFn: async ({ signal }) => {
      if (!routeId) throw new Error('Route ID is required');
      const response = await apiClient.getRouteStops(routeId, signal);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch stops');
      }
      // Sort by sequence
      const stops = Array.isArray(response.data) ? response.data : [];
      return stops.sort((a: any, b: any) => (a.sequence || 0) - (b.sequence || 0));
    },
    enabled: enabled && !!routeId,
    staleTime: 30000,
  });
}

// Reorder stops
export function useReorderStops() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ routeId, items }: { routeId: string | number; items: Array<{ stop_id: number; sequence: number }> }) => {
      const response = await apiClient.reorderStops(routeId, items);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to reorder stops');
      }
      return response;
    },
    onSuccess: (_, variables) => {
      // Invalidate route detail and stops
      queryClient.invalidateQueries({ queryKey: routeKeys.detail(variables.routeId) });
      queryClient.invalidateQueries({ queryKey: routeKeys.stops(variables.routeId) });
      toast.success('Đã sắp xếp lại thứ tự điểm dừng');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Lỗi khi sắp xếp lại điểm dừng');
    },
  });
}

// Add stop to route
export function useAddStopToRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ routeId, data }: { routeId: string | number; data: any }) => {
      const response = await apiClient.addStopToRoute(routeId, data);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to add stop');
      }
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: routeKeys.detail(variables.routeId) });
      queryClient.invalidateQueries({ queryKey: routeKeys.stops(variables.routeId) });
      toast.success('Đã thêm điểm dừng vào tuyến');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Lỗi khi thêm điểm dừng');
    },
  });
}

// Remove stop from route
export function useRemoveStopFromRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ routeId, stopId }: { routeId: string | number; stopId: number }) => {
      const response = await apiClient.removeStopFromRoute(routeId, stopId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to remove stop');
      }
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: routeKeys.detail(variables.routeId) });
      queryClient.invalidateQueries({ queryKey: routeKeys.stops(variables.routeId) });
      toast.success('Đã xóa điểm dừng khỏi tuyến');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Lỗi khi xóa điểm dừng');
    },
  });
}

// Rebuild polyline
export function useRebuildPolyline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routeId: string | number) => {
      const response = await apiClient.rebuildPolyline(routeId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to rebuild polyline');
      }
      return response;
    },
    onSuccess: (_, routeId) => {
      queryClient.invalidateQueries({ queryKey: routeKeys.detail(routeId) });
      toast.success('Đã tái tạo đường đi cho tuyến');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Lỗi khi tái tạo đường đi');
    },
  });
}

// Delete route
export function useDeleteRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routeId: string | number) => {
      const response = await apiClient.deleteRoute(routeId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to delete route');
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routeKeys.all });
      toast.success('Đã xóa tuyến đường');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Lỗi khi xóa tuyến đường');
    },
  });
}

