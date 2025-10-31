import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET /api/routes
// Returns routes with stops array augmented with stop.name when available.
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'test');

    // fetch all routes
    const routes = await db.collection('routes').find({}).toArray();

    // collect all stopIds referenced by routes
    const allStopIds = routes.flatMap((r: any) => (r.stops || []).map((s: any) => s.stopId));
    const uniqueIds = Array.from(new Set(allStopIds.map((id: any) => String(id)))).map(
      (s) => new ObjectId(s)
    );

    // fetch stop documents
    const stopsDocs = uniqueIds.length > 0 ? await db.collection('stops').find({ _id: { $in: uniqueIds } }).toArray() : [];
    const stopsById = new Map(stopsDocs.map((s: any) => [String(s._id), s]));

    // attach stop name into each route.stops element
    const routesWithStopNames = routes.map((r: any) => ({
      ...r,
      stops: (r.stops || []).map((s: any) => ({
        ...s,
        // look up stop name (if stop doc exists)
        name: stopsById.get(String(s.stopId))?.name ?? null,
      })),
    }));

    return NextResponse.json(routesWithStopNames);
  } catch (error) {
    console.error('❌ Error in /api/routes GET', error);
    return new NextResponse(JSON.stringify({ message: 'Internal Server Error' }), { status: 500 });
  }
}
