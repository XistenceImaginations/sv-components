export default class EventBus {

    constructor() {
        this.bus = document.createElement('eventbusnode');
    }

    bind(event, handler) {
        if (event && handler) {
            this.bus.addEventListener(event, handler);
        }
    }

    unbind(event, handler) {
        if (event && handler) {
            this.bus.removeEventListener(event, handler);
        }
    }

    dispatch(event, detail = {}) {
        this.bus.dispatchEvent(new CustomEvent(event, {detail}));
    }
}
