export class RainbowGenerator {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.init();
  }

  init() {
    this.render();
    this.attachEvents();
    this.generate();
  }

  render() {
    this.container.innerHTML = `
      <div class="rainbow-layout">
        <div class="rainbow-controls panel-sub">
          <h3>Settings</h3>
          
          <div class="input-group">
            <label>Mode</label>
            <select id="rg-mode">
              <option value="gradient">Two-Color Gradient</option>
              <option value="rainbow">Full Rainbow (HSL)</option>
            </select>
          </div>

          <div id="rg-colors-container" class="color-picker-group">
            <div class="input-group">
              <label>Start Color</label>
              <input type="color" id="rg-color-start" value="#3301e5">
            </div>
            <div class="input-group">
              <label>End Color</label>
              <input type="color" id="rg-color-end" value="#a80106">
            </div>
          </div>

          <div class="input-group">
            <label>Input Text (Supports multiline)</label>
            <textarea id="rg-input" rows="4">Max Health:</textarea>
          </div>
          
          <button id="rg-generate" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Generate</button>
        </div>

        <div class="rainbow-output panel-sub">
          <h3>Output</h3>
          <div class="input-group">
            <label>APB Localization String</label>
            <textarea id="rg-output" rows="6" readonly></textarea>
            <button class="btn btn-sm copy-btn" data-target="rg-output" style="margin-top: 0.5rem;">Copy to Clipboard</button>
          </div>

          <div class="preview-box">
            <label>Visual Preview</label>
            <div id="rg-preview" class="in-game-preview"></div>
          </div>
        </div>
      </div>
    `;
  }

  attachEvents() {
    const modeSelect = this.container.querySelector('#rg-mode');
    const colorsContainer = this.container.querySelector('#rg-colors-container');
    const generateBtn = this.container.querySelector('#rg-generate');
    const copyBtn = this.container.querySelector('.copy-btn');
    const inputs = this.container.querySelectorAll('input, textarea, select');

    modeSelect.addEventListener('change', (e) => {
      if (e.target.value === 'rainbow') {
        colorsContainer.style.display = 'none';
      } else {
        colorsContainer.style.display = 'flex';
      }
      this.generate();
    });

    inputs.forEach(input => {
      if (input.id !== 'rg-output') {
        input.addEventListener('input', () => this.generate());
      }
    });

    copyBtn.addEventListener('click', (e) => {
      const output = this.container.querySelector('#rg-output');
      navigator.clipboard.writeText(output.value).then(() => {
        const original = e.target.textContent;
        e.target.textContent = 'Copied!';
        setTimeout(() => { e.target.textContent = original; }, 1500);
      });
    });
  }

  generate() {
    const mode = this.container.querySelector('#rg-mode').value;
    const text = this.container.querySelector('#rg-input').value;
    const startHex = this.container.querySelector('#rg-color-start').value;
    const endHex = this.container.querySelector('#rg-color-end').value;
    const outputEl = this.container.querySelector('#rg-output');
    const previewEl = this.container.querySelector('#rg-preview');

    if (!text) {
      outputEl.value = '';
      previewEl.innerHTML = '';
      return;
    }

    const lines = text.split('\\n');
    let finalOutput = '';
    let previewHtml = '';

    lines.forEach((line, lineIdx) => {
      if (line === '') {
        finalOutput += '\\n';
        previewHtml += '<br/>';
        return;
      }

      if (mode === 'gradient') {
        const startRgb = this.hexToRgb(startHex);
        const endRgb = this.hexToRgb(endHex);
        const charCount = line.length;

        for (let i = 0; i < charCount; i++) {
          const char = line[i];
          if (char === ' ') {
            finalOutput += ' ';
            previewHtml += '&nbsp;';
            continue;
          }

          const t = charCount > 1 ? i / (charCount - 1) : 0;

          const r = Math.round(startRgb.r + (endRgb.r - startRgb.r) * t);
          const g = Math.round(startRgb.g + (endRgb.g - startRgb.g) * t);
          const b = Math.round(startRgb.b + (endRgb.b - startRgb.b) * t);

          const apbR = (r / 255).toFixed(3).replace(/\\.?0+$/, '') || '0';
          const apbG = (g / 255).toFixed(3).replace(/\\.?0+$/, '') || '0';
          const apbB = (b / 255).toFixed(3).replace(/\\.?0+$/, '') || '0';

          const tag = `<Color:R=${apbR} G=${apbG} B=${apbB} A=1.0>`;
          finalOutput += `${tag}${char}<Color:/>`;
          previewHtml += `<span style="color: rgb(${r}, ${g}, ${b})">${char}</span>`;
        }
      } else {
        const charCount = line.length;
        for (let i = 0; i < charCount; i++) {
          const char = line[i];
          if (char === ' ') {
            finalOutput += ' ';
            previewHtml += '&nbsp;';
            continue;
          }

          const hue = Math.round((i / charCount) * 360);
          const rgb = this.hslToRgb(hue, 100, 50);

          const apbR = (rgb.r / 255).toFixed(3).replace(/\\.?0+$/, '') || '0';
          const apbG = (rgb.g / 255).toFixed(3).replace(/\\.?0+$/, '') || '0';
          const apbB = (rgb.b / 255).toFixed(3).replace(/\\.?0+$/, '') || '0';

          const tag = `<Color:R=${apbR} G=${apbG} B=${apbB} A=1.0>`;
          finalOutput += `${tag}${char}<Color:/>`;
          previewHtml += `<span style="color: rgb(${rgb.r}, ${rgb.g}, ${rgb.b})">${char}</span>`;
        }
      }

      if (lineIdx < lines.length - 1) {
        finalOutput += '\\n';
        previewHtml += '<br/>';
      }
    });

    outputEl.value = finalOutput;
    previewEl.innerHTML = previewHtml;
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return {
      r: Math.round(255 * f(0)),
      g: Math.round(255 * f(8)),
      b: Math.round(255 * f(4))
    };
  }
}
