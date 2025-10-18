export {};

declare global {
  interface GoogleCredentialResponse {
    credential: string;
    select_by?: string;
    clientId?: string;
  }

  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            cancel_on_tap_outside?: boolean;
            auto_select?: boolean;
          }) => void;
          renderButton: (element: HTMLElement, options: {
            type?: string;
            theme?: string;
            size?: string;
            text?: string;
            shape?: string;
            width?: number | string;
            logo_alignment?: string;
          }) => void;
          prompt?: (notificationCallback?: (notification: unknown) => void) => void;
          cancel?: () => void;
        };
      };
    };
  }
}
