// Accessible help modal with focus trap, ESC-to-close, idempotent init, and version footer
(function () {
  let initialized = false;
  function initializeHelpModal() {
    if (initialized) return;
    initialized = true;

    const helpButton = document.getElementById('helpButton');
    const helpModal  = document.getElementById('helpModal');
    const closeBtn   = document.getElementById('closeHelpModal');
    const versionEl  = document.getElementById('helpVersion');
    if (!helpButton || !helpModal || !closeBtn) return;

    // Ensure a11y attributes
    helpModal.setAttribute('role', 'dialog');
    helpModal.setAttribute('aria-modal', 'true');
    if (!helpModal.getAttribute('aria-labelledby')) {
      const title = helpModal.querySelector('#helpModalTitle,h2,h3');
      if (title && !title.id) title.id = 'helpModalTitle';
      if (title) helpModal.setAttribute('aria-labelledby', title.id);
    }

    let lastFocus = null;
    const getFocusables = () => {
      return Array.from(helpModal.querySelectorAll(
        'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
      )).filter(el => el.offsetParent !== null);
    };

    const escHandler = (e) => {
      if (e.key === 'Escape') close();
    };
    const trap = (e) => {
      if (e.key !== 'Tab') return;
      const f = getFocusables();
      if (!f.length) return;
      const first = f[0];
      const last  = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last.focus(); e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus(); e.preventDefault();
      }
    };

    function open() {
      lastFocus = document.activeElement;
      helpModal.classList.remove('hidden');
      const f = getFocusables();
      (f[0] || helpModal).focus();
      document.addEventListener('keydown', escHandler);
      document.addEventListener('keydown', trap);
      if (helpButton.dataset.event === 'help_open') {
        console.debug('[help] open');
      }
    }
    function close() {
      helpModal.classList.add('hidden');
      document.removeEventListener('keydown', escHandler);
      document.removeEventListener('keydown', trap);
      if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus();
      }
    }

    helpButton.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    // Click on overlay to close
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) close();
    });

    // Version footer (best-effort)
    if (versionEl) {
      try {
        fetch('/api/version')
          .then(r => r.ok ? r.json() : null)
          .then(v => {
            if (!v) return;
            const short = v.gitSha ? String(v.gitSha).slice(0, 7) : 'local';
            versionEl.textContent =
              `Build: ${v.version || 'n/a'} (${short}) @ ${v.at || ''}`;
          })
          .catch(() => {});
      } catch {}
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initializeHelpModal();
  } else {
    document.addEventListener('DOMContentLoaded', initializeHelpModal);
  }
})();
