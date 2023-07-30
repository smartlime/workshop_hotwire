import { ApplicationController, useDebounce, useClickOutside } from 'stimulus-use'

export default class extends ApplicationController {
    static targets = ["form", "term", "results"]
    static debounces = ["fetch"]

    connect() {
        useDebounce(this, {wait: 100});
        useClickOutside(this);
    }

    disconnect() {
        this.away();
    }

    fetch() {
        this.resultsTarget.src = this.formTarget.action + "?q=" + encodeURIComponent(this.termTarget.value);
    }

    away() {
        setTimeout(() => {
            this.termTarget.value = "";
            this.resultsTarget.src = "";
            this.resultsTarget.innerHTML = '';
        }, 50);
    }

    clickOutside() {
        this.resultsTarget.hidden = true;
    }

    focus() {
        this.resultsTarget.hidden = false;
    }
}
