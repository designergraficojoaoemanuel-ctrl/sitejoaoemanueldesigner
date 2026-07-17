(function () {
  'use strict';

  var STORAGE_KEY = 'cookie_consent'; // 'granted' | 'denied'
  var config = window.TRACKING_CONFIG || {};

  function getConsent() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function setConsent(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) {}
  }

  /* ---------------- Google Analytics 4 ---------------- */
  function loadGA4() {
    if (!config.GA_MEASUREMENT_ID || window.__ga4Loaded) return;
    window.__ga4Loaded = true;

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + config.GA_MEASUREMENT_ID;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', config.GA_MEASUREMENT_ID, { anonymize_ip: true });
  }

  /* ---------------- Meta Pixel ---------------- */
  function loadMetaPixel() {
    if (!config.META_PIXEL_ID || window.__metaPixelLoaded) return;
    window.__metaPixelLoaded = true;

    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = true; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = true;
      t.src = v; s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq('init', config.META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  function enableTracking() {
    loadGA4();
    loadMetaPixel();
  }

  /* ---------------- Banner de cookies ---------------- */
  function initBanner() {
    var banner = document.getElementById('cookieBanner');
    var manageBtn = document.getElementById('cookieManage');
    var acceptBtn = document.getElementById('cookieAccept');
    var declineBtn = document.getElementById('cookieDecline');
    if (!banner) return;

    function showBanner() {
      banner.classList.add('is-visible');
      if (manageBtn) manageBtn.classList.remove('is-visible');
    }

    function hideBanner() {
      banner.classList.remove('is-visible');
      if (manageBtn) manageBtn.classList.add('is-visible');
    }

    var consent = getConsent();

    if (consent === 'granted') {
      enableTracking();
      hideBanner();
    } else if (consent === 'denied') {
      hideBanner();
    } else {
      // Primeira visita: mostra o banner após um pequeno delay
      // para não competir com a animação de entrada da página.
      window.setTimeout(showBanner, 700);
    }

    if (acceptBtn) {
      acceptBtn.addEventListener('click', function () {
        setConsent('granted');
        enableTracking();
        hideBanner();
      });
    }

    if (declineBtn) {
      declineBtn.addEventListener('click', function () {
        setConsent('denied');
        hideBanner();
      });
    }

    if (manageBtn) {
      manageBtn.addEventListener('click', function () {
        showBanner();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBanner);
  } else {
    initBanner();
  }
})();
