/**
 * Class used to manage event-handling.
 */
class Event {

    /**
     * Registers a callback for the 'ready'-state of a document.
     * @param {Function} fn 
     */
    isReady(fn) {
        // see if DOM is already available
        if (document.readyState === "complete" || document.readyState === "interactive") {
            // call on next available tick
            setTimeout(fn, 1);
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }
}

const event = new Event();

export default event;