/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface Window {
  google: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: { credential: string }) => void;
        }) => void;
        renderButton: (element: HTMLElement, options: object) => void;
      };
    };
  };
}
