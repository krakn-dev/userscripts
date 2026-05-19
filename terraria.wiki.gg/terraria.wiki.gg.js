// ==UserScript==
// @name         Terraria Wiki.gg Tweaks
// @namespace    https://terraria.wiki.gg/
// @version      1.0.3
// @description  Pins the left sidebar (+ TOC) while scrolling. Makes H2 headers collapsible.
// @author       Krakin
// @license      MIT
// @match        https://terraria.wiki.gg/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/lekrakin/userscripts/main/terraria.wiki.gg/terraria.wiki.gg.js
// @downloadURL  https://raw.githubusercontent.com/lekrakin/userscripts/main/terraria.wiki.gg/terraria.wiki.gg.js
// ==/UserScript==

(function () {
  'use strict';

  const HEADER_APPROX_HEIGHT = 60;
  const STYLE_ID = 'twiki-sticky-sidebar-styles';

  // ── Sidebar sticky ──────────────────────────────────────────────────────────

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
      /* ── Sidebar scrollbar ── */
      #mw-panel, .mw-sidebar-container, #mw-sidebar, .mw-sidebar {
        scrollbar-width: thin;
      }
      #mw-panel::-webkit-scrollbar,
      .mw-sidebar-container::-webkit-scrollbar,
      #mw-sidebar::-webkit-scrollbar,
      .mw-sidebar::-webkit-scrollbar { width: 4px; }
      #mw-panel::-webkit-scrollbar-track,
      .mw-sidebar-container::-webkit-scrollbar-track,
      #mw-sidebar::-webkit-scrollbar-track,
      .mw-sidebar::-webkit-scrollbar-track { background: transparent; }
      #mw-panel::-webkit-scrollbar-thumb,
      .mw-sidebar-container::-webkit-scrollbar-thumb,
      #mw-sidebar::-webkit-scrollbar-thumb,
      .mw-sidebar::-webkit-scrollbar-thumb {
        background: rgba(100,100,100,0.35);
        border-radius: 2px;
      }

      /* ── Collapsible H2s ── */
      .twiki-h2-toggle {
        cursor: pointer;
        user-select: none;
        display: flex;
        align-items: center;
        gap: 0.4em;
      }
      .twiki-h2-toggle::before {
        content: '▾';
        display: inline-block;
        font-size: 0.75em;
        transition: transform 0.2s ease;
        flex-shrink: 0;
        width: 1em;
        text-align: center;
      }
      .twiki-h2-toggle.twiki-collapsed::before {
        transform: rotate(-90deg);
      }
      .twiki-h2-body {
        overflow: hidden;
        transition: max-height 0.25s ease, opacity 0.2s ease;
        max-height: 5000px;
        opacity: 1;
      }
      .twiki-h2-body.twiki-collapsed {
        max-height: 0 !important;
        opacity: 0;
      }
    `;
    document.head.appendChild(style);
  }

  function applyStickyNav() {
    const sidebar = getSidebar();
    if (!sidebar) return;
    const logo = sidebar.querySelector('#p-logo');
    if (logo) document.body.prepend(logo);
    normalizeAncestors(sidebar);
    injectStyles();
    const topOffset = getTopOffset();
    Object.assign(sidebar.style, {
      position: 'sticky',
      top: `${topOffset}px`,
      maxHeight: `calc(100vh - ${topOffset + 16}px)`,
      overflowY: 'auto',
      overflowX: 'hidden',
      alignSelf: 'start',
    });
  }

  function scheduleApply() {
    requestAnimationFrame(() => requestAnimationFrame(applyStickyNav));
  }

  function bindNavContentSizeToggle() {
    const toggle =
      document.getElementById('nav-content-size-toggle') ||
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

  // ── TOC → sidebar ───────────────────────────────────────────────────────────

  function moveTOCToSidebar() {
    const toc = document.querySelector('#toc, .toc');
    const sidebar = getSidebar();
    if (!toc || !sidebar || sidebar.contains(toc)) return;
    const portlet = sidebar.querySelector('[class*="portlet"], [class*="portal"], [class*="vector-menu"]');
    if (portlet) toc.className = portlet.className;
    const title = toc.querySelector('.toctitle, #toctitle');
    if (title) title.textContent = 'Table of Contents';
    (portlet ?? sidebar).before(toc);
  }

  // ── Collapsible H2s ─────────────────────────────────────────────────────────

  function makeH2sCollapsible() {
    const content =
      document.querySelector('#mw-content-text') ||
      document.querySelector('.mw-parser-output') ||
      document.querySelector('#content') ||
      document.querySelector('main');
    if (!content) return;

    const h2s = content.querySelectorAll('h2:not([data-twiki-collapsible])') ;

    h2s.forEach((h2) => {
      h2.dataset.twikiCollapsible = '1';
      h2.classList.add('twiki-h2-toggle');

      const siblings = [];
      let node = h2.nextElementSibling;
      while (node && node.tagName !== 'H2') {
        siblings.push(node);
        node = node.nextElementSibling;
      }
      if (!siblings.length) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'twiki-h2-body';
      h2.after(wrapper);
      siblings.forEach((s) => wrapper.appendChild(s));

      h2.addEventListener('click', () => {
        const collapsed = wrapper.classList.toggle('twiki-collapsed');
        h2.classList.toggle('twiki-collapsed', collapsed);
      });
    });
  }

  // ── Init ─────────────────────────────────────────────────────────────────────

  function init() {
    applyStickyNav();
    bindNavContentSizeToggle();
    moveTOCToSidebar();
    makeH2sCollapsible();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.addEventListener('resize', scheduleApply, { passive: true });

  const observer = new MutationObserver(() => {
    bindNavContentSizeToggle();
    scheduleApply();
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true });
  setTimeout(() => observer.disconnect(), 10000);
})();
