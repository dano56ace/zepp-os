import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import {
  convertWatchfacePackage,
  repatchAodManifestErrors,
  stripBom,
  normalizeZipEntryPaths,
  UNIVERSAL_TARGET_DEVICES
} from '../../src/utils/converter.ts';
import { DEFAULT_CONVERSION_OPTIONS, WatchfaceFileItem } from '../../src/types.ts';

// In-memory helper to build test watchfaces
async function buildTestZip(options: {
  manifest?: any;
  manifestString?: string;
  files?: Record<string, string | Uint8Array>;
}): Promise<Buffer> {
  const zip = new JSZip();
  if (options.manifestString !== undefined) {
    zip.file('app.json', options.manifestString);
  } else if (options.manifest) {
    zip.file('app.json', JSON.stringify(options.manifest, null, 2));
  }

  if (options.files) {
    for (const [filePath, content] of Object.entries(options.files)) {
      zip.file(filePath, content);
    }
  }

  return await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

describe('Milestone 2: Manifest Modernization & Asset Mirroring', () => {
  const sample1x1Png = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
  ]);

  it('Unit: stripBom correctly strips leading \\uFEFF and leaves non-BOM strings unchanged', () => {
    expect(stripBom('\uFEFF{"test": 1}')).toBe('{"test": 1}');
    expect(stripBom('{"test": 1}')).toBe('{"test": 1}');
    expect(stripBom('')).toBe('');
  });

  it('Feature 5 & 6: Migrates schema to configVersion v2, injects designWidth, cover, and hightCost: 0', async () => {
    const legacyManifest = {
      configVersion: 'v1',
      app: { appId: 12345, appName: 'Legacy WF' },
      module: {
        watchface: { path: 'watchface/index' }
      }
    };

    const zipBuffer = await buildTestZip({
      manifest: legacyManifest,
      files: {
        'watchface/index.js': 'console.log("wf");',
        'assets/preview.png': sample1x1Png,
        'assets/0000.png': sample1x1Png
      }
    });

    const file = new File([new Uint8Array(zipBuffer)], 'legacy.zip', { type: 'application/zip' });
    const item: WatchfaceFileItem = {
      id: 'test-1',
      file,
      name: 'legacy.zip',
      size: zipBuffer.byteLength,
      status: 'idle',
      progress: 0,
      logs: [],
      createdAt: Date.now()
    };

    const result = await repatchAodManifestErrors(item);
    expect(result.success).toBe(true);

    const outZip = await JSZip.loadAsync(await result.outputBlob.arrayBuffer());
    const patchedJson = JSON.parse(await outZip.file('app.json')!.async('string'));

    // Feature 5 verifications
    expect(patchedJson.configVersion).toBe('v2');
    expect(patchedJson.designWidth).toBe(480);
    expect(patchedJson.app.cover).toEqual(['preview.png']);

    // Feature 6 verifications
    expect(patchedJson.module.watchface.hightCost).toBe(0);
    expect(patchedJson.module.idle.hightCost).toBe(0);
  });

  it('Feature 7: Whitelists all 11 universal deviceSource codes and generates structured platforms', async () => {
    const zipBuffer = await buildTestZip({
      manifest: {
        configVersion: 'v1',
        device: { platforms: ['nxp'] }
      },
      files: {
        'watchface/index.js': 'console.log("wf");',
        'assets/preview.png': sample1x1Png
      }
    });

    const file = new File([new Uint8Array(zipBuffer)], 'device_test.zip', { type: 'application/zip' });
    const item: WatchfaceFileItem = {
      id: 'test-2',
      file,
      name: 'device_test.zip',
      size: zipBuffer.byteLength,
      status: 'idle',
      progress: 0,
      logs: [],
      createdAt: Date.now()
    };

    const result = await repatchAodManifestErrors(item);
    const outZip = await JSZip.loadAsync(await result.outputBlob.arrayBuffer());
    const patchedJson = JSON.parse(await outZip.file('app.json')!.async('string'));

    // All 11 hex values must be present
    const expectedHexes = [
      '0x00000079', '0x0000007B', '0x0000007C', '0x00000072',
      '0x00000059', '0x0000005A', '0x00000067', '0x00000069',
      '0x00000073', '0x00000078', '0x0000007A'
    ];
    for (const hex of expectedHexes) {
      expect(patchedJson.deviceSource).toContain(hex);
    }

    // Structured platforms verification
    expect(Array.isArray(patchedJson.device.platforms)).toBe(true);
    expect(patchedJson.device.platforms.length).toBeGreaterThanOrEqual(11);
    for (const spec of UNIVERSAL_TARGET_DEVICES) {
      const match = patchedJson.device.platforms.find(
        (p: any) => p.name === spec.name && p.deviceSource === spec.deviceSource
      );
      expect(match).toBeDefined();
    }
  });

  it('Feature 8: Unconditionally mirrors assets to idle/assets/ even when idle/index.js exists (Jaeger Bug Fix)', async () => {
    // Exact Jaeger Polaris failure condition:
    // Assets in assets/, idle/index.js ALREADY exists, idle/assets/ missing!
    const zipBuffer = await buildTestZip({
      manifest: { configVersion: 'v1' },
      files: {
        'watchface/index.js': '// active script',
        'idle/index.js': '// standby script already present',
        'assets/0000.png': sample1x1Png,
        'assets/0006.png': sample1x1Png, // second hand needle
        'assets/preview.png': sample1x1Png
      }
    });

    const file = new File([new Uint8Array(zipBuffer)], 'jaeger_repro.zip', { type: 'application/zip' });
    const item: WatchfaceFileItem = {
      id: 'test-3',
      file,
      name: 'jaeger_repro.zip',
      size: zipBuffer.byteLength,
      status: 'idle',
      progress: 0,
      logs: [],
      createdAt: Date.now()
    };

    const result = await repatchAodManifestErrors(item);
    const outZip = await JSZip.loadAsync(await result.outputBlob.arrayBuffer());

    // Verified: Assets MUST exist in idle/assets/ and watchface/assets/
    expect(outZip.file('idle/assets/0000.png')).not.toBeNull();
    expect(outZip.file('idle/assets/0006.png')).not.toBeNull();
    expect(outZip.file('watchface/assets/0000.png')).not.toBeNull();
    expect(outZip.file('watchface/assets/0006.png')).not.toBeNull();
  });

  it('Feature 9: Places preview.png in all 5 ubiquitous paths and resolves case-insensitive Preview.png', async () => {
    const zipBuffer = await buildTestZip({
      manifest: { configVersion: 'v1', app: { icon: 'Preview.png' } },
      files: {
        'watchface/index.js': '// active script',
        'assets/Preview.png': sample1x1Png // capital P
      }
    });

    const file = new File([new Uint8Array(zipBuffer)], 'preview_test.zip', { type: 'application/zip' });
    const item: WatchfaceFileItem = {
      id: 'test-4',
      file,
      name: 'preview_test.zip',
      size: zipBuffer.byteLength,
      status: 'idle',
      progress: 0,
      logs: [],
      createdAt: Date.now()
    };

    const result = await repatchAodManifestErrors(item);
    const outZip = await JSZip.loadAsync(await result.outputBlob.arrayBuffer());

    expect(outZip.file('preview.png')).not.toBeNull();
    expect(outZip.file('assets/preview.png')).not.toBeNull();
    expect(outZip.file('watchface/preview.png')).not.toBeNull();
    expect(outZip.file('idle/preview.png')).not.toBeNull();
    expect(outZip.file('idle/assets/preview.png')).not.toBeNull();
  });

  it('Feature 10: Strips UTF-8 BOM and normalizes Windows backslashes', async () => {
    // Manifest with leading \uFEFF BOM
    const bomManifest = '\uFEFF' + JSON.stringify({
      configVersion: 'v1',
      app: { appName: 'BOM App' }
    });

    const zip = new JSZip();
    zip.file('app.json', bomManifest);
    // Files with Windows backslashes
    zip.file('watchface\\index.js', 'console.log("wf");');
    zip.file('assets\\0000.png', sample1x1Png);
    zip.file('assets\\Preview.png', sample1x1Png);

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const file = new File([new Uint8Array(zipBuffer)], 'bom_and_backslash.zip', { type: 'application/zip' });
    const item: WatchfaceFileItem = {
      id: 'test-5',
      file,
      name: 'bom_and_backslash.zip',
      size: zipBuffer.byteLength,
      status: 'idle',
      progress: 0,
      logs: [],
      createdAt: Date.now()
    };

    const result = await repatchAodManifestErrors(item);
    expect(result.success).toBe(true);

    const outZip = await JSZip.loadAsync(await result.outputBlob.arrayBuffer());

    // Backslashes must be gone, forward slashes must exist
    const files = Object.keys(outZip.files);
    expect(files.some(f => f.includes('\\'))).toBe(false);
    expect(outZip.file('watchface/index.js')).not.toBeNull();
    expect(outZip.file('assets/0000.png')).not.toBeNull();
    expect(outZip.file('idle/assets/0000.png')).not.toBeNull();
  });

  it('End-to-End Reference Fixture Verification: Repairs jaeger_polaris package to full M2 compliance', async () => {
    const jaegerPath = path.join(
      process.cwd(),
      'reference_watchfaces',
      'jaeger_polaris_gtr3pro-415474-bce860200c (1).zip'
    );
    const fileBuffer = fs.readFileSync(jaegerPath);
    const file = new File([new Uint8Array(fileBuffer)], path.basename(jaegerPath), { type: 'application/zip' });

    const item: WatchfaceFileItem = {
      id: 'jaeger-m2-test',
      file,
      name: path.basename(jaegerPath),
      size: fileBuffer.byteLength,
      status: 'idle',
      progress: 0,
      logs: [],
      createdAt: Date.now()
    };

    const result = await repatchAodManifestErrors(item);
    expect(result.success).toBe(true);

    const outZip = await JSZip.loadAsync(await result.outputBlob.arrayBuffer());
    const manifest = JSON.parse(await outZip.file('app.json')!.async('string'));

    // Manifest compliance
    expect(manifest.configVersion).toBe('v2');
    expect(manifest.designWidth).toBe(480);
    expect(manifest.app.cover).toEqual(['preview.png']);
    expect(manifest.module.watchface.hightCost).toBe(0);
    expect(manifest.module.idle.hightCost).toBe(0);
    expect(manifest.deviceSource).toContain('0x00000079');
    expect(manifest.deviceSource).toContain('0x0000007B');
    expect(manifest.deviceSource).toContain('0x0000007C');
    expect(manifest.deviceSource).toContain('0x00000072');

    // Asset mirroring: second needle 0006.png must be present in idle/assets/
    expect(outZip.file('idle/assets/0006.png')).not.toBeNull();
    expect(outZip.file('idle/assets/0000.png')).not.toBeNull();
    expect(outZip.file('watchface/assets/0006.png')).not.toBeNull();

    // Preview ubiquity
    expect(outZip.file('preview.png')).not.toBeNull();
    expect(outZip.file('assets/preview.png')).not.toBeNull();
    expect(outZip.file('watchface/preview.png')).not.toBeNull();
    expect(outZip.file('idle/preview.png')).not.toBeNull();
    expect(outZip.file('idle/assets/preview.png')).not.toBeNull();
  });

  it('Verifies convertWatchfacePackage also executes manifest modernization and asset mirroring', async () => {
    const legacyManifest = {
      configVersion: 'v1',
      app: { appId: 54321, appName: 'Convert WF' },
      module: {
        watchface: { path: 'watchface/index' }
      }
    };

    const zipBuffer = await buildTestZip({
      manifest: legacyManifest,
      files: {
        'watchface/index.js': 'console.log("wf");',
        'assets/preview.png': sample1x1Png,
        'assets/0000.png': sample1x1Png,
        'assets/0006.png': sample1x1Png
      }
    });

    const file = new File([new Uint8Array(zipBuffer)], 'convert_test.zip', { type: 'application/zip' });
    const item: WatchfaceFileItem = {
      id: 'test-convert',
      file,
      name: 'convert_test.zip',
      size: zipBuffer.byteLength,
      status: 'idle',
      progress: 0,
      logs: [],
      createdAt: Date.now()
    };

    const result = await convertWatchfacePackage(item, DEFAULT_CONVERSION_OPTIONS);
    const outZip = await JSZip.loadAsync(await result.outputBlob.arrayBuffer());
    const manifest = JSON.parse(await outZip.file('app.json')!.async('string'));

    expect(manifest.configVersion).toBe('v2');
    expect(manifest.designWidth).toBe(480);
    expect(manifest.app.cover).toEqual(['preview.png']);
    expect(manifest.module.watchface.hightCost).toBe(0);
    expect(manifest.module.idle.hightCost).toBe(0);
    expect(outZip.file('idle/assets/0000.png')).not.toBeNull();
    expect(outZip.file('idle/assets/0006.png')).not.toBeNull();
    expect(outZip.file('preview.png')).not.toBeNull();
    expect(outZip.file('idle/preview.png')).not.toBeNull();
  });
});
