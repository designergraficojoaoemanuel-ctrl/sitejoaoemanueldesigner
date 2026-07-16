(function(){
  /* ---------- alternância de tema claro/escuro ---------- */
  var root = document.documentElement;
  var toggleBtn = document.getElementById('themeToggle');
  var reduceMotionForTheme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function currentTheme(){
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function updateMetaThemeColor(theme){
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0D1312' : '#FAF9F5');
  }

  function commitTheme(theme){
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    try { localStorage.setItem('theme', theme); } catch (e) {}
    updateMetaThemeColor(theme);
  }

  function switchTheme(theme, originX, originY){
    // Navegadores com View Transition API ganham uma revelação circular
    // a partir do botão; os demais recebem a troca com transição suave de cores (via CSS).
    if (!reduceMotionForTheme && document.startViewTransition){
      var x = originX != null ? originX : window.innerWidth - 32;
      var y = originY != null ? originY : 32;
      var endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      var transition = document.startViewTransition(function(){ commitTheme(theme); });

      transition.ready.then(function(){
        document.documentElement.animate(
          {
            clipPath: [
              'circle(0px at ' + x + 'px ' + y + 'px)',
              'circle(' + endRadius + 'px at ' + x + 'px ' + y + 'px)'
            ]
          },
          {
            duration: 550,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            pseudoElement: '::view-transition-new(root)'
          }
        );
      }).catch(function(){ /* navegador cancelou, tema já foi aplicado */ });
    } else {
      commitTheme(theme);
    }
  }

  if (toggleBtn){
    toggleBtn.addEventListener('click', function(){
      var rect = toggleBtn.getBoundingClientRect();
      var x = rect.left + rect.width / 2;
      var y = rect.top + rect.height / 2;
      var next = currentTheme() === 'dark' ? 'light' : 'dark';

      switchTheme(next, x, y);

      toggleBtn.classList.remove('is-spinning');
      void toggleBtn.offsetWidth; // força reflow para reiniciar a animação
      toggleBtn.classList.add('is-spinning');
    });
  }

  updateMetaThemeColor(currentTheme());

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -20px 0px' });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('is-visible'); });
  }

  /* ---------- animated stat counters ---------- */
  var statNums = document.querySelectorAll('.stat-num');
  function animateCount(el){
    var target = parseInt(el.getAttribute('data-target'), 10) || 0;
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion){
      el.textContent = prefix + target + suffix;
      return;
    }
    var duration = 1300;
    var start = null;
    function easeOutExpo(t){ return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
    function step(ts){
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var value = Math.round(easeOutExpo(progress) * target);
      el.textContent = prefix + value + suffix;
      if (progress < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window){
    var statIo = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          animateCount(entry.target);
          statIo.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    statNums.forEach(function(el){ statIo.observe(el); });
  } else {
    statNums.forEach(animateCount);
  }
})();
