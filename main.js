/* ============================================================
   VACAPALS — Main JavaScript
   Premium Creative Studio Experience
   ============================================================ */

(function () {
  'use strict';

  // Let the browser restore the previous scroll position on refresh.
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'auto';
  }

  // ── Menu toggle ─────────────────────────────────────────────
  const menuBtn     = document.getElementById('menu-btn');
  const navOverlay  = document.getElementById('nav-overlay');

  function openMenu() {
    menuBtn.classList.add('is-open');
    navOverlay.classList.add('is-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    navOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    menuBtn.classList.remove('is-open');
    navOverlay.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    navOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (menuBtn && navOverlay) {
    menuBtn.addEventListener('click', () => {
      menuBtn.classList.contains('is-open') ? closeMenu() : openMenu();
    });

    // Close on backdrop click (clicking outside the panel)
    navOverlay.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-panel')) closeMenu();
    });

    // Close when a nav link is clicked
    navOverlay.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });
  }

  const serviceRows = Array.from(document.querySelectorAll('[data-service-row]'));
  const serviceGalleryUpdates = new WeakMap();
  const setServiceRowExpanded = (row, expanded) => {
    const wasExpanded = row.classList.contains('is-expanded');
    if (wasExpanded === expanded) return;

    const movingElements = Array.from(row.querySelectorAll('.services-row-copy, .services-row-previews'));
    const startRects = new Map(movingElements.map((element) => [element, element.getBoundingClientRect()]));

    row.classList.toggle('is-expanded', expanded);
    row.setAttribute('aria-expanded', String(expanded));
    row.querySelector('.services-row-view')?.setAttribute('aria-expanded', String(expanded));
    requestAnimationFrame(() => serviceGalleryUpdates.get(row)?.());

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    movingElements.forEach((element) => {
      if (typeof element.animate !== 'function') return;
      const start = startRects.get(element);
      const end = element.getBoundingClientRect();
      const offsetX = start.left - end.left;
      const offsetY = start.top - end.top;
      if (Math.abs(offsetX) < 1 && Math.abs(offsetY) < 1) return;

      element.animate(
        [
          { transform: `translate(${offsetX}px, ${offsetY}px)` },
          { transform: 'translate(0, 0)' },
        ],
        { duration: 450, easing: 'cubic-bezier(.2, .8, .2, 1)' },
      );
    });
  };

  serviceRows.forEach((row) => {
    const viewButton = row.querySelector('.services-row-view');
    const closeButton = row.querySelector('.services-row-close');
    const previews = row.querySelector('.services-row-previews');

    if (previews) {
      const slides = Array.from(previews.children);
      const gallery = document.createElement('div');
      gallery.className = 'services-row-gallery';
      previews.before(gallery);
      gallery.appendChild(previews);

      const pagination = document.createElement('div');
      pagination.className = 'services-row-pagination';
      pagination.setAttribute('role', 'group');
      pagination.setAttribute('aria-label', `${row.querySelector('.services-row-title').textContent.trim()} previews`);
      pagination.addEventListener('click', (event) => event.stopPropagation());
      gallery.appendChild(pagination);

      const slidePosition = (slide) => {
        const left = slide.getBoundingClientRect().left - previews.getBoundingClientRect().left + previews.scrollLeft;
        return Math.max(0, Math.min(left, previews.scrollWidth - previews.clientWidth));
      };
      const dots = slides.map((slide, index) => {
        const dot = document.createElement('button');
        const image = slide.matches('img') ? slide : slide.querySelector('img');
        dot.type = 'button';
        dot.className = 'services-row-dot';
        dot.setAttribute('aria-label', `Show preview ${index + 1}: ${image?.alt || 'Project preview'}`);
        dot.setAttribute('aria-controls', previews.id);
        dot.addEventListener('click', () => {
          previews.scrollTo({
            left: slidePosition(slide),
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
          });
        });
        pagination.appendChild(dot);
        return dot;
      });

      const updatePagination = () => {
        if (!row.classList.contains('is-expanded')) return;
        const maxScroll = previews.scrollWidth - previews.clientWidth;
        pagination.hidden = maxScroll < 1 || slides.length < 2;
        let activeIndex = 0;
        let nearest = Infinity;
        slides.forEach((slide, index) => {
          const distance = Math.abs(previews.scrollLeft - slidePosition(slide));
          if (distance < nearest) {
            nearest = distance;
            activeIndex = index;
          }
        });
        if (maxScroll > 1 && previews.scrollLeft >= maxScroll - 1) activeIndex = slides.length - 1;
        dots.forEach((dot, index) => {
          if (index === activeIndex) dot.setAttribute('aria-current', 'true');
          else dot.removeAttribute('aria-current');
        });
      };
      let paginationFrame = 0;
      const queuePaginationUpdate = () => {
        if (paginationFrame) return;
        paginationFrame = requestAnimationFrame(() => {
          paginationFrame = 0;
          updatePagination();
        });
      };
      serviceGalleryUpdates.set(row, queuePaginationUpdate);
      previews.addEventListener('scroll', queuePaginationUpdate, { passive: true });
      window.addEventListener('resize', queuePaginationUpdate);
      previews.querySelectorAll('img').forEach((image) => image.addEventListener('load', queuePaginationUpdate));
      if ('ResizeObserver' in window) {
        const galleryObserver = new ResizeObserver(queuePaginationUpdate);
        galleryObserver.observe(previews);
        slides.forEach((slide) => galleryObserver.observe(slide));
      }

      let activePointerId = null;
      let dragStartX = 0;
      let scrollStartX = 0;
      let suppressClick = false;

      previews.addEventListener('pointerdown', (event) => {
        if (event.pointerType !== 'mouse' || event.button !== 0 || previews.scrollWidth <= previews.clientWidth) return;
        suppressClick = false;
        activePointerId = event.pointerId;
        dragStartX = event.clientX;
        scrollStartX = previews.scrollLeft;
        previews.classList.add('is-dragging');
        previews.setPointerCapture(event.pointerId);
        event.preventDefault();
      });

      previews.addEventListener('pointermove', (event) => {
        if (event.pointerId !== activePointerId) return;
        const deltaX = event.clientX - dragStartX;
        if (Math.abs(deltaX) > 4) suppressClick = true;
        if (suppressClick) previews.scrollLeft = scrollStartX - deltaX;
      });

      const finishPreviewDrag = () => {
        if (activePointerId === null) return;
        activePointerId = null;
        previews.classList.remove('is-dragging');
      };

      previews.addEventListener('pointerup', finishPreviewDrag);
      previews.addEventListener('pointercancel', finishPreviewDrag);
      previews.addEventListener('lostpointercapture', finishPreviewDrag);
      previews.addEventListener('click', (event) => {
        event.stopPropagation();
        if (!suppressClick) return;
        event.preventDefault();
        suppressClick = false;
      });
    }

    viewButton?.addEventListener('click', (event) => {
      event.stopPropagation();
      serviceRows.forEach((otherRow) => setServiceRowExpanded(otherRow, false));
      setServiceRowExpanded(row, true);
    });

    row.addEventListener('click', (event) => {
      if (event.target.closest('a, button')) return;

      const shouldExpand = !row.classList.contains('is-expanded');
      serviceRows.forEach((otherRow) => setServiceRowExpanded(otherRow, false));
      setServiceRowExpanded(row, shouldExpand);
    });

    row.addEventListener('keydown', (event) => {
      if (event.target !== row || !['Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      const shouldExpand = !row.classList.contains('is-expanded');
      serviceRows.forEach((otherRow) => setServiceRowExpanded(otherRow, false));
      setServiceRowExpanded(row, shouldExpand);
    });

    closeButton?.addEventListener('click', (event) => {
      event.stopPropagation();
      setServiceRowExpanded(row, false);
      row.focus({ preventScroll: true });
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const expandedRow = serviceRows.find((row) => row.classList.contains('is-expanded'));
    if (!expandedRow) return;
    setServiceRowExpanded(expandedRow, false);
    expandedRow.focus({ preventScroll: true });
  });

  const brandFixed = document.getElementById('brand-fixed');
  brandFixed?.addEventListener('click', (event) => {
    if (window.location.hash !== '#hero') return;
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ── Theme toggle (Dark Mode) ──────────────────────────────────
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;

  function initTheme() {
    const savedTheme = localStorage.getItem('studio-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      body.classList.add('dark-mode');
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      body.classList.toggle('dark-mode');
      const isDark = body.classList.contains('dark-mode');
      localStorage.setItem('studio-theme', isDark ? 'dark' : 'light');
    });
  }

  initTheme();

  // Collaboration form dialog
  const collabTrigger = document.getElementById('collab-dialog-trigger');
  const collabDialog = document.getElementById('collab-dialog');
  const collabForm = document.getElementById('collab-form');
  const collabStatus = document.getElementById('collab-form-status');
  const collabLinks = document.querySelectorAll('.nav-contact-btn, .join-btn');
  let collabReturnFocus = null;

  function openCollabDialog(opener = document.activeElement) {
    if (!collabDialog) return;
    collabReturnFocus = opener?.matches?.('.nav-contact-btn') ? menuBtn : opener;
    if (navOverlay?.classList.contains('is-open')) closeMenu();
    collabDialog.classList.add('is-open');
    collabDialog.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    collabDialog.querySelector('.collab-dialog__close')?.focus();
  }

  function closeCollabDialog() {
    if (!collabDialog) return;
    collabDialog.classList.remove('is-open');
    collabDialog.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    collabReturnFocus?.focus({ preventScroll: true });
    collabReturnFocus = null;
  }

  collabTrigger?.addEventListener('click', () => openCollabDialog(collabTrigger));
  collabLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      if (!collabDialog) return;
      event.preventDefault();
      openCollabDialog(link);
    });
  });
  collabDialog?.querySelectorAll('[data-collab-close]').forEach((control) => {
    control.addEventListener('click', closeCollabDialog);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && collabDialog?.classList.contains('is-open')) {
      closeCollabDialog();
    }
  });

  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('#collab-form');
    if (!form) return;
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const statusEl = document.getElementById('collab-form-status') || form.querySelector('.collab-form__status');
    const submitBtn = form.querySelector('.collab-form__submit') || form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Submit inquiry <span aria-hidden="true">↗</span>';

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Sending... <i class="fa-solid fa-spinner fa-spin"></i>';
      }
      if (statusEl) {
        statusEl.textContent = 'Sending your inquiry...';
        statusEl.style.color = 'var(--text-dim, #777)';
      }

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      data._subject = `New Project Inquiry from ${data.name || 'Website Visitor'} - AL4N DESIGN`;
      data._template = 'table';

      const response = await fetch('https://formsubmit.co/ajax/hello@al4ndesign.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        if (statusEl) {
          statusEl.textContent = 'Thank you! Your inquiry has been sent successfully. I’ll get back to you shortly.';
          statusEl.style.color = '#10b981';
        }
        form.reset();
        setTimeout(() => {
          if (statusEl) statusEl.textContent = '';
        }, 7000);
      } else {
        throw new Error('Form submission failed');
      }
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = 'Oops! There was an issue sending your message. Please email hello@al4ndesign.com directly.';
        statusEl.style.color = '#ef4444';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    }
  });

  const newsletterForm = document.getElementById('newsletter-form');
  const newsletterStatus = document.getElementById('newsletter-form-status');
  newsletterForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!newsletterForm.checkValidity()) {
      newsletterForm.reportValidity();
      return;
    }
    if (newsletterStatus) {
      newsletterStatus.textContent = 'Thanks — you’re on the list.';
    }
  });

  document.querySelectorAll('.project-card-grid .work-card--vacapals .work-card__cta').forEach((trigger) => {
    trigger.dataset.vacapalsZoomTransition = 'true';
    trigger.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      event.preventDefault();
      const card = trigger.closest('.work-card--vacapals');
      if (!card) return;
      card.classList.add('is-opening');
      window.setTimeout(() => { window.location.href = trigger.href; }, 380);
    });
  });  document.querySelectorAll("[data-bento-card]").forEach((card) => {
    card.addEventListener("click", () => {
      const selected = card.classList.toggle("is-selected");
      card.setAttribute("aria-pressed", String(selected));
    });
  });

  if (collabDialog && window.location.hash === '#collaborate') {
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    openCollabDialog();
  }

  // ── Logo shrink on scroll ────────────────────────────────────
  const mainLogo = document.querySelector('.brand-fixed .brand-logo');
  if (mainLogo) {
    const LOGO_BIG   = 80; // px — starting size
    const LOGO_SMALL = 48; // A bit larger as requested
    const SHRINK_PX  = 200; // scroll distance over which to shrink
    
    // Set initial height
    mainLogo.style.height = `${LOGO_BIG}px`;

    function updateLogo() {
      if (window.innerWidth < 900) {
        mainLogo.style.height = `${LOGO_SMALL}px`;
        return;
      }
      const t = Math.min(1, window.scrollY / SHRINK_PX);
      const h = LOGO_BIG - (LOGO_BIG - LOGO_SMALL) * t;
      mainLogo.style.height = `${h}px`;
    }

    window.addEventListener('scroll', updateLogo, { passive: true });
    window.addEventListener('resize', updateLogo); // Ensure it adjusts if window is resized
    updateLogo(); // Run once in case user refreshes partway down
    const logoShell = mainLogo.closest('.brand-logo-shell');
    if (logoShell && window.matchMedia('(pointer: fine)').matches) {
      let logoFrame = 0;
      let targetX = 0;
      let targetY = 0;

      const moveLogo = () => {
        logoFrame = 0;
        mainLogo.style.setProperty('--magnet-x', `${targetX}px`);
        mainLogo.style.setProperty('--magnet-y', `${targetY}px`);
      };

      const queueLogoMove = () => {
        if (!logoFrame) logoFrame = window.requestAnimationFrame(moveLogo);
      };

      logoShell.addEventListener('pointermove', (event) => {
        const bounds = logoShell.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        const maxMove = Math.min(10, Math.max(4, Math.min(bounds.width, bounds.height) * 0.12));
        targetX = x * maxMove * 2;
        targetY = y * maxMove * 2;
        queueLogoMove();
      });

      logoShell.addEventListener('pointerleave', () => {
        targetX = 0;
        targetY = 0;
        queueLogoMove();
      });
    }
  }

  // ── Scroll Reveal ───────────────────────────────────────────

  const revealEls = document.querySelectorAll('.info-block, .intro-inner, .info-card-mobile');
  revealEls.forEach((el) => el.classList.add('reveal'));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15 });

  revealEls.forEach((el) => revealObserver.observe(el));

  // Stagger project and Services badges when their list enters view.
  (function () {
    const lists = document.querySelectorAll('#info > .info-block .service-list, #services .services-row-tags');
    if (!lists.length || !('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const badgeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
        } else if (entry.boundingClientRect.top >= (entry.rootBounds?.bottom ?? window.innerHeight)) {
          entry.target.classList.remove('is-revealed');
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -64px 0px' });

    lists.forEach((list) => {
      Array.from(list.children).forEach((badge, index) => {
        badge.style.setProperty('--badge-reveal-delay', `${index * 75}ms`);
      });
      list.classList.add('badge-list--reveal-ready');
      badgeObserver.observe(list);
    });
  })();

  // Reuse the Work title's letter scatter/settle effect in the hero.
  (function () {
    const title = document.getElementById('hero-headline');
    const section = document.getElementById('hero');
    if (!title || !section) return;

    const words = title.textContent.trim().split(/\s+/);
    const fullText = words.join(' ');
    title.textContent = '';
    title.setAttribute('aria-label', fullText);

    const letters = [];
    words.forEach((word, wordIndex) => {
      const group = document.createElement('span');
      group.className = 'hero-title-word-group';
      group.setAttribute('aria-hidden', 'true');
      word.split('').forEach((character) => {
        const span = document.createElement('span');
        span.className = 'hero-title-letter';
        span.textContent = character;
        group.appendChild(span);
        letters.push(span);
      });
      title.appendChild(group);
      if (wordIndex < words.length - 1) title.appendChild(document.createTextNode(' '));
    });

    const clamp01 = (value) => Math.max(0, Math.min(1, value));
    const stagger = Math.min(.08, .6 / letters.length);
    const states = letters.map((_, index) => {
      const random = (seed) => {
        const value = Math.sin(seed * 12.9898) * 43758.5453;
        return value - Math.floor(value);
      };
      return {
        x: (random(index * 78.233 + 2) - .5) * 80,
        y: 18 + random(index * 39.425 + 3) * 34,
        rotation: (random(index * 12.9898 + 1) - .5) * 60
      };
    });

    letters.forEach((letter, index) => {
      const state = states[index];
      letter.style.transform = `translate(${state.x}px, ${state.y}px) rotate(${state.rotation}deg)`;
      letter.style.opacity = '0';
    });

    let ticking = false;
    function updateHeroTitle() {
      ticking = false;
      const viewH = window.innerHeight;
      const rect = section.getBoundingClientRect();
      const start = viewH * 1.1;
      const end = viewH * .08;
      const progress = clamp01((start - rect.bottom) / (start - end));

      letters.forEach((letter, index) => {
        const reverseIndex = letters.length - index - 1;
        const local = clamp01((progress - reverseIndex * stagger) / (1 - reverseIndex * stagger));
        const state = states[index];
        letter.style.transform = `translate(${state.x * 1.35 * local}px, ${(state.y + 48) * local}px) rotate(${state.rotation * 1.15 * local}deg) scale(${1 - .06 * local})`;
        letter.style.opacity = String(1 - local);
      });
    }

    function queueHeroTitleUpdate() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateHeroTitle);
    }

    window.addEventListener('scroll', queueHeroTitleUpdate, { passive: true });
    window.addEventListener('resize', queueHeroTitleUpdate);
    requestAnimationFrame(() => requestAnimationFrame(updateHeroTitle));
  })();

  // Reuse the hero's scroll-linked letter scatter on project headings.
  (function () {
    const blocks = document.querySelectorAll('#info > .info-block');
    if (!blocks.length) return;

    const clamp01 = (value) => Math.max(0, Math.min(1, value));
    const headings = [];

    blocks.forEach((block, blockIndex) => {
      const heading = block.querySelector('.info-header');
      if (!heading) return;
      if (heading.classList.contains('info-header--tumble')) return;

      const fullText = heading.textContent.trim().replace(/\s+/g, ' ');
      const number = heading.querySelector('.header-num');
      const numberText = number ? number.textContent.trim() : '';
      const titleText = fullText.slice(numberText.length);
      const letters = [];
      heading.setAttribute('aria-label', fullText);

      if (number) {
        number.setAttribute('aria-hidden', 'true');
        number.replaceChildren();
        numberText.split('').forEach((character) => {
          const span = document.createElement('span');
          span.className = 'info-title-letter';
          span.textContent = character;
          number.appendChild(span);
          letters.push(span);
        });
        heading.replaceChildren(number);
      } else {
        heading.replaceChildren();
      }

      const words = titleText.trim().split(/\s+/).filter(Boolean);
      if (number && titleText.startsWith(' ')) heading.appendChild(document.createTextNode(' '));
      words.forEach((word, wordIndex) => {
        const group = document.createElement('span');
        group.className = 'info-title-word-group';
        group.setAttribute('aria-hidden', 'true');
        word.split('').forEach((character) => {
          const span = document.createElement('span');
          span.className = 'info-title-letter';
          span.textContent = character;
          group.appendChild(span);
          letters.push(span);
        });
        heading.appendChild(group);
        if (wordIndex < words.length - 1) heading.appendChild(document.createTextNode(' '));
      });

      const stagger = Math.min(.08, .6 / letters.length);
      const states = letters.map((_, index) => {
        const random = (seed) => {
          const value = Math.sin(seed * 12.9898) * 43758.5453;
          return value - Math.floor(value);
        };
        const seed = (blockIndex + 1) * 137 + index;
        return {
          x: (random(seed * 78.233 + 2) - .5) * 80,
          y: 18 + random(seed * 39.425 + 3) * 34,
          rotation: (random(seed * 12.9898 + 1) - .5) * 60
        };
      });

      letters.forEach((letter, index) => {
        const state = states[index];
        letter.style.transform = `translate(${state.x}px, ${state.y}px) rotate(${state.rotation}deg)`;
        letter.style.opacity = '0';
      });

      headings.push({ block, letters, states, stagger });
    });

    let ticking = false;
    function updateProjectHeadings() {
      ticking = false;
      const viewH = window.innerHeight;
      headings.forEach(({ block, letters, states, stagger }) => {
        const rect = block.getBoundingClientRect();
        const start = viewH * .82;
        const end = viewH * .08;
        const progress = clamp01((start - rect.bottom) / (start - end));

        letters.forEach((letter, index) => {
          const reverseIndex = letters.length - index - 1;
          const local = clamp01((progress - reverseIndex * stagger) / (1 - reverseIndex * stagger));
          const state = states[index];
          letter.style.transform = `translate(${state.x * 1.35 * local}px, ${(state.y + 48) * local}px) rotate(${state.rotation * 1.15 * local}deg) scale(${1 - .06 * local})`;
          letter.style.opacity = String(1 - local);
        });
      });
    }

    function queueProjectHeadingUpdate() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateProjectHeadings);
    }

    window.addEventListener('scroll', queueProjectHeadingUpdate, { passive: true });
    window.addEventListener('resize', queueProjectHeadingUpdate);
    requestAnimationFrame(() => requestAnimationFrame(updateProjectHeadings));
  })();

  // ── Process cards: staggered entrance as the grid enters view ──
  const processGrid = document.querySelector('.process-grid');
  if (processGrid) {
    processGrid.classList.add('process-grid--animated');
    const processObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    processObserver.observe(processGrid);
  }


  // ── Pause marquee on hover ──────────────────────────────────
  document.querySelectorAll('.marquee-strip').forEach((strip) => {
    strip.addEventListener('mouseenter', () => {
      strip.querySelectorAll('.marquee-track').forEach((t) => {
        t.style.animationPlayState = 'paused';
      });
    });
    strip.addEventListener('mouseleave', () => {
      strip.querySelectorAll('.marquee-track').forEach((t) => {
        t.style.animationPlayState = 'running';
      });
    });
  });

  // ── Scroll-driven player parallax + side shift + gradual resize ─
  const playerFixed = document.getElementById('player-fixed');
  const rotatingProjectLink = document.getElementById('player-project-link');
  const introSection = document.getElementById('intro');
  const servicesSectionForPlayer = document.getElementById('info');

  if (playerFixed) {
    const playerInner = playerFixed.querySelector('.player-inner');
    const heroSection = document.getElementById('hero');
    const playerHome = document.createComment('Showreel desktop position');
    playerFixed.before(playerHome);
    const LEFT_START    = 50;  // % — centered
    const LEFT_END      = 78;  // % — shifted right

    let ticking     = false;
    let frozenDocY  = null;  // document Y at which player was released
    let frozenLeft  = 0;

    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp01(v) { return Math.max(0, Math.min(1, v)); }

    function updatePlayer() {
      if (window.innerWidth <= 768) {
        // Keep the reel in normal flow below the heading on smaller screens.
        if (heroSection && playerFixed.parentElement !== heroSection) {
          heroSection.appendChild(playerFixed);
        }
        playerFixed.style.opacity = '1';
        playerFixed.style.visibility = 'visible';
        ticking = false;
        return;
      }
      if (playerFixed.parentElement === heroSection) playerHome.after(playerFixed);
      
      const scrollY  = window.scrollY;
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const progress  = scrollY / maxScroll;
      const viewH     = window.innerHeight;
      const isTablet  = window.innerWidth <= 1100;
      const baseWidth = isTablet ? 320 : 430;
      const smallWidth = isTablet ? 250 : 300;

      // ── Side progress: 0 (hero) → 1 (intro in view) ─────────
      let sideProgress = 0;
      if (introSection) {
        const rect  = introSection.getBoundingClientRect();
        const start = viewH;
        const end   = viewH * 0.3;
        sideProgress = clamp01((start - rect.top) / (start - end));
      }

      const leftPct = lerp(LEFT_START, LEFT_END, sideProgress);
      const width   = lerp(baseWidth, smallWidth, sideProgress);
      const height  = width * (3 / 4);
      const servicesRect = servicesSectionForPlayer?.getBoundingClientRect();
      const inServices = Boolean(servicesRect && servicesRect.top < viewH && servicesRect.bottom > 0);
      const bottomBarHeight = document.querySelector('.bottom-bar')?.getBoundingClientRect().height || 56;
      const rightInset = Math.min(64, Math.max(24, window.innerWidth * 0.04));
      const targetCenterX = inServices
        ? window.innerWidth - rightInset - width / 2
        : (leftPct / 100) * window.innerWidth;
      const targetCenterY = inServices
        ? viewH - bottomBarHeight - 16 - 44 - 18 - height / 2
        : viewH * 0.5 + progress * -40 + Math.min(72, viewH * 0.1);

      // ── Check stop boundary ──────────────────────────────────
      const stopEl = document.getElementById('services');
      let shouldUnstick = false;
      if (stopEl) {
        // Keep both the floating card and its CTA above the Services divider.
        const playerBottom = targetCenterY + (height / 2);
        const ctaClearance = rotatingProjectLink
          ? 18 + Math.max(rotatingProjectLink.offsetHeight, 44) + 8
          : 70;
        shouldUnstick = stopEl.getBoundingClientRect().top <= playerBottom + ctaClearance;
      }

      if (shouldUnstick) {
        // First frame of unstick: capture the document-space position
        if (frozenDocY === null) {
          frozenDocY = scrollY + targetCenterY;
          frozenLeft = targetCenterX;
        }
        // Switch to absolute so it scrolls away with the page
        playerFixed.style.position  = 'absolute';
        playerFixed.style.top       = `${frozenDocY}px`;
        playerFixed.style.left      = `${frozenLeft}px`;
        playerFixed.style.right     = 'auto';
        playerFixed.style.transform = 'translate(-50%, -50%)';
        playerFixed.style.opacity   = '1';
        playerFixed.style.visibility = 'visible';
      } else {
        // User scrolled back up — reset freeze and go back to fixed
        frozenDocY = null;

        playerFixed.style.position  = 'fixed';
        playerFixed.style.top       = `${targetCenterY}px`;
        playerFixed.style.left      = `${targetCenterX}px`;
        playerFixed.style.right     = 'auto';
        playerFixed.style.transform = 'translate(-50%, -50%)';
        playerFixed.style.opacity   = '1';
        playerFixed.style.visibility = 'visible';

        if (playerInner) {
          playerInner.style.width  = `${width}px`;
          playerInner.style.height = `${height}px`;
        }
      }

      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updatePlayer);
        ticking = true;
      }

    });
    window.addEventListener('resize', () => {
      frozenDocY = null;
      updatePlayer();
    });
    updatePlayer();
  }

  // ── Video fallback / Handling ──────────────────────────────
  const video = document.getElementById('player-video');
  if (video) {
    video.addEventListener('error', () => {
      const inner = video.parentElement;
      inner.style.background = 'linear-gradient(135deg, #d4d4d4 0%, #ebebeb 50%, #d4d4d4 100%)';
      inner.style.display = 'flex';
      inner.style.alignItems = 'center';
      inner.style.justifyContent = 'center';
      inner.style.flexDirection = 'column';
      inner.style.gap = '6px';
      const label = document.createElement('div');
      label.innerHTML = `
        <span style="font-family:'Fragment Mono',monospace;font-size:42px;font-weight:700;color:#262626;letter-spacing:-0.03em;">CR8</span>
        <br/>
        <span style="font-family:'Fragment Mono',monospace;font-size:10px;letter-spacing:0.25em;color:#a8a8a8;">STUDIO</span>
      `;
      label.style.textAlign = 'center';
      inner.appendChild(label);
    });
  }



    // ── Work Stack Scroll Effect (title scatters in, then cards fan on top) ──
  (function () {
    const rail = document.querySelector('.projects-rail');
    const stack = document.getElementById('project-card-grid');
    const section = rail?.closest('.projects-section');
    const title = document.getElementById('projects-title');
    const testimonials = document.getElementById('testimonials');
    const projectsLabel = rail?.querySelector('.projects-label');
    if (!rail || !stack || !section) return;

    const cards = Array.from(stack.querySelectorAll('.work-card'))
      .filter((card) => !card.classList.contains('work-card--digital') && !card.classList.contains('work-card--signal'));
    if (!cards.length) return;

    const TITLE_VH = 12;
    const DELAY_VH = 20;
    const PER_CARD_VH = 50;
    const HOLD_VH = 40;
    const CARD_GAP = 24;
    const TILT_STEP = 0;

    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp01(v) { return Math.max(0, Math.min(1, v)); }

    cards.forEach((card, i) => { card.style.zIndex = String(i + 1); });

    let wordEls = [];
    let scatters = [];
    let titleStagger = 0;

    if (title) {
      const words = title.textContent.trim().split(/\s+/);
      title.textContent = '';
      title.setAttribute('aria-label', words.join(' '));
      words.forEach((word, wi) => {
        const wordWrap = document.createElement('span');
        wordWrap.className = 'title-word-group';
        word.split('').forEach((ch) => {
          const span = document.createElement('span');
          span.className = 'title-word';
          span.textContent = ch;
          wordWrap.appendChild(span);
          wordEls.push(span);
        });
        title.appendChild(wordWrap);
        if (wi < words.length - 1) title.appendChild(document.createTextNode(' '));
      });

      function pseudoRandom(seed) {
        const v = Math.sin(seed * 12.9898) * 43758.5453;
        return v - Math.floor(v);
      }
      scatters = wordEls.map((_, i) => {
        const r1 = pseudoRandom(i * 12.9898 + 1);
        const r2 = pseudoRandom(i * 78.233 + 2);
        const r3 = pseudoRandom(i * 39.425 + 3);
        return { rot: (r1 - 0.5) * 60, x: (r2 - 0.5) * 80, y: 18 + r3 * 34 };
      });
      titleStagger = Math.min(0.08, 0.6 / wordEls.length);
    }

    const cardsVh = cards.length * PER_CARD_VH;
    const totalVh = TITLE_VH + DELAY_VH + cardsVh + HOLD_VH;
    const titleFraction = TITLE_VH / totalVh;
    const delayFraction = DELAY_VH / totalVh;
    const cardsFraction = cardsVh / totalVh;
    const mq = window.matchMedia('(min-width: 1101px)');
    let active = false;
    let ticking = false;

    let railStart = 0;
    function getDocumentTop(element) {
      let top = 0;
      for (let node = element; node; node = node.offsetParent) top += node.offsetTop;
      return top;
    }
    function setRailHeight() {
      rail.style.height = '100vh';
      section.style.height = `${200 + totalVh}vh`;
      railStart = getDocumentTop(rail);
    }
    function enable() { active = true; setRailHeight(); update(); }
    function disable() {
      active = false;
      rail.style.height = '';
      section.style.height = '';
      cards.forEach((card) => {
        card.style.transform = '';
        card.style.opacity = '';
        card.style.zIndex = '';
      });
      wordEls.forEach((span) => {
        span.style.transform = '';
        span.style.opacity = '';
      });
      if (projectsLabel) {
        projectsLabel.style.opacity = '';
        projectsLabel.style.transform = '';
      }
    }
    function getExitProgress(viewH) {
      if (!testimonials) return 0;
      const testTop = testimonials.getBoundingClientRect().top;
      const start = viewH * 0.95;
      const end = viewH * 0.42;
      return clamp01((start - testTop) / (start - end));
    }
    function update() {
      ticking = false;
      if (!active) return;
      const viewH = window.innerHeight;
      const dwell = (totalVh / 100) * viewH;
      const startOffset = viewH * 0.35;
      const progress = (startOffset + dwell) > 0
        ? clamp01((window.scrollY + startOffset - railStart) / (startOffset + dwell))
        : (window.scrollY + startOffset >= railStart + dwell ? 1 : 0);
      const exitProgress = getExitProgress(viewH);
      const titleProgress = clamp01(progress / titleFraction);

      wordEls.forEach((span, i) => {
        const stagger = i * titleStagger;
        if (exitProgress > 0) {
          const local = clamp01((exitProgress - stagger) / (1 - stagger));
          const s = scatters[i];
          span.style.transform = `translate(${lerp(0, s.x * 1.35, local)}px, ${lerp(0, s.y + 48, local)}px) rotate(${lerp(0, s.rot * 1.15, local)}deg) scale(${lerp(1, 0.94, local)})`;
          span.style.opacity = String(lerp(1, 0, local));
          return;
        }
        const local = clamp01((titleProgress - stagger) / (1 - stagger));
        const s = scatters[i];
        span.style.transform = `translate(${lerp(s.x, 0, local)}px, ${lerp(s.y, 0, local)}px) rotate(${lerp(s.rot, 0, local)}deg)`;
        span.style.opacity = String(clamp01(local / 0.7));
      });

      if (projectsLabel) {
        projectsLabel.style.opacity = String(lerp(1, 0, exitProgress));
        projectsLabel.style.transform = `translateY(${lerp(0, -16, exitProgress)}px)`;
      }
      const cardsProgress = clamp01((progress - titleFraction - delayFraction) / cardsFraction);
      const segment = 1 / cards.length;
      const mid = (cards.length - 1) / 2;
      const spreadX = (cards[0]?.offsetWidth || 340) + CARD_GAP;
      cards.forEach((card, i) => {
        const local = clamp01((cardsProgress - i * segment) / segment);
        const targetX = (i - mid) * spreadX;
        const targetRot = (i % 2 === 0 ? 1 : -1) * TILT_STEP;
        const x = lerp(0, targetX, local);
        const lift = lerp(46, 0, local);
        const rotate = lerp(0, targetRot, local);
        const scale = lerp(0.94, 1, local);
        const opacity = clamp01(local / 0.35);
        card.style.transform = `translate(${x}px, ${lift}px) rotate(${rotate}deg) scale(${scale})`;
        card.style.opacity = String(opacity);
      });
    }
    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }
    function syncMode() {
      if (mq.matches) enable();
      else disable();
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
      if (active) setRailHeight();
      update();
    });
    if (mq.addEventListener) mq.addEventListener('change', syncMode);
    else if (mq.addListener) mq.addListener(syncMode);
    syncMode();
  })();
// ── Testimonials heading intro (line reveal on scroll) ──────
  (function () {
    const section = document.getElementById('testimonials');
    const title   = document.getElementById('testimonials-title');
    const label   = section?.querySelector('.reviews-header .projects-label');
    const header  = section?.querySelector('.reviews-header');
    if (!section || !title) return;

    const lines  = Array.from(title.querySelectorAll('.reviews-title__inner'));
    if (!lines.length) return;

    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp01(v) { return Math.max(0, Math.min(1, v)); }

    const LINE_STAGGER = 0.2;
    const LINE_DURATION = 0.72;

    let ticking = false;

    function update() {
      ticking = false;
      const rect  = section.getBoundingClientRect();
      const viewH = window.innerHeight;
      const from  = viewH * 0.92;
      const to    = viewH * 0.48;
      const progress = clamp01((from - rect.top) / (from - to));

      if (header) {
        const headerProgress = clamp01(progress / 0.9);
        header.style.opacity = String(lerp(0.45, 1, headerProgress));
        header.style.transform = `translateY(${lerp(34, 0, headerProgress)}px) scale(${lerp(0.94, 1, headerProgress)})`;
      }

      if (label) {
        const labelProgress = clamp01(progress / 0.45);
        label.style.opacity = String(labelProgress);
        label.style.transform = `translateY(${lerp(20, 0, labelProgress)}px) scale(${lerp(0.92, 1, labelProgress)})`;
      }

      lines.forEach((line, i) => {
        const local = clamp01((progress - i * LINE_STAGGER) / LINE_DURATION);
        const y = lerp(142, 0, local);
        const opacity = clamp01(local / 0.68);

        line.style.transform = `translateY(${y}%) scale(${lerp(0.8, 1, local)}) rotateX(${lerp(-18, 0, local)}deg)`;
        line.style.opacity = String(opacity);
        line.style.filter = `blur(${lerp(16, 0, local)}px)`;
      });
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  })();

  // ── Wave scroll effect for info-header headings ─────────────
  (function () {
    const headers = document.querySelectorAll('.info-header:not(.info-header--tumble)');
    if (!headers.length) return;

    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp01(v) { return Math.max(0, Math.min(1, v)); }

    const entries = [];

    headers.forEach((header) => {
      const letters = [];
      const nodes = Array.from(header.childNodes);
      header.textContent = '';

      nodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const container = node.cloneNode(false);
          node.textContent.split('').forEach((ch) => {
            const span = document.createElement('span');
            span.className = 'wave-letter';
            span.textContent = ch;
            container.appendChild(span);
            letters.push(span);
          });
          header.appendChild(container);
        } else if (node.nodeType === Node.TEXT_NODE) {
          node.textContent.split(/(\s+)/).forEach((part) => {
            if (part === '') return;
            if (/^\s+$/.test(part)) {
              header.appendChild(document.createTextNode(part));
              return;
            }
            const group = document.createElement('span');
            group.className = 'wave-word-group';
            part.split('').forEach((ch) => {
              const span = document.createElement('span');
              span.className = 'wave-letter';
              span.textContent = ch;
              group.appendChild(span);
              letters.push(span);
            });
            header.appendChild(group);
          });
        }
      });

      entries.push({ header, letters });
    });

    const AMPLITUDE = 18; // px height of the ripple as it passes each letter
    const STAGGER   = 0.035; // scroll delay between each letter's turn, left to right
    const DURATION  = 0.18; // longer letter bumps make the wave easier to read

    function updateOne(entry) {
      const rect  = entry.header.getBoundingClientRect();
      const viewH = window.innerHeight;
      const from  = viewH * 0.92;
      const to    = viewH * 0.6;
      const progress = clamp01((from - rect.top) / (from - to));

      entry.letters.forEach((span, i) => {
        const local  = clamp01((progress - i * STAGGER) / DURATION);
        const bump   = Math.sin(local * Math.PI) * AMPLITUDE;
        const y      = -bump;

        span.style.transform = `translateY(${y}px)`;
      });
    }

    let ticking = false;
    function update() {
      ticking = false;
      entries.forEach(updateOne);
    }
    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  })();

  // Keep the project heading and Services/About text tumble linked to scroll progress.
  (function () {
    const headers = document.querySelectorAll('.info-header--tumble, .services-intro, #intro .intro-body');
    if (!headers.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const clamp01 = (value) => Math.max(0, Math.min(1, value));
    headers.forEach((header) => {
      const fullText = header.textContent.trim().replace(/\s+/g, ' ');
      const isWordAnimation = header.matches('.services-intro, #intro .intro-body');
      const number = header.querySelector('.header-num');
      const numberText = number ? number.textContent.trim() : '';
      const letters = [];
      const isHeading = header.matches('h1, h2, h3, h4, h5, h6');
      if (isHeading) header.setAttribute('aria-label', fullText);

      const appendLetters = (container, text) => {
        if (isWordAnimation) {
          text.split(/(\s+)/).filter(Boolean).forEach((word) => {
            if (/^\s+$/.test(word)) {
              container.appendChild(document.createTextNode(word));
              return;
            }
            const span = document.createElement('span');
            span.className = 'info-tumble-word';
            span.setAttribute('aria-hidden', 'true');
            span.textContent = word;
            container.appendChild(span);
            letters.push(span);
          });
          return;
        }
        text.split('').forEach((character) => {
          if (/\s/.test(character)) {
            container.appendChild(document.createTextNode(character));
            return;
          }
          const letter = document.createElement('span');
          letter.className = 'info-tumble-letter';
          letter.setAttribute('aria-hidden', 'true');
          letter.textContent = character;
          container.appendChild(letter);
          letters.push(letter);
        });
      };

      if (number) {
        number.setAttribute('aria-hidden', 'true');
        number.replaceChildren();
        appendLetters(number, numberText);
        header.replaceChildren(number);
      } else {
        header.replaceChildren();
        if (!isHeading) {
          const accessibleText = document.createElement('span');
          accessibleText.className = 'visually-hidden';
          accessibleText.textContent = fullText;
          header.appendChild(accessibleText);
        }
      }

      const titleText = fullText.slice(numberText.length).trim();
      const wordGroup = document.createElement('span');
      wordGroup.className = 'info-tumble-word-group';
      wordGroup.setAttribute('aria-hidden', 'true');
      titleText.split(/\s+/).filter(Boolean).forEach((word, index) => {
        if (index) wordGroup.appendChild(document.createTextNode(' '));
        appendLetters(wordGroup, word);
      });
      if (number && fullText.slice(numberText.length).startsWith(' ')) {
        header.appendChild(document.createTextNode(' '));
      }
      header.appendChild(wordGroup);
      header.classList.add('info-tumble-ready');

      const stagger = Math.min(.045, .52 / Math.max(1, letters.length - 1));
      const travel = 1 - stagger * Math.max(0, letters.length - 1);

      const bounceAt = (progress) => {
        const stops = [
          { at: 0, y: -24, rotate: -9, opacity: 0 },
          { at: .68, y: 4, rotate: 3, opacity: 1 },
          { at: .84, y: -2, rotate: -1, opacity: 1 },
          { at: .9, y: 0, rotate: 0, opacity: 1 },
          { at: .95, y: -5, rotate: 1.5, opacity: 1 },
          { at: 1, y: 0, rotate: 0, opacity: 1 }
        ];
        const nextIndex = stops.findIndex((stop) => stop.at >= progress);
        const left = stops[Math.max(0, nextIndex - 1)];
        const right = stops[nextIndex < 0 ? stops.length - 1 : nextIndex];
        const amount = right.at === left.at ? 1 : (progress - left.at) / (right.at - left.at);
        const smooth = amount * amount * (3 - 2 * amount);
        return {
          y: left.y + (right.y - left.y) * smooth,
          rotate: left.rotate + (right.rotate - left.rotate) * smooth,
          opacity: left.opacity + (right.opacity - left.opacity) * smooth
        };
      };

      let ticking = false;
      const update = () => {
        ticking = false;
        const rect = header.getBoundingClientRect();
        const start = window.innerHeight * .88;
        const finish = window.innerHeight * .18;
        const progress = clamp01((start - rect.top) / (start - finish));

        letters.forEach((letter, index) => {
          const local = clamp01((progress - index * stagger) / travel);
          const state = bounceAt(local);
          letter.style.opacity = String(state.opacity);
          letter.style.transform = `translate3d(0, ${state.y}px, 0) rotate(${state.rotate}deg)`;
        });
      };
      const queueUpdate = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      };

      window.addEventListener('scroll', queueUpdate, { passive: true });
      window.addEventListener('resize', queueUpdate);
      update();
    });
  })();

  // ── CTA Wave heading: single line, slides right-to-left with a ──
  // ── continuous letter ripple, both driven by scroll position   ──
  (function () {
    const section = document.getElementById('cta-wave');
    const title   = document.getElementById('cta-wave-title');
    if (!section || !title) return;

    const words = title.textContent.trim().split(/\s+/);
    title.textContent = '';
    title.setAttribute('aria-label', words.join(' '));

    const letters = [];
    words.forEach((word, wi) => {
      const group = document.createElement('span');
      group.className = 'wave-word-group';
      word.split('').forEach((ch) => {
        const span = document.createElement('span');
        span.className = 'wave-letter';
        span.textContent = ch;
        group.appendChild(span);
        letters.push(span);
      });
      title.appendChild(group);
      if (wi < words.length - 1) title.appendChild(document.createTextNode(' '));
    });

    function clamp01(v) { return Math.max(0, Math.min(1, v)); }
    function lerp(a, b, t) { return a + (b - a) * t; }

    const SLIDE_DISTANCE   = 220; // px the line travels, right to left
    const RIPPLE_AMPLITUDE = 10;  // px height of the ripple
    const RIPPLE_SPEED     = 2.2; // wave cycles across the line per scroll pass
    const RIPPLE_PHASE     = 0.35; // phase offset per letter, left to right

    let ticking = false;

    function update() {
      ticking = false;
      const rect  = section.getBoundingClientRect();
      const viewH = window.innerHeight;
      const from  = viewH * 0.95;
      const to    = viewH * 0.25;
      const progress = clamp01((from - rect.top) / (from - to));

      title.style.transform = `translateX(${lerp(SLIDE_DISTANCE, 0, progress)}px)`;

      letters.forEach((span, i) => {
        const wave = Math.sin(progress * RIPPLE_SPEED * Math.PI * 2 + i * RIPPLE_PHASE) * RIPPLE_AMPLITUDE;
        span.style.transform = `translateY(${wave}px)`;
      });
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  })();

  // ── Projects Section ────────────────────────────────────────
  (function () {
    const thumbs = document.querySelectorAll('.proj-thumb');
    const cards  = document.querySelectorAll('.proj-card');

    // Build dots for each card
    cards.forEach((card) => {
      const imgs    = card.querySelectorAll('.proj-img-container');
      const dotsEl  = card.querySelector('.proj-card-dots');
      if (!dotsEl) return;
      imgs.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'proj-dot' + (i === 0 ? ' is-active' : '');
        dot.setAttribute('data-img', i);
        dot.addEventListener('click', () => showImg(card, i));
        dotsEl.appendChild(dot);
      });
    });

    function showImg(card, idx) {
      const imgs = card.querySelectorAll('.proj-img-container');
      const dots = card.querySelectorAll('.proj-dot');
      imgs.forEach((img, i) => img.classList.toggle('is-active', i === idx));
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === idx));
    }

    function getActiveIdx(card) {
      const imgs = card.querySelectorAll('.proj-img-container');
      let active = 0;
      imgs.forEach((img, i) => { if (img.classList.contains('is-active')) active = i; });
      return active;
    }

    // Prev / Next per card
    document.querySelectorAll('.proj-prev').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.proj-card');
        const imgs = card.querySelectorAll('.proj-img-container');
        const idx  = (getActiveIdx(card) - 1 + imgs.length) % imgs.length;
        showImg(card, idx);
      });
    });

    document.querySelectorAll('.proj-next').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.proj-card');
        const imgs = card.querySelectorAll('.proj-img-container');
        const idx  = (getActiveIdx(card) + 1) % imgs.length;
        showImg(card, idx);
      });
    });

    // Thumbnail to card switch
    function activateProject(idx) {
      thumbs.forEach((t) => t.classList.toggle('is-active', +t.dataset.proj === idx));
      cards.forEach((c)  => c.classList.toggle('is-active',  +c.dataset.proj === idx));
    }

    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => activateProject(+thumb.dataset.proj));
    });
  })();

  // ── Bottom Bar Visibility (Hide when reaching real footer) ──
  const bottomBar = document.getElementById('bottom-bar');
  const siteFooter = document.getElementById('site-footer');

  document.querySelectorAll('[data-equip-carousel]').forEach((carousel) => {
    const images = [...carousel.querySelectorAll('.equip-logo-carousel__image')];
    const previous = carousel.querySelector('.equip-logo-carousel__prev');
    const next = carousel.querySelector('.equip-logo-carousel__next');
    if (!previous || !next || images.length < 2) return;
    let activeIndex = images.findIndex((image) => image.classList.contains('is-active'));
    const showImage = (index) => {
      activeIndex = (index + images.length) % images.length;
      images.forEach((image, imageIndex) => image.classList.toggle('is-active', imageIndex === activeIndex));
    };
    previous.addEventListener('click', () => showImage(activeIndex - 1));
    next.addEventListener('click', () => showImage(activeIndex + 1));
  });

  const cookieBanner = document.getElementById('cookie-banner');
  const cookieAccept = document.getElementById('cookie-accept');
  const cookieDecline = document.getElementById('cookie-decline');
  if (cookieBanner && cookieAccept && cookieDecline) {
    if (localStorage.getItem('studio-cr8-cookies-choice')) {
      cookieBanner.classList.add('is-dismissed');
    } else {
      window.setTimeout(() => cookieBanner.classList.remove('is-pending'), 1200);
    }
    const dismissCookies = (choice) => {
      localStorage.setItem('studio-cr8-cookies-choice', choice);
      cookieBanner.classList.add('is-dismissed');
    };
    cookieAccept.addEventListener('click', () => {
      dismissCookies('accepted');
    });
    cookieDecline.addEventListener('click', () => dismissCookies('declined'));
  }

  if (bottomBar && siteFooter) {
    const footerObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (mainLogo) {
          mainLogo.classList.toggle('is-footer-mark', entry.isIntersecting);
        }
        if (entry.isIntersecting) {
          bottomBar.classList.add('is-hidden');
        } else {
          bottomBar.classList.remove('is-hidden');
        }
      });
    }, {
      threshold: 0,
      rootMargin: '0px 0px 10px 0px'
    });

    footerObserver.observe(siteFooter);
  }

  // ── Project Modal Logic (Floating Collage Effect) ──────────
  const projectData = {
    "0": {
      title: "Vacapals",
      tags: ["Vacapals", "Brand Identity"],
      scope: ["Visual Identity", "Strategic Positioning", "Brand Voice", "Motion Guidelines", "Digital Strategy"],
      vision: "Creating a vibrant and welcoming brand ecosystem for Vacapals, focusing on connection, exploration, and the joy of shared experiences.",
      images: ["Vacapals/vp logo.png", "placeholder.png", "vacapals/website.gif"],
      link: "https://vacapals.com/"
    },
    "1": {
      title: "Digital Experience",
      tags: ["Web", "UX"],
      scope: ["UX Architecture", "Responsive Design", "Custom Interactions", "High-Fidelity Prototyping", "Performance Optimization"],
      vision: "Architecture built for humans, styled for the future. We prioritized load speeds and tactile interaction to bridge the gap between digital and physical sensations.",
      images: ["placeholder.png", "placeholder.png", "placeholder.png", "placeholder.png"]
    },
    "2": {
      title: "AL4N DESIGN",
      tags: ["Studio Identity", "Creative"],
      scope: ["Brand Identity", "Visual Direction", "Digital Presence", "Content System", "Brand Guidelines"],
      vision: "An in-house identity system that brings AL4N DESIGN's creative direction, voice, and digital presence into one clear expression.",
      images: ["placeholder.png", "placeholder.png", "placeholder.png"]
    },
    "3": {
      title: "Equip Pro",
      tags: ["Equip Pro", "Motion Branding"],
      scope: ["Motion Strategy", "UI Animations", "Industrial Motion Systems", "Brand Films", "Technical Visualization"],
      vision: "Defining the rhythmic language of high-performance tools. For Equip Pro, we built a motion system that mirrors the precision and power of their hardware.",
      images: ["EQUIP PRO/EQUIP PRO.png", "EQUIP PRO/equip pro brand guide.png", "EQUIP PRO/SEAL.png"]
    }
  };

  const modal = document.getElementById('project-modal');
  const modalClose = document.getElementById('modal-close');
  const modalBackdrop = document.getElementById('modal-backdrop');
  
  const modalTitle = document.getElementById('modal-title');
  const modalTags = document.getElementById('modal-tags');
  const modalScope = document.getElementById('modal-scope');
  const modalDescription = document.getElementById('modal-description');
  const modalImagesGrid = document.getElementById('modal-images-grid');
  const modalContentScroll = modal ? modal.querySelector('.modal-content') : null;

  function openModal(projectId) {
    const data = projectData[projectId];
    if (!data) return;

    if (modalTitle) modalTitle.textContent = data.title;
    if (modalDescription) modalDescription.textContent = data.vision;

    if (modal) {
      modal.classList.add('is-active');
      document.body.style.overflow = 'hidden';
    }

    const scrollHint = document.getElementById('modal-scroll-hint');
    if (scrollHint) scrollHint.classList.remove('is-hidden');

    if (modalScope) {
      modalScope.innerHTML = '';
      data.scope.forEach(s => {
        const li = document.createElement('li');
        li.textContent = s;
        modalScope.appendChild(li);
      });
    }

    const liveLink = document.getElementById('modal-live-link');
    if (liveLink) {
      if (data.link) {
        liveLink.href = data.link;
        liveLink.style.display = 'inline-flex';
      } else {
        liveLink.style.display = 'none';
      }
    }

    if (modalImagesGrid) {
      modalImagesGrid.innerHTML = '';
      const posPresets = [
        { top: '25%',  left: '8%',   w: '15%' },
        { top: '15%',  left: '72%',  w: '20%' },
        { top: '45%',  left: '12%',  w: '18%' },
        { top: '55%',  left: '65%',  w: '24%' },
        { top: '75%',  left: '15%',  w: '16%' },
        { top: '95%',  left: '55%',  w: '30%' },
        { top: '120%', left: '10%',  w: '20%' }
      ];

      const lightboxBackdrop = document.getElementById('modal-lightbox-backdrop');

      data.images.forEach((imgSrc, i) => {
        const container = document.createElement('div');
        container.className = 'modal-float-img';
        let preset = posPresets[i % posPresets.length];

        if (projectId === "3" && i === 2) {
          preset = { top: '42%', left: '72%', w: '18%' };
        }
        
        container.style.top = preset.top;
        container.style.left = preset.left;
        container.style.width = preset.w;
        container.dataset.speed = (i + 1) * 0.15 + 0.1;

        container.innerHTML = `
          <img class="proj-img" src="${imgSrc}" alt="${data.title} ${i + 1}" style="position: relative; z-index: 2;">
        `;
        
        container.addEventListener('click', (e) => {
          e.stopPropagation();
          if (container.classList.contains('is-expanded')) {
            closeExpansion();
          } else {
            expandImage(container);
          }
        });

        modalImagesGrid.appendChild(container);
      });

      function expandImage(container) {
        closeExpansion();
        container.classList.add('is-expanded');
        if (lightboxBackdrop) lightboxBackdrop.classList.add('is-active');
        document.body.style.overflow = 'hidden';
      }

      function closeExpansion() {
        const active = document.querySelector('.modal-float-img.is-expanded');
        if (active) active.classList.remove('is-expanded');
        if (lightboxBackdrop) lightboxBackdrop.classList.remove('is-active');
      }

      if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeExpansion);
    }
  }

  if (modalContentScroll && modalImagesGrid) {
    modalContentScroll.addEventListener('scroll', () => {
      const scrolled = modalContentScroll.scrollTop;
      const floaters = modalImagesGrid.querySelectorAll('.modal-float-img');
      floaters.forEach(el => {
        const speed = parseFloat(el.dataset.speed);
        const yPos = -(scrolled * speed);
        el.style.transform = `translateY(${yPos}px)`;
      });
    });
  }

  function closeModal() {
    if (modal) {
      modal.classList.remove('is-active');
      document.body.style.overflow = '';
    }
  }

  document.querySelectorAll('.proj-view-link').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const card = btn.closest('.proj-card');
      if (card) openModal(card.dataset.proj);
    });
  });

  document.querySelectorAll('[data-project-open]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const card = btn.closest('.work-card');
      if (card) openModal(card.dataset.proj);
    });
  });

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

  window.addEventListener('keydown', (e) => {
    if (modal && e.key === 'Escape' && modal.classList.contains('is-active')) {
      closeModal();
    }
  });

  // ── 3D Rotating Video Card Logic ────────────────────────────────────
  const infoSection = document.getElementById('info');
  const rotatingPlayerInner = document.getElementById('player-inner');
  const rotatingPlayerBack = document.getElementById('player-back');
  const rotatingPlayerFrontOverlay = document.getElementById('player-overlay-front');
  const rotatingLabelFront = document.getElementById('player-label-front');
  const rotatingLabelBack = document.getElementById('player-label-back');
  const playerMarqueeBack = document.getElementById('player-marquee-back');
  const playerLottieBack = document.getElementById('player-lottie-back');
  const playerVideoHero = document.getElementById('player-video');
  const playerVideo02 = document.getElementById('player-video-02');

  if (infoSection && rotatingPlayerInner && rotatingPlayerBack && rotatingPlayerFrontOverlay) {
    const sectionData = {
      '01': { bg: '#258fd8', img: 'Vacapals/logo_no_bg.png', sky: 'assets/vacapals-sky-background.png' },
      '02': { bg: '#fff', img: 'CR8.jpg' },
      '03': { bg: '#f7f7f7', img: 'EQUIP PRO/logo_no_bg.png' }
    };
    const projectPages = {
      '01': { href: 'vacapals.html', label: 'Vacapals', color: '#09005E', textColor: '#ffffff' },
      '02': { href: 'studio-cr8.html', label: 'Studio CR8', color: '#171717', textColor: '#ffffff' },
      '03': { href: 'equip-pro.html', label: 'Equip Pro', color: '#F08813', textColor: '#171717' }
    };

    const backColorOverlay = document.getElementById('player-back-color-overlay');
    const projectBackgroundImage = (data) => data.sky
      ? `url("${data.img}"), radial-gradient(ellipse at center, rgba(5, 28, 83, .34) 0%, rgba(5, 28, 83, .12) 52%, transparent 76%), url("${data.sky}")`
      : (data.img ? `url("${data.img}")` : 'none');
    const projectBackgroundSize = (data) => data.sky ? 'contain, cover, cover' : 'contain';

    const updateRotatingCard = () => {
       if (window.innerWidth < 768) return; 
       const rect = infoSection.getBoundingClientRect();
       const vh = window.innerHeight;
       
       const triggerLine = vh * 0.55;
       const scrollDist = (triggerLine - rect.top);
       
       let rawProgress = scrollDist / Math.max((rect.height / 3), 1);
       
       let progress = 0;
       if (rawProgress < 0) {
           progress = 0;
       } else if (rawProgress > 3) {
           progress = 3;
       } else {
           let base = Math.floor(rawProgress);
           let remainder = rawProgress - base;
           
           let spinPhase = Math.max(0, Math.min(remainder / 0.4, 1));
           spinPhase = 1 - Math.pow(1 - spinPhase, 2);
           
           progress = base + spinPhase;
       }
       
       let currentRot = progress * 180;
       
       // Handle Label and Style Injection
       const items = ['video', '01', '02', '03'];
       let activeIndex = Math.round(progress);
       let activeID = items[activeIndex];

       if (rotatingProjectLink) {
          const project = projectPages[activeID];
          const showProjectLink = Boolean(project && rect.bottom > 0 && rect.top < vh);
          rotatingProjectLink.hidden = !showProjectLink;
          if (showProjectLink) {
             rotatingProjectLink.href = project.href;
             rotatingProjectLink.setAttribute('aria-label', `View the ${project.label} project`);
             rotatingProjectLink.style.setProperty('--project-cta-bg', project.color);
             rotatingProjectLink.style.setProperty('--project-cta-fg', project.textColor);
          }
       }

       if (activeID === 'video') {
          if (playerVideoHero) playerVideoHero.style.opacity = '1';
          if (playerVideo02) playerVideo02.style.opacity = '0';
          rotatingPlayerFrontOverlay.style.opacity = '0';
          if (rotatingLabelFront) rotatingLabelFront.textContent = '';
          if (rotatingLabelBack) rotatingLabelBack.textContent = '';
          rotatingPlayerBack.style.backgroundImage = 'none';
          rotatingPlayerFrontOverlay.style.backgroundImage = 'none';
          if (backColorOverlay) backColorOverlay.style.opacity = '1';
       } else if (activeID === '02') {
          // Card 02: Studio CR8 image
          const data = sectionData[activeID];
          if (playerVideoHero) playerVideoHero.style.opacity = '0';
          if (playerVideo02) playerVideo02.style.opacity = '0';
          rotatingPlayerBack.style.backgroundImage = 'none';
          rotatingPlayerFrontOverlay.style.backgroundColor = data.bg;
          rotatingPlayerFrontOverlay.style.backgroundImage = `url("${data.img}")`;
          rotatingPlayerFrontOverlay.style.backgroundSize = 'contain';
          rotatingPlayerFrontOverlay.style.backgroundRepeat = 'no-repeat';
          rotatingPlayerFrontOverlay.style.backgroundPosition = 'center';
          rotatingPlayerFrontOverlay.style.opacity = '1';
          if (rotatingLabelFront) rotatingLabelFront.textContent = '';
          if (backColorOverlay) backColorOverlay.style.opacity = '1';
       } else {
          const data = sectionData[activeID];
          const isFrontTurn = (activeIndex % 2) === 0;

          if (isFrontTurn) {
             if (playerVideoHero) playerVideoHero.style.opacity = '0';
             if (playerVideo02) playerVideo02.style.opacity = '0';
             rotatingPlayerFrontOverlay.style.backgroundColor = data.bg;
             rotatingPlayerFrontOverlay.style.backgroundImage = projectBackgroundImage(data);
             rotatingPlayerFrontOverlay.style.backgroundSize = projectBackgroundSize(data);
             rotatingPlayerFrontOverlay.style.backgroundRepeat = 'no-repeat';
             rotatingPlayerFrontOverlay.style.backgroundPosition = 'center';
             rotatingPlayerFrontOverlay.style.opacity = '1';
             if (rotatingLabelFront) rotatingLabelFront.textContent = activeID;
             if (backColorOverlay) backColorOverlay.style.opacity = '1';
          } else {
             // Use the matching project identity on the back face.
             if (playerVideo02) playerVideo02.style.opacity = '0';
             if (playerVideoHero) playerVideoHero.style.opacity = '0';
             rotatingPlayerBack.style.backgroundColor = data.bg;
             rotatingPlayerBack.style.backgroundImage = projectBackgroundImage(data);
             rotatingPlayerBack.style.backgroundSize = projectBackgroundSize(data);
             rotatingPlayerBack.style.backgroundRepeat = 'no-repeat';
             rotatingPlayerBack.style.backgroundPosition = 'center';

             if (activeID === '03') {
                if (backColorOverlay) backColorOverlay.style.opacity = '0';
                if (rotatingLabelBack) rotatingLabelBack.textContent = '';
                if (playerMarqueeBack) playerMarqueeBack.style.display = 'none';
                if (playerLottieBack) playerLottieBack.style.display = '';
                if (window.bsBubbles && window._bsBubblesActive) {
                  window._bsBubblesActive = false;
                  window.bsBubbles.destroy();
                }
             } else if (activeID === '01') {
                if (backColorOverlay) backColorOverlay.style.opacity = '0';
                if (rotatingLabelBack) rotatingLabelBack.textContent = '';
                if (playerMarqueeBack) playerMarqueeBack.style.display = 'flex';
                if (playerLottieBack) playerLottieBack.style.display = 'none';
                if (window.bsBubbles && !window._bsBubblesActive) {
                  window._bsBubblesActive = true;
                  window.bsBubbles.init();
                }
             } else {
                if (backColorOverlay) {
                   backColorOverlay.style.background = data.bg;
                   backColorOverlay.style.opacity = '1';
                }
                if (rotatingLabelBack) rotatingLabelBack.textContent = activeID;
                if (playerMarqueeBack) playerMarqueeBack.style.display = 'none';
                if (window.bsBubbles && window._bsBubblesActive) {
                  window._bsBubblesActive = false;
                  window.bsBubbles.destroy();
                }
             }
          }
       }

       rotatingPlayerInner.style.transition = 'none';
       rotatingPlayerInner.style.animation = 'none';
       rotatingPlayerInner.style.transform = `scale(1) rotateY(${currentRot}deg)`;
    };

    let rotatingCardRaf = 0;
    const scheduleRotatingCardUpdate = () => {
      if (rotatingCardRaf) return;
      rotatingCardRaf = requestAnimationFrame(() => {
        rotatingCardRaf = 0;
        updateRotatingCard();
      });
    };

    window.addEventListener('scroll', scheduleRotatingCardUpdate, { passive: true });
    window.addEventListener('resize', scheduleRotatingCardUpdate);
    scheduleRotatingCardUpdate();

    setTimeout(() => {
        if (rotatingPlayerInner) {
            rotatingPlayerInner.style.animation = 'none';
            rotatingPlayerInner.style.opacity = '1';
        }
    }, 1500);
  }

  // ── Footer Copy Email ─────────────────────────────────────────
  const copyEmailBtn = document.getElementById('copy-email-footer');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', () => {
      const email = 'hello@al4ndesign.com';
      navigator.clipboard.writeText(email).then(() => {
        copyEmailBtn.classList.add('is-copied');
        setTimeout(() => {
          copyEmailBtn.classList.remove('is-copied');
        }, 2000);
      });
    });
  }

  // ── Modal Scroll Hint Interaction ──────────────────────────
  const scrollHint = document.getElementById('modal-scroll-hint');
  const modalContent = document.getElementById('modal-content-scroll');

  if (scrollHint && modalContent) {
      // Click logic: Scroll down past the text card
      scrollHint.addEventListener('click', () => {
        modalContent.scrollTo({
          top: 150,
          behavior: 'smooth'
        });
      });

      // Scroll logic: Hide hint when user scrolls manually
      modalContent.addEventListener('scroll', () => {
        if (modalContent.scrollTop > 20) {
          scrollHint.classList.add('is-hidden');
        } else {
          scrollHint.classList.remove('is-hidden');
        }
      });
    }
    // ── Branding Facts Carousel Logic ─────────────────────────────
    function initFactsCarousel(trackId, prevId, nextId, counterId, carouselId, autoDelay) {
      const track = document.getElementById(trackId);
      const slides = track ? track.querySelectorAll('.fact-slide') : [];
      const prevBtn = document.getElementById(prevId);
      const nextBtn = document.getElementById(nextId);
      const counter = document.getElementById(counterId);

      if (!track || slides.length === 0) return;

      let currentIndex = 0;
      let interval;

      function animateNumber(el) {
        const target = parseFloat(el.dataset.target);
        const decimals = parseInt(el.dataset.decimals || 0);
        const suffix = el.dataset.suffix || '';
        const duration = 1500;
        let startTime = null;
        function step(timestamp) {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / duration, 1);
          el.textContent = (progress * target).toFixed(decimals) + suffix;
          if (progress < 1) requestAnimationFrame(step);
          else el.textContent = target.toFixed(decimals) + suffix;
        }
        requestAnimationFrame(step);
      }

      function updateCarousel(index) {
        if (index >= slides.length) index = 0;
        if (index < 0) index = slides.length - 1;
        slides.forEach((slide, i) => {
          const isActive = i === index;
          slide.classList.toggle('active', isActive);
          if (isActive) {
            const numEl = slide.querySelector('.num-anim');
            if (numEl) animateNumber(numEl);
          }
        });
        if (counter) counter.textContent = String(index + 1).padStart(2, '0');
        currentIndex = index;
      }

      function startAutoPlay() {
        stopAutoPlay();
        interval = setInterval(() => updateCarousel(currentIndex + 1), 6000);
      }

      function stopAutoPlay() {
        if (interval) clearInterval(interval);
      }

      if (nextBtn) nextBtn.addEventListener('click', () => { updateCarousel(currentIndex + 1); startAutoPlay(); });
      if (prevBtn) prevBtn.addEventListener('click', () => { updateCarousel(currentIndex - 1); startAutoPlay(); });

      const carousel = document.getElementById(carouselId);
      if (carousel) {
        carousel.addEventListener('mouseenter', stopAutoPlay);
        carousel.addEventListener('mouseleave', startAutoPlay);
      }

      // Animate first slide number after intro delay
      const firstNum = slides[0].querySelector('.num-anim');
      if (firstNum) setTimeout(() => animateNumber(firstNum), autoDelay);

      startAutoPlay();
    }

    // Init hero carousel (desktop)
    initFactsCarousel('facts-track', 'fact-prev', 'fact-next', 'fact-current', 'facts-carousel', 2000);

    // Init mobile carousel (above About Us)
    initFactsCarousel('facts-track-mobile', 'fact-prev-mobile', 'fact-next-mobile', 'fact-current-mobile', 'facts-carousel-mobile', 500);



  // Horizontal project dialog used on the homepage and Works page.
  const dialog = document.getElementById('project-modal');
  const dialogTitle = document.getElementById('modal-title');
  const dialogLabel = document.getElementById('modal-label');
  const dialogDescription = document.getElementById('modal-description');
  const dialogTrack = document.getElementById('modal-side-scroll');
  const dialogLiveLink = document.getElementById('modal-live-link');
  const dialogClose = document.getElementById('modal-close');
  const dialogBackdrop = document.getElementById('modal-backdrop');
  const projectRail = document.getElementById('project-card-grid');
  const projectRailPrev = document.getElementById('project-rail-prev');
  const projectRailNext = document.getElementById('project-rail-next');

  const dialogProjects = {
    "0": {
      label: "01 / Brand ecosystem",
      title: "Vacapals",
      vision: "A brighter identity for people who would rather travel together. The full story now lives inside a side-scrolling dialog instead of a separate page.",
      scope: ["Visual Identity", "Strategic Positioning", "Brand Voice", "Motion Guidelines", "Digital Strategy"],
      link: "https://vacapals.com/",
      slides: [
        {
          eyebrow: "Overview",
          heading: "Built for shared momentum",
          copy: "Vacapals needed a social-first identity that felt useful, warm, and easy to trust. We shaped the brand around clarity, movement, and a brighter digital personality.",
          image: "vacapals/website.gif"
        },
        {
          eyebrow: "System",
          heading: "An identity that travels well",
          copy: "The visual language stretches cleanly across launch assets, trip discovery, and community content without losing the brand's sense of optimism.",
          image: "Vacapals/vp logo.png"
        }
      ]
    },
    "1": {
      label: "04 / Digital experience",
      title: "Digital Experience",
      vision: "A digital-first system built to make structure feel effortless. This case study focuses on flow, clarity, and the moments that make a screen feel tactile.",
      scope: ["UX Architecture", "Responsive Design", "Custom Interactions", "Prototype Direction", "Performance Thinking"],
      slides: [
        {
          eyebrow: "Overview",
          heading: "Designed for effortless movement",
          copy: "The experience was shaped around quick understanding, lighter navigation paths, and visual rhythm that keeps the interface active without adding noise.",
          image: "placeholder.png"
        },
        {
          eyebrow: "Interface",
          heading: "A system that feels tactile",
          copy: "Every interaction was tuned to feel more direct and more deliberate, helping the product land as polished instead of purely functional.",
          image: "placeholder.png"
        }
      ]
    },
    "2": {
      label: "02 / Studio identity",
      title: "AL4N DESIGN",
      vision: "An in-house identity system that brings AL4N DESIGN's creative direction, voice, and digital presence into one clear expression.",
      scope: ["Brand Identity", "Visual Direction", "Digital Presence", "Content System", "Brand Guidelines"],
      slides: [
        {
          eyebrow: "Overview",
          heading: "Designed to make the work memorable",
          copy: "The AL4N DESIGN identity brings its visual direction, voice, and digital presence together in one recognizable system.",
          image: "placeholder.png"
        },
        {
          eyebrow: "Identity",
          heading: "A system that stays recognizable",
          copy: "Every touchpoint is built from the same clear point of view, so the studio can evolve without losing recognition.",
          image: "placeholder.png"
        }
      ]
    },
    "3": {
      label: "03 / Industrial motion",
      title: "Equip Pro",
      vision: "A precise brand language built to move with the power of the product. The side-scroll dialog walks through the identity, guide, and supporting marks in sequence.",
      scope: ["Motion Strategy", "Industrial Motion Systems", "Brand Films", "Technical Visualization", "Brand Guide System"],
      slides: [
        {
          eyebrow: "Overview",
          heading: "Industrial branding with rhythm",
          copy: "Equip Pro needed a sharper visual system that felt engineered instead of decorative. We pushed contrast, precision, and motion cues that echo product performance.",
          image: "EQUIP PRO/equip pro brand guide.png"
        },
        {
          eyebrow: "Identity",
          heading: "A mark with more force",
          copy: "The supporting marks and seal elements give the brand authority while keeping the core system clean, direct, and product-led.",
          image: "EQUIP PRO/EQUIP PRO.png"
        }
      ]
    },
    "4": {
      label: "05 / Content system",
      title: "Signal",
      vision: "A content-led brand system designed to keep high-volume output consistent. The project balances energy, clarity, and enough structure to scale.",
      scope: ["Content Direction", "Template Systems", "Campaign Assets", "Social Toolkit", "Brand Consistency"],
      slides: [
        {
          eyebrow: "Overview",
          heading: "Built to scale without drifting",
          copy: "Signal needed a repeatable system that could move fast without making the brand feel generic. We created a framework that keeps each output recognizable on contact.",
          image: "placeholder.png"
        },
        {
          eyebrow: "Toolkit",
          heading: "A sharper publishing rhythm",
          copy: "The resulting content system gives teams a stronger starting point, tighter visual continuity, and more confidence across everyday production.",
          image: "placeholder.png"
        }
      ]
    }
  };

  function closeProjectDialog() {
    if (!dialog) return;
    dialog.classList.remove('is-active');
    dialog.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function openProjectDialog(projectId) {
    const data = dialogProjects[projectId];
    if (!dialog || !dialogTitle || !dialogDescription || !dialogTrack || !data) return;

    if (dialogLabel) dialogLabel.textContent = data.label;
    dialogTitle.textContent = data.title;
    dialogDescription.textContent = data.vision;

    if (dialogLiveLink) {
      if (data.link) {
        dialogLiveLink.href = data.link;
        dialogLiveLink.style.display = 'inline-flex';
      } else {
        dialogLiveLink.removeAttribute('href');
        dialogLiveLink.style.display = 'none';
      }
    }

    const scopeItems = data.scope.map((item) => `<li>${item}</li>`).join('');
    const scopeSlide = `
      <article class="modal-side-card modal-side-card--scope">
        <div class="modal-side-card__body">
          <span class="modal-side-card__eyebrow">Scope</span>
          <h3 class="modal-side-card__title">What shaped the project</h3>
          <p class="modal-side-card__copy">${data.vision}</p>
        </div>
        <div class="modal-side-card__body">
          <div class="modal-side-card__meta">
            <span class="modal-side-card__meta-label">Included</span>
            <ul class="modal-side-card__scope">${scopeItems}</ul>
          </div>
        </div>
      </article>
    `;

    const detailSlides = data.slides.map((slide, index) => `
      <article class="modal-side-card">
        <div class="modal-side-card__media">
          <img src="${slide.image}" alt="${data.title} detail ${index + 1}">
        </div>
        <div class="modal-side-card__body">
          <span class="modal-side-card__eyebrow">${slide.eyebrow}</span>
          <h3 class="modal-side-card__title">${slide.heading}</h3>
          <p class="modal-side-card__copy">${slide.copy}</p>
        </div>
      </article>
    `).join('');

    dialogTrack.innerHTML = scopeSlide + detailSlides;
    dialog.classList.add('is-active');
    dialog.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    dialogTrack.scrollTo({ left: 0, behavior: 'auto' });
  }

  if (dialog) {
    document.querySelectorAll('[data-project-dialog]').forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const card = trigger.closest('[data-proj]');
        if (card) openProjectDialog(card.dataset.proj);
      });
    });
  }

  if (projectRail && projectRailPrev && projectRailNext) {
    projectRailPrev.textContent = '\u2190';
    projectRailNext.textContent = '\u2192';
    projectRail.querySelectorAll('.work-card__arrow').forEach((arrow) => {
      arrow.textContent = '\u2197';
    });

    const scrollProjectRail = (direction) => {
      const firstCard = projectRail.querySelector('.work-card');
      const gap = parseFloat(getComputedStyle(projectRail).columnGap || getComputedStyle(projectRail).gap || '0');
      const distance = firstCard ? firstCard.getBoundingClientRect().width + gap : projectRail.clientWidth * 0.85;
      projectRail.scrollBy({ left: distance * direction, behavior: 'smooth' });
    };

    const updateRailButtons = () => {
      const atStart = projectRail.scrollLeft <= 2;
      const atEnd = projectRail.scrollLeft + projectRail.clientWidth >= projectRail.scrollWidth - 2;
      projectRailPrev.style.opacity = atStart ? '0.3' : '1';
      projectRailPrev.style.pointerEvents = atStart ? 'none' : '';
      projectRailNext.style.opacity = atEnd ? '0.3' : '1';
      projectRailNext.style.pointerEvents = atEnd ? 'none' : '';
    };

    projectRail.addEventListener('scroll', updateRailButtons, { passive: true });
    updateRailButtons();

    projectRailPrev.addEventListener('click', () => scrollProjectRail(-1));
    projectRailNext.addEventListener('click', () => scrollProjectRail(1));
  }

  if (dialogClose) dialogClose.addEventListener('click', closeProjectDialog);
  if (dialogBackdrop) dialogBackdrop.addEventListener('click', closeProjectDialog);

  // Keep project website previews as a complete desktop viewport inside their card.
  document.querySelectorAll('.project-page__gallery-card--website .project-page__gallery-embed').forEach((embed) => {
    const scaler = embed.querySelector('.iframe-scaler');
    if (!scaler) return;

    const fitDesktopPreview = () => {
      const isMobile = window.matchMedia('(max-width: 760px)').matches;
      const previewWidth = isMobile ? 1600 : 1440;
      const previewHeight = isMobile ? 900 : 980;
      const currentWidth = embed.getBoundingClientRect().width || embed.clientWidth || previewWidth;
      const scale = currentWidth / previewWidth;
      scaler.style.width = `${previewWidth}px`;
      scaler.style.height = `${previewHeight}px`;
      scaler.style.transform = `scale(${scale})`;
      scaler.style.transformOrigin = 'top left';
      embed.style.height = `${previewHeight * scale}px`;
    };

    window.addEventListener('resize', fitDesktopPreview);
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(fitDesktopPreview).observe(embed);
    }
    fitDesktopPreview();
    window.addEventListener('load', fitDesktopPreview);
  });

  window.addEventListener('keydown', (e) => {
    if (dialog && e.key === 'Escape' && dialog.classList.contains('is-active')) {
      closeProjectDialog();
    }
  });

})();
/* Equip Pro reversible scroll reveals */
(() => {
  const initProjectScrollReveals = () => {
    const page = document.querySelector('.project-page-body');
    if (!page || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

    const revealGroups = [
      [...page.querySelectorAll('.vacapals-bento .vacapals-bento__card')],
      [...page.querySelectorAll('.project-page__colors .project-page__color-card')]
    ];

    revealGroups.forEach((items) => {
      if (!items.length) return;

      items.forEach((item, index) => {
        item.classList.add('scroll-reveal-ready');
        item.style.setProperty('--scroll-reveal-delay', (index * 85) + 'ms');
      });

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const item = entry.target;

          if (entry.isIntersecting) {
            item.classList.add('is-scroll-revealed');
            return;
          }

          const viewportBottom = entry.rootBounds ? entry.rootBounds.bottom : window.innerHeight;
          if (entry.boundingClientRect.top >= viewportBottom) {
            item.classList.remove('is-scroll-revealed');
          }
        });
      }, {
        threshold: 0.14,
        rootMargin: '0px 0px -8% 0px'
      });

      items.forEach((item) => observer.observe(item));
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProjectScrollReveals, { once: true });
  } else {
    initProjectScrollReveals();
  }
})();
