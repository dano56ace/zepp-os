// Global DOM / Browser augmentations
interface EventTarget {
  files?: FileList | null;
}

// Lucide Icons
declare module 'lucide-react' {
  import * as React from 'react';
  export interface LucideProps {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    className?: string;
    [key: string]: any;
  }
  export type LucideIcon = React.FC<LucideProps>;

  export const Activity: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const Archive: LucideIcon;
  export const ArrowDownCircle: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const BarChart3: LucideIcon;
  export const Battery: LucideIcon;
  export const BatteryCharging: LucideIcon;
  export const BookOpen: LucideIcon;
  export const Check: LucideIcon;
  export const CheckCheck: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const Clock: LucideIcon;
  export const Copy: LucideIcon;
  export const Cpu: LucideIcon;
  export const Download: LucideIcon;
  export const DownloadCloud: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const Eye: LucideIcon;
  export const FileCode: LucideIcon;
  export const FileJson: LucideIcon;
  export const FileOutput: LucideIcon;
  export const FileText: LucideIcon;
  export const Filter: LucideIcon;
  export const Flame: LucideIcon;
  export const FolderSync: LucideIcon;
  export const FolderTree: LucideIcon;
  export const Gauge: LucideIcon;
  export const GitCompare: LucideIcon;
  export const HardDrive: LucideIcon;
  export const HelpCircle: LucideIcon;
  export const Image: LucideIcon;
  export const Info: LucideIcon;
  export const Layers: LucideIcon;
  export const Leaf: LucideIcon;
  export const Loader2: LucideIcon;
  export const Maximize2: LucideIcon;
  export const Moon: LucideIcon;
  export const Package: LucideIcon;
  export const Play: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const RotateCcw: LucideIcon;
  export const RotateCw: LucideIcon;
  export const Search: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const Sliders: LucideIcon;
  export const SlidersHorizontal: LucideIcon;
  export const Smartphone: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Sun: LucideIcon;
  export const Terminal: LucideIcon;
  export const Timer: LucideIcon;
  export const Trash2: LucideIcon;
  export const TrendingDown: LucideIcon;
  export const UploadCloud: LucideIcon;
  export const Watch: LucideIcon;
  export const Wrench: LucideIcon;
  export const X: LucideIcon;
  export const XCircle: LucideIcon;
  export const Zap: LucideIcon;
}

// JSZip
declare module 'jszip' {
  export interface JSZipFile {
    name: string;
    dir: boolean;
    date: Date;
    async(type: 'string' | 'text'): Promise<string>;
    async(type: 'arraybuffer'): Promise<ArrayBuffer>;
    async(type: 'uint8array'): Promise<Uint8Array>;
    async(type: 'blob'): Promise<Blob>;
    async(type: 'nodebuffer'): Promise<any>;
    async(type: string): Promise<any>;
  }

  export interface JSZipObject {
    [key: string]: any;
  }

  export default class JSZip {
    constructor();
    static loadAsync(data: any, options?: any): Promise<JSZip>;
    loadAsync(data: any, options?: any): Promise<JSZip>;
    file(path: string | RegExp): JSZipFile | null;
    file(path: string, data: any, options?: any): this;
    folder(name: string | RegExp): JSZip | null;
    forEach(callback: (relativePath: string, file: JSZipFile) => void): void;
    generateAsync(options?: any, onUpdate?: (metadata: any) => void): Promise<any>;
    remove(path: string): this;
    files: { [path: string]: JSZipFile };
  }
}

// jsPDF
declare module 'jspdf' {
  export class jsPDF {
    constructor(options?: any);
    internal: any;
    setFontSize(size: number): this;
    setFont(fontName?: string, fontStyle?: string): this;
    setTextColor(ch1: number | string, ch2?: number, ch3?: number): this;
    text(text: string | string[], x: number, y: number, options?: any): this;
    line(x1: number, y1: number, x2: number, y2: number): this;
    rect(x: number, y: number, w: number, h: number, style?: string): this;
    addPage(): this;
    output(type?: string, options?: any): any;
    save(filename?: string): void;
    [key: string]: any;
  }
  export default jsPDF;
}

// Canvas Confetti
declare module 'canvas-confetti' {
  export interface ConfettiOptions {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    shapes?: string[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }
  export default function confetti(options?: ConfettiOptions): Promise<null> | null;
}

// Build & Config Tool Modules
declare module '@tailwindcss/vite' {
  export default function tailwindcss(): any;
}

declare module '@vitejs/plugin-react' {
  export default function react(options?: any): any;
}

declare module 'vite' {
  export interface UserConfig {
    [key: string]: any;
  }
  export function defineConfig(config: UserConfig | ((env: any) => UserConfig)): any;
  export interface Plugin {
    name: string;
    [key: string]: any;
  }
}

declare module 'vitest/config' {
  export interface UserConfig {
    [key: string]: any;
  }
  export function defineConfig(config: UserConfig | (() => UserConfig)): any;
  export default defineConfig;
}
