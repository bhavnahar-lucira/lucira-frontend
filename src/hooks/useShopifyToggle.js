"use client";

import { useEffect } from "react";

export default function useShopifyToggle() {
  useEffect(() => {
    // delay execution to ensure DOM is ready
    const timeout = setTimeout(() => {
      const toggles = document.querySelectorAll("[data-toggle]");

      if (!toggles.length) return;

      const handleClick = (toggle) => {
        const targetId = toggle.getAttribute("data-toggle");
        const target = document.getElementById(targetId);

        if (!target) return;

        const isOpen = target.style.display === "block";

        // close all
        toggles.forEach((btn) => {
          const id = btn.getAttribute("data-toggle");
          const el = document.getElementById(id);

          if (el) el.style.display = "none";
          btn.classList.remove("active");

          const icon = btn.querySelector(".accordion-button");
          if (icon) icon.textContent = "+";
        });

        // open current
        if (!isOpen) {
          target.style.display = "block";
          toggle.classList.add("active");

          const icon = toggle.querySelector(".accordion-button");
          if (icon) icon.textContent = "-";
        }
      };

      toggles.forEach((toggle) => {
        toggle.style.cursor = "pointer";

        toggle.addEventListener("click", () => handleClick(toggle));
      });
    }, 0); 

    return () => clearTimeout(timeout);
  }, []);
}