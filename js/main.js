/* Coach Ran · interactions
   Progressive enhancement only: the page is complete without this file. */
(function () {
  'use strict';

  var root = document.documentElement;
  var motion = root.classList.contains('motion');
  var $ = function (s) { return document.querySelector(s); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Smooth scroll (Lenis), only when motion is welcome ---------- */
  var lenis = null;
  if (motion && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 1 });
    var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);

    document.querySelectorAll('a[href^="#"]:not(.skip)').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        var el = id === '#top' ? 0 : document.querySelector(id);
        if (el === null) return;
        e.preventDefault();
        lenis.scrollTo(el, { offset: id === '#top' ? 0 : -76, duration: 1.2 });
      });
    });
  }

  /* ---------- Hero entrance: wait for fonts (max 600ms) ---------- */
  var ready = function () { root.classList.add('is-ready'); };
  if (motion && document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 600); })])
      .then(function () { requestAnimationFrame(ready); });
  } else {
    ready();
  }

  /* ---------- Mobile dock: visible between hero CTA and contact section ---------- */
  var dock = $('#dock');
  var pastHero = false, atFinal = false;
  function updateDock() {
    var on = pastHero && !atFinal;
    dock.classList.toggle('is-on', on);
    dock.setAttribute('aria-hidden', on ? 'false' : 'true');
    dock.tabIndex = on ? 0 : -1;
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      pastHero = !e[0].isIntersecting && e[0].boundingClientRect.top < 0;
      updateDock();
    }).observe($('.hero__cta'));
    new IntersectionObserver(function (e) {
      atFinal = e[0].isIntersecting;
      updateDock();
    }, { threshold: .15 }).observe($('#contatti'));
  }

  /* ---------- Scroll reveals ---------- */
  var reveals = document.querySelectorAll('.rv');
  if (motion && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add('in');
        io.unobserve(el);
        // Drop the reveal class afterwards so hover transforms behave normally.
        el.addEventListener('transitionend', function done(ev) {
          if (ev.target !== el || ev.propertyName !== 'opacity') return;
          el.classList.remove('rv', 'in');
          el.removeEventListener('transitionend', done);
        });
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .1 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- "Chi sono": words switch on as you read ---------- */
  var manifesto = $('#manifesto');
  var words = [];
  (function split(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 3) {
        var frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var s = document.createElement('span');
          s.className = 'w';
          s.textContent = part;
          frag.appendChild(s);
          words.push(s);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1) {
        split(child);
      }
    });
  })(manifesto);

  /* ---------- One rAF-throttled scroll handler ---------- */
  var nav = $('#nav');
  var vh = window.innerHeight;
  var lastY = window.scrollY, litCount = -1, ticking = false;

  function frame() {
    ticking = false;
    var y = window.scrollY;

    // Nav hides when scrolling down, returns when scrolling up
    if (Math.abs(y - lastY) > 6) {
      nav.classList.toggle('is-hidden', y > lastY && y > 400);
      lastY = y;
    }

    if (!motion) {
      if (litCount !== words.length) { words.forEach(function (w) { w.classList.add('on'); }); litCount = words.length; }
      return;
    }
    var r = manifesto.getBoundingClientRect();
    if (r.top < vh && r.bottom > 0) {
      var p = clamp((vh * .85 - r.top) / (r.height + vh * .2), 0, 1);
      var n = Math.round(p * words.length);
      if (n !== litCount) {
        for (var i = 0; i < words.length; i++) words[i].classList.toggle('on', i < n);
        litCount = n;
      }
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { vh = window.innerHeight; onScroll(); });
  // Keyboard users: never hide the nav while focus is inside it
  nav.addEventListener('focusin', function () { nav.classList.remove('is-hidden'); });
  frame();
})();
