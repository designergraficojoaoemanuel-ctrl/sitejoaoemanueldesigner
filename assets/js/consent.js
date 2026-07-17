/* =======================================================================
   CONSENTIMENTO DE COOKIES — João Emanuel Designer
   =======================================================================
   Gerencia o banner de consentimento, o modal de preferências por
   categoria e o carregamento condicional de scripts de terceiros
   (Google Analytics / Meta Pixel), em conformidade com a LGPD.

   Categorias:
     necessary   -> sempre ativos, essenciais ao funcionamento do site
     preferences -> lembram escolhas do visitante (ex.: tema claro/escuro)
     analytics   -> Google Analytics (estatísticas de uso, IP anonimizado)
     marketing   -> Meta Pixel (hoje não configurado; pronto para o futuro)
   ======================================================================= */
(function () {
  'use strict';

  var STORAGE_KEY = 'joaoemanuel_cookie_consent';
  var config = window.TRACKING_CONFIG || {};

  var DEFAULTS = { necessary: true, preferences: true, analytics: true, marketing: true };

  /* ---------------- Armazenamento ---------------- */
  function readConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      parsed.necessary = true;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function saveConsent(prefs) {
    var data = {
      necessary: true,
      preferences: !!prefs.preferences,
      analytics: !!prefs.analytics,
      marketing: !!prefs.marketing,
      ts: new Date().toISOString()
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
    return data;
  }

  var currentConsent = readConsent();

  function allows(category) {
    if (category === 'necessary') return true;
    if (!currentConsent) return false;
    return !!currentConsent[category];
  }

  /* ---------------- Google Analytics 4 (categoria: analytics) ---------------- */
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

  /* ---------------- Meta Pixel (categoria: marketing) ---------------- */
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

  function applyConsent() {
    if (allows('analytics')) loadGA4();
    if (allows('marketing')) loadMetaPixel();
  }

  /* ---------------- Rastreamento de cliques (apenas com consentimento analítico) ---------------- */
  function trackEvent(name, params) {
    if (allows('analytics') && window.gtag) window.gtag('event', name, params || {});
    if (allows('marketing') && window.fbq) window.fbq('trackCustom', name, params || {});
  }
  window.trackEvent = trackEvent;

  function initClickTracking() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest('.link, .about-more, .option-card, .theme-toggle');
      if (!el) return;

      if (el.classList.contains('theme-toggle')) {
        trackEvent('theme_toggle_click', {});
        return;
      }

      var label =
        el.querySelector('.link-label')?.textContent.trim() ||
        el.textContent.trim().slice(0, 60) ||
        el.getAttribute('aria-label') ||
        'link';

      trackEvent('link_click', {
        link_label: label,
        link_url: el.href || window.location.href,
        page_path: window.location.pathname
      });
    }, true);
  }

  /* ---------------- API pública para outros scripts (ex.: tema) ---------------- */
  window.cookieConsent = {
    allows: allows,
    get: function () { return currentConsent ? Object.assign({}, currentConsent) : null; },
    openPreferences: function () { openModal(); }
  };

  /* ---------------- Elementos ---------------- */
  var banner, modalOverlay, modal;
  var toggles = {};

  function q(id) { return document.getElementById(id); }

  function showBanner() {
    if (!banner) return;
    banner.classList.add('is-visible');
  }

  function hideBanner() {
    if (!banner) return;
    banner.classList.remove('is-visible');
  }

  function syncToggles(prefs) {
    ['preferences', 'analytics', 'marketing'].forEach(function (cat) {
      if (toggles[cat]) toggles[cat].checked = !!prefs[cat];
    });
  }

  function readToggles() {
    return {
      preferences: toggles.preferences ? toggles.preferences.checked : true,
      analytics: toggles.analytics ? toggles.analytics.checked : true,
      marketing: toggles.marketing ? toggles.marketing.checked : true
    };
  }

  function openModal() {
    if (!modalOverlay) return;
    var base = currentConsent || DEFAULTS;
    syncToggles(base);
    modalOverlay.classList.add('is-visible');
    modalOverlay.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('is-visible');
    modalOverlay.setAttribute('aria-hidden', 'true');
  }

  function commit(prefs) {
    currentConsent = saveConsent(prefs);
    applyConsent();
    hideBanner();
    closeModal();
  }

  function initBanner() {
    banner = q('cookieConsentBanner');
    modalOverlay = q('cookiePreferencesOverlay');
    modal = q('cookiePreferencesModal');

    toggles.preferences = q('cookieTogglePreferences');
    toggles.analytics = q('cookieToggleAnalytics');
    toggles.marketing = q('cookieToggleMarketing');

    var acceptAllBtn = q('cookieAcceptAll');
    var rejectOptionalBtn = q('cookieRejectOptional');
    var customizeBtn = q('cookieCustomize');
    var modalCloseBtn = q('cookieModalClose');
    var modalSaveBtn = q('cookieModalSave');
    var modalRejectBtn = q('cookieModalRejectAll');
    var footerPrefsBtn = q('footerCookiePrefs');

    if (currentConsent) {
      applyConsent();
    } else {
      window.setTimeout(showBanner, 700);
    }

    if (acceptAllBtn) {
      acceptAllBtn.addEventListener('click', function () {
        commit({ preferences: true, analytics: true, marketing: true });
      });
    }

    if (rejectOptionalBtn) {
      rejectOptionalBtn.addEventListener('click', function () {
        commit({ preferences: false, analytics: false, marketing: false });
      });
    }

    if (customizeBtn) {
      customizeBtn.addEventListener('click', function () {
        openModal();
      });
    }

    if (footerPrefsBtn) {
      footerPrefsBtn.addEventListener('click', function () {
        openModal();
      });
    }

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', function () {
        closeModal();
      });
    }

    if (modalOverlay) {
      modalOverlay.addEventListener('click', function (e) {
        if (e.target === modalOverlay) closeModal();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('is-visible')) {
        closeModal();
      }
    });

    if (modalSaveBtn) {
      modalSaveBtn.addEventListener('click', function () {
        commit(readToggles());
      });
    }

    if (modalRejectBtn) {
      modalRejectBtn.addEventListener('click', function () {
        commit({ preferences: false, analytics: false, marketing: false });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initBanner();
      initClickTracking();
    });
  } else {
    initBanner();
    initClickTracking();
  }
})();
