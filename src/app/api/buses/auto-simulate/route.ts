import { NextRequest, NextResponse } from 'next/server';

/**
 * API trigger auto GPS simulation
 * GET /api/buses/auto-simulate
 * 
 * Được gọi từ client-side để trigger GPS update cho tất cả buses
 */

let simulationInterval: NodeJS.Timeout | null = null;
let isRunning = false;

export async function GET(request: NextRequest) {
  if (isRunning) {
    return NextResponse.json({
      success: true,
      message: 'Auto simulation already running'
    });
  }

  // Start auto simulation
  isRunning = true;
  
  const runSimulation = async () => {
    try {
      const response = await fetch(`${request.nextUrl.origin}/api/buses/simulate-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      console.log(`🔄 Auto GPS update: ${data.updated} buses`);
    } catch (error) {
      console.error('Auto simulation error:', error);
    }
  };

  // Run immediately
  runSimulation();

  // Then run every 10 seconds
  simulationInterval = setInterval(runSimulation, 10000);

  return NextResponse.json({
    success: true,
    message: 'Auto simulation started'
  });
}

export async function DELETE() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    isRunning = false;
  }

  return NextResponse.json({
    success: true,
    message: 'Auto simulation stopped'
  });
}
