/**
 * Main class to access all functions and utils.
 */
import doc       from './doc';
import event     from './event';
import imageUtil from './image';

class X {

    get doc() {
        return doc;
    }

    // providing an instance of 'Event'
    get event() {
        return event;
    }

    get imageUtil() {
        return imageUtil;
    }

    init () {
        this.event.isReady(() => {
            this.doc.init();
        });
    }

    /**
     * Can be call in .SVELTE-component by:
     * 
     *      import x from '../lib/x';
     *      ...
     *      $: shaping = x.shaping($$props);
     * 
     * where 'shaping' can be used like this in the HTML/PUG:
     * 
     *      .myComponent(...,class="{shaping}",...)
     * 
     * and when referencing you svelte-component later on you can use properties like this:
     * 
     *      MyComponent(...,primary,...) ...
     * 
     * This method will translate the single-attributes 'primary', 'secondary', 'error' and 'success'
     *  into a corresponding CSS-modifier-class using the theme and custom-properties.
     */
    shaping (props) {
        return (props && props.primary   ? '--primary'   : undefined) ||
               (props && props.secondary ? '--secondary' : undefined) ||
               (props && props.error     ? '--error'     : undefined) ||
               (props && props.success   ? '--success'   : undefined) ||
               '';
    }
}

const x = new X();

export default x;