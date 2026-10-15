/* Porter stemmer (Martin Porter, 1980) so a guess like "run" also reveals "runs" and "running". */
(function (root) {
  'use strict';

  function isCons(w, i) {
    var c = w[i];
    if (c === 'a' || c === 'e' || c === 'i' || c === 'o' || c === 'u') return false;
    if (c === 'y') return i === 0 ? true : !isCons(w, i - 1);
    return true;
  }
  // Measure m of the stem w[0..k): number of VC sequences.
  function measure(w, k) {
    var n = 0, i = 0;
    while (i < k && isCons(w, i)) i++;
    while (i < k) {
      while (i < k && !isCons(w, i)) i++;
      if (i >= k) break;
      n++;
      while (i < k && isCons(w, i)) i++;
    }
    return n;
  }
  function hasVowel(w, k) { for (var i = 0; i < k; i++) if (!isCons(w, i)) return true; return false; }
  function doubleCons(w, k) { return k >= 2 && w[k - 1] === w[k - 2] && isCons(w, k - 1); }
  // cvc where the final c is not w, x or y
  function cvc(w, k) {
    if (k < 3 || !isCons(w, k - 1) || isCons(w, k - 2) || !isCons(w, k - 3)) return false;
    var c = w[k - 1];
    return c !== 'w' && c !== 'x' && c !== 'y';
  }
  function ends(w, s) { return w.length >= s.length && w.slice(w.length - s.length) === s; }

  function rules(w, list, minM) {
    for (var i = 0; i < list.length; i++) {
      var suf = list[i][0];
      if (ends(w, suf)) {
        var k = w.length - suf.length;
        return measure(w, k) > minM ? w.slice(0, k) + list[i][1] : w;
      }
    }
    return w;
  }

  var STEP2 = [['ational', 'ate'], ['tional', 'tion'], ['enci', 'ence'], ['anci', 'ance'], ['izer', 'ize'], ['bli', 'ble'],
    ['alli', 'al'], ['entli', 'ent'], ['eli', 'e'], ['ousli', 'ous'], ['ization', 'ize'], ['ation', 'ate'], ['ator', 'ate'],
    ['alism', 'al'], ['iveness', 'ive'], ['fulness', 'ful'], ['ousness', 'ous'], ['aliti', 'al'], ['iviti', 'ive'],
    ['biliti', 'ble'], ['logi', 'log']].sort(function (a, b) { return b[0].length - a[0].length; });
  var STEP3 = [['icate', 'ic'], ['ative', ''], ['alize', 'al'], ['iciti', 'ic'], ['ical', 'ic'], ['ful', ''], ['ness', '']]
    .sort(function (a, b) { return b[0].length - a[0].length; });
  var STEP4 = ['al', 'ance', 'ence', 'er', 'ic', 'able', 'ible', 'ant', 'ement', 'ment', 'ent', 'ion', 'ou', 'ism', 'ate',
    'iti', 'ous', 'ive', 'ize'].sort(function (a, b) { return b.length - a.length; });

  function stem(word) {
    var w = String(word).toLowerCase();
    if (w.length <= 2 || !/^[a-z]+$/.test(w)) return w;

    // Step 1a
    if (ends(w, 'sses')) w = w.slice(0, -2);
    else if (ends(w, 'ies')) w = w.slice(0, -2);
    else if (!ends(w, 'ss') && ends(w, 's')) w = w.slice(0, -1);

    // Step 1b
    var again = false;
    if (ends(w, 'eed')) {
      if (measure(w, w.length - 3) > 0) w = w.slice(0, -1);
    } else if (ends(w, 'ed') && hasVowel(w, w.length - 2)) {
      w = w.slice(0, -2); again = true;
    } else if (ends(w, 'ing') && hasVowel(w, w.length - 3)) {
      w = w.slice(0, -3); again = true;
    }
    if (again) {
      if (ends(w, 'at') || ends(w, 'bl') || ends(w, 'iz')) w += 'e';
      else if (doubleCons(w, w.length) && !/[lsz]$/.test(w)) w = w.slice(0, -1);
      else if (measure(w, w.length) === 1 && cvc(w, w.length)) w += 'e';
    }

    // Step 1c
    if (ends(w, 'y') && hasVowel(w, w.length - 1)) w = w.slice(0, -1) + 'i';

    // Steps 2 and 3
    w = rules(w, STEP2, 0);
    w = rules(w, STEP3, 0);

    // Step 4
    for (var i = 0; i < STEP4.length; i++) {
      var suf = STEP4[i];
      if (ends(w, suf)) {
        var k = w.length - suf.length;
        if (measure(w, k) > 1 && (suf !== 'ion' || /[st]$/.test(w.slice(0, k)))) w = w.slice(0, k);
        break;
      }
    }

    // Step 5a
    if (ends(w, 'e')) {
      var m = measure(w, w.length - 1);
      if (m > 1 || (m === 1 && !cvc(w, w.length - 1))) w = w.slice(0, -1);
    }
    // Step 5b
    if (measure(w, w.length) > 1 && doubleCons(w, w.length) && ends(w, 'l')) w = w.slice(0, -1);
    return w;
  }

  root.EnStemmer = { stem: stem };
  if (typeof module !== 'undefined') module.exports = root.EnStemmer;
})(typeof window !== 'undefined' ? window : globalThis);
