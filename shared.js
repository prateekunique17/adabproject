// ── SHARED STATE ──
window.AppState = {
  posts: JSON.parse(localStorage.getItem('ip_posts') || '[]'),
  recording: false,
  sequence: [],
  recStartTime: null,
  recTimer: null,
  recSeconds: 0,
};

// Seed example posts if empty
if (AppState.posts.length === 0) {
  AppState.posts = [
    { id: 1, title: 'Morning Groove', author: 'Harshit', desc: 'Quick drum loop', instrument: 'drums', emoji: '🥁', sequence: ['W','A','S','D','W','A','J'], likes: 12, time: Date.now() - 7200000 },
    { id: 2, title: 'C Major Study', author: 'Yashika', desc: 'Practicing scales', instrument: 'piano', emoji: '🎹', sequence: ['Q','E','R','T','Y','U','I'], likes: 8, time: Date.now() - 18000000 },
    { id: 3, title: 'String Thing', author: 'Adab', desc: 'Guitar synthesis test', instrument: 'guitar', emoji: '🎸', sequence: ['Z','X','C','V','B','N','M'], likes: 21, time: Date.now() - 86400000 },
  ];
  savePosts();
}

function savePosts() {
  try { localStorage.setItem('ip_posts', JSON.stringify(AppState.posts)); } catch(e) {}
}

function timeAgo(ts) {
  const d = Date.now() - ts;
  if (d < 60000) return 'just now';
  if (d < 3600000) return Math.floor(d/60000) + 'm ago';
  if (d < 86400000) return Math.floor(d/3600000) + 'h ago';
  return Math.floor(d/86400000) + 'd ago';
}

// ── RECORDING ──
function startRecording() {
  AppState.recording = true;
  AppState.sequence = [];
  AppState.recStartTime = Date.now();
  AppState.recSeconds = 0;
  const btn = document.querySelector('.ctrl-btn.record');
  const timer = document.querySelector('.rec-timer');
  if (btn) btn.classList.add('recording');
  if (btn) btn.textContent = '● REC';
  clearInterval(AppState.recTimer);
  AppState.recTimer = setInterval(() => {
    AppState.recSeconds++;
    if (timer) timer.textContent = formatTime(AppState.recSeconds);
  }, 1000);
  updateSeqStrip();
}

function stopRecording() {
  AppState.recording = false;
  clearInterval(AppState.recTimer);
  const btn = document.querySelector('.ctrl-btn.record');
  if (btn) { btn.classList.remove('recording'); btn.textContent = '● REC'; }
}

function formatTime(s) {
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}

function recordNote(key) {
  if (!AppState.recording) return;
  AppState.sequence.push(key.toUpperCase());
  updateSeqStrip();
}

function updateSeqStrip() {
  const strip = document.querySelector('.sequence-events');
  if (!strip) return;
  if (AppState.sequence.length === 0) {
    strip.innerHTML = '<span class="seq-empty">— play something to record —</span>';
    return;
  }
  strip.innerHTML = AppState.sequence.slice(-30).map(k =>
    `<span class="seq-event">${k}</span>`
  ).join('');
  strip.scrollLeft = strip.scrollWidth;
}

// ── POST MODAL ──
function openPostModal(instrument, emoji) {
  stopRecording();
  const overlay = document.getElementById('postModal');
  if (!overlay) return;
  overlay.classList.add('open');
  document.getElementById('postInstrument').value = instrument || 'unknown';
  document.getElementById('postEmoji').value = emoji || '🎵';
}

function closePostModal() {
  document.getElementById('postModal').classList.remove('open');
}

function submitPost() {
  const title = document.getElementById('postTitle').value.trim();
  const author = document.getElementById('postAuthor').value.trim();
  const desc = document.getElementById('postDesc').value.trim();
  const instrument = document.getElementById('postInstrument').value;
  const emoji = document.getElementById('postEmoji').value;
  if (!title || !author) { alert('Please fill in a title and your name!'); return; }

  const post = {
    id: Date.now(),
    title, author, desc,
    instrument, emoji,
    sequence: [...AppState.sequence],
    likes: 0,
    time: Date.now(),
  };
  AppState.posts.unshift(post);
  savePosts();
  AppState.sequence = [];
  updateSeqStrip();
  closePostModal();
  renderFeed();
  document.getElementById('postTitle').value = '';
  document.getElementById('postDesc').value = '';
}

// ── FEED RENDER ──
function renderFeed() {
  const list = document.getElementById('feedList');
  const count = document.getElementById('feedCount');
  if (!list) return;
  if (count) count.textContent = AppState.posts.length;

  list.innerHTML = AppState.posts.map(post => {
    const wave = Array.from({length: 20}, () => Math.floor(Math.random() * 18 + 4));
    return `
    <div class="feed-card" data-id="${post.id}">
      <button class="feed-play-btn" onclick="playPostSequence(${post.id})" title="Play">▶</button>
      <div class="feed-info">
        <div class="feed-title">${escHtml(post.title)}</div>
        <div class="feed-meta">${post.emoji} ${escHtml(post.instrument)} · by ${escHtml(post.author)} · ${timeAgo(post.time)}</div>
        ${post.desc ? `<div class="feed-meta" style="margin-top:2px;opacity:0.7">${escHtml(post.desc)}</div>` : ''}
      </div>
      <div class="feed-mini-wave">
        ${wave.map(h => `<span style="height:${h}px"></span>`).join('')}
      </div>
      <button class="feed-like-btn ${isLiked(post.id) ? 'liked' : ''}" onclick="toggleLike(${post.id}, this)">
        ♥ ${post.likes}
      </button>
    </div>`;
  }).join('');
}

function escHtml(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function isLiked(id) {
  const liked = JSON.parse(localStorage.getItem('ip_liked') || '[]');
  return liked.includes(id);
}

function toggleLike(id, btn) {
  const liked = JSON.parse(localStorage.getItem('ip_liked') || '[]');
  const post = AppState.posts.find(p => p.id === id);
  if (!post) return;
  if (liked.includes(id)) {
    const idx = liked.indexOf(id);
    liked.splice(idx, 1);
    post.likes = Math.max(0, post.likes - 1);
    btn.classList.remove('liked');
  } else {
    liked.push(id);
    post.likes++;
    btn.classList.add('liked');
  }
  btn.textContent = `♥ ${post.likes}`;
  localStorage.setItem('ip_liked', JSON.stringify(liked));
  savePosts();
}

// ── PLAY BACK A POST ──
function playPostSequence(id) {
  const post = AppState.posts.find(p => p.id === id);
  if (!post || !post.sequence || !post.sequence.length) return;
  post.sequence.forEach((key, i) => {
    setTimeout(() => {
      if (typeof makeSound === 'function') makeSound(key.toLowerCase());
      if (typeof buttonAnimation === 'function') buttonAnimation(key.toLowerCase());
    }, i * 250);
  });
}

// ── BUTTON ANIMATION ──
function buttonAnimation(key) {
  const btn = document.querySelector('.' + CSS.escape(key));
  if (!btn) return;
  btn.classList.add('pressed');
  setTimeout(() => btn.classList.remove('pressed'), 120);
}

// ── INIT CONTROLS ──
document.addEventListener('DOMContentLoaded', () => {
  // record button
  const recBtn = document.querySelector('.ctrl-btn.record');
  if (recBtn) recBtn.addEventListener('click', () => {
    if (AppState.recording) stopRecording();
    else startRecording();
  });

  // post button
  const postBtn = document.querySelector('.ctrl-btn.post');
  if (postBtn) {
    const instr = document.body.dataset.instrument || 'unknown';
    const emoji = document.body.dataset.emoji || '🎵';
    postBtn.addEventListener('click', () => openPostModal(instr, emoji));
  }

  // modal close
  const overlay = document.getElementById('postModal');
  if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) closePostModal(); });

  // keyboard events
  document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (!document.querySelector('.' + CSS.escape(key))) return;
    if (typeof makeSound === 'function') makeSound(key);
    buttonAnimation(key);
    recordNote(key);
  });

  // click events on all buttons
  document.querySelectorAll('[class*="drum"],[class*="piano"],[class*="guitar-btn"],[class*="synth-btn"]').forEach(btn => {
    btn.addEventListener('click', function() {
      const key = this.dataset.key || this.innerHTML.trim().toLowerCase()[0];
      if (typeof makeSound === 'function') makeSound(key);
      buttonAnimation(key);
      recordNote(key);
    });
  });

  updateSeqStrip();
  renderFeed();
});
