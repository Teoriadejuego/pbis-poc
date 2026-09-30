"use strict";
(() => {
  const menuButton = document.querySelector(".menu-toggle");
  const menu = document.querySelector("#menu");
  const closeMenu = () => { menu.classList.remove("open"); menuButton.setAttribute("aria-expanded", "false"); };
  menuButton.addEventListener("click", () => {
    const opened = menu.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(opened));
  });
  menu.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && menu.classList.contains("open")) { closeMenu(); menuButton.focus(); }
  });
  const platform = String(navigator.userAgentData?.platform || navigator.platform || "").toLowerCase();
  const detected = platform.includes("win") ? "windows" : platform.includes("mac") ? "macos" : platform.includes("linux") ? "linux" : "";
  if (detected) {
    const card = document.querySelector(`[data-platform="${detected}"]`);
    card.classList.add("recommended");
    card.querySelector(".platform-hint").textContent = "Tu sistema";
  }
})();
