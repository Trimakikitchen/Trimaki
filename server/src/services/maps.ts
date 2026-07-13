import { env } from '../config/env';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export const mapsService = {
  /**
   * Mock autocomplete search results for Bandra / Mumbai locations.
   */
  autocomplete: async (input: string) => {
    if (!env.GOOGLE_MAPS_API_KEY || env.GOOGLE_MAPS_API_KEY.includes('your')) {
      // Return simulated suggestions matching Bandra Hub location
      return [
        { description: 'Carter Road, Bandra West, Mumbai, MH, India', placeId: 'place_carter' },
        { description: 'BKC Ground, Bandra East, Mumbai, MH, India', placeId: 'place_bkc' },
        { description: 'Linking Road Mall, Bandra West, Mumbai, MH, India', placeId: 'place_linking' },
      ].filter(item => item.description.toLowerCase().includes(input.toLowerCase()));
    }

    try {
      // In production, fetch from Google Places API
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input
      )}&key=${env.GOOGLE_MAPS_API_KEY}&components=country:in`;
      const response = await fetch(url);
      const data = await response.json() as any;
      return data.predictions.map((p: any) => ({
        description: p.description,
        placeId: p.place_id,
      }));
    } catch (e) {
      console.error('Google Maps Autocomplete failed', e);
      return [];
    }
  },

  /**
   * Geocode a placeId into Coordinates
   */
  geocode: async (placeId: string): Promise<LocationCoordinates> => {
    // Default Bandra coordinates
    const defaultCoords = { latitude: 19.0607, longitude: 72.8362 };

    if (!env.GOOGLE_MAPS_API_KEY || env.GOOGLE_MAPS_API_KEY.includes('your')) {
      if (placeId === 'place_carter') return { latitude: 19.0664, longitude: 72.8223 };
      if (placeId === 'place_bkc') return { latitude: 19.0617, longitude: 72.8717 };
      return defaultCoords;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${placeId}&key=${env.GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json() as any;
      if (data.results && data.results[0]) {
        const { lat, lng } = data.results[0].geometry.location;
        return { latitude: lat, longitude: lng };
      }
      return defaultCoords;
    } catch (e) {
      console.error('Google Geocode failed', e);
      return defaultCoords;
    }
  },

  /**
   * Calculate distance between Bandra Kitchen Hub (19.0607, 72.8362) and customer coordinates
   * Using Haversine formula
   */
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // distance in km
  },

  /**
   * Verify if coords fall within allowed delivery radius (e.g., 8km)
   */
  validateDeliveryRadius: (customerLat: number, customerLon: number, maxRadiusKm = 8): { allowed: boolean; distance: number } => {
    const hubLat = 19.0607; // Bandra West
    const hubLon = 72.8362;
    const distance = mapsService.calculateDistance(hubLat, hubLon, customerLat, customerLon);
    return {
      allowed: distance <= maxRadiusKm,
      distance,
    };
  },

  /**
   * Calculate delivery charges: Flat ₹50 up to 4km, ₹15 per km after, free above ₹1000 subtotal
   */
  calculateDeliveryFee: (distance: number, subtotal: number): number => {
    if (subtotal >= 1000) return 0;
    if (distance <= 4) return 50;
    return 50 + Math.ceil(distance - 4) * 15;
  },
};
