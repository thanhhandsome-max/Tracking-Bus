import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Trip from '@/models/trip.model';

export async function GET(request: NextRequest) {
  try {
    console.log('=== TEST API CALLED ===');
    
    await dbConnect();
    console.log('✅ Connected to database');

    const trips = await Trip.find({}).limit(3).lean();
    console.log(`Found ${trips.length} trips`);

    return NextResponse.json({
      success: true,
      count: trips.length,
      data: trips
    });
  } catch (error) {
    console.error('Test API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
