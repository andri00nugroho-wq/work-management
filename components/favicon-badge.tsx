"use client";

import { useEffect } from "react";

const BASE_TITLE = "REI Work Management";
const BASE_ICON = "/favicon.ico";
const OWN_ATTR = "data-rei-badge-icon";

const STORED_ATTRS = ["href", "type", "sizes"] as const;

function drawIcon(image: HTMLImageElement | null, count: number) {
  const size = 96;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  if (image && image.naturalWidth > 0) {
    ctx.drawImage(image, 0, 0, size, size);
  } else {
    const base = ctx.createLinearGradient(0, 0, size, size);
    base.addColorStop(0, "#5436aa");
    base.addColorStop(1, "#2a165e");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#d4af37";
    ctx.font = "800 54px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("R", size / 2, size / 2 + 2);
  }

  if (count > 0) {
    const label = count > 99 ? "99+" : String(count);
    const cx = size - 23;
    const cy = size - 23;

    ctx.beginPath();
    ctx.arc(cx, cy, 27, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    const badge = ctx.createLinearGradient(cx - 22, cy - 22, cx + 22, cy + 22);
    badge.addColorStop(0, "#f87171");
    badge.addColorStop(1, "#dc2626");
    ctx.fillStyle = badge;
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${label.length > 2 ? 17 : label.length > 1 ? 23 : 28}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, cx, cy + 1);
  }

  return canvas.toDataURL("image/png");
}

function iconLinks() {
  return Array.from(
    document.head.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')
  );
}

function restoreLinks() {
  iconLinks().forEach((link) => {
    if (link.hasAttribute(OWN_ATTR)) {
      link.remove();
      return;
    }
    STORED_ATTRS.forEach((attr) => {
      const stored = link.getAttribute(`data-rei-original-${attr}`);
      if (stored === null) return;
      if (stored === "") link.removeAttribute(attr);
      else link.setAttribute(attr, stored);
      link.removeAttribute(`data-rei-original-${attr}`);
    });
  });
}

function applyToDocument(href: string | null, count: number) {
  if (!href) {
    restoreLinks();
    document.title = BASE_TITLE;
    return;
  }

  const links = iconLinks();
  if (links.length === 0) {
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    link.setAttribute("sizes", "96x96");
    link.setAttribute(OWN_ATTR, "true");
    document.head.appendChild(link);
    links.push(link);
  }

  links.forEach((link) => {
    STORED_ATTRS.forEach((attr) => {
      if (link.hasAttribute(`data-rei-original-${attr}`)) return;
      link.setAttribute(
        `data-rei-original-${attr}`,
        link.getAttribute(attr) ?? ""
      );
    });
    link.href = href;
    link.type = "image/png";
    link.setAttribute("sizes", "96x96");
  });

  document.title =
    count > 0 ? `(${count > 99 ? "99+" : count}) ${BASE_TITLE}` : BASE_TITLE;
}

export default function FaviconBadge({ count }: { count: number }) {
  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.src = BASE_ICON;

    const render = () => {
      if (cancelled) return;
      const href = drawIcon(image.naturalWidth > 0 ? image : null, count);
      applyToDocument(count > 0 ? href : null, count);
    };

    if (image.complete) {
      render();
    } else {
      image.addEventListener("load", render, { once: true });
      image.addEventListener("error", render, { once: true });
    }

    return () => {
      cancelled = true;
    };
  }, [count]);

  useEffect(
    () => () => {
      restoreLinks();
      document.title = BASE_TITLE;
    },
    []
  );

  return null;
}
