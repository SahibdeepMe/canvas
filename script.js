document.addEventListener('DOMContentLoaded', () => {
  const GITHUB_USERNAME = 'sahibdeepme';
  const REPO_NAME = 'canvas';
  const BRANCH = 'main'; // Change to 'master' if your repo default branch is master

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

  // Load saved token from LocalStorage
  const savedToken = localStorage.getItem('canvas_gh_token');
  if (savedToken && tokenInput) {
    tokenInput.value = savedToken;
  }

  // File picker handler
  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        loadFile(e.target.files[0]);
      }
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        loadFile(e.dataTransfer.files[0]);
      }
    });
  }

  function loadFile(file) {
    if (!slugInput.value.trim()) {
      slugInput.value = file.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      codePreview.value = evt.target.result;
    };
    reader.readAsText(file);
  }

  // Safe UTF-8 Base64 conversion
  function toBase64Utf8(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  // Publish to GitHub REST API
  if (publishBtn) {
    publishBtn.addEventListener('click', async () => {
      const token = tokenInput.value.trim();
      const rawSlug = slugInput.value.trim();
      const content = codePreview.value.trim();

      if (!token) {
        alert('Please enter your GitHub Personal Access Token.');
        tokenInput.focus();
        return;
      }

      if (!rawSlug) {
        alert('Please specify a custom name/slug.');
        slugInput.focus();
        return;
      }

      if (!content) {
        alert('HTML Code preview is empty.');
        codePreview.focus();
        return;
      }

      // Sanitize slug
      const slug = rawSlug.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
      localStorage.setItem('canvas_gh_token', token);

      publishBtn.disabled = true;
      publishBtn.textContent = 'Deploying...';

      try {
        const filePath = `p/${slug}.html`;
        const apiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${filePath}`;

        // Step 1: Check if file exists to get SHA for updates
        let sha = null;
        try {
          const checkRes = await fetch(apiUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });

          if (checkRes.status === 200) {
            const fileData = await checkRes.json();
            sha = fileData.sha;
          }
        } catch (e) {
          console.warn('File existence check bypassed:', e);
        }

        // Step 2: Push commit via PUT request
        const putRes = await fetch(apiUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({
            message: `Deploy ${slug} via CanvasDrop`,
            content: toBase64Utf8(content),
            branch: BRANCH,
            ...(sha ? { sha } : {})
          })
        });

        if (!putRes.ok) {
          const errData = await putRes.json();
          throw new Error(errData.message || `GitHub error status: ${putRes.status}`);
        }

        // Step 3: Reveal generated link
        const targetUrl = `https://${GITHUB_USERNAME}.github.io/${REPO_NAME}/p/${slug}.html`;
        outputUrl.value = targetUrl;
        outputSection.style.display = 'block';

      } catch (err) {
        alert('Deploy failed: ' + err.message);
      } finally {
        publishBtn.disabled = false;
        publishBtn.textContent = 'Deploy Custom Page';
      }
    });
  }

  // Copy URL button
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!outputUrl.value) return;
      outputUrl.select();
      navigator.clipboard.writeText(outputUrl.value);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
    });
  }

  // Open URL button
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      if (outputUrl.value) {
        window.open(outputUrl.value, '_blank');
      }
    });
  }
});
