// Semantic search module
// Embedding model must match scripts/generate-embeddings.mjs — see that file for details.

const VECTORS_URL = '/semantic-search/vectors.json';
const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3';
const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';

export function initSemanticSearch({ esc, setMode }) {
  const askForm = document.getElementById('ask-form');
  const askInput = document.getElementById('ask-input');
  const conversation = document.getElementById('ask-conversation');

  let extractor = null;
  let vectorData = null;
  let isLoading = false;

  function addMessage(type, html) {
    const msg = document.createElement('div');
    msg.className = `kh-ask__message kh-ask__message--${type}`;
    msg.innerHTML = html;
    conversation.appendChild(msg);
    conversation.scrollTop = conversation.scrollHeight;
    return msg;
  }

  // Dot product — vectors are already unit-length (normalize: true)
  function dotSimilarity(a, b) {
    let dot = 0;
    for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
    return dot;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
    } catch {
      return '';
    }
  }

  function renderResults(results, query) {
    if (results.length === 0) {
      return `<p>I couldn't find anything closely related to that. Try rephrasing, or switch to <a href="#" onclick="setMode('keyword'); return false;">keyword search</a>.</p>`;
    }

    let intro;
    if (results.length === 1) {
      intro = results[0].score > 0.45
        ? '<p>I found one post that closely matches:</p>'
        : '<p>I found one post that might be relevant:</p>';
    } else {
      intro = `<p>Here are ${results.length} posts that might be relevant:</p>`;
    }

    const cards = results.map(r => {
      const date = formatDate(r.date);
      const score = Math.round(r.score * 100);
      const meta = [date, `${score}% match`].filter(Boolean).join(' · ');
      const displayText = r.snippet || r.teaser || '';
      return `<div class="kh-ask__result">
        <a href="${esc(r.url)}"><h3>${esc(r.title || r.url)}</h3></a>
        ${displayText ? `<p>${esc(displayText)}</p>` : ''}
        <p class="kh-ask__result-meta">${esc(meta)}</p>
      </div>`;
    }).join('');

    const fallback = `<p class="kh-ask__fallback">Not what you were looking for? Switch to <a href="#" onclick="setMode('keyword'); return false;">keyword search</a>.</p>`;

    return `${intro}<div class="kh-ask__results">${cards}</div>${fallback}`;
  }

  async function loadModel(statusMsg) {
    statusMsg.innerHTML = '<p>Loading search model (one-time ~30 MB download)...</p><progress max="100" value="0"></progress>';
    const progressBar = statusMsg.querySelector('progress');

    // Fetch vectors and import Transformers.js in parallel
    const [vectorResp, { pipeline: tfPipeline }] = await Promise.all([
      fetch(VECTORS_URL),
      import(TRANSFORMERS_URL),
    ]);
    if (!vectorResp.ok) throw new Error(`Failed to load vectors: ${vectorResp.status}`);
    vectorData = await vectorResp.json();
    if (vectorData.version !== 2) throw new Error('Stale vectors.json — run yarn build to regenerate');

    extractor = await tfPipeline('feature-extraction', MODEL_ID, {
      dtype: 'q8',
      progress_callback: (progress) => {
        if (progress.status === 'progress' && progressBar) {
          progressBar.value = Math.round(progress.progress);
        }
      },
    });
  }

  async function handleQuery(query) {
    if (!query.trim() || isLoading) return;
    isLoading = true;

    addMessage('user', `<p>${esc(query)}</p>`);
    askInput.value = '';

    const url = new URL(window.location);
    url.searchParams.set('q', query);
    url.searchParams.set('search_type', 'semantic');
    window.history.replaceState({}, '', url);

    try {
      if (!extractor) {
        const statusMsg = addMessage('status', '<p>Preparing search...</p>');
        await loadModel(statusMsg);
        statusMsg.remove();
      }

      const thinkingMsg = addMessage('status', '<p>Searching...</p>');

      const output = await extractor(query, { pooling: 'mean', normalize: true });
      const queryVec = output.data; // Float32Array, no copy needed

      // Score every chunk, then keep best chunk per URL
      const chunks = vectorData.chunks;
      const scored = chunks.map((chunk, i) => ({ i, score: dotSimilarity(queryVec, chunk.embedding) }));
      const bestByUrl = new Map();
      for (const s of scored) {
        const url = chunks[s.i].url;
        const prev = bestByUrl.get(url);
        if (!prev || s.score > prev.score) bestByUrl.set(url, s);
      }

      // Short queries (abbreviations like "CV") produce weaker embeddings — lower the threshold
      const threshold = query.trim().length < 4 ? 0.15 : 0.25;
      const results = [...bestByUrl.values()]
        .sort((a, b) => b.score - a.score)
        .filter(d => d.score > threshold)
        .slice(0, 5)
        .map(d => ({ ...chunks[d.i], score: d.score }));

      thinkingMsg.remove();
      addMessage('system', renderResults(results, query));
    } catch (err) {
      console.error('Semantic search error:', err);
      addMessage('system', `<p>Something went wrong loading the search model. Switch to <a href="#" onclick="setMode('keyword'); return false;">keyword search</a> instead.</p>`);
    }

    isLoading = false;
  }

  askForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleQuery(askInput.value);
  });

  return { handleQuery, askInput };
}
