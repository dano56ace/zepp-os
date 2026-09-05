import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { convertWatchfacePackage } from '../src/utils/converter.ts';
import { DEFAULT_CONVERSION_OPTIONS, WatchfaceFileItem } from '../src/types.ts';

describe('Export Fixed Jaeger Polaris Watchface', () => {
  it('generates fully working FAOD package for Jaeger Polaris', async () => {
    const inputZipPath = path.resolve('reference_watchfaces/jaeger_polaris_gtr3pro-415474-bce860200c (1).zip');
    expect(fs.existsSync(inputZipPath)).toBe(true);

    const fileBuffer = fs.readFileSync(inputZipPath);
    const file = new File([new Uint8Array(fileBuffer)], 'jaeger_polaris_gtr3pro.zip', { type: 'application/zip' });
    const item: WatchfaceFileItem = {
      id: 'jaeger-export-1',
      file,
      name: 'jaeger_polaris_gtr3pro.zip',
      size: fileBuffer.byteLength,
      status: 'idle',
      progress: 0,
      logs: [],
      createdAt: Date.now()
    };

    const options = {
      ...DEFAULT_CONVERSION_OPTIONS,
      syncManifestTargets: true,
      bypassIdleRefreshRate: true,
      overrideSimpleAod: true,
      overwriteIdleDir: true,
      patchScriptVisibility: true,
      deepWidgetVisibilityPatch: true,
      batteryOptimizations: {
        ...DEFAULT_CONVERSION_OPTIONS.batteryOptimizations,
        freezeSecondHandsInAod: false
      }
    };

    const result = await convertWatchfacePackage(item, options);
    expect(result).toBeDefined();

    const zipBuffer = Buffer.from(await result.outputBlobZip.arrayBuffer());
    const zpkBuffer = Buffer.from(await result.outputBlobZpk.arrayBuffer());

    const outZip = path.resolve('reference_watchfaces/jaeger_polaris_FAOD_fixed.zip');
    const outZpk = path.resolve('reference_watchfaces/jaeger_polaris_FAOD_fixed.zpk');

    fs.writeFileSync(outZip, new Uint8Array(zipBuffer));
    fs.writeFileSync(outZpk, new Uint8Array(zpkBuffer));

    console.log('Saved output to:', outZip, `(${zipBuffer.length} bytes)`);
    console.log('Saved output to:', outZpk, `(${zpkBuffer.length} bytes)`);

    // Verify zip contents
    const checkZip = await JSZip.loadAsync(zipBuffer);
    const names = Object.keys(checkZip.files);
    expect(names.some(f => f.startsWith('idle/assets/'))).toBe(true);
    expect(names.some(f => f.startsWith('watchface/assets/'))).toBe(true);

    const appJsonRaw = await checkZip.file('app.json')!.async('string');
    const appJson = JSON.parse(appJsonRaw);
    expect(appJson.configVersion).toBe('v2');
    expect(appJson.module.watchface.hightCost).toBe(0);
    expect(appJson.module.idle.hightCost).toBe(0);

    const idleJs = await checkZip.file('idle/index.js')!.async('string');
    expect(idleJs).toContain('WIDGET_DELEGATE');
    expect(idleJs).toContain('hmSensor.id.TIME');
  });
});
