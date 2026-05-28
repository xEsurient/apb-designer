export class ColorPalette {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.colors = [];
    this.init();
  }

  async init() {
    this.renderSkeleton();
    await this.loadColors();
    this.render();
  }

  renderSkeleton() {
    this.container.innerHTML = `
      <div class="palette-card">
        <h3>Standard In-Game Tags</h3>
        <p>Loading colors...</p>
      </div>
    `;
  }

  async loadColors() {
    try {
      const response = await fetch(import.meta.env.BASE_URL + 'data/colors.json');
      this.colors = await response.json();
    } catch (e) {
      console.error("Failed to load colors:", e);
      this.container.innerHTML = `<div class="error">Failed to load color database.</div>`;
    }
  }

  render() {
    if (!this.colors.length) return;

    let gridHtml = '<div class="color-grid">';

    this.colors.forEach(color => {
      gridHtml += `
        <div class="color-swatch-card" style="border-left: 4px solid ${color.hex}">
          <div class="color-swatch-header">
            <strong>${color.tag.replace(/_/g, ' ')}</strong>
            <div class="swatch-preview" style="background-color: ${color.hex}"></div>
          </div>
          <div class="color-swatch-details">
            <div class="swatch-row">
              <span class="label">Tag:</span>
              <code class="copy-target">&lt;col:${color.tag}&gt;</code>
            </div>
            <div class="swatch-row">
              <span class="label">HEX:</span>
              <code class="copy-target">${color.hex}</code>
            </div>
          </div>
        </div>
      `;
    });

    gridHtml += '</div>';

    this.container.innerHTML = `
      <div class="palette-card">
        <h3>Standard In-Game Tags</h3>
        <div class="palette-controls">
          <input type="text" id="palette-search" placeholder="Search colors...">
        </div>
        ${gridHtml}
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const search = this.container.querySelector('#palette-search');
    const cards = this.container.querySelectorAll('.color-swatch-card');
    const copyTargets = this.container.querySelectorAll('.copy-target');

    search.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(term)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });

    copyTargets.forEach(target => {
      target.addEventListener('click', (e) => {
        const text = e.target.textContent;
        navigator.clipboard.writeText(text).then(() => {
          const original = e.target.textContent;
          e.target.textContent = 'Copied!';
          e.target.classList.add('success-text');
          setTimeout(() => {
            e.target.textContent = original;
            e.target.classList.remove('success-text');
          }, 1000);
        });
      });
    });
  }
}
