/**
 * HexConverter - Handles conversion between HEX and APB RGBA formats
 */

export class HexConverter {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.init();
  }

  init() {
    this.render();
    this.attachEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="converter-card">
        <h3>Color Converter</h3>
        <div class="converter-inputs">
          <div class="input-group">
            <label for="color-picker">Visual Picker</label>
            <input type="color" id="color-picker" value="#ff2233">
          </div>
          <div class="input-group flex-1">
            <label for="color-text">HEX / Paste RGBA</label>
            <input type="text" id="color-text" value="#ff2233" placeholder="e.g. #FF5500 or 255, 85, 0">
          </div>
        </div>
        
        <div class="converter-outputs">
          <div class="output-row">
            <span class="label">APB Format:</span>
            <code id="out-apb">&lt;Color:R=1.0 G=0.133 B=0.2 A=1.0&gt;</code>
            <button class="btn btn-sm copy-btn" data-target="out-apb">Copy</button>
          </div>
          <div class="output-row">
            <span class="label">Standard RGBA:</span>
            <code id="out-rgba">rgba(255, 34, 51, 1)</code>
            <button class="btn btn-sm copy-btn" data-target="out-rgba">Copy</button>
          </div>
          <div class="output-row">
            <span class="label">HEX:</span>
            <code id="out-hex">#ff2233</code>
            <button class="btn btn-sm copy-btn" data-target="out-hex">Copy</button>
          </div>
        </div>
      </div>
    `;
  }

  attachEvents() {
    const picker = this.container.querySelector('#color-picker');
    const textInput = this.container.querySelector('#color-text');
    const copyBtns = this.container.querySelectorAll('.copy-btn');

    picker.addEventListener('input', (e) => {
      const hex = e.target.value;
      textInput.value = hex;
      this.updateOutputs(hex);
    });

    textInput.addEventListener('input', (e) => {
      let val = e.target.value.trim();
      // Handle missing hash
      if (/^[0-9A-Fa-f]{6}$/.test(val)) {
        val = '#' + val;
      }
      
      // Update picker if valid hex
      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        picker.value = val;
        this.updateOutputs(val);
      }
      
      // Handle rgba(r, g, b, a) or r, g, b pasting
      const rgbMatch = val.match(/rgba?\(?\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);
        if (r <= 255 && g <= 255 && b <= 255) {
          const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
          picker.value = hex;
          textInput.value = hex;
          this.updateOutputs(hex);
        }
      }
    });

    copyBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetId = e.target.getAttribute('data-target');
        const text = this.container.querySelector('#' + targetId).textContent;
        navigator.clipboard.writeText(text).then(() => {
          const original = e.target.textContent;
          e.target.textContent = 'Copied!';
          setTimeout(() => { e.target.textContent = original; }, 1500);
        });
      });
    });
    
    // Initial update
    this.updateOutputs(picker.value);
  }

  updateOutputs(hex) {
    // Convert hex to rgb
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    // APB format (0.0 - 1.0)
    const apbR = (r / 255).toFixed(3).replace(/\.?0+$/, '');
    const apbG = (g / 255).toFixed(3).replace(/\.?0+$/, '');
    const apbB = (b / 255).toFixed(3).replace(/\.?0+$/, '');
    
    const apbR_final = apbR === '' ? '0' : apbR;
    const apbG_final = apbG === '' ? '0' : apbG;
    const apbB_final = apbB === '' ? '0' : apbB;

    this.container.querySelector('#out-apb').textContent = `<Color:R=${apbR_final} G=${apbG_final} B=${apbB_final} A=1.0>`;
    this.container.querySelector('#out-rgba').textContent = `rgba(${r}, ${g}, ${b}, 1)`;
    this.container.querySelector('#out-hex').textContent = hex.toUpperCase();
  }
}
