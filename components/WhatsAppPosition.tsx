'use client';

import {useEffect, useRef} from 'react';
import {usePathname} from 'next/navigation';

const protectedControls = [
  '.quote-form input:not([tabindex="-1"])',
  '.quote-form select',
  '.quote-form textarea',
  '.quote-form button',
  '.inquiry-whatsapp',
  '.catalog-toolbar input',
  '.catalog-toolbar select',
  '.catalog-toolbar button',
  '.analytics-consent',
  '.spec-table',
  '.material-download .detail-actions a',
].join(',');

export function WhatsAppPosition({href, label, children}: {
  href: string; label: string; children: React.ReactNode;
}) {
  const button = useRef<HTMLAnchorElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const anchor = button.current;
    if (!anchor) return;
    const compact = window.matchMedia('(max-width: 900px)');
    let frame = 0;
    function position() {
      if (!anchor) return;
      if (!compact.matches) {
        anchor.style.removeProperty('--whatsapp-y');
        delete anchor.dataset.obstructed;
        delete anchor.dataset.compact;
        return;
      }
      const viewport = window.visualViewport;
      const {right} = anchor.getBoundingClientRect();
      const regularSize = Number.parseFloat(getComputedStyle(anchor).getPropertyValue('--whatsapp-size')) || 58;
      const top = Math.max(76, viewport?.offsetTop || 0);
      const bottom = (viewport?.offsetTop || 0) + (viewport?.height || window.innerHeight);
      const center = ((viewport?.offsetTop || 0) + bottom) / 2;
      const bounds = Array.from(document.querySelectorAll(protectedControls), (node) => node.getBoundingClientRect());
      const findPosition = (size: number, gap: number) => {
        const half = size / 2 + gap;
        const left = right - size;
        const obstacles = bounds.filter((box) =>
          box.width > 0 && box.height > 0 && box.right > left - gap && box.left < right + gap);
        const candidates = [center, top + half, bottom - half];
        for (const box of obstacles) candidates.push(box.top - half, box.bottom + half);
        return candidates.sort((a, b) => Math.abs(a - center) - Math.abs(b - center)).find((y) =>
          y >= top + half && y <= bottom - half &&
          obstacles.every((box) => y + half <= box.top || y - half >= box.bottom),
        );
      };
      const regular = findPosition(regularSize, 8);
      const clear = regular ?? findPosition(36, 3);
      anchor.toggleAttribute('data-compact', regular === undefined && clear !== undefined);
      if (clear === undefined) {
        anchor.dataset.obstructed = 'true';
      } else {
        delete anchor.dataset.obstructed;
        anchor.style.setProperty('--whatsapp-y', String(Math.round(clear)) + 'px');
      }
    }
    const refresh = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(position);
    };
    const layout = new ResizeObserver(refresh);
    const main = document.querySelector('main');
    if (main) layout.observe(main);
    window.addEventListener('scroll', refresh, {passive: true});
    window.addEventListener('resize', refresh);
    window.visualViewport?.addEventListener('resize', refresh);
    window.visualViewport?.addEventListener('scroll', refresh);
    window.addEventListener('analytics-consent-changed', refresh);
    refresh();
    return () => {
      cancelAnimationFrame(frame);
      layout.disconnect();
      window.removeEventListener('scroll', refresh);
      window.removeEventListener('resize', refresh);
      window.visualViewport?.removeEventListener('resize', refresh);
      window.visualViewport?.removeEventListener('scroll', refresh);
      window.removeEventListener('analytics-consent-changed', refresh);
    };
  }, [pathname]);

  return <a className="whatsapp-float" ref={button} href={href} target="_blank"
    rel="noopener noreferrer" aria-label={label}>{children}</a>;
}
