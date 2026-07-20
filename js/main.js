/* ============================================================
   CarbonStroke — interactions
   ============================================================ */
(function () {
  'use strict';

  /* ---- Footer year ---- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Mobile menu ---- */
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('mobile-menu');

  function closeMenu() {
    if (!menu) return;
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      menu.hidden = open;
    });
    // Close after tapping a link
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
    // Close if resized up to desktop
    window.addEventListener('resize', function () {
      if (window.innerWidth > 720) closeMenu();
    });
  }

  /* ---- Scroll reveal ---- */
  var reveal = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveal.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveal.forEach(function (el) { io.observe(el); });
  } else {
    reveal.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---- Stat flip counters ---- */
  var counters = document.querySelectorAll('.stat-num[data-count-to]');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function renderDigits(el, text) {
    var chars = String(text).split('');
    var spans = el.querySelectorAll('.stat-digit');

    // Rebuild only when the digit count changes (e.g. 9 -> 10)
    if (spans.length !== chars.length) {
      el.textContent = '';
      chars.forEach(function (ch) {
        var s = document.createElement('span');
        s.className = /[0-9]/.test(ch) ? 'stat-digit is-flipping' : 'stat-digit stat-sym';
        s.textContent = ch;
        el.appendChild(s);
      });
      return;
    }

    chars.forEach(function (ch, i) {
      var s = spans[i];
      if (s.textContent === ch) return;
      s.textContent = ch;
      s.classList.remove('is-flipping');
      void s.offsetWidth; // restart the animation
      s.classList.add('is-flipping');
    });
  }

  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count-to'), 10);
    var suffix = el.getAttribute('data-count-suffix') || '';
    if (isNaN(target)) return;

    if (reduceMotion) {
      el.textContent = target + suffix;
      return;
    }

    var duration = 1100;
    var start = null;

    function step(now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      renderDigits(el, Math.round(eased * target) + suffix);
      if (p < 1) requestAnimationFrame(step);
    }

    renderDigits(el, '0' + suffix);
    requestAnimationFrame(step);
  }

  if (counters.length) {
    if ('IntersectionObserver' in window) {
      var countObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          countObserver.unobserve(entry.target);
          runCounter(entry.target);
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { countObserver.observe(el); });
    } else {
      counters.forEach(runCounter);
    }
  }

  /* ---- Contact form -> mailto ---- */
  var form = document.getElementById('contact-form');
  var note = document.getElementById('form-note');
  var RECIPIENT = 'carbonstroke@gmail.com';

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = form.name.value.trim();
      var email = form.email.value.trim();
      var service = form.service.value;
      var details = form.details.value.trim();

      if (!name || !email) {
        if (note) note.textContent = 'Please add your name and email so we can reach you.';
        return;
      }

      var isGeneral = service === 'General Chat';
      var who = name ? ' (' + name + ')' : '';
      var subject = isGeneral
        ? 'New general inquiry' + who
        : 'New project inquiry — ' + service + who;

      var bodyLines = ['Name: ' + name, 'Email: ' + email];
      if (!isGeneral) bodyLines.push('Service needed: ' + service);
      bodyLines.push('', isGeneral ? 'Message:' : 'Project details:', details || '(none provided)');
      var mailto = 'mailto:' + RECIPIENT +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(bodyLines.join('\n'));

      window.location.href = mailto;
      if (note) note.textContent = 'Opening your email app… if nothing happens, write to ' + RECIPIENT;
    });
  }
})();
