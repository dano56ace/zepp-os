export interface KnownDevice {
  code: string;
  name: string;
  shape: 'round' | 'square' | 'rectangle';
  resolution: string;
  width: number;
  height: number;
}

export const KNOWN_ZEPP_DEVICES: Record<string, KnownDevice> = {
  // Core 11 Universal Target Devices
  '0x00000079': { code: '0x00000079', name: 'Amazfit Balance', shape: 'round', resolution: '480x480', width: 480, height: 480 },
  '0x0000007b': { code: '0x0000007B', name: 'Amazfit Cheetah', shape: 'round', resolution: '454x454', width: 454, height: 454 },
  '0x0000007c': { code: '0x0000007C', name: 'Amazfit Cheetah Pro', shape: 'round', resolution: '480x480', width: 480, height: 480 },
  '0x00000072': { code: '0x00000072', name: 'Amazfit Falcon', shape: 'round', resolution: '416x416', width: 416, height: 416 },
  '0x00000059': { code: '0x00000059', name: 'Amazfit GTR 3', shape: 'round', resolution: '454x454', width: 454, height: 454 },
  '0x0000005a': { code: '0x0000005A', name: 'Amazfit GTR 3 Pro', shape: 'round', resolution: '480x480', width: 480, height: 480 },
  '0x00000067': { code: '0x00000067', name: 'Amazfit GTR 4', shape: 'round', resolution: '466x466', width: 466, height: 466 },
  '0x00000069': { code: '0x00000069', name: 'Amazfit T-Rex 2', shape: 'round', resolution: '454x454', width: 454, height: 454 },
  '0x00000073': { code: '0x00000073', name: 'Amazfit T-Rex Ultra', shape: 'round', resolution: '454x454', width: 454, height: 454 },
  '0x00000078': { code: '0x00000078', name: 'Amazfit Active', shape: 'square', resolution: '390x450', width: 390, height: 450 },
  '0x0000007a': { code: '0x0000007A', name: 'Amazfit Active Edge', shape: 'round', resolution: '360x360', width: 360, height: 360 },

  // Expanded Zepp OS 1.0, 2.0, 3.x & 4.0 Hardware Models
  '0x00000092': { code: '0x00000092', name: 'Amazfit Balance 2', shape: 'round', resolution: '480x480', width: 480, height: 480 },
  '0x00000093': { code: '0x00000093', name: 'Amazfit Balance 2 Pro', shape: 'round', resolution: '480x480', width: 480, height: 480 },
  '0x0000008f': { code: '0x0000008F', name: 'Amazfit T-Rex 3', shape: 'round', resolution: '480x480', width: 480, height: 480 },
  '0x00000090': { code: '0x00000090', name: 'Amazfit T-Rex 3 (Global)', shape: 'round', resolution: '480x480', width: 480, height: 480 },
  '0x00000062': { code: '0x00000062', name: 'Amazfit GTR 4', shape: 'round', resolution: '466x466', width: 466, height: 466 },
  '0x00000068': { code: '0x00000068', name: 'Amazfit GTR 4 Limited', shape: 'round', resolution: '466x466', width: 466, height: 466 },
  '0x00000063': { code: '0x00000063', name: 'Amazfit GTS 4', shape: 'square', resolution: '390x450', width: 390, height: 450 },
  '0x0000006a': { code: '0x0000006A', name: 'Amazfit GTS 4 (Global)', shape: 'square', resolution: '390x450', width: 390, height: 450 },
  '0x00000064': { code: '0x00000064', name: 'Amazfit GTS 4 Mini', shape: 'square', resolution: '336x384', width: 336, height: 384 },
  '0x00000065': { code: '0x00000065', name: 'Amazfit GTR Mini', shape: 'round', resolution: '416x416', width: 416, height: 416 },
  '0x0000007d': { code: '0x0000007D', name: 'Amazfit Cheetah (Square)', shape: 'square', resolution: '390x450', width: 390, height: 450 },
  '0x00000085': { code: '0x00000085', name: 'Amazfit Active', shape: 'square', resolution: '390x450', width: 390, height: 450 },
  '0x00000086': { code: '0x00000086', name: 'Amazfit Active Edge', shape: 'round', resolution: '360x360', width: 360, height: 360 },
  '0x00000095': { code: '0x00000095', name: 'Amazfit Active 2', shape: 'round', resolution: '466x466', width: 466, height: 466 },
  '0x00000088': { code: '0x00000088', name: 'Amazfit Bip 5', shape: 'rectangle', resolution: '320x380', width: 320, height: 380 },
  '0x00000089': { code: '0x00000089', name: 'Amazfit Bip 5 Unity', shape: 'rectangle', resolution: '320x380', width: 320, height: 380 },
  '0x0000005e': { code: '0x0000005E', name: 'Amazfit Band 7', shape: 'rectangle', resolution: '194x368', width: 194, height: 368 },
  '0x00000050': { code: '0x00000050', name: 'Amazfit GTR 3 Pro', shape: 'round', resolution: '480x480', width: 480, height: 480 },
  '0x0000004f': { code: '0x0000004F', name: 'Amazfit GTR 3', shape: 'round', resolution: '454x454', width: 454, height: 454 },
  '0x00000051': { code: '0x00000051', name: 'Amazfit GTS 3', shape: 'square', resolution: '390x450', width: 390, height: 450 },
  '0x0000005b': { code: '0x0000005B', name: 'Amazfit T-Rex 2', shape: 'round', resolution: '454x454', width: 454, height: 454 },
};

const DESIGN_WIDTH_RESOLUTION_MAP: Record<number, { width: number; height: number; shape: 'round' | 'square' | 'rectangle' }> = {
  480: { width: 480, height: 480, shape: 'round' },
  466: { width: 466, height: 466, shape: 'round' },
  454: { width: 454, height: 454, shape: 'round' },
  416: { width: 416, height: 416, shape: 'round' },
  390: { width: 390, height: 450, shape: 'square' },
  360: { width: 360, height: 360, shape: 'round' },
  336: { width: 336, height: 384, shape: 'square' },
  320: { width: 320, height: 380, shape: 'rectangle' },
  194: { width: 194, height: 368, shape: 'rectangle' },
};

export function resolveDeviceNames(devices?: string[] | number[]): string[] {
  if (!devices || devices.length === 0) return ['Amazfit Balance & Zepp OS Devices'];
  
  return devices.map((dev) => {
    const hex = typeof dev === 'number' 
      ? '0x' + dev.toString(16).padStart(8, '0').toLowerCase()
      : String(dev).toLowerCase();
    
    if (KNOWN_ZEPP_DEVICES[hex]) {
      return KNOWN_ZEPP_DEVICES[hex].name;
    }
    return `Device (${hex})`;
  });
}

export function resolveDeviceDetails(
  devices?: string[] | number[],
  designWidth?: number
): {
  names: string[];
  primaryShape: 'round' | 'square' | 'rectangle';
  primaryResolution: string;
  width: number;
  height: number;
} {
  const names = resolveDeviceNames(devices);
  let primaryShape: 'round' | 'square' | 'rectangle' = 'round';
  let width = 480;
  let height = 480;
  let foundFromDevice = false;

  if (devices && devices.length > 0) {
    for (const dev of devices) {
      const hex = typeof dev === 'number' 
        ? '0x' + dev.toString(16).padStart(8, '0').toLowerCase()
        : String(dev).toLowerCase();
      if (KNOWN_ZEPP_DEVICES[hex]) {
        primaryShape = KNOWN_ZEPP_DEVICES[hex].shape;
        width = KNOWN_ZEPP_DEVICES[hex].width;
        height = KNOWN_ZEPP_DEVICES[hex].height;
        foundFromDevice = true;
        break;
      }
    }
  }

  // If manifest explicitly specifies a native designWidth, honor it when device list was empty or generic
  if (typeof designWidth === 'number' && designWidth > 0) {
    const mapped = DESIGN_WIDTH_RESOLUTION_MAP[designWidth];
    if (mapped && (!foundFromDevice || width === 480)) {
      width = mapped.width;
      height = mapped.height;
      primaryShape = mapped.shape;
    } else if (!foundFromDevice) {
      width = designWidth;
      height = designWidth;
    }
  }

  const primaryResolution = `${width}x${height} (${primaryShape.toUpperCase()})`;
  return { names, primaryShape, primaryResolution, width, height };
}


