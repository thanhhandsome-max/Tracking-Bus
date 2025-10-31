import MapView from '@/components/MapView';

export const metadata = {
  title: 'Lịch sử - Map',
};

export default function MapPage() {
  const stops = [
    { name: 'Điểm A', lat: 10.762622, lng: 106.660172, type: 'pickup', time: '06:30' },
    { name: 'Điểm B', lat: 10.768, lng: 106.68, type: 'stop', time: '06:40' },
    { name: 'Trường', lat: 10.772531, lng: 106.693245, type: 'dropoff', time: '06:50' },
  ];

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold mb-4">Lịch sử di chuyển</h1>
      <div style={{ height: '600px' }}>
        {/* MapView is a client component and expects stops prop */}
        {/* @ts-ignore-next-line */}
        <MapView stops={stops} showBus={true} showRoute={true} />
      </div>
    </main>
  );
}
