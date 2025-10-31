
import React, { useEffect, useState } from 'react';
import { IRoute } from '../models/route.model';

// Local types for API response: server populates optional `name` on each stop.
type ApiStop = (IRoute['stops'] extends Array<infer U> ? U : any) & { name?: string };
type ApiRoute = Omit<IRoute, 'stops'> & { stops: ApiStop[] };

const RouteCard: React.FC<{
  mapSrc: string;
}> = ({ mapSrc }) => {
  const [routes, setRoutes] = useState<ApiRoute[]>([]);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await fetch('/api/routes');
        if (!res.ok) {
          console.error('Failed to fetch routes', res.status, res.statusText);
          setRoutes([]);
          return;
        }
        const data = await res.json();
        setRoutes(data);
        if (!data) console.log('dr')
        else console.log('sai');
      } catch (err) {
        console.error('Error fetching routes', err);
        setRoutes([]);
      }
    };
    fetchRoutes();
  }, []);


  return (

    <div className="flex flex-row justify-between items-center bg-white  shadow-lg p-4 mb-[20px] w-full max-w-4xl mx-auto" style={{ borderRadius: "20px" }}>
      {/* Left Section */}
      {routes.map((item) => (


        <div key={String(item.id)} className="flex-1">
          <p className="text-gray-500 text-sm">
            Hôm nay, <span className="text-black font-semibold">06:30</span>
            <br />
            {item.name}
            <span className="text-gray-600 mt-1 flex items-center">
              <span className="mr-1">👥</span> 7
            </span>
          </p>


          <ul className="mt-3 mb-4 ml-4 list-none space-y-1">
            {item.stops && item.stops.length > 0 ? (
              <>
                {item.stops.slice(0, 6).map((stop, idx) => (
                  <li
                    key={String(stop.stopId) + '-' + idx}
                    className="flex items-center text-gray-700 text-sm"
                  >
                    <span className="mr-2">📍</span>
                    {stop.name
                      ? `${stop.name} — ${stop.estimatedArrivalTime}`
                      : `Trạm ${stop.order} — ${stop.estimatedArrivalTime}`}
                  </li>
                ))}

                {/* Nếu có nhiều hơn 6 trạm thì hiển thị dấu ... */}
                {item.stops.length > 6 && (
      
                  <li className="text-gray-400 text-sm"><span className="mr-2">📍</span>...</li>
                )}
              </>
            ) : (
              <li className="text-gray-500 text-sm">Không có trạm dừng nào</li>
            )}

          </ul>

          <button className="bg-black text-white px-5 py-2 rounded-full hover:bg-gray-800 transition-all">
            Chọn chuyến
          </button>
        </div>
      ))}

      {/* Right Section */}
      <div className="w-[300px] h-[200px] rounded-lg overflow-hidden ml-6 shadow">
        <iframe
          title="map"
          src={mapSrc}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const trips = [
    {
      mapSrc:
        "https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d3919.50283947814!2d106.69324497570642!3d10.77253108937566!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e0!4m5!1s0x31752f3ee9a3e5a5%3A0x3ad13b0d94f2ad0!2zMzQ1IE1haSBC4bqjbyBRdeG7kWM!3m2!1d10.7765836!2d106.6926543!4m5!1s0x31752f3ebdaff0ef%3A0x19a118b8b6cc6b3!2zQ2FmZSB0aGUgQm9vayBTdG9yZSwgMTI4LCAxMTAgxJDhuqFpIEPDtG5nLCBQaMaw4budbmcgMSwgSG_DoG5nIFRow6BuaCBQaOG7kSBDaMOtbmggQ2jDonUsIFZpZXRuYW0!3m2!1d10.776956!2d106.699882!5e0!3m2!1svi!2s!4v1697802052381!5m2!1svi!2s",
    },
    {
      mapSrc:
        "https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d3919.50283947814!2d106.69324497570642!3d10.77253108937566!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e0!4m5!1s0x31752f3ee9a3e5a5%3A0x3ad13b0d94f2ad0!2zMzQ1IE1haSBC4bqjbyBRdeG7kWM!3m2!1d10.7765836!2d106.6926543!4m5!1s0x31752f3ebdaff0ef%3A0x19a118b8b6cc6b3!2zQ2FmZSB0aGUgQm9vayBTdG9yZSwgMTI4LCAxMTAgxJDhuqFpIEPDtG5nLCBQaMaw4budbmcgMSwgSG_DoG5nIFRow6BuaCBQaOG7kSBDaMOtbmggQ2jDonUsIFZpZXRuYW0!3m2!1d10.776956!2d106.699882!5e0!3m2!1svi!2s!4v1697802052381!5m2!1svi!2s",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      {trips.map((trip, index) => (
        <RouteCard key={index} {...trip} />
      ))}
    </div>
  );
};

export default App;
