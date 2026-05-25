import { HexConverter } from './colors/HexConverter.js';
import { ColorPalette } from './colors/ColorPalette.js';
import { RainbowGenerator } from './rainbow/RainbowGenerator.js';
import { FileEditor } from './editor/FileEditor.js';
import { Settings } from './settings/Settings.js';

/**
 * Main Application Bootstrapper
 */

document.addEventListener('DOMContentLoaded', () => {
  new Settings(); // Init settings first
  initTabs();
  initColorTools();
  initRainbowGenerator();
  initFileEditor();
});

/**
 * Initializes the tab navigation logic.
 */
function initTabs() {
  const navButtons = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons and tabs
      navButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(t => t.classList.remove('active'));

      // Add active class to clicked button
      btn.classList.add('active');

      // Show corresponding tab content
      const targetTabId = btn.getAttribute('data-tab');
      const targetTab = document.getElementById(targetTabId);
      if (targetTab) {
        targetTab.classList.add('active');
      }
    });
  });
}

/**
 * Initializes the Color Tools components
 */
function initColorTools() {
  const container = document.getElementById('color-tools-container');
  if (!container) return;

  container.innerHTML = `
    <div class="color-tools-grid">
      <div id="hex-converter-root"></div>
      <div id="color-palette-root"></div>
    </div>
  `;

  new HexConverter('hex-converter-root');
  new ColorPalette('color-palette-root');
}

/**
 * Initializes the Rainbow Generator
 */
function initRainbowGenerator() {
  const container = document.getElementById('rainbow-container');
  if (!container) return;
  new RainbowGenerator('rainbow-container');
}

/**
 * Initializes the File Editor
 */
function initFileEditor() {
  const container = document.getElementById('editor-container');
  if (!container) return;
  new FileEditor('editor-container');
}
