// bertui/types/config.d.ts - CLEANED
declare module 'bertui/config' {
  export interface BertuiConfig {
    siteName?: string;
    baseUrl?: string;
    
    meta?: {
      title?: string;
      description?: string;
      keywords?: string;
      author?: string;
      ogImage?: string;
      ogTitle?: string;
      ogDescription?: string;
      themeColor?: string;
      lang?: string;
    };
    
    appShell?: {
      loading?: boolean;
      loadingText?: string;
      backgroundColor?: string;
    };
    
    robots?: {
      disallow?: string[];
      crawlDelay?: number;
    };
  }

  export const defaultConfig: BertuiConfig;
  export function loadConfig(root: string): Promise<BertuiConfig>;
}