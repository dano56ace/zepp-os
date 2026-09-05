export interface KnownDevice {
  code: string;
  name: string;
  shape: 'round' | 'square' | 'rectangle';
  resolution: string;
}

export const KNOWN_ZEPP_DEVICES: Record<string, KnownDevice> = {
  // 11 Universal Target Devices
  '0x00000079': { code: '0x00000079', name: 'Amazfit Balance', shape: 'round', resolution: '480x480' },
  '0x0000007b': { code: '0x0000007B', name: 'Amazfit Cheetah', shape: 'round', resolution: '454x454' },
  '0x0000007c': { code: '0x0000007C', name: 'Amazfit Cheetah Pro', shape: 'round', resolution: '480x480' },
  '0x00000072': { code: '0x00000072', name: 'Amazfit Falcon', shape: 'round', resolution: '416x416' },
  '0x00000059': { code: '0x00000059', name: 'Amazfit GTR 3', shape: 'round', resolution: '454x454' },
  '0x0000005a': { code: '0x0000005A', name: 'Amazfit GTR 3 Pro', shape: 'round', resolution: '480x480' },
  '0x00000067': { code: '0x00000067', name: 'Amazfit GTR 4', shape: 'round', resolution: '466x466' },
  '0x00000069': { code: '0x00000069', name: 'Amazfit T-Rex 2', shape: 'round', resolution: '454x454' },
  '0x00000073': { code: '0x00000073', name: 'Amazfit T-Rex Ultra', shape: 'round', resolution: '454x454' },
  '0x00000078': { code: '0x00000078', name: 'Amazfit Active', shape: 'square', resolution: '390x450' },
  '0x0000007a': { code: '0x0000007A', name: 'Amazfit Active Edge', shape: 'round', resolution: '360x360' },

  // Additional recognized models
  '0x00000092': { code: '0x00000092', name: 'Amazfit Balance 2', shape: 'round', resolution: '480x480' },
  '0x00000093': { code: '0x00000093', name: 'Amazfit Balance 2 Pro', shape: 'round', resolution: '480x480' },
  '0x00000062': { code: '0x00000062', name: 'Amazfit GTR 4', shape: 'round', resolution: '466x466' },
  '0x00000063': { code: '0x00000063', name: 'Amazfit GTS 4', shape: 'square', resolution: '390x450' },
  '0x00000064': { code: '0x00000064', name: 'Amazfit GTS 4 Mini', shape: 'square', resolution: '336x384' },
  '0x0000007d': { code: '0x0000007D', name: 'Amazfit Cheetah (Square)', shape: 'square', resolution: '390x450' },
  '0x00000085': { code: '0x00000085', name: 'Amazfit Active', shape: 'square', resolution: '390x450' },
  '0x00000086': { code: '0x00000086', name: 'Amazfit Active Edge', shape: 'round', resolution: '360x360' },
  '0x00000088': { code: '0x00000088', name: 'Amazfit Bip 5', shape: 'rectangle', resolution: '320x380' },
  '0x00000089': { code: '0x00000089', name: 'Amazfit Bip 5 Unity', shape: 'rectangle', resolution: '320x380' },
  '0x0000008f': { code: '0x0000008F', name: 'Amazfit T-Rex 3', shape: 'round', resolution: '480x480' },
  '0x0000005e': { code: '0x0000005E', name: 'Amazfit Band 7', shape: 'rectangle', resolution: '194x368' },
  '0x00000050': { code: '0x00000050', name: 'Amazfit GTR 3 Pro', shape: 'round', resolution: '480x480' },
  '0x0000004f': { code: '0x0000004F', name: 'Amazfit GTR 3', shape: 'round', resolution: '454x454' },
  '0x00000051': { code: '0x00000051', name: 'Amazfit GTS 3', shape: 'square', resolution: '390x450' },
  '0x0000005b': { code: '0x0000005B', name: 'Amazfit T-Rex 2', shape: 'round', resolution: '454x454' },
};

export function resolveDeviceNames(devices?: string[] | number[]): string[] {
  if (!devices || devices.length === 0) return ['Amazfit Balance & Zepp OS Devices'];
  
  return devices.map((dev) => {
    const hex = typeof dev === 'number' 
      ? '0x' + dev.toString(16).padStart(8, '0').toLowerCase()
      : dev.toLowerCase();
    
    if (KNOWN_ZEPP_DEVICES[hex]) {
      return KNOWN_ZEPP_DEVICES[hex].name;
    }
    return `Device (${hex})`;
  });
}

export function resolveDeviceDetails(devices?: string[] | number[]): {
  names: string[];
  primaryShape: 'round' | 'square' | 'rectangle';
  primaryResolution: string;
} {
  if (!devices || devices.length === 0) {
    return {
      names: ['Amazfit Balance & Zepp OS Devices'],
      primaryShape: 'round',
      primaryResolution: '480x480 (Round AMOLED)'
    };
  }

  const names = resolveDeviceNames(devices);
  let primaryShape: 'round' | 'square' | 'rectangle' = 'round';
  let primaryResolution = '480x480';

  for (const dev of devices) {
    const hex = typeof dev === 'number' 
      ? '0x' + dev.toString(16).padStart(8, '0').toLowerCase()
      : dev.toLowerCase();
    if (KNOWN_ZEPP_DEVICES[hex]) {
      primaryShape = KNOWN_ZEPP_DEVICES[hex].shape;
      primaryResolution = `${KNOWN_ZEPP_DEVICES[hex].resolution} (${KNOWN_ZEPP_DEVICES[hex].shape.toUpperCase()})`;
      break;
    }
  }

  return { names, primaryShape, primaryResolution };
}

