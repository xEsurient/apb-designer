/**
 * FileEditor - Handles UI for modifying localization files
 */
import { FileParser } from './FileParser.js';
import DOMPurify from 'dompurify';

export class FileEditor {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.parsedFile = [];
    this.fileName = '';
    this.entries = []; // Cached reference to just 'entry' types
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
    
    this.renderTable();
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
      // Security: use DOMPurify when injecting variables into HTML structure
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
    
    // Delegate events for performance
    tableContainer.addEventListener('input', (e) => {
      if (e.target.classList.contains('edit-input')) {
        const tr = e.target.closest('tr');
        const rawIndex = parseInt(tr.getAttribute('data-index'));
        const lineData = this.parsedFile[rawIndex];
        
        if (e.target.classList.contains('tag-input')) {
          lineData.colorTag = e.target.value.trim() || null;
        } else if (e.target.classList.contains('text-input')) {
          lineData.displayText = e.target.value;
          // Auto-expand textarea
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
    
    // Create Blob and trigger download
    const blob = new Blob([newContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Prepend 'Modified_' to filename
    const exportName = this.fileName.startsWith('Modified_') ? this.fileName : 'Modified_' + this.fileName;
    a.download = exportName;
    
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }
}
