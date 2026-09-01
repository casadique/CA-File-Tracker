(function modernSidebarAccordion() {
  "use strict";

  const OPEN_GROUP_KEY = "ca-file-tracker-sidebar-open-group-v2";
  const GROUP_ICONS = {
    main: "dashboard", files: "folder", billing: "rupee", complaints: "chat",
    dsc: "lock", recurring: "task", reports: "chart", admin: "briefcase",
  };
  const GROUP_LABELS = {
    dsc: "DSC Management",
    reports: "Reports & Analytics",
    admin: "Settings & Admin",
  };

  function savedOpenGroup() {
    try { return localStorage.getItem(OPEN_GROUP_KEY) || ""; } catch { return ""; }
  }

  function saveOpenGroup(key) {
    try {
      if (key) localStorage.setItem(OPEN_GROUP_KEY, key);
      else localStorage.removeItem(OPEN_GROUP_KEY);
    } catch { /* Use the active route when storage is unavailable. */ }
  }

  function closeMobileSidebar() {
    document.querySelector("#sidebar")?.classList.remove("open");
    document.querySelector("#backdrop")?.classList.remove("show");
  }

  function addMobileClose(sidebar) {
    const brand = sidebar.querySelector(".brand");
    if (!brand || brand.querySelector(".sidebar-mobile-close")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sidebar-mobile-close";
    button.setAttribute("aria-label", "Close navigation");
    button.title = "Close navigation";
    button.textContent = "×";
    button.onclick = closeMobileSidebar;
    brand.appendChild(button);
  }

  function sectionIcon(key) {
    const iconName = GROUP_ICONS[key] || "file";
    if (typeof window.navIcon === "function") return window.navIcon(iconName);
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5z"/></svg>';
  }

  function prepareGroup(group) {
    const key = group.dataset.navGroup || "";
    const button = group.querySelector(".nav-section-title");
    const items = group.querySelector(".nav-group-items");
    if (!button || !items) return;
    const label = button.querySelector("span");
    if (label && GROUP_LABELS[key]) label.textContent = GROUP_LABELS[key];
    if (label) label.classList.add("nav-section-label");
    if (!button.querySelector(".nav-section-icon")) {
      const icon = document.createElement("i");
      icon.className = "nav-section-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML = sectionIcon(key);
      button.prepend(icon);
    }
    if (!items.querySelector(":scope > .nav-group-items-inner")) {
      const inner = document.createElement("div");
      inner.className = "nav-group-items-inner";
      while (items.firstChild) inner.appendChild(items.firstChild);
      items.appendChild(inner);
    }
    const itemsId = `sidebar-group-${key}`;
    items.id = itemsId;
    button.setAttribute("aria-controls", itemsId);
    button.title = label?.textContent?.trim() || key;
  }

  function setGroupState(group, open) {
    const button = group.querySelector(".nav-section-title");
    group.classList.toggle("collapsed", !open);
    group.classList.toggle("expanded", open);
    button?.setAttribute("aria-expanded", String(open));
  }

  function applyAccordion(nav) {
    const groups = [...nav.querySelectorAll(".nav-group")];
    const activeGroup = groups.find((group) => group.querySelector(".nav-item.active") && group.dataset.navGroup !== "main");
    const openKey = activeGroup?.dataset.navGroup || savedOpenGroup();
    groups.forEach((group) => {
      prepareGroup(group);
      const key = group.dataset.navGroup || "";
      const isMain = key === "main";
      const open = isMain || key === openKey;
      setGroupState(group, open);
      group.classList.toggle("contains-active", Boolean(group.querySelector(".nav-item.active")));
      const button = group.querySelector(".nav-section-title");
      if (isMain || !button) return;
      button.disabled = false;
      button.onclick = () => {
        const sidebar = nav.closest(".sidebar");
        const willOpen = group.classList.contains("collapsed");
        saveOpenGroup(willOpen ? key : "");
        if (sidebar?.classList.contains("collapsed") && window.innerWidth > 880) {
          document.querySelector("#sidebarCollapseButton")?.click();
          return;
        }
        groups.forEach((other) => {
          if (other.dataset.navGroup !== "main") setGroupState(other, willOpen && other === group);
        });
      };
    });
    nav.querySelectorAll(".nav-item").forEach((item) => {
      item.setAttribute("aria-current", item.classList.contains("active") ? "page" : "false");
      item.addEventListener("click", () => { if (window.innerWidth <= 880) closeMobileSidebar(); }, { once: true });
    });
  }

  function enhanceSidebar() {
    const sidebar = document.querySelector("#sidebar");
    const nav = document.querySelector("#nav");
    if (!sidebar || !nav) return;
    sidebar.classList.add("sidebar-accordion-ready");
    nav.setAttribute("aria-label", "Main navigation");
    addMobileClose(sidebar);
    applyAccordion(nav);
    const collapse = document.querySelector("#sidebarCollapseButton");
    if (collapse) {
      collapse.setAttribute("aria-label", sidebar.classList.contains("collapsed") ? "Expand navigation" : "Collapse navigation");
      collapse.title = collapse.getAttribute("aria-label");
    }
  }

  const originalRenderNav = window.renderNav;
  if (typeof originalRenderNav === "function") {
    window.renderNav = function enhancedRenderNav() {
      originalRenderNav();
      enhanceSidebar();
    };
  }
  enhanceSidebar();
})();
