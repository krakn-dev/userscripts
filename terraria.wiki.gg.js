// ==UserScript==
// @name         Terraria Wiki – Sticky Left Sidebar
// @namespace    https://terraria.wiki.gg/
// @version      1.0.0
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

  const HEADER_APPROX_HEIGHT = 60; // px – leave breathing room below the top bar

  function applyStickyNav() {
    // wiki.gg uses MediaWiki – the left column is #mw-panel or .mw-sidebar-container
    // depending on the skin. We cover both common selectors.
    const sidebar =
      document.querySelector('#mw-panel') ||
      document.querySelector('.mw-sidebar-container') ||
      document.querySelector('#mw-sidebar') ||
      document.querySelector('.mw-sidebar');

    if (!sidebar) return;

    // First, ensure the sidebar's wrapping column doesn't hide overflow
    let col = sidebar.parentElement;
    while (col && col !== document.body) {
      const st = window.getComputedStyle(col);
      if (st.overflow === 'hidden' || st.overflowY === 'hidden') {
        col.style.overflow = 'visible';
        col.style.overflowY = 'visible';
      }
      col = col.parentElement;
    }

    // Measure the sticky offset: height of any sticky/fixed header bars
    const stickyHeader =
      document.querySelector('#mw-head') ||
      document.querySelector('.mw-header') ||
      document.querySelector('header') ||
      document.querySelector('#site-header');

    const topOffset = stickyHeader
      ? stickyHeader.getBoundingClientRect().height + 8
      : HEADER_APPROX_HEIGHT;

    Object.assign(sidebar.style, {
      position: 'sticky',
      top: topOffset + 'px',
      maxHeight: 'calc(100vh - ' + (topOffset + 16) + 'px)',
      overflowY: 'auto',
      overflowX: 'hidden',
      scrollbarWidth: 'thin',
    });

    // webkit scrollbar styling
    const styleId = 'twiki-sticky-sidebar-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        #mw-panel::-webkit-scrollbar,
        .mw-sidebar-container::-webkit-scrollbar,
        #mw-sidebar::-webkit-scrollbar {
          width: 4px;
        }
        #mw-panel::-webkit-scrollbar-track,
        .mw-sidebar-container::-webkit-scrollbar-track,
        #mw-sidebar::-webkit-scrollbar-track {
          background: transparent;
        }
        #mw-panel::-webkit-scrollbar-thumb,
        .mw-sidebar-container::-webkit-scrollbar-thumb,
        #mw-sidebar::-webkit-scrollbar-thumb {
          background: rgba(100,100,100,0.35);
          border-radius: 2px;
        }
      `;
      document.head.appendChild(style);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyStickyNav);
  } else {
    applyStickyNav();
  }

  // Re-apply after dynamic layout shifts (wiki.gg lazy-loads portlets)
  const observer = new MutationObserver(() => applyStickyNav());
  observer.observe(document.body, { childList: true, subtree: false });
  setTimeout(() => observer.disconnect(), 5000);
})();
