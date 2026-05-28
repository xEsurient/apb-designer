import { FileParser } from './FileParser.js';
import DOMPurify from 'dompurify';

export class FileEditor {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.parsedFile = [];
    this.fileName = '';
    this.entries = [];
    this.currentPage = 1;
    this.itemsPerPage = 100;

    this.init();
  }

  init() {
    this.renderSkeleton();
    this.attachInitialEvents();
  }

  renderSkeleton() {
    this.container.innerHTML = `
      <div class="editor-header">
        <div class="file-actions">
          <input type="file" id="fe-file-upload" accept=".ger" style="display: none;">
          <button id="fe-btn-upload" class="btn btn-primary">Open File</button>
          <button id="fe-btn-save" class="btn btn-primary" style="display: none;" disabled>Save & Download</button>
          <span id="fe-file-name" class="file-name-display"></span>
        </div>
        <div class="editor-controls" style="display: none;">
          <input type="text" id="fe-search" placeholder="Search entries...">
        </div>
      </div>
      <div id="fe-bulk-ops" class="bulk-operations-container" style="display: none; margin: 15px 0; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
        <div class="bulk-row" style="display: flex; gap: 20px; flex-wrap: wrap;">
          <div class="bulk-group">
            <h4 style="margin-top:0; margin-bottom: 8px;">Bulk Colorizer</h4>
            <select id="fe-bulk-cat" class="edit-input" style="width: 200px;">
               <option value="">Select Category...</option>
            </select>
            <input type="text" id="fe-bulk-color" class="edit-input" style="width: 200px;" placeholder="e.g. <col:Valentine_Pink>">
            <button id="fe-btn-apply-color" class="btn btn-secondary btn-sm">Apply to Category</button>
          </div>
          <div class="bulk-group">
            <h4 style="margin-top:0; margin-bottom: 8px;">Font Formatter <small style="color: #ffaa00;">(Requires &lt;Color:&gt; tags)</small></h4>
            <select id="fe-bulk-font" class="edit-input" style="width: 250px;">
              <option value="Fonts:APBMenus_Font.APB_Helvetica_Bold_11">Helvetica Bold 11</option>
              <option value="Fonts:APBMenus_Font.APB_Helvetica_Bold_13">Helvetica Bold 13</option>
              <option value="Fonts:APBMenus_Font.APB_Helvetica_Bold_14">Helvetica Bold 14</option>
              <option value="Fonts:APBMenus_Font.APB_Helvetica_Bold_24">Helvetica Bold 24</option>
              <option value="Fonts:APBMenus_Font.APB_Helvetica_Bold_32">Helvetica Bold 32</option>
              <option value="Fonts:APBMenus_Font.APB_Helvetica_Regular_11">Helvetica Regular 11</option>
              <option value="Fonts:APBMenus_Font.APB_Helvetica_Regular_12">Helvetica Regular 12</option>
              <option value="Fonts:APBMenus_Font.APB_Helvetica_Regular_14">Helvetica Regular 14</option>
              <option value="Fonts:APBMenus_Font.APB_Helvetica_Regular_16">Helvetica Regular 16</option>
              <option value="Fonts:APBMenus_Font.APB_Helvetica_Regular_28">Helvetica Regular 28</option>
              <option value="Fonts:APBMenus_Font.APB_HUD_AmmoCounter">HUD AmmoCounter</option>
              <option value="Fonts:EngineFonts.TinyFont">TinyFont</option>
              <option value="Fonts:EngineFonts.SmallFont">SmallFont</option>
              <option value="Fonts:EngineFonts.MediumFont">MediumFont</option>
              <option value="Fonts:EngineFonts.LargeFont">LargeFont</option>
            </select>
            <button id="fe-btn-apply-font" class="btn btn-secondary btn-sm">Format Unlock Titles</button>
          </div>
        </div>
      </div>
      <div id="fe-table-container" class="editor-table-container">
        <div class="empty-state">
          <p>Select a localization .ger file to begin editing.</p>
        </div>
      </div>
      <div id="fe-pagination" class="pagination-controls" style="display: none;"></div>
    `;
  }

  attachInitialEvents() {
    const uploadBtn = this.container.querySelector('#fe-btn-upload');
    const fileInput = this.container.querySelector('#fe-file-upload');
    const saveBtn = this.container.querySelector('#fe-btn-save');
    const searchInput = this.container.querySelector('#fe-search');

    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      this.fileName = file.name;
      this.container.querySelector('#fe-file-name').textContent = this.fileName;

      const reader = new FileReader();
      reader.onload = (e) => this.handleFileLoad(e.target.result);
      reader.readAsText(file);
    });

    saveBtn.addEventListener('click', () => this.handleSave());

    searchInput.addEventListener('input', (e) => {
      this.currentPage = 1;
      this.renderTable(e.target.value.toLowerCase());
    });
  }

  handleFileLoad(content) {
    this.parsedFile = FileParser.parse(content);
    this.entries = this.parsedFile.filter(line => line.type === 'entry');

    this.container.querySelector('.editor-controls').style.display = 'block';
    this.container.querySelector('#fe-btn-save').style.display = 'inline-flex';
    this.container.querySelector('#fe-btn-save').disabled = false;
    this.container.querySelector('#fe-pagination').style.display = 'flex';
    this.container.querySelector('#fe-bulk-ops').style.display = 'block';

    this.populateBulkCategories();
    this.attachBulkEvents();
    this.renderTable();
  }

  populateBulkCategories() {
    const catSelect = this.container.querySelector('#fe-bulk-cat');
    while (catSelect.options.length > 1) {
      catSelect.remove(1);
    }

    const categories = new Set();
    this.entries.forEach(e => {
      if (e.category) categories.add(e.category);
    });

    const sortedCats = Array.from(categories).sort();
    sortedCats.forEach(cat => {
      if (cat !== 'FnMod') {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        catSelect.appendChild(opt);
      }
    });
  }

  attachBulkEvents() {
    const applyColorBtn = this.container.querySelector('#fe-btn-apply-color');
    const applyFontBtn = this.container.querySelector('#fe-btn-apply-font');

    applyColorBtn.onclick = () => {
      const cat = this.container.querySelector('#fe-bulk-cat').value;
      const colorTag = this.container.querySelector('#fe-bulk-color').value;
      if (!cat || !colorTag) return;

      let changed = 0;
      this.entries.forEach(e => {
        if (e.category === cat) {
          e.colorTag = colorTag;
          e.isModified = true;
          changed++;
        }
      });
      if (changed > 0) this.renderTable(this.container.querySelector('#fe-search').value.toLowerCase());
    };

    applyFontBtn.onclick = () => {
      const fontStr = this.container.querySelector('#fe-bulk-font').value;
      let changed = 0;

      this.entries.forEach(e => {
        if (e.key.includes('InventoryItemTypes_Unlock_Title')) {
          if (!e.displayText.startsWith(`<${fontStr}>`)) {
            let cleanText = e.displayText.replace(/^<Fonts:[^>]+>/, '').replace(/<Fonts:\/>$/, '');
            e.displayText = `<${fontStr}>` + cleanText;
            e.isModified = true;
            changed++;
          }
        }
      });
      if (changed > 0) this.renderTable(this.container.querySelector('#fe-search').value.toLowerCase());
    };
  }

  renderTable(searchTerm = '') {
    const tableContainer = this.container.querySelector('#fe-table-container');
    const paginationContainer = this.container.querySelector('#fe-pagination');

    let filteredEntries = this.entries;
    if (searchTerm) {
      filteredEntries = this.entries.filter(e =>
        e.key.toLowerCase().includes(searchTerm) ||
        e.displayText.toLowerCase().includes(searchTerm) ||
        (e.category && e.category.toLowerCase().includes(searchTerm))
      );
    }

    const totalPages = Math.ceil(filteredEntries.length / this.itemsPerPage);
    const startIdx = (this.currentPage - 1) * this.itemsPerPage;
    const paginatedEntries = filteredEntries.slice(startIdx, startIdx + this.itemsPerPage);

    if (filteredEntries.length === 0) {
      tableContainer.innerHTML = `<div class="empty-state"><p>No matching entries found.</p></div>`;
      paginationContainer.innerHTML = '';
      return;
    }

    let html = `
      <table class="editor-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>String ID</th>
            <th>Color Tag</th>
            <th>Display Text</th>
          </tr>
        </thead>
        <tbody>
    `;

    paginatedEntries.forEach(entry => {
      const safeKey = DOMPurify.sanitize(entry.key);
      const safeCat = DOMPurify.sanitize(entry.category || '-');
      const safeTag = DOMPurify.sanitize(entry.colorTag || '');
      const safeText = DOMPurify.sanitize(entry.displayText);

      html += `
        <tr data-index="${entry.index}">
          <td class="col-cat">${safeCat}</td>
          <td class="col-id" title="${safeKey}">${safeKey}</td>
          <td class="col-tag">
            <input type="text" class="edit-input tag-input" value="${safeTag}" placeholder="No Color">
          </td>
          <td class="col-text">
            <textarea class="edit-input text-input" rows="1">${safeText}</textarea>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    tableContainer.innerHTML = html;

    this.renderPagination(totalPages);
    this.attachTableEvents();
  }

  renderPagination(totalPages) {
    const container = this.container.querySelector('#fe-pagination');
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <button class="btn btn-sm" id="page-prev" ${this.currentPage === 1 ? 'disabled' : ''}>Previous</button>
      <span>Page ${this.currentPage} of ${totalPages}</span>
      <button class="btn btn-sm" id="page-next" ${this.currentPage === totalPages ? 'disabled' : ''}>Next</button>
    `;

    const prev = container.querySelector('#page-prev');
    const next = container.querySelector('#page-next');

    if (prev) prev.addEventListener('click', () => {
      this.currentPage--;
      this.renderTable(this.container.querySelector('#fe-search').value.toLowerCase());
    });
    if (next) next.addEventListener('click', () => {
      this.currentPage++;
      this.renderTable(this.container.querySelector('#fe-search').value.toLowerCase());
    });
  }

  attachTableEvents() {
    const tableContainer = this.container.querySelector('#fe-table-container');

    tableContainer.addEventListener('input', (e) => {
      if (e.target.classList.contains('edit-input')) {
        const tr = e.target.closest('tr');
        const rawIndex = parseInt(tr.getAttribute('data-index'));
        const lineData = this.parsedFile[rawIndex];

        if (e.target.classList.contains('tag-input')) {
          lineData.colorTag = e.target.value.trim() || null;
        } else if (e.target.classList.contains('text-input')) {
          lineData.displayText = e.target.value;
          e.target.style.height = 'auto';
          e.target.style.height = (e.target.scrollHeight) + 'px';
        }

        lineData.isModified = true;
        tr.classList.add('modified-row');
      }
    });
  }

  handleSave() {
    const newContent = FileParser.stringify(this.parsedFile);

    const blob = new Blob([newContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const exportName = this.fileName;
    a.download = exportName;

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }
}
