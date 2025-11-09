import fetch from "node-fetch";
import dotenv from "dotenv";
import { getCacheProvider, generateCacheKey } from "../core/cacheProvider.js";

dotenv.config();

const MAPS_API_KEY = process.env.MAPS_API_KEY;
const MAPS_API_BASE_URL = "https://maps.googleapis.com/maps/api";

// Cache TTL (seconds) - from environment or defaults
const CACHE_TTL = {
  DIRECTIONS: parseInt(process.env.CACHE_TTL_DIRECTIONS || "21600"), // 6 hours
  DISTANCE_MATRIX: parseInt(process.env.CACHE_TTL_DISTANCE_MATRIX || "120"), // 2 minutes
  GEOCODE: parseInt(process.env.CACHE_TTL_GEOCODE || "86400"), // 24 hours
  ROADS_SNAP: parseInt(process.env.CACHE_TTL_ROADS || "900"), // 15 minutes
};

/**
 * MapsService - Service để gọi Google Maps API với caching
 */
class MapsService {
  /**
   * Get cache provider instance
   */
  static async _getCache() {
    return await getCacheProvider();
  }

  /**
   * Get Directions (Directions API)
   * @param {Object} params - {origin, destination, waypoints[], mode, alternatives, avoid, language, units}
   * @returns {Promise<Object>} {polyline, legs, distance, duration, cached}
   */
  static async getDirections(params) {
    if (!MAPS_API_KEY) {
      throw new Error("MAPS_API_KEY not configured");
    }

    const {
      origin,
      destination,
      waypoints = [],
      mode = "driving",
      alternatives = false,
      avoid = [],
      language = "vi",
      units = "metric",
    } = params;

    // Generate cache key
    const cacheKey = generateCacheKey("dir", {
      origin,
      destination,
      waypoints: waypoints.map((w) => (typeof w === "string" ? w : w.location)).sort(),
      mode,
      alternatives,
      avoid,
    });

    // Check cache
    const cache = await this._getCache();
    const cached = await cache.get(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    // Build URL
    const waypointsStr = waypoints.length > 0
      ? `&waypoints=${waypoints.map((w) => (typeof w === "string" ? w : w.location)).join("|")}`
      : "";
    const avoidStr = avoid.length > 0 ? `&avoid=${avoid.join("|")}` : "";
    const alternativesStr = alternatives ? "&alternatives=true" : "";

    const url = `${MAPS_API_BASE_URL}/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${waypointsStr}&mode=${mode}${avoidStr}${alternativesStr}&language=${language}&units=${units}&key=${MAPS_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== "OK") {
        throw new Error(`Maps API error: ${data.status} - ${data.error_message || "Unknown error"}`);
      }

      // Extract polyline from first route
      const route = data.routes[0];
      const polyline = route.overview_polyline?.points || null;

      // Extract legs (distance, duration for each segment)
      const legs = route.legs.map((leg) => ({
        distance: leg.distance?.value || 0, // meters
        duration: leg.duration?.value || 0, // seconds
        start_address: leg.start_address,
        end_address: leg.end_address,
        start_location: leg.start_location,
        end_location: leg.end_location,
        steps: leg.steps?.map((step) => ({
          distance: step.distance?.value || 0,
          duration: step.duration?.value || 0,
          polyline: step.polyline?.points || null,
          html_instructions: step.html_instructions,
        })) || [],
      }));

      // Total distance and duration
      const distance = legs.reduce((sum, leg) => sum + leg.distance, 0);
      const duration = legs.reduce((sum, leg) => sum + leg.duration, 0);

      const result = {
        polyline,
        legs,
        distance,
        duration,
        cached: false,
      };

      // Cache result
      await cache.set(cacheKey, result, CACHE_TTL.DIRECTIONS);

      return result;
    } catch (error) {
      console.error("Maps Directions API error:", error);
      throw error;
    }
  }

  /**
   * Get Distance Matrix (Distance Matrix API)
   * @param {Object} params - {origins[], destinations[], mode, avoid, language, units, departure_time, traffic_model}
   * @returns {Promise<Object>} {rows, cached}
   */
  static async getDistanceMatrix(params) {
    if (!MAPS_API_KEY) {
      throw new Error("MAPS_API_KEY not configured");
    }

    const {
      origins = [],
      destinations = [],
      mode = "driving",
      avoid = [],
      language = "vi",
      units = "metric",
      departure_time = null,
      traffic_model = null,
    } = params;

    if (origins.length === 0 || destinations.length === 0) {
      throw new Error("Origins and destinations are required");
    }

    // Generate cache key
    const cacheKey = generateCacheKey("mx", {
      origins: origins.sort(),
      destinations: destinations.sort(),
      mode,
      avoid,
      departure_time,
      traffic_model,
    });

    // Check cache
    const cache = await this._getCache();
    const cached = await cache.get(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    // Build URL
    const originsStr = origins.map((o) => (typeof o === "string" ? o : `${o.lat},${o.lng}`)).join("|");
    const destinationsStr = destinations.map((d) => (typeof d === "string" ? d : `${d.lat},${d.lng}`)).join("|");
    const avoidStr = avoid.length > 0 ? `&avoid=${avoid.join("|")}` : "";
    const departureTimeStr = departure_time ? `&departure_time=${departure_time}` : "";
    const trafficModelStr = traffic_model ? `&traffic_model=${traffic_model}` : "";

    const url = `${MAPS_API_BASE_URL}/distancematrix/json?origins=${encodeURIComponent(originsStr)}&destinations=${encodeURIComponent(destinationsStr)}&mode=${mode}${avoidStr}${departureTimeStr}${trafficModelStr}&language=${language}&units=${units}&key=${MAPS_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== "OK") {
        throw new Error(`Maps API error: ${data.status} - ${data.error_message || "Unknown error"}`);
      }

      // Transform response
      const rows = data.rows.map((row) =>
        row.elements.map((element) => ({
          distance: element.distance?.value || null, // meters
          duration: element.duration?.value || null, // seconds
          status: element.status,
        }))
      );

      const result = {
        rows,
        origin_addresses: data.origin_addresses,
        destination_addresses: data.destination_addresses,
        cached: false,
      };

      // Cache result
      await cache.set(cacheKey, result, CACHE_TTL.DISTANCE_MATRIX);

      return result;
    } catch (error) {
      console.error("Maps Distance Matrix API error:", error);
      throw error;
    }
  }

  /**
   * Geocode (Geocoding API)
   * @param {Object} params - {address} or {latlng}
   * @returns {Promise<Object>} {results, cached}
   */
  static async geocode(params) {
    if (!MAPS_API_KEY) {
      throw new Error("MAPS_API_KEY not configured");
    }

    const { address, latlng, language = "vi" } = params;

    if (!address && !latlng) {
      throw new Error("Address or latlng is required");
    }

    // Generate cache key
    const cacheKey = generateCacheKey("geo", { address, latlng, language });

    // Check cache
    const cache = await this._getCache();
    const cached = await cache.get(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    // Build URL
    const query = address
      ? `address=${encodeURIComponent(address)}`
      : `latlng=${encodeURIComponent(latlng)}`;
    const url = `${MAPS_API_BASE_URL}/geocode/json?${query}&language=${language}&key=${MAPS_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== "OK") {
        throw new Error(`Maps API error: ${data.status} - ${data.error_message || "Unknown error"}`);
      }

      // Transform response
      const results = data.results.map((result) => ({
        formatted_address: result.formatted_address,
        geometry: {
          location: result.geometry.location,
          location_type: result.geometry.location_type,
          viewport: result.geometry.viewport,
          bounds: result.geometry.bounds,
        },
        place_id: result.place_id,
        types: result.types,
      }));

      const result = {
        results,
        cached: false,
      };

      // Cache result
      await cache.set(cacheKey, result, CACHE_TTL.GEOCODE);

      return result;
    } catch (error) {
      console.error("Maps Geocode API error:", error);
      throw error;
    }
  }

  /**
   * Reverse Geocode (alias for geocode with latlng)
   */
  static async reverseGeocode(latlng, language = "vi") {
    return this.geocode({ latlng, language });
  }

  /**
   * Snap to Roads (Roads API)
   * @param {Object} params - {path[], interpolate}
   * @returns {Promise<Object>} {snappedPolyline, cached}
   */
  static async snapToRoads(params) {
    if (!MAPS_API_KEY) {
      throw new Error("MAPS_API_KEY not configured");
    }

    const { path = [], interpolate = true } = params;

    if (path.length === 0) {
      throw new Error("Path is required");
    }

    // Generate cache key
    const cacheKey = generateCacheKey("rd", {
      path: path.map((p) => `${p.lat},${p.lng}`).join("|"),
      interpolate,
    });

    // Check cache
    const cache = await this._getCache();
    const cached = await cache.get(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    // Build URL
    const pathStr = path.map((p) => `${p.lat},${p.lng}`).join("|");
    const interpolateStr = interpolate ? "&interpolate=true" : "";
    const url = `${MAPS_API_BASE_URL}/roads/snapToRoads?path=${encodeURIComponent(pathStr)}${interpolateStr}&key=${MAPS_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        throw new Error(`Maps API error: ${data.error.message || "Unknown error"}`);
      }

      // Extract snapped polyline
      const snappedPoints = data.snappedPoints || [];
      const snappedPolyline = snappedPoints.map((point) => ({
        location: point.location,
        originalIndex: point.originalIndex,
        placeId: point.placeId,
      }));

      const result = {
        snappedPolyline,
        cached: false,
      };

      // Cache result
      await cache.set(cacheKey, result, CACHE_TTL.ROADS_SNAP);

      return result;
    } catch (error) {
      console.error("Maps Roads API error:", error);
      throw error;
    }
  }
}

export default MapsService;
