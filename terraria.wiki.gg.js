// ==UserScript==
// @name         Terraria Wiki - Sticky Left Sidebar
// @namespace    https://terraria.wiki.gg/
// @version      1.0.1
// @description  Pins the left sidebar panels (Navigation, Guides, Portals, Tools, Other Languages) while scrolling on any terraria.wiki.gg page.
// @author       Krakin
// @match        https://terraria.wiki.gg/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/lekrakin/userscripts/main/terraria.wiki.gg.js
// @downloadURL  https://raw.githubusercontent.com/lekrakin/userscripts/main/terraria.wiki.gg.js
// ==/UserScript==

(function () {
  'use strict';

  const HEADER_APPROX_HEIGHT = 60;
  const STYLE_ID = 'twiki-sticky-sidebar-styles';

  function getSidebar() {
    return (
      document.querySelector('#mw-panel') ||
      document.querySelector('.mw-sidebar-container') ||
      document.querySelector('#mw-sidebar') ||
      document.querySelector('.mw-sidebar')
    );
  }

  function getTopOffset() {
    const stickyHeader =
      document.querySelector('#mw-head') ||
      document.querySelector('.mw-header') ||
      document.querySelector('header') ||
      document.querySelector('#site-header');

    return stickyHeader
      ? Math.ceil(stickyHeader.getBoundingClientRect().height) + 8
      : HEADER_APPROX_HEIGHT;
  }

  function normalizeAncestors(sidebar) {
    let col = sidebar.parentElement;
    while (col && col !== document.body) {
      const st = window.getComputedStyle(col);
      if (st.overflow === 'hidden' || st.overflowY === 'hidden') {
        col.style.overflow = 'visible';
        col.style.overflowY = 'visible';
      }
      col = col.parentElement;
    }
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #mw-panel,
      .mw-sidebar-container,
      #mw-sidebar,
      .mw-sidebar {
        scrollbar-width: thin;
      }

      #mw-panel::-webkit-scrollbar,
      .mw-sidebar-container::-webkit-scrollbar,
      #mw-sidebar::-webkit-scrollbar,
      .mw-sidebar::-webkit-scrollbar {
        width: 4px;
      }

      #mw-panel::-webkit-scrollbar-track,
      .mw-sidebar-container::-webkit-scrollbar-track,
      #mw-sidebar::-webkit-scrollbar-track,
      .mw-sidebar::-webkit-scrollbar-track {
        background: transparent;
      }

      #mw-panel::-webkit-scrollbar-thumb,
      .mw-sidebar-container::-webkit-scrollbar-thumb,
      #mw-sidebar::-webkit-scrollbar-thumb,
      .mw-sidebar::-webkit-scrollbar-thumb {
        background: rgba(100, 100, 100, 0.35);
        border-radius: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  function applyStickyNav() {
    const sidebar = getSidebar();
    if (!sidebar) return;

    normalizeAncestors(sidebar);
    injectStyles();

    const topOffset = getTopOffset();

    Object.assign(sidebar.style, {
      position: 'sticky',
      top: `${topOffset}px`,
      maxHeight: `calc(100vh - ${topOffset + 16}px)`,
      overflowY: 'auto',
      overflowX: 'hidden',
      alignSelf: 'start'
    });
  }

  function scheduleApply() {
    requestAnimationFrame(() => {
      requestAnimationFrame(applyStickyNav);
    });
  }

  function bindNavContentSizeToggle() {
    const toggle =
      document.getElementById('nav-content-size-toggle') ||
      document.querySelector('#nav-content-size-toggle') ||
      document.querySelector('.nav-content-size-toggle') ||
      document.querySelector('[data-toggle="nav-content-size"]');

    if (!toggle || toggle.dataset.twikiStickyBound === '1') return;

    toggle.dataset.twikiStickyBound = '1';

    toggle.addEventListener('click', () => {
      scheduleApply();
      setTimeout(applyStickyNav, 50);
      setTimeout(applyStickyNav, 200);
      setTimeout(applyStickyNav, 400);
    });

    toggle.addEventListener('change', scheduleApply);
  }

  function init() {
    applyStickyNav();
    bindNavContentSizeToggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.addEventListener('resize', scheduleApply, { passive: true });

  document.addEventListener('click', (event) => {
    const el = event.target.closest('#nav-content-size-toggle, .nav-content-size-toggle');
    if (el) {
      scheduleApply();
    }
  });

  const observer = new MutationObserver(() => {
    bindNavContentSizeToggle();
    scheduleApply();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true
  });

  setTimeout(() => observer.disconnect(), 10000);
})();