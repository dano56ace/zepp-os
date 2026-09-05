import JSZip from 'jszip';

// Helper to create a rich 480x480 Chronograph Watchface PNG Preview
function generateSampleWatchfaceCanvasBase64(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJVSURBVHgB7dKxAQAwDMCw/v9353AGqECh2UfS5z6AAAAAElFTkSuQmCC';

    // 1. Dial Background
    const bgGrad = ctx.createRadialGradient(240, 240, 50, 240, 240, 240);
    bgGrad.addColorStop(0, '#1a2232');
    bgGrad.addColorStop(0.7, '#0f141f');
    bgGrad.addColorStop(1, '#080b12');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 480, 480);

    // 2. Outer Tachymeter / Index Ring
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(240, 240, 230, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(240, 240, 218, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Hour Markers & Minute Ticks
    for (let i = 0; i < 60; i++) {
      const angle = (i * 6 * Math.PI) / 180;
      const isHour = i % 5 === 0;
      const isQuarter = i % 15 === 0;

      const innerR = isQuarter ? 185 : isHour ? 195 : 208;
      const outerR = 216;

      const x1 = 240 + Math.cos(angle) * innerR;
      const y1 = 240 + Math.sin(angle) * innerR;
      const x2 = 240 + Math.cos(angle) * outerR;
      const y2 = 240 + Math.sin(angle) * outerR;

      ctx.strokeStyle = isQuarter ? '#38bdf8' : isHour ? '#f8fafc' : '#475569';
      ctx.lineWidth = isQuarter ? 4 : isHour ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // 4. Numeric Hour Labels (12, 3, 6, 9)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('12', 240, 75);
    ctx.fillText('3', 405, 240);
    ctx.fillText('6', 240, 405);
    ctx.fillText('9', 75, 240);

    // 5. Sub-dials (Chronograph)
    // Left Subdial: Heart Rate
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(160, 240, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('♥ 78', 160, 235);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.fillText('BPM', 160, 252);

    // Right Subdial: Battery
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(320, 240, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('⚡ 85%', 320, 235);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.fillText('POWER', 320, 252);

    // Top Subdial: Steps
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(240, 150, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('8,420', 240, 147);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px sans-serif';
    ctx.fillText('STEPS', 240, 162);

    // 6. Chronograph Brand Text
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('AERO CHRONO', 240, 310);
    ctx.fillStyle = '#64748b';
    ctx.font = '10px sans-serif';
    ctx.fillText('ZEPP OS 3.0 • FAOD', 240, 328);

    // 7. Date Window at bottom
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(205, 348, 70, 24, 4) : ctx.rect(205, 348, 70, 24);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('MON 31', 240, 360);

    // 8. Subtle Hands at 10:08 position
    // Hour Hand (angle ~ -60 deg from 12)
    const hourA = (-58 * Math.PI) / 180;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(240, 240);
    ctx.lineTo(240 + Math.sin(hourA) * 90, 240 - Math.cos(hourA) * 90);
    ctx.stroke();

    // Minute Hand (angle ~ 48 deg from 12)
    const minA = (48 * Math.PI) / 180;
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(240, 240);
    ctx.lineTo(240 + Math.sin(minA) * 140, 240 - Math.cos(minA) * 140);
    ctx.stroke();

    // Second Hand (angle ~ 180 deg)
    const secA = (180 * Math.PI) / 180;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(240 - Math.sin(secA) * 30, 240 + Math.cos(secA) * 30);
    ctx.lineTo(240 + Math.sin(secA) * 160, 240 - Math.cos(secA) * 160);
    ctx.stroke();

    // Center Cap
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(240, 240, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    const dataUrl = canvas.toDataURL('image/png');
    return dataUrl.replace(/^data:image\/png;base64,/, '');
  } catch {
    return 'iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJVSURBVHgB7dKxAQAwDMCw/v9353AGqECh2UfS5z6AAAAAElFTkSuQmCC';
  }
}

// Creates a realistic Zepp OS Watchface .zpk archive (which is a ZIP package)
// containing active watchface with widgets, restricted AOD flags, app.json manifest, and simplified idle/ dir.
export async function createSampleWatchfacePackage(): Promise<File> {
  const zip = new JSZip();

  const manifest = {
    app: {
      appType: 'watchface',
      appName: 'Aero Chrono Pro',
      appId: 849201,
      vender: 'Amazfit Studio Labs',
      version: {
        code: 100,
        name: '1.0.0'
      },
      icon: 'icon.png',
      description: 'Sport chronograph with heart rate, battery, steps and dual mode dials.'
    },
    targets: {
      watchface: 'watchface/index',
      idle: 'idle/index'
    },
    module: {
      watchface: {
        path: 'watchface/index'
      },
      idle: {
        path: 'idle/index'
      }
    },
    runtime: {
      version: '1.0.0',
      minVersion: '1.0.0'
    },
    deviceSource: ['0x00000079', '0x00000062'],
    defaultAOD: false
  };

  zip.file('app.json', JSON.stringify(manifest, null, 2));

  // Active watchface script with widgets marked ONLY_NORMAL and showInAod: false
  const watchfaceIndexJs = `/**
 * Aero Chrono Pro - Active Watchface Script
 * Zepp OS 2.0+ Architecture
 */
import { createWidget, widget, prop, align, text_style } from '@zeppos/ui';
import { Time } from '@zeppos/sensor';

WatchFace({
  initView() {
    console.log('Active Watchface initialized');
    
    // Background dial image
    createWidget(widget.IMG, {
      x: 0,
      y: 0,
      src: 'watchface/assets/dial_bg.png',
      vis_mode: hmUI.vis_mode.ALL
    });

    // Battery Gauge Widget (Restricted in stock AOD)
    createWidget(widget.ARC_PROGRESS, {
      center_x: 240,
      center_y: 240,
      radius: 210,
      start_angle: -90,
      end_angle: 90,
      color: 0x10B981,
      vis_mode: hmUI.vis_mode.ONLY_NORMAL,
      showInAod: false
    });

    // Heart Rate Text & Icon (Restricted in stock AOD)
    createWidget(widget.TEXT, {
      x: 200,
      y: 340,
      w: 80,
      h: 30,
      color: 0xEF4444,
      text_size: 20,
      align_h: align.CENTER_H,
      text: '78 BPM',
      vis_mode: hmUI.vis_mode.ONLY_NORMAL,
      showInAod: false
    });

    // Steps Counter Gauge (Restricted in stock AOD)
    createWidget(widget.TEXT, {
      x: 200,
      y: 110,
      w: 80,
      h: 30,
      color: 0x38BDF8,
      text_size: 20,
      align_h: align.CENTER_H,
      text: '8,420',
      vis_mode: hmUI.vis_mode.ONLY_NORMAL,
      showInAod: false
    });

    // Digital Time & Date (Visible in ALL)
    createWidget(widget.TIME_TEXT, {
      x: 140,
      y: 220,
      w: 200,
      h: 50,
      color: 0xFFFFFF,
      text_size: 38,
      align_h: align.CENTER_H,
      vis_mode: hmUI.vis_mode.ALL,
      showInAod: true
    });

    // Analog Hour & Minute Hands
    createWidget(widget.TIME_POINTER, {
      hour_centerX: 240,
      hour_centerY: 240,
      hour_posX: 12,
      hour_posY: 100,
      hour_path: 'watchface/assets/hand_hour.png',
      minute_centerX: 240,
      minute_centerY: 240,
      minute_posX: 12,
      minute_posY: 130,
      minute_path: 'watchface/assets/hand_minute.png',
      vis_mode: hmUI.vis_mode.ALL
    });
  }
});
`;

  // Simplified stock Idle script (what manufacturers usually strip down)
  const idleIndexJs = `/**
 * Aero Chrono Pro - Stock Stripped AOD
 * Only renders thin needles without background or sub-dials
 */
import { createWidget, widget } from '@zeppos/ui';

WatchFace({
  initView() {
    console.log('Stock Idle AOD View - Stripped minimalist layout');
    
    // Only simple hour pointer in stock idle
    createWidget(widget.TIME_POINTER, {
      hour_centerX: 240,
      hour_centerY: 240,
      hour_posX: 6,
      hour_posY: 80,
      hour_path: 'idle/assets/hand_hour_dim.png',
      minute_centerX: 240,
      minute_centerY: 240,
      minute_posX: 6,
      minute_posY: 100,
      minute_path: 'idle/assets/hand_minute_dim.png'
    });
  }
});
`;

  zip.file('watchface/index.js', watchfaceIndexJs);
  zip.file('watchface/assets/dial_bg.png', 'FAOD_DEMO_PNG_ASSET_DIAL_BG');
  zip.file('watchface/assets/hand_hour.png', 'FAOD_DEMO_PNG_ASSET_HAND_HOUR');
  zip.file('watchface/assets/hand_minute.png', 'FAOD_DEMO_PNG_ASSET_HAND_MINUTE');

  zip.file('idle/index.js', idleIndexJs);
  zip.file('idle/assets/hand_hour_dim.png', 'FAOD_DEMO_PNG_ASSET_HAND_HOUR_DIM');
  zip.file('idle/assets/hand_minute_dim.png', 'FAOD_DEMO_PNG_ASSET_HAND_MINUTE_DIM');

  // Rich 480x480 chronograph watchface preview image base64
  const pngBase64 = generateSampleWatchfaceCanvasBase64();
  zip.file('preview.png', pngBase64, { base64: true });
  zip.file('icon.png', pngBase64, { base64: true });
  zip.file('watchface/assets/dial_bg.png', pngBase64, { base64: true });

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  return new File([blob], 'Aero_Chrono_Pro_Amazfit_Balance.zpk', {
    type: 'application/vnd.huami.watchface.package'
  });
}
