document.addEventListener('DOMContentLoaded', () => {
  const GITHUB_USERNAME = 'sahibdeepme';
  const REPO_NAME = 'canvas';
  const BRANCH = 'main'; // or 'master' depending on your repo default

  const tokenInput = document.getElementById('gh-token');
  const slugInput = document.getElementById('project-slug');
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const codePreview = document.getElementById('code-preview');
  const publishBtn = document.getElementById('publish-btn');
  const outputSection = document.getElementById('output-section');
  const outputUrl = document.getElementById('output-url');
  const copyBtn = document.getElementById('copy-btn');
  const openBtn = document.getElementById('open-btn');

  // Restore saved token if available
  const savedToken = localStorage.getItem('canvas_gh_token');
  if (savedToken) tokenInput.value = savedToken;

  dropZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      const file = e.target.files[0];
      // Auto-populate slug from file name if empty
      if (!slugInput.value) {
        slugInput.value = file.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9-_]/g, '-');
      }
      const reader = new FileReader();
      reader.onload = (evt) => codePreview.value = evt.target.result;
      reader.readAsText(file);
    }
  });

  publishBtn.addEventListener('click', async () => {
    const token = tokenInput.value.trim();
    const slug = slugInput.value.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const content = codePreview.value.trim();

    if (!token) return alert('Enter your GitHub token once so it can commit to your repo.');
    if (!slug) return alert('Please provide a short custom name for the URL.');
    if (!content) return alert('HTML content is empty.');

    localStorage.setItem('canvas_gh_token', token);
    publishBtn.disabled = true;
    publishBtn.textContent = 'Publishing...';

    try {
      const filePath = `p/${slug}.html`;
      const apiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${filePath}`;

      // 1. Check if the file already exists to obtain SHA (for updates)
      let sha = null;
      const getRes = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (getRes.status === 200) {
        const data = await getRes.json();
        sha = data.sha;
      }

      // 2. Base64 encode for the GitHub API (Unicode-safe)
      const base64Content = btoa(unescape(encodeURIComponent(content)));

      // 3. Commit to repository
      const putRes = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Add ${slug} via CanvasDrop`,
          content: base64Content,
          branch: BRANCH,
          ...(sha ? { sha } : {})
        })
      });

      if (!putRes.ok) {
        const errData = await putRes.json();
        throw new Error(errData.message || 'Failed to upload to GitHub');
      }

      // Short clean URL
      const finalUrl = `https://${GITHUB_USERNAME}.github.io/${REPO_NAME}/p/${slug}.html`;
      outputUrl.value = finalUrl;
      outputSection.style.display = 'block';
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      publishBtn.disabled = false;
      publishBtn.textContent = 'Deploy Custom Page';
    }
  });

  copyBtn.addEventListener('click', () => {
    outputUrl.select();
    navigator.clipboard.writeText(outputUrl.value);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => copyBtn.textContent = 'Copy', 1500);
  });

  openBtn.addEventListener('click', () => {
    window.open(outputUrl.value, '_blank');
  });
});
