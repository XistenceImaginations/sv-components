
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
            : ctx.$$scope.ctx;
    }
    function get_slot_changes(definition, ctx, changed, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
            : ctx.$$scope.changed || {};
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment && $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, props) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : prop_values;
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    class EventBus {

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

    /**
     * Class used to manage event-handling.
     */
    class Image$1 {

        constructor(){
            this.pxRegex = /px/;
            this.percentRegex = /%/,
            this.urlRegex = /url\(['"]*(.*?)['"]*\)/g;
        }

        getCoverScale(imgBounds, viewBounds){
            let result = {
                scale: 1,
                width: 0,
                height: 0,
                xOffset: 0,
                yOffset: 0
            };

            result.scale = Math.max(
                viewBounds.width / imgBounds.width,
                viewBounds.height / imgBounds.height);
            result.width = parseInt(imgBounds.width * result.scale);
            result.height = parseInt(imgBounds.height * result.scale);
            result.xOffset = (viewBounds.width - result.width)/2;
            result.yOffset = (viewBounds.height - result.height)/2;

            return result;
        }
    }

    const imageUtil = new Image$1();

    /**
     * Main class to access all functions and utils.
     */

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

    /* src\component\Accordion.svelte generated by Svelte v3.15.0 */

    const file = "src\\component\\Accordion.svelte";

    function create_fragment(ctx) {
    	let div;
    	let current;
    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svAccordion");
    			add_location(div, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return { $$slots, $$scope };
    }

    class Accordion extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Accordion",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src\component\AccordionEntry.svelte generated by Svelte v3.15.0 */

    const { console: console_1 } = globals;
    const file$1 = "src\\component\\AccordionEntry.svelte";

    function create_fragment$1(ctx) {
    	let div0;
    	let t;
    	let div0_class_value;
    	let div1;
    	let div1_class_value;
    	let current;
    	let dispose;
    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t = text(ctx.title);
    			div1 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", div0_class_value = "svAccordionEntry__title " + ctx.expandedTitle);
    			add_location(div0, file$1, 0, 0, 0);
    			attr_dev(div1, "class", div1_class_value = "svAccordionEntry__content " + ctx.expandedContent);
    			add_location(div1, file$1, 0, 109, 109);
    			dispose = listen_dev(div0, "click", ctx.toggle, false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t);
    			ctx.div0_binding(div0);
    			insert_dev(target, div1, anchor);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			ctx.div1_binding(div1);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (!current || changed.title) set_data_dev(t, ctx.title);

    			if (!current || changed.expandedTitle && div0_class_value !== (div0_class_value = "svAccordionEntry__title " + ctx.expandedTitle)) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
    			}

    			if (!current || changed.expandedContent && div1_class_value !== (div1_class_value = "svAccordionEntry__content " + ctx.expandedContent)) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			ctx.div0_binding(null);
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    			ctx.div1_binding(null);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { title = "N/A" } = $$props;
    	let expanded = false;
    	let titleElm;
    	let contentElm;

    	function toggle() {
    		$$invalidate("expanded", expanded = !expanded);
    		console.log("toggle: " + expanded);
    	}

    	const writable_props = ["title"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<AccordionEntry> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate("titleElm", titleElm = $$value);
    		});
    	}

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate("contentElm", contentElm = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("title" in $$props) $$invalidate("title", title = $$props.title);
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			title,
    			expanded,
    			titleElm,
    			contentElm,
    			expandedTitle,
    			expandedContent
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate("title", title = $$props.title);
    		if ("expanded" in $$props) $$invalidate("expanded", expanded = $$props.expanded);
    		if ("titleElm" in $$props) $$invalidate("titleElm", titleElm = $$props.titleElm);
    		if ("contentElm" in $$props) $$invalidate("contentElm", contentElm = $$props.contentElm);
    		if ("expandedTitle" in $$props) $$invalidate("expandedTitle", expandedTitle = $$props.expandedTitle);
    		if ("expandedContent" in $$props) $$invalidate("expandedContent", expandedContent = $$props.expandedContent);
    	};

    	let expandedTitle;
    	let expandedContent;

    	$$self.$$.update = (changed = { expanded: 1 }) => {
    		if (changed.expanded) {
    			 $$invalidate("expandedTitle", expandedTitle = expanded ? "svAccordionEntry__title--expanded" : "");
    		}

    		if (changed.expanded) {
    			 $$invalidate("expandedContent", expandedContent = expanded ? "svAccordionEntry__content--expanded" : "");
    		}
    	};

    	return {
    		title,
    		titleElm,
    		contentElm,
    		toggle,
    		expandedTitle,
    		expandedContent,
    		div0_binding,
    		div1_binding,
    		$$slots,
    		$$scope
    	};
    }

    class AccordionEntry extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { title: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AccordionEntry",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get title() {
    		throw new Error("<AccordionEntry>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<AccordionEntry>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\component\Article.svelte generated by Svelte v3.15.0 */

    const file$2 = "src\\component\\Article.svelte";

    function create_fragment$2(ctx) {
    	let div1;
    	let h2;
    	let t;
    	let div0;
    	let current;
    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h2 = element("h2");
    			t = text(ctx.title);
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(h2, "class", "svArticle__title");
    			add_location(h2, file$2, 0, 23, 23);
    			attr_dev(div0, "class", "svArticle__content");
    			add_location(div0, file$2, 0, 64, 64);
    			attr_dev(div1, "class", "svArticle");
    			add_location(div1, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h2);
    			append_dev(h2, t);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (!current || changed.title) set_data_dev(t, ctx.title);

    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { title = "N/A" } = $$props;
    	const writable_props = ["title"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Article> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("title" in $$props) $$invalidate("title", title = $$props.title);
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { title };
    	};

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate("title", title = $$props.title);
    	};

    	return { title, $$slots, $$scope };
    }

    class Article extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { title: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Article",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get title() {
    		throw new Error("<Article>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Article>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\component\Button.svelte generated by Svelte v3.15.0 */

    const file$3 = "src\\component\\Button.svelte";

    // (1:101) {#if icon}
    function create_if_block(ctx) {
    	let i;
    	let i_class_value;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", i_class_value = "icon-" + ctx.icon);
    			add_location(i, file$3, 0, 111, 111);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    		},
    		p: function update(changed, ctx) {
    			if (changed.icon && i_class_value !== (i_class_value = "icon-" + ctx.icon)) {
    				attr_dev(i, "class", i_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(1:101) {#if icon}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div1;
    	let div0;
    	let if_block_anchor;
    	let div1_class_value;
    	let current;
    	let if_block = ctx.icon && create_if_block(ctx);
    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "svButton__text");
    			attr_dev(div0, "data-label", ctx.label);
    			add_location(div0, file$3, 0, 34, 34);
    			attr_dev(div1, "class", div1_class_value = "svButton " + ctx.styleType);
    			add_location(div1, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			if (if_block) if_block.m(div0, null);
    			append_dev(div0, if_block_anchor);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			ctx.div0_binding(div0);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (ctx.icon) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div0, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
    			}

    			if (!current || changed.label) {
    				attr_dev(div0, "data-label", ctx.label);
    			}

    			if (!current || changed.styleType && div1_class_value !== (div1_class_value = "svButton " + ctx.styleType)) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			if (default_slot) default_slot.d(detaching);
    			ctx.div0_binding(null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    let foo = false;

    function instance$3($$self, $$props, $$invalidate) {
    	let { type } = $$props;
    	let { icon = undefined } = $$props;
    	let elm;
    	const writable_props = ["type", "icon"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate("elm", elm = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("type" in $$props) $$invalidate("type", type = $$props.type);
    		if ("icon" in $$props) $$invalidate("icon", icon = $$props.icon);
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { type, icon, elm, foo, styleType, label };
    	};

    	$$self.$inject_state = $$props => {
    		if ("type" in $$props) $$invalidate("type", type = $$props.type);
    		if ("icon" in $$props) $$invalidate("icon", icon = $$props.icon);
    		if ("elm" in $$props) $$invalidate("elm", elm = $$props.elm);
    		if ("foo" in $$props) foo = $$props.foo;
    		if ("styleType" in $$props) $$invalidate("styleType", styleType = $$props.styleType);
    		if ("label" in $$props) $$invalidate("label", label = $$props.label);
    	};

    	let styleType;
    	let label;

    	$$self.$$.update = (changed = { type: 1, elm: 1 }) => {
    		if (changed.type) {
    			 $$invalidate("styleType", styleType = type.split(" ").map(s => "svButton--" + (s || "default")).join(" "));
    		}

    		if (changed.elm) {
    			 $$invalidate("label", label = elm ? elm.innerText : "");
    		}
    	};

    	return {
    		type,
    		icon,
    		elm,
    		styleType,
    		label,
    		div0_binding,
    		$$slots,
    		$$scope
    	};
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { type: 0, icon: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (ctx.type === undefined && !("type" in props)) {
    			console.warn("<Button> was created without expected prop 'type'");
    		}
    	}

    	get type() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\component\ButtonGroup.svelte generated by Svelte v3.15.0 */

    const file$4 = "src\\component\\ButtonGroup.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let current;
    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svButtonGroup");
    			add_location(div, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return { $$slots, $$scope };
    }

    class ButtonGroup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ButtonGroup",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\component\FlipPanel.svelte generated by Svelte v3.15.0 */
    const file$5 = "src\\component\\FlipPanel.svelte";
    const get_back_slot_changes = () => ({});
    const get_back_slot_context = () => ({});
    const get_front_slot_changes = () => ({});
    const get_front_slot_context = () => ({});

    function create_fragment$5(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let div1;
    	let div3_class_value;
    	let current;
    	let dispose;
    	const front_slot_template = ctx.$$slots.front;
    	const front_slot = create_slot(front_slot_template, ctx, get_front_slot_context);
    	const back_slot_template = ctx.$$slots.back;
    	const back_slot = create_slot(back_slot_template, ctx, get_back_slot_context);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			if (front_slot) front_slot.c();
    			div1 = element("div");
    			if (back_slot) back_slot.c();
    			attr_dev(div0, "class", "svFlipPanel__content_front");
    			add_location(div0, file$5, 0, 101, 101);
    			attr_dev(div1, "class", "svFlipPanel__content_back");
    			add_location(div1, file$5, 0, 173, 173);
    			attr_dev(div2, "class", "svFlipPanel__content");
    			add_location(div2, file$5, 0, 67, 67);
    			attr_dev(div3, "class", div3_class_value = "svFlipPanel " + ctx.flipState + " " + ctx.flipStyle);
    			add_location(div3, file$5, 0, 0, 0);
    			dispose = listen_dev(div3, "click", ctx.flip, false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div0);

    			if (front_slot) {
    				front_slot.m(div0, null);
    			}

    			append_dev(div2, div1);

    			if (back_slot) {
    				back_slot.m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (front_slot && front_slot.p && changed.$$scope) {
    				front_slot.p(get_slot_changes(front_slot_template, ctx, changed, get_front_slot_changes), get_slot_context(front_slot_template, ctx, get_front_slot_context));
    			}

    			if (back_slot && back_slot.p && changed.$$scope) {
    				back_slot.p(get_slot_changes(back_slot_template, ctx, changed, get_back_slot_changes), get_slot_context(back_slot_template, ctx, get_back_slot_context));
    			}

    			if (!current || (changed.flipState || changed.flipStyle) && div3_class_value !== (div3_class_value = "svFlipPanel " + ctx.flipState + " " + ctx.flipStyle)) {
    				attr_dev(div3, "class", div3_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(front_slot, local);
    			transition_in(back_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(front_slot, local);
    			transition_out(back_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (front_slot) front_slot.d(detaching);
    			if (back_slot) back_slot.d(detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { horizontal } = $$props;
    	const dispatch = createEventDispatcher();
    	let flipped = false;

    	function flip() {
    		$$invalidate("flipped", flipped = !flipped);
    		dispatch("flip", { state: flipped });
    	}

    	const writable_props = ["horizontal"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FlipPanel> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("horizontal" in $$props) $$invalidate("horizontal", horizontal = $$props.horizontal);
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			horizontal,
    			flipped,
    			flipStyle,
    			flipState
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("horizontal" in $$props) $$invalidate("horizontal", horizontal = $$props.horizontal);
    		if ("flipped" in $$props) $$invalidate("flipped", flipped = $$props.flipped);
    		if ("flipStyle" in $$props) $$invalidate("flipStyle", flipStyle = $$props.flipStyle);
    		if ("flipState" in $$props) $$invalidate("flipState", flipState = $$props.flipState);
    	};

    	let flipStyle;
    	let flipState;

    	$$self.$$.update = (changed = { horizontal: 1, flipped: 1 }) => {
    		if (changed.horizontal) {
    			 $$invalidate("flipStyle", flipStyle = horizontal !== undefined
    			? "svFlipPanel--horizontal"
    			: "svFlipPanel--vertical");
    		}

    		if (changed.flipped) {
    			 $$invalidate("flipState", flipState = flipped ? "svFlipPanel--flipped" : "");
    		}
    	};

    	return {
    		horizontal,
    		flip,
    		flipStyle,
    		flipState,
    		$$slots,
    		$$scope
    	};
    }

    class FlipPanel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { horizontal: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FlipPanel",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (ctx.horizontal === undefined && !("horizontal" in props)) {
    			console.warn("<FlipPanel> was created without expected prop 'horizontal'");
    		}
    	}

    	get horizontal() {
    		throw new Error("<FlipPanel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set horizontal(value) {
    		throw new Error("<FlipPanel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\component\Card.svelte generated by Svelte v3.15.0 */
    const file$6 = "src\\component\\Card.svelte";
    const get_longDesc_slot_changes = () => ({});
    const get_longDesc_slot_context = () => ({});
    const get_shortDesc_slot_changes = () => ({});
    const get_shortDesc_slot_context = () => ({});
    const get_image_slot_changes = () => ({});
    const get_image_slot_context = () => ({});

    // (1:31) <div class="svCard__front" slot="front">
    function create_front_slot(ctx) {
    	let div0;
    	let div1;
    	let div2;
    	let current;
    	const image_slot_template = ctx.$$slots.image;
    	const image_slot = create_slot(image_slot_template, ctx, get_image_slot_context);
    	const shortDesc_slot_template = ctx.$$slots.shortDesc;
    	const shortDesc_slot = create_slot(shortDesc_slot_template, ctx, get_shortDesc_slot_context);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div1 = element("div");
    			if (image_slot) image_slot.c();
    			div2 = element("div");
    			if (shortDesc_slot) shortDesc_slot.c();
    			set_style(div1, "grid-area", "content");
    			set_style(div1, "border", "1px solid rgba(0,0,0,.5)");
    			set_style(div1, "background-color", "rgb(127,127,127)");
    			add_location(div1, file$6, 0, 71, 71);
    			set_style(div2, "grid-area", "desc");
    			set_style(div2, "border", "1px solid rgba(0,0,0,.5)");
    			set_style(div2, "background-color", "rgb(127,127,127)");
    			add_location(div2, file$6, 0, 201, 201);
    			attr_dev(div0, "class", "svCard__front");
    			attr_dev(div0, "slot", "front");
    			add_location(div0, file$6, 0, 31, 31);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, div1);

    			if (image_slot) {
    				image_slot.m(div1, null);
    			}

    			append_dev(div0, div2);

    			if (shortDesc_slot) {
    				shortDesc_slot.m(div2, null);
    			}

    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (image_slot && image_slot.p && changed.$$scope) {
    				image_slot.p(get_slot_changes(image_slot_template, ctx, changed, get_image_slot_changes), get_slot_context(image_slot_template, ctx, get_image_slot_context));
    			}

    			if (shortDesc_slot && shortDesc_slot.p && changed.$$scope) {
    				shortDesc_slot.p(get_slot_changes(shortDesc_slot_template, ctx, changed, get_shortDesc_slot_changes), get_slot_context(shortDesc_slot_template, ctx, get_shortDesc_slot_context));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(image_slot, local);
    			transition_in(shortDesc_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(image_slot, local);
    			transition_out(shortDesc_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (image_slot) image_slot.d(detaching);
    			if (shortDesc_slot) shortDesc_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_front_slot.name,
    		type: "slot",
    		source: "(1:31) <div class=\\\"svCard__front\\\" slot=\\\"front\\\">",
    		ctx
    	});

    	return block;
    }

    // (1:338) <div class="svCard__back" slot="back">
    function create_back_slot(ctx) {
    	let div0;
    	let div1;
    	let current;
    	const longDesc_slot_template = ctx.$$slots.longDesc;
    	const longDesc_slot = create_slot(longDesc_slot_template, ctx, get_longDesc_slot_context);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div1 = element("div");
    			if (longDesc_slot) longDesc_slot.c();
    			set_style(div1, "grid-area", "content");
    			set_style(div1, "border", "1px solid rgba(0,0,0,.5)");
    			set_style(div1, "background-color", "rgb(127,127,127)");
    			add_location(div1, file$6, 0, 376, 376);
    			attr_dev(div0, "class", "svCard__back");
    			attr_dev(div0, "slot", "back");
    			add_location(div0, file$6, 0, 338, 338);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, div1);

    			if (longDesc_slot) {
    				longDesc_slot.m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (longDesc_slot && longDesc_slot.p && changed.$$scope) {
    				longDesc_slot.p(get_slot_changes(longDesc_slot_template, ctx, changed, get_longDesc_slot_changes), get_slot_context(longDesc_slot_template, ctx, get_longDesc_slot_context));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(longDesc_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(longDesc_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (longDesc_slot) longDesc_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_back_slot.name,
    		type: "slot",
    		source: "(1:338) <div class=\\\"svCard__back\\\" slot=\\\"back\\\">",
    		ctx
    	});

    	return block;
    }

    // (1:20) <FlipPanel>
    function create_default_slot(ctx) {

    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(1:20) <FlipPanel>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div;
    	let current;

    	const flippanel = new FlipPanel({
    			props: {
    				$$slots: {
    					default: [create_default_slot],
    					back: [create_back_slot],
    					front: [create_front_slot]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(flippanel.$$.fragment);
    			attr_dev(div, "class", "svCard");
    			add_location(div, file$6, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(flippanel, div, null);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const flippanel_changes = {};

    			if (changed.$$scope) {
    				flippanel_changes.$$scope = { changed, ctx };
    			}

    			flippanel.$set(flippanel_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(flippanel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(flippanel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(flippanel);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return { $$slots, $$scope };
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\component\CheckBox.svelte generated by Svelte v3.15.0 */

    const file$7 = "src\\component\\CheckBox.svelte";

    function create_fragment$7(ctx) {
    	let label;
    	let input;
    	let span0;
    	let span1;
    	let current;
    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			span0 = element("span");
    			span1 = element("span");
    			if (default_slot) default_slot.c();
    			attr_dev(input, "type", ctx.inputType);
    			input.value = ctx.value;
    			input.checked = ctx.checked;
    			input.disabled = ctx.disabled;
    			attr_dev(input, "name", ctx.name);
    			add_location(input, file$7, 1, 26, 59);
    			attr_dev(span0, "class", "svCheckBox__checkmark");
    			add_location(span0, file$7, 1, 88, 121);
    			attr_dev(span1, "class", "svCheckBox__label");
    			add_location(span1, file$7, 1, 131, 164);
    			attr_dev(label, "class", "svCheckBox");
    			add_location(label, file$7, 1, 0, 33);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			append_dev(label, span0);
    			append_dev(label, span1);

    			if (default_slot) {
    				default_slot.m(span1, null);
    			}

    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (!current || changed.inputType) {
    				attr_dev(input, "type", ctx.inputType);
    			}

    			if (!current || changed.value) {
    				prop_dev(input, "value", ctx.value);
    			}

    			if (!current || changed.checked) {
    				prop_dev(input, "checked", ctx.checked);
    			}

    			if (!current || changed.disabled) {
    				prop_dev(input, "disabled", ctx.disabled);
    			}

    			if (!current || changed.name) {
    				attr_dev(input, "name", ctx.name);
    			}

    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { value = "" } = $$props;
    	let { checked = false } = $$props;
    	let { disabled = false } = $$props;
    	let { type = "check" } = $$props;
    	let { name = undefined } = $$props;
    	const writable_props = ["value", "checked", "disabled", "type", "name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CheckBox> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("value" in $$props) $$invalidate("value", value = $$props.value);
    		if ("checked" in $$props) $$invalidate("checked", checked = $$props.checked);
    		if ("disabled" in $$props) $$invalidate("disabled", disabled = $$props.disabled);
    		if ("type" in $$props) $$invalidate("type", type = $$props.type);
    		if ("name" in $$props) $$invalidate("name", name = $$props.name);
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			value,
    			checked,
    			disabled,
    			type,
    			name,
    			inputType
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate("value", value = $$props.value);
    		if ("checked" in $$props) $$invalidate("checked", checked = $$props.checked);
    		if ("disabled" in $$props) $$invalidate("disabled", disabled = $$props.disabled);
    		if ("type" in $$props) $$invalidate("type", type = $$props.type);
    		if ("name" in $$props) $$invalidate("name", name = $$props.name);
    		if ("inputType" in $$props) $$invalidate("inputType", inputType = $$props.inputType);
    	};

    	let inputType;

    	$$self.$$.update = (changed = { type: 1 }) => {
    		if (changed.type) {
    			 $$invalidate("inputType", inputType = type === "check" ? "checkbox" : "radio");
    		}
    	};

    	return {
    		value,
    		checked,
    		disabled,
    		type,
    		name,
    		inputType,
    		$$slots,
    		$$scope
    	};
    }

    class CheckBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			value: 0,
    			checked: 0,
    			disabled: 0,
    			type: 0,
    			name: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CheckBox",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get value() {
    		throw new Error("<CheckBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<CheckBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get checked() {
    		throw new Error("<CheckBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set checked(value) {
    		throw new Error("<CheckBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<CheckBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<CheckBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<CheckBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<CheckBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<CheckBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<CheckBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\component\Code.svelte generated by Svelte v3.15.0 */

    const file$8 = "src\\component\\Code.svelte";

    function create_fragment$8(ctx) {
    	let code;
    	let current;
    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			code = element("code");
    			if (default_slot) default_slot.c();
    			attr_dev(code, "class", "svCode");
    			add_location(code, file$8, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, code, anchor);

    			if (default_slot) {
    				default_slot.m(code, null);
    			}

    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(code);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return { $$slots, $$scope };
    }

    class Code extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Code",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\component\Description.svelte generated by Svelte v3.15.0 */

    const file$9 = "src\\component\\Description.svelte";

    function create_fragment$9(ctx) {
    	let dl;
    	let dt;
    	let t;
    	let dd;
    	let current;
    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			dl = element("dl");
    			dt = element("dt");
    			t = text(ctx.title);
    			dd = element("dd");
    			if (default_slot) default_slot.c();
    			attr_dev(dt, "class", "svDescription__title");
    			add_location(dt, file$9, 0, 26, 26);
    			attr_dev(dd, "class", "svDescription__text");
    			add_location(dd, file$9, 0, 71, 71);
    			attr_dev(dl, "class", "svDescription");
    			add_location(dl, file$9, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, dl, anchor);
    			append_dev(dl, dt);
    			append_dev(dt, t);
    			append_dev(dl, dd);

    			if (default_slot) {
    				default_slot.m(dd, null);
    			}

    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (!current || changed.title) set_data_dev(t, ctx.title);

    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(dl);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { title = "N/A" } = $$props;
    	const writable_props = ["title"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Description> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("title" in $$props) $$invalidate("title", title = $$props.title);
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { title };
    	};

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate("title", title = $$props.title);
    	};

    	return { title, $$slots, $$scope };
    }

    class Description extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { title: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Description",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get title() {
    		throw new Error("<Description>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Description>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\component\Dialog.svelte generated by Svelte v3.15.0 */

    const file$a = "src\\component\\Dialog.svelte";

    function create_fragment$a(ctx) {
    	let div4;
    	let div3;
    	let div1;
    	let div0;
    	let t0;
    	let span;
    	let div2;
    	let t1;
    	let div4_class_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(ctx.title);
    			span = element("span");
    			div2 = element("div");
    			t1 = text(ctx.text);
    			attr_dev(div0, "class", "svDialog__window_title_text");
    			add_location(div0, file$a, 0, 141, 141);
    			attr_dev(span, "class", "svDialog__window_title_icon icon-cancel");
    			add_location(span, file$a, 0, 195, 195);
    			attr_dev(div1, "class", "svDialog__window_title");
    			add_location(div1, file$a, 0, 105, 105);
    			attr_dev(div2, "class", "svDialog__window_content");
    			add_location(div2, file$a, 0, 281, 281);
    			attr_dev(div3, "class", "svDialog__window");
    			add_location(div3, file$a, 0, 75, 75);
    			attr_dev(div4, "class", div4_class_value = "svDialog " + ctx.styleType);
    			attr_dev(div4, "id", ctx.id);
    			toggle_class(div4, "svDialog--visible", ctx.isShown);
    			add_location(div4, file$a, 0, 0, 0);
    			dispose = listen_dev(span, "click", ctx.close, false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div1, span);
    			append_dev(div3, div2);
    			append_dev(div2, t1);
    		},
    		p: function update(changed, ctx) {
    			if (changed.title) set_data_dev(t0, ctx.title);
    			if (changed.text) set_data_dev(t1, ctx.text);

    			if (changed.styleType && div4_class_value !== (div4_class_value = "svDialog " + ctx.styleType)) {
    				attr_dev(div4, "class", div4_class_value);
    			}

    			if (changed.id) {
    				attr_dev(div4, "id", ctx.id);
    			}

    			if (changed.styleType || changed.isShown) {
    				toggle_class(div4, "svDialog--visible", ctx.isShown);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { id = undefined } = $$props;
    	let { type = undefined } = $$props;
    	let isShown = false;
    	let title = "N/A";
    	let text = "N/A";

    	function close(e) {
    		$$invalidate("isShown", isShown = false);
    	}

    	window.eventBus.bind("sv-dialog", e => {
    		$$invalidate("isShown", isShown = id === e.detail.id);
    	});

    	window.eventBus.bind("sv-dialog", e => {
    		$$invalidate("title", title = e.detail.title || "N/A");
    		$$invalidate("text", text = e.detail.text || "N/A");
    		$$invalidate("type", type = e.detail.type || undefined);
    		$$invalidate("isShown", isShown = true);
    	});

    	window.dialog = window.dialog || ({});

    	window.dialog.show = e => {
    		if (e.target) {
    			window.eventBus.dispatch("sv-dialog", {
    				title: e.target.dataset.title,
    				text: e.target.dataset.text,
    				type: e.target.dataset.type
    			});
    		}
    	};

    	const writable_props = ["id", "type"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Dialog> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("id" in $$props) $$invalidate("id", id = $$props.id);
    		if ("type" in $$props) $$invalidate("type", type = $$props.type);
    	};

    	$$self.$capture_state = () => {
    		return {
    			id,
    			type,
    			isShown,
    			title,
    			text,
    			styleType
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate("id", id = $$props.id);
    		if ("type" in $$props) $$invalidate("type", type = $$props.type);
    		if ("isShown" in $$props) $$invalidate("isShown", isShown = $$props.isShown);
    		if ("title" in $$props) $$invalidate("title", title = $$props.title);
    		if ("text" in $$props) $$invalidate("text", text = $$props.text);
    		if ("styleType" in $$props) $$invalidate("styleType", styleType = $$props.styleType);
    	};

    	let styleType;

    	$$self.$$.update = (changed = { type: 1 }) => {
    		if (changed.type) {
    			 $$invalidate("styleType", styleType = type ? "svDialog--" + type : "");
    		}
    	};

    	return {
    		id,
    		type,
    		isShown,
    		title,
    		text,
    		close,
    		styleType
    	};
    }

    class Dialog extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { id: 0, type: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dialog",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get id() {
    		throw new Error("<Dialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Dialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Dialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Dialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\component\Field.svelte generated by Svelte v3.15.0 */

    const file$b = "src\\component\\Field.svelte";

    function create_fragment$b(ctx) {
    	let span;
    	let input;
    	let label;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			input = element("input");
    			label = element("label");
    			t = text(ctx.placeholder);
    			attr_dev(input, "class", "svField__input");
    			attr_dev(input, "placeholder", " ");
    			input.value = ctx.value;
    			input.disabled = ctx.disabled;
    			attr_dev(input, "type", ctx.type);
    			add_location(input, file$b, 9, 22, 612);
    			attr_dev(label, "class", "svField__label");
    			add_location(label, file$b, 9, 94, 684);
    			attr_dev(span, "class", "svField");
    			add_location(span, file$b, 9, 0, 590);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, input);
    			append_dev(span, label);
    			append_dev(label, t);
    		},
    		p: function update(changed, ctx) {
    			if (changed.value) {
    				prop_dev(input, "value", ctx.value);
    			}

    			if (changed.disabled) {
    				prop_dev(input, "disabled", ctx.disabled);
    			}

    			if (changed.type) {
    				attr_dev(input, "type", ctx.type);
    			}

    			if (changed.placeholder) set_data_dev(t, ctx.placeholder);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { placeholder = " " } = $$props;
    	let { value = "" } = $$props;
    	let { disabled = false } = $$props;
    	let { type = "text" } = $$props;
    	const writable_props = ["placeholder", "value", "disabled", "type"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Field> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("placeholder" in $$props) $$invalidate("placeholder", placeholder = $$props.placeholder);
    		if ("value" in $$props) $$invalidate("value", value = $$props.value);
    		if ("disabled" in $$props) $$invalidate("disabled", disabled = $$props.disabled);
    		if ("type" in $$props) $$invalidate("type", type = $$props.type);
    	};

    	$$self.$capture_state = () => {
    		return { placeholder, value, disabled, type };
    	};

    	$$self.$inject_state = $$props => {
    		if ("placeholder" in $$props) $$invalidate("placeholder", placeholder = $$props.placeholder);
    		if ("value" in $$props) $$invalidate("value", value = $$props.value);
    		if ("disabled" in $$props) $$invalidate("disabled", disabled = $$props.disabled);
    		if ("type" in $$props) $$invalidate("type", type = $$props.type);
    	};

    	return { placeholder, value, disabled, type };
    }

    class Field extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			placeholder: 0,
    			value: 0,
    			disabled: 0,
    			type: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Field",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get placeholder() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\component\Grid.svelte generated by Svelte v3.15.0 */

    const file$c = "src\\component\\Grid.svelte";

    function create_fragment$c(ctx) {
    	let div;
    	let current;
    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svGrid svelte-ne1xk7");
    			add_location(div, file$c, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return { $$slots, $$scope };
    }

    class Grid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Grid",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src\component\Header.svelte generated by Svelte v3.15.0 */

    const file$d = "src\\component\\Header.svelte";

    function create_fragment$d(ctx) {
    	let div;
    	let current;
    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svHeader");
    			add_location(div, file$d, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return { $$slots, $$scope };
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src\component\Hint.svelte generated by Svelte v3.15.0 */

    const file$e = "src\\component\\Hint.svelte";

    function create_fragment$e(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text("?");
    			attr_dev(span, "class", "svHint");
    			attr_dev(span, "alt", ctx.info);
    			attr_dev(span, "title", ctx.info);
    			add_location(span, file$e, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(changed, ctx) {
    			if (changed.info) {
    				attr_dev(span, "alt", ctx.info);
    			}

    			if (changed.info) {
    				attr_dev(span, "title", ctx.info);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { info = "N/A" } = $$props;
    	const writable_props = ["info"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Hint> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("info" in $$props) $$invalidate("info", info = $$props.info);
    	};

    	$$self.$capture_state = () => {
    		return { info };
    	};

    	$$self.$inject_state = $$props => {
    		if ("info" in $$props) $$invalidate("info", info = $$props.info);
    	};

    	return { info };
    }

    class Hint extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { info: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Hint",
    			options,
    			id: create_fragment$e.name
    		});
    	}

    	get info() {
    		throw new Error("<Hint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<Hint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\component\Icon.svelte generated by Svelte v3.15.0 */

    const file$f = "src\\component\\Icon.svelte";

    function create_fragment$f(ctx) {
    	let a;
    	let a_class_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			attr_dev(a, "class", a_class_value = "svIcon icon-" + ctx.icon);
    			attr_dev(a, "title", ctx.title);
    			attr_dev(a, "alt", ctx.title);
    			attr_dev(a, "href", ctx.url);
    			add_location(a, file$f, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    		},
    		p: function update(changed, ctx) {
    			if (changed.icon && a_class_value !== (a_class_value = "svIcon icon-" + ctx.icon)) {
    				attr_dev(a, "class", a_class_value);
    			}

    			if (changed.title) {
    				attr_dev(a, "title", ctx.title);
    			}

    			if (changed.title) {
    				attr_dev(a, "alt", ctx.title);
    			}

    			if (changed.url) {
    				attr_dev(a, "href", ctx.url);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { title = "" } = $$props;
    	let { url = "" } = $$props;
    	let { icon = "" } = $$props;
    	const writable_props = ["title", "url", "icon"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Icon> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("title" in $$props) $$invalidate("title", title = $$props.title);
    		if ("url" in $$props) $$invalidate("url", url = $$props.url);
    		if ("icon" in $$props) $$invalidate("icon", icon = $$props.icon);
    	};

    	$$self.$capture_state = () => {
    		return { title, url, icon };
    	};

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate("title", title = $$props.title);
    		if ("url" in $$props) $$invalidate("url", url = $$props.url);
    		if ("icon" in $$props) $$invalidate("icon", icon = $$props.icon);
    	};

    	return { title, url, icon };
    }

    class Icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { title: 0, url: 0, icon: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Icon",
    			options,
    			id: create_fragment$f.name
    		});
    	}

    	get title() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get url() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\component\IconBar.svelte generated by Svelte v3.15.0 */

    const file$g = "src\\component\\IconBar.svelte";

    function create_fragment$g(ctx) {
    	let div;
    	let current;
    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svIconBar");
    			add_location(div, file$g, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return { $$slots, $$scope };
    }

    class IconBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IconBar",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* src\component\Image.svelte generated by Svelte v3.15.0 */

    const { console: console_1$1 } = globals;
    const file$h = "src\\component\\Image.svelte";

    function create_fragment$h(ctx) {
    	let div1;
    	let div0;
    	let current;
    	let dispose;
    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "svImage__view svelte-yl40od");
    			set_style(div0, "background-image", "url(" + ctx.url + ")");
    			add_location(div0, file$h, 9, 21, 559);
    			attr_dev(div1, "class", "svImage");
    			add_location(div1, file$h, 9, 0, 538);
    			dispose = listen_dev(window, "resize", ctx.updateFocal, false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			ctx.div0_binding(div0);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
    			}

    			if (!current || changed.url) {
    				set_style(div0, "background-image", "url(" + ctx.url + ")");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    			ctx.div0_binding(null);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    let urlRegex = /url\(['"]*(.*?)['"]*\)/g;

    function instance$h($$self, $$props, $$invalidate) {
    	let { focal } = $$props;
    	let { url = "" } = $$props;
    	let { foo = undefined } = $$props;
    	let imageSize;
    	let viewport;

    	function getImageSize() {
    		return new Promise((resolve, reject) => {
    				if (imageSize) {
    					resolve(imageSize);
    				} else {
    					let img = new Image();

    					img.onload = function () {
    						resolve(imageSize = { width: this.width, height: this.height });
    					};

    					img.src = viewport.style.backgroundImage.replace(urlRegex, "$1");
    				}
    			});
    	}

    	function updateFocal() {
    		getImageSize().then(imageSize => {
    			let viewportBounds = viewport.getBoundingClientRect();

    			if (viewportBounds && focal) {
    				let scale = Math.max(viewportBounds.width / imageSize.width, viewportBounds.height / imageSize.height);
    				let scaledWidth = parseInt(imageSize.width * scale);
    				let scaledHeight = parseInt(imageSize.height * scale);
    				let newPos = [];
    				let centerXOffset = (viewportBounds.width - scaledWidth) / 2;
    				let centerYOffset = (viewportBounds.height - scaledHeight) / 2;

    				if (focal.x !== undefined) {
    					let offsetX = -(focal.x * scale);
    					console.log("X>" + scaledWidth + "|" + offsetX + "|" + (scaledWidth + offsetX) + "|" + viewportBounds.width);

    					if (scaledWidth == viewportBounds.width || scaledWidth + offsetX < viewportBounds.width) {
    						offsetX = centerXOffset;
    					}

    					newPos.push(offsetX + "px");
    				} else {
    					newPos.push(centerXOffset + "px");
    				}

    				if (focal.y !== undefined) {
    					let offsetY = -(focal.y * scale);
    					console.log("Y>" + scaledHeight + "|" + offsetY + "|" + (scaledHeight + offsetY) + "|" + viewportBounds.height);

    					if (scaledHeight == viewportBounds.height || scaledHeight + offsetY < viewportBounds.height) {
    						offsetY = centerYOffset;
    					}

    					newPos.push(offsetY + "px");
    				} else {
    					newPos.push(centerYOffset + "px");
    				}

    				$$invalidate("viewport", viewport.style.backgroundPosition = newPos.join(" "), viewport);
    			}
    		});
    	}

    	x.event.isReady(updateFocal);
    	const writable_props = ["focal", "url", "foo"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Image> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate("viewport", viewport = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("focal" in $$props) $$invalidate("focal", focal = $$props.focal);
    		if ("url" in $$props) $$invalidate("url", url = $$props.url);
    		if ("foo" in $$props) $$invalidate("foo", foo = $$props.foo);
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			focal,
    			url,
    			foo,
    			imageSize,
    			urlRegex,
    			viewport
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("focal" in $$props) $$invalidate("focal", focal = $$props.focal);
    		if ("url" in $$props) $$invalidate("url", url = $$props.url);
    		if ("foo" in $$props) $$invalidate("foo", foo = $$props.foo);
    		if ("imageSize" in $$props) imageSize = $$props.imageSize;
    		if ("urlRegex" in $$props) urlRegex = $$props.urlRegex;
    		if ("viewport" in $$props) $$invalidate("viewport", viewport = $$props.viewport);
    	};

    	return {
    		focal,
    		url,
    		foo,
    		viewport,
    		updateFocal,
    		div0_binding,
    		$$slots,
    		$$scope
    	};
    }

    class Image_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, { focal: 0, url: 0, foo: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Image_1",
    			options,
    			id: create_fragment$h.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (ctx.focal === undefined && !("focal" in props)) {
    			console_1$1.warn("<Image> was created without expected prop 'focal'");
    		}
    	}

    	get focal() {
    		throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set focal(value) {
    		throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get url() {
    		throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get foo() {
    		throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set foo(value) {
    		throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\component\Label.svelte generated by Svelte v3.15.0 */

    const file$i = "src\\component\\Label.svelte";

    function create_fragment$i(ctx) {
    	let div;
    	let current;
    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svLabel");
    			add_location(div, file$i, 3, 0, 76);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return { $$slots, $$scope };
    }

    class Label extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Label",
    			options,
    			id: create_fragment$i.name
    		});
    	}
    }

    /* src\component\NavBar.svelte generated by Svelte v3.15.0 */

    const file$j = "src\\component\\NavBar.svelte";
    const get_icons_slot_changes = () => ({});
    const get_icons_slot_context = () => ({});
    const get_title_slot_changes = () => ({});
    const get_title_slot_context = () => ({});

    function create_fragment$j(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let div1;
    	let current;
    	const title_slot_template = ctx.$$slots.title;
    	const title_slot = create_slot(title_slot_template, ctx, get_title_slot_context);
    	const icons_slot_template = ctx.$$slots.icons;
    	const icons_slot = create_slot(icons_slot_template, ctx, get_icons_slot_context);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			if (title_slot) title_slot.c();
    			div1 = element("div");
    			if (icons_slot) icons_slot.c();
    			attr_dev(div0, "class", "svNavBar__title_text");
    			add_location(div0, file$j, 0, 51, 51);
    			attr_dev(div1, "class", "svNavBar__title_icons");
    			add_location(div1, file$j, 0, 117, 117);
    			attr_dev(div2, "class", "svNavBar__title");
    			add_location(div2, file$j, 0, 22, 22);
    			attr_dev(div3, "class", "svNavBar");
    			add_location(div3, file$j, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div0);

    			if (title_slot) {
    				title_slot.m(div0, null);
    			}

    			append_dev(div2, div1);

    			if (icons_slot) {
    				icons_slot.m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (title_slot && title_slot.p && changed.$$scope) {
    				title_slot.p(get_slot_changes(title_slot_template, ctx, changed, get_title_slot_changes), get_slot_context(title_slot_template, ctx, get_title_slot_context));
    			}

    			if (icons_slot && icons_slot.p && changed.$$scope) {
    				icons_slot.p(get_slot_changes(icons_slot_template, ctx, changed, get_icons_slot_changes), get_slot_context(icons_slot_template, ctx, get_icons_slot_context));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title_slot, local);
    			transition_in(icons_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title_slot, local);
    			transition_out(icons_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (title_slot) title_slot.d(detaching);
    			if (icons_slot) icons_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return { $$slots, $$scope };
    }

    class NavBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NavBar",
    			options,
    			id: create_fragment$j.name
    		});
    	}
    }

    /* src\component\Notification.svelte generated by Svelte v3.15.0 */

    const file$k = "src\\component\\Notification.svelte";

    function create_fragment$k(ctx) {
    	let div6;
    	let div0;
    	let div0_class_value;
    	let div5;
    	let div3;
    	let div1;
    	let t0;
    	let div2;
    	let i;
    	let div4;
    	let t1;
    	let div6_class_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div0 = element("div");
    			div5 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			t0 = text(ctx.title);
    			div2 = element("div");
    			i = element("i");
    			div4 = element("div");
    			t1 = text(ctx.text);
    			attr_dev(div0, "class", div0_class_value = "svNotification__icon " + ctx.iconStyle);
    			add_location(div0, file$k, 0, 119, 119);
    			attr_dev(div1, "class", "svNotification__content_title_text");
    			add_location(div1, file$k, 0, 251, 251);
    			attr_dev(i, "class", "icon-cancel");
    			add_location(i, file$k, 0, 454, 454);
    			attr_dev(div2, "class", "svNotification__content_title_close");
    			toggle_class(div2, "svNotification__content_title_close--visible", ctx.close === "click");
    			add_location(div2, file$k, 0, 312, 312);
    			attr_dev(div3, "class", "svNotification__content_title");
    			add_location(div3, file$k, 0, 208, 208);
    			attr_dev(div4, "class", "svNotification__content_text");
    			add_location(div4, file$k, 0, 493, 493);
    			attr_dev(div5, "class", "svNotification__content");
    			add_location(div5, file$k, 0, 171, 171);
    			attr_dev(div6, "class", div6_class_value = "svNotification " + ctx.styleType + " " + ctx.notificationType);
    			toggle_class(div6, "svNotification--visible", ctx.isShown);
    			add_location(div6, file$k, 0, 0, 0);
    			dispose = listen_dev(div2, "click", ctx.hide, false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div0);
    			append_dev(div6, div5);
    			append_dev(div5, div3);
    			append_dev(div3, div1);
    			append_dev(div1, t0);
    			append_dev(div3, div2);
    			append_dev(div2, i);
    			append_dev(div5, div4);
    			append_dev(div4, t1);
    			ctx.div6_binding(div6);
    		},
    		p: function update(changed, ctx) {
    			if (changed.iconStyle && div0_class_value !== (div0_class_value = "svNotification__icon " + ctx.iconStyle)) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (changed.title) set_data_dev(t0, ctx.title);

    			if (changed.close) {
    				toggle_class(div2, "svNotification__content_title_close--visible", ctx.close === "click");
    			}

    			if (changed.text) set_data_dev(t1, ctx.text);

    			if ((changed.styleType || changed.notificationType) && div6_class_value !== (div6_class_value = "svNotification " + ctx.styleType + " " + ctx.notificationType)) {
    				attr_dev(div6, "class", div6_class_value);
    			}

    			if (changed.styleType || changed.notificationType || changed.isShown) {
    				toggle_class(div6, "svNotification--visible", ctx.isShown);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			ctx.div6_binding(null);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    let icon = "cancel";

    function instance$k($$self, $$props, $$invalidate) {
    	let { type = undefined } = $$props;
    	let { close = undefined } = $$props;
    	let { floatable = undefined } = $$props;
    	let elm;
    	let title = "N/A";
    	let text = "N/A";
    	let isShown = false;

    	let iconMap = {
    		"error": "cancel",
    		"success": "check",
    		"info": "info",
    		"confirm": "help"
    	};

    	let timer;

    	window.eventBus.bind("sv-notification", e => {
    		if (isFloatable == e.detail.floatable) {
    			$$invalidate("title", title = e.detail.title || "N/A");
    			$$invalidate("text", text = e.detail.text || "N/A");
    			$$invalidate("type", type = e.detail.type || undefined);
    			$$invalidate("isShown", isShown = true);

    			if (close !== "click") {
    				let time = (/([\d\.]+)(s|ms)/).exec(close);

    				if (time && time[1] && time[2]) {
    					if (timer) {
    						clearTimeout(timer);
    					}

    					timer = setTimeout(() => $$invalidate("isShown", isShown = false), Math.ceil(parseFloat(time[1]) * (time[2] === "s" ? 1000 : 1)));
    				}
    			}
    		}
    	});

    	window.notification = window.notification || ({});

    	window.notification.show = e => {
    		if (e.target) {
    			window.eventBus.dispatch("sv-notification", {
    				title: e.target.dataset.title,
    				text: e.target.dataset.text,
    				type: e.target.dataset.type,
    				floatable: e.target.dataset.floatable !== undefined
    			});
    		}
    	};

    	function hide() {
    		$$invalidate("isShown", isShown = false);
    	}

    	const writable_props = ["type", "close", "floatable"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Notification> was created with unknown prop '${key}'`);
    	});

    	function div6_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate("elm", elm = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("type" in $$props) $$invalidate("type", type = $$props.type);
    		if ("close" in $$props) $$invalidate("close", close = $$props.close);
    		if ("floatable" in $$props) $$invalidate("floatable", floatable = $$props.floatable);
    	};

    	$$self.$capture_state = () => {
    		return {
    			type,
    			close,
    			floatable,
    			elm,
    			title,
    			text,
    			icon,
    			isShown,
    			iconMap,
    			timer,
    			iconStyle,
    			styleType,
    			notificationType,
    			isFloatable
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("type" in $$props) $$invalidate("type", type = $$props.type);
    		if ("close" in $$props) $$invalidate("close", close = $$props.close);
    		if ("floatable" in $$props) $$invalidate("floatable", floatable = $$props.floatable);
    		if ("elm" in $$props) $$invalidate("elm", elm = $$props.elm);
    		if ("title" in $$props) $$invalidate("title", title = $$props.title);
    		if ("text" in $$props) $$invalidate("text", text = $$props.text);
    		if ("icon" in $$props) icon = $$props.icon;
    		if ("isShown" in $$props) $$invalidate("isShown", isShown = $$props.isShown);
    		if ("iconMap" in $$props) $$invalidate("iconMap", iconMap = $$props.iconMap);
    		if ("timer" in $$props) timer = $$props.timer;
    		if ("iconStyle" in $$props) $$invalidate("iconStyle", iconStyle = $$props.iconStyle);
    		if ("styleType" in $$props) $$invalidate("styleType", styleType = $$props.styleType);
    		if ("notificationType" in $$props) $$invalidate("notificationType", notificationType = $$props.notificationType);
    		if ("isFloatable" in $$props) isFloatable = $$props.isFloatable;
    	};

    	let iconStyle;
    	let styleType;
    	let notificationType;
    	let isFloatable;

    	$$self.$$.update = (changed = { type: 1, iconMap: 1, floatable: 1 }) => {
    		if (changed.type || changed.iconMap) {
    			 $$invalidate("iconStyle", iconStyle = type && iconMap[type]
    			? "icon-" + iconMap[type]
    			: undefined);
    		}

    		if (changed.type) {
    			 $$invalidate("styleType", styleType = type ? "svNotification--" + type : undefined);
    		}

    		if (changed.floatable) {
    			 $$invalidate("notificationType", notificationType = floatable ? "svNotification--floatable" : undefined);
    		}

    		if (changed.floatable) {
    			 isFloatable = floatable === true;
    		}
    	};

    	return {
    		type,
    		close,
    		floatable,
    		elm,
    		title,
    		text,
    		isShown,
    		hide,
    		iconStyle,
    		styleType,
    		notificationType,
    		div6_binding
    	};
    }

    class Notification extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, { type: 0, close: 0, floatable: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Notification",
    			options,
    			id: create_fragment$k.name
    		});
    	}

    	get type() {
    		throw new Error("<Notification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Notification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get close() {
    		throw new Error("<Notification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set close(value) {
    		throw new Error("<Notification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get floatable() {
    		throw new Error("<Notification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set floatable(value) {
    		throw new Error("<Notification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\component\Overlay.svelte generated by Svelte v3.15.0 */

    const file$l = "src\\component\\Overlay.svelte";

    function create_fragment$l(ctx) {
    	let div1;
    	let div0;
    	let current;
    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "svOverlay__content");
    			add_location(div0, file$l, 3, 23, 127);
    			attr_dev(div1, "class", "svOverlay svelte-16y9og5");
    			add_location(div1, file$l, 3, 0, 104);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return { $$slots, $$scope };
    }

    class Overlay extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Overlay",
    			options,
    			id: create_fragment$l.name
    		});
    	}
    }

    /* src\component\Page.svelte generated by Svelte v3.15.0 */

    const file$m = "src\\component\\Page.svelte";

    function create_fragment$m(ctx) {
    	let div;
    	let current;
    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svPage");
    			add_location(div, file$m, 3, 0, 95);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return { $$slots, $$scope };
    }

    class Page extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Page",
    			options,
    			id: create_fragment$m.name
    		});
    	}
    }

    /* src\component\PageBlock.svelte generated by Svelte v3.15.0 */

    const file$n = "src\\component\\PageBlock.svelte";

    function create_fragment$n(ctx) {
    	let div;
    	let div_class_value;
    	let current;
    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", div_class_value = "svPageBlock " + ctx.isHatched);
    			attr_dev(div, "style", ctx.bgStyle);
    			add_location(div, file$n, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
    			}

    			if (!current || changed.isHatched && div_class_value !== (div_class_value = "svPageBlock " + ctx.isHatched)) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (!current || changed.bgStyle) {
    				attr_dev(div, "style", ctx.bgStyle);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$n($$self, $$props, $$invalidate) {
    	let { color = undefined } = $$props;
    	let { hatched = undefined } = $$props;
    	const writable_props = ["color", "hatched"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PageBlock> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("color" in $$props) $$invalidate("color", color = $$props.color);
    		if ("hatched" in $$props) $$invalidate("hatched", hatched = $$props.hatched);
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { color, hatched, bgStyle, isHatched };
    	};

    	$$self.$inject_state = $$props => {
    		if ("color" in $$props) $$invalidate("color", color = $$props.color);
    		if ("hatched" in $$props) $$invalidate("hatched", hatched = $$props.hatched);
    		if ("bgStyle" in $$props) $$invalidate("bgStyle", bgStyle = $$props.bgStyle);
    		if ("isHatched" in $$props) $$invalidate("isHatched", isHatched = $$props.isHatched);
    	};

    	let bgStyle;
    	let isHatched;

    	$$self.$$.update = (changed = { color: 1, hatched: 1 }) => {
    		if (changed.color) {
    			 $$invalidate("bgStyle", bgStyle = color ? "background-color:" + color + ";" : undefined);
    		}

    		if (changed.hatched) {
    			 $$invalidate("isHatched", isHatched = hatched ? "svPageBlock--hatched" : undefined);
    		}
    	};

    	return {
    		color,
    		hatched,
    		bgStyle,
    		isHatched,
    		$$slots,
    		$$scope
    	};
    }

    class PageBlock extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, { color: 0, hatched: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PageBlock",
    			options,
    			id: create_fragment$n.name
    		});
    	}

    	get color() {
    		throw new Error("<PageBlock>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<PageBlock>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hatched() {
    		throw new Error("<PageBlock>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hatched(value) {
    		throw new Error("<PageBlock>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\component\Section.svelte generated by Svelte v3.15.0 */

    const file$o = "src\\component\\Section.svelte";

    function create_fragment$o(ctx) {
    	let div;
    	let current;
    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svSection");
    			add_location(div, file$o, 3, 0, 40);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$o($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return { $$slots, $$scope };
    }

    class Section extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$o, create_fragment$o, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Section",
    			options,
    			id: create_fragment$o.name
    		});
    	}
    }

    /* src\component\SideBar.svelte generated by Svelte v3.15.0 */

    const file$p = "src\\component\\SideBar.svelte";

    function create_fragment$p(ctx) {
    	let div;
    	let current;
    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svSideBar");
    			add_location(div, file$p, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$p.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$p($$self, $$props, $$invalidate) {
    	window.eventBus.bind("sv-sidebar", e => document.body.classList.toggle("--showSideBar"));
    	window.sidebar = window.sidebar || ({});

    	window.sidebar.show = e => {
    		if (e.target) {
    			window.eventBus.dispatch("sv-sidebar");
    		}
    	};

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return { $$slots, $$scope };
    }

    class SideBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$p, create_fragment$p, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SideBar",
    			options,
    			id: create_fragment$p.name
    		});
    	}
    }

    /* src\component\TextBlock.svelte generated by Svelte v3.15.0 */

    const file$q = "src\\component\\TextBlock.svelte";

    function create_fragment$q(ctx) {
    	let p;
    	let current;
    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			p = element("p");
    			if (default_slot) default_slot.c();
    			attr_dev(p, "class", "svTextBlock");
    			attr_dev(p, "data-title", ctx.title);
    			toggle_class(p, "svTextBlock--withTitle", ctx.title);
    			add_location(p, file$q, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);

    			if (default_slot) {
    				default_slot.m(p, null);
    			}

    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
    			}

    			if (!current || changed.title) {
    				attr_dev(p, "data-title", ctx.title);
    			}

    			if (changed.title) {
    				toggle_class(p, "svTextBlock--withTitle", ctx.title);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$q.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$q($$self, $$props, $$invalidate) {
    	let { title = undefined } = $$props;
    	const writable_props = ["title"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TextBlock> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("title" in $$props) $$invalidate("title", title = $$props.title);
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { title };
    	};

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate("title", title = $$props.title);
    	};

    	return { title, $$slots, $$scope };
    }

    class TextBlock extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$q, create_fragment$q, safe_not_equal, { title: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextBlock",
    			options,
    			id: create_fragment$q.name
    		});
    	}

    	get title() {
    		throw new Error("<TextBlock>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<TextBlock>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\component\Tile.svelte generated by Svelte v3.15.0 */

    const file$r = "src\\component\\Tile.svelte";

    function create_fragment$r(ctx) {
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let div3_class_value;
    	let current;
    	let dispose;
    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "svTile__wrapper_content_view");
    			add_location(div0, file$r, 5, 207, 522);
    			attr_dev(div1, "class", "svTile__wrapper_content svelte-8ticf8");
    			attr_dev(div1, "style", ctx.tilePadding);
    			add_location(div1, file$r, 5, 148, 463);
    			attr_dev(div2, "class", "svTile__wrapper");
    			add_location(div2, file$r, 5, 119, 434);
    			attr_dev(div3, "class", div3_class_value = "svTile " + ctx.clipped + " svelte-8ticf8");
    			attr_dev(div3, "data-tilesize", ctx.tileSize);
    			toggle_class(div3, "hovered", ctx.hovered);
    			add_location(div3, file$r, 5, 0, 315);

    			dispose = [
    				listen_dev(div3, "mouseenter", ctx.enter, false, false, false),
    				listen_dev(div3, "mouseleave", ctx.leave, false, false, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
    			}

    			if (!current || changed.tilePadding) {
    				attr_dev(div1, "style", ctx.tilePadding);
    			}

    			if (!current || changed.clipped && div3_class_value !== (div3_class_value = "svTile " + ctx.clipped + " svelte-8ticf8")) {
    				attr_dev(div3, "class", div3_class_value);
    			}

    			if (!current || changed.tileSize) {
    				attr_dev(div3, "data-tilesize", ctx.tileSize);
    			}

    			if (changed.clipped || changed.hovered) {
    				toggle_class(div3, "hovered", ctx.hovered);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (default_slot) default_slot.d(detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$r.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$r($$self, $$props, $$invalidate) {
    	let { clip = true } = $$props;
    	let { gap = "0" } = $$props;
    	let { height = 1 } = $$props;
    	let { width = 1 } = $$props;
    	let hovered = false;

    	function enter(e) {
    		$$invalidate("hovered", hovered = true);
    	}

    	function leave(e) {
    		$$invalidate("hovered", hovered = false);
    	}

    	const writable_props = ["clip", "gap", "height", "width"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tile> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("clip" in $$props) $$invalidate("clip", clip = $$props.clip);
    		if ("gap" in $$props) $$invalidate("gap", gap = $$props.gap);
    		if ("height" in $$props) $$invalidate("height", height = $$props.height);
    		if ("width" in $$props) $$invalidate("width", width = $$props.width);
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			clip,
    			gap,
    			height,
    			width,
    			hovered,
    			tileSize,
    			tilePadding,
    			clipped
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("clip" in $$props) $$invalidate("clip", clip = $$props.clip);
    		if ("gap" in $$props) $$invalidate("gap", gap = $$props.gap);
    		if ("height" in $$props) $$invalidate("height", height = $$props.height);
    		if ("width" in $$props) $$invalidate("width", width = $$props.width);
    		if ("hovered" in $$props) $$invalidate("hovered", hovered = $$props.hovered);
    		if ("tileSize" in $$props) $$invalidate("tileSize", tileSize = $$props.tileSize);
    		if ("tilePadding" in $$props) $$invalidate("tilePadding", tilePadding = $$props.tilePadding);
    		if ("clipped" in $$props) $$invalidate("clipped", clipped = $$props.clipped);
    	};

    	let tileSize;
    	let tilePadding;
    	let clipped;

    	$$self.$$.update = (changed = { width: 1, height: 1, gap: 1, clip: 1 }) => {
    		if (changed.width || changed.height) {
    			 $$invalidate("tileSize", tileSize = width + ":" + height);
    		}

    		if (changed.gap) {
    			 $$invalidate("tilePadding", tilePadding = "padding:" + gap + ";");
    		}

    		if (changed.clip) {
    			 $$invalidate("clipped", clipped = clip ? "" : "svTile--unclipped");
    		}
    	};

    	return {
    		clip,
    		gap,
    		height,
    		width,
    		hovered,
    		enter,
    		leave,
    		tileSize,
    		tilePadding,
    		clipped,
    		$$slots,
    		$$scope
    	};
    }

    class Tile extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$r, create_fragment$r, safe_not_equal, { clip: 0, gap: 0, height: 0, width: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tile",
    			options,
    			id: create_fragment$r.name
    		});
    	}

    	get clip() {
    		throw new Error("<Tile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set clip(value) {
    		throw new Error("<Tile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get gap() {
    		throw new Error("<Tile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gap(value) {
    		throw new Error("<Tile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Tile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Tile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Tile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Tile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\component\Title.svelte generated by Svelte v3.15.0 */

    const file$s = "src\\component\\Title.svelte";

    function create_fragment$s(ctx) {
    	let div;
    	let div_class_value;
    	let current;
    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", div_class_value = "svTitle " + ctx.sizeCls);
    			add_location(div, file$s, 3, 0, 40);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
    			}

    			if (!current || changed.sizeCls && div_class_value !== (div_class_value = "svTitle " + ctx.sizeCls)) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$s.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$s($$self, $$props, $$invalidate) {
    	let { size = 1 } = $$props;
    	const writable_props = ["size"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Title> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate("size", size = $$props.size);
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { size, sizeCls };
    	};

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate("size", size = $$props.size);
    		if ("sizeCls" in $$props) $$invalidate("sizeCls", sizeCls = $$props.sizeCls);
    	};

    	let sizeCls;

    	$$self.$$.update = (changed = { size: 1 }) => {
    		if (changed.size) {
    			 $$invalidate("sizeCls", sizeCls = "svTitle--size" + size);
    		}
    	};

    	return { size, sizeCls, $$slots, $$scope };
    }

    class Title extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$s, create_fragment$s, safe_not_equal, { size: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Title",
    			options,
    			id: create_fragment$s.name
    		});
    	}

    	get size() {
    		throw new Error("<Title>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Title>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\component\TOC.svelte generated by Svelte v3.15.0 */

    const { window: window_1 } = globals;
    const file$t = "src\\component\\TOC.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.title = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    // (1:23) {#each titles as title, i}
    function create_each_block(ctx) {
    	let li;
    	let t_value = ctx.title.name + "";
    	let t;
    	let li_class_value;
    	let li_index_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t = text(t_value);
    			attr_dev(li, "class", li_class_value = "svToc__entry " + ctx.title.level);
    			attr_dev(li, "index", li_index_value = ctx.i);
    			add_location(li, file$t, 0, 49, 49);
    			dispose = listen_dev(li, "click", ctx.jumpTo, false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t);
    		},
    		p: function update(changed, ctx) {
    			if (changed.titles && t_value !== (t_value = ctx.title.name + "")) set_data_dev(t, t_value);

    			if (changed.titles && li_class_value !== (li_class_value = "svToc__entry " + ctx.title.level)) {
    				attr_dev(li, "class", li_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(1:23) {#each titles as title, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$t(ctx) {
    	let div1;
    	let ul;
    	let div0;
    	let dispose;
    	let each_value = ctx.titles;
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			div0 = element("div");
    			add_location(ul, file$t, 0, 19, 19);
    			attr_dev(div0, "class", "svToc__marker");
    			add_location(div0, file$t, 0, 149, 149);
    			attr_dev(div1, "class", "svToc");
    			add_location(div1, file$t, 0, 0, 0);
    			dispose = listen_dev(window_1, "scroll", ctx.updateMarker, false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(div1, div0);
    		},
    		p: function update(changed, ctx) {
    			if (changed.titles || changed.jumpTo) {
    				each_value = ctx.titles;
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$t.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$t($$self, $$props, $$invalidate) {
    	let titles = [];
    	let area;
    	let titleInFocus;

    	function jumpTo(e) {
    		let index = parseInt(e.target.getAttribute("index"));
    		let bounds = titles[index].elm.getBoundingClientRect();
    		window.scrollTo(0, bounds.top + 30);
    	}

    	function updateMarker() {
    		let viewHeightHalf = window.innerHeight / 2;
    		let entries = Array.from(document.querySelectorAll(".svToc__entry"));
    		let container = document.querySelector(".svToc");
    		let marker = document.querySelector(".svToc__marker");
    		let found;

    		titles.forEach(title => {
    			let bounds = title.elm.getBoundingClientRect();

    			if (bounds.top >= 0 && bounds.top < viewHeightHalf) {
    				found = title;
    			}
    		});

    		if (found && found !== titleInFocus) {
    			titleInFocus = found;

    			if (titleInFocus) {
    				let containerBounds = container.getBoundingClientRect();
    				let entryBounds = entries[titleInFocus.index].getBoundingClientRect();
    				marker.style.top = entryBounds.top - containerBounds.top + "px";
    				marker.style.height = entryBounds.height + "px";
    				let markerBounds = marker.getBoundingClientRect();
    				container.scrollTo(0, markerBounds.top);
    			}
    		}
    	}

    	document.addEventListener("DOMContentLoaded", () => {
    		let index = 0;

    		Array.from(document.querySelectorAll(".svPage .svTitle")).forEach(title => {
    			let regex = /svTitle--size(\d+)/;
    			let match = regex.exec(title.getAttribute("class"));

    			if (match && match[1]) {
    				$$invalidate("titles", titles = [
    					...titles,
    					{
    						elm: title,
    						level: "svToc__entry--" + parseInt(match[1]),
    						name: title.innerText,
    						index
    					}
    				]);

    				index++;
    			}
    		});

    		area = document.createElement("div");
    		area.style.position = "sticky";
    		area.style.backgroundColor = "rgba(255,0,0,.1)";
    		area.style.zIndex = "10001";
    		area.style.top = "0";
    		area.style.left = "0";
    		area.style.width = "100%";
    		area.style.height = "50%";
    		document.body.appendChild(area);
    		updateMarker();
    	});

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("titles" in $$props) $$invalidate("titles", titles = $$props.titles);
    		if ("area" in $$props) area = $$props.area;
    		if ("titleInFocus" in $$props) titleInFocus = $$props.titleInFocus;
    	};

    	return { titles, jumpTo, updateMarker };
    }

    class TOC extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$t, create_fragment$t, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TOC",
    			options,
    			id: create_fragment$t.name
    		});
    	}
    }

    /* src\component\Wiper.svelte generated by Svelte v3.15.0 */

    const { window: window_1$1 } = globals;
    const file$u = "src\\component\\Wiper.svelte";

    function create_fragment$u(ctx) {
    	let div2;
    	let div0;
    	let div1;
    	let t0;
    	let t1;
    	let t2;
    	let current;
    	let dispose;
    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			div1 = element("div");
    			t0 = text(ctx.index);
    			t1 = text(" / ");
    			t2 = text(ctx.count);
    			attr_dev(div0, "class", "svWiper__content");
    			add_location(div0, file$u, 0, 64, 64);
    			attr_dev(div1, "class", "svWiper__info");
    			add_location(div1, file$u, 0, 135, 135);
    			attr_dev(div2, "class", "svWiper");
    			add_location(div2, file$u, 0, 0, 0);

    			dispose = [
    				listen_dev(window_1$1, "load", ctx.init, false, false, false),
    				listen_dev(div2, "scroll", ctx.updateView, false, false, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			ctx.div0_binding(div0);
    			append_dev(div2, div1);
    			append_dev(div1, t0);
    			append_dev(div1, t1);
    			append_dev(div1, t2);
    			ctx.div1_binding(div1);
    			ctx.div2_binding(div2);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
    			}

    			if (!current || changed.index) set_data_dev(t0, ctx.index);
    			if (!current || changed.count) set_data_dev(t2, ctx.count);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (default_slot) default_slot.d(detaching);
    			ctx.div0_binding(null);
    			ctx.div1_binding(null);
    			ctx.div2_binding(null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$u.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$u($$self, $$props, $$invalidate) {
    	let elm;
    	let content;
    	let info;
    	let timer;
    	let locked;
    	let index = 0;
    	let count = 0;

    	function init(e) {
    		$$invalidate("content", content.style.height = "calc(100% * " + content.childElementCount + ")", content);
    		updateInfo();
    		setInterval(correctPos, 100);
    		window.eventBus.dispatch("sv-swiper");
    	}

    	function updateInfo() {
    		let top = elm.scrollTop;
    		let height = elm.getBoundingClientRect().height;
    		let viewHeight = content.getBoundingClientRect().height;
    		$$invalidate("info", info.style.top = top + "px", info);
    		$$invalidate("index", index = Math.ceil((top - height / 2) / height) + 1);
    		$$invalidate("count", count = Math.ceil(viewHeight / height));
    	}

    	function updateView(e) {
    		updateInfo();
    		timer = locked ? timer : 5;
    		window.eventBus.dispatch("sv-swiper");
    	}

    	function correctPos() {
    		if (timer > 0) {
    			timer--;

    			if (timer === 0) {
    				locked = true;
    				let top = elm.scrollTop;
    				let height = elm.getBoundingClientRect().height;
    				let half = height / 2;
    				let mod = top % height;
    				let pos = top - mod;
    				let moveUp = mod > half;

    				let move = setInterval(
    					() => {
    						let endReached = false;

    						if (moveUp) {
    							if (mod < height) {
    								mod += Math.min(5, height - mod);
    							} else {
    								mod = height;
    								endReached = true;
    							}
    						} else {
    							if (mod > 0) {
    								mod -= Math.min(5, mod);
    							} else {
    								mod = 0;
    								endReached = true;
    							}
    						}

    						$$invalidate("elm", elm.scrollTop = pos + mod, elm);

    						if (endReached) {
    							clearInterval(move);
    							locked = false;
    						}
    					},
    					10
    				);
    			}
    		}
    	}

    	let { $$slots = {}, $$scope } = $$props;

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate("content", content = $$value);
    		});
    	}

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate("info", info = $$value);
    		});
    	}

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate("elm", elm = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("elm" in $$props) $$invalidate("elm", elm = $$props.elm);
    		if ("content" in $$props) $$invalidate("content", content = $$props.content);
    		if ("info" in $$props) $$invalidate("info", info = $$props.info);
    		if ("timer" in $$props) timer = $$props.timer;
    		if ("locked" in $$props) locked = $$props.locked;
    		if ("index" in $$props) $$invalidate("index", index = $$props.index);
    		if ("count" in $$props) $$invalidate("count", count = $$props.count);
    	};

    	return {
    		elm,
    		content,
    		info,
    		index,
    		count,
    		init,
    		updateView,
    		div0_binding,
    		div1_binding,
    		div2_binding,
    		$$slots,
    		$$scope
    	};
    }

    class Wiper extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$u, create_fragment$u, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Wiper",
    			options,
    			id: create_fragment$u.name
    		});
    	}
    }

    /* src\component\WiperPage.svelte generated by Svelte v3.15.0 */

    const file$v = "src\\component\\WiperPage.svelte";

    function create_fragment$v(ctx) {
    	let div;
    	let current;
    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svWiperPage");
    			add_location(div, file$v, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			ctx.div_binding(div);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			ctx.div_binding(null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$v.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$v($$self, $$props, $$invalidate) {
    	let elm;

    	window.eventBus.bind("sv-swiper", e => {
    		let swiper = elm.closest(".svWiper");

    		if (swiper) {
    			let pages = swiper.querySelectorAll(".svWiper__content > .svWiperPage");
    			let index = -1, i = 0;
    			let top = swiper.scrollTop;
    			let height = swiper.getBoundingClientRect().height;

    			pages.forEach(e => {
    				index = index === -1 && elm === e ? i : index;
    				i++;
    			});

    			if (index !== -1) {
    				let start = height * index;
    				let visibility = (start - top) / height;

    				if (visibility > -1 && visibility <= 1) {
    					$$invalidate("elm", elm.style.opacity = visibility < 0 ? 1 + visibility : 1, elm);
    				}

    				$$invalidate("elm", elm.style.zIndex = pages.length - index, elm);
    				$$invalidate("elm", elm.style.top = (start > top ? top : start) + "px", elm);
    			}
    		}
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate("elm", elm = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("elm" in $$props) $$invalidate("elm", elm = $$props.elm);
    	};

    	return { elm, div_binding, $$slots, $$scope };
    }

    class WiperPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$v, create_fragment$v, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WiperPage",
    			options,
    			id: create_fragment$v.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.15.0 */

    const { window: window_1$2 } = globals;
    const file$w = "src\\App.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.image = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.image = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx._ = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    // (1:9) <Title size="2">
    function create_default_slot_240(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("SideBar");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_240.name,
    		type: "slot",
    		source: "(1:9) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (1:49) <Article title="Sidebar Content">
    function create_default_slot_239(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Some side bar content");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_239.name,
    		type: "slot",
    		source: "(1:49) <Article title=\\\"Sidebar Content\\\">",
    		ctx
    	});

    	return block;
    }

    // (1:40) <Section>
    function create_default_slot_238(ctx) {
    	let current;

    	const article = new Article({
    			props: {
    				title: "Sidebar Content",
    				$$slots: { default: [create_default_slot_239] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(article.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(article, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const article_changes = {};

    			if (changed.$$scope) {
    				article_changes.$$scope = { changed, ctx };
    			}

    			article.$set(article_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(article.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(article.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(article, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_238.name,
    		type: "slot",
    		source: "(1:40) <Section>",
    		ctx
    	});

    	return block;
    }

    // (1:123) <Section>
    function create_default_slot_237(ctx) {
    	let current;
    	const toc = new TOC({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(toc.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(toc, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(toc.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(toc.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(toc, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_237.name,
    		type: "slot",
    		source: "(1:123) <Section>",
    		ctx
    	});

    	return block;
    }

    // (1:222) <div class="wrapper" slot="front" style="background-color: var(--bg-color);">
    function create_front_slot_8(ctx) {
    	let div0;
    	let div1;
    	let current;

    	const icon = new Icon({
    			props: { icon: "phone-squared" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div1 = element("div");
    			create_component(icon.$$.fragment);
    			attr_dev(div1, "class", "AppIcon");
    			add_location(div1, file$w, 0, 299, 299);
    			attr_dev(div0, "class", "wrapper");
    			attr_dev(div0, "slot", "front");
    			set_style(div0, "background-color", "var(--bg-color)");
    			add_location(div0, file$w, 0, 222, 222);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, div1);
    			mount_component(icon, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_front_slot_8.name,
    		type: "slot",
    		source: "(1:222) <div class=\\\"wrapper\\\" slot=\\\"front\\\" style=\\\"background-color: var(--bg-color);\\\">",
    		ctx
    	});

    	return block;
    }

    // (1:366) <div class="wrapper" slot="back" style="background-color: var(--bg-color-light);">
    function create_back_slot_8(ctx) {
    	let div0;
    	let div1;
    	let current;

    	const icon = new Icon({
    			props: { icon: "phone-squared" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div1 = element("div");
    			create_component(icon.$$.fragment);
    			attr_dev(div1, "class", "AppIcon AppIcon--active");
    			add_location(div1, file$w, 0, 448, 448);
    			attr_dev(div0, "class", "wrapper");
    			attr_dev(div0, "slot", "back");
    			set_style(div0, "background-color", "var(--bg-color-light)");
    			add_location(div0, file$w, 0, 366, 366);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, div1);
    			mount_component(icon, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_back_slot_8.name,
    		type: "slot",
    		source: "(1:366) <div class=\\\"wrapper\\\" slot=\\\"back\\\" style=\\\"background-color: var(--bg-color-light);\\\">",
    		ctx
    	});

    	return block;
    }

    // (1:211) <FlipPanel>
    function create_default_slot_236(ctx) {

    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_236.name,
    		type: "slot",
    		source: "(1:211) <FlipPanel>",
    		ctx
    	});

    	return block;
    }

    // (1:159) <Tile width="4" height="4" clip="{false}" gap="2px">
    function create_default_slot_235(ctx) {
    	let current;

    	const flippanel = new FlipPanel({
    			props: {
    				$$slots: {
    					default: [create_default_slot_236],
    					back: [create_back_slot_8],
    					front: [create_front_slot_8]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(flippanel.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(flippanel, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const flippanel_changes = {};

    			if (changed.$$scope) {
    				flippanel_changes.$$scope = { changed, ctx };
    			}

    			flippanel.$set(flippanel_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(flippanel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(flippanel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(flippanel, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_235.name,
    		type: "slot",
    		source: "(1:159) <Tile width=\\\"4\\\" height=\\\"4\\\" clip=\\\"{false}\\\" gap=\\\"2px\\\">",
    		ctx
    	});

    	return block;
    }

    // (1:613) <div class="wrapper" slot="front" style="background-color: var(--bg-color);">
    function create_front_slot_7(ctx) {
    	let div0;
    	let div1;
    	let current;

    	const icon = new Icon({
    			props: { icon: "pinterest-squared" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div1 = element("div");
    			create_component(icon.$$.fragment);
    			attr_dev(div1, "class", "AppIcon");
    			add_location(div1, file$w, 0, 690, 690);
    			attr_dev(div0, "class", "wrapper");
    			attr_dev(div0, "slot", "front");
    			set_style(div0, "background-color", "var(--bg-color)");
    			add_location(div0, file$w, 0, 613, 613);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, div1);
    			mount_component(icon, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_front_slot_7.name,
    		type: "slot",
    		source: "(1:613) <div class=\\\"wrapper\\\" slot=\\\"front\\\" style=\\\"background-color: var(--bg-color);\\\">",
    		ctx
    	});

    	return block;
    }

    // (1:761) <div class="wrapper" slot="back" style="background-color: var(--bg-color-light);">
    function create_back_slot_7(ctx) {
    	let div0;
    	let div1;
    	let current;

    	const icon = new Icon({
    			props: { icon: "pinterest-squared" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div1 = element("div");
    			create_component(icon.$$.fragment);
    			attr_dev(div1, "class", "AppIcon AppIcon--active");
    			add_location(div1, file$w, 0, 843, 843);
    			attr_dev(div0, "class", "wrapper");
    			attr_dev(div0, "slot", "back");
    			set_style(div0, "background-color", "var(--bg-color-light)");
    			add_location(div0, file$w, 0, 761, 761);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, div1);
    			mount_component(icon, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_back_slot_7.name,
    		type: "slot",
    		source: "(1:761) <div class=\\\"wrapper\\\" slot=\\\"back\\\" style=\\\"background-color: var(--bg-color-light);\\\">",
    		ctx
    	});

    	return block;
    }

    // (1:602) <FlipPanel>
    function create_default_slot_234(ctx) {

    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_234.name,
    		type: "slot",
    		source: "(1:602) <FlipPanel>",
    		ctx
    	});

    	return block;
    }

    // (1:550) <Tile width="4" height="4" clip="{false}" gap="2px">
    function create_default_slot_233(ctx) {
    	let current;

    	const flippanel = new FlipPanel({
    			props: {
    				$$slots: {
    					default: [create_default_slot_234],
    					back: [create_back_slot_7],
    					front: [create_front_slot_7]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(flippanel.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(flippanel, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const flippanel_changes = {};

    			if (changed.$$scope) {
    				flippanel_changes.$$scope = { changed, ctx };
    			}

    			flippanel.$set(flippanel_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(flippanel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(flippanel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(flippanel, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_233.name,
    		type: "slot",
    		source: "(1:550) <Tile width=\\\"4\\\" height=\\\"4\\\" clip=\\\"{false}\\\" gap=\\\"2px\\\">",
    		ctx
    	});

    	return block;
    }

    // (1:1012) <div class="wrapper" slot="front" style="background-color: var(--bg-color);">
    function create_front_slot_6(ctx) {
    	let div0;
    	let div1;
    	let current;

    	const icon = new Icon({
    			props: { icon: "rss-squared" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div1 = element("div");
    			create_component(icon.$$.fragment);
    			attr_dev(div1, "class", "AppIcon");
    			add_location(div1, file$w, 0, 1089, 1089);
    			attr_dev(div0, "class", "wrapper");
    			attr_dev(div0, "slot", "front");
    			set_style(div0, "background-color", "var(--bg-color)");
    			add_location(div0, file$w, 0, 1012, 1012);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, div1);
    			mount_component(icon, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_front_slot_6.name,
    		type: "slot",
    		source: "(1:1012) <div class=\\\"wrapper\\\" slot=\\\"front\\\" style=\\\"background-color: var(--bg-color);\\\">",
    		ctx
    	});

    	return block;
    }

    // (1:1154) <div class="wrapper" slot="back" style="background-color: var(--bg-color-light);">
    function create_back_slot_6(ctx) {
    	let div0;
    	let div1;
    	let current;

    	const icon = new Icon({
    			props: { icon: "rss-squared" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div1 = element("div");
    			create_component(icon.$$.fragment);
    			attr_dev(div1, "class", "AppIcon AppIcon--active");
    			add_location(div1, file$w, 0, 1236, 1236);
    			attr_dev(div0, "class", "wrapper");
    			attr_dev(div0, "slot", "back");
    			set_style(div0, "background-color", "var(--bg-color-light)");
    			add_location(div0, file$w, 0, 1154, 1154);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, div1);
    			mount_component(icon, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_back_slot_6.name,
    		type: "slot",
    		source: "(1:1154) <div class=\\\"wrapper\\\" slot=\\\"back\\\" style=\\\"background-color: var(--bg-color-light);\\\">",
    		ctx
    	});

    	return block;
    }

    // (1:1001) <FlipPanel>
    function create_default_slot_232(ctx) {

    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_232.name,
    		type: "slot",
    		source: "(1:1001) <FlipPanel>",
    		ctx
    	});

    	return block;
    }

    // (1:949) <Tile width="4" height="4" clip="{false}" gap="2px">
    function create_default_slot_231(ctx) {
    	let current;

    	const flippanel = new FlipPanel({
    			props: {
    				$$slots: {
    					default: [create_default_slot_232],
    					back: [create_back_slot_6],
    					front: [create_front_slot_6]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(flippanel.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(flippanel, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const flippanel_changes = {};

    			if (changed.$$scope) {
    				flippanel_changes.$$scope = { changed, ctx };
    			}

    			flippanel.$set(flippanel_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(flippanel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(flippanel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(flippanel, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_231.name,
    		type: "slot",
    		source: "(1:949) <Tile width=\\\"4\\\" height=\\\"4\\\" clip=\\\"{false}\\\" gap=\\\"2px\\\">",
    		ctx
    	});

    	return block;
    }

    // (1:1399) <div class="wrapper" slot="front" style="background-color: var(--bg-color);">
    function create_front_slot_5(ctx) {
    	let div0;
    	let div1;
    	let current;

    	const icon = new Icon({
    			props: { icon: "pencil-squared" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div1 = element("div");
    			create_component(icon.$$.fragment);
    			attr_dev(div1, "class", "AppIcon");
    			add_location(div1, file$w, 0, 1476, 1476);
    			attr_dev(div0, "class", "wrapper");
    			attr_dev(div0, "slot", "front");
    			set_style(div0, "background-color", "var(--bg-color)");
    			add_location(div0, file$w, 0, 1399, 1399);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, div1);
    			mount_component(icon, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_front_slot_5.name,
    		type: "slot",
    		source: "(1:1399) <div class=\\\"wrapper\\\" slot=\\\"front\\\" style=\\\"background-color: var(--bg-color);\\\">",
    		ctx
    	});

    	return block;
    }

    // (1:1544) <div class="wrapper" slot="back" style="background-color: var(--bg-color-light);">
    function create_back_slot_5(ctx) {
    	let div0;
    	let div1;
    	let current;

    	const icon = new Icon({
    			props: { icon: "pencil-squared" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div1 = element("div");
    			create_component(icon.$$.fragment);
    			attr_dev(div1, "class", "AppIcon AppIcon--active");
    			add_location(div1, file$w, 0, 1626, 1626);
    			attr_dev(div0, "class", "wrapper");
    			attr_dev(div0, "slot", "back");
    			set_style(div0, "background-color", "var(--bg-color-light)");
    			add_location(div0, file$w, 0, 1544, 1544);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, div1);
    			mount_component(icon, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_back_slot_5.name,
    		type: "slot",
    		source: "(1:1544) <div class=\\\"wrapper\\\" slot=\\\"back\\\" style=\\\"background-color: var(--bg-color-light);\\\">",
    		ctx
    	});

    	return block;
    }

    // (1:1388) <FlipPanel>
    function create_default_slot_230(ctx) {

    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_230.name,
    		type: "slot",
    		source: "(1:1388) <FlipPanel>",
    		ctx
    	});

    	return block;
    }

    // (1:1336) <Tile width="8" height="4" clip="{false}" gap="2px">
    function create_default_slot_229(ctx) {
    	let current;

    	const flippanel = new FlipPanel({
    			props: {
    				$$slots: {
    					default: [create_default_slot_230],
    					back: [create_back_slot_5],
    					front: [create_front_slot_5]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(flippanel.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(flippanel, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const flippanel_changes = {};

    			if (changed.$$scope) {
    				flippanel_changes.$$scope = { changed, ctx };
    			}

    			flippanel.$set(flippanel_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(flippanel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(flippanel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(flippanel, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_229.name,
    		type: "slot",
    		source: "(1:1336) <Tile width=\\\"8\\\" height=\\\"4\\\" clip=\\\"{false}\\\" gap=\\\"2px\\\">",
    		ctx
    	});

    	return block;
    }

    // (1:1827) <div class="wrapper" slot="front" style="background-color: var(--bg-color);">
    function create_front_slot_4(ctx) {
    	let div0;
    	let div1;
    	let current;

    	const icon = new Icon({
    			props: { icon: "tumblr-squared" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div1 = element("div");
    			create_component(icon.$$.fragment);
    			attr_dev(div1, "class", "AppIcon");
    			add_location(div1, file$w, 0, 1904, 1904);
    			attr_dev(div0, "class", "wrapper");
    			attr_dev(div0, "slot", "front");
    			set_style(div0, "background-color", "var(--bg-color)");
    			add_location(div0, file$w, 0, 1827, 1827);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, div1);
    			mount_component(icon, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_front_slot_4.name,
    		type: "slot",
    		source: "(1:1827) <div class=\\\"wrapper\\\" slot=\\\"front\\\" style=\\\"background-color: var(--bg-color);\\\">",
    		ctx
    	});

    	return block;
    }

    // (1:1972) <div class="wrapper" slot="back" style="background-color: var(--bg-color-light);">
    function create_back_slot_4(ctx) {
    	let div0;
    	let div1;
    	let current;

    	const icon = new Icon({
    			props: { icon: "tumblr-squared" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div1 = element("div");
    			create_component(icon.$$.fragment);
    			attr_dev(div1, "class", "AppIcon AppIcon--active");
    			add_location(div1, file$w, 0, 2054, 2054);
    			attr_dev(div0, "class", "wrapper");
    			attr_dev(div0, "slot", "back");
    			set_style(div0, "background-color", "var(--bg-color-light)");
    			add_location(div0, file$w, 0, 1972, 1972);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, div1);
    			mount_component(icon, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_back_slot_4.name,
    		type: "slot",
    		source: "(1:1972) <div class=\\\"wrapper\\\" slot=\\\"back\\\" style=\\\"background-color: var(--bg-color-light);\\\">",
    		ctx
    	});

    	return block;
    }

    // (1:1781) <FlipPanel on:flip="{switchTheme}" horizontal>
    function create_default_slot_228(ctx) {

    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_228.name,
    		type: "slot",
    		source: "(1:1781) <FlipPanel on:flip=\\\"{switchTheme}\\\" horizontal>",
    		ctx
    	});

    	return block;
    }

    // (1:1729) <Tile width="4" height="4" clip="{false}" gap="2px">
    function create_default_slot_227(ctx) {
    	let current;

    	const flippanel = new FlipPanel({
    			props: {
    				horizontal: true,
    				$$slots: {
    					default: [create_default_slot_228],
    					back: [create_back_slot_4],
    					front: [create_front_slot_4]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	flippanel.$on("flip", switchTheme);

    	const block = {
    		c: function create() {
    			create_component(flippanel.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(flippanel, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const flippanel_changes = {};

    			if (changed.$$scope) {
    				flippanel_changes.$$scope = { changed, ctx };
    			}

    			flippanel.$set(flippanel_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(flippanel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(flippanel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(flippanel, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_227.name,
    		type: "slot",
    		source: "(1:1729) <Tile width=\\\"4\\\" height=\\\"4\\\" clip=\\\"{false}\\\" gap=\\\"2px\\\">",
    		ctx
    	});

    	return block;
    }

    // (1:153) <Grid>
    function create_default_slot_226(ctx) {
    	let current;

    	const tile0 = new Tile({
    			props: {
    				width: "4",
    				height: "4",
    				clip: false,
    				gap: "2px",
    				$$slots: { default: [create_default_slot_235] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const tile1 = new Tile({
    			props: {
    				width: "4",
    				height: "4",
    				clip: false,
    				gap: "2px",
    				$$slots: { default: [create_default_slot_233] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const tile2 = new Tile({
    			props: {
    				width: "4",
    				height: "4",
    				clip: false,
    				gap: "2px",
    				$$slots: { default: [create_default_slot_231] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const tile3 = new Tile({
    			props: {
    				width: "8",
    				height: "4",
    				clip: false,
    				gap: "2px",
    				$$slots: { default: [create_default_slot_229] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const tile4 = new Tile({
    			props: {
    				width: "4",
    				height: "4",
    				clip: false,
    				gap: "2px",
    				$$slots: { default: [create_default_slot_227] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tile0.$$.fragment);
    			create_component(tile1.$$.fragment);
    			create_component(tile2.$$.fragment);
    			create_component(tile3.$$.fragment);
    			create_component(tile4.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tile0, target, anchor);
    			mount_component(tile1, target, anchor);
    			mount_component(tile2, target, anchor);
    			mount_component(tile3, target, anchor);
    			mount_component(tile4, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const tile0_changes = {};

    			if (changed.$$scope) {
    				tile0_changes.$$scope = { changed, ctx };
    			}

    			tile0.$set(tile0_changes);
    			const tile1_changes = {};

    			if (changed.$$scope) {
    				tile1_changes.$$scope = { changed, ctx };
    			}

    			tile1.$set(tile1_changes);
    			const tile2_changes = {};

    			if (changed.$$scope) {
    				tile2_changes.$$scope = { changed, ctx };
    			}

    			tile2.$set(tile2_changes);
    			const tile3_changes = {};

    			if (changed.$$scope) {
    				tile3_changes.$$scope = { changed, ctx };
    			}

    			tile3.$set(tile3_changes);
    			const tile4_changes = {};

    			if (changed.$$scope) {
    				tile4_changes.$$scope = { changed, ctx };
    			}

    			tile4.$set(tile4_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tile0.$$.fragment, local);
    			transition_in(tile1.$$.fragment, local);
    			transition_in(tile2.$$.fragment, local);
    			transition_in(tile3.$$.fragment, local);
    			transition_in(tile4.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tile0.$$.fragment, local);
    			transition_out(tile1.$$.fragment, local);
    			transition_out(tile2.$$.fragment, local);
    			transition_out(tile3.$$.fragment, local);
    			transition_out(tile4.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tile0, detaching);
    			destroy_component(tile1, detaching);
    			destroy_component(tile2, detaching);
    			destroy_component(tile3, detaching);
    			destroy_component(tile4, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_226.name,
    		type: "slot",
    		source: "(1:153) <Grid>",
    		ctx
    	});

    	return block;
    }

    // (1:0) <SideBar>
    function create_default_slot_225(ctx) {
    	let current;

    	const title = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_240] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section0 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_238] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section1 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_237] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const grid = new Grid({
    			props: {
    				$$slots: { default: [create_default_slot_226] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(title.$$.fragment);
    			create_component(section0.$$.fragment);
    			create_component(section1.$$.fragment);
    			create_component(grid.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(title, target, anchor);
    			mount_component(section0, target, anchor);
    			mount_component(section1, target, anchor);
    			mount_component(grid, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const title_changes = {};

    			if (changed.$$scope) {
    				title_changes.$$scope = { changed, ctx };
    			}

    			title.$set(title_changes);
    			const section0_changes = {};

    			if (changed.$$scope) {
    				section0_changes.$$scope = { changed, ctx };
    			}

    			section0.$set(section0_changes);
    			const section1_changes = {};

    			if (changed.$$scope) {
    				section1_changes.$$scope = { changed, ctx };
    			}

    			section1.$set(section1_changes);
    			const grid_changes = {};

    			if (changed.$$scope) {
    				grid_changes.$$scope = { changed, ctx };
    			}

    			grid.$set(grid_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title.$$.fragment, local);
    			transition_in(section0.$$.fragment, local);
    			transition_in(section1.$$.fragment, local);
    			transition_in(grid.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title.$$.fragment, local);
    			transition_out(section0.$$.fragment, local);
    			transition_out(section1.$$.fragment, local);
    			transition_out(grid.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(title, detaching);
    			destroy_component(section0, detaching);
    			destroy_component(section1, detaching);
    			destroy_component(grid, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_225.name,
    		type: "slot",
    		source: "(1:0) <SideBar>",
    		ctx
    	});

    	return block;
    }

    // (1:2207) <span slot="title">
    function create_title_slot(ctx) {
    	let span0;
    	let img;
    	let img_src_value;
    	let span1;
    	let dispose;

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			img = element("img");
    			span1 = element("span");
    			span1.textContent = "Svelte Components Test Page";
    			if (img.src !== (img_src_value = "assets/icons/app-icon.jpg")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "1.5em");
    			set_style(img, "height", "1.5em");
    			set_style(img, "vertical-align", "text-bottom");
    			set_style(img, "margin-right", ".5em");
    			add_location(img, file$w, 0, 2226, 2226);
    			add_location(span1, file$w, 0, 2367, 2367);
    			attr_dev(span0, "slot", "title");
    			add_location(span0, file$w, 0, 2207, 2207);
    			dispose = listen_dev(img, "click", sidebar.show, false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			append_dev(span0, img);
    			append_dev(span0, span1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_title_slot.name,
    		type: "slot",
    		source: "(1:2207) <span slot=\\\"title\\\">",
    		ctx
    	});

    	return block;
    }

    // (1:2432) <IconBar>
    function create_default_slot_224(ctx) {
    	let current;

    	const icon0 = new Icon({
    			props: {
    				title: "Facebook",
    				url: "http://facebook.com",
    				icon: "facebook"
    			},
    			$$inline: true
    		});

    	const icon1 = new Icon({
    			props: {
    				title: "Tumblr",
    				url: "http://tumblr.com",
    				icon: "tumblr"
    			},
    			$$inline: true
    		});

    	const icon2 = new Icon({
    			props: {
    				title: "Artstation",
    				url: "http://artstation.com",
    				icon: "help"
    			},
    			$$inline: true
    		});

    	const icon3 = new Icon({
    			props: {
    				title: "DeviantArt",
    				url: "http://deviantart.com",
    				icon: "deviantart"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon0.$$.fragment);
    			create_component(icon1.$$.fragment);
    			create_component(icon2.$$.fragment);
    			create_component(icon3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon0, target, anchor);
    			mount_component(icon1, target, anchor);
    			mount_component(icon2, target, anchor);
    			mount_component(icon3, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon0.$$.fragment, local);
    			transition_in(icon1.$$.fragment, local);
    			transition_in(icon2.$$.fragment, local);
    			transition_in(icon3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon0.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			transition_out(icon2.$$.fragment, local);
    			transition_out(icon3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon0, detaching);
    			destroy_component(icon1, detaching);
    			destroy_component(icon2, detaching);
    			destroy_component(icon3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_224.name,
    		type: "slot",
    		source: "(1:2432) <IconBar>",
    		ctx
    	});

    	return block;
    }

    // (1:2414) <div slot="icons">
    function create_icons_slot(ctx) {
    	let div;
    	let current;

    	const iconbar = new IconBar({
    			props: {
    				$$slots: { default: [create_default_slot_224] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(iconbar.$$.fragment);
    			attr_dev(div, "slot", "icons");
    			add_location(div, file$w, 0, 2414, 2414);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(iconbar, div, null);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const iconbar_changes = {};

    			if (changed.$$scope) {
    				iconbar_changes.$$scope = { changed, ctx };
    			}

    			iconbar.$set(iconbar_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(iconbar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(iconbar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(iconbar);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_icons_slot.name,
    		type: "slot",
    		source: "(1:2414) <div slot=\\\"icons\\\">",
    		ctx
    	});

    	return block;
    }

    // (1:2199) <NavBar>
    function create_default_slot_223(ctx) {

    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_223.name,
    		type: "slot",
    		source: "(1:2199) <NavBar>",
    		ctx
    	});

    	return block;
    }

    // (1:2191) <Header>
    function create_default_slot_222(ctx) {
    	let current;

    	const navbar = new NavBar({
    			props: {
    				$$slots: {
    					default: [create_default_slot_223],
    					icons: [create_icons_slot],
    					title: [create_title_slot]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const notification0 = new Notification({ props: { close: "2.5s" }, $$inline: true });

    	const notification1 = new Notification({
    			props: { close: "click", floatable: true },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(navbar.$$.fragment);
    			create_component(notification0.$$.fragment);
    			create_component(notification1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(navbar, target, anchor);
    			mount_component(notification0, target, anchor);
    			mount_component(notification1, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const navbar_changes = {};

    			if (changed.$$scope) {
    				navbar_changes.$$scope = { changed, ctx };
    			}

    			navbar.$set(navbar_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(notification0.$$.fragment, local);
    			transition_in(notification1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(notification0.$$.fragment, local);
    			transition_out(notification1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(navbar, detaching);
    			destroy_component(notification0, detaching);
    			destroy_component(notification1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_222.name,
    		type: "slot",
    		source: "(1:2191) <Header>",
    		ctx
    	});

    	return block;
    }

    // (1:2875) <Title size="1">
    function create_default_slot_221(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("About this page");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_221.name,
    		type: "slot",
    		source: "(1:2875) <Title size=\\\"1\\\">",
    		ctx
    	});

    	return block;
    }

    // (1:2914) <Section>
    function create_default_slot_220(ctx) {
    	let t0;
    	let br0;
    	let t1;
    	let b0;
    	let t3;
    	let b1;
    	let t5;
    	let br1;
    	let t6;
    	let b2;
    	let t8;
    	let br2;
    	let t9;
    	let b3;
    	let t11;
    	let br3;
    	let t12;
    	let b4;
    	let t14;
    	let br4;
    	let t15;
    	let br5;
    	let t16;
    	let ul;
    	let li0;
    	let li1;
    	let li2;
    	let li3;
    	let li4;
    	let li5;
    	let span;

    	const block = {
    		c: function create() {
    			t0 = text("This is a test page for all SV-Components, to show them in an overview and to test them.");
    			br0 = element("br");
    			t1 = text("\nMain target of this little project is to ");
    			b0 = element("b");
    			b0.textContent = "mess around, using\nSvelte with current CSS/JS-features";
    			t3 = text(" and ");
    			b1 = element("b");
    			b1.textContent = "not to be fully-cross-browser-on-all-device-in-space-super-duper-stuff";
    			t5 = text(".");
    			br1 = element("br");
    			t6 = text("\nIf you're looking for examples ");
    			b2 = element("b");
    			b2.textContent = "how some stuff can(!) be done (JS/CSS/PUG/SVELTE)";
    			t8 = text(", be my guest.");
    			br2 = element("br");
    			t9 = text("\nIf you're looking for some ");
    			b3 = element("b");
    			b3.textContent = "ready-to-deploy fully-fledged super framework";
    			t11 = text(" - nah, don't use this here, there are better ones.");
    			br3 = element("br");
    			t12 = text("\nNote that areas that are ");
    			b4 = element("b");
    			b4.textContent = "'hatched'";
    			t14 = text(" in their style, are things to be done.");
    			br4 = element("br");
    			t15 = space();
    			br5 = element("br");
    			t16 = text("\nFor the time being, this code is 'laboratory'-code. That said expect following things:");
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "Code might break";
    			li1 = element("li");
    			li1.textContent = "Page might not work in any browser/-version (i'm looking at you IE(11) & Safari)";
    			li2 = element("li");
    			li2.textContent = "Not created under aspects of 'mobile-first'. I'm mean... it might work and do things... or not...";
    			li3 = element("li");
    			li3.textContent = "Not everything is feature complete";
    			li4 = element("li");
    			li4.textContent = "Not everything is (well)documented (here and/or in code)";
    			li5 = element("li");
    			li5.textContent = "Not ment for production... really";
    			span = element("span");
    			span.textContent = "So, let's go...";
    			add_location(br0, file$w, 0, 3011, 3011);
    			set_style(b0, "color", "rgb(0,127,0)");
    			add_location(b0, file$w, 1, 41, 3057);
    			set_style(b1, "color", "rgb(127,0,0)");
    			set_style(b1, "text-decoration", "line-through");
    			add_location(b1, file$w, 2, 44, 3150);
    			add_location(br1, file$w, 3, 75, 3286);
    			set_style(b2, "color", "rgb(0,127,0)");
    			add_location(b2, file$w, 4, 31, 3322);
    			add_location(br2, file$w, 4, 128, 3419);
    			set_style(b3, "color", "rgb(127,0,0)");
    			set_style(b3, "text-decoration", "line-through");
    			add_location(b3, file$w, 5, 27, 3451);
    			add_location(br3, file$w, 5, 187, 3611);
    			attr_dev(b4, "class", "--hatched");
    			add_location(b4, file$w, 6, 25, 3641);
    			add_location(br4, file$w, 6, 98, 3714);
    			add_location(br5, file$w, 7, 0, 3719);
    			add_location(li0, file$w, 8, 90, 3814);
    			add_location(li1, file$w, 8, 115, 3839);
    			add_location(li2, file$w, 8, 204, 3928);
    			add_location(li3, file$w, 8, 310, 4034);
    			add_location(li4, file$w, 8, 353, 4077);
    			add_location(li5, file$w, 8, 418, 4142);
    			add_location(ul, file$w, 8, 86, 3810);
    			add_location(span, file$w, 8, 465, 4189);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, b0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, b1, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, b2, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, b3, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, br3, anchor);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, b4, anchor);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, br4, anchor);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, br5, anchor);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(ul, li1);
    			append_dev(ul, li2);
    			append_dev(ul, li3);
    			append_dev(ul, li4);
    			append_dev(ul, li5);
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(b0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(b1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(b2);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(b3);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(br3);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(b4);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(br4);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(br5);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(ul);
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_220.name,
    		type: "slot",
    		source: "(1:2914) <Section>",
    		ctx
    	});

    	return block;
    }

    // (9:503) <Title size="2">
    function create_default_slot_219(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Titles");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_219.name,
    		type: "slot",
    		source: "(9:503) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (9:603) <Code>
    function create_default_slot_218(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Title(size=\"[SIZE]\") [TEXT]");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_218.name,
    		type: "slot",
    		source: "(9:603) <Code>",
    		ctx
    	});

    	return block;
    }

    // (9:576) <TextBlock title="Syntax:">
    function create_default_slot_217(ctx) {
    	let current;

    	const code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_218] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(code.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const code_changes = {};

    			if (changed.$$scope) {
    				code_changes.$$scope = { changed, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_217.name,
    		type: "slot",
    		source: "(9:576) <TextBlock title=\\\"Syntax:\\\">",
    		ctx
    	});

    	return block;
    }

    // (9:686) <Code>
    function create_default_slot_216(ctx) {
    	let t0;
    	let br;
    	let t1;
    	let current;

    	const hint = new Hint({
    			props: { info: "This attribute is optional." },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t0 = text("size = 1 | 2 | 3 | 4 | 5 | 6 ");
    			create_component(hint.$$.fragment);
    			br = element("br");
    			t1 = space();
    			add_location(br, file$w, 9, 71, 4488);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			mount_component(hint, target, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t1, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hint.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hint.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			destroy_component(hint, detaching);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_216.name,
    		type: "slot",
    		source: "(9:686) <Code>",
    		ctx
    	});

    	return block;
    }

    // (9:655) <TextBlock title="Parameters:">
    function create_default_slot_215(ctx) {
    	let current;

    	const code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_216] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(code.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const code_changes = {};

    			if (changed.$$scope) {
    				code_changes.$$scope = { changed, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_215.name,
    		type: "slot",
    		source: "(9:655) <TextBlock title=\\\"Parameters:\\\">",
    		ctx
    	});

    	return block;
    }

    // (11:48) <Title size="1">
    function create_default_slot_214(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Title Size 1");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_214.name,
    		type: "slot",
    		source: "(11:48) <Title size=\\\"1\\\">",
    		ctx
    	});

    	return block;
    }

    // (11:84) <Title size="2">
    function create_default_slot_213(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Title Size 2");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_213.name,
    		type: "slot",
    		source: "(11:84) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (11:120) <Title size="3">
    function create_default_slot_212(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Title Size 3");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_212.name,
    		type: "slot",
    		source: "(11:120) <Title size=\\\"3\\\">",
    		ctx
    	});

    	return block;
    }

    // (11:156) <Title size="4">
    function create_default_slot_211(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Title Size 4");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_211.name,
    		type: "slot",
    		source: "(11:156) <Title size=\\\"4\\\">",
    		ctx
    	});

    	return block;
    }

    // (11:192) <Title size="5">
    function create_default_slot_210(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Title Size 5");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_210.name,
    		type: "slot",
    		source: "(11:192) <Title size=\\\"5\\\">",
    		ctx
    	});

    	return block;
    }

    // (11:228) <Title size="6">
    function create_default_slot_209(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Title Size 6");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_209.name,
    		type: "slot",
    		source: "(11:228) <Title size=\\\"6\\\">",
    		ctx
    	});

    	return block;
    }

    // (11:19) <TextBlock title="Examples:">
    function create_default_slot_208(ctx) {
    	let current;

    	const title0 = new Title({
    			props: {
    				size: "1",
    				$$slots: { default: [create_default_slot_214] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title1 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_213] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title2 = new Title({
    			props: {
    				size: "3",
    				$$slots: { default: [create_default_slot_212] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title3 = new Title({
    			props: {
    				size: "4",
    				$$slots: { default: [create_default_slot_211] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title4 = new Title({
    			props: {
    				size: "5",
    				$$slots: { default: [create_default_slot_210] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title5 = new Title({
    			props: {
    				size: "6",
    				$$slots: { default: [create_default_slot_209] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(title0.$$.fragment);
    			create_component(title1.$$.fragment);
    			create_component(title2.$$.fragment);
    			create_component(title3.$$.fragment);
    			create_component(title4.$$.fragment);
    			create_component(title5.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(title0, target, anchor);
    			mount_component(title1, target, anchor);
    			mount_component(title2, target, anchor);
    			mount_component(title3, target, anchor);
    			mount_component(title4, target, anchor);
    			mount_component(title5, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const title0_changes = {};

    			if (changed.$$scope) {
    				title0_changes.$$scope = { changed, ctx };
    			}

    			title0.$set(title0_changes);
    			const title1_changes = {};

    			if (changed.$$scope) {
    				title1_changes.$$scope = { changed, ctx };
    			}

    			title1.$set(title1_changes);
    			const title2_changes = {};

    			if (changed.$$scope) {
    				title2_changes.$$scope = { changed, ctx };
    			}

    			title2.$set(title2_changes);
    			const title3_changes = {};

    			if (changed.$$scope) {
    				title3_changes.$$scope = { changed, ctx };
    			}

    			title3.$set(title3_changes);
    			const title4_changes = {};

    			if (changed.$$scope) {
    				title4_changes.$$scope = { changed, ctx };
    			}

    			title4.$set(title4_changes);
    			const title5_changes = {};

    			if (changed.$$scope) {
    				title5_changes.$$scope = { changed, ctx };
    			}

    			title5.$set(title5_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title0.$$.fragment, local);
    			transition_in(title1.$$.fragment, local);
    			transition_in(title2.$$.fragment, local);
    			transition_in(title3.$$.fragment, local);
    			transition_in(title4.$$.fragment, local);
    			transition_in(title5.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title0.$$.fragment, local);
    			transition_out(title1.$$.fragment, local);
    			transition_out(title2.$$.fragment, local);
    			transition_out(title3.$$.fragment, local);
    			transition_out(title4.$$.fragment, local);
    			transition_out(title5.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(title0, detaching);
    			destroy_component(title1, detaching);
    			destroy_component(title2, detaching);
    			destroy_component(title3, detaching);
    			destroy_component(title4, detaching);
    			destroy_component(title5, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_208.name,
    		type: "slot",
    		source: "(11:19) <TextBlock title=\\\"Examples:\\\">",
    		ctx
    	});

    	return block;
    }

    // (9:542) <Description title="About titles">
    function create_default_slot_207(ctx) {
    	let current;

    	const textblock0 = new TextBlock({
    			props: {
    				title: "Syntax:",
    				$$slots: { default: [create_default_slot_217] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock1 = new TextBlock({
    			props: {
    				title: "Parameters:",
    				$$slots: { default: [create_default_slot_215] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock2 = new TextBlock({
    			props: {
    				title: "Examples:",
    				$$slots: { default: [create_default_slot_208] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(textblock0.$$.fragment);
    			create_component(textblock1.$$.fragment);
    			create_component(textblock2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textblock0, target, anchor);
    			mount_component(textblock1, target, anchor);
    			mount_component(textblock2, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const textblock0_changes = {};

    			if (changed.$$scope) {
    				textblock0_changes.$$scope = { changed, ctx };
    			}

    			textblock0.$set(textblock0_changes);
    			const textblock1_changes = {};

    			if (changed.$$scope) {
    				textblock1_changes.$$scope = { changed, ctx };
    			}

    			textblock1.$set(textblock1_changes);
    			const textblock2_changes = {};

    			if (changed.$$scope) {
    				textblock2_changes.$$scope = { changed, ctx };
    			}

    			textblock2.$set(textblock2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textblock0.$$.fragment, local);
    			transition_in(textblock1.$$.fragment, local);
    			transition_in(textblock2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textblock0.$$.fragment, local);
    			transition_out(textblock1.$$.fragment, local);
    			transition_out(textblock2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textblock0, detaching);
    			destroy_component(textblock1, detaching);
    			destroy_component(textblock2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_207.name,
    		type: "slot",
    		source: "(9:542) <Description title=\\\"About titles\\\">",
    		ctx
    	});

    	return block;
    }

    // (9:533) <Section>
    function create_default_slot_206(ctx) {
    	let current;

    	const description = new Description({
    			props: {
    				title: "About titles",
    				$$slots: { default: [create_default_slot_207] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(description.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(description, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const description_changes = {};

    			if (changed.$$scope) {
    				description_changes.$$scope = { changed, ctx };
    			}

    			description.$set(description_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(description.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(description.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(description, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_206.name,
    		type: "slot",
    		source: "(9:533) <Section>",
    		ctx
    	});

    	return block;
    }

    // (11:300) <Title size="2">
    function create_default_slot_205(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Buttons");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_205.name,
    		type: "slot",
    		source: "(11:300) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (11:403) <Code>
    function create_default_slot_204(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Button(icon=\"[ICON]\",type=\"[TYPE]\") [TEXT]");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_204.name,
    		type: "slot",
    		source: "(11:403) <Code>",
    		ctx
    	});

    	return block;
    }

    // (11:376) <TextBlock title="Syntax:">
    function create_default_slot_203(ctx) {
    	let current;

    	const code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_204] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(code.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const code_changes = {};

    			if (changed.$$scope) {
    				code_changes.$$scope = { changed, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_203.name,
    		type: "slot",
    		source: "(11:376) <TextBlock title=\\\"Syntax:\\\">",
    		ctx
    	});

    	return block;
    }

    // (11:501) <Code>
    function create_default_slot_202(ctx) {
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let current;

    	const hint0 = new Hint({
    			props: { info: "This attribute is optional." },
    			$$inline: true
    		});

    	const hint1 = new Hint({
    			props: { info: "This attribute is optional." },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t0 = text("icon = [ICON] ");
    			create_component(hint0.$$.fragment);
    			br0 = element("br");
    			t1 = text("\ntype = default | primary | secondary | disabled ");
    			create_component(hint1.$$.fragment);
    			br1 = element("br");
    			t2 = space();
    			add_location(br0, file$w, 11, 56, 5057);
    			add_location(br1, file$w, 12, 90, 5152);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			mount_component(hint0, target, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(hint1, target, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t2, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hint0.$$.fragment, local);
    			transition_in(hint1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hint0.$$.fragment, local);
    			transition_out(hint1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			destroy_component(hint0, detaching);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			destroy_component(hint1, detaching);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_202.name,
    		type: "slot",
    		source: "(11:501) <Code>",
    		ctx
    	});

    	return block;
    }

    // (11:470) <TextBlock title="Parameters:">
    function create_default_slot_201(ctx) {
    	let current;

    	const code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_202] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(code.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const code_changes = {};

    			if (changed.$$scope) {
    				code_changes.$$scope = { changed, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_201.name,
    		type: "slot",
    		source: "(11:470) <TextBlock title=\\\"Parameters:\\\">",
    		ctx
    	});

    	return block;
    }

    // (14:63) <Button type="default">
    function create_default_slot_200(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Default");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_200.name,
    		type: "slot",
    		source: "(14:63) <Button type=\\\"default\\\">",
    		ctx
    	});

    	return block;
    }

    // (14:102) <Button type="default pulse">
    function create_default_slot_199(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Default with pulse effect");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_199.name,
    		type: "slot",
    		source: "(14:102) <Button type=\\\"default pulse\\\">",
    		ctx
    	});

    	return block;
    }

    // (14:165) <Button icon="picture" type="default">
    function create_default_slot_198(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Default with icon");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_198.name,
    		type: "slot",
    		source: "(14:165) <Button icon=\\\"picture\\\" type=\\\"default\\\">",
    		ctx
    	});

    	return block;
    }

    // (14:19) <TextBlock title="Examples, default style:">
    function create_default_slot_197(ctx) {
    	let current;

    	const button0 = new Button({
    			props: {
    				type: "default",
    				$$slots: { default: [create_default_slot_200] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const button1 = new Button({
    			props: {
    				type: "default pulse",
    				$$slots: { default: [create_default_slot_199] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const button2 = new Button({
    			props: {
    				icon: "picture",
    				type: "default",
    				$$slots: { default: [create_default_slot_198] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button0.$$.fragment);
    			create_component(button1.$$.fragment);
    			create_component(button2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button0, target, anchor);
    			mount_component(button1, target, anchor);
    			mount_component(button2, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const button0_changes = {};

    			if (changed.$$scope) {
    				button0_changes.$$scope = { changed, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (changed.$$scope) {
    				button1_changes.$$scope = { changed, ctx };
    			}

    			button1.$set(button1_changes);
    			const button2_changes = {};

    			if (changed.$$scope) {
    				button2_changes.$$scope = { changed, ctx };
    			}

    			button2.$set(button2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button0, detaching);
    			destroy_component(button1, detaching);
    			destroy_component(button2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_197.name,
    		type: "slot",
    		source: "(14:19) <TextBlock title=\\\"Examples, default style:\\\">",
    		ctx
    	});

    	return block;
    }

    // (14:285) <Button type="primary">
    function create_default_slot_196(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Primary");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_196.name,
    		type: "slot",
    		source: "(14:285) <Button type=\\\"primary\\\">",
    		ctx
    	});

    	return block;
    }

    // (14:324) <Button type="primary pulse">
    function create_default_slot_195(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Primary with pulse effect");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_195.name,
    		type: "slot",
    		source: "(14:324) <Button type=\\\"primary pulse\\\">",
    		ctx
    	});

    	return block;
    }

    // (14:387) <Button icon="picture" type="primary">
    function create_default_slot_194(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Primary with icon");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_194.name,
    		type: "slot",
    		source: "(14:387) <Button icon=\\\"picture\\\" type=\\\"primary\\\">",
    		ctx
    	});

    	return block;
    }

    // (14:241) <TextBlock title="Examples, primary style:">
    function create_default_slot_193(ctx) {
    	let current;

    	const button0 = new Button({
    			props: {
    				type: "primary",
    				$$slots: { default: [create_default_slot_196] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const button1 = new Button({
    			props: {
    				type: "primary pulse",
    				$$slots: { default: [create_default_slot_195] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const button2 = new Button({
    			props: {
    				icon: "picture",
    				type: "primary",
    				$$slots: { default: [create_default_slot_194] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button0.$$.fragment);
    			create_component(button1.$$.fragment);
    			create_component(button2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button0, target, anchor);
    			mount_component(button1, target, anchor);
    			mount_component(button2, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const button0_changes = {};

    			if (changed.$$scope) {
    				button0_changes.$$scope = { changed, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (changed.$$scope) {
    				button1_changes.$$scope = { changed, ctx };
    			}

    			button1.$set(button1_changes);
    			const button2_changes = {};

    			if (changed.$$scope) {
    				button2_changes.$$scope = { changed, ctx };
    			}

    			button2.$set(button2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button0, detaching);
    			destroy_component(button1, detaching);
    			destroy_component(button2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_193.name,
    		type: "slot",
    		source: "(14:241) <TextBlock title=\\\"Examples, primary style:\\\">",
    		ctx
    	});

    	return block;
    }

    // (14:509) <Button type="secondary">
    function create_default_slot_192(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Secondary");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_192.name,
    		type: "slot",
    		source: "(14:509) <Button type=\\\"secondary\\\">",
    		ctx
    	});

    	return block;
    }

    // (14:552) <Button type="secondary pulse">
    function create_default_slot_191(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Secondary with pulse effect");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_191.name,
    		type: "slot",
    		source: "(14:552) <Button type=\\\"secondary pulse\\\">",
    		ctx
    	});

    	return block;
    }

    // (14:619) <Button icon="picture" type="secondary">
    function create_default_slot_190(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Secondary with icon");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_190.name,
    		type: "slot",
    		source: "(14:619) <Button icon=\\\"picture\\\" type=\\\"secondary\\\">",
    		ctx
    	});

    	return block;
    }

    // (14:463) <TextBlock title="Examples, secondary style:">
    function create_default_slot_189(ctx) {
    	let current;

    	const button0 = new Button({
    			props: {
    				type: "secondary",
    				$$slots: { default: [create_default_slot_192] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const button1 = new Button({
    			props: {
    				type: "secondary pulse",
    				$$slots: { default: [create_default_slot_191] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const button2 = new Button({
    			props: {
    				icon: "picture",
    				type: "secondary",
    				$$slots: { default: [create_default_slot_190] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button0.$$.fragment);
    			create_component(button1.$$.fragment);
    			create_component(button2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button0, target, anchor);
    			mount_component(button1, target, anchor);
    			mount_component(button2, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const button0_changes = {};

    			if (changed.$$scope) {
    				button0_changes.$$scope = { changed, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (changed.$$scope) {
    				button1_changes.$$scope = { changed, ctx };
    			}

    			button1.$set(button1_changes);
    			const button2_changes = {};

    			if (changed.$$scope) {
    				button2_changes.$$scope = { changed, ctx };
    			}

    			button2.$set(button2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button0, detaching);
    			destroy_component(button1, detaching);
    			destroy_component(button2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_189.name,
    		type: "slot",
    		source: "(14:463) <TextBlock title=\\\"Examples, secondary style:\\\">",
    		ctx
    	});

    	return block;
    }

    // (14:744) <Button type="disabled">
    function create_default_slot_188(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Disabled");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_188.name,
    		type: "slot",
    		source: "(14:744) <Button type=\\\"disabled\\\">",
    		ctx
    	});

    	return block;
    }

    // (14:785) <Button type="disabled pulse">
    function create_default_slot_187(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Disabled with pulse effect");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_187.name,
    		type: "slot",
    		source: "(14:785) <Button type=\\\"disabled pulse\\\">",
    		ctx
    	});

    	return block;
    }

    // (14:850) <Button icon="picture" type="disabled">
    function create_default_slot_186(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Disabled with icon");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_186.name,
    		type: "slot",
    		source: "(14:850) <Button icon=\\\"picture\\\" type=\\\"disabled\\\">",
    		ctx
    	});

    	return block;
    }

    // (14:699) <TextBlock title="Examples, disabled style:">
    function create_default_slot_185(ctx) {
    	let current;

    	const button0 = new Button({
    			props: {
    				type: "disabled",
    				$$slots: { default: [create_default_slot_188] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const button1 = new Button({
    			props: {
    				type: "disabled pulse",
    				$$slots: { default: [create_default_slot_187] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const button2 = new Button({
    			props: {
    				icon: "picture",
    				type: "disabled",
    				$$slots: { default: [create_default_slot_186] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button0.$$.fragment);
    			create_component(button1.$$.fragment);
    			create_component(button2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button0, target, anchor);
    			mount_component(button1, target, anchor);
    			mount_component(button2, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const button0_changes = {};

    			if (changed.$$scope) {
    				button0_changes.$$scope = { changed, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (changed.$$scope) {
    				button1_changes.$$scope = { changed, ctx };
    			}

    			button1.$set(button1_changes);
    			const button2_changes = {};

    			if (changed.$$scope) {
    				button2_changes.$$scope = { changed, ctx };
    			}

    			button2.$set(button2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button0, detaching);
    			destroy_component(button1, detaching);
    			destroy_component(button2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_185.name,
    		type: "slot",
    		source: "(14:699) <TextBlock title=\\\"Examples, disabled style:\\\">",
    		ctx
    	});

    	return block;
    }

    // (11:340) <Description title="Single buttons">
    function create_default_slot_184(ctx) {
    	let current;

    	const textblock0 = new TextBlock({
    			props: {
    				title: "Syntax:",
    				$$slots: { default: [create_default_slot_203] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock1 = new TextBlock({
    			props: {
    				title: "Parameters:",
    				$$slots: { default: [create_default_slot_201] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock2 = new TextBlock({
    			props: {
    				title: "Examples, default style:",
    				$$slots: { default: [create_default_slot_197] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock3 = new TextBlock({
    			props: {
    				title: "Examples, primary style:",
    				$$slots: { default: [create_default_slot_193] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock4 = new TextBlock({
    			props: {
    				title: "Examples, secondary style:",
    				$$slots: { default: [create_default_slot_189] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock5 = new TextBlock({
    			props: {
    				title: "Examples, disabled style:",
    				$$slots: { default: [create_default_slot_185] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(textblock0.$$.fragment);
    			create_component(textblock1.$$.fragment);
    			create_component(textblock2.$$.fragment);
    			create_component(textblock3.$$.fragment);
    			create_component(textblock4.$$.fragment);
    			create_component(textblock5.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textblock0, target, anchor);
    			mount_component(textblock1, target, anchor);
    			mount_component(textblock2, target, anchor);
    			mount_component(textblock3, target, anchor);
    			mount_component(textblock4, target, anchor);
    			mount_component(textblock5, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const textblock0_changes = {};

    			if (changed.$$scope) {
    				textblock0_changes.$$scope = { changed, ctx };
    			}

    			textblock0.$set(textblock0_changes);
    			const textblock1_changes = {};

    			if (changed.$$scope) {
    				textblock1_changes.$$scope = { changed, ctx };
    			}

    			textblock1.$set(textblock1_changes);
    			const textblock2_changes = {};

    			if (changed.$$scope) {
    				textblock2_changes.$$scope = { changed, ctx };
    			}

    			textblock2.$set(textblock2_changes);
    			const textblock3_changes = {};

    			if (changed.$$scope) {
    				textblock3_changes.$$scope = { changed, ctx };
    			}

    			textblock3.$set(textblock3_changes);
    			const textblock4_changes = {};

    			if (changed.$$scope) {
    				textblock4_changes.$$scope = { changed, ctx };
    			}

    			textblock4.$set(textblock4_changes);
    			const textblock5_changes = {};

    			if (changed.$$scope) {
    				textblock5_changes.$$scope = { changed, ctx };
    			}

    			textblock5.$set(textblock5_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textblock0.$$.fragment, local);
    			transition_in(textblock1.$$.fragment, local);
    			transition_in(textblock2.$$.fragment, local);
    			transition_in(textblock3.$$.fragment, local);
    			transition_in(textblock4.$$.fragment, local);
    			transition_in(textblock5.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textblock0.$$.fragment, local);
    			transition_out(textblock1.$$.fragment, local);
    			transition_out(textblock2.$$.fragment, local);
    			transition_out(textblock3.$$.fragment, local);
    			transition_out(textblock4.$$.fragment, local);
    			transition_out(textblock5.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textblock0, detaching);
    			destroy_component(textblock1, detaching);
    			destroy_component(textblock2, detaching);
    			destroy_component(textblock3, detaching);
    			destroy_component(textblock4, detaching);
    			destroy_component(textblock5, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_184.name,
    		type: "slot",
    		source: "(11:340) <Description title=\\\"Single buttons\\\">",
    		ctx
    	});

    	return block;
    }

    // (14:1078) <Button type="default">
    function create_default_slot_183(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Default");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_183.name,
    		type: "slot",
    		source: "(14:1078) <Button type=\\\"default\\\">",
    		ctx
    	});

    	return block;
    }

    // (14:1053) {#each Array(10) as _, i}
    function create_each_block_2(ctx) {
    	let current;

    	const button = new Button({
    			props: {
    				type: "default",
    				$$slots: { default: [create_default_slot_183] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const button_changes = {};

    			if (changed.$$scope) {
    				button_changes.$$scope = { changed, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(14:1053) {#each Array(10) as _, i}",
    		ctx
    	});

    	return block;
    }

    // (14:1040) <ButtonGroup>
    function create_default_slot_182(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_2 = Array(10);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (changed.Array) {
    				each_value_2 = Array(10);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_2.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_182.name,
    		type: "slot",
    		source: "(14:1040) <ButtonGroup>",
    		ctx
    	});

    	return block;
    }

    // (14:1011) <TextBlock title="Examples:">
    function create_default_slot_181(ctx) {
    	let current;

    	const buttongroup = new ButtonGroup({
    			props: {
    				$$slots: { default: [create_default_slot_182] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(buttongroup.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(buttongroup, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const buttongroup_changes = {};

    			if (changed.$$scope) {
    				buttongroup_changes.$$scope = { changed, ctx };
    			}

    			buttongroup.$set(buttongroup_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(buttongroup.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(buttongroup.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(buttongroup, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_181.name,
    		type: "slot",
    		source: "(14:1011) <TextBlock title=\\\"Examples:\\\">",
    		ctx
    	});

    	return block;
    }

    // (14:942) <Description title="Buttons in a group panel">
    function create_default_slot_180(ctx) {
    	let div;
    	let current;

    	const textblock = new TextBlock({
    			props: {
    				title: "Examples:",
    				$$slots: { default: [create_default_slot_181] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(textblock.$$.fragment);
    			attr_dev(div, "class", "--hatched");
    			add_location(div, file$w, 13, 988, 6145);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(textblock, div, null);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const textblock_changes = {};

    			if (changed.$$scope) {
    				textblock_changes.$$scope = { changed, ctx };
    			}

    			textblock.$set(textblock_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textblock.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textblock.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(textblock);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_180.name,
    		type: "slot",
    		source: "(14:942) <Description title=\\\"Buttons in a group panel\\\">",
    		ctx
    	});

    	return block;
    }

    // (11:331) <Section>
    function create_default_slot_179(ctx) {
    	let current;

    	const description0 = new Description({
    			props: {
    				title: "Single buttons",
    				$$slots: { default: [create_default_slot_184] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const description1 = new Description({
    			props: {
    				title: "Buttons in a group panel",
    				$$slots: { default: [create_default_slot_180] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(description0.$$.fragment);
    			create_component(description1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(description0, target, anchor);
    			mount_component(description1, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const description0_changes = {};

    			if (changed.$$scope) {
    				description0_changes.$$scope = { changed, ctx };
    			}

    			description0.$set(description0_changes);
    			const description1_changes = {};

    			if (changed.$$scope) {
    				description1_changes.$$scope = { changed, ctx };
    			}

    			description1.$set(description1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(description0.$$.fragment, local);
    			transition_in(description1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(description0.$$.fragment, local);
    			transition_out(description1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(description0, detaching);
    			destroy_component(description1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_179.name,
    		type: "slot",
    		source: "(11:331) <Section>",
    		ctx
    	});

    	return block;
    }

    // (14:1180) <Title size="2">
    function create_default_slot_178(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Checkboxes");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_178.name,
    		type: "slot",
    		source: "(14:1180) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (14:1288) <Code>
    function create_default_slot_177(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("CheckBox(checked,disabled) [TEXT]");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_177.name,
    		type: "slot",
    		source: "(14:1288) <Code>",
    		ctx
    	});

    	return block;
    }

    // (14:1261) <TextBlock title="Syntax:">
    function create_default_slot_176(ctx) {
    	let current;

    	const code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_177] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(code.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const code_changes = {};

    			if (changed.$$scope) {
    				code_changes.$$scope = { changed, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_176.name,
    		type: "slot",
    		source: "(14:1261) <TextBlock title=\\\"Syntax:\\\">",
    		ctx
    	});

    	return block;
    }

    // (14:1377) <Code>
    function create_default_slot_175(ctx) {
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let current;

    	const hint0 = new Hint({
    			props: {
    				info: "This attribute is optional.This attribute needs no value, just the key (instead of 'foo=\"bar\"', just use 'foo')."
    			},
    			$$inline: true
    		});

    	const hint1 = new Hint({
    			props: {
    				info: "This attribute is optional.This attribute needs no value, just the key (instead of 'foo=\"bar\"', just use 'foo')."
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t0 = text("disabled ");
    			create_component(hint0.$$.fragment);
    			br0 = element("br");
    			t1 = text("\nchecked ");
    			create_component(hint1.$$.fragment);
    			br1 = element("br");
    			t2 = space();
    			add_location(br0, file$w, 14, 146, 6687);
    			add_location(br1, file$w, 15, 145, 6837);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			mount_component(hint0, target, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(hint1, target, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t2, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hint0.$$.fragment, local);
    			transition_in(hint1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hint0.$$.fragment, local);
    			transition_out(hint1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			destroy_component(hint0, detaching);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			destroy_component(hint1, detaching);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_175.name,
    		type: "slot",
    		source: "(14:1377) <Code>",
    		ctx
    	});

    	return block;
    }

    // (14:1346) <TextBlock title="Parameters:">
    function create_default_slot_174(ctx) {
    	let current;

    	const code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_175] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(code.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const code_changes = {};

    			if (changed.$$scope) {
    				code_changes.$$scope = { changed, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_174.name,
    		type: "slot",
    		source: "(14:1346) <TextBlock title=\\\"Parameters:\\\">",
    		ctx
    	});

    	return block;
    }

    // (17:48) <CheckBox>
    function create_default_slot_173(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Default unchecked");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_173.name,
    		type: "slot",
    		source: "(17:48) <CheckBox>",
    		ctx
    	});

    	return block;
    }

    // (17:86) <CheckBox checked>
    function create_default_slot_172(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Default checked");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_172.name,
    		type: "slot",
    		source: "(17:86) <CheckBox checked>",
    		ctx
    	});

    	return block;
    }

    // (17:134) <CheckBox disabled>
    function create_default_slot_171(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Disabled unchecked");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_171.name,
    		type: "slot",
    		source: "(17:134) <CheckBox disabled>",
    		ctx
    	});

    	return block;
    }

    // (17:182) <CheckBox disabled checked>
    function create_default_slot_170(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Disabled checked");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_170.name,
    		type: "slot",
    		source: "(17:182) <CheckBox disabled checked>",
    		ctx
    	});

    	return block;
    }

    // (17:19) <TextBlock title="Examples:">
    function create_default_slot_169(ctx) {
    	let br;
    	let current;

    	const checkbox0 = new CheckBox({
    			props: {
    				$$slots: { default: [create_default_slot_173] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const checkbox1 = new CheckBox({
    			props: {
    				checked: true,
    				$$slots: { default: [create_default_slot_172] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const checkbox2 = new CheckBox({
    			props: {
    				disabled: true,
    				$$slots: { default: [create_default_slot_171] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const checkbox3 = new CheckBox({
    			props: {
    				disabled: true,
    				checked: true,
    				$$slots: { default: [create_default_slot_170] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(checkbox0.$$.fragment);
    			create_component(checkbox1.$$.fragment);
    			br = element("br");
    			create_component(checkbox2.$$.fragment);
    			create_component(checkbox3.$$.fragment);
    			add_location(br, file$w, 16, 130, 6972);
    		},
    		m: function mount(target, anchor) {
    			mount_component(checkbox0, target, anchor);
    			mount_component(checkbox1, target, anchor);
    			insert_dev(target, br, anchor);
    			mount_component(checkbox2, target, anchor);
    			mount_component(checkbox3, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const checkbox0_changes = {};

    			if (changed.$$scope) {
    				checkbox0_changes.$$scope = { changed, ctx };
    			}

    			checkbox0.$set(checkbox0_changes);
    			const checkbox1_changes = {};

    			if (changed.$$scope) {
    				checkbox1_changes.$$scope = { changed, ctx };
    			}

    			checkbox1.$set(checkbox1_changes);
    			const checkbox2_changes = {};

    			if (changed.$$scope) {
    				checkbox2_changes.$$scope = { changed, ctx };
    			}

    			checkbox2.$set(checkbox2_changes);
    			const checkbox3_changes = {};

    			if (changed.$$scope) {
    				checkbox3_changes.$$scope = { changed, ctx };
    			}

    			checkbox3.$set(checkbox3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(checkbox0.$$.fragment, local);
    			transition_in(checkbox1.$$.fragment, local);
    			transition_in(checkbox2.$$.fragment, local);
    			transition_in(checkbox3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(checkbox0.$$.fragment, local);
    			transition_out(checkbox1.$$.fragment, local);
    			transition_out(checkbox2.$$.fragment, local);
    			transition_out(checkbox3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(checkbox0, detaching);
    			destroy_component(checkbox1, detaching);
    			if (detaching) detach_dev(br);
    			destroy_component(checkbox2, detaching);
    			destroy_component(checkbox3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_169.name,
    		type: "slot",
    		source: "(17:19) <TextBlock title=\\\"Examples:\\\">",
    		ctx
    	});

    	return block;
    }

    // (14:1223) <Description title="About checkboxes">
    function create_default_slot_168(ctx) {
    	let current;

    	const textblock0 = new TextBlock({
    			props: {
    				title: "Syntax:",
    				$$slots: { default: [create_default_slot_176] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock1 = new TextBlock({
    			props: {
    				title: "Parameters:",
    				$$slots: { default: [create_default_slot_174] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock2 = new TextBlock({
    			props: {
    				title: "Examples:",
    				$$slots: { default: [create_default_slot_169] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(textblock0.$$.fragment);
    			create_component(textblock1.$$.fragment);
    			create_component(textblock2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textblock0, target, anchor);
    			mount_component(textblock1, target, anchor);
    			mount_component(textblock2, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const textblock0_changes = {};

    			if (changed.$$scope) {
    				textblock0_changes.$$scope = { changed, ctx };
    			}

    			textblock0.$set(textblock0_changes);
    			const textblock1_changes = {};

    			if (changed.$$scope) {
    				textblock1_changes.$$scope = { changed, ctx };
    			}

    			textblock1.$set(textblock1_changes);
    			const textblock2_changes = {};

    			if (changed.$$scope) {
    				textblock2_changes.$$scope = { changed, ctx };
    			}

    			textblock2.$set(textblock2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textblock0.$$.fragment, local);
    			transition_in(textblock1.$$.fragment, local);
    			transition_in(textblock2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textblock0.$$.fragment, local);
    			transition_out(textblock1.$$.fragment, local);
    			transition_out(textblock2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textblock0, detaching);
    			destroy_component(textblock1, detaching);
    			destroy_component(textblock2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_168.name,
    		type: "slot",
    		source: "(14:1223) <Description title=\\\"About checkboxes\\\">",
    		ctx
    	});

    	return block;
    }

    // (14:1214) <Section>
    function create_default_slot_167(ctx) {
    	let current;

    	const description = new Description({
    			props: {
    				title: "About checkboxes",
    				$$slots: { default: [create_default_slot_168] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(description.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(description, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const description_changes = {};

    			if (changed.$$scope) {
    				description_changes.$$scope = { changed, ctx };
    			}

    			description.$set(description_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(description.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(description.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(description, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_167.name,
    		type: "slot",
    		source: "(14:1214) <Section>",
    		ctx
    	});

    	return block;
    }

    // (17:272) <Title size="2">
    function create_default_slot_166(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Radio Buttons");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_166.name,
    		type: "slot",
    		source: "(17:272) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (17:359) <TextBlock>
    function create_default_slot_165(ctx) {
    	let t0;
    	let br;
    	let t1;
    	let b;

    	const block = {
    		c: function create() {
    			t0 = text("These are just checkboxes just with a slightly different style and behaviour.");
    			br = element("br");
    			t1 = space();
    			b = element("b");
    			b.textContent = "TODO Rename CheckBox to Toggle";
    			add_location(br, file$w, 16, 447, 7289);
    			set_style(b, "color", "red");
    			add_location(b, file$w, 17, 0, 7294);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, b, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(b);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_165.name,
    		type: "slot",
    		source: "(17:359) <TextBlock>",
    		ctx
    	});

    	return block;
    }

    // (18:95) <Code>
    function create_default_slot_164(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("CheckBox(type=\"radio\",name=\"[NAME]\") [TEXT]");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_164.name,
    		type: "slot",
    		source: "(18:95) <Code>",
    		ctx
    	});

    	return block;
    }

    // (18:68) <TextBlock title="Syntax:">
    function create_default_slot_163(ctx) {
    	let current;

    	const code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_164] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(code.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const code_changes = {};

    			if (changed.$$scope) {
    				code_changes.$$scope = { changed, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_163.name,
    		type: "slot",
    		source: "(18:68) <TextBlock title=\\\"Syntax:\\\">",
    		ctx
    	});

    	return block;
    }

    // (18:194) <Code>
    function create_default_slot_162(ctx) {
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let br2;
    	let t3;
    	let br3;
    	let t4;
    	let current;

    	const hint0 = new Hint({
    			props: { info: "This attribute is optional." },
    			$$inline: true
    		});

    	const hint1 = new Hint({
    			props: {
    				info: "This attribute is optional.This attribute needs no value, just the key (instead of 'foo=\"bar\"', just use 'foo')."
    			},
    			$$inline: true
    		});

    	const hint2 = new Hint({
    			props: {
    				info: "This attribute is optional.This attribute needs no value, just the key (instead of 'foo=\"bar\"', just use 'foo')."
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t0 = text("type = radio");
    			br0 = element("br");
    			t1 = text("\nname = [STRING] ");
    			create_component(hint0.$$.fragment);
    			br1 = element("br");
    			t2 = text("\ndisabled ");
    			create_component(hint1.$$.fragment);
    			br2 = element("br");
    			t3 = text("\nchecked ");
    			create_component(hint2.$$.fragment);
    			br3 = element("br");
    			t4 = space();
    			add_location(br0, file$w, 18, 12, 7507);
    			add_location(br1, file$w, 19, 58, 7570);
    			add_location(br2, file$w, 20, 146, 7721);
    			add_location(br3, file$w, 21, 145, 7871);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(hint0, target, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(hint1, target, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(hint2, target, anchor);
    			insert_dev(target, br3, anchor);
    			insert_dev(target, t4, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hint0.$$.fragment, local);
    			transition_in(hint1.$$.fragment, local);
    			transition_in(hint2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hint0.$$.fragment, local);
    			transition_out(hint1.$$.fragment, local);
    			transition_out(hint2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			destroy_component(hint0, detaching);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t2);
    			destroy_component(hint1, detaching);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t3);
    			destroy_component(hint2, detaching);
    			if (detaching) detach_dev(br3);
    			if (detaching) detach_dev(t4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_162.name,
    		type: "slot",
    		source: "(18:194) <Code>",
    		ctx
    	});

    	return block;
    }

    // (18:163) <TextBlock title="Parameters:">
    function create_default_slot_161(ctx) {
    	let current;

    	const code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_162] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(code.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const code_changes = {};

    			if (changed.$$scope) {
    				code_changes.$$scope = { changed, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_161.name,
    		type: "slot",
    		source: "(18:163) <TextBlock title=\\\"Parameters:\\\">",
    		ctx
    	});

    	return block;
    }

    // (23:48) <CheckBox type="radio" name="foo1">
    function create_default_slot_160(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Default unchecked");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_160.name,
    		type: "slot",
    		source: "(23:48) <CheckBox type=\\\"radio\\\" name=\\\"foo1\\\">",
    		ctx
    	});

    	return block;
    }

    // (23:111) <CheckBox type="radio" name="foo1" checked>
    function create_default_slot_159(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Default checked");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_159.name,
    		type: "slot",
    		source: "(23:111) <CheckBox type=\\\"radio\\\" name=\\\"foo1\\\" checked>",
    		ctx
    	});

    	return block;
    }

    // (23:184) <CheckBox type="radio" name="foo2" disabled>
    function create_default_slot_158(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Disabled unchecked");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_158.name,
    		type: "slot",
    		source: "(23:184) <CheckBox type=\\\"radio\\\" name=\\\"foo2\\\" disabled>",
    		ctx
    	});

    	return block;
    }

    // (23:257) <CheckBox type="radio" name="foo2" disabled checked>
    function create_default_slot_157(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Disabled checked");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_157.name,
    		type: "slot",
    		source: "(23:257) <CheckBox type=\\\"radio\\\" name=\\\"foo2\\\" disabled checked>",
    		ctx
    	});

    	return block;
    }

    // (23:19) <TextBlock title="Examples:">
    function create_default_slot_156(ctx) {
    	let br;
    	let current;

    	const checkbox0 = new CheckBox({
    			props: {
    				type: "radio",
    				name: "foo1",
    				$$slots: { default: [create_default_slot_160] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const checkbox1 = new CheckBox({
    			props: {
    				type: "radio",
    				name: "foo1",
    				checked: true,
    				$$slots: { default: [create_default_slot_159] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const checkbox2 = new CheckBox({
    			props: {
    				type: "radio",
    				name: "foo2",
    				disabled: true,
    				$$slots: { default: [create_default_slot_158] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const checkbox3 = new CheckBox({
    			props: {
    				type: "radio",
    				name: "foo2",
    				disabled: true,
    				checked: true,
    				$$slots: { default: [create_default_slot_157] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(checkbox0.$$.fragment);
    			create_component(checkbox1.$$.fragment);
    			br = element("br");
    			create_component(checkbox2.$$.fragment);
    			create_component(checkbox3.$$.fragment);
    			add_location(br, file$w, 22, 180, 8056);
    		},
    		m: function mount(target, anchor) {
    			mount_component(checkbox0, target, anchor);
    			mount_component(checkbox1, target, anchor);
    			insert_dev(target, br, anchor);
    			mount_component(checkbox2, target, anchor);
    			mount_component(checkbox3, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const checkbox0_changes = {};

    			if (changed.$$scope) {
    				checkbox0_changes.$$scope = { changed, ctx };
    			}

    			checkbox0.$set(checkbox0_changes);
    			const checkbox1_changes = {};

    			if (changed.$$scope) {
    				checkbox1_changes.$$scope = { changed, ctx };
    			}

    			checkbox1.$set(checkbox1_changes);
    			const checkbox2_changes = {};

    			if (changed.$$scope) {
    				checkbox2_changes.$$scope = { changed, ctx };
    			}

    			checkbox2.$set(checkbox2_changes);
    			const checkbox3_changes = {};

    			if (changed.$$scope) {
    				checkbox3_changes.$$scope = { changed, ctx };
    			}

    			checkbox3.$set(checkbox3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(checkbox0.$$.fragment, local);
    			transition_in(checkbox1.$$.fragment, local);
    			transition_in(checkbox2.$$.fragment, local);
    			transition_in(checkbox3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(checkbox0.$$.fragment, local);
    			transition_out(checkbox1.$$.fragment, local);
    			transition_out(checkbox2.$$.fragment, local);
    			transition_out(checkbox3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(checkbox0, detaching);
    			destroy_component(checkbox1, detaching);
    			if (detaching) detach_dev(br);
    			destroy_component(checkbox2, detaching);
    			destroy_component(checkbox3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_156.name,
    		type: "slot",
    		source: "(23:19) <TextBlock title=\\\"Examples:\\\">",
    		ctx
    	});

    	return block;
    }

    // (17:318) <Description title="About radio buttons">
    function create_default_slot_155(ctx) {
    	let current;

    	const textblock0 = new TextBlock({
    			props: {
    				$$slots: { default: [create_default_slot_165] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock1 = new TextBlock({
    			props: {
    				title: "Syntax:",
    				$$slots: { default: [create_default_slot_163] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock2 = new TextBlock({
    			props: {
    				title: "Parameters:",
    				$$slots: { default: [create_default_slot_161] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock3 = new TextBlock({
    			props: {
    				title: "Examples:",
    				$$slots: { default: [create_default_slot_156] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(textblock0.$$.fragment);
    			create_component(textblock1.$$.fragment);
    			create_component(textblock2.$$.fragment);
    			create_component(textblock3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textblock0, target, anchor);
    			mount_component(textblock1, target, anchor);
    			mount_component(textblock2, target, anchor);
    			mount_component(textblock3, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const textblock0_changes = {};

    			if (changed.$$scope) {
    				textblock0_changes.$$scope = { changed, ctx };
    			}

    			textblock0.$set(textblock0_changes);
    			const textblock1_changes = {};

    			if (changed.$$scope) {
    				textblock1_changes.$$scope = { changed, ctx };
    			}

    			textblock1.$set(textblock1_changes);
    			const textblock2_changes = {};

    			if (changed.$$scope) {
    				textblock2_changes.$$scope = { changed, ctx };
    			}

    			textblock2.$set(textblock2_changes);
    			const textblock3_changes = {};

    			if (changed.$$scope) {
    				textblock3_changes.$$scope = { changed, ctx };
    			}

    			textblock3.$set(textblock3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textblock0.$$.fragment, local);
    			transition_in(textblock1.$$.fragment, local);
    			transition_in(textblock2.$$.fragment, local);
    			transition_in(textblock3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textblock0.$$.fragment, local);
    			transition_out(textblock1.$$.fragment, local);
    			transition_out(textblock2.$$.fragment, local);
    			transition_out(textblock3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textblock0, detaching);
    			destroy_component(textblock1, detaching);
    			destroy_component(textblock2, detaching);
    			destroy_component(textblock3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_155.name,
    		type: "slot",
    		source: "(17:318) <Description title=\\\"About radio buttons\\\">",
    		ctx
    	});

    	return block;
    }

    // (17:309) <Section>
    function create_default_slot_154(ctx) {
    	let current;

    	const description = new Description({
    			props: {
    				title: "About radio buttons",
    				$$slots: { default: [create_default_slot_155] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(description.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(description, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const description_changes = {};

    			if (changed.$$scope) {
    				description_changes.$$scope = { changed, ctx };
    			}

    			description.$set(description_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(description.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(description.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(description, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_154.name,
    		type: "slot",
    		source: "(17:309) <Section>",
    		ctx
    	});

    	return block;
    }

    // (23:372) <Title size="2">
    function create_default_slot_153(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Input fields");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_153.name,
    		type: "slot",
    		source: "(23:372) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (23:484) <Code>
    function create_default_slot_152(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Field(value=\"[VALUE]\",placeholder=\"[TEXT]\",type=\"[TYPE]\",disabled) [TEXT]");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_152.name,
    		type: "slot",
    		source: "(23:484) <Code>",
    		ctx
    	});

    	return block;
    }

    // (23:457) <TextBlock title="Syntax:">
    function create_default_slot_151(ctx) {
    	let current;

    	const code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_152] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(code.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const code_changes = {};

    			if (changed.$$scope) {
    				code_changes.$$scope = { changed, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_151.name,
    		type: "slot",
    		source: "(23:457) <TextBlock title=\\\"Syntax:\\\">",
    		ctx
    	});

    	return block;
    }

    // (23:613) <Code>
    function create_default_slot_150(ctx) {
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let br2;
    	let t3;
    	let br3;
    	let t4;
    	let current;

    	const hint0 = new Hint({
    			props: { info: "This attribute is optional." },
    			$$inline: true
    		});

    	const hint1 = new Hint({
    			props: { info: "This attribute is optional." },
    			$$inline: true
    		});

    	const hint2 = new Hint({
    			props: { info: "This attribute is optional." },
    			$$inline: true
    		});

    	const hint3 = new Hint({
    			props: {
    				info: "This attribute is optional.This attribute needs no value, just the key (instead of 'foo=\"bar\"', just use 'foo')."
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t0 = text("type = text | password ");
    			create_component(hint0.$$.fragment);
    			br0 = element("br");
    			t1 = text("\nvalue = [STRING] ");
    			create_component(hint1.$$.fragment);
    			br1 = element("br");
    			t2 = text("\nplaceholder = [STRING] ");
    			create_component(hint2.$$.fragment);
    			br2 = element("br");
    			t3 = text("\ndisabled ");
    			create_component(hint3.$$.fragment);
    			br3 = element("br");
    			t4 = space();
    			add_location(br0, file$w, 23, 65, 8561);
    			add_location(br1, file$w, 24, 59, 8625);
    			add_location(br2, file$w, 25, 65, 8695);
    			add_location(br3, file$w, 26, 146, 8846);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			mount_component(hint0, target, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(hint1, target, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(hint2, target, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(hint3, target, anchor);
    			insert_dev(target, br3, anchor);
    			insert_dev(target, t4, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hint0.$$.fragment, local);
    			transition_in(hint1.$$.fragment, local);
    			transition_in(hint2.$$.fragment, local);
    			transition_in(hint3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hint0.$$.fragment, local);
    			transition_out(hint1.$$.fragment, local);
    			transition_out(hint2.$$.fragment, local);
    			transition_out(hint3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			destroy_component(hint0, detaching);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			destroy_component(hint1, detaching);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t2);
    			destroy_component(hint2, detaching);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t3);
    			destroy_component(hint3, detaching);
    			if (detaching) detach_dev(br3);
    			if (detaching) detach_dev(t4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_150.name,
    		type: "slot",
    		source: "(23:613) <Code>",
    		ctx
    	});

    	return block;
    }

    // (23:582) <TextBlock title="Parameters:">
    function create_default_slot_149(ctx) {
    	let current;

    	const code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_150] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(code.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const code_changes = {};

    			if (changed.$$scope) {
    				code_changes.$$scope = { changed, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_149.name,
    		type: "slot",
    		source: "(23:582) <TextBlock title=\\\"Parameters:\\\">",
    		ctx
    	});

    	return block;
    }

    // (28:19) <TextBlock title="Examples standard:">
    function create_default_slot_148(ctx) {
    	let current;
    	const field0 = new Field({ $$inline: true });

    	const field1 = new Field({
    			props: { value: "default value" },
    			$$inline: true
    		});

    	const field2 = new Field({
    			props: { placeholder: "Placeholder" },
    			$$inline: true
    		});

    	const field3 = new Field({
    			props: {
    				placeholder: "Placeholder",
    				value: "default value"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(field0.$$.fragment);
    			create_component(field1.$$.fragment);
    			create_component(field2.$$.fragment);
    			create_component(field3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(field0, target, anchor);
    			mount_component(field1, target, anchor);
    			mount_component(field2, target, anchor);
    			mount_component(field3, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(field0.$$.fragment, local);
    			transition_in(field1.$$.fragment, local);
    			transition_in(field2.$$.fragment, local);
    			transition_in(field3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(field0.$$.fragment, local);
    			transition_out(field1.$$.fragment, local);
    			transition_out(field2.$$.fragment, local);
    			transition_out(field3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(field0, detaching);
    			destroy_component(field1, detaching);
    			destroy_component(field2, detaching);
    			destroy_component(field3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_148.name,
    		type: "slot",
    		source: "(28:19) <TextBlock title=\\\"Examples standard:\\\">",
    		ctx
    	});

    	return block;
    }

    // (28:225) <TextBlock title="Examples standard, disabled:">
    function create_default_slot_147(ctx) {
    	let current;

    	const field0 = new Field({
    			props: { disabled: true },
    			$$inline: true
    		});

    	const field1 = new Field({
    			props: { disabled: true, value: "default value" },
    			$$inline: true
    		});

    	const field2 = new Field({
    			props: {
    				disabled: true,
    				placeholder: "Placeholder"
    			},
    			$$inline: true
    		});

    	const field3 = new Field({
    			props: {
    				disabled: true,
    				placeholder: "Placeholder",
    				value: "default value"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(field0.$$.fragment);
    			create_component(field1.$$.fragment);
    			create_component(field2.$$.fragment);
    			create_component(field3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(field0, target, anchor);
    			mount_component(field1, target, anchor);
    			mount_component(field2, target, anchor);
    			mount_component(field3, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(field0.$$.fragment, local);
    			transition_in(field1.$$.fragment, local);
    			transition_in(field2.$$.fragment, local);
    			transition_in(field3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(field0.$$.fragment, local);
    			transition_out(field1.$$.fragment, local);
    			transition_out(field2.$$.fragment, local);
    			transition_out(field3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(field0, detaching);
    			destroy_component(field1, detaching);
    			destroy_component(field2, detaching);
    			destroy_component(field3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_147.name,
    		type: "slot",
    		source: "(28:225) <TextBlock title=\\\"Examples standard, disabled:\\\">",
    		ctx
    	});

    	return block;
    }

    // (28:477) <TextBlock title="Password type:">
    function create_default_slot_146(ctx) {
    	let current;

    	const field0 = new Field({
    			props: { type: "password" },
    			$$inline: true
    		});

    	const field1 = new Field({
    			props: { type: "password", value: "default value" },
    			$$inline: true
    		});

    	const field2 = new Field({
    			props: {
    				type: "password",
    				placeholder: "Placeholder"
    			},
    			$$inline: true
    		});

    	const field3 = new Field({
    			props: {
    				type: "password",
    				placeholder: "Placeholder",
    				value: "default value"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(field0.$$.fragment);
    			create_component(field1.$$.fragment);
    			create_component(field2.$$.fragment);
    			create_component(field3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(field0, target, anchor);
    			mount_component(field1, target, anchor);
    			mount_component(field2, target, anchor);
    			mount_component(field3, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(field0.$$.fragment, local);
    			transition_in(field1.$$.fragment, local);
    			transition_in(field2.$$.fragment, local);
    			transition_in(field3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(field0.$$.fragment, local);
    			transition_out(field1.$$.fragment, local);
    			transition_out(field2.$$.fragment, local);
    			transition_out(field3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(field0, detaching);
    			destroy_component(field1, detaching);
    			destroy_component(field2, detaching);
    			destroy_component(field3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_146.name,
    		type: "slot",
    		source: "(28:477) <TextBlock title=\\\"Password type:\\\">",
    		ctx
    	});

    	return block;
    }

    // (28:743) <TextBlock title="Password type, disabled:">
    function create_default_slot_145(ctx) {
    	let current;

    	const field0 = new Field({
    			props: { type: "password", disabled: true },
    			$$inline: true
    		});

    	const field1 = new Field({
    			props: {
    				type: "password",
    				disabled: true,
    				value: "default value"
    			},
    			$$inline: true
    		});

    	const field2 = new Field({
    			props: {
    				type: "password",
    				disabled: true,
    				placeholder: "Placeholder"
    			},
    			$$inline: true
    		});

    	const field3 = new Field({
    			props: {
    				type: "password",
    				disabled: true,
    				placeholder: "Placeholder",
    				value: "default value"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(field0.$$.fragment);
    			create_component(field1.$$.fragment);
    			create_component(field2.$$.fragment);
    			create_component(field3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(field0, target, anchor);
    			mount_component(field1, target, anchor);
    			mount_component(field2, target, anchor);
    			mount_component(field3, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(field0.$$.fragment, local);
    			transition_in(field1.$$.fragment, local);
    			transition_in(field2.$$.fragment, local);
    			transition_in(field3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(field0.$$.fragment, local);
    			transition_out(field1.$$.fragment, local);
    			transition_out(field2.$$.fragment, local);
    			transition_out(field3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(field0, detaching);
    			destroy_component(field1, detaching);
    			destroy_component(field2, detaching);
    			destroy_component(field3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_145.name,
    		type: "slot",
    		source: "(28:743) <TextBlock title=\\\"Password type, disabled:\\\">",
    		ctx
    	});

    	return block;
    }

    // (23:417) <Description title="About input fields">
    function create_default_slot_144(ctx) {
    	let current;

    	const textblock0 = new TextBlock({
    			props: {
    				title: "Syntax:",
    				$$slots: { default: [create_default_slot_151] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock1 = new TextBlock({
    			props: {
    				title: "Parameters:",
    				$$slots: { default: [create_default_slot_149] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock2 = new TextBlock({
    			props: {
    				title: "Examples standard:",
    				$$slots: { default: [create_default_slot_148] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock3 = new TextBlock({
    			props: {
    				title: "Examples standard, disabled:",
    				$$slots: { default: [create_default_slot_147] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock4 = new TextBlock({
    			props: {
    				title: "Password type:",
    				$$slots: { default: [create_default_slot_146] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock5 = new TextBlock({
    			props: {
    				title: "Password type, disabled:",
    				$$slots: { default: [create_default_slot_145] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(textblock0.$$.fragment);
    			create_component(textblock1.$$.fragment);
    			create_component(textblock2.$$.fragment);
    			create_component(textblock3.$$.fragment);
    			create_component(textblock4.$$.fragment);
    			create_component(textblock5.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textblock0, target, anchor);
    			mount_component(textblock1, target, anchor);
    			mount_component(textblock2, target, anchor);
    			mount_component(textblock3, target, anchor);
    			mount_component(textblock4, target, anchor);
    			mount_component(textblock5, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const textblock0_changes = {};

    			if (changed.$$scope) {
    				textblock0_changes.$$scope = { changed, ctx };
    			}

    			textblock0.$set(textblock0_changes);
    			const textblock1_changes = {};

    			if (changed.$$scope) {
    				textblock1_changes.$$scope = { changed, ctx };
    			}

    			textblock1.$set(textblock1_changes);
    			const textblock2_changes = {};

    			if (changed.$$scope) {
    				textblock2_changes.$$scope = { changed, ctx };
    			}

    			textblock2.$set(textblock2_changes);
    			const textblock3_changes = {};

    			if (changed.$$scope) {
    				textblock3_changes.$$scope = { changed, ctx };
    			}

    			textblock3.$set(textblock3_changes);
    			const textblock4_changes = {};

    			if (changed.$$scope) {
    				textblock4_changes.$$scope = { changed, ctx };
    			}

    			textblock4.$set(textblock4_changes);
    			const textblock5_changes = {};

    			if (changed.$$scope) {
    				textblock5_changes.$$scope = { changed, ctx };
    			}

    			textblock5.$set(textblock5_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textblock0.$$.fragment, local);
    			transition_in(textblock1.$$.fragment, local);
    			transition_in(textblock2.$$.fragment, local);
    			transition_in(textblock3.$$.fragment, local);
    			transition_in(textblock4.$$.fragment, local);
    			transition_in(textblock5.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textblock0.$$.fragment, local);
    			transition_out(textblock1.$$.fragment, local);
    			transition_out(textblock2.$$.fragment, local);
    			transition_out(textblock3.$$.fragment, local);
    			transition_out(textblock4.$$.fragment, local);
    			transition_out(textblock5.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textblock0, detaching);
    			destroy_component(textblock1, detaching);
    			destroy_component(textblock2, detaching);
    			destroy_component(textblock3, detaching);
    			destroy_component(textblock4, detaching);
    			destroy_component(textblock5, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_144.name,
    		type: "slot",
    		source: "(23:417) <Description title=\\\"About input fields\\\">",
    		ctx
    	});

    	return block;
    }

    // (23:408) <Section>
    function create_default_slot_143(ctx) {
    	let current;

    	const description = new Description({
    			props: {
    				title: "About input fields",
    				$$slots: { default: [create_default_slot_144] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(description.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(description, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const description_changes = {};

    			if (changed.$$scope) {
    				description_changes.$$scope = { changed, ctx };
    			}

    			description.$set(description_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(description.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(description.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(description, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_143.name,
    		type: "slot",
    		source: "(23:408) <Section>",
    		ctx
    	});

    	return block;
    }

    // (28:1079) <Title size="2">
    function create_default_slot_142(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Dialogs");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_142.name,
    		type: "slot",
    		source: "(28:1079) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (29:19) <Code>
    function create_default_slot_141(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("'dialog.show'");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_141.name,
    		type: "slot",
    		source: "(29:19) <Code>",
    		ctx
    	});

    	return block;
    }

    // (28:1154) <TextBlock>
    function create_default_slot_140(ctx) {
    	let t0;
    	let b;
    	let t2;
    	let t3;
    	let current;

    	const code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_141] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t0 = text("You define just one ");
    			b = element("b");
    			b.textContent = "Dialog";
    			t2 = text("-instance in your page, the rest will happen via the\nglobal JS-function ");
    			create_component(code.$$.fragment);
    			t3 = text(" and data-attributes on the element\ntriggering that function.");
    			add_location(b, file$w, 27, 1185, 10036);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, b, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(code, target, anchor);
    			insert_dev(target, t3, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const code_changes = {};

    			if (changed.$$scope) {
    				code_changes.$$scope = { changed, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(b);
    			if (detaching) detach_dev(t2);
    			destroy_component(code, detaching);
    			if (detaching) detach_dev(t3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_140.name,
    		type: "slot",
    		source: "(28:1154) <TextBlock>",
    		ctx
    	});

    	return block;
    }

    // (30:65) <Code>
    function create_default_slot_139(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("button(on:click='{dialog.show}',data-type=\"success\",data-title=\"Title\",data-text=\"Text\")");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_139.name,
    		type: "slot",
    		source: "(30:65) <Code>",
    		ctx
    	});

    	return block;
    }

    // (30:37) <TextBlock title="Trigger:">
    function create_default_slot_138(ctx) {
    	let current;

    	const code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_139] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(code.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const code_changes = {};

    			if (changed.$$scope) {
    				code_changes.$$scope = { changed, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_138.name,
    		type: "slot",
    		source: "(30:37) <TextBlock title=\\\"Trigger:\\\">",
    		ctx
    	});

    	return block;
    }

    // (30:219) <Code>
    function create_default_slot_137(ctx) {
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let br2;
    	let t3;
    	let current;

    	const hint0 = new Hint({
    			props: { info: "This attribute is optional." },
    			$$inline: true
    		});

    	const hint1 = new Hint({
    			props: { info: "This attribute is optional." },
    			$$inline: true
    		});

    	const hint2 = new Hint({
    			props: { info: "This attribute is optional." },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t0 = text("data-type : success | error | info | confirm ");
    			create_component(hint0.$$.fragment);
    			br0 = element("br");
    			t1 = text("\ndata-title: [STRING] ");
    			create_component(hint1.$$.fragment);
    			br1 = element("br");
    			t2 = text("\ndata-text : [STRING] ");
    			create_component(hint2.$$.fragment);
    			br2 = element("br");
    			t3 = space();
    			add_location(br0, file$w, 30, 87, 10496);
    			add_location(br1, file$w, 31, 63, 10564);
    			add_location(br2, file$w, 32, 63, 10632);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			mount_component(hint0, target, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(hint1, target, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(hint2, target, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t3, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hint0.$$.fragment, local);
    			transition_in(hint1.$$.fragment, local);
    			transition_in(hint2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hint0.$$.fragment, local);
    			transition_out(hint1.$$.fragment, local);
    			transition_out(hint2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			destroy_component(hint0, detaching);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			destroy_component(hint1, detaching);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t2);
    			destroy_component(hint2, detaching);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_137.name,
    		type: "slot",
    		source: "(30:219) <Code>",
    		ctx
    	});

    	return block;
    }

    // (30:188) <TextBlock title="Parameters:">
    function create_default_slot_136(ctx) {
    	let current;

    	const code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_137] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(code.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const code_changes = {};

    			if (changed.$$scope) {
    				code_changes.$$scope = { changed, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_136.name,
    		type: "slot",
    		source: "(30:188) <TextBlock title=\\\"Parameters:\\\">",
    		ctx
    	});

    	return block;
    }

    // (34:19) <TextBlock title="Examples:">
    function create_default_slot_135(ctx) {
    	let button0;
    	let button1;
    	let button2;
    	let button3;
    	let button4;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "Show Neutral Dialog";
    			button1 = element("button");
    			button1.textContent = "Show Success Dialog";
    			button2 = element("button");
    			button2.textContent = "Show Error Dialog";
    			button3 = element("button");
    			button3.textContent = "Show Info Dialog";
    			button4 = element("button");
    			button4.textContent = "Show Confirm Dialog";
    			attr_dev(button0, "data-title", "Some title");
    			attr_dev(button0, "data-text", "Some text");
    			add_location(button0, file$w, 33, 48, 10685);
    			attr_dev(button1, "data-type", "success");
    			attr_dev(button1, "data-title", "Success :)");
    			attr_dev(button1, "data-text", "Success Text");
    			add_location(button1, file$w, 33, 155, 10792);
    			attr_dev(button2, "data-type", "error");
    			attr_dev(button2, "data-title", "Error :(");
    			attr_dev(button2, "data-text", "Success Text");
    			add_location(button2, file$w, 33, 285, 10922);
    			attr_dev(button3, "data-type", "info");
    			attr_dev(button3, "data-title", "Info!");
    			attr_dev(button3, "data-text", "Info Text");
    			add_location(button3, file$w, 33, 409, 11046);
    			attr_dev(button4, "data-type", "confirm");
    			attr_dev(button4, "data-title", "Confirm?");
    			attr_dev(button4, "data-text", "Confirm Text");
    			add_location(button4, file$w, 33, 525, 11162);

    			dispose = [
    				listen_dev(button0, "click", dialog.show, false, false, false),
    				listen_dev(button1, "click", dialog.show, false, false, false),
    				listen_dev(button2, "click", dialog.show, false, false, false),
    				listen_dev(button3, "click", dialog.show, false, false, false),
    				listen_dev(button4, "click", dialog.show, false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, button2, anchor);
    			insert_dev(target, button3, anchor);
    			insert_dev(target, button4, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(button2);
    			if (detaching) detach_dev(button3);
    			if (detaching) detach_dev(button4);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_135.name,
    		type: "slot",
    		source: "(34:19) <TextBlock title=\\\"Examples:\\\">",
    		ctx
    	});

    	return block;
    }

    // (28:1119) <Description title="About dialogs">
    function create_default_slot_134(ctx) {
    	let current;

    	const textblock0 = new TextBlock({
    			props: {
    				$$slots: { default: [create_default_slot_140] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock1 = new TextBlock({
    			props: {
    				title: "Trigger:",
    				$$slots: { default: [create_default_slot_138] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock2 = new TextBlock({
    			props: {
    				title: "Parameters:",
    				$$slots: { default: [create_default_slot_136] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock3 = new TextBlock({
    			props: {
    				title: "Examples:",
    				$$slots: { default: [create_default_slot_135] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(textblock0.$$.fragment);
    			create_component(textblock1.$$.fragment);
    			create_component(textblock2.$$.fragment);
    			create_component(textblock3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textblock0, target, anchor);
    			mount_component(textblock1, target, anchor);
    			mount_component(textblock2, target, anchor);
    			mount_component(textblock3, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const textblock0_changes = {};

    			if (changed.$$scope) {
    				textblock0_changes.$$scope = { changed, ctx };
    			}

    			textblock0.$set(textblock0_changes);
    			const textblock1_changes = {};

    			if (changed.$$scope) {
    				textblock1_changes.$$scope = { changed, ctx };
    			}

    			textblock1.$set(textblock1_changes);
    			const textblock2_changes = {};

    			if (changed.$$scope) {
    				textblock2_changes.$$scope = { changed, ctx };
    			}

    			textblock2.$set(textblock2_changes);
    			const textblock3_changes = {};

    			if (changed.$$scope) {
    				textblock3_changes.$$scope = { changed, ctx };
    			}

    			textblock3.$set(textblock3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textblock0.$$.fragment, local);
    			transition_in(textblock1.$$.fragment, local);
    			transition_in(textblock2.$$.fragment, local);
    			transition_in(textblock3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textblock0.$$.fragment, local);
    			transition_out(textblock1.$$.fragment, local);
    			transition_out(textblock2.$$.fragment, local);
    			transition_out(textblock3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textblock0, detaching);
    			destroy_component(textblock1, detaching);
    			destroy_component(textblock2, detaching);
    			destroy_component(textblock3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_134.name,
    		type: "slot",
    		source: "(28:1119) <Description title=\\\"About dialogs\\\">",
    		ctx
    	});

    	return block;
    }

    // (28:1110) <Section>
    function create_default_slot_133(ctx) {
    	let current;

    	const description = new Description({
    			props: {
    				title: "About dialogs",
    				$$slots: { default: [create_default_slot_134] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(description.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(description, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const description_changes = {};

    			if (changed.$$scope) {
    				description_changes.$$scope = { changed, ctx };
    			}

    			description.$set(description_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(description.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(description.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(description, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_133.name,
    		type: "slot",
    		source: "(28:1110) <Section>",
    		ctx
    	});

    	return block;
    }

    // (34:689) <Title size="2">
    function create_default_slot_132(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Notifications");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_132.name,
    		type: "slot",
    		source: "(34:689) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (35:19) <Code>
    function create_default_slot_131(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("'notification.show'");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_131.name,
    		type: "slot",
    		source: "(35:19) <Code>",
    		ctx
    	});

    	return block;
    }

    // (34:776) <TextBlock>
    function create_default_slot_130(ctx) {
    	let t0;
    	let b;
    	let t2;
    	let t3;
    	let current;

    	const code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_131] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t0 = text("You define just ");
    			b = element("b");
    			b.textContent = "Notification";
    			t2 = text("-instances in your page, the rest will happen via the\nglobal JS-function ");
    			create_component(code.$$.fragment);
    			t3 = text(" and data-attributes on the element\ntriggering that function.");
    			add_location(b, file$w, 33, 803, 11440);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, b, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(code, target, anchor);
    			insert_dev(target, t3, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const code_changes = {};

    			if (changed.$$scope) {
    				code_changes.$$scope = { changed, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(b);
    			if (detaching) detach_dev(t2);
    			destroy_component(code, detaching);
    			if (detaching) detach_dev(t3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_130.name,
    		type: "slot",
    		source: "(34:776) <TextBlock>",
    		ctx
    	});

    	return block;
    }

    // (39:7) <Code>
    function create_default_slot_129(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("'data-floatable' ");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_129.name,
    		type: "slot",
    		source: "(39:7) <Code>",
    		ctx
    	});

    	return block;
    }

    // (36:37) <TextBlock>
    function create_default_slot_128(ctx) {
    	let t0;
    	let b0;
    	let t2;
    	let b1;
    	let t4;
    	let t5;
    	let current;

    	const code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_129] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t0 = text("Notifications can appear in two shaping: as ");
    			b0 = element("b");
    			b0.textContent = "badge";
    			t2 = text(" (default) and as ");
    			b1 = element("b");
    			b1.textContent = "floatable";
    			t4 = text("\nbox. Ideally you define just one instance of each so that you have a maximum of two in your\ndoc (or just one, if you only need one type). Which notification is triggered is depending\non the ");
    			create_component(code.$$.fragment);
    			t5 = text("-attribute later on.");
    			add_location(b0, file$w, 35, 92, 11692);
    			add_location(b1, file$w, 35, 122, 11722);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, b0, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, b1, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(code, target, anchor);
    			insert_dev(target, t5, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const code_changes = {};

    			if (changed.$$scope) {
    				code_changes.$$scope = { changed, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(b0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(b1);
    			if (detaching) detach_dev(t4);
    			destroy_component(code, detaching);
    			if (detaching) detach_dev(t5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_128.name,
    		type: "slot",
    		source: "(36:37) <TextBlock>",
    		ctx
    	});

    	return block;
    }

    // (39:69) <TextBlock>
    function create_default_slot_127(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("The Notification itself has an option to define its close-behaviour. You can\neither define that it should close by clicking a 'close'-icon or you\ncan define a auto-close time value (like '1s', '250ms', '2.5s', etc.)");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_127.name,
    		type: "slot",
    		source: "(39:69) <TextBlock>",
    		ctx
    	});

    	return block;
    }

    // (41:109) <Code>
    function create_default_slot_126(ctx) {
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let br2;
    	let t3;

    	const block = {
    		c: function create() {
    			t0 = text("Notification(close='click')");
    			br0 = element("br");
    			t1 = text("\nNotification(close='[FLOAT|INT](ms|s)')");
    			br1 = element("br");
    			t2 = text("\nNotification(close='click',floatable)");
    			br2 = element("br");
    			t3 = text("\nNotification(close='[FLOAT|INT](ms|s)',floatable)\n");
    			add_location(br0, file$w, 41, 27, 12291);
    			add_location(br1, file$w, 42, 39, 12335);
    			add_location(br2, file$w, 43, 37, 12377);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t3, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_126.name,
    		type: "slot",
    		source: "(41:109) <Code>",
    		ctx
    	});

    	return block;
    }

    // (41:81) <TextBlock title="Options:">
    function create_default_slot_125(ctx) {
    	let current;

    	const code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_126] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(code.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const code_changes = {};

    			if (changed.$$scope) {
    				code_changes.$$scope = { changed, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_125.name,
    		type: "slot",
    		source: "(41:81) <TextBlock title=\\\"Options:\\\">",
    		ctx
    	});

    	return block;
    }

    // (46:47) <Code>
    function create_default_slot_124(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("button(on:click='{notification.show}',data-type=\"success\",data-title=\"Title\",data-text=\"Text\",data-floatable)");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_124.name,
    		type: "slot",
    		source: "(46:47) <Code>",
    		ctx
    	});

    	return block;
    }

    // (46:19) <TextBlock title="Trigger:">
    function create_default_slot_123(ctx) {
    	let current;

    	const code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_124] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(code.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const code_changes = {};

    			if (changed.$$scope) {
    				code_changes.$$scope = { changed, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_123.name,
    		type: "slot",
    		source: "(46:19) <TextBlock title=\\\"Trigger:\\\">",
    		ctx
    	});

    	return block;
    }

    // (46:222) <Code>
    function create_default_slot_122(ctx) {
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let br2;
    	let t3;
    	let br3;
    	let t4;
    	let current;

    	const hint0 = new Hint({
    			props: { info: "This attribute is optional." },
    			$$inline: true
    		});

    	const hint1 = new Hint({
    			props: { info: "This attribute is optional." },
    			$$inline: true
    		});

    	const hint2 = new Hint({
    			props: { info: "This attribute is optional." },
    			$$inline: true
    		});

    	const hint3 = new Hint({
    			props: {
    				info: "This attribute is optional.This attribute needs no value, just the key (instead of 'foo=\"bar\"', just use 'foo')."
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t0 = text("data-type     : success | error | info | confirm ");
    			create_component(hint0.$$.fragment);
    			br0 = element("br");
    			t1 = text("\ndata-title    : [STRING] ");
    			create_component(hint1.$$.fragment);
    			br1 = element("br");
    			t2 = text("\ndata-text     : [STRING] ");
    			create_component(hint2.$$.fragment);
    			br2 = element("br");
    			t3 = text("\ndata-floatable ");
    			create_component(hint3.$$.fragment);
    			br3 = element("br");
    			t4 = space();
    			add_location(br0, file$w, 46, 91, 12752);
    			add_location(br1, file$w, 47, 67, 12824);
    			add_location(br2, file$w, 48, 67, 12896);
    			add_location(br3, file$w, 49, 152, 13053);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			mount_component(hint0, target, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(hint1, target, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(hint2, target, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(hint3, target, anchor);
    			insert_dev(target, br3, anchor);
    			insert_dev(target, t4, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hint0.$$.fragment, local);
    			transition_in(hint1.$$.fragment, local);
    			transition_in(hint2.$$.fragment, local);
    			transition_in(hint3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hint0.$$.fragment, local);
    			transition_out(hint1.$$.fragment, local);
    			transition_out(hint2.$$.fragment, local);
    			transition_out(hint3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			destroy_component(hint0, detaching);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			destroy_component(hint1, detaching);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t2);
    			destroy_component(hint2, detaching);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t3);
    			destroy_component(hint3, detaching);
    			if (detaching) detach_dev(br3);
    			if (detaching) detach_dev(t4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_122.name,
    		type: "slot",
    		source: "(46:222) <Code>",
    		ctx
    	});

    	return block;
    }

    // (46:191) <TextBlock title="Parameters:">
    function create_default_slot_121(ctx) {
    	let current;

    	const code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_122] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(code.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const code_changes = {};

    			if (changed.$$scope) {
    				code_changes.$$scope = { changed, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_121.name,
    		type: "slot",
    		source: "(46:191) <TextBlock title=\\\"Parameters:\\\">",
    		ctx
    	});

    	return block;
    }

    // (51:19) <TextBlock title="Examples for badge notification:">
    function create_default_slot_120(ctx) {
    	let button0;
    	let button1;
    	let button2;
    	let button3;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "Show Success Badge Notification";
    			button1 = element("button");
    			button1.textContent = "Show Error Badge Notification";
    			button2 = element("button");
    			button2.textContent = "Show Info Badge Notification";
    			button3 = element("button");
    			button3.textContent = "Show Confirm Badge Notification";
    			attr_dev(button0, "data-type", "success");
    			attr_dev(button0, "data-title", "Success :)");
    			attr_dev(button0, "data-text", "Success Text");
    			add_location(button0, file$w, 50, 71, 13129);
    			attr_dev(button1, "data-type", "error");
    			attr_dev(button1, "data-title", "Error :(");
    			attr_dev(button1, "data-text", "Error Text");
    			add_location(button1, file$w, 50, 219, 13277);
    			attr_dev(button2, "data-type", "info");
    			attr_dev(button2, "data-title", "Info!");
    			attr_dev(button2, "data-text", "Info Text");
    			add_location(button2, file$w, 50, 359, 13417);
    			attr_dev(button3, "data-type", "confirm");
    			attr_dev(button3, "data-title", "Confirm?");
    			attr_dev(button3, "data-text", "Confirm Text");
    			add_location(button3, file$w, 50, 493, 13551);

    			dispose = [
    				listen_dev(button0, "click", notification.show, false, false, false),
    				listen_dev(button1, "click", notification.show, false, false, false),
    				listen_dev(button2, "click", notification.show, false, false, false),
    				listen_dev(button3, "click", notification.show, false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, button2, anchor);
    			insert_dev(target, button3, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(button2);
    			if (detaching) detach_dev(button3);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_120.name,
    		type: "slot",
    		source: "(51:19) <TextBlock title=\\\"Examples for badge notification:\\\">",
    		ctx
    	});

    	return block;
    }

    // (51:651) <TextBlock title="Examples for floatable notification:">
    function create_default_slot_119(ctx) {
    	let button0;
    	let button1;
    	let button2;
    	let button3;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "Show Success Floatable Notification";
    			button1 = element("button");
    			button1.textContent = "Show Error Floatable Notification";
    			button2 = element("button");
    			button2.textContent = "Show Info Floatable Notification";
    			button3 = element("button");
    			button3.textContent = "Show Confirm Floatable Notification";
    			attr_dev(button0, "data-floatable", "");
    			attr_dev(button0, "data-type", "success");
    			attr_dev(button0, "data-title", "Success floatable :)");
    			attr_dev(button0, "data-text", "Success Floatable Text");
    			add_location(button0, file$w, 50, 707, 13765);
    			attr_dev(button1, "data-floatable", "");
    			attr_dev(button1, "data-type", "error");
    			attr_dev(button1, "data-title", "Error floatable :(");
    			attr_dev(button1, "data-text", "Error Floatable Text");
    			add_location(button1, file$w, 50, 894, 13952);
    			attr_dev(button2, "data-floatable", "");
    			attr_dev(button2, "data-type", "info");
    			attr_dev(button2, "data-title", "Info floatable!");
    			attr_dev(button2, "data-text", "Info Floatable Text");
    			add_location(button2, file$w, 50, 1073, 14131);
    			attr_dev(button3, "data-floatable", "");
    			attr_dev(button3, "data-type", "confirm");
    			attr_dev(button3, "data-title", "Confirm floatable?");
    			attr_dev(button3, "data-text", "Confirm Floatable Text");
    			add_location(button3, file$w, 50, 1246, 14304);

    			dispose = [
    				listen_dev(button0, "click", notification.show, false, false, false),
    				listen_dev(button1, "click", notification.show, false, false, false),
    				listen_dev(button2, "click", notification.show, false, false, false),
    				listen_dev(button3, "click", notification.show, false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, button2, anchor);
    			insert_dev(target, button3, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(button2);
    			if (detaching) detach_dev(button3);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_119.name,
    		type: "slot",
    		source: "(51:651) <TextBlock title=\\\"Examples for floatable notification:\\\">",
    		ctx
    	});

    	return block;
    }

    // (34:735) <Description title="About notifications">
    function create_default_slot_118(ctx) {
    	let current;

    	const textblock0 = new TextBlock({
    			props: {
    				$$slots: { default: [create_default_slot_130] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock1 = new TextBlock({
    			props: {
    				$$slots: { default: [create_default_slot_128] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock2 = new TextBlock({
    			props: {
    				$$slots: { default: [create_default_slot_127] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock3 = new TextBlock({
    			props: {
    				title: "Options:",
    				$$slots: { default: [create_default_slot_125] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock4 = new TextBlock({
    			props: {
    				title: "Trigger:",
    				$$slots: { default: [create_default_slot_123] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock5 = new TextBlock({
    			props: {
    				title: "Parameters:",
    				$$slots: { default: [create_default_slot_121] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock6 = new TextBlock({
    			props: {
    				title: "Examples for badge notification:",
    				$$slots: { default: [create_default_slot_120] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock7 = new TextBlock({
    			props: {
    				title: "Examples for floatable notification:",
    				$$slots: { default: [create_default_slot_119] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(textblock0.$$.fragment);
    			create_component(textblock1.$$.fragment);
    			create_component(textblock2.$$.fragment);
    			create_component(textblock3.$$.fragment);
    			create_component(textblock4.$$.fragment);
    			create_component(textblock5.$$.fragment);
    			create_component(textblock6.$$.fragment);
    			create_component(textblock7.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textblock0, target, anchor);
    			mount_component(textblock1, target, anchor);
    			mount_component(textblock2, target, anchor);
    			mount_component(textblock3, target, anchor);
    			mount_component(textblock4, target, anchor);
    			mount_component(textblock5, target, anchor);
    			mount_component(textblock6, target, anchor);
    			mount_component(textblock7, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const textblock0_changes = {};

    			if (changed.$$scope) {
    				textblock0_changes.$$scope = { changed, ctx };
    			}

    			textblock0.$set(textblock0_changes);
    			const textblock1_changes = {};

    			if (changed.$$scope) {
    				textblock1_changes.$$scope = { changed, ctx };
    			}

    			textblock1.$set(textblock1_changes);
    			const textblock2_changes = {};

    			if (changed.$$scope) {
    				textblock2_changes.$$scope = { changed, ctx };
    			}

    			textblock2.$set(textblock2_changes);
    			const textblock3_changes = {};

    			if (changed.$$scope) {
    				textblock3_changes.$$scope = { changed, ctx };
    			}

    			textblock3.$set(textblock3_changes);
    			const textblock4_changes = {};

    			if (changed.$$scope) {
    				textblock4_changes.$$scope = { changed, ctx };
    			}

    			textblock4.$set(textblock4_changes);
    			const textblock5_changes = {};

    			if (changed.$$scope) {
    				textblock5_changes.$$scope = { changed, ctx };
    			}

    			textblock5.$set(textblock5_changes);
    			const textblock6_changes = {};

    			if (changed.$$scope) {
    				textblock6_changes.$$scope = { changed, ctx };
    			}

    			textblock6.$set(textblock6_changes);
    			const textblock7_changes = {};

    			if (changed.$$scope) {
    				textblock7_changes.$$scope = { changed, ctx };
    			}

    			textblock7.$set(textblock7_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textblock0.$$.fragment, local);
    			transition_in(textblock1.$$.fragment, local);
    			transition_in(textblock2.$$.fragment, local);
    			transition_in(textblock3.$$.fragment, local);
    			transition_in(textblock4.$$.fragment, local);
    			transition_in(textblock5.$$.fragment, local);
    			transition_in(textblock6.$$.fragment, local);
    			transition_in(textblock7.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textblock0.$$.fragment, local);
    			transition_out(textblock1.$$.fragment, local);
    			transition_out(textblock2.$$.fragment, local);
    			transition_out(textblock3.$$.fragment, local);
    			transition_out(textblock4.$$.fragment, local);
    			transition_out(textblock5.$$.fragment, local);
    			transition_out(textblock6.$$.fragment, local);
    			transition_out(textblock7.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textblock0, detaching);
    			destroy_component(textblock1, detaching);
    			destroy_component(textblock2, detaching);
    			destroy_component(textblock3, detaching);
    			destroy_component(textblock4, detaching);
    			destroy_component(textblock5, detaching);
    			destroy_component(textblock6, detaching);
    			destroy_component(textblock7, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_118.name,
    		type: "slot",
    		source: "(34:735) <Description title=\\\"About notifications\\\">",
    		ctx
    	});

    	return block;
    }

    // (34:726) <Section>
    function create_default_slot_117(ctx) {
    	let current;

    	const description = new Description({
    			props: {
    				title: "About notifications",
    				$$slots: { default: [create_default_slot_118] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(description.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(description, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const description_changes = {};

    			if (changed.$$scope) {
    				description_changes.$$scope = { changed, ctx };
    			}

    			description.$set(description_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(description.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(description.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(description, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_117.name,
    		type: "slot",
    		source: "(34:726) <Section>",
    		ctx
    	});

    	return block;
    }

    // (51:1467) <Title size="3">
    function create_default_slot_116(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Grid");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_116.name,
    		type: "slot",
    		source: "(51:1467) <Title size=\\\"3\\\">",
    		ctx
    	});

    	return block;
    }

    // (51:1536) <TextBlock>
    function create_default_slot_115(ctx) {
    	let t0;
    	let b;
    	let t2;

    	const block = {
    		c: function create() {
    			t0 = text("A grid based on ");
    			b = element("b");
    			b.textContent = "Tile";
    			t2 = text("s which can recive a width/height (based on cells from this grid)\nand which keep their original defined aspect ratio even at resizing.");
    			add_location(b, file$w, 50, 1563, 14621);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, b, anchor);
    			insert_dev(target, t2, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(b);
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_115.name,
    		type: "slot",
    		source: "(51:1536) <TextBlock>",
    		ctx
    	});

    	return block;
    }

    // (52:270) <Label>
    function create_default_slot_114(ctx) {
    	let t_value = ctx.image.desc + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_114.name,
    		type: "slot",
    		source: "(52:270) <Label>",
    		ctx
    	});

    	return block;
    }

    // (52:261) <Overlay>
    function create_default_slot_113(ctx) {
    	let a;
    	let current;

    	const label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_114] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const icon = new Icon({ props: { icon: "help" }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    			a = element("a");
    			create_component(icon.$$.fragment);
    			attr_dev(a, "href", "foo");
    			set_style(a, "pointer-events", "all");
    			add_location(a, file$w, 51, 297, 14995);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			insert_dev(target, a, anchor);
    			mount_component(icon, a, null);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const label_changes = {};

    			if (changed.$$scope) {
    				label_changes.$$scope = { changed, ctx };
    			}

    			label.$set(label_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    			if (detaching) detach_dev(a);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_113.name,
    		type: "slot",
    		source: "(52:261) <Overlay>",
    		ctx
    	});

    	return block;
    }

    // (52:138) <Tile width="{image.width}" height="{image.height}" gap="{gridGap}">
    function create_default_slot_112(ctx) {
    	let current;

    	const image = new Image_1({
    			props: {
    				url: ctx.image.url,
    				focal: ctx.image.focal
    			},
    			$$inline: true
    		});

    	const overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_113] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(image.$$.fragment);
    			create_component(overlay.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(image, target, anchor);
    			mount_component(overlay, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const overlay_changes = {};

    			if (changed.$$scope) {
    				overlay_changes.$$scope = { changed, ctx };
    			}

    			overlay.$set(overlay_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(image.$$.fragment, local);
    			transition_in(overlay.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(image.$$.fragment, local);
    			transition_out(overlay.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(image, detaching);
    			destroy_component(overlay, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_112.name,
    		type: "slot",
    		source: "(52:138) <Tile width=\\\"{image.width}\\\" height=\\\"{image.height}\\\" gap=\\\"{gridGap}\\\">",
    		ctx
    	});

    	return block;
    }

    // (52:115) {#each images as image}
    function create_each_block_1(ctx) {
    	let current;

    	const tile = new Tile({
    			props: {
    				width: ctx.image.width,
    				height: ctx.image.height,
    				gap: gridGap,
    				$$slots: { default: [create_default_slot_112] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tile.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tile, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const tile_changes = {};

    			if (changed.$$scope) {
    				tile_changes.$$scope = { changed, ctx };
    			}

    			tile.$set(tile_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tile.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tile.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tile, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(52:115) {#each images as image}",
    		ctx
    	});

    	return block;
    }

    // (52:614) <Label>
    function create_default_slot_111(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Click to flip");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_111.name,
    		type: "slot",
    		source: "(52:614) <Label>",
    		ctx
    	});

    	return block;
    }

    // (52:605) <Overlay>
    function create_default_slot_110(ctx) {
    	let a;
    	let current;

    	const label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_111] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const icon = new Icon({ props: { icon: "help" }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    			a = element("a");
    			create_component(icon.$$.fragment);
    			attr_dev(a, "href", "foo");
    			set_style(a, "pointer-events", "all");
    			add_location(a, file$w, 51, 642, 15340);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			insert_dev(target, a, anchor);
    			mount_component(icon, a, null);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const label_changes = {};

    			if (changed.$$scope) {
    				label_changes.$$scope = { changed, ctx };
    			}

    			label.$set(label_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    			if (detaching) detach_dev(a);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_110.name,
    		type: "slot",
    		source: "(52:605) <Overlay>",
    		ctx
    	});

    	return block;
    }

    // (52:461) <div class="wrapper" slot="front" style="box-shadow:0 10px 20px rgba(0,0,0,.25)">
    function create_front_slot_3(ctx) {
    	let div;
    	let current;

    	const image = new Image_1({
    			props: {
    				url: ctx.images[0].url,
    				focal: ctx.images[0].focal
    			},
    			$$inline: true
    		});

    	const overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_110] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(image.$$.fragment);
    			create_component(overlay.$$.fragment);
    			attr_dev(div, "class", "wrapper");
    			attr_dev(div, "slot", "front");
    			set_style(div, "box-shadow", "0 10px 20px rgba(0,0,0,.25)");
    			add_location(div, file$w, 51, 461, 15159);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(image, div, null);
    			mount_component(overlay, div, null);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const overlay_changes = {};

    			if (changed.$$scope) {
    				overlay_changes.$$scope = { changed, ctx };
    			}

    			overlay.$set(overlay_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(image.$$.fragment, local);
    			transition_in(overlay.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(image.$$.fragment, local);
    			transition_out(overlay.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(image);
    			destroy_component(overlay);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_front_slot_3.name,
    		type: "slot",
    		source: "(52:461) <div class=\\\"wrapper\\\" slot=\\\"front\\\" style=\\\"box-shadow:0 10px 20px rgba(0,0,0,.25)\\\">",
    		ctx
    	});

    	return block;
    }

    // (52:845) <Article title="Image Title">
    function create_default_slot_109(ctx) {
    	let t0_value = ctx.images[0].desc + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = text(" (Click to flip back)");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_109.name,
    		type: "slot",
    		source: "(52:845) <Article title=\\\"Image Title\\\">",
    		ctx
    	});

    	return block;
    }

    // (52:729) <div class="wrapper" slot="back" style="padding:1em;box-shadow:0 10px 20px rgba(0,0,0,.25);background-color: #ddd;">
    function create_back_slot_3(ctx) {
    	let div;
    	let current;

    	const article = new Article({
    			props: {
    				title: "Image Title",
    				$$slots: { default: [create_default_slot_109] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(article.$$.fragment);
    			attr_dev(div, "class", "wrapper");
    			attr_dev(div, "slot", "back");
    			set_style(div, "padding", "1em");
    			set_style(div, "box-shadow", "0 10px 20px rgba(0,0,0,.25)");
    			set_style(div, "background-color", "#ddd");
    			add_location(div, file$w, 51, 729, 15427);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(article, div, null);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const article_changes = {};

    			if (changed.$$scope) {
    				article_changes.$$scope = { changed, ctx };
    			}

    			article.$set(article_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(article.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(article.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(article);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_back_slot_3.name,
    		type: "slot",
    		source: "(52:729) <div class=\\\"wrapper\\\" slot=\\\"back\\\" style=\\\"padding:1em;box-shadow:0 10px 20px rgba(0,0,0,.25);background-color: #ddd;\\\">",
    		ctx
    	});

    	return block;
    }

    // (52:450) <FlipPanel>
    function create_default_slot_108(ctx) {

    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_108.name,
    		type: "slot",
    		source: "(52:450) <FlipPanel>",
    		ctx
    	});

    	return block;
    }

    // (52:392) <Tile width="6" height="3" clip="{false}" gap="{gridGap}">
    function create_default_slot_107(ctx) {
    	let current;

    	const flippanel = new FlipPanel({
    			props: {
    				$$slots: {
    					default: [create_default_slot_108],
    					back: [create_back_slot_3],
    					front: [create_front_slot_3]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(flippanel.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(flippanel, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const flippanel_changes = {};

    			if (changed.$$scope) {
    				flippanel_changes.$$scope = { changed, ctx };
    			}

    			flippanel.$set(flippanel_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(flippanel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(flippanel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(flippanel, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_107.name,
    		type: "slot",
    		source: "(52:392) <Tile width=\\\"6\\\" height=\\\"3\\\" clip=\\\"{false}\\\" gap=\\\"{gridGap}\\\">",
    		ctx
    	});

    	return block;
    }

    // (52:1168) <Label>
    function create_default_slot_106(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Click to flip");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_106.name,
    		type: "slot",
    		source: "(52:1168) <Label>",
    		ctx
    	});

    	return block;
    }

    // (52:1159) <Overlay>
    function create_default_slot_105(ctx) {
    	let a;
    	let current;

    	const label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_106] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const icon = new Icon({ props: { icon: "help" }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    			a = element("a");
    			create_component(icon.$$.fragment);
    			attr_dev(a, "href", "foo");
    			set_style(a, "pointer-events", "all");
    			add_location(a, file$w, 51, 1196, 15894);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			insert_dev(target, a, anchor);
    			mount_component(icon, a, null);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const label_changes = {};

    			if (changed.$$scope) {
    				label_changes.$$scope = { changed, ctx };
    			}

    			label.$set(label_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    			if (detaching) detach_dev(a);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_105.name,
    		type: "slot",
    		source: "(52:1159) <Overlay>",
    		ctx
    	});

    	return block;
    }

    // (52:1015) <div class="wrapper" slot="front" style="box-shadow:0 10px 20px rgba(0,0,0,.25)">
    function create_front_slot_2(ctx) {
    	let div;
    	let current;

    	const image = new Image_1({
    			props: {
    				url: ctx.images[1].url,
    				focal: ctx.images[1].focal
    			},
    			$$inline: true
    		});

    	const overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_105] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(image.$$.fragment);
    			create_component(overlay.$$.fragment);
    			attr_dev(div, "class", "wrapper");
    			attr_dev(div, "slot", "front");
    			set_style(div, "box-shadow", "0 10px 20px rgba(0,0,0,.25)");
    			add_location(div, file$w, 51, 1015, 15713);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(image, div, null);
    			mount_component(overlay, div, null);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const overlay_changes = {};

    			if (changed.$$scope) {
    				overlay_changes.$$scope = { changed, ctx };
    			}

    			overlay.$set(overlay_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(image.$$.fragment, local);
    			transition_in(overlay.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(image.$$.fragment, local);
    			transition_out(overlay.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(image);
    			destroy_component(overlay);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_front_slot_2.name,
    		type: "slot",
    		source: "(52:1015) <div class=\\\"wrapper\\\" slot=\\\"front\\\" style=\\\"box-shadow:0 10px 20px rgba(0,0,0,.25)\\\">",
    		ctx
    	});

    	return block;
    }

    // (52:1399) <Article title="Image Title">
    function create_default_slot_104(ctx) {
    	let t0_value = ctx.images[1].desc + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = text(" (Click to flip back)");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_104.name,
    		type: "slot",
    		source: "(52:1399) <Article title=\\\"Image Title\\\">",
    		ctx
    	});

    	return block;
    }

    // (52:1283) <div class="wrapper" slot="back" style="padding:1em;box-shadow:0 10px 20px rgba(0,0,0,.25);background-color: #ddd;">
    function create_back_slot_2(ctx) {
    	let div;
    	let current;

    	const article = new Article({
    			props: {
    				title: "Image Title",
    				$$slots: { default: [create_default_slot_104] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(article.$$.fragment);
    			attr_dev(div, "class", "wrapper");
    			attr_dev(div, "slot", "back");
    			set_style(div, "padding", "1em");
    			set_style(div, "box-shadow", "0 10px 20px rgba(0,0,0,.25)");
    			set_style(div, "background-color", "#ddd");
    			add_location(div, file$w, 51, 1283, 15981);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(article, div, null);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const article_changes = {};

    			if (changed.$$scope) {
    				article_changes.$$scope = { changed, ctx };
    			}

    			article.$set(article_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(article.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(article.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(article);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_back_slot_2.name,
    		type: "slot",
    		source: "(52:1283) <div class=\\\"wrapper\\\" slot=\\\"back\\\" style=\\\"padding:1em;box-shadow:0 10px 20px rgba(0,0,0,.25);background-color: #ddd;\\\">",
    		ctx
    	});

    	return block;
    }

    // (52:1004) <FlipPanel>
    function create_default_slot_103(ctx) {

    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_103.name,
    		type: "slot",
    		source: "(52:1004) <FlipPanel>",
    		ctx
    	});

    	return block;
    }

    // (52:946) <Tile width="6" height="3" clip="{false}" gap="{gridGap}">
    function create_default_slot_102(ctx) {
    	let current;

    	const flippanel = new FlipPanel({
    			props: {
    				$$slots: {
    					default: [create_default_slot_103],
    					back: [create_back_slot_2],
    					front: [create_front_slot_2]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(flippanel.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(flippanel, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const flippanel_changes = {};

    			if (changed.$$scope) {
    				flippanel_changes.$$scope = { changed, ctx };
    			}

    			flippanel.$set(flippanel_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(flippanel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(flippanel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(flippanel, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_102.name,
    		type: "slot",
    		source: "(52:946) <Tile width=\\\"6\\\" height=\\\"3\\\" clip=\\\"{false}\\\" gap=\\\"{gridGap}\\\">",
    		ctx
    	});

    	return block;
    }

    // (52:109) <Grid>
    function create_default_slot_101(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_1 = ctx.images;
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const tile0 = new Tile({
    			props: {
    				width: "6",
    				height: "3",
    				clip: false,
    				gap: gridGap,
    				$$slots: { default: [create_default_slot_107] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const tile1 = new Tile({
    			props: {
    				width: "6",
    				height: "3",
    				clip: false,
    				gap: gridGap,
    				$$slots: { default: [create_default_slot_102] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			create_component(tile0.$$.fragment);
    			create_component(tile1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			mount_component(tile0, target, anchor);
    			mount_component(tile1, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (changed.images || changed.gridGap) {
    				each_value_1 = ctx.images;
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			const tile0_changes = {};

    			if (changed.$$scope) {
    				tile0_changes.$$scope = { changed, ctx };
    			}

    			tile0.$set(tile0_changes);
    			const tile1_changes = {};

    			if (changed.$$scope) {
    				tile1_changes.$$scope = { changed, ctx };
    			}

    			tile1.$set(tile1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(tile0.$$.fragment, local);
    			transition_in(tile1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(tile0.$$.fragment, local);
    			transition_out(tile1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    			destroy_component(tile0, detaching);
    			destroy_component(tile1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_101.name,
    		type: "slot",
    		source: "(52:109) <Grid>",
    		ctx
    	});

    	return block;
    }

    // (52:80) <TextBlock title="Examples:">
    function create_default_slot_100(ctx) {
    	let current;

    	const grid = new Grid({
    			props: {
    				$$slots: { default: [create_default_slot_101] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(grid.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(grid, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const grid_changes = {};

    			if (changed.$$scope) {
    				grid_changes.$$scope = { changed, ctx };
    			}

    			grid.$set(grid_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(grid.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(grid.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(grid, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_100.name,
    		type: "slot",
    		source: "(52:80) <TextBlock title=\\\"Examples:\\\">",
    		ctx
    	});

    	return block;
    }

    // (51:1504) <Description title="About grid">
    function create_default_slot_99(ctx) {
    	let current;

    	const textblock0 = new TextBlock({
    			props: {
    				$$slots: { default: [create_default_slot_115] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock1 = new TextBlock({
    			props: {
    				title: "Examples:",
    				$$slots: { default: [create_default_slot_100] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(textblock0.$$.fragment);
    			create_component(textblock1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textblock0, target, anchor);
    			mount_component(textblock1, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const textblock0_changes = {};

    			if (changed.$$scope) {
    				textblock0_changes.$$scope = { changed, ctx };
    			}

    			textblock0.$set(textblock0_changes);
    			const textblock1_changes = {};

    			if (changed.$$scope) {
    				textblock1_changes.$$scope = { changed, ctx };
    			}

    			textblock1.$set(textblock1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textblock0.$$.fragment, local);
    			transition_in(textblock1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textblock0.$$.fragment, local);
    			transition_out(textblock1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textblock0, detaching);
    			destroy_component(textblock1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_99.name,
    		type: "slot",
    		source: "(51:1504) <Description title=\\\"About grid\\\">",
    		ctx
    	});

    	return block;
    }

    // (51:1495) <Section>
    function create_default_slot_98(ctx) {
    	let current;

    	const description = new Description({
    			props: {
    				title: "About grid",
    				$$slots: { default: [create_default_slot_99] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(description.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(description, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const description_changes = {};

    			if (changed.$$scope) {
    				description_changes.$$scope = { changed, ctx };
    			}

    			description.$set(description_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(description.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(description.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(description, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_98.name,
    		type: "slot",
    		source: "(51:1495) <Section>",
    		ctx
    	});

    	return block;
    }

    // (52:1543) <Title size="2">
    function create_default_slot_97(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Articles");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_97.name,
    		type: "slot",
    		source: "(52:1543) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (52:1620) <TextBlock>
    function create_default_slot_96(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("A simple textblock cappable of showing a title and content, all with a specific style.");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_96.name,
    		type: "slot",
    		source: "(52:1620) <TextBlock>",
    		ctx
    	});

    	return block;
    }

    // (52:1757) <Code>
    function create_default_slot_95(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Article(title='My Article')\n");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_95.name,
    		type: "slot",
    		source: "(52:1757) <Code>",
    		ctx
    	});

    	return block;
    }

    // (52:1729) <TextBlock title="Options:">
    function create_default_slot_94(ctx) {
    	let current;

    	const code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_95] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(code.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const code_changes = {};

    			if (changed.$$scope) {
    				code_changes.$$scope = { changed, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_94.name,
    		type: "slot",
    		source: "(52:1729) <TextBlock title=\\\"Options:\\\">",
    		ctx
    	});

    	return block;
    }

    // (54:50) <Code>
    function create_default_slot_93(ctx) {
    	let t0;
    	let br;
    	let t1;
    	let current;

    	const hint = new Hint({
    			props: { info: "This attribute is optional." },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t0 = text("title: [STRING] ");
    			create_component(hint.$$.fragment);
    			br = element("br");
    			t1 = space();
    			add_location(br, file$w, 54, 58, 16605);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			mount_component(hint, target, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t1, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hint.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hint.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			destroy_component(hint, detaching);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_93.name,
    		type: "slot",
    		source: "(54:50) <Code>",
    		ctx
    	});

    	return block;
    }

    // (54:19) <TextBlock title="Parameters:">
    function create_default_slot_92(ctx) {
    	let current;

    	const code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_93] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(code.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const code_changes = {};

    			if (changed.$$scope) {
    				code_changes.$$scope = { changed, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_92.name,
    		type: "slot",
    		source: "(54:19) <TextBlock title=\\\"Parameters:\\\">",
    		ctx
    	});

    	return block;
    }

    // (56:48) <Article title="First Article">
    function create_default_slot_91(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Some article text.");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_91.name,
    		type: "slot",
    		source: "(56:48) <Article title=\\\"First Article\\\">",
    		ctx
    	});

    	return block;
    }

    // (56:19) <TextBlock title="Examples:">
    function create_default_slot_90(ctx) {
    	let current;

    	const article = new Article({
    			props: {
    				title: "First Article",
    				$$slots: { default: [create_default_slot_91] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(article.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(article, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const article_changes = {};

    			if (changed.$$scope) {
    				article_changes.$$scope = { changed, ctx };
    			}

    			article.$set(article_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(article.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(article.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(article, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_90.name,
    		type: "slot",
    		source: "(56:19) <TextBlock title=\\\"Examples:\\\">",
    		ctx
    	});

    	return block;
    }

    // (52:1584) <Description title="About articles">
    function create_default_slot_89(ctx) {
    	let current;

    	const textblock0 = new TextBlock({
    			props: {
    				$$slots: { default: [create_default_slot_96] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock1 = new TextBlock({
    			props: {
    				title: "Options:",
    				$$slots: { default: [create_default_slot_94] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock2 = new TextBlock({
    			props: {
    				title: "Parameters:",
    				$$slots: { default: [create_default_slot_92] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock3 = new TextBlock({
    			props: {
    				title: "Examples:",
    				$$slots: { default: [create_default_slot_90] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(textblock0.$$.fragment);
    			create_component(textblock1.$$.fragment);
    			create_component(textblock2.$$.fragment);
    			create_component(textblock3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textblock0, target, anchor);
    			mount_component(textblock1, target, anchor);
    			mount_component(textblock2, target, anchor);
    			mount_component(textblock3, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const textblock0_changes = {};

    			if (changed.$$scope) {
    				textblock0_changes.$$scope = { changed, ctx };
    			}

    			textblock0.$set(textblock0_changes);
    			const textblock1_changes = {};

    			if (changed.$$scope) {
    				textblock1_changes.$$scope = { changed, ctx };
    			}

    			textblock1.$set(textblock1_changes);
    			const textblock2_changes = {};

    			if (changed.$$scope) {
    				textblock2_changes.$$scope = { changed, ctx };
    			}

    			textblock2.$set(textblock2_changes);
    			const textblock3_changes = {};

    			if (changed.$$scope) {
    				textblock3_changes.$$scope = { changed, ctx };
    			}

    			textblock3.$set(textblock3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textblock0.$$.fragment, local);
    			transition_in(textblock1.$$.fragment, local);
    			transition_in(textblock2.$$.fragment, local);
    			transition_in(textblock3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textblock0.$$.fragment, local);
    			transition_out(textblock1.$$.fragment, local);
    			transition_out(textblock2.$$.fragment, local);
    			transition_out(textblock3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textblock0, detaching);
    			destroy_component(textblock1, detaching);
    			destroy_component(textblock2, detaching);
    			destroy_component(textblock3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_89.name,
    		type: "slot",
    		source: "(52:1584) <Description title=\\\"About articles\\\">",
    		ctx
    	});

    	return block;
    }

    // (52:1575) <Section>
    function create_default_slot_88(ctx) {
    	let current;

    	const description = new Description({
    			props: {
    				title: "About articles",
    				$$slots: { default: [create_default_slot_89] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(description.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(description, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const description_changes = {};

    			if (changed.$$scope) {
    				description_changes.$$scope = { changed, ctx };
    			}

    			description.$set(description_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(description.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(description.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(description, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_88.name,
    		type: "slot",
    		source: "(52:1575) <Section>",
    		ctx
    	});

    	return block;
    }

    // (56:143) <Title size="2">
    function create_default_slot_87(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Cards");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_87.name,
    		type: "slot",
    		source: "(56:143) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (56:214) <TextBlock>
    function create_default_slot_86(ctx) {
    	let t0;
    	let b;
    	let t2;
    	let a;
    	let t4;

    	const block = {
    		c: function create() {
    			t0 = text("They're based on ");
    			b = element("b");
    			b.textContent = "FlipPanel";
    			t2 = text(" with a specific style and already prepared, so all you need is\nto define the content for the front and back of the card. It uses '");
    			a = element("a");
    			a.textContent = "named slots";
    			t4 = text("'.");
    			add_location(b, file$w, 55, 242, 16852);
    			attr_dev(a, "href", "https://svelte.dev/tutorial/named-slots");
    			attr_dev(a, "target", "_blank_");
    			add_location(a, file$w, 56, 67, 16999);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, b, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, a, anchor);
    			insert_dev(target, t4, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(b);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(a);
    			if (detaching) detach_dev(t4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_86.name,
    		type: "slot",
    		source: "(56:214) <TextBlock>",
    		ctx
    	});

    	return block;
    }

    // (57:227) <div class="wrapper" slot="image">
    function create_image_slot_3(ctx) {
    	let div;
    	let current;

    	const image = new Image_1({
    			props: {
    				url: ctx.images[0].url,
    				focal: ctx.images[0].focal
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(image.$$.fragment);
    			attr_dev(div, "class", "wrapper");
    			attr_dev(div, "slot", "image");
    			add_location(div, file$w, 56, 227, 17159);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(image, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(image.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(image.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(image);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_image_slot_3.name,
    		type: "slot",
    		source: "(57:227) <div class=\\\"wrapper\\\" slot=\\\"image\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:330) <span slot="shortDesc">
    function create_shortDesc_slot_3(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Short Description";
    			attr_dev(span, "slot", "shortDesc");
    			add_location(span, file$w, 56, 330, 17262);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_shortDesc_slot_3.name,
    		type: "slot",
    		source: "(57:330) <span slot=\\\"shortDesc\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:377) <span slot="longDesc">
    function create_longDesc_slot_3(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Long Description";
    			attr_dev(span, "slot", "longDesc");
    			add_location(span, file$w, 56, 377, 17309);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_longDesc_slot_3.name,
    		type: "slot",
    		source: "(57:377) <span slot=\\\"longDesc\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:221) <Card>
    function create_default_slot_85(ctx) {

    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_85.name,
    		type: "slot",
    		source: "(57:221) <Card>",
    		ctx
    	});

    	return block;
    }

    // (57:435) <div class="wrapper" slot="image">
    function create_image_slot_2(ctx) {
    	let div;
    	let current;

    	const image = new Image_1({
    			props: {
    				url: ctx.images[1].url,
    				focal: ctx.images[1].focal
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(image.$$.fragment);
    			attr_dev(div, "class", "wrapper");
    			attr_dev(div, "slot", "image");
    			add_location(div, file$w, 56, 435, 17367);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(image, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(image.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(image.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(image);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_image_slot_2.name,
    		type: "slot",
    		source: "(57:435) <div class=\\\"wrapper\\\" slot=\\\"image\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:538) <span slot="shortDesc">
    function create_shortDesc_slot_2(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Short Description";
    			attr_dev(span, "slot", "shortDesc");
    			add_location(span, file$w, 56, 538, 17470);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_shortDesc_slot_2.name,
    		type: "slot",
    		source: "(57:538) <span slot=\\\"shortDesc\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:585) <span slot="longDesc">
    function create_longDesc_slot_2(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Long Description";
    			attr_dev(span, "slot", "longDesc");
    			add_location(span, file$w, 56, 585, 17517);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_longDesc_slot_2.name,
    		type: "slot",
    		source: "(57:585) <span slot=\\\"longDesc\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:429) <Card>
    function create_default_slot_84(ctx) {

    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_84.name,
    		type: "slot",
    		source: "(57:429) <Card>",
    		ctx
    	});

    	return block;
    }

    // (57:643) <div class="wrapper" slot="image">
    function create_image_slot_1(ctx) {
    	let div;
    	let current;

    	const image = new Image_1({
    			props: {
    				url: ctx.images[2].url,
    				focal: ctx.images[2].focal
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(image.$$.fragment);
    			attr_dev(div, "class", "wrapper");
    			attr_dev(div, "slot", "image");
    			add_location(div, file$w, 56, 643, 17575);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(image, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(image.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(image.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(image);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_image_slot_1.name,
    		type: "slot",
    		source: "(57:643) <div class=\\\"wrapper\\\" slot=\\\"image\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:746) <span slot="shortDesc">
    function create_shortDesc_slot_1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Short Description";
    			attr_dev(span, "slot", "shortDesc");
    			add_location(span, file$w, 56, 746, 17678);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_shortDesc_slot_1.name,
    		type: "slot",
    		source: "(57:746) <span slot=\\\"shortDesc\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:793) <span slot="longDesc">
    function create_longDesc_slot_1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Long Description";
    			attr_dev(span, "slot", "longDesc");
    			add_location(span, file$w, 56, 793, 17725);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_longDesc_slot_1.name,
    		type: "slot",
    		source: "(57:793) <span slot=\\\"longDesc\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:637) <Card>
    function create_default_slot_83(ctx) {

    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_83.name,
    		type: "slot",
    		source: "(57:637) <Card>",
    		ctx
    	});

    	return block;
    }

    // (57:163) <TextBlock title="Examples (click on card to flip/back):">
    function create_default_slot_82(ctx) {
    	let current;

    	const card0 = new Card({
    			props: {
    				$$slots: {
    					default: [create_default_slot_85],
    					longDesc: [create_longDesc_slot_3],
    					shortDesc: [create_shortDesc_slot_3],
    					image: [create_image_slot_3]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const card1 = new Card({
    			props: {
    				$$slots: {
    					default: [create_default_slot_84],
    					longDesc: [create_longDesc_slot_2],
    					shortDesc: [create_shortDesc_slot_2],
    					image: [create_image_slot_2]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const card2 = new Card({
    			props: {
    				$$slots: {
    					default: [create_default_slot_83],
    					longDesc: [create_longDesc_slot_1],
    					shortDesc: [create_shortDesc_slot_1],
    					image: [create_image_slot_1]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card0.$$.fragment);
    			create_component(card1.$$.fragment);
    			create_component(card2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(card0, target, anchor);
    			mount_component(card1, target, anchor);
    			mount_component(card2, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const card0_changes = {};

    			if (changed.$$scope) {
    				card0_changes.$$scope = { changed, ctx };
    			}

    			card0.$set(card0_changes);
    			const card1_changes = {};

    			if (changed.$$scope) {
    				card1_changes.$$scope = { changed, ctx };
    			}

    			card1.$set(card1_changes);
    			const card2_changes = {};

    			if (changed.$$scope) {
    				card2_changes.$$scope = { changed, ctx };
    			}

    			card2.$set(card2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card0.$$.fragment, local);
    			transition_in(card1.$$.fragment, local);
    			transition_in(card2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card0.$$.fragment, local);
    			transition_out(card1.$$.fragment, local);
    			transition_out(card2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card0, detaching);
    			destroy_component(card1, detaching);
    			destroy_component(card2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_82.name,
    		type: "slot",
    		source: "(57:163) <TextBlock title=\\\"Examples (click on card to flip/back):\\\">",
    		ctx
    	});

    	return block;
    }

    // (56:181) <Description title="About cards">
    function create_default_slot_81(ctx) {
    	let current;

    	const textblock0 = new TextBlock({
    			props: {
    				$$slots: { default: [create_default_slot_86] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock1 = new TextBlock({
    			props: {
    				title: "Examples (click on card to flip/back):",
    				$$slots: { default: [create_default_slot_82] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(textblock0.$$.fragment);
    			create_component(textblock1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textblock0, target, anchor);
    			mount_component(textblock1, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const textblock0_changes = {};

    			if (changed.$$scope) {
    				textblock0_changes.$$scope = { changed, ctx };
    			}

    			textblock0.$set(textblock0_changes);
    			const textblock1_changes = {};

    			if (changed.$$scope) {
    				textblock1_changes.$$scope = { changed, ctx };
    			}

    			textblock1.$set(textblock1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textblock0.$$.fragment, local);
    			transition_in(textblock1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textblock0.$$.fragment, local);
    			transition_out(textblock1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textblock0, detaching);
    			destroy_component(textblock1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_81.name,
    		type: "slot",
    		source: "(56:181) <Description title=\\\"About cards\\\">",
    		ctx
    	});

    	return block;
    }

    // (56:172) <Section>
    function create_default_slot_80(ctx) {
    	let current;

    	const description = new Description({
    			props: {
    				title: "About cards",
    				$$slots: { default: [create_default_slot_81] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(description.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(description, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const description_changes = {};

    			if (changed.$$scope) {
    				description_changes.$$scope = { changed, ctx };
    			}

    			description.$set(description_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(description.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(description.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(description, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_80.name,
    		type: "slot",
    		source: "(56:172) <Section>",
    		ctx
    	});

    	return block;
    }

    // (57:881) <Title size="2">
    function create_default_slot_79(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Accordion");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_79.name,
    		type: "slot",
    		source: "(57:881) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:989) <div class="wrapper" slot="image">
    function create_image_slot(ctx) {
    	let div;
    	let current;

    	const image = new Image_1({
    			props: {
    				url: ctx.images[0].url,
    				focal: ctx.images[0].focal
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(image.$$.fragment);
    			attr_dev(div, "class", "wrapper");
    			attr_dev(div, "slot", "image");
    			add_location(div, file$w, 56, 989, 17921);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(image, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(image.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(image.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(image);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_image_slot.name,
    		type: "slot",
    		source: "(57:989) <div class=\\\"wrapper\\\" slot=\\\"image\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:1092) <span slot="shortDesc">
    function create_shortDesc_slot(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Short Description";
    			attr_dev(span, "slot", "shortDesc");
    			add_location(span, file$w, 56, 1092, 18024);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_shortDesc_slot.name,
    		type: "slot",
    		source: "(57:1092) <span slot=\\\"shortDesc\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:1139) <span slot="longDesc">
    function create_longDesc_slot(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Long Description";
    			attr_dev(span, "slot", "longDesc");
    			add_location(span, file$w, 56, 1139, 18071);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_longDesc_slot.name,
    		type: "slot",
    		source: "(57:1139) <span slot=\\\"longDesc\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:983) <Card>
    function create_default_slot_78(ctx) {

    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_78.name,
    		type: "slot",
    		source: "(57:983) <Card>",
    		ctx
    	});

    	return block;
    }

    // (57:934) <AccordionEntry title="Tab 'Test Content: Card'">
    function create_default_slot_77(ctx) {
    	let current;

    	const card = new Card({
    			props: {
    				$$slots: {
    					default: [create_default_slot_78],
    					longDesc: [create_longDesc_slot],
    					shortDesc: [create_shortDesc_slot],
    					image: [create_image_slot]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const card_changes = {};

    			if (changed.$$scope) {
    				card_changes.$$scope = { changed, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_77.name,
    		type: "slot",
    		source: "(57:934) <AccordionEntry title=\\\"Tab 'Test Content: Card'\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:1418) <Label>
    function create_default_slot_76(ctx) {
    	let t_value = ctx.image.desc + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_76.name,
    		type: "slot",
    		source: "(57:1418) <Label>",
    		ctx
    	});

    	return block;
    }

    // (57:1409) <Overlay>
    function create_default_slot_75(ctx) {
    	let a;
    	let current;

    	const label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_76] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const icon = new Icon({ props: { icon: "help" }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    			a = element("a");
    			create_component(icon.$$.fragment);
    			attr_dev(a, "href", "foo");
    			set_style(a, "pointer-events", "all");
    			add_location(a, file$w, 56, 1445, 18377);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			insert_dev(target, a, anchor);
    			mount_component(icon, a, null);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const label_changes = {};

    			if (changed.$$scope) {
    				label_changes.$$scope = { changed, ctx };
    			}

    			label.$set(label_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    			if (detaching) detach_dev(a);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_75.name,
    		type: "slot",
    		source: "(57:1409) <Overlay>",
    		ctx
    	});

    	return block;
    }

    // (57:1286) <Tile width="{image.width}" height="{image.height}" gap="{gridGap}">
    function create_default_slot_74(ctx) {
    	let current;

    	const image = new Image_1({
    			props: {
    				url: ctx.image.url,
    				focal: ctx.image.focal
    			},
    			$$inline: true
    		});

    	const overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_75] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(image.$$.fragment);
    			create_component(overlay.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(image, target, anchor);
    			mount_component(overlay, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const overlay_changes = {};

    			if (changed.$$scope) {
    				overlay_changes.$$scope = { changed, ctx };
    			}

    			overlay.$set(overlay_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(image.$$.fragment, local);
    			transition_in(overlay.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(image.$$.fragment, local);
    			transition_out(overlay.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(image, detaching);
    			destroy_component(overlay, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_74.name,
    		type: "slot",
    		source: "(57:1286) <Tile width=\\\"{image.width}\\\" height=\\\"{image.height}\\\" gap=\\\"{gridGap}\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:1263) {#each images as image}
    function create_each_block$1(ctx) {
    	let current;

    	const tile = new Tile({
    			props: {
    				width: ctx.image.width,
    				height: ctx.image.height,
    				gap: gridGap,
    				$$slots: { default: [create_default_slot_74] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tile.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tile, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const tile_changes = {};

    			if (changed.$$scope) {
    				tile_changes.$$scope = { changed, ctx };
    			}

    			tile.$set(tile_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tile.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tile.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tile, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(57:1263) {#each images as image}",
    		ctx
    	});

    	return block;
    }

    // (57:1762) <Label>
    function create_default_slot_73(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Click to flip");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_73.name,
    		type: "slot",
    		source: "(57:1762) <Label>",
    		ctx
    	});

    	return block;
    }

    // (57:1753) <Overlay>
    function create_default_slot_72(ctx) {
    	let a;
    	let current;

    	const label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_73] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const icon = new Icon({ props: { icon: "help" }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    			a = element("a");
    			create_component(icon.$$.fragment);
    			attr_dev(a, "href", "foo");
    			set_style(a, "pointer-events", "all");
    			add_location(a, file$w, 56, 1790, 18722);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			insert_dev(target, a, anchor);
    			mount_component(icon, a, null);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const label_changes = {};

    			if (changed.$$scope) {
    				label_changes.$$scope = { changed, ctx };
    			}

    			label.$set(label_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    			if (detaching) detach_dev(a);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_72.name,
    		type: "slot",
    		source: "(57:1753) <Overlay>",
    		ctx
    	});

    	return block;
    }

    // (57:1609) <div class="wrapper" slot="front" style="box-shadow:0 10px 20px rgba(0,0,0,.25)">
    function create_front_slot_1(ctx) {
    	let div;
    	let current;

    	const image = new Image_1({
    			props: {
    				url: ctx.images[0].url,
    				focal: ctx.images[0].focal
    			},
    			$$inline: true
    		});

    	const overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_72] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(image.$$.fragment);
    			create_component(overlay.$$.fragment);
    			attr_dev(div, "class", "wrapper");
    			attr_dev(div, "slot", "front");
    			set_style(div, "box-shadow", "0 10px 20px rgba(0,0,0,.25)");
    			add_location(div, file$w, 56, 1609, 18541);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(image, div, null);
    			mount_component(overlay, div, null);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const overlay_changes = {};

    			if (changed.$$scope) {
    				overlay_changes.$$scope = { changed, ctx };
    			}

    			overlay.$set(overlay_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(image.$$.fragment, local);
    			transition_in(overlay.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(image.$$.fragment, local);
    			transition_out(overlay.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(image);
    			destroy_component(overlay);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_front_slot_1.name,
    		type: "slot",
    		source: "(57:1609) <div class=\\\"wrapper\\\" slot=\\\"front\\\" style=\\\"box-shadow:0 10px 20px rgba(0,0,0,.25)\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:1993) <Article title="Image Title">
    function create_default_slot_71(ctx) {
    	let t0_value = ctx.images[0].desc + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = text(" (Click to flip back)");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_71.name,
    		type: "slot",
    		source: "(57:1993) <Article title=\\\"Image Title\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:1877) <div class="wrapper" slot="back" style="padding:1em;box-shadow:0 10px 20px rgba(0,0,0,.25);background-color: #ddd;">
    function create_back_slot_1(ctx) {
    	let div;
    	let current;

    	const article = new Article({
    			props: {
    				title: "Image Title",
    				$$slots: { default: [create_default_slot_71] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(article.$$.fragment);
    			attr_dev(div, "class", "wrapper");
    			attr_dev(div, "slot", "back");
    			set_style(div, "padding", "1em");
    			set_style(div, "box-shadow", "0 10px 20px rgba(0,0,0,.25)");
    			set_style(div, "background-color", "#ddd");
    			add_location(div, file$w, 56, 1877, 18809);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(article, div, null);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const article_changes = {};

    			if (changed.$$scope) {
    				article_changes.$$scope = { changed, ctx };
    			}

    			article.$set(article_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(article.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(article.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(article);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_back_slot_1.name,
    		type: "slot",
    		source: "(57:1877) <div class=\\\"wrapper\\\" slot=\\\"back\\\" style=\\\"padding:1em;box-shadow:0 10px 20px rgba(0,0,0,.25);background-color: #ddd;\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:1598) <FlipPanel>
    function create_default_slot_70(ctx) {

    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_70.name,
    		type: "slot",
    		source: "(57:1598) <FlipPanel>",
    		ctx
    	});

    	return block;
    }

    // (57:1540) <Tile width="6" height="3" clip="{false}" gap="{gridGap}">
    function create_default_slot_69(ctx) {
    	let current;

    	const flippanel = new FlipPanel({
    			props: {
    				$$slots: {
    					default: [create_default_slot_70],
    					back: [create_back_slot_1],
    					front: [create_front_slot_1]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(flippanel.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(flippanel, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const flippanel_changes = {};

    			if (changed.$$scope) {
    				flippanel_changes.$$scope = { changed, ctx };
    			}

    			flippanel.$set(flippanel_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(flippanel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(flippanel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(flippanel, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_69.name,
    		type: "slot",
    		source: "(57:1540) <Tile width=\\\"6\\\" height=\\\"3\\\" clip=\\\"{false}\\\" gap=\\\"{gridGap}\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:2316) <Label>
    function create_default_slot_68(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Click to flip");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_68.name,
    		type: "slot",
    		source: "(57:2316) <Label>",
    		ctx
    	});

    	return block;
    }

    // (57:2307) <Overlay>
    function create_default_slot_67(ctx) {
    	let a;
    	let current;

    	const label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_68] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const icon = new Icon({ props: { icon: "help" }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    			a = element("a");
    			create_component(icon.$$.fragment);
    			attr_dev(a, "href", "foo");
    			set_style(a, "pointer-events", "all");
    			add_location(a, file$w, 56, 2344, 19276);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			insert_dev(target, a, anchor);
    			mount_component(icon, a, null);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const label_changes = {};

    			if (changed.$$scope) {
    				label_changes.$$scope = { changed, ctx };
    			}

    			label.$set(label_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    			if (detaching) detach_dev(a);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_67.name,
    		type: "slot",
    		source: "(57:2307) <Overlay>",
    		ctx
    	});

    	return block;
    }

    // (57:2163) <div class="wrapper" slot="front" style="box-shadow:0 10px 20px rgba(0,0,0,.25)">
    function create_front_slot$1(ctx) {
    	let div;
    	let current;

    	const image = new Image_1({
    			props: {
    				url: ctx.images[1].url,
    				focal: ctx.images[1].focal
    			},
    			$$inline: true
    		});

    	const overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_67] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(image.$$.fragment);
    			create_component(overlay.$$.fragment);
    			attr_dev(div, "class", "wrapper");
    			attr_dev(div, "slot", "front");
    			set_style(div, "box-shadow", "0 10px 20px rgba(0,0,0,.25)");
    			add_location(div, file$w, 56, 2163, 19095);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(image, div, null);
    			mount_component(overlay, div, null);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const overlay_changes = {};

    			if (changed.$$scope) {
    				overlay_changes.$$scope = { changed, ctx };
    			}

    			overlay.$set(overlay_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(image.$$.fragment, local);
    			transition_in(overlay.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(image.$$.fragment, local);
    			transition_out(overlay.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(image);
    			destroy_component(overlay);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_front_slot$1.name,
    		type: "slot",
    		source: "(57:2163) <div class=\\\"wrapper\\\" slot=\\\"front\\\" style=\\\"box-shadow:0 10px 20px rgba(0,0,0,.25)\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:2547) <Article title="Image Title">
    function create_default_slot_66(ctx) {
    	let t0_value = ctx.images[1].desc + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = text(" (Click to flip back)");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_66.name,
    		type: "slot",
    		source: "(57:2547) <Article title=\\\"Image Title\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:2431) <div class="wrapper" slot="back" style="padding:1em;box-shadow:0 10px 20px rgba(0,0,0,.25);background-color: #ddd;">
    function create_back_slot$1(ctx) {
    	let div;
    	let current;

    	const article = new Article({
    			props: {
    				title: "Image Title",
    				$$slots: { default: [create_default_slot_66] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(article.$$.fragment);
    			attr_dev(div, "class", "wrapper");
    			attr_dev(div, "slot", "back");
    			set_style(div, "padding", "1em");
    			set_style(div, "box-shadow", "0 10px 20px rgba(0,0,0,.25)");
    			set_style(div, "background-color", "#ddd");
    			add_location(div, file$w, 56, 2431, 19363);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(article, div, null);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const article_changes = {};

    			if (changed.$$scope) {
    				article_changes.$$scope = { changed, ctx };
    			}

    			article.$set(article_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(article.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(article.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(article);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_back_slot$1.name,
    		type: "slot",
    		source: "(57:2431) <div class=\\\"wrapper\\\" slot=\\\"back\\\" style=\\\"padding:1em;box-shadow:0 10px 20px rgba(0,0,0,.25);background-color: #ddd;\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:2152) <FlipPanel>
    function create_default_slot_65(ctx) {

    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_65.name,
    		type: "slot",
    		source: "(57:2152) <FlipPanel>",
    		ctx
    	});

    	return block;
    }

    // (57:2094) <Tile width="6" height="3" clip="{false}" gap="{gridGap}">
    function create_default_slot_64(ctx) {
    	let current;

    	const flippanel = new FlipPanel({
    			props: {
    				$$slots: {
    					default: [create_default_slot_65],
    					back: [create_back_slot$1],
    					front: [create_front_slot$1]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(flippanel.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(flippanel, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const flippanel_changes = {};

    			if (changed.$$scope) {
    				flippanel_changes.$$scope = { changed, ctx };
    			}

    			flippanel.$set(flippanel_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(flippanel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(flippanel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(flippanel, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_64.name,
    		type: "slot",
    		source: "(57:2094) <Tile width=\\\"6\\\" height=\\\"3\\\" clip=\\\"{false}\\\" gap=\\\"{gridGap}\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:1257) <Grid>
    function create_default_slot_63(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = ctx.images;
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const tile0 = new Tile({
    			props: {
    				width: "6",
    				height: "3",
    				clip: false,
    				gap: gridGap,
    				$$slots: { default: [create_default_slot_69] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const tile1 = new Tile({
    			props: {
    				width: "6",
    				height: "3",
    				clip: false,
    				gap: gridGap,
    				$$slots: { default: [create_default_slot_64] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			create_component(tile0.$$.fragment);
    			create_component(tile1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			mount_component(tile0, target, anchor);
    			mount_component(tile1, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (changed.images || changed.gridGap) {
    				each_value = ctx.images;
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			const tile0_changes = {};

    			if (changed.$$scope) {
    				tile0_changes.$$scope = { changed, ctx };
    			}

    			tile0.$set(tile0_changes);
    			const tile1_changes = {};

    			if (changed.$$scope) {
    				tile1_changes.$$scope = { changed, ctx };
    			}

    			tile1.$set(tile1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(tile0.$$.fragment, local);
    			transition_in(tile1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(tile0.$$.fragment, local);
    			transition_out(tile1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    			destroy_component(tile0, detaching);
    			destroy_component(tile1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_63.name,
    		type: "slot",
    		source: "(57:1257) <Grid>",
    		ctx
    	});

    	return block;
    }

    // (57:1208) <AccordionEntry title="Tab 'Test Content: Grid'">
    function create_default_slot_62(ctx) {
    	let current;

    	const grid = new Grid({
    			props: {
    				$$slots: { default: [create_default_slot_63] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(grid.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(grid, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const grid_changes = {};

    			if (changed.$$scope) {
    				grid_changes.$$scope = { changed, ctx };
    			}

    			grid.$set(grid_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(grid.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(grid.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(grid, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_62.name,
    		type: "slot",
    		source: "(57:1208) <AccordionEntry title=\\\"Tab 'Test Content: Grid'\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:2672) <AccordionEntry title="Tab C">
    function create_default_slot_61(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Content C");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_61.name,
    		type: "slot",
    		source: "(57:2672) <AccordionEntry title=\\\"Tab C\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:2728) <AccordionEntry title="Tab D">
    function create_default_slot_60(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Content D");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_60.name,
    		type: "slot",
    		source: "(57:2728) <AccordionEntry title=\\\"Tab D\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:2784) <AccordionEntry title="Tab E">
    function create_default_slot_59(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Content E");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_59.name,
    		type: "slot",
    		source: "(57:2784) <AccordionEntry title=\\\"Tab E\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:923) <Accordion>
    function create_default_slot_58(ctx) {
    	let current;

    	const accordionentry0 = new AccordionEntry({
    			props: {
    				title: "Tab 'Test Content: Card'",
    				$$slots: { default: [create_default_slot_77] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const accordionentry1 = new AccordionEntry({
    			props: {
    				title: "Tab 'Test Content: Grid'",
    				$$slots: { default: [create_default_slot_62] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const accordionentry2 = new AccordionEntry({
    			props: {
    				title: "Tab C",
    				$$slots: { default: [create_default_slot_61] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const accordionentry3 = new AccordionEntry({
    			props: {
    				title: "Tab D",
    				$$slots: { default: [create_default_slot_60] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const accordionentry4 = new AccordionEntry({
    			props: {
    				title: "Tab E",
    				$$slots: { default: [create_default_slot_59] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(accordionentry0.$$.fragment);
    			create_component(accordionentry1.$$.fragment);
    			create_component(accordionentry2.$$.fragment);
    			create_component(accordionentry3.$$.fragment);
    			create_component(accordionentry4.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(accordionentry0, target, anchor);
    			mount_component(accordionentry1, target, anchor);
    			mount_component(accordionentry2, target, anchor);
    			mount_component(accordionentry3, target, anchor);
    			mount_component(accordionentry4, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const accordionentry0_changes = {};

    			if (changed.$$scope) {
    				accordionentry0_changes.$$scope = { changed, ctx };
    			}

    			accordionentry0.$set(accordionentry0_changes);
    			const accordionentry1_changes = {};

    			if (changed.$$scope) {
    				accordionentry1_changes.$$scope = { changed, ctx };
    			}

    			accordionentry1.$set(accordionentry1_changes);
    			const accordionentry2_changes = {};

    			if (changed.$$scope) {
    				accordionentry2_changes.$$scope = { changed, ctx };
    			}

    			accordionentry2.$set(accordionentry2_changes);
    			const accordionentry3_changes = {};

    			if (changed.$$scope) {
    				accordionentry3_changes.$$scope = { changed, ctx };
    			}

    			accordionentry3.$set(accordionentry3_changes);
    			const accordionentry4_changes = {};

    			if (changed.$$scope) {
    				accordionentry4_changes.$$scope = { changed, ctx };
    			}

    			accordionentry4.$set(accordionentry4_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(accordionentry0.$$.fragment, local);
    			transition_in(accordionentry1.$$.fragment, local);
    			transition_in(accordionentry2.$$.fragment, local);
    			transition_in(accordionentry3.$$.fragment, local);
    			transition_in(accordionentry4.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(accordionentry0.$$.fragment, local);
    			transition_out(accordionentry1.$$.fragment, local);
    			transition_out(accordionentry2.$$.fragment, local);
    			transition_out(accordionentry3.$$.fragment, local);
    			transition_out(accordionentry4.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(accordionentry0, detaching);
    			destroy_component(accordionentry1, detaching);
    			destroy_component(accordionentry2, detaching);
    			destroy_component(accordionentry3, detaching);
    			destroy_component(accordionentry4, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_58.name,
    		type: "slot",
    		source: "(57:923) <Accordion>",
    		ctx
    	});

    	return block;
    }

    // (57:914) <Section>
    function create_default_slot_57(ctx) {
    	let current;

    	const accordion = new Accordion({
    			props: {
    				$$slots: { default: [create_default_slot_58] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(accordion.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(accordion, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const accordion_changes = {};

    			if (changed.$$scope) {
    				accordion_changes.$$scope = { changed, ctx };
    			}

    			accordion.$set(accordion_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(accordion.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(accordion.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(accordion, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_57.name,
    		type: "slot",
    		source: "(57:914) <Section>",
    		ctx
    	});

    	return block;
    }

    // (57:2862) <Title size="2">
    function create_default_slot_56(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Wiper");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_56.name,
    		type: "slot",
    		source: "(57:2862) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:2933) <TextBlock>
    function create_default_slot_55(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("A wiper is a container holding up 'pages'. When scrolling, the pages will\nbe 'wiped' to top, revealing the next page. When stopping scrolling - \nand a page is not fully shown - the wiper will automatically slide in/out\nthe best matching page in this situation.");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_55.name,
    		type: "slot",
    		source: "(57:2933) <TextBlock>",
    		ctx
    	});

    	return block;
    }

    // (60:144) <WiperPage>
    function create_default_slot_54(ctx) {
    	let current;

    	const image = new Image_1({
    			props: {
    				url: ctx.images[0].url,
    				focal: ctx.images[0].focal
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(image.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(image, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(image.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(image.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(image, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_54.name,
    		type: "slot",
    		source: "(60:144) <WiperPage>",
    		ctx
    	});

    	return block;
    }

    // (60:230) <WiperPage>
    function create_default_slot_53(ctx) {
    	let current;

    	const image = new Image_1({
    			props: {
    				url: ctx.images[1].url,
    				focal: ctx.images[1].focal
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(image.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(image, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(image.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(image.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(image, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_53.name,
    		type: "slot",
    		source: "(60:230) <WiperPage>",
    		ctx
    	});

    	return block;
    }

    // (60:316) <WiperPage>
    function create_default_slot_52(ctx) {
    	let current;

    	const image = new Image_1({
    			props: {
    				url: ctx.images[2].url,
    				focal: ctx.images[2].focal
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(image.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(image, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(image.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(image.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(image, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_52.name,
    		type: "slot",
    		source: "(60:316) <WiperPage>",
    		ctx
    	});

    	return block;
    }

    // (60:137) <Wiper>
    function create_default_slot_51(ctx) {
    	let current;

    	const wiperpage0 = new WiperPage({
    			props: {
    				$$slots: { default: [create_default_slot_54] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const wiperpage1 = new WiperPage({
    			props: {
    				$$slots: { default: [create_default_slot_53] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const wiperpage2 = new WiperPage({
    			props: {
    				$$slots: { default: [create_default_slot_52] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(wiperpage0.$$.fragment);
    			create_component(wiperpage1.$$.fragment);
    			create_component(wiperpage2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(wiperpage0, target, anchor);
    			mount_component(wiperpage1, target, anchor);
    			mount_component(wiperpage2, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const wiperpage0_changes = {};

    			if (changed.$$scope) {
    				wiperpage0_changes.$$scope = { changed, ctx };
    			}

    			wiperpage0.$set(wiperpage0_changes);
    			const wiperpage1_changes = {};

    			if (changed.$$scope) {
    				wiperpage1_changes.$$scope = { changed, ctx };
    			}

    			wiperpage1.$set(wiperpage1_changes);
    			const wiperpage2_changes = {};

    			if (changed.$$scope) {
    				wiperpage2_changes.$$scope = { changed, ctx };
    			}

    			wiperpage2.$set(wiperpage2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(wiperpage0.$$.fragment, local);
    			transition_in(wiperpage1.$$.fragment, local);
    			transition_in(wiperpage2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(wiperpage0.$$.fragment, local);
    			transition_out(wiperpage1.$$.fragment, local);
    			transition_out(wiperpage2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(wiperpage0, detaching);
    			destroy_component(wiperpage1, detaching);
    			destroy_component(wiperpage2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_51.name,
    		type: "slot",
    		source: "(60:137) <Wiper>",
    		ctx
    	});

    	return block;
    }

    // (60:53) <TextBlock title="Examples:">
    function create_default_slot_50(ctx) {
    	let div;
    	let current;

    	const wiper = new Wiper({
    			props: {
    				$$slots: { default: [create_default_slot_51] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(wiper.$$.fragment);
    			set_style(div, "position", "relative");
    			set_style(div, "width", "50vw");
    			set_style(div, "height", "50vh");
    			add_location(div, file$w, 59, 82, 20177);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(wiper, div, null);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const wiper_changes = {};

    			if (changed.$$scope) {
    				wiper_changes.$$scope = { changed, ctx };
    			}

    			wiper.$set(wiper_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(wiper.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(wiper.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(wiper);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_50.name,
    		type: "slot",
    		source: "(60:53) <TextBlock title=\\\"Examples:\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:2900) <Description title="About wiper">
    function create_default_slot_49(ctx) {
    	let current;

    	const textblock0 = new TextBlock({
    			props: {
    				$$slots: { default: [create_default_slot_55] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock1 = new TextBlock({
    			props: {
    				title: "Examples:",
    				$$slots: { default: [create_default_slot_50] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(textblock0.$$.fragment);
    			create_component(textblock1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textblock0, target, anchor);
    			mount_component(textblock1, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const textblock0_changes = {};

    			if (changed.$$scope) {
    				textblock0_changes.$$scope = { changed, ctx };
    			}

    			textblock0.$set(textblock0_changes);
    			const textblock1_changes = {};

    			if (changed.$$scope) {
    				textblock1_changes.$$scope = { changed, ctx };
    			}

    			textblock1.$set(textblock1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textblock0.$$.fragment, local);
    			transition_in(textblock1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textblock0.$$.fragment, local);
    			transition_out(textblock1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textblock0, detaching);
    			destroy_component(textblock1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_49.name,
    		type: "slot",
    		source: "(57:2900) <Description title=\\\"About wiper\\\">",
    		ctx
    	});

    	return block;
    }

    // (57:2891) <Section>
    function create_default_slot_48(ctx) {
    	let current;

    	const description = new Description({
    			props: {
    				title: "About wiper",
    				$$slots: { default: [create_default_slot_49] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(description.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(description, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const description_changes = {};

    			if (changed.$$scope) {
    				description_changes.$$scope = { changed, ctx };
    			}

    			description.$set(description_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(description.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(description.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(description, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_48.name,
    		type: "slot",
    		source: "(57:2891) <Section>",
    		ctx
    	});

    	return block;
    }

    // (60:452) <Title size="2">
    function create_default_slot_47(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("SideBar");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_47.name,
    		type: "slot",
    		source: "(60:452) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (61:49) <Code>
    function create_default_slot_46(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("'sidebar.show'");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_46.name,
    		type: "slot",
    		source: "(61:49) <Code>",
    		ctx
    	});

    	return block;
    }

    // (60:531) <TextBlock>
    function create_default_slot_45(ctx) {
    	let t0;
    	let br0;
    	let t1;
    	let t2;
    	let br1;
    	let t3;
    	let br2;
    	let t4;
    	let current;

    	const code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_46] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t0 = text("There should be just one instance of SideBar in the document.");
    			br0 = element("br");
    			t1 = text("\nWhen added you can toggle the SideBar by calling ");
    			create_component(code.$$.fragment);
    			t2 = text(".");
    			br1 = element("br");
    			t3 = text("\nAs container the SideBar can be filled with any kind of content.");
    			br2 = element("br");
    			t4 = text("\nIt'll stay fixed when scrolling.\n(Tip: click the logo in the top/left corner to open/close the sidebar)");
    			add_location(br0, file$w, 59, 603, 20698);
    			add_location(br1, file$w, 60, 77, 20780);
    			add_location(br2, file$w, 61, 64, 20849);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(code, target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t4, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const code_changes = {};

    			if (changed.$$scope) {
    				code_changes.$$scope = { changed, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			destroy_component(code, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_45.name,
    		type: "slot",
    		source: "(60:531) <TextBlock>",
    		ctx
    	});

    	return block;
    }

    // (64:110) <Code>
    function create_default_slot_44(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("button(on:click='{sidebar.show}')");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_44.name,
    		type: "slot",
    		source: "(64:110) <Code>",
    		ctx
    	});

    	return block;
    }

    // (64:82) <TextBlock title="Trigger:">
    function create_default_slot_43(ctx) {
    	let current;

    	const code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_44] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(code.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const code_changes = {};

    			if (changed.$$scope) {
    				code_changes.$$scope = { changed, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_43.name,
    		type: "slot",
    		source: "(64:82) <TextBlock title=\\\"Trigger:\\\">",
    		ctx
    	});

    	return block;
    }

    // (60:492) <Description title="About the sidebar">
    function create_default_slot_42(ctx) {
    	let current;

    	const textblock0 = new TextBlock({
    			props: {
    				$$slots: { default: [create_default_slot_45] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock1 = new TextBlock({
    			props: {
    				title: "Trigger:",
    				$$slots: { default: [create_default_slot_43] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(textblock0.$$.fragment);
    			create_component(textblock1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textblock0, target, anchor);
    			mount_component(textblock1, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const textblock0_changes = {};

    			if (changed.$$scope) {
    				textblock0_changes.$$scope = { changed, ctx };
    			}

    			textblock0.$set(textblock0_changes);
    			const textblock1_changes = {};

    			if (changed.$$scope) {
    				textblock1_changes.$$scope = { changed, ctx };
    			}

    			textblock1.$set(textblock1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textblock0.$$.fragment, local);
    			transition_in(textblock1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textblock0.$$.fragment, local);
    			transition_out(textblock1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textblock0, detaching);
    			destroy_component(textblock1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_42.name,
    		type: "slot",
    		source: "(60:492) <Description title=\\\"About the sidebar\\\">",
    		ctx
    	});

    	return block;
    }

    // (60:483) <Section>
    function create_default_slot_41(ctx) {
    	let current;

    	const description = new Description({
    			props: {
    				title: "About the sidebar",
    				$$slots: { default: [create_default_slot_42] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(description.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(description, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const description_changes = {};

    			if (changed.$$scope) {
    				description_changes.$$scope = { changed, ctx };
    			}

    			description.$set(description_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(description.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(description.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(description, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_41.name,
    		type: "slot",
    		source: "(60:483) <Section>",
    		ctx
    	});

    	return block;
    }

    // (64:202) <Title size="2">
    function create_default_slot_40(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Code");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_40.name,
    		type: "slot",
    		source: "(64:202) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (64:278) <TextBlock>
    function create_default_slot_39(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("This is a small atom to present code");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_39.name,
    		type: "slot",
    		source: "(64:278) <TextBlock>",
    		ctx
    	});

    	return block;
    }

    // (64:366) <Code>
    function create_default_slot_38(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Some test-code");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_38.name,
    		type: "slot",
    		source: "(64:366) <Code>",
    		ctx
    	});

    	return block;
    }

    // (64:337) <TextBlock title="Examples:">
    function create_default_slot_37(ctx) {
    	let current;

    	const code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_38] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(code.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(code, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const code_changes = {};

    			if (changed.$$scope) {
    				code_changes.$$scope = { changed, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(code, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_37.name,
    		type: "slot",
    		source: "(64:337) <TextBlock title=\\\"Examples:\\\">",
    		ctx
    	});

    	return block;
    }

    // (64:239) <Description title="About code-blocks">
    function create_default_slot_36(ctx) {
    	let current;

    	const textblock0 = new TextBlock({
    			props: {
    				$$slots: { default: [create_default_slot_39] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const textblock1 = new TextBlock({
    			props: {
    				title: "Examples:",
    				$$slots: { default: [create_default_slot_37] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(textblock0.$$.fragment);
    			create_component(textblock1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textblock0, target, anchor);
    			mount_component(textblock1, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const textblock0_changes = {};

    			if (changed.$$scope) {
    				textblock0_changes.$$scope = { changed, ctx };
    			}

    			textblock0.$set(textblock0_changes);
    			const textblock1_changes = {};

    			if (changed.$$scope) {
    				textblock1_changes.$$scope = { changed, ctx };
    			}

    			textblock1.$set(textblock1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textblock0.$$.fragment, local);
    			transition_in(textblock1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textblock0.$$.fragment, local);
    			transition_out(textblock1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textblock0, detaching);
    			destroy_component(textblock1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_36.name,
    		type: "slot",
    		source: "(64:239) <Description title=\\\"About code-blocks\\\">",
    		ctx
    	});

    	return block;
    }

    // (64:230) <Section>
    function create_default_slot_35(ctx) {
    	let current;

    	const description = new Description({
    			props: {
    				title: "About code-blocks",
    				$$slots: { default: [create_default_slot_36] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(description.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(description, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const description_changes = {};

    			if (changed.$$scope) {
    				description_changes.$$scope = { changed, ctx };
    			}

    			description.$set(description_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(description.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(description.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(description, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_35.name,
    		type: "slot",
    		source: "(64:230) <Section>",
    		ctx
    	});

    	return block;
    }

    // (1:2864) <PageBlock>
    function create_default_slot_34(ctx) {
    	let current;

    	const title0 = new Title({
    			props: {
    				size: "1",
    				$$slots: { default: [create_default_slot_221] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section0 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_220] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title1 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_219] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section1 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_206] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title2 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_205] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section2 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_179] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title3 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_178] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section3 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_167] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title4 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_166] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section4 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_154] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title5 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_153] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section5 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_143] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title6 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_142] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section6 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_133] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title7 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_132] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section7 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_117] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title8 = new Title({
    			props: {
    				size: "3",
    				$$slots: { default: [create_default_slot_116] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section8 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_98] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title9 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_97] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section9 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_88] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title10 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_87] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section10 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_80] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title11 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_79] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section11 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_57] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title12 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_56] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section12 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_48] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title13 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_47] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section13 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_41] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title14 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_40] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section14 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_35] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(title0.$$.fragment);
    			create_component(section0.$$.fragment);
    			create_component(title1.$$.fragment);
    			create_component(section1.$$.fragment);
    			create_component(title2.$$.fragment);
    			create_component(section2.$$.fragment);
    			create_component(title3.$$.fragment);
    			create_component(section3.$$.fragment);
    			create_component(title4.$$.fragment);
    			create_component(section4.$$.fragment);
    			create_component(title5.$$.fragment);
    			create_component(section5.$$.fragment);
    			create_component(title6.$$.fragment);
    			create_component(section6.$$.fragment);
    			create_component(title7.$$.fragment);
    			create_component(section7.$$.fragment);
    			create_component(title8.$$.fragment);
    			create_component(section8.$$.fragment);
    			create_component(title9.$$.fragment);
    			create_component(section9.$$.fragment);
    			create_component(title10.$$.fragment);
    			create_component(section10.$$.fragment);
    			create_component(title11.$$.fragment);
    			create_component(section11.$$.fragment);
    			create_component(title12.$$.fragment);
    			create_component(section12.$$.fragment);
    			create_component(title13.$$.fragment);
    			create_component(section13.$$.fragment);
    			create_component(title14.$$.fragment);
    			create_component(section14.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(title0, target, anchor);
    			mount_component(section0, target, anchor);
    			mount_component(title1, target, anchor);
    			mount_component(section1, target, anchor);
    			mount_component(title2, target, anchor);
    			mount_component(section2, target, anchor);
    			mount_component(title3, target, anchor);
    			mount_component(section3, target, anchor);
    			mount_component(title4, target, anchor);
    			mount_component(section4, target, anchor);
    			mount_component(title5, target, anchor);
    			mount_component(section5, target, anchor);
    			mount_component(title6, target, anchor);
    			mount_component(section6, target, anchor);
    			mount_component(title7, target, anchor);
    			mount_component(section7, target, anchor);
    			mount_component(title8, target, anchor);
    			mount_component(section8, target, anchor);
    			mount_component(title9, target, anchor);
    			mount_component(section9, target, anchor);
    			mount_component(title10, target, anchor);
    			mount_component(section10, target, anchor);
    			mount_component(title11, target, anchor);
    			mount_component(section11, target, anchor);
    			mount_component(title12, target, anchor);
    			mount_component(section12, target, anchor);
    			mount_component(title13, target, anchor);
    			mount_component(section13, target, anchor);
    			mount_component(title14, target, anchor);
    			mount_component(section14, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const title0_changes = {};

    			if (changed.$$scope) {
    				title0_changes.$$scope = { changed, ctx };
    			}

    			title0.$set(title0_changes);
    			const section0_changes = {};

    			if (changed.$$scope) {
    				section0_changes.$$scope = { changed, ctx };
    			}

    			section0.$set(section0_changes);
    			const title1_changes = {};

    			if (changed.$$scope) {
    				title1_changes.$$scope = { changed, ctx };
    			}

    			title1.$set(title1_changes);
    			const section1_changes = {};

    			if (changed.$$scope) {
    				section1_changes.$$scope = { changed, ctx };
    			}

    			section1.$set(section1_changes);
    			const title2_changes = {};

    			if (changed.$$scope) {
    				title2_changes.$$scope = { changed, ctx };
    			}

    			title2.$set(title2_changes);
    			const section2_changes = {};

    			if (changed.$$scope) {
    				section2_changes.$$scope = { changed, ctx };
    			}

    			section2.$set(section2_changes);
    			const title3_changes = {};

    			if (changed.$$scope) {
    				title3_changes.$$scope = { changed, ctx };
    			}

    			title3.$set(title3_changes);
    			const section3_changes = {};

    			if (changed.$$scope) {
    				section3_changes.$$scope = { changed, ctx };
    			}

    			section3.$set(section3_changes);
    			const title4_changes = {};

    			if (changed.$$scope) {
    				title4_changes.$$scope = { changed, ctx };
    			}

    			title4.$set(title4_changes);
    			const section4_changes = {};

    			if (changed.$$scope) {
    				section4_changes.$$scope = { changed, ctx };
    			}

    			section4.$set(section4_changes);
    			const title5_changes = {};

    			if (changed.$$scope) {
    				title5_changes.$$scope = { changed, ctx };
    			}

    			title5.$set(title5_changes);
    			const section5_changes = {};

    			if (changed.$$scope) {
    				section5_changes.$$scope = { changed, ctx };
    			}

    			section5.$set(section5_changes);
    			const title6_changes = {};

    			if (changed.$$scope) {
    				title6_changes.$$scope = { changed, ctx };
    			}

    			title6.$set(title6_changes);
    			const section6_changes = {};

    			if (changed.$$scope) {
    				section6_changes.$$scope = { changed, ctx };
    			}

    			section6.$set(section6_changes);
    			const title7_changes = {};

    			if (changed.$$scope) {
    				title7_changes.$$scope = { changed, ctx };
    			}

    			title7.$set(title7_changes);
    			const section7_changes = {};

    			if (changed.$$scope) {
    				section7_changes.$$scope = { changed, ctx };
    			}

    			section7.$set(section7_changes);
    			const title8_changes = {};

    			if (changed.$$scope) {
    				title8_changes.$$scope = { changed, ctx };
    			}

    			title8.$set(title8_changes);
    			const section8_changes = {};

    			if (changed.$$scope) {
    				section8_changes.$$scope = { changed, ctx };
    			}

    			section8.$set(section8_changes);
    			const title9_changes = {};

    			if (changed.$$scope) {
    				title9_changes.$$scope = { changed, ctx };
    			}

    			title9.$set(title9_changes);
    			const section9_changes = {};

    			if (changed.$$scope) {
    				section9_changes.$$scope = { changed, ctx };
    			}

    			section9.$set(section9_changes);
    			const title10_changes = {};

    			if (changed.$$scope) {
    				title10_changes.$$scope = { changed, ctx };
    			}

    			title10.$set(title10_changes);
    			const section10_changes = {};

    			if (changed.$$scope) {
    				section10_changes.$$scope = { changed, ctx };
    			}

    			section10.$set(section10_changes);
    			const title11_changes = {};

    			if (changed.$$scope) {
    				title11_changes.$$scope = { changed, ctx };
    			}

    			title11.$set(title11_changes);
    			const section11_changes = {};

    			if (changed.$$scope) {
    				section11_changes.$$scope = { changed, ctx };
    			}

    			section11.$set(section11_changes);
    			const title12_changes = {};

    			if (changed.$$scope) {
    				title12_changes.$$scope = { changed, ctx };
    			}

    			title12.$set(title12_changes);
    			const section12_changes = {};

    			if (changed.$$scope) {
    				section12_changes.$$scope = { changed, ctx };
    			}

    			section12.$set(section12_changes);
    			const title13_changes = {};

    			if (changed.$$scope) {
    				title13_changes.$$scope = { changed, ctx };
    			}

    			title13.$set(title13_changes);
    			const section13_changes = {};

    			if (changed.$$scope) {
    				section13_changes.$$scope = { changed, ctx };
    			}

    			section13.$set(section13_changes);
    			const title14_changes = {};

    			if (changed.$$scope) {
    				title14_changes.$$scope = { changed, ctx };
    			}

    			title14.$set(title14_changes);
    			const section14_changes = {};

    			if (changed.$$scope) {
    				section14_changes.$$scope = { changed, ctx };
    			}

    			section14.$set(section14_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title0.$$.fragment, local);
    			transition_in(section0.$$.fragment, local);
    			transition_in(title1.$$.fragment, local);
    			transition_in(section1.$$.fragment, local);
    			transition_in(title2.$$.fragment, local);
    			transition_in(section2.$$.fragment, local);
    			transition_in(title3.$$.fragment, local);
    			transition_in(section3.$$.fragment, local);
    			transition_in(title4.$$.fragment, local);
    			transition_in(section4.$$.fragment, local);
    			transition_in(title5.$$.fragment, local);
    			transition_in(section5.$$.fragment, local);
    			transition_in(title6.$$.fragment, local);
    			transition_in(section6.$$.fragment, local);
    			transition_in(title7.$$.fragment, local);
    			transition_in(section7.$$.fragment, local);
    			transition_in(title8.$$.fragment, local);
    			transition_in(section8.$$.fragment, local);
    			transition_in(title9.$$.fragment, local);
    			transition_in(section9.$$.fragment, local);
    			transition_in(title10.$$.fragment, local);
    			transition_in(section10.$$.fragment, local);
    			transition_in(title11.$$.fragment, local);
    			transition_in(section11.$$.fragment, local);
    			transition_in(title12.$$.fragment, local);
    			transition_in(section12.$$.fragment, local);
    			transition_in(title13.$$.fragment, local);
    			transition_in(section13.$$.fragment, local);
    			transition_in(title14.$$.fragment, local);
    			transition_in(section14.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title0.$$.fragment, local);
    			transition_out(section0.$$.fragment, local);
    			transition_out(title1.$$.fragment, local);
    			transition_out(section1.$$.fragment, local);
    			transition_out(title2.$$.fragment, local);
    			transition_out(section2.$$.fragment, local);
    			transition_out(title3.$$.fragment, local);
    			transition_out(section3.$$.fragment, local);
    			transition_out(title4.$$.fragment, local);
    			transition_out(section4.$$.fragment, local);
    			transition_out(title5.$$.fragment, local);
    			transition_out(section5.$$.fragment, local);
    			transition_out(title6.$$.fragment, local);
    			transition_out(section6.$$.fragment, local);
    			transition_out(title7.$$.fragment, local);
    			transition_out(section7.$$.fragment, local);
    			transition_out(title8.$$.fragment, local);
    			transition_out(section8.$$.fragment, local);
    			transition_out(title9.$$.fragment, local);
    			transition_out(section9.$$.fragment, local);
    			transition_out(title10.$$.fragment, local);
    			transition_out(section10.$$.fragment, local);
    			transition_out(title11.$$.fragment, local);
    			transition_out(section11.$$.fragment, local);
    			transition_out(title12.$$.fragment, local);
    			transition_out(section12.$$.fragment, local);
    			transition_out(title13.$$.fragment, local);
    			transition_out(section13.$$.fragment, local);
    			transition_out(title14.$$.fragment, local);
    			transition_out(section14.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(title0, detaching);
    			destroy_component(section0, detaching);
    			destroy_component(title1, detaching);
    			destroy_component(section1, detaching);
    			destroy_component(title2, detaching);
    			destroy_component(section2, detaching);
    			destroy_component(title3, detaching);
    			destroy_component(section3, detaching);
    			destroy_component(title4, detaching);
    			destroy_component(section4, detaching);
    			destroy_component(title5, detaching);
    			destroy_component(section5, detaching);
    			destroy_component(title6, detaching);
    			destroy_component(section6, detaching);
    			destroy_component(title7, detaching);
    			destroy_component(section7, detaching);
    			destroy_component(title8, detaching);
    			destroy_component(section8, detaching);
    			destroy_component(title9, detaching);
    			destroy_component(section9, detaching);
    			destroy_component(title10, detaching);
    			destroy_component(section10, detaching);
    			destroy_component(title11, detaching);
    			destroy_component(section11, detaching);
    			destroy_component(title12, detaching);
    			destroy_component(section12, detaching);
    			destroy_component(title13, detaching);
    			destroy_component(section13, detaching);
    			destroy_component(title14, detaching);
    			destroy_component(section14, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_34.name,
    		type: "slot",
    		source: "(1:2864) <PageBlock>",
    		ctx
    	});

    	return block;
    }

    // (64:460) <Title size="2">
    function create_default_slot_33(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Slider");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_33.name,
    		type: "slot",
    		source: "(64:460) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (64:490) <Section>
    function create_default_slot_32(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("TO BE DONE");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_32.name,
    		type: "slot",
    		source: "(64:490) <Section>",
    		ctx
    	});

    	return block;
    }

    // (64:519) <Title size="2">
    function create_default_slot_31(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Teaser");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_31.name,
    		type: "slot",
    		source: "(64:519) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (64:549) <Section>
    function create_default_slot_30(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("TO BE DONE");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_30.name,
    		type: "slot",
    		source: "(64:549) <Section>",
    		ctx
    	});

    	return block;
    }

    // (64:578) <Title size="2">
    function create_default_slot_29(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Tabbed pane");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_29.name,
    		type: "slot",
    		source: "(64:578) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (64:613) <Section>
    function create_default_slot_28(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("TO BE DONE");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_28.name,
    		type: "slot",
    		source: "(64:613) <Section>",
    		ctx
    	});

    	return block;
    }

    // (64:642) <Title size="2">
    function create_default_slot_27(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Description");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_27.name,
    		type: "slot",
    		source: "(64:642) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (64:677) <Section>
    function create_default_slot_26(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("TO BE DONE");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_26.name,
    		type: "slot",
    		source: "(64:677) <Section>",
    		ctx
    	});

    	return block;
    }

    // (64:706) <Title size="2">
    function create_default_slot_25(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Flip panel");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_25.name,
    		type: "slot",
    		source: "(64:706) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (64:740) <Section>
    function create_default_slot_24(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("TO BE DONE");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_24.name,
    		type: "slot",
    		source: "(64:740) <Section>",
    		ctx
    	});

    	return block;
    }

    // (64:769) <Title size="2">
    function create_default_slot_23(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Hint");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_23.name,
    		type: "slot",
    		source: "(64:769) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (64:797) <Section>
    function create_default_slot_22(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("TO BE DONE");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_22.name,
    		type: "slot",
    		source: "(64:797) <Section>",
    		ctx
    	});

    	return block;
    }

    // (64:826) <Title size="2">
    function create_default_slot_21(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Icon");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_21.name,
    		type: "slot",
    		source: "(64:826) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (64:854) <Section>
    function create_default_slot_20(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("TO BE DONE");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_20.name,
    		type: "slot",
    		source: "(64:854) <Section>",
    		ctx
    	});

    	return block;
    }

    // (64:883) <Title size="2">
    function create_default_slot_19(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Icon bar");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_19.name,
    		type: "slot",
    		source: "(64:883) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (64:915) <Section>
    function create_default_slot_18(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("TO BE DONE");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_18.name,
    		type: "slot",
    		source: "(64:915) <Section>",
    		ctx
    	});

    	return block;
    }

    // (64:944) <Title size="2">
    function create_default_slot_17(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Image");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_17.name,
    		type: "slot",
    		source: "(64:944) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (64:973) <Section>
    function create_default_slot_16(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("TO BE DONE");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_16.name,
    		type: "slot",
    		source: "(64:973) <Section>",
    		ctx
    	});

    	return block;
    }

    // (64:1002) <Title size="2">
    function create_default_slot_15(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Label");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_15.name,
    		type: "slot",
    		source: "(64:1002) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (64:1031) <Section>
    function create_default_slot_14(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("TO BE DONE");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_14.name,
    		type: "slot",
    		source: "(64:1031) <Section>",
    		ctx
    	});

    	return block;
    }

    // (64:1060) <Title size="2">
    function create_default_slot_13(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Notification");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_13.name,
    		type: "slot",
    		source: "(64:1060) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (64:1096) <Section>
    function create_default_slot_12(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("TO BE DONE");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_12.name,
    		type: "slot",
    		source: "(64:1096) <Section>",
    		ctx
    	});

    	return block;
    }

    // (64:1125) <Title size="2">
    function create_default_slot_11(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Overlay");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_11.name,
    		type: "slot",
    		source: "(64:1125) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (64:1156) <Section>
    function create_default_slot_10(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("TO BE DONE");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_10.name,
    		type: "slot",
    		source: "(64:1156) <Section>",
    		ctx
    	});

    	return block;
    }

    // (64:1185) <Title size="2">
    function create_default_slot_9(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Section");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_9.name,
    		type: "slot",
    		source: "(64:1185) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (64:1216) <Section>
    function create_default_slot_8(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("TO BE DONE");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_8.name,
    		type: "slot",
    		source: "(64:1216) <Section>",
    		ctx
    	});

    	return block;
    }

    // (64:1245) <Title size="2">
    function create_default_slot_7(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Text block");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7.name,
    		type: "slot",
    		source: "(64:1245) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (64:1279) <Section>
    function create_default_slot_6(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("TO BE DONE");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(64:1279) <Section>",
    		ctx
    	});

    	return block;
    }

    // (64:1308) <Title size="2">
    function create_default_slot_5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Tile");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(64:1308) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (64:1336) <Section>
    function create_default_slot_4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("TO BE DONE");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(64:1336) <Section>",
    		ctx
    	});

    	return block;
    }

    // (64:1365) <Title size="2">
    function create_default_slot_3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Page");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(64:1365) <Title size=\\\"2\\\">",
    		ctx
    	});

    	return block;
    }

    // (64:1393) <Section>
    function create_default_slot_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("TO BE DONE");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(64:1393) <Section>",
    		ctx
    	});

    	return block;
    }

    // (64:441) <PageBlock hatched>
    function create_default_slot_1(ctx) {
    	let current;

    	const title0 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_33] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section0 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_32] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title1 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_31] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section1 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_30] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title2 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_29] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section2 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_28] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title3 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_27] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section3 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_26] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title4 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_25] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section4 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_24] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title5 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_23] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section5 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_22] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title6 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_21] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section6 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_20] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title7 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_19] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section7 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_18] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title8 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_17] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section8 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_16] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title9 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_15] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section9 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_14] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title10 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_13] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section10 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_12] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title11 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_11] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section11 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_10] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title12 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section12 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title13 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section13 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title14 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section14 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const title15 = new Title({
    			props: {
    				size: "2",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const section15 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(title0.$$.fragment);
    			create_component(section0.$$.fragment);
    			create_component(title1.$$.fragment);
    			create_component(section1.$$.fragment);
    			create_component(title2.$$.fragment);
    			create_component(section2.$$.fragment);
    			create_component(title3.$$.fragment);
    			create_component(section3.$$.fragment);
    			create_component(title4.$$.fragment);
    			create_component(section4.$$.fragment);
    			create_component(title5.$$.fragment);
    			create_component(section5.$$.fragment);
    			create_component(title6.$$.fragment);
    			create_component(section6.$$.fragment);
    			create_component(title7.$$.fragment);
    			create_component(section7.$$.fragment);
    			create_component(title8.$$.fragment);
    			create_component(section8.$$.fragment);
    			create_component(title9.$$.fragment);
    			create_component(section9.$$.fragment);
    			create_component(title10.$$.fragment);
    			create_component(section10.$$.fragment);
    			create_component(title11.$$.fragment);
    			create_component(section11.$$.fragment);
    			create_component(title12.$$.fragment);
    			create_component(section12.$$.fragment);
    			create_component(title13.$$.fragment);
    			create_component(section13.$$.fragment);
    			create_component(title14.$$.fragment);
    			create_component(section14.$$.fragment);
    			create_component(title15.$$.fragment);
    			create_component(section15.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(title0, target, anchor);
    			mount_component(section0, target, anchor);
    			mount_component(title1, target, anchor);
    			mount_component(section1, target, anchor);
    			mount_component(title2, target, anchor);
    			mount_component(section2, target, anchor);
    			mount_component(title3, target, anchor);
    			mount_component(section3, target, anchor);
    			mount_component(title4, target, anchor);
    			mount_component(section4, target, anchor);
    			mount_component(title5, target, anchor);
    			mount_component(section5, target, anchor);
    			mount_component(title6, target, anchor);
    			mount_component(section6, target, anchor);
    			mount_component(title7, target, anchor);
    			mount_component(section7, target, anchor);
    			mount_component(title8, target, anchor);
    			mount_component(section8, target, anchor);
    			mount_component(title9, target, anchor);
    			mount_component(section9, target, anchor);
    			mount_component(title10, target, anchor);
    			mount_component(section10, target, anchor);
    			mount_component(title11, target, anchor);
    			mount_component(section11, target, anchor);
    			mount_component(title12, target, anchor);
    			mount_component(section12, target, anchor);
    			mount_component(title13, target, anchor);
    			mount_component(section13, target, anchor);
    			mount_component(title14, target, anchor);
    			mount_component(section14, target, anchor);
    			mount_component(title15, target, anchor);
    			mount_component(section15, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const title0_changes = {};

    			if (changed.$$scope) {
    				title0_changes.$$scope = { changed, ctx };
    			}

    			title0.$set(title0_changes);
    			const section0_changes = {};

    			if (changed.$$scope) {
    				section0_changes.$$scope = { changed, ctx };
    			}

    			section0.$set(section0_changes);
    			const title1_changes = {};

    			if (changed.$$scope) {
    				title1_changes.$$scope = { changed, ctx };
    			}

    			title1.$set(title1_changes);
    			const section1_changes = {};

    			if (changed.$$scope) {
    				section1_changes.$$scope = { changed, ctx };
    			}

    			section1.$set(section1_changes);
    			const title2_changes = {};

    			if (changed.$$scope) {
    				title2_changes.$$scope = { changed, ctx };
    			}

    			title2.$set(title2_changes);
    			const section2_changes = {};

    			if (changed.$$scope) {
    				section2_changes.$$scope = { changed, ctx };
    			}

    			section2.$set(section2_changes);
    			const title3_changes = {};

    			if (changed.$$scope) {
    				title3_changes.$$scope = { changed, ctx };
    			}

    			title3.$set(title3_changes);
    			const section3_changes = {};

    			if (changed.$$scope) {
    				section3_changes.$$scope = { changed, ctx };
    			}

    			section3.$set(section3_changes);
    			const title4_changes = {};

    			if (changed.$$scope) {
    				title4_changes.$$scope = { changed, ctx };
    			}

    			title4.$set(title4_changes);
    			const section4_changes = {};

    			if (changed.$$scope) {
    				section4_changes.$$scope = { changed, ctx };
    			}

    			section4.$set(section4_changes);
    			const title5_changes = {};

    			if (changed.$$scope) {
    				title5_changes.$$scope = { changed, ctx };
    			}

    			title5.$set(title5_changes);
    			const section5_changes = {};

    			if (changed.$$scope) {
    				section5_changes.$$scope = { changed, ctx };
    			}

    			section5.$set(section5_changes);
    			const title6_changes = {};

    			if (changed.$$scope) {
    				title6_changes.$$scope = { changed, ctx };
    			}

    			title6.$set(title6_changes);
    			const section6_changes = {};

    			if (changed.$$scope) {
    				section6_changes.$$scope = { changed, ctx };
    			}

    			section6.$set(section6_changes);
    			const title7_changes = {};

    			if (changed.$$scope) {
    				title7_changes.$$scope = { changed, ctx };
    			}

    			title7.$set(title7_changes);
    			const section7_changes = {};

    			if (changed.$$scope) {
    				section7_changes.$$scope = { changed, ctx };
    			}

    			section7.$set(section7_changes);
    			const title8_changes = {};

    			if (changed.$$scope) {
    				title8_changes.$$scope = { changed, ctx };
    			}

    			title8.$set(title8_changes);
    			const section8_changes = {};

    			if (changed.$$scope) {
    				section8_changes.$$scope = { changed, ctx };
    			}

    			section8.$set(section8_changes);
    			const title9_changes = {};

    			if (changed.$$scope) {
    				title9_changes.$$scope = { changed, ctx };
    			}

    			title9.$set(title9_changes);
    			const section9_changes = {};

    			if (changed.$$scope) {
    				section9_changes.$$scope = { changed, ctx };
    			}

    			section9.$set(section9_changes);
    			const title10_changes = {};

    			if (changed.$$scope) {
    				title10_changes.$$scope = { changed, ctx };
    			}

    			title10.$set(title10_changes);
    			const section10_changes = {};

    			if (changed.$$scope) {
    				section10_changes.$$scope = { changed, ctx };
    			}

    			section10.$set(section10_changes);
    			const title11_changes = {};

    			if (changed.$$scope) {
    				title11_changes.$$scope = { changed, ctx };
    			}

    			title11.$set(title11_changes);
    			const section11_changes = {};

    			if (changed.$$scope) {
    				section11_changes.$$scope = { changed, ctx };
    			}

    			section11.$set(section11_changes);
    			const title12_changes = {};

    			if (changed.$$scope) {
    				title12_changes.$$scope = { changed, ctx };
    			}

    			title12.$set(title12_changes);
    			const section12_changes = {};

    			if (changed.$$scope) {
    				section12_changes.$$scope = { changed, ctx };
    			}

    			section12.$set(section12_changes);
    			const title13_changes = {};

    			if (changed.$$scope) {
    				title13_changes.$$scope = { changed, ctx };
    			}

    			title13.$set(title13_changes);
    			const section13_changes = {};

    			if (changed.$$scope) {
    				section13_changes.$$scope = { changed, ctx };
    			}

    			section13.$set(section13_changes);
    			const title14_changes = {};

    			if (changed.$$scope) {
    				title14_changes.$$scope = { changed, ctx };
    			}

    			title14.$set(title14_changes);
    			const section14_changes = {};

    			if (changed.$$scope) {
    				section14_changes.$$scope = { changed, ctx };
    			}

    			section14.$set(section14_changes);
    			const title15_changes = {};

    			if (changed.$$scope) {
    				title15_changes.$$scope = { changed, ctx };
    			}

    			title15.$set(title15_changes);
    			const section15_changes = {};

    			if (changed.$$scope) {
    				section15_changes.$$scope = { changed, ctx };
    			}

    			section15.$set(section15_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title0.$$.fragment, local);
    			transition_in(section0.$$.fragment, local);
    			transition_in(title1.$$.fragment, local);
    			transition_in(section1.$$.fragment, local);
    			transition_in(title2.$$.fragment, local);
    			transition_in(section2.$$.fragment, local);
    			transition_in(title3.$$.fragment, local);
    			transition_in(section3.$$.fragment, local);
    			transition_in(title4.$$.fragment, local);
    			transition_in(section4.$$.fragment, local);
    			transition_in(title5.$$.fragment, local);
    			transition_in(section5.$$.fragment, local);
    			transition_in(title6.$$.fragment, local);
    			transition_in(section6.$$.fragment, local);
    			transition_in(title7.$$.fragment, local);
    			transition_in(section7.$$.fragment, local);
    			transition_in(title8.$$.fragment, local);
    			transition_in(section8.$$.fragment, local);
    			transition_in(title9.$$.fragment, local);
    			transition_in(section9.$$.fragment, local);
    			transition_in(title10.$$.fragment, local);
    			transition_in(section10.$$.fragment, local);
    			transition_in(title11.$$.fragment, local);
    			transition_in(section11.$$.fragment, local);
    			transition_in(title12.$$.fragment, local);
    			transition_in(section12.$$.fragment, local);
    			transition_in(title13.$$.fragment, local);
    			transition_in(section13.$$.fragment, local);
    			transition_in(title14.$$.fragment, local);
    			transition_in(section14.$$.fragment, local);
    			transition_in(title15.$$.fragment, local);
    			transition_in(section15.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title0.$$.fragment, local);
    			transition_out(section0.$$.fragment, local);
    			transition_out(title1.$$.fragment, local);
    			transition_out(section1.$$.fragment, local);
    			transition_out(title2.$$.fragment, local);
    			transition_out(section2.$$.fragment, local);
    			transition_out(title3.$$.fragment, local);
    			transition_out(section3.$$.fragment, local);
    			transition_out(title4.$$.fragment, local);
    			transition_out(section4.$$.fragment, local);
    			transition_out(title5.$$.fragment, local);
    			transition_out(section5.$$.fragment, local);
    			transition_out(title6.$$.fragment, local);
    			transition_out(section6.$$.fragment, local);
    			transition_out(title7.$$.fragment, local);
    			transition_out(section7.$$.fragment, local);
    			transition_out(title8.$$.fragment, local);
    			transition_out(section8.$$.fragment, local);
    			transition_out(title9.$$.fragment, local);
    			transition_out(section9.$$.fragment, local);
    			transition_out(title10.$$.fragment, local);
    			transition_out(section10.$$.fragment, local);
    			transition_out(title11.$$.fragment, local);
    			transition_out(section11.$$.fragment, local);
    			transition_out(title12.$$.fragment, local);
    			transition_out(section12.$$.fragment, local);
    			transition_out(title13.$$.fragment, local);
    			transition_out(section13.$$.fragment, local);
    			transition_out(title14.$$.fragment, local);
    			transition_out(section14.$$.fragment, local);
    			transition_out(title15.$$.fragment, local);
    			transition_out(section15.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(title0, detaching);
    			destroy_component(section0, detaching);
    			destroy_component(title1, detaching);
    			destroy_component(section1, detaching);
    			destroy_component(title2, detaching);
    			destroy_component(section2, detaching);
    			destroy_component(title3, detaching);
    			destroy_component(section3, detaching);
    			destroy_component(title4, detaching);
    			destroy_component(section4, detaching);
    			destroy_component(title5, detaching);
    			destroy_component(section5, detaching);
    			destroy_component(title6, detaching);
    			destroy_component(section6, detaching);
    			destroy_component(title7, detaching);
    			destroy_component(section7, detaching);
    			destroy_component(title8, detaching);
    			destroy_component(section8, detaching);
    			destroy_component(title9, detaching);
    			destroy_component(section9, detaching);
    			destroy_component(title10, detaching);
    			destroy_component(section10, detaching);
    			destroy_component(title11, detaching);
    			destroy_component(section11, detaching);
    			destroy_component(title12, detaching);
    			destroy_component(section12, detaching);
    			destroy_component(title13, detaching);
    			destroy_component(section13, detaching);
    			destroy_component(title14, detaching);
    			destroy_component(section14, detaching);
    			destroy_component(title15, detaching);
    			destroy_component(section15, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(64:441) <PageBlock hatched>",
    		ctx
    	});

    	return block;
    }

    // (1:2858) <Page>
    function create_default_slot$1(ctx) {
    	let current;

    	const pageblock0 = new PageBlock({
    			props: {
    				$$slots: { default: [create_default_slot_34] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const pageblock1 = new PageBlock({
    			props: {
    				hatched: true,
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(pageblock0.$$.fragment);
    			create_component(pageblock1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(pageblock0, target, anchor);
    			mount_component(pageblock1, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const pageblock0_changes = {};

    			if (changed.$$scope) {
    				pageblock0_changes.$$scope = { changed, ctx };
    			}

    			pageblock0.$set(pageblock0_changes);
    			const pageblock1_changes = {};

    			if (changed.$$scope) {
    				pageblock1_changes.$$scope = { changed, ctx };
    			}

    			pageblock1.$set(pageblock1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pageblock0.$$.fragment, local);
    			transition_in(pageblock1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pageblock0.$$.fragment, local);
    			transition_out(pageblock1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(pageblock0, detaching);
    			destroy_component(pageblock1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(1:2858) <Page>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$w(ctx) {
    	let current;
    	let dispose;

    	const sidebar_1 = new SideBar({
    			props: {
    				$$slots: { default: [create_default_slot_225] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const dialog_1 = new Dialog({ $$inline: true });

    	const header = new Header({
    			props: {
    				$$slots: { default: [create_default_slot_222] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const page = new Page({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(sidebar_1.$$.fragment);
    			create_component(dialog_1.$$.fragment);
    			create_component(header.$$.fragment);
    			create_component(page.$$.fragment);
    			dispose = listen_dev(window_1$2, "click", onClick, false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(sidebar_1, target, anchor);
    			mount_component(dialog_1, target, anchor);
    			mount_component(header, target, anchor);
    			mount_component(page, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const sidebar_1_changes = {};

    			if (changed.$$scope) {
    				sidebar_1_changes.$$scope = { changed, ctx };
    			}

    			sidebar_1.$set(sidebar_1_changes);
    			const header_changes = {};

    			if (changed.$$scope) {
    				header_changes.$$scope = { changed, ctx };
    			}

    			header.$set(header_changes);
    			const page_changes = {};

    			if (changed.$$scope) {
    				page_changes.$$scope = { changed, ctx };
    			}

    			page.$set(page_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebar_1.$$.fragment, local);
    			transition_in(dialog_1.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			transition_in(page.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidebar_1.$$.fragment, local);
    			transition_out(dialog_1.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			transition_out(page.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sidebar_1, detaching);
    			destroy_component(dialog_1, detaching);
    			destroy_component(header, detaching);
    			destroy_component(page, detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$w.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    let debug = true;
    let gridGap = ".5em";

    function onClick(e) {
    	if (e.ctrlKey) {
    		alert("Special");
    	}
    }

    function switchTheme(e) {
    	if (e.detail.state) {
    		document.body.classList.remove("theme--light");
    		document.body.classList.add("theme--dark");
    		console.log("dark");
    	} else {
    		document.body.classList.remove("theme--dark");
    		document.body.classList.add("theme--light");
    		console.log("light");
    	}
    }

    function instance$w($$self) {
    	window.eventBus = new EventBus();

    	let images = [
    		{
    			focal: { y: 30 },
    			desc: "Crystal",
    			width: 4,
    			height: 2,
    			url: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/389a4067-564a-4b24-a371-8799dc5d668e/ddkr6rp-baa0678d-d1cd-4acd-9c57-1b52473984dc.jpg/v1/fill/w_1132,h_706,q_70,strp/crystal_by_xistenceimaginations_ddkr6rp-pre.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9Nzk4IiwicGF0aCI6IlwvZlwvMzg5YTQwNjctNTY0YS00YjI0LWEzNzEtODc5OWRjNWQ2NjhlXC9kZGtyNnJwLWJhYTA2NzhkLWQxY2QtNGFjZC05YzU3LTFiNTI0NzM5ODRkYy5qcGciLCJ3aWR0aCI6Ijw9MTI4MCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.GaBz4wCgIRZxYFnSc3cNhrrTnDNDy2YYUvWcsB-lRzg"
    		},
    		{
    			desc: "Project 138",
    			width: 1,
    			height: 2,
    			url: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/389a4067-564a-4b24-a371-8799dc5d668e/ddkdpw2-7d2c202b-e322-474b-a8b1-cfd8ace25184.jpg/v1/fill/w_1280,h_2021,q_75,strp/project_138_by_xistenceimaginations_ddkdpw2-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MjAyMSIsInBhdGgiOiJcL2ZcLzM4OWE0MDY3LTU2NGEtNGIyNC1hMzcxLTg3OTlkYzVkNjY4ZVwvZGRrZHB3Mi03ZDJjMjAyYi1lMzIyLTQ3NGItYThiMS1jZmQ4YWNlMjUxODQuanBnIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.9OOsIOiBUvVKDZusMbV1YQB6X_qTWnkzVULBX6WFfc8"
    		},
    		{
    			focal: { y: 230 },
    			desc: "Desc 3",
    			width: 2,
    			height: 2,
    			url: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/389a4067-564a-4b24-a371-8799dc5d668e/ddk984l-7b153911-39c5-411d-9c55-d7ca0cf5a6e3.jpg/v1/fill/w_1280,h_2021,q_75,strp/quickpaint_12_11_2019_by_xistenceimaginations_ddk984l-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MjAyMSIsInBhdGgiOiJcL2ZcLzM4OWE0MDY3LTU2NGEtNGIyNC1hMzcxLTg3OTlkYzVkNjY4ZVwvZGRrOTg0bC03YjE1MzkxMS0zOWM1LTQxMWQtOWM1NS1kN2NhMGNmNWE2ZTMuanBnIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.e0c7TbVXfIVD7xkQcZdPS6_AM8XGrPHgCx41r0VM_p4"
    		},
    		{
    			desc: "Desc 4",
    			width: 3,
    			height: 2,
    			url: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/389a4067-564a-4b24-a371-8799dc5d668e/ddjx64v-63cc51e4-b236-445c-b0b6-ddd9b90f10a4.jpg/v1/fill/w_1280,h_655,q_75,strp/planet_harvester_by_xistenceimaginations_ddjx64v-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9NjU1IiwicGF0aCI6IlwvZlwvMzg5YTQwNjctNTY0YS00YjI0LWEzNzEtODc5OWRjNWQ2NjhlXC9kZGp4NjR2LTYzY2M1MWU0LWIyMzYtNDQ1Yy1iMGI2LWRkZDliOTBmMTBhNC5qcGciLCJ3aWR0aCI6Ijw9MTI4MCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.Gs8ku-E3xWamViEndAbEFpeNgeMsTzvSPJa8VcHWXQU"
    		},
    		{
    			focal: { x: 130 },
    			desc: "Desc 5",
    			width: 2,
    			height: 2,
    			url: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/389a4067-564a-4b24-a371-8799dc5d668e/ddjuz4h-dcd61e2d-5f50-4187-8a57-a005a3a4af8f.jpg/v1/fill/w_1280,h_634,q_75,strp/spirit_by_xistenceimaginations_ddjuz4h-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9NjM0IiwicGF0aCI6IlwvZlwvMzg5YTQwNjctNTY0YS00YjI0LWEzNzEtODc5OWRjNWQ2NjhlXC9kZGp1ejRoLWRjZDYxZTJkLTVmNTAtNDE4Ny04YTU3LWEwMDVhM2E0YWY4Zi5qcGciLCJ3aWR0aCI6Ijw9MTI4MCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.4EF7Ph6zazjloFyoyq-Vm7AqVuU8MwHH1_03YPJWXCc"
    		},
    		{
    			desc: "Desc 6",
    			width: 2,
    			height: 3,
    			url: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/389a4067-564a-4b24-a371-8799dc5d668e/ddjiuma-bed99f1b-a69c-42c6-a31c-6aed420974fd.jpg/v1/fill/w_861,h_929,q_70,strp/peace_by_xistenceimaginations_ddjiuma-pre.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTM4MSIsInBhdGgiOiJcL2ZcLzM4OWE0MDY3LTU2NGEtNGIyNC1hMzcxLTg3OTlkYzVkNjY4ZVwvZGRqaXVtYS1iZWQ5OWYxYi1hNjljLTQyYzYtYTMxYy02YWVkNDIwOTc0ZmQuanBnIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.7l6SOdshQsOJ8JdHs88gYXGin_YPUDXHD0MhF62SpFI"
    		},
    		{
    			desc: "Desc 7",
    			width: 2,
    			height: 3,
    			url: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/389a4067-564a-4b24-a371-8799dc5d668e/ddjdsey-5697fd03-2aab-47d1-afbe-f6d0f36338fe.jpg/v1/fill/w_1280,h_1920,q_75,strp/scourier_by_xistenceimaginations_ddjdsey-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTkyMCIsInBhdGgiOiJcL2ZcLzM4OWE0MDY3LTU2NGEtNGIyNC1hMzcxLTg3OTlkYzVkNjY4ZVwvZGRqZHNleS01Njk3ZmQwMy0yYWFiLTQ3ZDEtYWZiZS1mNmQwZjM2MzM4ZmUuanBnIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.w2x9oAr9MDDHEao152zdYh6U60sfR6X5mpkPVsSS4JY"
    		},
    		{
    			desc: "Desc 8",
    			width: 8,
    			height: 3,
    			url: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/389a4067-564a-4b24-a371-8799dc5d668e/ddj8zwv-40f9b550-4f99-4b62-9eac-f149b8bf3d99.jpg/v1/fill/w_932,h_858,q_70,strp/quickpaint_by_xistenceimaginations_ddj8zwv-pre.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTE3OCIsInBhdGgiOiJcL2ZcLzM4OWE0MDY3LTU2NGEtNGIyNC1hMzcxLTg3OTlkYzVkNjY4ZVwvZGRqOHp3di00MGY5YjU1MC00Zjk5LTRiNjItOWVhYy1mMTQ5YjhiZjNkOTkuanBnIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.uP9fXzUTLRVYCzgKG2Zrb8fGah2o1-5iEo841I9gxb0"
    		}
    	];

    	x.init();

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("debug" in $$props) debug = $$props.debug;
    		if ("gridGap" in $$props) $$invalidate("gridGap", gridGap = $$props.gridGap);
    		if ("images" in $$props) $$invalidate("images", images = $$props.images);
    	};

    	return { images };
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$w, create_fragment$w, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$w.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
