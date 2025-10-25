import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { permissionService } from './permissionService';

export class CameraService {
  private static instance: CameraService;
  private isNative: boolean;

  private constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  public static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  /**
   * Check if camera is available
   */
  async isCameraAvailable(): Promise<boolean> {
    if (!this.isNative) {
      return false;
    }

    try {
      // Check if camera permission is granted
      const permissions = await permissionService.checkAllPermissions();
      return permissions.camera.granted;
    } catch (error) {
      console.error('Error checking camera availability:', error);
      return false;
    }
  }

  /**
   * Take a photo using device camera
   */
  async takePhoto(): Promise<File | null> {
    if (!this.isNative) {
      console.warn('Camera functionality only available on native platforms');
      return null;
    }

    try {
      // Check camera permission first
      const hasCameraPermission = await this.isCameraAvailable();
      if (!hasCameraPermission) {
        // Try to request camera permission
        const granted = await permissionService.requestPermission('android.permission.CAMERA');
        if (!granted) {
          throw new Error('Camera permission denied');
        }
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        saveToGallery: false,
        correctOrientation: true,
        width: 1024,
        height: 1024
      });

      if (!image.dataUrl) {
        throw new Error('No image data received from camera');
      }

      // Convert data URL to File
      const file = await this.dataUrlToFile(image.dataUrl, 'camera-photo.jpg');
      return file;
    } catch (error) {
      console.error('Error taking photo:', error);
      throw error;
    }
  }

  /**
   * Select image from gallery
   */
  async selectFromGallery(): Promise<File | null> {
    if (!this.isNative) {
      console.warn('Gallery functionality only available on native platforms');
      return null;
    }

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        correctOrientation: true,
        width: 1024,
        height: 1024
      });

      if (!image.dataUrl) {
        throw new Error('No image data received from gallery');
      }

      // Convert data URL to File
      const file = await this.dataUrlToFile(image.dataUrl, 'gallery-photo.jpg');
      return file;
    } catch (error) {
      console.error('Error selecting from gallery:', error);
      throw error;
    }
  }

  /**
   * Convert data URL to File object
   */
  private async dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type });
  }

  /**
   * Request camera permission
   */
  async requestCameraPermission(): Promise<boolean> {
    if (!this.isNative) {
      return true; // Web doesn't need explicit permission
    }

    try {
      const granted = await permissionService.requestPermission('android.permission.CAMERA');
      return granted;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  }

  /**
   * Get optimal camera settings for product photos
   */
  getProductPhotoSettings() {
    return {
      quality: 85,
      allowEditing: true,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      saveToGallery: false,
      correctOrientation: true,
      width: 1200,
      height: 1200
    };
  }
}

export const cameraService = CameraService.getInstance();