import { Capacitor } from '@capacitor/core';
import { registerPlugin } from '@capacitor/core';

export interface SmsMessage {
  id: string;
  address: string;
  body: string;
  date: number;
  read: boolean;
  status: number;
  type: number;
}

export interface SmsReadOptions {
  maxResults?: number;
  filter?: string;
  box?: 'inbox' | 'sent' | 'draft' | 'outbox' | 'failed' | 'queued';
  read?: boolean;
}

export interface SmsReaderPlugin {
  checkPermission(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<{ granted: boolean }>;
  readSmsMessages(options: SmsReadOptions): Promise<{ messages: SmsMessage[] }>;
  getRecentSmsMessages(options: { count: number }): Promise<{ messages: SmsMessage[] }>;
}

const SmsReader = registerPlugin<SmsReaderPlugin>('SmsReader');

export class SmsService {
  private static instance: SmsService;
  private isNative: boolean;

  private constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  public static getInstance(): SmsService {
    if (!SmsService.instance) {
      SmsService.instance = new SmsService();
    }
    return SmsService.instance;
  }

  /**
   * Check if the app has SMS read permissions
   */
  async hasReadPermission(): Promise<boolean> {
    if (!this.isNative) {
      console.warn('SMS reading is only available on native platforms');
      return false;
    }

    try {
      // Use our custom SMS plugin
      const result = await SmsReader.checkPermission();
      return result.granted;
    } catch (error) {
      console.error('Error checking SMS permissions:', error);
      return false;
    }
  }

  /**
   * Request SMS read permissions
   */
  async requestReadPermission(): Promise<boolean> {
    if (!this.isNative) {
      console.warn('SMS reading is only available on native platforms');
      return false;
    }

    try {
      // Use our custom SMS plugin
      const result = await SmsReader.requestPermission();
      return result.granted;
    } catch (error) {
      console.error('Error requesting SMS permissions:', error);
      return false;
    }
  }

  /**
   * Read SMS messages from the device
   */
  async readSmsMessages(options: SmsReadOptions = {}): Promise<SmsMessage[]> {
    if (!this.isNative) {
      console.warn('SMS reading is only available on native platforms');
      return [];
    }

    const hasPermission = await this.hasReadPermission();
    if (!hasPermission) {
      const granted = await this.requestReadPermission();
      if (!granted) {
        throw new Error('SMS read permission denied');
      }
    }

    try {
      // For now, we'll implement this as a native bridge call
      // This would require implementing a native Android method
      const result = await this.callNativeSmsReader(options);
      return result;
    } catch (error) {
      console.error('Error reading SMS messages:', error);
      throw error;
    }
  }

  /**
   * Read the most recent SMS messages (useful for OTP detection)
   */
  async getRecentSmsMessages(count: number = 10): Promise<SmsMessage[]> {
    return this.readSmsMessages({
      maxResults: count,
      box: 'inbox'
    });
  }

  /**
   * Filter SMS messages for OTP-like content
   */
  filterOtpMessages(messages: SmsMessage[]): SmsMessage[] {
    const otpPatterns = [
      /\b\d{4,8}\b/g, // 4-8 digit codes
      /code\s*:?\s*\d+/gi,
      /otp\s*:?\s*\d+/gi,
      /verification\s*:?\s*\d+/gi,
      /\bcode\b.*\d+/gi
    ];

    return messages.filter(message => {
      return otpPatterns.some(pattern => pattern.test(message.body));
    });
  }

  /**
   * Extract OTP code from SMS message
   */
  extractOtpFromMessage(message: string): string | null {
    // Try different OTP patterns
    const patterns = [
      /\b(\d{4,8})\b/g, // 4-8 digit codes
      /code\s*:?\s*(\d+)/gi,
      /otp\s*:?\s*(\d+)/gi,
      /verification\s*:?\s*(\d+)/gi
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(message);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Monitor for new SMS messages (for automatic OTP detection)
   */
  async startSmsMonitoring(callback: (message: SmsMessage) => void): Promise<void> {
    if (!this.isNative) {
      console.warn('SMS monitoring is only available on native platforms');
      return;
    }

    // This would require implementing a native SMS receiver
    // For now, we'll poll for new messages
    setInterval(async () => {
      try {
        const recentMessages = await this.getRecentSmsMessages(5);
        const newMessages = recentMessages.filter(msg => 
          Date.now() - msg.date < 60000 // Messages from last minute
        );
        
        newMessages.forEach(callback);
      } catch (error) {
        console.error('Error monitoring SMS:', error);
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Send SMS to backend for processing (bank SMS notifications)
   */
  async sendSmsToBackend(smsText: string, userId?: string): Promise<void> {
    try {
      const response = await fetch('/api/webhooks/bank-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': 'dev-secret' // This should come from config
        },
        body: JSON.stringify({
          sms: smsText,
          userId: userId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send SMS to backend: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending SMS to backend:', error);
      throw error;
    }
  }

  /**
   * Private method to call native SMS reader
   * This would be implemented as a Capacitor plugin
   */
  private async callNativeSmsReader(options: SmsReadOptions): Promise<SmsMessage[]> {
    try {
      const result = await SmsReader.readSmsMessages(options);
      return result.messages;
    } catch (error) {
      console.error('Error calling native SMS reader:', error);
      return [];
    }
  }
}

export const smsService = SmsService.getInstance();