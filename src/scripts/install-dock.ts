const installSection = document.getElementById("install");
const copied = installSection?.dataset.copied ?? "Copied";
const copyFailed = installSection?.dataset.copyFailed ?? "Copy failed";

for (const element of document.querySelectorAll("[data-copy]")) {
  if (!(element instanceof HTMLButtonElement)) continue;
  const button = element;
  const original = button.textContent ?? "Copy";
  button.addEventListener("click", async () => {
    const command = button.dataset.copy ?? "";
    try {
      await navigator.clipboard.writeText(command);
      button.textContent = copied;
      button.dataset.copiedState = "true";
      window.setTimeout(() => {
        button.textContent = original;
        delete button.dataset.copiedState;
      }, 1500);
    } catch {
      button.textContent = copyFailed;
    }
  });
}

const installTabs = [...document.querySelectorAll("[data-install-tab]")].filter(
  (item): item is HTMLButtonElement => item instanceof HTMLButtonElement,
);
const installPanes = [...document.querySelectorAll("[data-install-pane]")].filter(
  (pane): pane is HTMLElement => pane instanceof HTMLElement,
);

function activateInstallTab(tab: HTMLButtonElement, focus = false): void {
  const target = tab.dataset.installTab;
  for (const item of installTabs) {
    const active = item === tab;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-selected", String(active));
    item.tabIndex = active ? 0 : -1;
  }
  for (const pane of installPanes) {
    pane.hidden = pane.dataset.installPane !== target;
  }
  if (focus) tab.focus();
}

for (const tab of installTabs) {
  tab.addEventListener("click", () => activateInstallTab(tab));
  tab.addEventListener("keydown", (event) => {
    if (
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight" &&
      event.key !== "Home" &&
      event.key !== "End"
    ) {
      return;
    }
    event.preventDefault();
    const index = installTabs.indexOf(tab);
    let next = index;
    if (event.key === "ArrowLeft") {
      next = (index - 1 + installTabs.length) % installTabs.length;
    } else if (event.key === "ArrowRight") {
      next = (index + 1) % installTabs.length;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = installTabs.length - 1;
    }
    const targetTab = installTabs[next];
    if (targetTab) activateInstallTab(targetTab, true);
  });
}
