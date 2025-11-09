import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface LocationInfo {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  timestamp: number;
}

export interface ReverseGeocodeResult {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  district?: string;
}

export class LocationService {
  private static instance: LocationService;
  private isNative: boolean;
  private cachedLocation: LocationInfo | null = null;
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Get current device location with high precision
   */
  async getCurrentLocation(): Promise<LocationInfo> {
    // Return cached location if recent
    if (this.cachedLocation && 
        Date.now() - this.cachedLocation.timestamp < this.cacheTimeout) {
      return this.cachedLocation;
    }

    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000 // 1 minute
      });

      const location: LocationInfo = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      };

      // Get address details
      const addressInfo = await this.reverseGeocode(
        location.latitude, 
        location.longitude
      );

      location.address = addressInfo.address;
      location.city = addressInfo.city;
      location.state = addressInfo.state;
      location.country = addressInfo.country;

      // Cache the location
      this.cachedLocation = location;

      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      throw new Error(`Failed to get location: ${error}`);
    }
  }

  /**
   * Get location with fallback to less precise methods
   */
  async getLocationWithFallback(): Promise<LocationInfo> {
    try {
      // Try high accuracy first
      return await this.getCurrentLocation();
    } catch (error) {
      console.warn('High accuracy location failed, trying low accuracy:', error);
      
      try {
        // Fallback to lower accuracy
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 30000,
          maximumAge: 300000 // 5 minutes
        });

        const location: LocationInfo = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };

        // Still try to get address
        try {
          const addressInfo = await this.reverseGeocode(
            location.latitude, 
            location.longitude
          );
          
          location.address = addressInfo.address;
          location.city = addressInfo.city;
          location.state = addressInfo.state;
          location.country = addressInfo.country;
        } catch (addressError) {
          console.warn('Failed to get address for location:', addressError);
          location.city = 'Unknown Location';
        }

        return location;
      } catch (fallbackError) {
        console.error('All location methods failed:', fallbackError);
        throw new Error('Unable to determine device location');
      }
    }
  }

  /**
   * Convert coordinates to human-readable address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResult> {
    try {
      // Using OpenStreetMap Nominatim API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'TechTorio-Mobile-App'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || !data.address) {
        throw new Error('No address data found');
      }

      const address = data.address;
      
      return {
        address: data.display_name || 'Unknown Address',
        city: address.city || address.town || address.village || address.hamlet || 'Unknown City',
        state: address.state || address.province || address.region || 'Unknown State',
        country: address.country || 'Unknown Country',
        postalCode: address.postcode,
        district: address.county || address.district
      };
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      
      // Fallback to basic coordinates display
      return {
        address: `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        city: 'Location Available',
        state: 'Coordinates Only',
        country: 'Unknown'
      };
    }
  }

  /**
   * Get location for device login notification
   */
  async getLocationForDeviceNotification(): Promise<string> {
    try {
      const location = await this.getLocationWithFallback();
      
      if (location.city && location.state && location.country) {
        return `${location.city}, ${location.state}, ${location.country}`;
      } else if (location.city && location.country) {
        return `${location.city}, ${location.country}`;
      } else if (location.city) {
        return location.city;
      } else {
        return `Lat: ${location.latitude.toFixed(4)}, Lng: ${location.longitude.toFixed(4)}`;
      }
    } catch (error) {
      console.error('Failed to get location for notification:', error);
      return 'Unknown Location';
    }
  }

  /**
   * Check if location services are available
   */
  async isLocationAvailable(): Promise<boolean> {
    if (!this.isNative) {
      // On web, check if geolocation is supported
      return 'geolocation' in navigator;
    }

    try {
      // Check location permission
      const permissions = await Geolocation.checkPermissions();
      return permissions.location === 'granted' || permissions.location === 'prompt';
    } catch (error) {
      console.error('Error checking location availability:', error);
      return false;
    }
  }

  /**
   * Request location permissions
   */
  async requestLocationPermission(): Promise<boolean> {
    if (!this.isNative) {
      return true; // Web handles permissions automatically
    }

    try {
      const permissions = await Geolocation.requestPermissions();
      return permissions.location === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  /**
   * Get distance between two locations in kilometers
   */
  calculateDistance(
    lat1: number, lon1: number, 
    lat2: number, lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Clear cached location (force fresh location on next request)
   */
  clearLocationCache(): void {
    this.cachedLocation = null;
  }
}

export const locationService = LocationService.getInstance();