(function () {
  'use strict';

  function socialLinks() {
    return `
      <div class="nav-socials">
        <a href="https://instagram.com/al4ndesign" target="_blank" rel="noopener noreferrer" class="nav-social-link" title="Instagram"><i class="fa-brands fa-instagram"></i></a>
        <a href="https://linkedin.com/company/al4ndesign" target="_blank" rel="noopener noreferrer" class="nav-social-link" title="LinkedIn"><i class="fa-brands fa-linkedin-in"></i></a>
        <a href="https://x.com/al4ndesign" target="_blank" rel="noopener noreferrer" class="nav-social-link" title="X (Twitter)"><i class="fa-brands fa-x-twitter"></i></a>
        <a href="https://dribbble.com/al4ndesign" target="_blank" rel="noopener noreferrer" class="nav-social-link" title="Dribbble"><i class="fa-brands fa-dribbble"></i></a>
      </div>
    `;
  }

  function resolveHref(page, hash) {
    if (hash === '#blog' || hash === 'blog.html') return 'blog.html';
    if (hash === '#works' || hash === 'works.html') return 'works.html';
    return page === 'home' ? hash : `index.html${hash}`;
  }

  function renderNavOverlay(page) {
    return `
      <div class="nav-overlay" id="nav-overlay" aria-hidden="true">
        <nav class="nav-panel">
          <div class="nav-top">
          </div>
          <div class="nav-links">
            <a href="${resolveHref(page, '#hero')}" class="nav-link" data-num="01">Home</a>
            <a href="${resolveHref(page, '#intro')}" class="nav-link" data-num="02">About</a>
            <a href="${resolveHref(page, '#info')}" class="nav-link" data-num="03">Works</a>
            <a href="${resolveHref(page, '#services')}" class="nav-link" data-num="04">Services</a>
            <a href="blog.html" class="nav-link" data-num="05">Blog</a>
          </div>
          <div class="nav-footer">
            <button type="button" class="nav-contact-btn" id="nav-bottom-contact">GET IN TOUCH</button>
            <div class="nav-footer-row">
              <span class="nav-copyright">© 2026 AL4N DESIGN. All rights reserved.</span>
              ${socialLinks()}
            </div>
          </div>
        </nav>
      </div>
    `;
  }

  function renderSiteHeader(page) {
    const homeHref = resolveHref(page, '#hero');
    return `
      <header class="site-header">
        <a href="${homeHref}" class="brand-fixed" id="brand-fixed" aria-label="Back to top">
          <span class="brand-marquee" aria-hidden="true">
            <svg viewBox="0 0 120 120" role="presentation">
              <defs>
                <path id="brand-marquee-path" d="M60,60 m-47,0 a47,47 0 1,1 94,0 a47,47 0 1,1 -94,0" />
              </defs>
              <text><textPath href="#brand-marquee-path" startOffset="0%"><tspan>AL4N DESIGN </tspan><tspan class="brand-marquee-dot">•</tspan></textPath></text>
            </svg>
          </span>
          <span class="brand-logo-shell"><img src="al4n design.svg" alt="AL4N DESIGN" class="brand-logo" /></span>
        </a>
        <div class="header-actions">
          <button class="theme-toggle" id="theme-toggle" aria-label="Toggle dark mode">
            <i class="fa-solid fa-moon"></i>
            <i class="fa-solid fa-sun"></i>
          </button>
          <button class="menu-btn" id="menu-btn" aria-label="Open menu" aria-expanded="false">
            <span class="menu-btn-label">MENU</span>
            <span class="menu-btn-icon">
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </header>
    `;
  }

  function renderSiteFooter(page) {
    return `
      <footer class="site-footer" id="site-footer">
        <section class="cta-wave" id="cta-wave" aria-label="Start your project">
          <h2 class="cta-wave__title" id="cta-wave-title">Ready to start your project?</h2>
          <button class="cta-wave__btn" id="collab-dialog-trigger" type="button">Let’s collaborate <span class="cta-wave__arrow" aria-hidden="true">↗</span></button>
        </section>

        <div class="footer-content">
          <div class="footer-grid">
            <div class="footer-col">
              <span class="footer-label">Directory</span>
              <nav class="footer-nav">
                <a href="${resolveHref(page, '#hero')}" class="footer-link">Home</a>
                <a href="${resolveHref(page, '#intro')}" class="footer-link">About</a>
                <a href="${resolveHref(page, '#info')}" class="footer-link">Works</a>
                <a href="${resolveHref(page, '#services')}" class="footer-link">Services</a>
                <a href="blog.html" class="footer-link">Blog</a>
              </nav>
            </div>
            <div class="footer-col">
              <span class="footer-label">Social</span>
              <nav class="footer-nav">
                <a href="https://instagram.com/al4ndesign" target="_blank" rel="noopener noreferrer" class="footer-link">Instagram</a>
                <a href="https://x.com/al4ndesign" target="_blank" rel="noopener noreferrer" class="footer-link">Twitter / X</a>
                <a href="https://dribbble.com/al4ndesign" target="_blank" rel="noopener noreferrer" class="footer-link">Dribbble</a>
              </nav>
            </div>
            <div class="footer-col">
              <span class="footer-label">Start a Project</span>
              <div class="footer-contact-stack">
                <div class="footer-email-row">
                  <a href="mailto:hello@al4ndesign.com" class="footer-email">hello@al4ndesign.com</a>
                  <button id="copy-email-footer" class="copy-btn" title="Copy to clipboard">
                    <i class="fa-regular fa-copy"></i>
                    <span class="copy-tooltip">Copied!</span>
                  </button>
                </div>
                <p class="footer-email-copyright">© 2026 AL4N DESIGN. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
        <p class="footer-giant-text">AL4N DESIGN</p>
      </footer>
    `;
  }

  // Inject Nav Overlay
  document.querySelectorAll('[data-site-nav]').forEach((slot) => {
    const page = slot.dataset.page === 'home' ? 'home' : 'project';
    slot.outerHTML = renderNavOverlay(page);
  });

  // Inject Header
  document.querySelectorAll('[data-page-header]').forEach((slot) => {
    const page = slot.dataset.pageHeader === 'home' ? 'home' : 'project';
    slot.outerHTML = renderSiteHeader(page);
  });

  // Replace Site Footer across subpages
  document.querySelectorAll('footer.site-footer, [data-home-footer], [data-site-footer]').forEach((footer) => {
    const page = document.body.classList.contains('project-page-body') ? 'project' : 'home';
    footer.outerHTML = renderSiteFooter(page);
  });

  // What I Shaped Cards
  document.querySelectorAll('[data-what-i-shaped]').forEach((slot) => {
    let cardsHTML = '';
    for (let i = 1; i <= 10; i++) {
      const icon = slot.dataset[`c${i}Icon`];
      const title = slot.dataset[`c${i}Title`];
      const color = slot.dataset[`c${i}Color`] || 'blue';
      if (icon || title) {
        cardsHTML += `
          <div class="project-page__stat-card">
            <div class="project-page__stat-visual project-page__stat-visual--${color}">
              <i class="fa-solid ${icon}"></i>
              <h4 class="project-page__stat-title">${title}</h4>
            </div>
          </div>
        `;
      }
    }

    slot.outerHTML = `
      <section class="project-page__shaped-row" aria-label="Services">
        <span class="project-page__eyebrow">Services</span>
        <div class="project-page__stats-grid">
          ${cardsHTML}
        </div>
      </section>
    `;
  });

  // Inject Bottom Bar if missing
  if (!document.getElementById('bottom-bar')) {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="bottom-bar" id="bottom-bar">
        <div class="bottom-bar-left">
          <span class="bottom-copy">© 2026 made by <a href="index.html" class="bottom-studio-link">AL4N DESIGN</a></span>
        </div>
        <div class="bottom-bar-center"></div>
        <div class="bottom-bar-right">
          <button type="button" class="join-btn">START YOUR PROJECT</button>
        </div>
      </div>
    `);
  }

  // Inject Collaboration Modal Dialog if missing
  if (!document.getElementById('collab-dialog')) {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="collab-dialog" id="collab-dialog" aria-hidden="true">
        <div class="collab-dialog__backdrop" data-collab-close></div>
        <section class="collab-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="collab-dialog-title">
          <div class="collab-dialog__header">
            <span class="collab-dialog__eyebrow">Let’s collaborate</span>
            <button class="collab-dialog__close" type="button" data-collab-close aria-label="Close collaboration form">Close</button>
          </div>
          <h2 id="collab-dialog-title">Tell us what you’re building.</h2>
          <p class="collab-dialog__intro">Share a few details about your project and we’ll get back to you within 24–48 hours.</p>
          <form class="collab-form" id="collab-form">
            <label>
              <span>Name</span>
              <input type="text" name="name" autocomplete="name" required />
            </label>
            <label>
              <span>Email</span>
              <input type="email" name="email" autocomplete="email" required />
            </label>
            <label>
              <span>Company <em>Optional</em></span>
              <input type="text" name="company" autocomplete="organization" />
            </label>
            <label>
              <span>What do you need?</span>
              <select name="service" required>
                <option value="" selected disabled>Select a service</option>
                <option value="brand-strategy">Brand strategy</option>
                <option value="identity">Visual identity</option>
                <option value="website">Website design &amp; development</option>
                <option value="campaign">Creative campaign</option>
                <option value="other">Something else</option>
              </select>
            </label>
            <label>
              <span>Project details</span>
              <textarea name="details" rows="5" required></textarea>
            </label>
            <button class="collab-form__submit" type="submit">Submit inquiry <span aria-hidden="true">↗</span></button>
            <p class="collab-form__status" id="collab-form-status" role="status" aria-live="polite"></p>
          </form>
        </section>
      </div>
    `);
  }
})();
