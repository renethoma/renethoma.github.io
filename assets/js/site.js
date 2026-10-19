(function () {
  var html = document.documentElement;
  var body = document.body;

  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { return null; }
  }
  function all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* Farbmodus, gilt für alle Seiten */
  function setTheme(t) {
    if (t === 'blau') html.setAttribute('data-theme', 'blau'); else html.removeAttribute('data-theme');
    all('.dot').forEach(function (d) { d.setAttribute('aria-pressed', String(d.dataset.theme === t)); });
    store('rt-theme', t);
  }
  setTheme(store('rt-theme') === 'blau' ? 'blau' : 'weiss');
  all('.dot').forEach(function (d) { d.addEventListener('click', function () { setTheme(d.dataset.theme); }); });

  /* Menü mobil */
  var menuBtn = document.querySelector('.menubtn');
  var menu = document.getElementById('menu');
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () {
      var open = menu.hasAttribute('hidden');
      if (open) menu.removeAttribute('hidden'); else menu.setAttribute('hidden', '');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.textContent = open ? 'Schliessen' : 'Menü';
      var info = document.getElementById('info');
    if (body.dataset.video && window.matchMedia('(max-width:760px)').matches) { info.setAttribute('hidden', ''); all('[data-info][aria-expanded]').forEach(function (x) { x.setAttribute('aria-expanded', 'false'); }); }
      if (open && info) info.setAttribute('hidden', '');
    });
  }

  var page = body.dataset.page;

  /* Arbeiten: Raster, Liste, Bildanzahl */
  if (page === 'arbeiten') {
    var level = 0;
    function setLevel(l) {
      level = Math.max(0, Math.min(2, l));
      body.dataset.level = String(level);
      all('[data-z="more"]').forEach(function (b) { b.disabled = level === 0; });
      all('[data-z="less"]').forEach(function (b) { b.disabled = level === 2; });
    }
    function setView(v) {
      body.dataset.view = v;
      all('.tg').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.view === v)); });
      store('rt-view', v);
      if (menu && !menu.hasAttribute('hidden')) menuBtn.click();
    }
    all('[data-z="more"]').forEach(function (b) { b.addEventListener('click', function () { setLevel(level - 1); }); });
    all('[data-z="less"]').forEach(function (b) { b.addEventListener('click', function () { setLevel(level + 1); }); });
    all('.tg').forEach(function (b) { b.addEventListener('click', function () { setView(b.dataset.view); }); });
    all('tbody tr[data-href]').forEach(function (tr) {
      tr.addEventListener('click', function (e) { if (!e.target.closest('a')) location.href = tr.dataset.href; });
    });
    setLevel(0);
    setView(store('rt-view') === 'liste' ? 'liste' : 'raster');
  }

  /* Raw: drei Grössen */
  if (page === 'raw') {
    var size = 1;
    function setSize(s) {
      size = Math.max(0, Math.min(2, s));
      body.dataset.size = String(size);
      all('[data-s="less"]').forEach(function (b) { b.disabled = size === 0; });
      all('[data-s="more"]').forEach(function (b) { b.disabled = size === 2; });
    }
    all('[data-s="less"]').forEach(function (b) { b.addEventListener('click', function () { setSize(size - 1); }); });
    all('[data-s="more"]').forEach(function (b) { b.addEventListener('click', function () { setSize(size + 1); }); });
    setSize(1);
  }

  /* Projektseite: drei Zoomstufen, Klick irgendwo, Infofenster */
  if (page === 'projekt') {
    var scroller = document.getElementById('scroller');
    var col = document.getElementById('col');
    var shots = all('.shot');
    var z = 0;
    function center() {
      var r = scroller.getBoundingClientRect(), cy = r.top + r.height / 2, best = 0, bd = Infinity;
      shots.forEach(function (el, i) {
        var b = el.getBoundingClientRect(), d = Math.abs((b.top + b.bottom) / 2 - cy);
        if (d < bd) { bd = d; best = i; }
      });
      return best;
    }
    function go(l, idx) {
      z = (l + 3) % 3;
      col.className = 'col z' + z;
      all('[data-pz="in"]').forEach(function (b) { b.disabled = z === 0; });
      all('[data-pz="out"]').forEach(function (b) { b.disabled = z === 2; });
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setTimeout(function () {
        var el = shots[idx];
        if (el) el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
      }, reduce ? 0 : 480);
    }
    all('[data-pz="in"]').forEach(function (b) { b.addEventListener('click', function () { if (z > 0) go(z - 1, center()); }); });
    all('[data-pz="out"]').forEach(function (b) { b.addEventListener('click', function () { if (z < 2) go(z + 1, center()); }); });
    scroller.addEventListener('click', function (e) {
      if (e.target.closest('video, a, button')) return;
      var s = e.target.closest('.shot');
      go(z + 1, s ? shots.indexOf(s) : center());
    });
    go(0, 0);

    var info = document.getElementById('info');
    if (body.dataset.video && window.matchMedia('(max-width:760px)').matches) { info.setAttribute('hidden', ''); all('[data-info][aria-expanded]').forEach(function (x) { x.setAttribute('aria-expanded', 'false'); }); }
    var bar = info.querySelector('.bar');
    all('[data-info]').forEach(function (b) {
      b.addEventListener('click', function () {
        var open = info.hasAttribute('hidden');
        if (open) info.removeAttribute('hidden'); else info.setAttribute('hidden', '');
        all('[data-info]').forEach(function (x) { if (x.hasAttribute('aria-expanded')) x.setAttribute('aria-expanded', String(open)); });
      });
    });
    bar.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) return;
      e.preventDefault();
      var pr = info.getBoundingClientRect(), ox = e.clientX - pr.left, oy = e.clientY - pr.top;
      info.classList.add('drag');
      function move(ev) {
        var x = Math.max(0, Math.min(ev.clientX - ox, window.innerWidth - pr.width));
        var y = Math.max(0, Math.min(ev.clientY - oy, window.innerHeight - pr.height));
        info.style.left = x + 'px'; info.style.top = y + 'px'; info.style.bottom = 'auto';
      }
      function up() {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        info.classList.remove('drag');
      }
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
  }
})();
