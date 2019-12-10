class Doc { // TODO maybe rename to Dom?

    /**
     * Used to store scroll position once a HTML-tag. Later CSS-selectors can use something like:
     * 
     * html:not([data-scroll='0'])...
     * 
     * to check the position and react on it, w/o triggering a specific javascript all the time.
     */
    storeScrollPosition () {
        document.documentElement.dataset.scroll = window.scrollY;
    }

    init () {
        document.addEventListener('scroll', this.debounce(this.storeScrollPosition), { passive: true });

        this.storeScrollPosition(); // store position intially
    }

    /**
     * 'Debounces' a callback so it is more based on the animation frame, reducing lags and stuff.
     * 
     * @param {} fn 
     */
    debounce (fn) {
        let frame;

        return (...params) => {
            if (frame) { 
                cancelAnimationFrame(frame);
            }
            frame = requestAnimationFrame(() => {
                fn(...params);
            });
        } 
    }
}

const doc = new Doc();

export default doc;