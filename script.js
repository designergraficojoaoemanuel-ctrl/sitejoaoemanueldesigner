(function(){
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
