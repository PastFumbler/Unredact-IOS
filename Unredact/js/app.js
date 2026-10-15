(function () {
  'use strict';
  var C = window.RedCore;
  var A = null;
  var IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var STANDALONE = window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  var $ = function (id) { return document.getElementById(id); };

  var API = 'https://en.wikipedia.org/w/api.php?action=parse&format=json&formatversion=2&origin=*&redirects=1' +
    '&prop=text%7Cproperties&disableeditsection=1&disabletoc=1&page=';
  var EPOCH = Date.UTC(2026, 9, 14);           // 14 Oct 2026 is puzzle #1
  var ORDER = C.shuffled(window.RED_ARTICLES, 20261014);
  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Storage ---------- */
  function load(k, d) { try { var v = localStorage.getItem('rr:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem('rr:' + k, JSON.stringify(v)); } catch (e) { /* storage full; not critical */ } }

  var settings = Object.assign({ counts: true, autoscroll: true, theme: 'system', size: 'm' }, load('settings', {}));

  /* ---------- Game state ---------- */
  var S = null;
  function fresh() {
    return { mode: 'daily', num: 0, id: '', title: '', req: '', tokens: [], byKey: new Map(), titleKeys: new Set(),
      guesses: [], guessKeys: new Set(), status: 'loading', elapsed: 0, sel: null, fact: null, recorded: false };
  }

  function todayNum() {
    var d = new Date();
    return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - EPOCH) / 864e5) + 1;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmtTime(sec) { var m = Math.floor(sec / 60), s = sec % 60; return m + ':' + (s < 10 ? '0' : '') + s; }
  function plural(n, one, many) { return n === 1 ? one : many; }
  function matches(n) { return n + ' ' + plural(n, 'match', 'matches'); }

  /* ---------- Theme ---------- */
  function applyTheme() {
    var root = document.documentElement;
    var sysDark = A && A.isDark ? A.isDark() : (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    root.dataset.sys = sysDark ? 'dark' : 'light';
    if (settings.theme === 'system') delete root.dataset.theme; else root.dataset.theme = settings.theme;
    root.style.setProperty('--text-size', { s: '.95rem', m: '1.0625rem', l: '1.2rem' }[settings.size] || '1.0625rem');
    document.body.classList.toggle('counts', !!settings.counts);
    if (A && A.setBarColors) {
      var cs = getComputedStyle(root);
      var dark = settings.theme === 'dark' || (settings.theme === 'system' && sysDark);
      A.setBarColors(cs.getPropertyValue('--chrome').trim(), cs.getPropertyValue('--chrome').trim(), dark);
    }
  }
  if (window.matchMedia) { var mq = matchMedia('(prefers-color-scheme: dark)'); (mq.addEventListener ? mq.addEventListener('change', applyTheme) : mq.addListener(applyTheme)); }

  /* ---------- Messages ---------- */
  var toastTimer = null;
  function toast(msg, ms) {
    var t = $('toast');
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('on'); }, ms || 2000);
  }

  /* ---------- Loading the article ---------- */
  function fetchArticle(title) {
    return fetch(API + encodeURIComponent(title)).then(function (r) {
      if (!r.ok) throw { net: true };
      return r.json();
    }, function () { throw { net: true }; }).then(function (data) {
      if (data.error || !data.parse) throw { skip: true };
      var props = data.parse.properties || {};
      if (Object.prototype.hasOwnProperty.call(props, 'disambiguation')) throw { skip: true };
      var doc = new DOMParser().parseFromString(data.parse.text, 'text/html');
      var blocks = C.extractBlocks(doc);
      if (blocks.length < 3) throw { skip: true };
      return { title: data.parse.title, blocks: blocks };
    });
  }

  function loadFor(mode, num, req) {
    var cache = load('cache', null);
    var id = mode === 'random' ? 'r:' + req : 'd' + num;
    if (cache && cache.id === id) return Promise.resolve(cache);
    var attempt = 0;
    function next() {
      var title = mode === 'random' ? req : ORDER[(num - 1 + attempt) % ORDER.length];
      return fetchArticle(title).then(function (a) {
        var c = { id: id, title: a.title, blocks: a.blocks };
        save('cache', c);
        return c;
      }, function (err) {
        if (err && err.skip && attempt < 6) {
          attempt++;
          if (mode === 'random') { req = randomTitle(); id = 'r:' + req; S.req = req; S.id = id; }
          return next();
        }
        throw err;
      });
    }
    return next();
  }

  function randomTitle() { return window.RED_ARTICLES[Math.floor(Math.random() * window.RED_ARTICLES.length)]; }

  /* ---------- Rendering ---------- */
  function addTokens(parent, text, isTitle) {
    var parts = C.tokenize(text), frag = document.createDocumentFragment();
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (!p.w || p.stop) { frag.appendChild(document.createTextNode(p.text)); continue; }
      var el = document.createElement('span');
      var idx = S.tokens.length;
      el.className = 'w r';
      el.dataset.i = idx;
      el.dataset.n = p.text.length;
      el.style.setProperty('--n', p.text.length);
      frag.appendChild(el);
      S.tokens.push({ el: el, text: p.text, key: p.key, revealed: false, title: isTitle });
      var list = S.byKey.get(p.key);
      if (!list) S.byKey.set(p.key, list = []);
      list.push(idx);
      if (isTitle) S.titleKeys.add(p.key);
    }
    parent.appendChild(frag);
  }

  function render(article) {
    S.title = article.title;
    var h1 = $('title'); h1.textContent = '';
    addTokens(h1, C.displayTitle(article.title), true);
    var body = $('body'); body.textContent = '';
    var frag = document.createDocumentFragment(), ul = null;
    article.blocks.forEach(function (b) {
      var el;
      if (b.t === 'li') {
        if (!ul) { ul = document.createElement('ul'); frag.appendChild(ul); }
        el = document.createElement('li'); ul.appendChild(el);
      } else {
        ul = null;
        el = document.createElement(b.t === 'h2' ? 'h2' : b.t === 'h3' ? 'h3' : b.t === 'q' ? 'blockquote' : 'p');
        frag.appendChild(el);
      }
      addTokens(el, b.text, false);
    });
    body.appendChild(frag);
  }

  function showToken(t, cls) {
    t.revealed = true;
    t.el.className = 'w' + (cls ? ' ' + cls : '');
    t.el.textContent = t.text;
    t.el.style.removeProperty('--n');
    t.el.removeAttribute('data-n');
  }
  function reveal(key, animate, cls) {
    var list = S.byKey.get(key) || [];
    for (var i = 0; i < list.length; i++) {
      var t = S.tokens[list[i]];
      if (!t.revealed) showToken(t, animate && !REDUCED ? 'hit' + (cls ? ' ' + cls : '') : cls);
    }
    if (animate) setTimeout(function () {
      list.forEach(function (i) { S.tokens[i].el.classList.remove('hit'); });
    }, 1700);
    return list.length;
  }

  /* ---------- Highlighting and jumping between matches ---------- */
  function clearSel() {
    if (!S.sel) return;
    (S.byKey.get(S.sel.key) || []).forEach(function (i) { S.tokens[i].el.classList.remove('sel', 'cur'); });
    S.sel = null;
  }
  function jump(key, quiet) {
    var list = S.byKey.get(key) || [];
    if (!list.length) { toast('That word is not in the article'); return; }
    if (!S.sel || S.sel.key !== key) {
      clearSel();
      S.sel = { key: key, i: -1 };
      list.forEach(function (i) { S.tokens[i].el.classList.add('sel'); });
    }
    if (S.sel.i >= 0) S.tokens[list[S.sel.i]].el.classList.remove('cur');
    S.sel.i = (S.sel.i + 1) % list.length;
    var el = S.tokens[list[S.sel.i]].el;
    el.classList.add('cur');
    el.scrollIntoView({ block: 'center', behavior: REDUCED ? 'auto' : 'smooth' });
    if (!quiet) toast((S.sel.i + 1) + ' of ' + list.length, 1200);
  }

  /* ---------- Guesses ---------- */
  function addGuess(text, key, hint, animate) {
    var hits = reveal(key, animate, hint ? 'hinted' : '');
    S.guesses.push({ text: text, key: key, hits: hits, hint: !!hint });
    S.guessKeys.add(key);
    return hits;
  }

  function submit() {
    var input = $('guessInput'), raw = input.value;
    input.value = '';
    if (S.status !== 'playing') return;
    var parts = C.parseGuess(raw);
    if (!parts.length) { toast('Type a word first'); return; }
    var real = parts.filter(function (p) { return !p.stop; });
    if (real.length) parts = real;
    var lastKey = null, lastHits = 0, msg = '';
    parts.forEach(function (p) {
      if (p.stop) { msg = '"' + p.text + '" is a common word, it\'s already shown'; return; }
      if (S.guessKeys.has(p.key)) { msg = 'Already guessed: "' + p.text + '"'; lastKey = p.key; lastHits = -1; return; }
      var hits = addGuess(p.text, p.key, false, true);
      lastKey = p.key; lastHits = hits;
      msg = hits ? '"' + p.text + '": ' + matches(hits) : '"' + p.text + '" is not in the article';
    });
    toast(msg);
    afterMove(true);
    if (lastKey && lastHits !== 0 && (settings.autoscroll || lastHits === -1) && S.status === 'playing') jump(lastKey, true);
    checkWin();
  }

  function useHint() {
    if (S.status !== 'playing') return;
    var cands = [];
    S.byKey.forEach(function (list, key) {
      if (S.guessKeys.has(key) || S.titleKeys.has(key) || /^\d+$/.test(key)) return;
      cands.push({ key: key, n: list.length });
    });
    if (!cands.length) { toast('No hints left'); return; }
    cands.sort(function (a, b) { return b.n - a.n; });
    var pick = cands[Math.floor(Math.random() * Math.min(25, cands.length))];
    var t = S.tokens[S.byKey.get(pick.key)[0]];
    var hits = addGuess(t.text.toLowerCase(), pick.key, true, true);
    toast('Hint: "' + t.text.toLowerCase() + '", ' + matches(hits));
    afterMove(true);
    if (settings.autoscroll) jump(pick.key, true);
  }

  function afterMove(persist) {
    renderChips();
    updateStatus();
    if (persist) persistGame();
  }

  function accuracy() {
    var real = S.guesses.filter(function (g) { return !g.hint; });
    if (!real.length) return null;
    return Math.round(100 * real.filter(function (g) { return g.hits > 0; }).length / real.length);
  }
  function updateStatus() {
    $('sGuesses').textContent = S.guesses.filter(function (g) { return !g.hint; }).length;
    var a = accuracy();
    $('sAcc').textContent = a == null ? '—' : a + '%';
    $('sTime').textContent = fmtTime(S.elapsed);
    $('guessCount').textContent = S.guesses.length;
  }

  function renderChips() {
    var box = $('chips'); box.textContent = '';
    var recent = S.guesses.slice(-30).reverse();
    recent.forEach(function (g, i) {
      var b = document.createElement('button');
      b.className = 'chip' + (g.hits ? '' : ' zero') + (i === 0 ? ' fresh' : '');
      b.innerHTML = esc(g.text) + ' <b>' + g.hits + '</b>';
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); });
      b.addEventListener('click', function () { jump(g.key); });
      box.appendChild(b);
    });
    box.scrollLeft = 0;
  }

  /* ---------- End of game ---------- */
  function checkWin() {
    if (S.status !== 'playing' || !S.titleKeys.size) return;
    var all = true;
    S.titleKeys.forEach(function (k) { if (!S.guessKeys.has(k)) all = false; });
    if (all) finish('won', true);
  }

  function finish(status, animate) {
    S.status = status;
    clearSel();
    S.tokens.forEach(function (t) { if (!t.revealed) showToken(t, 'late'); });
    var stamp = $('stamp');
    stamp.textContent = status === 'won' ? 'Declassified' : 'Revealed';
    stamp.className = 'stamp ' + (status === 'lost' ? 'lost ' : '') + (animate && !REDUCED ? 'on' : 'static');
    if (!S.fact) S.fact = pickFact();
    if (!S.recorded) { recordStats(); S.recorded = true; }
    persistGame();
    $('guessInput').blur();
    $('dock').querySelector('.input-row').hidden = true;
    $('doneRow').hidden = false;
    $('nextBtn').textContent = nextLabel();
    var note = $('endNote');
    note.hidden = false;
    note.textContent = 'Words you didn\'t find are shown in grey. Text from Wikipedia, CC BY-SA.';
    document.querySelector('#scroller').scrollTo({ top: 0, behavior: animate && !REDUCED ? 'smooth' : 'auto' });
    if (animate) setTimeout(showResults, REDUCED ? 100 : 900);
  }

  /* Rare facts: a shuffled deck, no repeats until every fact has been shown. */
  function pickFact() {
    var list = window.RARE_FACTS || [];
    if (!list.length) return null;
    var bag = load('factBag', []).filter(function (i) { return i < list.length; });
    if (!bag.length) {
      bag = C.shuffled(list.map(function (_, i) { return i; }), (Date.now() & 0x7fffffff));
      var last = load('factLast', -1);
      if (bag.length > 1 && bag[0] === last) bag.push(bag.shift());
    }
    var idx = bag.shift();
    save('factBag', bag);
    save('factLast', idx);
    return list[idx];
  }

  function recordStats() {
    var st = load('stats', { daily: {}, random: { played: 0, won: 0 } });
    var real = S.guesses.filter(function (g) { return !g.hint; }).length;
    if (S.mode === 'random') {
      st.random.played++; if (S.status === 'won') st.random.won++;
    } else if (!st.daily[S.num]) {
      st.daily[S.num] = { s: S.status, g: real, a: accuracy(), t: S.elapsed, h: S.guesses.length - real, onDay: S.num === todayNum() };
    }
    save('stats', st);
  }

  function nextLabel() {
    var g = load('g:d' + todayNum(), null);
    return (!g || g.status === 'playing') && !(S.mode !== 'random' && S.num === todayNum()) ? "Today's puzzle" : 'Next article';
  }
  function goNext() {
    closePanel();
    var g = load('g:d' + todayNum(), null);
    if ((!g || g.status === 'playing') && !(S.mode !== 'random' && S.num === todayNum())) start('daily', todayNum());
    else start('random', 0, randomTitle());
  }

  function wikiUrl() { return 'https://en.wikipedia.org/wiki/' + encodeURIComponent(S.title.replace(/ /g, '_')); }
  function openUrl(u) { var w = window.open(u, '_blank'); if (!w) location.href = u; }

  function shareText() {
    var real = S.guesses.filter(function (g) { return !g.hint; }).length;
    var head = S.mode === 'random' ? 'Unredact, random article' : 'Unredact #' + S.num;
    var res = S.status === 'won' ? 'Declassified in ' + real + ' ' + plural(real, 'guess', 'guesses') : 'Not solved';
    var a = accuracy();
    var hints = S.guesses.length - real;
    return head + '\n' + res + '\nAccuracy ' + (a == null ? '-' : a + '%') + ', time ' + fmtTime(S.elapsed) +
      (hints ? '\nHints: ' + hints : '');
  }
  function share() {
    var text = shareText();
    if (A && A.share) { A.share(text); return; }
    if (navigator.share) { navigator.share({ text: text }).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { toast('Result copied'); });
  }

  /* ---------- Saving and restoring ---------- */
  function persistGame() {
    if (!S.id) return;
    save('g:' + S.id, {
      title: S.title, status: S.status, elapsed: S.elapsed, fact: S.fact, recorded: S.recorded,
      guesses: S.guesses.map(function (g) { return { text: g.text, key: g.key, hint: g.hint }; })
    });
    save('last', { mode: S.mode, num: S.num, req: S.req });
  }

  function restore() {
    var g = load('g:' + S.id, null);
    if (!g) return;
    S.elapsed = g.elapsed || 0;
    S.fact = g.fact || null;
    S.recorded = !!g.recorded;
    (g.guesses || []).forEach(function (x) { if (!S.guessKeys.has(x.key)) addGuess(x.text, x.key, x.hint, false); });
    if (g.status === 'won' || g.status === 'lost') finish(g.status, false);
  }

  /* ---------- Starting a puzzle ---------- */
  function puzzleLabel() {
    if (S.mode === 'random') return 'Random article';
    return (S.num === todayNum() ? "Today's puzzle #" : 'Archive #') + S.num;
  }

  function start(mode, num, req) {
    closePanel();
    S = fresh();
    S.mode = mode === 'archive' ? 'daily' : mode;
    S.num = num || 0;
    S.req = req || '';
    S.id = S.mode === 'random' ? 'r:' + S.req : 'd' + S.num;
    $('puzzleLabel').textContent = puzzleLabel();
    $('title').textContent = ''; $('body').textContent = '';
    $('stamp').className = 'stamp';
    $('endNote').hidden = true;
    $('error').hidden = true;
    $('loading').hidden = false;
    $('doneRow').hidden = true;
    $('dock').querySelector('.input-row').hidden = false;
    renderChips(); updateStatus();
    $('scroller').scrollTop = 0;
    var mine = S;
    loadFor(S.mode, S.num, S.req).then(function (article) {
      if (S !== mine) return;
      $('loading').hidden = true;
      render(article);
      S.status = 'playing';
      restore();
      renderChips(); updateStatus();
      persistGame();
    }, function (err) {
      if (S !== mine) return;
      S.status = 'error';
      $('loading').hidden = true;
      $('error').hidden = false;
      $('errorText').textContent = err && err.net
        ? 'The article could not be loaded. Check your internet connection and try again.'
        : 'Wikipedia did not return a usable article. Try again, or pick a random one from the menu.';
    });
  }

  /* ---------- Timer ---------- */
  var tick = 0;
  setInterval(function () {
    if (!S || S.status !== 'playing' || document.hidden) return;
    S.elapsed++;
    $('sTime').textContent = fmtTime(S.elapsed);
    if (++tick % 5 === 0) persistGame();
  }, 1000);
  document.addEventListener('visibilitychange', function () { if (document.hidden && S) persistGame(); });

  /* ---------- Bottom sheets ---------- */
  var panelOpen = false;
  function openPanel(html, bind) {
    $('panelContent').innerHTML = html;
    $('scrim').hidden = false;
    var p = $('sheetPanel'); p.hidden = false; p.scrollTop = 0;
    panelOpen = true;
    $('guessInput').blur();
    if (bind) bind($('panelContent'));
  }
  function closePanel() {
    if (!panelOpen) return;
    $('scrim').hidden = true; $('sheetPanel').hidden = true; panelOpen = false;
  }
  window.onAndroidBack = function () {
    if (panelOpen) { closePanel(); return true; }
    if (S && S.sel) { clearSel(); return true; }
    return false;
  };

  function showResults() {
    var real = S.guesses.filter(function (g) { return !g.hint; }).length;
    var a = accuracy(), hints = S.guesses.length - real;
    var fact = S.fact
      ? '<div class="fact"><div class="fact-label">Something rare to know</div><p class="fact-text">' + esc(S.fact) + '</p></div>'
      : '';
    openPanel(
      '<p class="result-title">' + (S.status === 'won' ? 'Article declassified!' : 'Article revealed') + '</p>' +
      '<p class="result-sub">' + esc(S.title) + (hints ? ', hints used: ' + hints : '') + '</p>' +
      '<div class="stats-grid">' +
      '<div class="stat"><b>' + real + '</b><span>' + plural(real, 'guess', 'guesses') + '</span></div>' +
      '<div class="stat"><b>' + (a == null ? '-' : a + '%') + '</b><span>accuracy</span></div>' +
      '<div class="stat"><b>' + fmtTime(S.elapsed) + '</b><span>time</span></div></div>' +
      fact +
      '<div class="btn-col"><div class="btn-pair">' +
      '<button class="btn primary" data-a="next">' + nextLabel() + '</button>' +
      '<button class="btn" data-a="wiki">Read article</button></div>' +
      '<button class="btn" data-a="share">Share result</button></div>',
      function (root) {
        root.querySelector('[data-a=next]').onclick = goNext;
        root.querySelector('[data-a=wiki]').onclick = function () { openUrl(wikiUrl()); };
        root.querySelector('[data-a=share]').onclick = share;
      });
  }

  var listSort = 'order';
  function showGuessList() {
    var items = S.guesses.map(function (g, i) { return { g: g, i: i + 1 }; });
    if (listSort === 'hits') items.sort(function (a, b) { return b.g.hits - a.g.hits || a.i - b.i; });
    if (listSort === 'alpha') items.sort(function (a, b) { return a.g.text.localeCompare(b.g.text, 'en'); });
    var rows = items.map(function (x) {
      return '<li class="' + (x.g.hits ? '' : 'zero') + '" data-k="' + esc(x.g.key) + '"><span class="num">' + x.i + '</span>' +
        '<span class="word">' + esc(x.g.text) + (x.g.hint ? ' <span class="tag">hint</span>' : '') + '</span>' +
        '<span class="hits">' + x.g.hits + '</span></li>';
    }).join('');
    openPanel('<h2>Your guesses</h2>' +
      '<div class="seg"><button data-s="order">In order</button><button data-s="hits">Most matches</button><button data-s="alpha">A–Z</button></div>' +
      (rows ? '<ul class="glist">' + rows + '</ul>' : '<p class="empty">No guesses yet. Broad words are a good start: "year", "city", "known".</p>'),
      function (root) {
        root.querySelectorAll('.seg button').forEach(function (b) {
          b.classList.toggle('on', b.dataset.s === listSort);
          b.onclick = function () { listSort = b.dataset.s; showGuessList(); };
        });
        root.querySelectorAll('.glist li').forEach(function (li) {
          li.onclick = function () { closePanel(); jump(li.dataset.k); };
        });
      });
  }

  function showMenu() {
    var n = todayNum(), g = load('g:d' + n, null);
    var dailyState = !g ? 'Not started' : g.status === 'won' ? 'Solved' : g.status === 'lost' ? 'Revealed' : 'In progress';
    openPanel('<div class="menu-list">' +
      '<button class="menu-item" data-a="daily"><div>Today\'s puzzle #' + n + '<small>' + dailyState + '</small></div></button>' +
      '<button class="menu-item" data-a="random"><div>Random article<small>Unlimited, play as many as you like</small></div></button>' +
      '<button class="menu-item" data-a="archive"><div>Archive<small>Earlier daily puzzles by number</small></div></button>' +
      '<button class="menu-item" data-a="list"><div>Your guesses<small>Every word you\'ve tried in this puzzle</small></div></button>' +
      '<button class="menu-item" data-a="stats"><div>Statistics</div></button>' +
      '<button class="menu-item" data-a="settings"><div>Settings</div></button>' +
      '<button class="menu-item" data-a="help"><div>How to play</div></button>' +
      (S && S.status === 'playing' ? '<button class="menu-item danger" data-a="giveup"><div>Give up and reveal the article</div></button>' : '') +
      '</div>', function (root) {
        var h = {
          daily: function () { start('daily', n); },
          random: function () { start('random', 0, randomTitle()); },
          archive: showArchive, list: showGuessList, stats: showStats, settings: showSettings, help: showHelp,
          giveup: confirmGiveUp
        };
        root.querySelectorAll('[data-a]').forEach(function (b) { b.onclick = h[b.dataset.a]; });
      });
  }

  function confirmGiveUp() {
    openPanel('<h2>Give up?</h2><p>The whole article will be revealed and this puzzle will count as unsolved.</p>' +
      '<div class="btn-pair"><button class="btn" data-a="no">Keep playing</button><button class="btn primary" data-a="yes">Give up</button></div>',
      function (root) {
        root.querySelector('[data-a=no]').onclick = closePanel;
        root.querySelector('[data-a=yes]').onclick = function () { closePanel(); finish('lost', true); };
      });
  }

  function showArchive() {
    var n = todayNum();
    openPanel('<h2>Archive</h2><p>Puzzles 1 to ' + n + '. There\'s a new one every day.</p>' +
      '<div class="input-row"><input class="num-input" id="archNum" type="number" inputmode="numeric" min="1" max="' + n + '" value="' + Math.max(1, n - 1) + '" style="flex:1">' +
      '<button class="btn primary" id="archGo">Play</button></div>', function (root) {
        root.querySelector('#archGo').onclick = function () {
          var v = parseInt(root.querySelector('#archNum').value, 10);
          if (!(v >= 1 && v <= n)) { toast('Enter a number from 1 to ' + n); return; }
          start('archive', v);
        };
      });
  }

  function streaks(st) {
    var n = todayNum(), cur = 0, best = 0, run = 0;
    var won = function (d) { var r = st.daily[d]; return r && r.s === 'won' && r.onDay; };
    for (var d = 1; d <= n; d++) { if (won(d)) { run++; best = Math.max(best, run); } else run = 0; }
    var from = won(n) ? n : n - 1;
    for (var k = from; k >= 1 && won(k); k--) cur++;
    return { cur: cur, best: best };
  }
  function showStats() {
    var st = load('stats', { daily: {}, random: { played: 0, won: 0 } });
    var days = Object.keys(st.daily).map(function (k) { return st.daily[k]; });
    var wins = days.filter(function (r) { return r.s === 'won'; });
    var avg = wins.length ? Math.round(wins.reduce(function (s, r) { return s + r.g; }, 0) / wins.length) : '-';
    var sk = streaks(st);
    openPanel('<h2>Statistics</h2>' +
      '<div class="stats-grid">' +
      '<div class="stat"><b>' + days.length + '</b><span>played</span></div>' +
      '<div class="stat"><b>' + (days.length ? Math.round(100 * wins.length / days.length) + '%' : '-') + '</b><span>solved</span></div>' +
      '<div class="stat"><b>' + avg + '</b><span>avg guesses</span></div>' +
      '<div class="stat"><b>' + sk.cur + '</b><span>streak</span></div>' +
      '<div class="stat"><b>' + sk.best + '</b><span>best streak</span></div>' +
      '<div class="stat"><b>' + st.random.won + '/' + st.random.played + '</b><span>random</span></div></div>' +
      '<p class="result-sub">Your streak grows when you solve the daily puzzle on its own day.</p>');
  }

  function showSettings() {
    function sw(id, label, hint, on) {
      return '<label class="row-set"><div>' + label + '<small>' + hint + '</small></div><span class="switch"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '><span></span></span></label>';
    }
    function sel(id, label, opts, val) {
      return '<label class="row-set"><div>' + label + '</div><select id="' + id + '">' + opts.map(function (o) {
        return '<option value="' + o[0] + '"' + (o[0] === val ? ' selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select></label>';
    }
    openPanel('<h2>Settings</h2>' +
      sw('setCounts', 'Letter counts', 'Show the length of every hidden word', settings.counts) +
      sw('setScroll', 'Jump to matches', 'Scroll to a word when you find it', settings.autoscroll) +
      sel('setTheme', 'Theme', [['system', 'Match system'], ['light', 'Light'], ['dark', 'Dark']], settings.theme) +
      sel('setSize', 'Text size', [['s', 'Smaller'], ['m', 'Normal'], ['l', 'Larger']], settings.size),
      function (root) {
        function upd() {
          settings.counts = root.querySelector('#setCounts').checked;
          settings.autoscroll = root.querySelector('#setScroll').checked;
          settings.theme = root.querySelector('#setTheme').value;
          settings.size = root.querySelector('#setSize').value;
          save('settings', settings); applyTheme();
        }
        root.querySelectorAll('input,select').forEach(function (el) { el.onchange = upd; });
      });
  }

  function showHelp() {
    var install = IOS && !STANDALONE
      ? '<p class="tip">To install: tap the Share button in Safari, then <b>Add to Home Screen</b>. It opens full-screen like an app.</p>'
      : '';
    openPanel('<h2>How to play</h2>' +
      '<p>This is a real English Wikipedia article with every word blacked out except common ones like "the", "of" and "and".</p>' +
      '<p>Guess words. Each correct guess is revealed everywhere in the article, including its variations: "run" also reveals "runs" and "running", and "three" reveals "3".</p>' +
      '<p>Your goal is to reveal the title. You don\'t need to uncover the rest.</p>' +
      '<p>Tap a hidden word to see its letter count. Tap one of your guesses at the bottom to jump through its matches.</p>' +
      '<p>A new daily puzzle arrives every midnight. In between, play random articles from the menu.</p>' +
      install +
      '<button class="btn primary" style="width:100%" data-a="ok">Got it</button>', function (root) {
        root.querySelector('[data-a=ok]').onclick = closePanel;
      });
    save('seenHelp', true);
  }

  /* ---------- Events ---------- */
  function keepFocus(el) { el.addEventListener('pointerdown', function (e) { e.preventDefault(); }); }
  keepFocus($('guessBtn'));
  $('guessBtn').addEventListener('click', submit);
  $('guessInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
  $('allBtn').addEventListener('click', showGuessList);
  $('menuBtn').addEventListener('click', showMenu);
  $('hintBtn').addEventListener('click', useHint);
  $('scrim').addEventListener('click', closePanel);
  $('retryBtn').addEventListener('click', function () { start(S.mode, S.num, S.req); });
  $('resultsBtn').addEventListener('click', showResults);
  $('nextBtn').addEventListener('click', goNext);
  $('sheet').addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('.w');
    if (!el || !S) return;
    if (el.classList.contains('r')) { el.classList.toggle('n'); return; }
    var t = S.tokens[+el.dataset.i];
    if (t && S.status === 'playing') jump(t.key);
  });
  window.addEventListener('resize', function () {
    if (S && S.sel && S.sel.i >= 0) {
      var list = S.byKey.get(S.sel.key);
      S.tokens[list[S.sel.i]].el.scrollIntoView({ block: 'center' });
    }
  });

  /* ---------- iPhone keyboard ----------
   * iOS doesn't shrink the page when the keyboard opens; it slides it up instead.
   * Fitting the app to the visible area keeps the guess box right above the keyboard. */
  if (window.visualViewport) {
    var vv = window.visualViewport, appEl = $('app');
    var fit = function () {
      appEl.style.height = vv.height + 'px';
      appEl.style.transform = 'translateY(' + vv.offsetTop + 'px)';
      document.body.classList.toggle('kb', vv.height < window.innerHeight - 120);
      if (window.scrollY) window.scrollTo(0, 0);
    };
    vv.addEventListener('resize', fit);
    vv.addEventListener('scroll', fit);
    fit();
  }

  /* Offline app shell: lets the app open without a connection (articles still need one). */
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }

  /* ---------- Startup ---------- */
  applyTheme();
  var last = load('last', null), n = todayNum();
  var lastRandom = last && last.mode === 'random' && last.req ? load('g:r:' + last.req, null) : null;
  if (lastRandom && lastRandom.status === 'playing') start('random', 0, last.req);
  else start('daily', n);
  if (!load('seenHelp', false)) setTimeout(showHelp, 300);
})();
