/* Game logic without UI: word normalisation, common words, parsing a Wikipedia article. */
(function (root) {
  'use strict';
  var stem = (root.EnStemmer || (typeof require !== 'undefined' ? require('./stemmer.js') : null)).stem;

  // Common words that stay visible, like the original game.
  var STOP_LIST = (
    'a an the of and or but nor in on at to for from by with as into onto upon about above below over under ' +
    'between among through during before after since until within without against toward towards via per ' +
    'is are was were be been being it its this that these those he she they his her hers their theirs them him ' +
    'which who whom whose what where when while if then than so such also not no only both either neither ' +
    'has have had having do does did done can could might must shall should will would ' +
    'i we you our ours your yours my me there here all any each some other most more many much very ' +
    's t d ll re ve m'
  ).trim().split(/\s+/);
  var STOP = Object.create(null);
  STOP_LIST.forEach(function (w) { STOP[w] = true; });

  // Number words match their digits: guessing "three" reveals "3" and vice versa.
  var NUMBERS = {
    zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9',
    ten: '10', eleven: '11', twelve: '12', thirteen: '13', fourteen: '14', fifteen: '15', sixteen: '16',
    seventeen: '17', eighteen: '18', nineteen: '19', twenty: '20', thirty: '30', forty: '40', fifty: '50',
    sixty: '60', seventy: '70', eighty: '80', ninety: '90', hundred: '100', thousand: '1000'
  };

  var STRIP_RE = /[\u0300-\u036f\u00AD\u200B\u200C\u200D\u2060]/g;
  var WORD_RE = /[\p{L}\p{N}]+/gu;

  function clean(text) {
    return String(text).replace(/[\u00AD\u200B\u200C\u200D\u2060]/g, '').replace(/\[\d+\]/g, '').replace(/[ \t\r\n\u00A0]+/g, ' ');
  }
  // Lowercase and drop accents, so "café" matches "cafe".
  function normalize(word) {
    return String(word).normalize('NFD').replace(STRIP_RE, '').toLowerCase();
  }
  function isStop(norm) { return !!STOP[norm]; }
  function keyOf(norm) {
    if (NUMBERS[norm]) return NUMBERS[norm];
    if (/^\p{N}+$/u.test(norm)) return norm.replace(/^0+(?=\d)/, '');
    return stem(norm);
  }

  function tokenize(text) {
    var parts = [], last = 0, m;
    WORD_RE.lastIndex = 0;
    while ((m = WORD_RE.exec(text))) {
      if (m.index > last) parts.push({ w: false, text: text.slice(last, m.index) });
      var norm = normalize(m[0]);
      parts.push({ w: true, text: m[0], norm: norm, key: keyOf(norm), stop: isStop(norm) });
      last = m.index + m[0].length;
    }
    if (last < text.length) parts.push({ w: false, text: text.slice(last) });
    return parts;
  }

  // Splits what the player typed into separate guesses. "Newton's" becomes "newton".
  function parseGuess(input) {
    var out = [], m, s = clean(input).replace(/['\u2019]s\b/gi, '').replace(/['\u2019]/g, '');
    WORD_RE.lastIndex = 0;
    while ((m = WORD_RE.exec(s))) {
      var norm = normalize(m[0]);
      out.push({ text: m[0].toLowerCase(), norm: norm, key: keyOf(norm), stop: isStop(norm) });
    }
    return out;
  }

  function displayTitle(title) {
    return clean(title).replace(/\s*\([^)]*\)\s*$/, '').trim();
  }

  var REMOVE_SELECTORS = [
    'style', 'script', 'link', 'meta', 'table', 'figure', 'img', 'audio', 'video', 'math',
    '.mw-editsection', 'sup.reference', '.reference', 'sup.noprint', '.noprint', '.mw-ref',
    '.hatnote', '.dablink', '.ambox', '.ombox', '.tmbox', '.metadata', '.navbox', '.navbox-inner', '.navbox-styles',
    '.infobox', '.sidebar', '.vertical-navbox', '.thumb', '.gallery', '.mw-gallery-traditional', '.mw-gallery-packed',
    '.toc', '#toc', '.mw-references-wrap', '.references', '.reflist', '.refbegin', '.mw-empty-elt',
    '.mwe-math-element', '.mw-kartographer-maplink', '.mw-kartographer-container', '.coordinates', '#coordinates',
    '.sistersitebox', '.side-box', '.portal', '.portalbox', '.mbox-small', '.shortdescription', '.printfooter',
    '.catlinks', '.mw-indicators', '.listen', '.haudio', '.IPA', '.rt-commentedText', '.authority-control',
    '.quotebox', '.module-shortcutboxplain', '.stub'
  ];
  var END_SECTIONS = /^(references|notes|see also|external links|further reading|bibliography|sources|citations|footnotes|works cited|notes and references|references and notes|gallery|explanatory notes|general and cited sources|selected works|discography|filmography)(?![\p{L}])/iu;
  var MAX_WORDS = 18000;

  function extractBlocks(doc) {
    var rootEl = doc.querySelector('.mw-parser-output') || doc.body;
    REMOVE_SELECTORS.forEach(function (sel) {
      var nodes;
      try { nodes = rootEl.querySelectorAll(sel); } catch (e) { return; }
      for (var i = nodes.length - 1; i >= 0; i--) {
        if (nodes[i].parentNode) nodes[i].parentNode.removeChild(nodes[i]);
      }
    });

    var blocks = [], words = 0, stopped = false;
    function push(type, text) {
      text = clean(text).trim();
      if (!text || !/[\p{L}\p{N}]/u.test(text)) return;
      blocks.push({ t: type, text: text });
      words += (text.match(WORD_RE) || []).length;
      if (words > MAX_WORDS) stopped = true;
    }
    function heading(el) {
      var level = el.tagName.toLowerCase();
      var text = clean(el.textContent).trim();
      if (END_SECTIONS.test(text)) { stopped = true; return; }
      push(level === 'h2' ? 'h2' : 'h3', text);
    }
    function walk(parent) {
      var kids = parent.children;
      for (var i = 0; i < kids.length && !stopped; i++) {
        var el = kids[i], tag = el.tagName.toLowerCase();
        if (/^h[2-6]$/.test(tag)) { heading(el); continue; }
        if (tag === 'div' && el.classList.contains('mw-heading')) {
          var h = el.querySelector('h2,h3,h4,h5,h6');
          if (h) heading(h);
          continue;
        }
        if (tag === 'p') { push('p', el.textContent); continue; }
        if (tag === 'ul' || tag === 'ol') {
          var lis = el.children;
          for (var j = 0; j < lis.length && !stopped; j++) {
            if (lis[j].tagName.toLowerCase() === 'li') push('li', lis[j].textContent);
          }
          continue;
        }
        if (tag === 'dl') {
          var dd = el.children;
          for (var k = 0; k < dd.length && !stopped; k++) push(dd[k].tagName.toLowerCase() === 'dt' ? 'h3' : 'p', dd[k].textContent);
          continue;
        }
        if (tag === 'blockquote') { push('q', el.textContent); continue; }
        if (tag === 'div' || tag === 'section' || tag === 'center') { walk(el); continue; }
      }
    }
    walk(rootEl);
    while (blocks.length && /^h/.test(blocks[blocks.length - 1].t)) blocks.pop();
    return blocks;
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffled(list, seed) {
    var rnd = mulberry32(seed), a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  root.RedCore = {
    normalize: normalize, tokenize: tokenize, parseGuess: parseGuess, isStop: isStop, keyOf: keyOf,
    displayTitle: displayTitle, extractBlocks: extractBlocks, shuffled: shuffled, clean: clean
  };
  if (typeof module !== 'undefined') module.exports = root.RedCore;
})(typeof window !== 'undefined' ? window : globalThis);
