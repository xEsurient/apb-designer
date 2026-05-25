/**
 * Settings - Manages user preferences in localStorage
 */

export class Settings {
  constructor() {
    this.defaultSettings = {
      theme: 'dark',
      preferredCopyFormat: 'apb',
      rainbowMode: 'gradient'
    };
    this.current = this.load();
    this.initUI();
  }

  load() {
    try {
      const stored = localStorage.getItem('apb_designer_settings');
      if (stored) {
        return { ...this.defaultSettings, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error("Failed to load settings from localStorage", e);
    }
    return this.defaultSettings;
  }

  save() {
    try {
      localStorage.setItem('apb_designer_settings', JSON.stringify(this.current));
    } catch (e) {
      console.error("Failed to save settings to localStorage", e);
    }
  }

  exportSettings() {
    const blob = new Blob([JSON.stringify(this.current, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'apb_designer_settings.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }

  importSettings(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        this.current = { ...this.defaultSettings, ...parsed };
        this.save();
        this.apply();
        alert('Settings imported successfully!');
      } catch (err) {
        alert('Failed to parse settings JSON.');
      }
    };
    reader.readAsText(file);
  }

  apply() {
    // Currently only handles theme class on body if we add light mode later
    if (this.current.theme === 'dark') {
      document.body.classList.add('theme-dark');
    }
  }

  initUI() {
    this.apply();
    
    const settingsBtn = document.getElementById('btn-settings');
    if (!settingsBtn) return;

    // Create hidden file input for import
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    fileInput.addEventListener('change', (e) => {
      if (e.target.files[0]) {
        this.importSettings(e.target.files[0]);
      }
    });

    settingsBtn.addEventListener('click', () => {
      const action = confirm("Would you like to export your current settings?\n\nClick OK to Export, or Cancel to Import settings from a file.");
      if (action) {
        this.exportSettings();
      } else {
        fileInput.click();
      }
    });
  }
}
