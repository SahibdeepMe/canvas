document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const codePreview = document.getElementById('code-preview');
  const generateBtn = document.getElementById('generate-btn');
  const outputSection = document.getElementById('output-section');
  const outputUrl = document.getElementById('output-url');
  const copyBtn = document.getElementById('copy-btn');
  const openBtn = document.getElementById('open-btn');

  // File picker triggers
  dropZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) readFile(e.target.files[0]);
  });

  // Drag & Drop handlers
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      readFile(e.dataTransfer.files[0]);
    }
  });

  function readFile(file) {
    if (!file.name.match(/\.(html|htm)$/i)) {
      alert('Please upload an HTML file (.html or .htm)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      codePreview.value = event.target.result;
    };
    reader.readAsText(file);
  }

  // Safe Unicode-compatible Base64 encoding
  function encodeBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  // Generate target URL pointing to renderer.html
  generateBtn.addEventListener('click', () => {
    const rawCode = codePreview.value.trim();
    if (!rawCode) {
      alert('Please provide some HTML code before generating.');
      return;
    }

    const payload = encodeBase64(rawCode);
    const basePath = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
    const targetUrl = `${basePath}renderer.html#${payload}`;

    outputUrl.value = targetUrl;
    outputSection.style.display = 'block';
  });

  // Action Buttons
  copyBtn.addEventListener('click', () => {
    outputUrl.select();
    navigator.clipboard.writeText(outputUrl.value);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
  });

  openBtn.addEventListener('click', () => {
    window.open(outputUrl.value, '_blank');
  });
});