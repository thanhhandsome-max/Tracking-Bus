type Bus = {
  id: string
  name: string
  driver?: string
  lat?: number
  lng?: number
}

/**
 * Mock bus list for frontend development.
 * Replace with real API calls when backend is ready.
 */
export async function getBuses(): Promise<Bus[]> {
  // small simulated delay
  await new Promise((res) => setTimeout(res, 120))

  return [
    { id: 'bus-1', name: 'Xe 01', driver: 'Tài xế A', lat: 10.762622, lng: 106.660172 },
    { id: 'bus-2', name: 'Xe 02', driver: 'Tài xế B', lat: 10.770000, lng: 106.680000 },
  ]
}

export default { getBuses }
