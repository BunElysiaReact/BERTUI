// bertui/types/index.d.ts

// Import React types
import React from 'react';

declare global {
  // Global React namespace
  namespace React {
    type ReactNode = import('react').ReactNode;
  }
  
  // JSX namespace
  namespace JSX {
    type Element = React.ReactElement;
    interface ElementClass extends React.Component<any> {
      render(): React.ReactNode;
    }
    interface ElementAttributesProperty {
      props: {};
    }
    interface ElementChildrenAttribute {
      children: {};
    }
    
    interface IntrinsicElements {
      // HTML elements
      a: React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>;
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      span: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
      h1: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h2: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h3: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h4: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h5: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h6: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      p: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
      img: React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;
      button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
      input: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
      textarea: React.DetailedHTMLProps<React.TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>;
      form: React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;
      label: React.DetailedHTMLProps<React.LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement>;
      select: React.DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>;
      option: React.DetailedHTMLProps<React.OptionHTMLAttributes<HTMLOptionElement>, HTMLOptionElement>;
      ul: React.DetailedHTMLProps<React.HTMLAttributes<HTMLUListElement>, HTMLUListElement>;
      ol: React.DetailedHTMLProps<React.HTMLAttributes<HTMLOListElement>, HTMLOListElement>;
      li: React.DetailedHTMLProps<React.HTMLAttributes<HTMLLIElement>, HTMLLIElement>;
      table: React.DetailedHTMLProps<React.TableHTMLAttributes<HTMLTableElement>, HTMLTableElement>;
      tr: React.DetailedHTMLProps<React.HTMLAttributes<HTMLTableRowElement>, HTMLTableRowElement>;
      td: React.DetailedHTMLProps<React.TdHTMLAttributes<HTMLTableDataCellElement>, HTMLTableDataCellElement>;
      th: React.DetailedHTMLProps<React.ThHTMLAttributes<HTMLTableHeaderCellElement>, HTMLTableHeaderCellElement>;
      header: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      footer: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      nav: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      main: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      section: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      article: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      aside: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      
      // SVG elements
      svg: React.SVGProps<SVGSVGElement>;
      path: React.SVGProps<SVGPathElement>;
      circle: React.SVGProps<SVGCircleElement>;
      rect: React.SVGProps<SVGRectElement>;
      
      // Allow any other element with generic props
      [elemName: string]: any;
    }
  }
  
  // Global React variable for JSX transform
  const React: typeof import('react');
}

declare module 'bertui' {
  import { BertuiConfig } from 'bertui/config';
  import React from 'react';
  
  /**
   * Logger utility
   */
  export interface Logger {
    info(message: string): void;
    success(message: string): void;
    warn(message: string): void;
    error(message: string): void;
    debug(message: string): void;
    bigLog(message: string, options?: { color?: string }): void;
    table(data: any[]): void;
  }

  /**
   * Build options
   */
  export interface BuildOptions {
    /** Project root directory */
    root?: string;
  }

  /**
   * Dev server options
   */
  export interface DevOptions {
    /** Server port */
    port?: number;
    /** Project root directory */
    root?: string;
  }

  /**
   * Compile options
   */
  export interface CompileOptions {
    /** Project root directory */
    root?: string;
  }

  /**
   * Logger instance
   */
  export const logger: Logger;

  /**
   * Default configuration
   */
  export const defaultConfig: BertuiConfig;

  /**
   * Load configuration
   */
  export function loadConfig(root: string): Promise<BertuiConfig>;

  /**
   * Start development server
   */
  export function startDev(options?: DevOptions): Promise<void>;

  /**
   * Build for production
   */
  export function buildProduction(options?: BuildOptions): Promise<void>;

  /**
   * Compile project
   */
  export function compileProject(root: string): Promise<{
    outDir: string;
    stats: { files: number; skipped: number };
    routes: any[];
  }>;

  /**
   * CLI program
   */
  export function program(): void;

  /**
   * BertUI version
   */
  export const version: string;
}

// Global declarations for Server Islands
declare global {
  /**
   * Mark a page component as a Server Island (SSG)
   * Add this export to any page to enable static generation:
   * 
   * @example
   * ```tsx
   * export const render = "server";
   * ```
   */
  export const render: "server" | "client";
}

export {};