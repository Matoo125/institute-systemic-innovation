/**
 * <info-tooltip> — a reusable info icon with an accessible tooltip.
 *
 * Usage:
 *   <info-tooltip label="Informácia" text="The hint shown on hover/focus."></info-tooltip>
 *
 * Behaviour:
 *   - Hover or keyboard-focus the icon to reveal the hint.
 *   - Click the icon to pin the hint open; click elsewhere (or press Escape) to dismiss.
 *
 * Accessibility:
 *   - The trigger is a real <button> with an aria-label.
 *   - The decorative icon is hidden from assistive tech (aria-hidden).
 *   - The hint has role="tooltip" and is linked to the button via aria-describedby,
 *     so screen readers announce it when the button receives focus.
 *
 * Renders into light DOM so the site's existing .tooltip theme styles apply.
 */
class InfoTooltip extends HTMLElement {
  static instanceCount = 0;

  connectedCallback() {
    if (this._initialised) return;
    this._initialised = true;

    const label = this.getAttribute("label") || "Viac informácií";
    const text = this.getAttribute("text") || this.textContent.trim();
    const bubbleId = `info-tooltip-${++InfoTooltip.instanceCount}`;

    this.classList.add("tooltip");
    this.innerHTML = `
      <button type="button" class="tooltip__trigger" aria-label="${this._escape(label)}" aria-describedby="${bubbleId}" aria-expanded="false">
        <i class="fi fi-rr-info" aria-hidden="true"></i>
      </button>
      <span id="${bubbleId}" class="tooltip__bubble" role="tooltip">${this._escape(text)}</span>
    `;

    this._trigger = this.querySelector(".tooltip__trigger");

    this._onTriggerClick = (event) => {
      // Don't let the click toggle a surrounding <details>/<summary> or bubble to the document handler.
      event.preventDefault();
      event.stopPropagation();
      this.pinned = !this.pinned;
    };

    this._onDocClick = (event) => {
      if (!this.contains(event.target)) this.pinned = false;
    };

    this._onKeydown = (event) => {
      if (event.key === "Escape") this.pinned = false;
    };

    this._trigger.addEventListener("click", this._onTriggerClick);
    document.addEventListener("click", this._onDocClick);
    document.addEventListener("keydown", this._onKeydown);
  }

  disconnectedCallback() {
    document.removeEventListener("click", this._onDocClick);
    document.removeEventListener("keydown", this._onKeydown);
  }

  get pinned() {
    return this.classList.contains("is-pinned");
  }

  set pinned(value) {
    const isPinned = Boolean(value);
    this.classList.toggle("is-pinned", isPinned);
    if (this._trigger) this._trigger.setAttribute("aria-expanded", String(isPinned));
  }

  _escape(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
  }
}

customElements.define("info-tooltip", InfoTooltip);
