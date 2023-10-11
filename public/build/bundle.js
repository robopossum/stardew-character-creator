
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
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
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    /**
     * Schedules a callback to run immediately after the component has been updated.
     *
     * The first time the callback runs will be after the initial `onMount`
     */
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
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
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
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
        else if (callback) {
            callback();
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
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
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.55.1' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function tint(ctx, color, bounds = [0, 0, 256, 256]) {
        const r = parseInt("0x" + color.slice(1,3));
        const g = parseInt("0x" + color.slice(3,5));
        const b = parseInt("0x" + color.slice(5,7));
        const imgData = ctx.getImageData(...bounds);
        const data = imgData.data;
        for (var i = 0; i < data.length; i += 4) {
          if (data[i + 3] !== 0) {
            data[i] = parseInt(((data[i] / 255) * (r / 255)) * 255);
            data[i + 1] = parseInt(((data[i + 1] / 255) * (g / 255)) * 255);
            data[i + 2] = parseInt(((data[i + 2] / 255) * (b / 255)) * 255);
          }
        }
        
        ctx.clearRect(...bounds);
        ctx.putImageData(imgData, bounds[0], bounds[1]);
    }
    function replaceColor(ctx, prevRGB, newRGB, bounds = [0, 0, 256, 256]) {
      const imgData = ctx.getImageData(...bounds);
      const data = imgData.data;
      for (var i = 0; i < data.length; i += 4) {
        if (data[i + 3] !== 0 && data[i] === prevRGB[0] && data[i + 1] === prevRGB[1] && data[i + 2] === prevRGB[2]) {
          data[i] = newRGB[0];
          data[i + 1] = newRGB[1];
          data[i + 2] = newRGB[2];
        }
      }
      ctx.putImageData(imgData, bounds[0], bounds[1]);
    }
    function rgb2hsv(color) {
      const r = parseInt("0x" + color.slice(1, 3)) / 255;
      const g = parseInt("0x" + color.slice(3, 5)) / 255;
      const b = parseInt("0x" + color.slice(5, 7)) / 255;

      const v = Math.max(r,g,b), c=v-Math.min(r,g,b);
      let h=c && ((v==r) ? (g-b)/c : ((v==g) ? 2+(b-r)/c : 4+(r-g)/c)); 
      return [parseInt(((60*(h<0?h+6:h)) / 360) * 99), parseInt((v&&c/v) * 99), parseInt(v * 99)];
    }
    function loadImage(sprite) {
      let img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = './' + sprite + '.png';
      img.callbacks = [];
      img.onload = () => {
        img.callbacks.forEach((callback) => callback());
      };

      return img;
    }
    function getContext(canvas) {
      const ctx = canvas.getContext("2d", {willReadFrequently: true});

      ctx.imageSmoothingEnabled = false;
      ctx.mozImageSmoothingEnabled = false;
      ctx.webkitImageSmoothingEnabled = false;
      ctx.msImageSmoothingEnabled = false;

      return ctx;
    }
    function fadeIn(ctx, bounds = [0, 0, 128, 128]) {
      const width = bounds[2] - bounds[0];
      const imageData = ctx.getImageData(...bounds);
      const data = imageData.data;
      for (let i = 0; i < data.length; i+= 4) {
        data[i+3] = data[i+3] === 0 ? 0 : ((i / 4) % width);
      }
      ctx.putImageData(imageData, bounds[0], bounds[1]);
    }
    function fadeOut(ctx, bounds = [512, 0, 640, 128]) {
      const width = bounds[2] - bounds[0];
      const imageData = ctx.getImageData(...bounds);
      const data = imageData.data;
      for (let i = 0; i < data.length; i+= 4) {
        data[i+3] = data[i+3] === 0 ? 0 : (width - ((i / 4) % width));
      }
      ctx.putImageData(imageData, bounds[0], bounds[1]);
    }

    /* src/Body.svelte generated by Svelte v3.55.1 */
    const file$f = "src/Body.svelte";

    function create_fragment$f(ctx) {
    	let canvas0;
    	let t;
    	let canvas1;

    	const block = {
    		c: function create() {
    			canvas0 = element("canvas");
    			t = space();
    			canvas1 = element("canvas");
    			attr_dev(canvas0, "width", "256");
    			attr_dev(canvas0, "height", "256");
    			attr_dev(canvas0, "class", "svelte-no329k");
    			add_location(canvas0, file$f, 81, 0, 2111);
    			set_style(canvas1, "display", "none");
    			attr_dev(canvas1, "class", "svelte-no329k");
    			add_location(canvas1, file$f, 82, 0, 2169);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, canvas0, anchor);
    			/*canvas0_binding*/ ctx[8](canvas0);
    			insert_dev(target, t, anchor);
    			insert_dev(target, canvas1, anchor);
    			/*canvas1_binding*/ ctx[9](canvas1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(canvas0);
    			/*canvas0_binding*/ ctx[8](null);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(canvas1);
    			/*canvas1_binding*/ ctx[9](null);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Body', slots, []);
    	let { skinId } = $$props;
    	let { armColor } = $$props;
    	let { bodySprite } = $$props;
    	let { skinSprite } = $$props;
    	let { skinColors } = $$props;
    	let { skinData } = $$props;
    	let canvasElement;
    	let skinCanvas;
    	let ctx;

    	onMount(() => {
    		ctx = getContext(canvasElement);
    		bodySprite.callbacks.push(() => draw());
    		draw();
    		$$invalidate(2, skinSprite.onload = () => getSkinData(), skinSprite);
    		getSkinData();
    	});

    	afterUpdate(() => draw());

    	const getSkinData = () => {
    		if (!skinSprite.complete) {
    			return;
    		}

    		$$invalidate(1, skinCanvas.height = skinSprite.height, skinCanvas);
    		$$invalidate(1, skinCanvas.width = skinSprite.width, skinCanvas);
    		let skinCtx = skinCanvas.getContext("2d");
    		skinCtx.drawImage(skinSprite, 0, 0);
    		$$invalidate(4, skinData = skinCtx.getImageData(0, 0, skinCanvas.width, skinCanvas.height).data);
    		$$invalidate(3, skinColors = [skinData.slice(0, 3), skinData.slice(4, 7), skinData.slice(8, 11)]);
    	};

    	const draw = () => {
    		if (!ctx || !bodySprite.complete) {
    			return;
    		}

    		ctx.clearRect(0, 0, 256, 256);
    		ctx.drawImage(bodySprite, 0, 0, 16, 32, 64, 0, 128, 256);
    		ctx.drawImage(bodySprite, 96, 0, 16, 32, 64, 0, 128, 256);

    		if (skinId > 1) {
    			const index = (skinId - 1) * 12;

    			for (var i = 0; i < 12; i += 4) {
    				$$invalidate(3, skinColors[i / 4] = skinData.slice(index + i, index + i + 3), skinColors);
    				replaceColor(ctx, skinData.slice(i, i + 3), skinData.slice(index + i, index + i + 3));
    			}
    		}

    		if (armColor) {
    			replaceColor(ctx, [142, 31, 12], armColor[0]);
    			replaceColor(ctx, [112, 23, 24], armColor[1]);
    			replaceColor(ctx, [74, 12, 6], armColor[2]);
    		}
    	};

    	$$self.$$.on_mount.push(function () {
    		if (skinId === undefined && !('skinId' in $$props || $$self.$$.bound[$$self.$$.props['skinId']])) {
    			console.warn("<Body> was created without expected prop 'skinId'");
    		}

    		if (armColor === undefined && !('armColor' in $$props || $$self.$$.bound[$$self.$$.props['armColor']])) {
    			console.warn("<Body> was created without expected prop 'armColor'");
    		}

    		if (bodySprite === undefined && !('bodySprite' in $$props || $$self.$$.bound[$$self.$$.props['bodySprite']])) {
    			console.warn("<Body> was created without expected prop 'bodySprite'");
    		}

    		if (skinSprite === undefined && !('skinSprite' in $$props || $$self.$$.bound[$$self.$$.props['skinSprite']])) {
    			console.warn("<Body> was created without expected prop 'skinSprite'");
    		}

    		if (skinColors === undefined && !('skinColors' in $$props || $$self.$$.bound[$$self.$$.props['skinColors']])) {
    			console.warn("<Body> was created without expected prop 'skinColors'");
    		}

    		if (skinData === undefined && !('skinData' in $$props || $$self.$$.bound[$$self.$$.props['skinData']])) {
    			console.warn("<Body> was created without expected prop 'skinData'");
    		}
    	});

    	const writable_props = ['skinId', 'armColor', 'bodySprite', 'skinSprite', 'skinColors', 'skinData'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Body> was created with unknown prop '${key}'`);
    	});

    	function canvas0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvasElement = $$value;
    			$$invalidate(0, canvasElement);
    		});
    	}

    	function canvas1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			skinCanvas = $$value;
    			$$invalidate(1, skinCanvas);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('skinId' in $$props) $$invalidate(5, skinId = $$props.skinId);
    		if ('armColor' in $$props) $$invalidate(6, armColor = $$props.armColor);
    		if ('bodySprite' in $$props) $$invalidate(7, bodySprite = $$props.bodySprite);
    		if ('skinSprite' in $$props) $$invalidate(2, skinSprite = $$props.skinSprite);
    		if ('skinColors' in $$props) $$invalidate(3, skinColors = $$props.skinColors);
    		if ('skinData' in $$props) $$invalidate(4, skinData = $$props.skinData);
    	};

    	$$self.$capture_state = () => ({
    		afterUpdate,
    		onMount,
    		replaceColor,
    		getContext,
    		skinId,
    		armColor,
    		bodySprite,
    		skinSprite,
    		skinColors,
    		skinData,
    		canvasElement,
    		skinCanvas,
    		ctx,
    		getSkinData,
    		draw
    	});

    	$$self.$inject_state = $$props => {
    		if ('skinId' in $$props) $$invalidate(5, skinId = $$props.skinId);
    		if ('armColor' in $$props) $$invalidate(6, armColor = $$props.armColor);
    		if ('bodySprite' in $$props) $$invalidate(7, bodySprite = $$props.bodySprite);
    		if ('skinSprite' in $$props) $$invalidate(2, skinSprite = $$props.skinSprite);
    		if ('skinColors' in $$props) $$invalidate(3, skinColors = $$props.skinColors);
    		if ('skinData' in $$props) $$invalidate(4, skinData = $$props.skinData);
    		if ('canvasElement' in $$props) $$invalidate(0, canvasElement = $$props.canvasElement);
    		if ('skinCanvas' in $$props) $$invalidate(1, skinCanvas = $$props.skinCanvas);
    		if ('ctx' in $$props) ctx = $$props.ctx;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		canvasElement,
    		skinCanvas,
    		skinSprite,
    		skinColors,
    		skinData,
    		skinId,
    		armColor,
    		bodySprite,
    		canvas0_binding,
    		canvas1_binding
    	];
    }

    class Body extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {
    			skinId: 5,
    			armColor: 6,
    			bodySprite: 7,
    			skinSprite: 2,
    			skinColors: 3,
    			skinData: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Body",
    			options,
    			id: create_fragment$f.name
    		});
    	}

    	get skinId() {
    		throw new Error("<Body>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set skinId(value) {
    		throw new Error("<Body>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get armColor() {
    		throw new Error("<Body>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set armColor(value) {
    		throw new Error("<Body>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bodySprite() {
    		throw new Error("<Body>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bodySprite(value) {
    		throw new Error("<Body>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get skinSprite() {
    		throw new Error("<Body>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set skinSprite(value) {
    		throw new Error("<Body>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get skinColors() {
    		throw new Error("<Body>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set skinColors(value) {
    		throw new Error("<Body>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get skinData() {
    		throw new Error("<Body>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set skinData(value) {
    		throw new Error("<Body>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Eyes.svelte generated by Svelte v3.55.1 */
    const file$e = "src/Eyes.svelte";

    function create_fragment$e(ctx) {
    	let canvas;

    	const block = {
    		c: function create() {
    			canvas = element("canvas");
    			attr_dev(canvas, "width", "256");
    			attr_dev(canvas, "height", "256");
    			attr_dev(canvas, "class", "svelte-no329k");
    			add_location(canvas, file$e, 32, 0, 645);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, canvas, anchor);
    			/*canvas_binding*/ ctx[3](canvas);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(canvas);
    			/*canvas_binding*/ ctx[3](null);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Eyes', slots, []);
    	let { color } = $$props;
    	let { eyeSprite } = $$props;
    	let canvasElement;
    	let ctx;

    	onMount(() => {
    		ctx = getContext(canvasElement);
    		$$invalidate(1, eyeSprite.onload = () => draw(), eyeSprite);
    		draw();
    	});

    	afterUpdate(() => draw());

    	const draw = () => {
    		if (!ctx || !eyeSprite.complete) {
    			return;
    		}

    		ctx.clearRect(0, 0, 256, 256);
    		ctx.drawImage(eyeSprite, 0, 0, 16, 32, 64, 0, 128, 256);
    		let hex = color || '#7a4434';
    		tint(ctx, hex);
    	};

    	$$self.$$.on_mount.push(function () {
    		if (color === undefined && !('color' in $$props || $$self.$$.bound[$$self.$$.props['color']])) {
    			console.warn("<Eyes> was created without expected prop 'color'");
    		}

    		if (eyeSprite === undefined && !('eyeSprite' in $$props || $$self.$$.bound[$$self.$$.props['eyeSprite']])) {
    			console.warn("<Eyes> was created without expected prop 'eyeSprite'");
    		}
    	});

    	const writable_props = ['color', 'eyeSprite'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Eyes> was created with unknown prop '${key}'`);
    	});

    	function canvas_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvasElement = $$value;
    			$$invalidate(0, canvasElement);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    		if ('eyeSprite' in $$props) $$invalidate(1, eyeSprite = $$props.eyeSprite);
    	};

    	$$self.$capture_state = () => ({
    		afterUpdate,
    		onMount,
    		tint,
    		getContext,
    		color,
    		eyeSprite,
    		canvasElement,
    		ctx,
    		draw
    	});

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    		if ('eyeSprite' in $$props) $$invalidate(1, eyeSprite = $$props.eyeSprite);
    		if ('canvasElement' in $$props) $$invalidate(0, canvasElement = $$props.canvasElement);
    		if ('ctx' in $$props) ctx = $$props.ctx;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [canvasElement, eyeSprite, color, canvas_binding];
    }

    class Eyes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { color: 2, eyeSprite: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Eyes",
    			options,
    			id: create_fragment$e.name
    		});
    	}

    	get color() {
    		throw new Error("<Eyes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Eyes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get eyeSprite() {
    		throw new Error("<Eyes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set eyeSprite(value) {
    		throw new Error("<Eyes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Hair.svelte generated by Svelte v3.55.1 */
    const file$d = "src/Hair.svelte";

    function create_fragment$d(ctx) {
    	let canvas;

    	const block = {
    		c: function create() {
    			canvas = element("canvas");
    			attr_dev(canvas, "width", "256");
    			attr_dev(canvas, "height", "256");
    			attr_dev(canvas, "class", "svelte-no329k");
    			add_location(canvas, file$d, 38, 0, 1003);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, canvas, anchor);
    			/*canvas_binding*/ ctx[5](canvas);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(canvas);
    			/*canvas_binding*/ ctx[5](null);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Hair', slots, []);
    	let { id } = $$props;
    	let { color } = $$props;
    	let { hairSprite } = $$props;
    	let { hairFancySprite } = $$props;
    	let canvasElement;
    	let ctx;

    	onMount(() => {
    		ctx = getContext(canvasElement);
    		hairSprite.callbacks.push(() => draw());
    		hairFancySprite.callbacks.push(() => draw());
    		draw();
    	});

    	afterUpdate(() => draw());

    	const draw = () => {
    		if (!ctx || !hairSprite.complete || !hairFancySprite.complete) {
    			return;
    		}

    		const index = (id || 1) - (id > 56 ? 57 : 1);
    		const xOffset = index % 8 * 16;
    		const yOffset = parseInt(index / 8) * (id > 56 ? 128 : 96);
    		ctx.clearRect(0, 0, 256, 256);
    		ctx.drawImage(id > 56 ? hairFancySprite : hairSprite, xOffset, yOffset, 16, 32, 64, id > 56 ? 0 : 8, 128, 256);
    		let hex = color || '#c15b32"';
    		tint(ctx, hex);
    	};

    	$$self.$$.on_mount.push(function () {
    		if (id === undefined && !('id' in $$props || $$self.$$.bound[$$self.$$.props['id']])) {
    			console.warn("<Hair> was created without expected prop 'id'");
    		}

    		if (color === undefined && !('color' in $$props || $$self.$$.bound[$$self.$$.props['color']])) {
    			console.warn("<Hair> was created without expected prop 'color'");
    		}

    		if (hairSprite === undefined && !('hairSprite' in $$props || $$self.$$.bound[$$self.$$.props['hairSprite']])) {
    			console.warn("<Hair> was created without expected prop 'hairSprite'");
    		}

    		if (hairFancySprite === undefined && !('hairFancySprite' in $$props || $$self.$$.bound[$$self.$$.props['hairFancySprite']])) {
    			console.warn("<Hair> was created without expected prop 'hairFancySprite'");
    		}
    	});

    	const writable_props = ['id', 'color', 'hairSprite', 'hairFancySprite'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Hair> was created with unknown prop '${key}'`);
    	});

    	function canvas_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvasElement = $$value;
    			$$invalidate(0, canvasElement);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(1, id = $$props.id);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    		if ('hairSprite' in $$props) $$invalidate(3, hairSprite = $$props.hairSprite);
    		if ('hairFancySprite' in $$props) $$invalidate(4, hairFancySprite = $$props.hairFancySprite);
    	};

    	$$self.$capture_state = () => ({
    		afterUpdate,
    		onMount,
    		tint,
    		getContext,
    		id,
    		color,
    		hairSprite,
    		hairFancySprite,
    		canvasElement,
    		ctx,
    		draw
    	});

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(1, id = $$props.id);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    		if ('hairSprite' in $$props) $$invalidate(3, hairSprite = $$props.hairSprite);
    		if ('hairFancySprite' in $$props) $$invalidate(4, hairFancySprite = $$props.hairFancySprite);
    		if ('canvasElement' in $$props) $$invalidate(0, canvasElement = $$props.canvasElement);
    		if ('ctx' in $$props) ctx = $$props.ctx;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [canvasElement, id, color, hairSprite, hairFancySprite, canvas_binding];
    }

    class Hair extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {
    			id: 1,
    			color: 2,
    			hairSprite: 3,
    			hairFancySprite: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Hair",
    			options,
    			id: create_fragment$d.name
    		});
    	}

    	get id() {
    		throw new Error("<Hair>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Hair>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Hair>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Hair>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hairSprite() {
    		throw new Error("<Hair>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hairSprite(value) {
    		throw new Error("<Hair>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hairFancySprite() {
    		throw new Error("<Hair>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hairFancySprite(value) {
    		throw new Error("<Hair>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Shirt.svelte generated by Svelte v3.55.1 */
    const file$c = "src/Shirt.svelte";

    function create_fragment$c(ctx) {
    	let canvas;

    	const block = {
    		c: function create() {
    			canvas = element("canvas");
    			attr_dev(canvas, "width", "256");
    			attr_dev(canvas, "height", "256");
    			attr_dev(canvas, "class", "svelte-no329k");
    			add_location(canvas, file$c, 39, 0, 956);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, canvas, anchor);
    			/*canvas_binding*/ ctx[4](canvas);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(canvas);
    			/*canvas_binding*/ ctx[4](null);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Shirt', slots, []);
    	let { id } = $$props;
    	let { sleeves } = $$props;
    	let { shirtSprite } = $$props;
    	let canvasElement;
    	let ctx;

    	onMount(() => {
    		ctx = getContext(canvasElement);
    		shirtSprite.callbacks.push(() => draw());
    		draw();
    	});

    	afterUpdate(() => draw());

    	const draw = () => {
    		if (!ctx || !shirtSprite.complete) {
    			return;
    		}

    		let index = (id || 1) - 1;
    		let xOffset = index % 16 * 8;
    		let yOffset = parseInt(index / 16) * 32;
    		ctx.clearRect(0, 0, 256, 256);
    		ctx.drawImage(shirtSprite, xOffset, yOffset, 8, 8, 96, 120, 64, 64);

    		$$invalidate(1, sleeves = [
    			ctx.getImageData(96, 136, 1, 1).data.slice(0, 3),
    			ctx.getImageData(96, 144, 1, 1).data.slice(0, 3),
    			ctx.getImageData(96, 152, 1, 1).data.slice(0, 3)
    		]);
    	};

    	$$self.$$.on_mount.push(function () {
    		if (id === undefined && !('id' in $$props || $$self.$$.bound[$$self.$$.props['id']])) {
    			console.warn("<Shirt> was created without expected prop 'id'");
    		}

    		if (sleeves === undefined && !('sleeves' in $$props || $$self.$$.bound[$$self.$$.props['sleeves']])) {
    			console.warn("<Shirt> was created without expected prop 'sleeves'");
    		}

    		if (shirtSprite === undefined && !('shirtSprite' in $$props || $$self.$$.bound[$$self.$$.props['shirtSprite']])) {
    			console.warn("<Shirt> was created without expected prop 'shirtSprite'");
    		}
    	});

    	const writable_props = ['id', 'sleeves', 'shirtSprite'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Shirt> was created with unknown prop '${key}'`);
    	});

    	function canvas_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvasElement = $$value;
    			$$invalidate(0, canvasElement);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(2, id = $$props.id);
    		if ('sleeves' in $$props) $$invalidate(1, sleeves = $$props.sleeves);
    		if ('shirtSprite' in $$props) $$invalidate(3, shirtSprite = $$props.shirtSprite);
    	};

    	$$self.$capture_state = () => ({
    		afterUpdate,
    		onMount,
    		getContext,
    		id,
    		sleeves,
    		shirtSprite,
    		canvasElement,
    		ctx,
    		draw
    	});

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(2, id = $$props.id);
    		if ('sleeves' in $$props) $$invalidate(1, sleeves = $$props.sleeves);
    		if ('shirtSprite' in $$props) $$invalidate(3, shirtSprite = $$props.shirtSprite);
    		if ('canvasElement' in $$props) $$invalidate(0, canvasElement = $$props.canvasElement);
    		if ('ctx' in $$props) ctx = $$props.ctx;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [canvasElement, sleeves, id, shirtSprite, canvas_binding];
    }

    class Shirt extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { id: 2, sleeves: 1, shirtSprite: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Shirt",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get id() {
    		throw new Error("<Shirt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Shirt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sleeves() {
    		throw new Error("<Shirt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sleeves(value) {
    		throw new Error("<Shirt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get shirtSprite() {
    		throw new Error("<Shirt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shirtSprite(value) {
    		throw new Error("<Shirt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Pants.svelte generated by Svelte v3.55.1 */
    const file$b = "src/Pants.svelte";

    function create_fragment$b(ctx) {
    	let canvas;

    	const block = {
    		c: function create() {
    			canvas = element("canvas");
    			attr_dev(canvas, "width", "256");
    			attr_dev(canvas, "height", "256");
    			attr_dev(canvas, "class", "svelte-no329k");
    			add_location(canvas, file$b, 35, 0, 727);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, canvas, anchor);
    			/*canvas_binding*/ ctx[4](canvas);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(canvas);
    			/*canvas_binding*/ ctx[4](null);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Pants', slots, []);
    	let { id } = $$props;
    	let { color } = $$props;
    	let { pantSprite } = $$props;
    	let canvasElement;
    	let ctx;

    	onMount(() => {
    		ctx = getContext(canvasElement);
    		pantSprite.callbacks.push(() => draw());
    		draw();
    	});

    	afterUpdate(() => draw());

    	const draw = () => {
    		if (!ctx || !pantSprite.complete) {
    			return;
    		}

    		let xOffset = ((id || 1) - 1) * 192;
    		ctx.clearRect(0, 0, 256, 256);
    		ctx.drawImage(pantSprite, xOffset, 0, 16, 32, 64, 0, 128, 256);
    		let hex = color || '#2e55b7';
    		tint(ctx, hex);
    	};

    	$$self.$$.on_mount.push(function () {
    		if (id === undefined && !('id' in $$props || $$self.$$.bound[$$self.$$.props['id']])) {
    			console.warn("<Pants> was created without expected prop 'id'");
    		}

    		if (color === undefined && !('color' in $$props || $$self.$$.bound[$$self.$$.props['color']])) {
    			console.warn("<Pants> was created without expected prop 'color'");
    		}

    		if (pantSprite === undefined && !('pantSprite' in $$props || $$self.$$.bound[$$self.$$.props['pantSprite']])) {
    			console.warn("<Pants> was created without expected prop 'pantSprite'");
    		}
    	});

    	const writable_props = ['id', 'color', 'pantSprite'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Pants> was created with unknown prop '${key}'`);
    	});

    	function canvas_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvasElement = $$value;
    			$$invalidate(0, canvasElement);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(1, id = $$props.id);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    		if ('pantSprite' in $$props) $$invalidate(3, pantSprite = $$props.pantSprite);
    	};

    	$$self.$capture_state = () => ({
    		afterUpdate,
    		onMount,
    		tint,
    		getContext,
    		id,
    		color,
    		pantSprite,
    		canvasElement,
    		ctx,
    		draw
    	});

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(1, id = $$props.id);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    		if ('pantSprite' in $$props) $$invalidate(3, pantSprite = $$props.pantSprite);
    		if ('canvasElement' in $$props) $$invalidate(0, canvasElement = $$props.canvasElement);
    		if ('ctx' in $$props) ctx = $$props.ctx;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [canvasElement, id, color, pantSprite, canvas_binding];
    }

    class Pants extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { id: 1, color: 2, pantSprite: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pants",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get id() {
    		throw new Error("<Pants>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Pants>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Pants>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Pants>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pantSprite() {
    		throw new Error("<Pants>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pantSprite(value) {
    		throw new Error("<Pants>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Accessory.svelte generated by Svelte v3.55.1 */
    const file$a = "src/Accessory.svelte";

    function create_fragment$a(ctx) {
    	let canvas;

    	const block = {
    		c: function create() {
    			canvas = element("canvas");
    			attr_dev(canvas, "width", "256");
    			attr_dev(canvas, "height", "256");
    			attr_dev(canvas, "class", "svelte-no329k");
    			add_location(canvas, file$a, 41, 0, 886);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, canvas, anchor);
    			/*canvas_binding*/ ctx[4](canvas);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(canvas);
    			/*canvas_binding*/ ctx[4](null);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Accessory', slots, []);
    	let { id } = $$props;
    	let { hairColor } = $$props;
    	let { accessorySprite } = $$props;
    	let canvasElement;
    	let ctx;

    	onMount(() => {
    		ctx = getContext(canvasElement);
    		accessorySprite.callbacks.push(() => draw());
    		draw();
    	});

    	afterUpdate(() => draw());

    	const draw = () => {
    		if (!ctx || !accessorySprite.complete) {
    			return;
    		}

    		ctx.clearRect(0, 0, 256, 256);
    		const index = id - 2;

    		if (index < 0) {
    			return;
    		}

    		const xOffset = index % 8 * 16;
    		const yOffset = parseInt(index / 8) * 32;
    		ctx.drawImage(accessorySprite, xOffset, yOffset, 16, 16, 64, 16, 128, 128);

    		if (index < 6) {
    			tint(ctx, hairColor);
    		}
    	};

    	$$self.$$.on_mount.push(function () {
    		if (id === undefined && !('id' in $$props || $$self.$$.bound[$$self.$$.props['id']])) {
    			console.warn("<Accessory> was created without expected prop 'id'");
    		}

    		if (hairColor === undefined && !('hairColor' in $$props || $$self.$$.bound[$$self.$$.props['hairColor']])) {
    			console.warn("<Accessory> was created without expected prop 'hairColor'");
    		}

    		if (accessorySprite === undefined && !('accessorySprite' in $$props || $$self.$$.bound[$$self.$$.props['accessorySprite']])) {
    			console.warn("<Accessory> was created without expected prop 'accessorySprite'");
    		}
    	});

    	const writable_props = ['id', 'hairColor', 'accessorySprite'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Accessory> was created with unknown prop '${key}'`);
    	});

    	function canvas_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvasElement = $$value;
    			$$invalidate(0, canvasElement);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(1, id = $$props.id);
    		if ('hairColor' in $$props) $$invalidate(2, hairColor = $$props.hairColor);
    		if ('accessorySprite' in $$props) $$invalidate(3, accessorySprite = $$props.accessorySprite);
    	};

    	$$self.$capture_state = () => ({
    		afterUpdate,
    		onMount,
    		tint,
    		getContext,
    		id,
    		hairColor,
    		accessorySprite,
    		canvasElement,
    		ctx,
    		draw
    	});

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(1, id = $$props.id);
    		if ('hairColor' in $$props) $$invalidate(2, hairColor = $$props.hairColor);
    		if ('accessorySprite' in $$props) $$invalidate(3, accessorySprite = $$props.accessorySprite);
    		if ('canvasElement' in $$props) $$invalidate(0, canvasElement = $$props.canvasElement);
    		if ('ctx' in $$props) ctx = $$props.ctx;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [canvasElement, id, hairColor, accessorySprite, canvas_binding];
    }

    class Accessory extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { id: 1, hairColor: 2, accessorySprite: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Accessory",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get id() {
    		throw new Error("<Accessory>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Accessory>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hairColor() {
    		throw new Error("<Accessory>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hairColor(value) {
    		throw new Error("<Accessory>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get accessorySprite() {
    		throw new Error("<Accessory>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set accessorySprite(value) {
    		throw new Error("<Accessory>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/CharacterPreview.svelte generated by Svelte v3.55.1 */
    const file$9 = "src/CharacterPreview.svelte";

    function create_fragment$9(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let body;
    	let updating_skinColors;
    	let updating_skinData;
    	let t1;
    	let eyes;
    	let t2;
    	let hair;
    	let t3;
    	let pants;
    	let t4;
    	let shirt;
    	let updating_sleeves;
    	let t5;
    	let accessory;
    	let current;

    	function body_skinColors_binding(value) {
    		/*body_skinColors_binding*/ ctx[19](value);
    	}

    	function body_skinData_binding(value) {
    		/*body_skinData_binding*/ ctx[20](value);
    	}

    	let body_props = {
    		skinId: /*skinId*/ ctx[8],
    		armColor: /*armColor*/ ctx[18],
    		bodySprite: /*bodySprite*/ ctx[9],
    		skinSprite: /*skinSprite*/ ctx[10]
    	};

    	if (/*skinColors*/ ctx[0] !== void 0) {
    		body_props.skinColors = /*skinColors*/ ctx[0];
    	}

    	if (/*skinData*/ ctx[1] !== void 0) {
    		body_props.skinData = /*skinData*/ ctx[1];
    	}

    	body = new Body({ props: body_props, $$inline: true });
    	binding_callbacks.push(() => bind(body, 'skinColors', body_skinColors_binding));
    	binding_callbacks.push(() => bind(body, 'skinData', body_skinData_binding));

    	eyes = new Eyes({
    			props: {
    				color: /*eyeColor*/ ctx[6],
    				eyeSprite: /*eyeSprite*/ ctx[7]
    			},
    			$$inline: true
    		});

    	hair = new Hair({
    			props: {
    				color: /*hairColor*/ ctx[2],
    				id: /*hairId*/ ctx[3],
    				hairSprite: /*hairSprite*/ ctx[4],
    				hairFancySprite: /*hairFancySprite*/ ctx[5]
    			},
    			$$inline: true
    		});

    	pants = new Pants({
    			props: {
    				color: /*pantColor*/ ctx[13],
    				id: /*pantId*/ ctx[14],
    				pantSprite: /*pantSprite*/ ctx[15]
    			},
    			$$inline: true
    		});

    	function shirt_sleeves_binding(value) {
    		/*shirt_sleeves_binding*/ ctx[21](value);
    	}

    	let shirt_props = {
    		id: /*shirtId*/ ctx[11],
    		shirtSprite: /*shirtSprite*/ ctx[12]
    	};

    	if (/*armColor*/ ctx[18] !== void 0) {
    		shirt_props.sleeves = /*armColor*/ ctx[18];
    	}

    	shirt = new Shirt({ props: shirt_props, $$inline: true });
    	binding_callbacks.push(() => bind(shirt, 'sleeves', shirt_sleeves_binding));

    	accessory = new Accessory({
    			props: {
    				id: /*accessoryId*/ ctx[16],
    				hairColor: /*hairColor*/ ctx[2],
    				accessorySprite: /*accessorySprite*/ ctx[17]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			create_component(body.$$.fragment);
    			t1 = space();
    			create_component(eyes.$$.fragment);
    			t2 = space();
    			create_component(hair.$$.fragment);
    			t3 = space();
    			create_component(pants.$$.fragment);
    			t4 = space();
    			create_component(shirt.$$.fragment);
    			t5 = space();
    			create_component(accessory.$$.fragment);
    			if (!src_url_equal(img.src, img_src_value = "./background.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Chracter background");
    			attr_dev(img, "class", "svelte-1wmjp5r");
    			add_location(img, file$9, 35, 4, 786);
    			attr_dev(div0, "class", "inner svelte-1wmjp5r");
    			add_location(div0, file$9, 36, 4, 846);
    			attr_dev(div1, "class", "outer svelte-1wmjp5r");
    			add_location(div1, file$9, 34, 0, 762);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			mount_component(body, div0, null);
    			append_dev(div0, t1);
    			mount_component(eyes, div0, null);
    			append_dev(div0, t2);
    			mount_component(hair, div0, null);
    			append_dev(div0, t3);
    			mount_component(pants, div0, null);
    			append_dev(div0, t4);
    			mount_component(shirt, div0, null);
    			append_dev(div0, t5);
    			mount_component(accessory, div0, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const body_changes = {};
    			if (dirty & /*skinId*/ 256) body_changes.skinId = /*skinId*/ ctx[8];
    			if (dirty & /*armColor*/ 262144) body_changes.armColor = /*armColor*/ ctx[18];
    			if (dirty & /*bodySprite*/ 512) body_changes.bodySprite = /*bodySprite*/ ctx[9];
    			if (dirty & /*skinSprite*/ 1024) body_changes.skinSprite = /*skinSprite*/ ctx[10];

    			if (!updating_skinColors && dirty & /*skinColors*/ 1) {
    				updating_skinColors = true;
    				body_changes.skinColors = /*skinColors*/ ctx[0];
    				add_flush_callback(() => updating_skinColors = false);
    			}

    			if (!updating_skinData && dirty & /*skinData*/ 2) {
    				updating_skinData = true;
    				body_changes.skinData = /*skinData*/ ctx[1];
    				add_flush_callback(() => updating_skinData = false);
    			}

    			body.$set(body_changes);
    			const eyes_changes = {};
    			if (dirty & /*eyeColor*/ 64) eyes_changes.color = /*eyeColor*/ ctx[6];
    			if (dirty & /*eyeSprite*/ 128) eyes_changes.eyeSprite = /*eyeSprite*/ ctx[7];
    			eyes.$set(eyes_changes);
    			const hair_changes = {};
    			if (dirty & /*hairColor*/ 4) hair_changes.color = /*hairColor*/ ctx[2];
    			if (dirty & /*hairId*/ 8) hair_changes.id = /*hairId*/ ctx[3];
    			if (dirty & /*hairSprite*/ 16) hair_changes.hairSprite = /*hairSprite*/ ctx[4];
    			if (dirty & /*hairFancySprite*/ 32) hair_changes.hairFancySprite = /*hairFancySprite*/ ctx[5];
    			hair.$set(hair_changes);
    			const pants_changes = {};
    			if (dirty & /*pantColor*/ 8192) pants_changes.color = /*pantColor*/ ctx[13];
    			if (dirty & /*pantId*/ 16384) pants_changes.id = /*pantId*/ ctx[14];
    			if (dirty & /*pantSprite*/ 32768) pants_changes.pantSprite = /*pantSprite*/ ctx[15];
    			pants.$set(pants_changes);
    			const shirt_changes = {};
    			if (dirty & /*shirtId*/ 2048) shirt_changes.id = /*shirtId*/ ctx[11];
    			if (dirty & /*shirtSprite*/ 4096) shirt_changes.shirtSprite = /*shirtSprite*/ ctx[12];

    			if (!updating_sleeves && dirty & /*armColor*/ 262144) {
    				updating_sleeves = true;
    				shirt_changes.sleeves = /*armColor*/ ctx[18];
    				add_flush_callback(() => updating_sleeves = false);
    			}

    			shirt.$set(shirt_changes);
    			const accessory_changes = {};
    			if (dirty & /*accessoryId*/ 65536) accessory_changes.id = /*accessoryId*/ ctx[16];
    			if (dirty & /*hairColor*/ 4) accessory_changes.hairColor = /*hairColor*/ ctx[2];
    			if (dirty & /*accessorySprite*/ 131072) accessory_changes.accessorySprite = /*accessorySprite*/ ctx[17];
    			accessory.$set(accessory_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(body.$$.fragment, local);
    			transition_in(eyes.$$.fragment, local);
    			transition_in(hair.$$.fragment, local);
    			transition_in(pants.$$.fragment, local);
    			transition_in(shirt.$$.fragment, local);
    			transition_in(accessory.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(body.$$.fragment, local);
    			transition_out(eyes.$$.fragment, local);
    			transition_out(hair.$$.fragment, local);
    			transition_out(pants.$$.fragment, local);
    			transition_out(shirt.$$.fragment, local);
    			transition_out(accessory.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(body);
    			destroy_component(eyes);
    			destroy_component(hair);
    			destroy_component(pants);
    			destroy_component(shirt);
    			destroy_component(accessory);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CharacterPreview', slots, []);
    	let { hairColor } = $$props;
    	let { hairId } = $$props;
    	let { hairSprite } = $$props;
    	let { hairFancySprite } = $$props;
    	let { eyeColor } = $$props;
    	let { eyeSprite } = $$props;
    	let { skinId } = $$props;
    	let armColor;
    	let { bodySprite } = $$props;
    	let { skinSprite } = $$props;
    	let { skinColors } = $$props;
    	let { skinData } = $$props;
    	let { shirtId } = $$props;
    	let { shirtSprite } = $$props;
    	let { pantColor } = $$props;
    	let { pantId } = $$props;
    	let { pantSprite } = $$props;
    	let { accessoryId } = $$props;
    	let { accessorySprite } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (hairColor === undefined && !('hairColor' in $$props || $$self.$$.bound[$$self.$$.props['hairColor']])) {
    			console.warn("<CharacterPreview> was created without expected prop 'hairColor'");
    		}

    		if (hairId === undefined && !('hairId' in $$props || $$self.$$.bound[$$self.$$.props['hairId']])) {
    			console.warn("<CharacterPreview> was created without expected prop 'hairId'");
    		}

    		if (hairSprite === undefined && !('hairSprite' in $$props || $$self.$$.bound[$$self.$$.props['hairSprite']])) {
    			console.warn("<CharacterPreview> was created without expected prop 'hairSprite'");
    		}

    		if (hairFancySprite === undefined && !('hairFancySprite' in $$props || $$self.$$.bound[$$self.$$.props['hairFancySprite']])) {
    			console.warn("<CharacterPreview> was created without expected prop 'hairFancySprite'");
    		}

    		if (eyeColor === undefined && !('eyeColor' in $$props || $$self.$$.bound[$$self.$$.props['eyeColor']])) {
    			console.warn("<CharacterPreview> was created without expected prop 'eyeColor'");
    		}

    		if (eyeSprite === undefined && !('eyeSprite' in $$props || $$self.$$.bound[$$self.$$.props['eyeSprite']])) {
    			console.warn("<CharacterPreview> was created without expected prop 'eyeSprite'");
    		}

    		if (skinId === undefined && !('skinId' in $$props || $$self.$$.bound[$$self.$$.props['skinId']])) {
    			console.warn("<CharacterPreview> was created without expected prop 'skinId'");
    		}

    		if (bodySprite === undefined && !('bodySprite' in $$props || $$self.$$.bound[$$self.$$.props['bodySprite']])) {
    			console.warn("<CharacterPreview> was created without expected prop 'bodySprite'");
    		}

    		if (skinSprite === undefined && !('skinSprite' in $$props || $$self.$$.bound[$$self.$$.props['skinSprite']])) {
    			console.warn("<CharacterPreview> was created without expected prop 'skinSprite'");
    		}

    		if (skinColors === undefined && !('skinColors' in $$props || $$self.$$.bound[$$self.$$.props['skinColors']])) {
    			console.warn("<CharacterPreview> was created without expected prop 'skinColors'");
    		}

    		if (skinData === undefined && !('skinData' in $$props || $$self.$$.bound[$$self.$$.props['skinData']])) {
    			console.warn("<CharacterPreview> was created without expected prop 'skinData'");
    		}

    		if (shirtId === undefined && !('shirtId' in $$props || $$self.$$.bound[$$self.$$.props['shirtId']])) {
    			console.warn("<CharacterPreview> was created without expected prop 'shirtId'");
    		}

    		if (shirtSprite === undefined && !('shirtSprite' in $$props || $$self.$$.bound[$$self.$$.props['shirtSprite']])) {
    			console.warn("<CharacterPreview> was created without expected prop 'shirtSprite'");
    		}

    		if (pantColor === undefined && !('pantColor' in $$props || $$self.$$.bound[$$self.$$.props['pantColor']])) {
    			console.warn("<CharacterPreview> was created without expected prop 'pantColor'");
    		}

    		if (pantId === undefined && !('pantId' in $$props || $$self.$$.bound[$$self.$$.props['pantId']])) {
    			console.warn("<CharacterPreview> was created without expected prop 'pantId'");
    		}

    		if (pantSprite === undefined && !('pantSprite' in $$props || $$self.$$.bound[$$self.$$.props['pantSprite']])) {
    			console.warn("<CharacterPreview> was created without expected prop 'pantSprite'");
    		}

    		if (accessoryId === undefined && !('accessoryId' in $$props || $$self.$$.bound[$$self.$$.props['accessoryId']])) {
    			console.warn("<CharacterPreview> was created without expected prop 'accessoryId'");
    		}

    		if (accessorySprite === undefined && !('accessorySprite' in $$props || $$self.$$.bound[$$self.$$.props['accessorySprite']])) {
    			console.warn("<CharacterPreview> was created without expected prop 'accessorySprite'");
    		}
    	});

    	const writable_props = [
    		'hairColor',
    		'hairId',
    		'hairSprite',
    		'hairFancySprite',
    		'eyeColor',
    		'eyeSprite',
    		'skinId',
    		'bodySprite',
    		'skinSprite',
    		'skinColors',
    		'skinData',
    		'shirtId',
    		'shirtSprite',
    		'pantColor',
    		'pantId',
    		'pantSprite',
    		'accessoryId',
    		'accessorySprite'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CharacterPreview> was created with unknown prop '${key}'`);
    	});

    	function body_skinColors_binding(value) {
    		skinColors = value;
    		$$invalidate(0, skinColors);
    	}

    	function body_skinData_binding(value) {
    		skinData = value;
    		$$invalidate(1, skinData);
    	}

    	function shirt_sleeves_binding(value) {
    		armColor = value;
    		$$invalidate(18, armColor);
    	}

    	$$self.$$set = $$props => {
    		if ('hairColor' in $$props) $$invalidate(2, hairColor = $$props.hairColor);
    		if ('hairId' in $$props) $$invalidate(3, hairId = $$props.hairId);
    		if ('hairSprite' in $$props) $$invalidate(4, hairSprite = $$props.hairSprite);
    		if ('hairFancySprite' in $$props) $$invalidate(5, hairFancySprite = $$props.hairFancySprite);
    		if ('eyeColor' in $$props) $$invalidate(6, eyeColor = $$props.eyeColor);
    		if ('eyeSprite' in $$props) $$invalidate(7, eyeSprite = $$props.eyeSprite);
    		if ('skinId' in $$props) $$invalidate(8, skinId = $$props.skinId);
    		if ('bodySprite' in $$props) $$invalidate(9, bodySprite = $$props.bodySprite);
    		if ('skinSprite' in $$props) $$invalidate(10, skinSprite = $$props.skinSprite);
    		if ('skinColors' in $$props) $$invalidate(0, skinColors = $$props.skinColors);
    		if ('skinData' in $$props) $$invalidate(1, skinData = $$props.skinData);
    		if ('shirtId' in $$props) $$invalidate(11, shirtId = $$props.shirtId);
    		if ('shirtSprite' in $$props) $$invalidate(12, shirtSprite = $$props.shirtSprite);
    		if ('pantColor' in $$props) $$invalidate(13, pantColor = $$props.pantColor);
    		if ('pantId' in $$props) $$invalidate(14, pantId = $$props.pantId);
    		if ('pantSprite' in $$props) $$invalidate(15, pantSprite = $$props.pantSprite);
    		if ('accessoryId' in $$props) $$invalidate(16, accessoryId = $$props.accessoryId);
    		if ('accessorySprite' in $$props) $$invalidate(17, accessorySprite = $$props.accessorySprite);
    	};

    	$$self.$capture_state = () => ({
    		Body,
    		Eyes,
    		Hair,
    		Shirt,
    		Pants,
    		Accessory,
    		hairColor,
    		hairId,
    		hairSprite,
    		hairFancySprite,
    		eyeColor,
    		eyeSprite,
    		skinId,
    		armColor,
    		bodySprite,
    		skinSprite,
    		skinColors,
    		skinData,
    		shirtId,
    		shirtSprite,
    		pantColor,
    		pantId,
    		pantSprite,
    		accessoryId,
    		accessorySprite
    	});

    	$$self.$inject_state = $$props => {
    		if ('hairColor' in $$props) $$invalidate(2, hairColor = $$props.hairColor);
    		if ('hairId' in $$props) $$invalidate(3, hairId = $$props.hairId);
    		if ('hairSprite' in $$props) $$invalidate(4, hairSprite = $$props.hairSprite);
    		if ('hairFancySprite' in $$props) $$invalidate(5, hairFancySprite = $$props.hairFancySprite);
    		if ('eyeColor' in $$props) $$invalidate(6, eyeColor = $$props.eyeColor);
    		if ('eyeSprite' in $$props) $$invalidate(7, eyeSprite = $$props.eyeSprite);
    		if ('skinId' in $$props) $$invalidate(8, skinId = $$props.skinId);
    		if ('armColor' in $$props) $$invalidate(18, armColor = $$props.armColor);
    		if ('bodySprite' in $$props) $$invalidate(9, bodySprite = $$props.bodySprite);
    		if ('skinSprite' in $$props) $$invalidate(10, skinSprite = $$props.skinSprite);
    		if ('skinColors' in $$props) $$invalidate(0, skinColors = $$props.skinColors);
    		if ('skinData' in $$props) $$invalidate(1, skinData = $$props.skinData);
    		if ('shirtId' in $$props) $$invalidate(11, shirtId = $$props.shirtId);
    		if ('shirtSprite' in $$props) $$invalidate(12, shirtSprite = $$props.shirtSprite);
    		if ('pantColor' in $$props) $$invalidate(13, pantColor = $$props.pantColor);
    		if ('pantId' in $$props) $$invalidate(14, pantId = $$props.pantId);
    		if ('pantSprite' in $$props) $$invalidate(15, pantSprite = $$props.pantSprite);
    		if ('accessoryId' in $$props) $$invalidate(16, accessoryId = $$props.accessoryId);
    		if ('accessorySprite' in $$props) $$invalidate(17, accessorySprite = $$props.accessorySprite);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		skinColors,
    		skinData,
    		hairColor,
    		hairId,
    		hairSprite,
    		hairFancySprite,
    		eyeColor,
    		eyeSprite,
    		skinId,
    		bodySprite,
    		skinSprite,
    		shirtId,
    		shirtSprite,
    		pantColor,
    		pantId,
    		pantSprite,
    		accessoryId,
    		accessorySprite,
    		armColor,
    		body_skinColors_binding,
    		body_skinData_binding,
    		shirt_sleeves_binding
    	];
    }

    class CharacterPreview extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			hairColor: 2,
    			hairId: 3,
    			hairSprite: 4,
    			hairFancySprite: 5,
    			eyeColor: 6,
    			eyeSprite: 7,
    			skinId: 8,
    			bodySprite: 9,
    			skinSprite: 10,
    			skinColors: 0,
    			skinData: 1,
    			shirtId: 11,
    			shirtSprite: 12,
    			pantColor: 13,
    			pantId: 14,
    			pantSprite: 15,
    			accessoryId: 16,
    			accessorySprite: 17
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CharacterPreview",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get hairColor() {
    		throw new Error("<CharacterPreview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hairColor(value) {
    		throw new Error("<CharacterPreview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hairId() {
    		throw new Error("<CharacterPreview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hairId(value) {
    		throw new Error("<CharacterPreview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hairSprite() {
    		throw new Error("<CharacterPreview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hairSprite(value) {
    		throw new Error("<CharacterPreview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hairFancySprite() {
    		throw new Error("<CharacterPreview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hairFancySprite(value) {
    		throw new Error("<CharacterPreview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get eyeColor() {
    		throw new Error("<CharacterPreview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set eyeColor(value) {
    		throw new Error("<CharacterPreview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get eyeSprite() {
    		throw new Error("<CharacterPreview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set eyeSprite(value) {
    		throw new Error("<CharacterPreview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get skinId() {
    		throw new Error("<CharacterPreview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set skinId(value) {
    		throw new Error("<CharacterPreview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bodySprite() {
    		throw new Error("<CharacterPreview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bodySprite(value) {
    		throw new Error("<CharacterPreview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get skinSprite() {
    		throw new Error("<CharacterPreview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set skinSprite(value) {
    		throw new Error("<CharacterPreview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get skinColors() {
    		throw new Error("<CharacterPreview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set skinColors(value) {
    		throw new Error("<CharacterPreview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get skinData() {
    		throw new Error("<CharacterPreview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set skinData(value) {
    		throw new Error("<CharacterPreview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get shirtId() {
    		throw new Error("<CharacterPreview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shirtId(value) {
    		throw new Error("<CharacterPreview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get shirtSprite() {
    		throw new Error("<CharacterPreview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shirtSprite(value) {
    		throw new Error("<CharacterPreview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pantColor() {
    		throw new Error("<CharacterPreview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pantColor(value) {
    		throw new Error("<CharacterPreview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pantId() {
    		throw new Error("<CharacterPreview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pantId(value) {
    		throw new Error("<CharacterPreview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pantSprite() {
    		throw new Error("<CharacterPreview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pantSprite(value) {
    		throw new Error("<CharacterPreview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get accessoryId() {
    		throw new Error("<CharacterPreview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set accessoryId(value) {
    		throw new Error("<CharacterPreview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get accessorySprite() {
    		throw new Error("<CharacterPreview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set accessorySprite(value) {
    		throw new Error("<CharacterPreview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Arrow.svelte generated by Svelte v3.55.1 */

    const file$8 = "src/Arrow.svelte";

    function create_fragment$8(ctx) {
    	let button;
    	let svg;
    	let defs;
    	let pattern;
    	let rect0;
    	let rect1;
    	let rect2;
    	let rect3;
    	let rect4;
    	let rect5;
    	let rect6;
    	let rect7;
    	let rect8;
    	let rect9;
    	let rect10;
    	let rect11;
    	let rect12;
    	let rect13;
    	let rect14;
    	let rect15;
    	let rect16;
    	let rect17;
    	let rect18;
    	let rect19;
    	let rect20;
    	let rect21;
    	let rect22;
    	let rect23;
    	let rect24;
    	let rect25;
    	let rect26;
    	let rect27;
    	let rect28;
    	let rect29;
    	let rect30;
    	let rect31;
    	let rect32;
    	let rect33;
    	let rect34;
    	let rect35;
    	let rect36;
    	let button_style_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			pattern = svg_element("pattern");
    			rect0 = svg_element("rect");
    			rect1 = svg_element("rect");
    			rect2 = svg_element("rect");
    			rect3 = svg_element("rect");
    			rect4 = svg_element("rect");
    			rect5 = svg_element("rect");
    			rect6 = svg_element("rect");
    			rect7 = svg_element("rect");
    			rect8 = svg_element("rect");
    			rect9 = svg_element("rect");
    			rect10 = svg_element("rect");
    			rect11 = svg_element("rect");
    			rect12 = svg_element("rect");
    			rect13 = svg_element("rect");
    			rect14 = svg_element("rect");
    			rect15 = svg_element("rect");
    			rect16 = svg_element("rect");
    			rect17 = svg_element("rect");
    			rect18 = svg_element("rect");
    			rect19 = svg_element("rect");
    			rect20 = svg_element("rect");
    			rect21 = svg_element("rect");
    			rect22 = svg_element("rect");
    			rect23 = svg_element("rect");
    			rect24 = svg_element("rect");
    			rect25 = svg_element("rect");
    			rect26 = svg_element("rect");
    			rect27 = svg_element("rect");
    			rect28 = svg_element("rect");
    			rect29 = svg_element("rect");
    			rect30 = svg_element("rect");
    			rect31 = svg_element("rect");
    			rect32 = svg_element("rect");
    			rect33 = svg_element("rect");
    			rect34 = svg_element("rect");
    			rect35 = svg_element("rect");
    			rect36 = svg_element("rect");
    			attr_dev(rect0, "width", "2");
    			attr_dev(rect0, "height", "1");
    			attr_dev(rect0, "x", "4");
    			attr_dev(rect0, "y", "1");
    			attr_dev(rect0, "fill", "rgba(91, 43, 42, 1.00)");
    			add_location(rect0, file$8, 16, 12, 586);
    			attr_dev(rect1, "width", "1");
    			attr_dev(rect1, "height", "1");
    			attr_dev(rect1, "x", "3");
    			attr_dev(rect1, "y", "2");
    			attr_dev(rect1, "fill", "rgba(91, 43, 42, 1.00)");
    			add_location(rect1, file$8, 17, 12, 675);
    			attr_dev(rect2, "width", "1");
    			attr_dev(rect2, "height", "1");
    			attr_dev(rect2, "x", "4");
    			attr_dev(rect2, "y", "2");
    			attr_dev(rect2, "fill", "rgba(228, 174, 110, 1.00)");
    			add_location(rect2, file$8, 18, 12, 764);
    			attr_dev(rect3, "width", "1");
    			attr_dev(rect3, "height", "1");
    			attr_dev(rect3, "x", "5");
    			attr_dev(rect3, "y", "2");
    			attr_dev(rect3, "fill", "rgba(91, 43, 42, 1.00)");
    			add_location(rect3, file$8, 19, 12, 856);
    			attr_dev(rect4, "width", "1");
    			attr_dev(rect4, "height", "1");
    			attr_dev(rect4, "x", "2");
    			attr_dev(rect4, "y", "3");
    			attr_dev(rect4, "fill", "rgba(91, 43, 42, 1.00)");
    			add_location(rect4, file$8, 20, 12, 945);
    			attr_dev(rect5, "width", "1");
    			attr_dev(rect5, "height", "1");
    			attr_dev(rect5, "x", "3");
    			attr_dev(rect5, "y", "3");
    			attr_dev(rect5, "fill", "rgba(220, 123, 5, 1.00)");
    			add_location(rect5, file$8, 21, 12, 1034);
    			attr_dev(rect6, "width", "1");
    			attr_dev(rect6, "height", "1");
    			attr_dev(rect6, "x", "4");
    			attr_dev(rect6, "y", "3");
    			attr_dev(rect6, "fill", "rgba(228, 174, 110, 1.00)");
    			add_location(rect6, file$8, 22, 12, 1124);
    			attr_dev(rect7, "width", "6");
    			attr_dev(rect7, "height", "1");
    			attr_dev(rect7, "x", "5");
    			attr_dev(rect7, "y", "3");
    			attr_dev(rect7, "fill", "rgba(91, 43, 42, 1.00)");
    			add_location(rect7, file$8, 23, 12, 1216);
    			attr_dev(rect8, "width", "1");
    			attr_dev(rect8, "height", "1");
    			attr_dev(rect8, "x", "1");
    			attr_dev(rect8, "y", "4");
    			attr_dev(rect8, "fill", "rgba(91, 43, 42, 1.00)");
    			add_location(rect8, file$8, 24, 12, 1305);
    			attr_dev(rect9, "width", "1");
    			attr_dev(rect9, "height", "1");
    			attr_dev(rect9, "x", "2");
    			attr_dev(rect9, "y", "4");
    			attr_dev(rect9, "fill", "rgba(220, 123, 5, 1.00)");
    			add_location(rect9, file$8, 25, 12, 1394);
    			attr_dev(rect10, "width", "7");
    			attr_dev(rect10, "height", "1");
    			attr_dev(rect10, "x", "3");
    			attr_dev(rect10, "y", "4");
    			attr_dev(rect10, "fill", "rgba(228, 174, 110, 1.00)");
    			add_location(rect10, file$8, 26, 12, 1484);
    			attr_dev(rect11, "width", "1");
    			attr_dev(rect11, "height", "1");
    			attr_dev(rect11, "x", "10");
    			attr_dev(rect11, "y", "4");
    			attr_dev(rect11, "fill", "rgba(220, 123, 5, 1.00)");
    			add_location(rect11, file$8, 27, 12, 1576);
    			attr_dev(rect12, "width", "1");
    			attr_dev(rect12, "height", "1");
    			attr_dev(rect12, "x", "11");
    			attr_dev(rect12, "y", "4");
    			attr_dev(rect12, "fill", "rgba(91, 43, 42, 1.00)");
    			add_location(rect12, file$8, 28, 12, 1667);
    			attr_dev(rect13, "width", "1");
    			attr_dev(rect13, "height", "1");
    			attr_dev(rect13, "x", "0");
    			attr_dev(rect13, "y", "5");
    			attr_dev(rect13, "fill", "rgba(91, 43, 42, 1.00)");
    			add_location(rect13, file$8, 29, 12, 1757);
    			attr_dev(rect14, "width", "1");
    			attr_dev(rect14, "height", "1");
    			attr_dev(rect14, "x", "1");
    			attr_dev(rect14, "y", "5");
    			attr_dev(rect14, "fill", "rgba(220, 123, 5, 1.00)");
    			add_location(rect14, file$8, 30, 12, 1846);
    			attr_dev(rect15, "width", "1");
    			attr_dev(rect15, "height", "1");
    			attr_dev(rect15, "x", "2");
    			attr_dev(rect15, "y", "5");
    			attr_dev(rect15, "fill", "rgba(228, 174, 110, 1.00)");
    			add_location(rect15, file$8, 31, 12, 1936);
    			attr_dev(rect16, "width", "7");
    			attr_dev(rect16, "height", "1");
    			attr_dev(rect16, "x", "3");
    			attr_dev(rect16, "y", "5");
    			attr_dev(rect16, "fill", "rgba(220, 123, 5, 1.00)");
    			add_location(rect16, file$8, 32, 12, 2028);
    			attr_dev(rect17, "width", "1");
    			attr_dev(rect17, "height", "1");
    			attr_dev(rect17, "x", "10");
    			attr_dev(rect17, "y", "5");
    			attr_dev(rect17, "fill", "rgba(228, 174, 110, 1.00)");
    			add_location(rect17, file$8, 33, 12, 2118);
    			attr_dev(rect18, "width", "1");
    			attr_dev(rect18, "height", "1");
    			attr_dev(rect18, "x", "11");
    			attr_dev(rect18, "y", "5");
    			attr_dev(rect18, "fill", "rgba(91, 43, 42, 1.00)");
    			add_location(rect18, file$8, 34, 12, 2211);
    			attr_dev(rect19, "width", "1");
    			attr_dev(rect19, "height", "1");
    			attr_dev(rect19, "x", "0");
    			attr_dev(rect19, "y", "6");
    			attr_dev(rect19, "fill", "rgba(91, 43, 42, 1.00)");
    			add_location(rect19, file$8, 35, 12, 2301);
    			attr_dev(rect20, "width", "1");
    			attr_dev(rect20, "height", "1");
    			attr_dev(rect20, "x", "1");
    			attr_dev(rect20, "y", "6");
    			attr_dev(rect20, "fill", "rgba(177, 78, 5, 1.00)");
    			add_location(rect20, file$8, 36, 12, 2390);
    			attr_dev(rect21, "width", "9");
    			attr_dev(rect21, "height", "1");
    			attr_dev(rect21, "x", "2");
    			attr_dev(rect21, "y", "6");
    			attr_dev(rect21, "fill", "rgba(220, 123, 5, 1.00)");
    			add_location(rect21, file$8, 37, 12, 2479);
    			attr_dev(rect22, "width", "1");
    			attr_dev(rect22, "height", "1");
    			attr_dev(rect22, "x", "11");
    			attr_dev(rect22, "y", "6");
    			attr_dev(rect22, "fill", "rgba(91, 43, 42, 1.00)");
    			add_location(rect22, file$8, 38, 12, 2569);
    			attr_dev(rect23, "width", "1");
    			attr_dev(rect23, "height", "1");
    			attr_dev(rect23, "x", "1");
    			attr_dev(rect23, "y", "7");
    			attr_dev(rect23, "fill", "rgba(91, 43, 42, 1.00)");
    			add_location(rect23, file$8, 39, 12, 2659);
    			attr_dev(rect24, "width", "1");
    			attr_dev(rect24, "height", "1");
    			attr_dev(rect24, "x", "2");
    			attr_dev(rect24, "y", "7");
    			attr_dev(rect24, "fill", "rgba(177, 78, 5, 1.00)");
    			add_location(rect24, file$8, 40, 12, 2748);
    			attr_dev(rect25, "width", "7");
    			attr_dev(rect25, "height", "1");
    			attr_dev(rect25, "x", "3");
    			attr_dev(rect25, "y", "7");
    			attr_dev(rect25, "fill", "rgba(220, 123, 5, 1.00)");
    			add_location(rect25, file$8, 41, 12, 2837);
    			attr_dev(rect26, "width", "1");
    			attr_dev(rect26, "height", "1");
    			attr_dev(rect26, "x", "10");
    			attr_dev(rect26, "y", "7");
    			attr_dev(rect26, "fill", "rgba(177, 78, 5, 1.00)");
    			add_location(rect26, file$8, 42, 12, 2927);
    			attr_dev(rect27, "width", "1");
    			attr_dev(rect27, "height", "1");
    			attr_dev(rect27, "x", "11");
    			attr_dev(rect27, "y", "7");
    			attr_dev(rect27, "fill", "rgba(91, 43, 42, 1.00)");
    			add_location(rect27, file$8, 43, 12, 3017);
    			attr_dev(rect28, "width", "1");
    			attr_dev(rect28, "height", "1");
    			attr_dev(rect28, "x", "2");
    			attr_dev(rect28, "y", "8");
    			attr_dev(rect28, "fill", "rgba(91, 43, 42, 1.00)");
    			add_location(rect28, file$8, 44, 12, 3107);
    			attr_dev(rect29, "width", "1");
    			attr_dev(rect29, "height", "1");
    			attr_dev(rect29, "x", "3");
    			attr_dev(rect29, "y", "8");
    			attr_dev(rect29, "fill", "rgba(177, 78, 5, 1.00)");
    			add_location(rect29, file$8, 45, 12, 3196);
    			attr_dev(rect30, "width", "1");
    			attr_dev(rect30, "height", "1");
    			attr_dev(rect30, "x", "4");
    			attr_dev(rect30, "y", "8");
    			attr_dev(rect30, "fill", "rgba(177, 78, 5, 1.00)");
    			add_location(rect30, file$8, 46, 12, 3285);
    			attr_dev(rect31, "width", "6");
    			attr_dev(rect31, "height", "1");
    			attr_dev(rect31, "x", "5");
    			attr_dev(rect31, "y", "8");
    			attr_dev(rect31, "fill", "rgba(91, 43, 42, 1.00)");
    			add_location(rect31, file$8, 47, 12, 3374);
    			attr_dev(rect32, "width", "1");
    			attr_dev(rect32, "height", "1");
    			attr_dev(rect32, "x", "3");
    			attr_dev(rect32, "y", "9");
    			attr_dev(rect32, "fill", "rgba(91, 43, 42, 1.00)");
    			add_location(rect32, file$8, 48, 12, 3463);
    			attr_dev(rect33, "width", "1");
    			attr_dev(rect33, "height", "1");
    			attr_dev(rect33, "x", "4");
    			attr_dev(rect33, "y", "9");
    			attr_dev(rect33, "fill", "rgba(177, 78, 5, 1.00)");
    			add_location(rect33, file$8, 49, 12, 3552);
    			attr_dev(rect34, "width", "1");
    			attr_dev(rect34, "height", "1");
    			attr_dev(rect34, "x", "5");
    			attr_dev(rect34, "y", "9");
    			attr_dev(rect34, "fill", "rgba(91, 43, 42, 1.00)");
    			add_location(rect34, file$8, 50, 12, 3641);
    			attr_dev(rect35, "width", "2");
    			attr_dev(rect35, "height", "1");
    			attr_dev(rect35, "x", "4");
    			attr_dev(rect35, "y", "10");
    			attr_dev(rect35, "fill", "rgba(91, 43, 42, 1.00)");
    			add_location(rect35, file$8, 51, 12, 3730);
    			attr_dev(pattern, "id", "pppixelate-pattern");
    			attr_dev(pattern, "width", "20");
    			attr_dev(pattern, "height", "20");
    			attr_dev(pattern, "patternUnits", "userSpaceOnUse");
    			attr_dev(pattern, "patternTransform", "translate(0 0) scale(40) rotate(0)");
    			attr_dev(pattern, "shape-rendering", "crispEdges");
    			add_location(pattern, file$8, 15, 8, 404);
    			add_location(defs, file$8, 14, 4, 389);
    			attr_dev(rect36, "width", "100%");
    			attr_dev(rect36, "height", "100%");
    			attr_dev(rect36, "fill", "url(#pppixelate-pattern)");
    			add_location(rect36, file$8, 54, 4, 3843);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "version", "1.1");
    			attr_dev(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg, "xmlns:svgjs", "http://svgjs.dev/svgjs");
    			attr_dev(svg, "viewBox", "0 0 480 480");
    			attr_dev(svg, "preserveAspectRatio", "xMidYMid slice");
    			attr_dev(svg, "class", "svelte-1y7hj8g");
    			add_location(svg, file$8, 6, 0, 166);

    			attr_dev(button, "style", button_style_value = /*dir*/ ctx[1] === 'right'
    			? 'right: 0px; --dir: -1'
    			: '--dir: 1');

    			attr_dev(button, "class", "svelte-1y7hj8g");
    			add_location(button, file$8, 5, 0, 75);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, svg);
    			append_dev(svg, defs);
    			append_dev(defs, pattern);
    			append_dev(pattern, rect0);
    			append_dev(pattern, rect1);
    			append_dev(pattern, rect2);
    			append_dev(pattern, rect3);
    			append_dev(pattern, rect4);
    			append_dev(pattern, rect5);
    			append_dev(pattern, rect6);
    			append_dev(pattern, rect7);
    			append_dev(pattern, rect8);
    			append_dev(pattern, rect9);
    			append_dev(pattern, rect10);
    			append_dev(pattern, rect11);
    			append_dev(pattern, rect12);
    			append_dev(pattern, rect13);
    			append_dev(pattern, rect14);
    			append_dev(pattern, rect15);
    			append_dev(pattern, rect16);
    			append_dev(pattern, rect17);
    			append_dev(pattern, rect18);
    			append_dev(pattern, rect19);
    			append_dev(pattern, rect20);
    			append_dev(pattern, rect21);
    			append_dev(pattern, rect22);
    			append_dev(pattern, rect23);
    			append_dev(pattern, rect24);
    			append_dev(pattern, rect25);
    			append_dev(pattern, rect26);
    			append_dev(pattern, rect27);
    			append_dev(pattern, rect28);
    			append_dev(pattern, rect29);
    			append_dev(pattern, rect30);
    			append_dev(pattern, rect31);
    			append_dev(pattern, rect32);
    			append_dev(pattern, rect33);
    			append_dev(pattern, rect34);
    			append_dev(pattern, rect35);
    			append_dev(svg, rect36);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*onclick*/ ctx[0])) /*onclick*/ ctx[0].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*dir*/ 2 && button_style_value !== (button_style_value = /*dir*/ ctx[1] === 'right'
    			? 'right: 0px; --dir: -1'
    			: '--dir: 1')) {
    				attr_dev(button, "style", button_style_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Arrow', slots, []);
    	let { onclick } = $$props;
    	let { dir = 'left' } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (onclick === undefined && !('onclick' in $$props || $$self.$$.bound[$$self.$$.props['onclick']])) {
    			console.warn("<Arrow> was created without expected prop 'onclick'");
    		}
    	});

    	const writable_props = ['onclick', 'dir'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Arrow> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('onclick' in $$props) $$invalidate(0, onclick = $$props.onclick);
    		if ('dir' in $$props) $$invalidate(1, dir = $$props.dir);
    	};

    	$$self.$capture_state = () => ({ onclick, dir });

    	$$self.$inject_state = $$props => {
    		if ('onclick' in $$props) $$invalidate(0, onclick = $$props.onclick);
    		if ('dir' in $$props) $$invalidate(1, dir = $$props.dir);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [onclick, dir];
    }

    class Arrow extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { onclick: 0, dir: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Arrow",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get onclick() {
    		throw new Error("<Arrow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onclick(value) {
    		throw new Error("<Arrow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dir() {
    		throw new Error("<Arrow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dir(value) {
    		throw new Error("<Arrow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Line.svelte generated by Svelte v3.55.1 */

    const file$7 = "src/Line.svelte";

    function create_fragment$7(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "line svelte-1cn2wbl");
    			add_location(div, file$7, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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

    function instance$7($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Line', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Line> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Line extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Line",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/SkinSelector.svelte generated by Svelte v3.55.1 */
    const file$6 = "src/SkinSelector.svelte";

    function create_fragment$6(ctx) {
    	let div1;
    	let div0;
    	let arrow0;
    	let t0;
    	let line;
    	let t1;
    	let canvas;
    	let t2;
    	let arrow1;
    	let t3;
    	let input0;
    	let t4;
    	let input1;
    	let current;
    	let mounted;
    	let dispose;

    	arrow0 = new Arrow({
    			props: {
    				onclick: /*reduceSkin*/ ctx[4],
    				dir: "left"
    			},
    			$$inline: true
    		});

    	line = new Line({ $$inline: true });

    	arrow1 = new Arrow({
    			props: {
    				onclick: /*increaseSkin*/ ctx[5],
    				dir: "right"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(arrow0.$$.fragment);
    			t0 = space();
    			create_component(line.$$.fragment);
    			t1 = space();
    			canvas = element("canvas");
    			t2 = space();
    			create_component(arrow1.$$.fragment);
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			input1 = element("input");
    			attr_dev(canvas, "width", "640");
    			attr_dev(canvas, "height", "128");
    			add_location(canvas, file$6, 70, 8, 1876);
    			attr_dev(div0, "class", "inner svelte-1oxb2e4");
    			add_location(div0, file$6, 67, 4, 1782);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "min", "1");
    			attr_dev(input0, "max", "24");
    			add_location(input0, file$6, 73, 4, 2001);
    			attr_dev(input1, "type", "color");
    			add_location(input1, file$6, 74, 4, 2091);
    			attr_dev(div1, "class", "outer svelte-1oxb2e4");
    			add_location(div1, file$6, 66, 0, 1758);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(arrow0, div0, null);
    			append_dev(div0, t0);
    			mount_component(line, div0, null);
    			append_dev(div0, t1);
    			append_dev(div0, canvas);
    			/*canvas_binding*/ ctx[8](canvas);
    			append_dev(div0, t2);
    			mount_component(arrow1, div0, null);
    			append_dev(div1, t3);
    			append_dev(div1, input0);
    			set_input_value(input0, /*skinId*/ ctx[0]);
    			append_dev(div1, t4);
    			append_dev(div1, input1);
    			set_input_value(input1, /*eyeColor*/ ctx[1]);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[9]),
    					listen_dev(input0, "change", /*correctSkinId*/ ctx[3], false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[10])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*skinId*/ 1 && to_number(input0.value) !== /*skinId*/ ctx[0]) {
    				set_input_value(input0, /*skinId*/ ctx[0]);
    			}

    			if (dirty & /*eyeColor*/ 2) {
    				set_input_value(input1, /*eyeColor*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(arrow0.$$.fragment, local);
    			transition_in(line.$$.fragment, local);
    			transition_in(arrow1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(arrow0.$$.fragment, local);
    			transition_out(line.$$.fragment, local);
    			transition_out(arrow1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(arrow0);
    			destroy_component(line);
    			/*canvas_binding*/ ctx[8](null);
    			destroy_component(arrow1);
    			mounted = false;
    			run_all(dispose);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SkinSelector', slots, []);
    	let { skinId } = $$props;
    	let { bodySprite } = $$props;
    	let { skinData } = $$props;
    	let { eyeColor } = $$props;
    	let canvasElement;
    	let ctx;

    	onMount(() => {
    		ctx = getContext(canvasElement);
    		bodySprite.callbacks.push(() => draw());
    		draw();
    	});

    	afterUpdate(() => draw());

    	const draw = () => {
    		if (!ctx || !bodySprite.complete || !skinData) {
    			return;
    		}

    		let index = (skinId || 1) - 1;
    		drawHead(index - 2, 0);
    		drawHead(index - 1, 1);
    		drawHead(index + 0, 2);
    		drawHead(index + 1, 3);
    		drawHead(index + 2, 4);
    		fadeIn(ctx);
    		fadeOut(ctx);
    	};

    	const drawHead = (index, position) => {
    		index = (index < 0 ? 24 + index : index) % 24;
    		ctx.clearRect(position * 128, 0, 128, 128);
    		ctx.drawImage(bodySprite, 0, 0, 16, 15, position * 128, -16, 128, 120);

    		for (var i = 0; i < 12; i += 4) {
    			replaceColor(ctx, skinData.slice(i, i + 3), skinData.slice(index * 12 + i, index * 12 + i + 3), [position * 128, 0, position * 128 + 128, 128]);
    		}

    		ctx.fillStyle = eyeColor;
    		ctx.fillRect(position * 128 + 48, 72, 8, 16);
    		ctx.fillRect(position * 128 + 72, 72, 8, 16);
    	};

    	let correctSkinId = () => $$invalidate(0, skinId = Math.min(Math.max(skinId, 1), 24));
    	let reduceSkin = () => $$invalidate(0, skinId = (skinId + 22) % 24 + 1);
    	let increaseSkin = () => $$invalidate(0, skinId = skinId % 24 + 1);

    	$$self.$$.on_mount.push(function () {
    		if (skinId === undefined && !('skinId' in $$props || $$self.$$.bound[$$self.$$.props['skinId']])) {
    			console.warn("<SkinSelector> was created without expected prop 'skinId'");
    		}

    		if (bodySprite === undefined && !('bodySprite' in $$props || $$self.$$.bound[$$self.$$.props['bodySprite']])) {
    			console.warn("<SkinSelector> was created without expected prop 'bodySprite'");
    		}

    		if (skinData === undefined && !('skinData' in $$props || $$self.$$.bound[$$self.$$.props['skinData']])) {
    			console.warn("<SkinSelector> was created without expected prop 'skinData'");
    		}

    		if (eyeColor === undefined && !('eyeColor' in $$props || $$self.$$.bound[$$self.$$.props['eyeColor']])) {
    			console.warn("<SkinSelector> was created without expected prop 'eyeColor'");
    		}
    	});

    	const writable_props = ['skinId', 'bodySprite', 'skinData', 'eyeColor'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SkinSelector> was created with unknown prop '${key}'`);
    	});

    	function canvas_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvasElement = $$value;
    			$$invalidate(2, canvasElement);
    		});
    	}

    	function input0_input_handler() {
    		skinId = to_number(this.value);
    		$$invalidate(0, skinId);
    	}

    	function input1_input_handler() {
    		eyeColor = this.value;
    		$$invalidate(1, eyeColor);
    	}

    	$$self.$$set = $$props => {
    		if ('skinId' in $$props) $$invalidate(0, skinId = $$props.skinId);
    		if ('bodySprite' in $$props) $$invalidate(6, bodySprite = $$props.bodySprite);
    		if ('skinData' in $$props) $$invalidate(7, skinData = $$props.skinData);
    		if ('eyeColor' in $$props) $$invalidate(1, eyeColor = $$props.eyeColor);
    	};

    	$$self.$capture_state = () => ({
    		afterUpdate,
    		onMount,
    		Arrow,
    		Line,
    		replaceColor,
    		getContext,
    		fadeIn,
    		fadeOut,
    		skinId,
    		bodySprite,
    		skinData,
    		eyeColor,
    		canvasElement,
    		ctx,
    		draw,
    		drawHead,
    		correctSkinId,
    		reduceSkin,
    		increaseSkin
    	});

    	$$self.$inject_state = $$props => {
    		if ('skinId' in $$props) $$invalidate(0, skinId = $$props.skinId);
    		if ('bodySprite' in $$props) $$invalidate(6, bodySprite = $$props.bodySprite);
    		if ('skinData' in $$props) $$invalidate(7, skinData = $$props.skinData);
    		if ('eyeColor' in $$props) $$invalidate(1, eyeColor = $$props.eyeColor);
    		if ('canvasElement' in $$props) $$invalidate(2, canvasElement = $$props.canvasElement);
    		if ('ctx' in $$props) ctx = $$props.ctx;
    		if ('correctSkinId' in $$props) $$invalidate(3, correctSkinId = $$props.correctSkinId);
    		if ('reduceSkin' in $$props) $$invalidate(4, reduceSkin = $$props.reduceSkin);
    		if ('increaseSkin' in $$props) $$invalidate(5, increaseSkin = $$props.increaseSkin);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		skinId,
    		eyeColor,
    		canvasElement,
    		correctSkinId,
    		reduceSkin,
    		increaseSkin,
    		bodySprite,
    		skinData,
    		canvas_binding,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class SkinSelector extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			skinId: 0,
    			bodySprite: 6,
    			skinData: 7,
    			eyeColor: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SkinSelector",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get skinId() {
    		throw new Error("<SkinSelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set skinId(value) {
    		throw new Error("<SkinSelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bodySprite() {
    		throw new Error("<SkinSelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bodySprite(value) {
    		throw new Error("<SkinSelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get skinData() {
    		throw new Error("<SkinSelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set skinData(value) {
    		throw new Error("<SkinSelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get eyeColor() {
    		throw new Error("<SkinSelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set eyeColor(value) {
    		throw new Error("<SkinSelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/ShirtSelector.svelte generated by Svelte v3.55.1 */
    const file$5 = "src/ShirtSelector.svelte";

    function create_fragment$5(ctx) {
    	let div1;
    	let div0;
    	let arrow0;
    	let t0;
    	let line;
    	let t1;
    	let canvas;
    	let t2;
    	let arrow1;
    	let t3;
    	let input;
    	let current;
    	let mounted;
    	let dispose;

    	arrow0 = new Arrow({
    			props: {
    				onclick: /*reduceShirt*/ ctx[3],
    				dir: "left"
    			},
    			$$inline: true
    		});

    	line = new Line({ $$inline: true });

    	arrow1 = new Arrow({
    			props: {
    				onclick: /*increaseShirt*/ ctx[4],
    				dir: "right"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(arrow0.$$.fragment);
    			t0 = space();
    			create_component(line.$$.fragment);
    			t1 = space();
    			canvas = element("canvas");
    			t2 = space();
    			create_component(arrow1.$$.fragment);
    			t3 = space();
    			input = element("input");
    			attr_dev(canvas, "width", "640");
    			attr_dev(canvas, "height", "128");
    			add_location(canvas, file$5, 105, 8, 2859);
    			attr_dev(div0, "class", "inner svelte-1oxb2e4");
    			add_location(div0, file$5, 102, 4, 2764);
    			attr_dev(input, "type", "number");
    			attr_dev(input, "min", "1");
    			attr_dev(input, "max", "112");
    			add_location(input, file$5, 108, 4, 2985);
    			attr_dev(div1, "class", "outer svelte-1oxb2e4");
    			add_location(div1, file$5, 101, 0, 2740);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(arrow0, div0, null);
    			append_dev(div0, t0);
    			mount_component(line, div0, null);
    			append_dev(div0, t1);
    			append_dev(div0, canvas);
    			/*canvas_binding*/ ctx[8](canvas);
    			append_dev(div0, t2);
    			mount_component(arrow1, div0, null);
    			append_dev(div1, t3);
    			append_dev(div1, input);
    			set_input_value(input, /*shirtId*/ ctx[0]);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[9]),
    					listen_dev(input, "change", /*correctShirtId*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*shirtId*/ 1 && to_number(input.value) !== /*shirtId*/ ctx[0]) {
    				set_input_value(input, /*shirtId*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(arrow0.$$.fragment, local);
    			transition_in(line.$$.fragment, local);
    			transition_in(arrow1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(arrow0.$$.fragment, local);
    			transition_out(line.$$.fragment, local);
    			transition_out(arrow1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(arrow0);
    			destroy_component(line);
    			/*canvas_binding*/ ctx[8](null);
    			destroy_component(arrow1);
    			mounted = false;
    			run_all(dispose);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ShirtSelector', slots, []);
    	let { shirtId } = $$props;
    	let { shirtSprite } = $$props;
    	let { bodySprite } = $$props;
    	let { skinColors } = $$props;
    	let canvasElement;
    	let ctx;

    	onMount(() => {
    		ctx = getContext(canvasElement);
    		shirtSprite.callbacks.push(() => draw());
    		bodySprite.callbacks.push(() => draw());
    		draw();
    	});

    	afterUpdate(() => draw());

    	const draw = () => {
    		if (!ctx || !shirtSprite.complete || !bodySprite.complete) {
    			return;
    		}

    		let index = (shirtId || 1) - 1;
    		drawShirt(index - 2, 0);
    		drawShirt(index - 1, 1);
    		drawShirt(index + 0, 2);
    		drawShirt(index + 1, 3);
    		drawShirt(index + 2, 4);
    		fadeIn(ctx);
    		fadeOut(ctx);

    		if (!skinColors) {
    			return;
    		}

    		replaceColor(ctx, [107, 0, 58], skinColors[0], [0, 0, 640, 128]);
    		replaceColor(ctx, [224, 107, 101], skinColors[1], [0, 0, 640, 128]);
    		replaceColor(ctx, [249, 174, 137], skinColors[2], [0, 0, 640, 128]);
    	};

    	const drawShirt = (index, position) => {
    		index = (index < 0 ? 112 + index : index) % 112;
    		ctx.clearRect(position * 128, 0, 128, 128);
    		let xOffset = index % 16 * 8;
    		let yOffset = parseInt(index / 16) * 32;
    		ctx.drawImage(bodySprite, 96, 0, 16, 32, position * 128, -120, 128, 256);
    		ctx.drawImage(shirtSprite, xOffset, yOffset, 8, 8, position * 128 + 32, 0, 64, 64);
    		replaceColor(ctx, [142, 31, 12], ctx.getImageData(position * 128 + 36, 20, 1, 1).data.slice(0, 3), [position * 128, 0, position * 128 + 128, 128]); //Light red
    		replaceColor(ctx, [112, 23, 24], ctx.getImageData(position * 128 + 36, 28, 1, 1).data.slice(0, 3), [position * 128, 0, position * 128 + 128, 128]); //Middle red
    		replaceColor(ctx, [74, 12, 6], ctx.getImageData(position * 128 + 36, 36, 1, 1).data.slice(0, 3), [position * 128, 0, position * 128 + 128, 128]); //Dark red
    	};

    	let correctShirtId = () => $$invalidate(0, shirtId = Math.min(Math.max(shirtId, 1), 112));
    	let reduceShirt = () => $$invalidate(0, shirtId = (shirtId + 110) % 112 + 1);
    	let increaseShirt = () => $$invalidate(0, shirtId = shirtId % 112 + 1);

    	$$self.$$.on_mount.push(function () {
    		if (shirtId === undefined && !('shirtId' in $$props || $$self.$$.bound[$$self.$$.props['shirtId']])) {
    			console.warn("<ShirtSelector> was created without expected prop 'shirtId'");
    		}

    		if (shirtSprite === undefined && !('shirtSprite' in $$props || $$self.$$.bound[$$self.$$.props['shirtSprite']])) {
    			console.warn("<ShirtSelector> was created without expected prop 'shirtSprite'");
    		}

    		if (bodySprite === undefined && !('bodySprite' in $$props || $$self.$$.bound[$$self.$$.props['bodySprite']])) {
    			console.warn("<ShirtSelector> was created without expected prop 'bodySprite'");
    		}

    		if (skinColors === undefined && !('skinColors' in $$props || $$self.$$.bound[$$self.$$.props['skinColors']])) {
    			console.warn("<ShirtSelector> was created without expected prop 'skinColors'");
    		}
    	});

    	const writable_props = ['shirtId', 'shirtSprite', 'bodySprite', 'skinColors'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ShirtSelector> was created with unknown prop '${key}'`);
    	});

    	function canvas_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvasElement = $$value;
    			$$invalidate(1, canvasElement);
    		});
    	}

    	function input_input_handler() {
    		shirtId = to_number(this.value);
    		$$invalidate(0, shirtId);
    	}

    	$$self.$$set = $$props => {
    		if ('shirtId' in $$props) $$invalidate(0, shirtId = $$props.shirtId);
    		if ('shirtSprite' in $$props) $$invalidate(5, shirtSprite = $$props.shirtSprite);
    		if ('bodySprite' in $$props) $$invalidate(6, bodySprite = $$props.bodySprite);
    		if ('skinColors' in $$props) $$invalidate(7, skinColors = $$props.skinColors);
    	};

    	$$self.$capture_state = () => ({
    		afterUpdate,
    		onMount,
    		Arrow,
    		Line,
    		replaceColor,
    		getContext,
    		fadeIn,
    		fadeOut,
    		shirtId,
    		shirtSprite,
    		bodySprite,
    		skinColors,
    		canvasElement,
    		ctx,
    		draw,
    		drawShirt,
    		correctShirtId,
    		reduceShirt,
    		increaseShirt
    	});

    	$$self.$inject_state = $$props => {
    		if ('shirtId' in $$props) $$invalidate(0, shirtId = $$props.shirtId);
    		if ('shirtSprite' in $$props) $$invalidate(5, shirtSprite = $$props.shirtSprite);
    		if ('bodySprite' in $$props) $$invalidate(6, bodySprite = $$props.bodySprite);
    		if ('skinColors' in $$props) $$invalidate(7, skinColors = $$props.skinColors);
    		if ('canvasElement' in $$props) $$invalidate(1, canvasElement = $$props.canvasElement);
    		if ('ctx' in $$props) ctx = $$props.ctx;
    		if ('correctShirtId' in $$props) $$invalidate(2, correctShirtId = $$props.correctShirtId);
    		if ('reduceShirt' in $$props) $$invalidate(3, reduceShirt = $$props.reduceShirt);
    		if ('increaseShirt' in $$props) $$invalidate(4, increaseShirt = $$props.increaseShirt);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		shirtId,
    		canvasElement,
    		correctShirtId,
    		reduceShirt,
    		increaseShirt,
    		shirtSprite,
    		bodySprite,
    		skinColors,
    		canvas_binding,
    		input_input_handler
    	];
    }

    class ShirtSelector extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			shirtId: 0,
    			shirtSprite: 5,
    			bodySprite: 6,
    			skinColors: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ShirtSelector",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get shirtId() {
    		throw new Error("<ShirtSelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shirtId(value) {
    		throw new Error("<ShirtSelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get shirtSprite() {
    		throw new Error("<ShirtSelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shirtSprite(value) {
    		throw new Error("<ShirtSelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bodySprite() {
    		throw new Error("<ShirtSelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bodySprite(value) {
    		throw new Error("<ShirtSelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get skinColors() {
    		throw new Error("<ShirtSelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set skinColors(value) {
    		throw new Error("<ShirtSelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/PantSelector.svelte generated by Svelte v3.55.1 */
    const file$4 = "src/PantSelector.svelte";

    function create_fragment$4(ctx) {
    	let div1;
    	let div0;
    	let arrow0;
    	let t0;
    	let line;
    	let t1;
    	let canvas;
    	let t2;
    	let arrow1;
    	let t3;
    	let input0;
    	let t4;
    	let input1;
    	let current;
    	let mounted;
    	let dispose;

    	arrow0 = new Arrow({
    			props: {
    				onclick: /*reducePant*/ ctx[4],
    				dir: "left"
    			},
    			$$inline: true
    		});

    	line = new Line({ $$inline: true });

    	arrow1 = new Arrow({
    			props: {
    				onclick: /*increasePant*/ ctx[5],
    				dir: "right"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(arrow0.$$.fragment);
    			t0 = space();
    			create_component(line.$$.fragment);
    			t1 = space();
    			canvas = element("canvas");
    			t2 = space();
    			create_component(arrow1.$$.fragment);
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			input1 = element("input");
    			attr_dev(canvas, "width", "640");
    			attr_dev(canvas, "height", "128");
    			add_location(canvas, file$4, 59, 8, 1463);
    			attr_dev(div0, "class", "inner svelte-1oxb2e4");
    			add_location(div0, file$4, 56, 4, 1369);
    			attr_dev(input0, "type", "color");
    			add_location(input0, file$4, 62, 4, 1587);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "min", "1");
    			attr_dev(input1, "max", "4");
    			add_location(input1, file$4, 63, 4, 1637);
    			attr_dev(div1, "class", "outer svelte-1oxb2e4");
    			add_location(div1, file$4, 55, 0, 1345);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(arrow0, div0, null);
    			append_dev(div0, t0);
    			mount_component(line, div0, null);
    			append_dev(div0, t1);
    			append_dev(div0, canvas);
    			/*canvas_binding*/ ctx[7](canvas);
    			append_dev(div0, t2);
    			mount_component(arrow1, div0, null);
    			append_dev(div1, t3);
    			append_dev(div1, input0);
    			set_input_value(input0, /*pantColor*/ ctx[1]);
    			append_dev(div1, t4);
    			append_dev(div1, input1);
    			set_input_value(input1, /*pantId*/ ctx[0]);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[8]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[9]),
    					listen_dev(input1, "change", /*correctPantId*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*pantColor*/ 2) {
    				set_input_value(input0, /*pantColor*/ ctx[1]);
    			}

    			if (dirty & /*pantId*/ 1 && to_number(input1.value) !== /*pantId*/ ctx[0]) {
    				set_input_value(input1, /*pantId*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(arrow0.$$.fragment, local);
    			transition_in(line.$$.fragment, local);
    			transition_in(arrow1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(arrow0.$$.fragment, local);
    			transition_out(line.$$.fragment, local);
    			transition_out(arrow1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(arrow0);
    			destroy_component(line);
    			/*canvas_binding*/ ctx[7](null);
    			destroy_component(arrow1);
    			mounted = false;
    			run_all(dispose);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('PantSelector', slots, []);
    	let { pantId } = $$props;
    	let { pantColor } = $$props;
    	let { pantSprite } = $$props;
    	let canvasElement;
    	let ctx;

    	onMount(() => {
    		ctx = getContext(canvasElement);
    		pantSprite.callbacks.push(() => draw());
    		draw();
    	});

    	afterUpdate(() => draw());

    	const draw = () => {
    		if (!ctx || !pantSprite.complete) {
    			return;
    		}

    		let index = (pantId || 1) - 1;
    		drawPant(index - 2, 0);
    		drawPant(index - 1, 1);
    		drawPant(index + 0, 2);
    		drawPant(index + 1, 3);
    		drawPant(index + 2, 4);
    		tint(ctx, pantColor, [0, 0, 640, 128]);
    		fadeIn(ctx);
    		fadeOut(ctx);
    	};

    	const drawPant = (index, position) => {
    		index = (index < 0 ? 4 + index : index) % 4;
    		ctx.clearRect(position * 128, 0, 128, 128);
    		ctx.drawImage(pantSprite, index * 192, 0, 16, 32, position * 128, -128, 128, 256);
    	};

    	let correctPantId = () => $$invalidate(0, pantId = Math.min(Math.max(pantId, 1), 4));
    	let reducePant = () => $$invalidate(0, pantId = (pantId + 2) % 4 + 1);
    	let increasePant = () => $$invalidate(0, pantId = pantId % 4 + 1);

    	$$self.$$.on_mount.push(function () {
    		if (pantId === undefined && !('pantId' in $$props || $$self.$$.bound[$$self.$$.props['pantId']])) {
    			console.warn("<PantSelector> was created without expected prop 'pantId'");
    		}

    		if (pantColor === undefined && !('pantColor' in $$props || $$self.$$.bound[$$self.$$.props['pantColor']])) {
    			console.warn("<PantSelector> was created without expected prop 'pantColor'");
    		}

    		if (pantSprite === undefined && !('pantSprite' in $$props || $$self.$$.bound[$$self.$$.props['pantSprite']])) {
    			console.warn("<PantSelector> was created without expected prop 'pantSprite'");
    		}
    	});

    	const writable_props = ['pantId', 'pantColor', 'pantSprite'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PantSelector> was created with unknown prop '${key}'`);
    	});

    	function canvas_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvasElement = $$value;
    			$$invalidate(2, canvasElement);
    		});
    	}

    	function input0_input_handler() {
    		pantColor = this.value;
    		$$invalidate(1, pantColor);
    	}

    	function input1_input_handler() {
    		pantId = to_number(this.value);
    		$$invalidate(0, pantId);
    	}

    	$$self.$$set = $$props => {
    		if ('pantId' in $$props) $$invalidate(0, pantId = $$props.pantId);
    		if ('pantColor' in $$props) $$invalidate(1, pantColor = $$props.pantColor);
    		if ('pantSprite' in $$props) $$invalidate(6, pantSprite = $$props.pantSprite);
    	};

    	$$self.$capture_state = () => ({
    		afterUpdate,
    		onMount,
    		Arrow,
    		Line,
    		tint,
    		getContext,
    		fadeIn,
    		fadeOut,
    		pantId,
    		pantColor,
    		pantSprite,
    		canvasElement,
    		ctx,
    		draw,
    		drawPant,
    		correctPantId,
    		reducePant,
    		increasePant
    	});

    	$$self.$inject_state = $$props => {
    		if ('pantId' in $$props) $$invalidate(0, pantId = $$props.pantId);
    		if ('pantColor' in $$props) $$invalidate(1, pantColor = $$props.pantColor);
    		if ('pantSprite' in $$props) $$invalidate(6, pantSprite = $$props.pantSprite);
    		if ('canvasElement' in $$props) $$invalidate(2, canvasElement = $$props.canvasElement);
    		if ('ctx' in $$props) ctx = $$props.ctx;
    		if ('correctPantId' in $$props) $$invalidate(3, correctPantId = $$props.correctPantId);
    		if ('reducePant' in $$props) $$invalidate(4, reducePant = $$props.reducePant);
    		if ('increasePant' in $$props) $$invalidate(5, increasePant = $$props.increasePant);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		pantId,
    		pantColor,
    		canvasElement,
    		correctPantId,
    		reducePant,
    		increasePant,
    		pantSprite,
    		canvas_binding,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class PantSelector extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { pantId: 0, pantColor: 1, pantSprite: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PantSelector",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get pantId() {
    		throw new Error("<PantSelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pantId(value) {
    		throw new Error("<PantSelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pantColor() {
    		throw new Error("<PantSelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pantColor(value) {
    		throw new Error("<PantSelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pantSprite() {
    		throw new Error("<PantSelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pantSprite(value) {
    		throw new Error("<PantSelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/HairSelector.svelte generated by Svelte v3.55.1 */
    const file$3 = "src/HairSelector.svelte";

    function create_fragment$3(ctx) {
    	let div1;
    	let div0;
    	let arrow0;
    	let t0;
    	let line;
    	let t1;
    	let canvas;
    	let t2;
    	let arrow1;
    	let t3;
    	let input0;
    	let t4;
    	let input1;
    	let current;
    	let mounted;
    	let dispose;

    	arrow0 = new Arrow({
    			props: {
    				onclick: /*reduceHair*/ ctx[4],
    				dir: "left"
    			},
    			$$inline: true
    		});

    	line = new Line({ $$inline: true });

    	arrow1 = new Arrow({
    			props: {
    				onclick: /*increaseHair*/ ctx[5],
    				dir: "right"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(arrow0.$$.fragment);
    			t0 = space();
    			create_component(line.$$.fragment);
    			t1 = space();
    			canvas = element("canvas");
    			t2 = space();
    			create_component(arrow1.$$.fragment);
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			input1 = element("input");
    			attr_dev(canvas, "width", "640");
    			attr_dev(canvas, "height", "128");
    			add_location(canvas, file$3, 63, 8, 1808);
    			attr_dev(div0, "class", "inner svelte-1oxb2e4");
    			add_location(div0, file$3, 60, 4, 1714);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "min", "0");
    			attr_dev(input0, "max", "79");
    			add_location(input0, file$3, 66, 4, 1933);
    			attr_dev(input1, "type", "color");
    			add_location(input1, file$3, 67, 4, 2023);
    			attr_dev(div1, "class", "outer svelte-1oxb2e4");
    			add_location(div1, file$3, 59, 0, 1690);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(arrow0, div0, null);
    			append_dev(div0, t0);
    			mount_component(line, div0, null);
    			append_dev(div0, t1);
    			append_dev(div0, canvas);
    			/*canvas_binding*/ ctx[8](canvas);
    			append_dev(div0, t2);
    			mount_component(arrow1, div0, null);
    			append_dev(div1, t3);
    			append_dev(div1, input0);
    			set_input_value(input0, /*hairId*/ ctx[0]);
    			append_dev(div1, t4);
    			append_dev(div1, input1);
    			set_input_value(input1, /*hairColor*/ ctx[1]);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[9]),
    					listen_dev(input0, "change", /*correctHairId*/ ctx[3], false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[10])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*hairId*/ 1 && to_number(input0.value) !== /*hairId*/ ctx[0]) {
    				set_input_value(input0, /*hairId*/ ctx[0]);
    			}

    			if (dirty & /*hairColor*/ 2) {
    				set_input_value(input1, /*hairColor*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(arrow0.$$.fragment, local);
    			transition_in(line.$$.fragment, local);
    			transition_in(arrow1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(arrow0.$$.fragment, local);
    			transition_out(line.$$.fragment, local);
    			transition_out(arrow1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(arrow0);
    			destroy_component(line);
    			/*canvas_binding*/ ctx[8](null);
    			destroy_component(arrow1);
    			mounted = false;
    			run_all(dispose);
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

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('HairSelector', slots, []);
    	let { hairId } = $$props;
    	let { hairColor } = $$props;
    	let { hairSprite } = $$props;
    	let { hairFancySprite } = $$props;
    	let canvasElement;
    	let ctx;

    	onMount(() => {
    		ctx = getContext(canvasElement);
    		hairSprite.callbacks.push(() => draw());
    		hairFancySprite.callbacks.push(() => draw());
    		draw();
    	});

    	afterUpdate(() => draw());

    	const draw = () => {
    		if (!ctx || !hairSprite.complete || !hairFancySprite.complete) {
    			return;
    		}

    		let index = (hairId || 1) - 1;
    		drawHair(index - 2, 0);
    		drawHair(index - 1, 1);
    		drawHair(index + 0, 2);
    		drawHair(index + 1, 3);
    		drawHair(index + 2, 4);
    		tint(ctx, hairColor, [0, 0, 640, 128]);
    		fadeIn(ctx);
    		fadeOut(ctx);
    	};

    	const drawHair = (index, position) => {
    		index = (index < 0 ? 79 + index : index) % 79;
    		const fancy = index > 55;
    		index = fancy ? index - 56 : index;
    		const xOffset = index % 8 * 16;
    		const yOffset = parseInt(index / 8) * (fancy ? 128 : 96);
    		ctx.clearRect(position * 128, 0, 128, 128);
    		ctx.drawImage(fancy ? hairFancySprite : hairSprite, xOffset, yOffset, 16, 32, position * 128, fancy ? -24 : -16, 128, 256);
    	};

    	let correctHairId = () => $$invalidate(0, hairId = (hairId < 1 ? 78 + hairId : hairId) % 79);
    	let reduceHair = () => $$invalidate(0, hairId = (hairId + 77) % 79 + 1);
    	let increaseHair = () => $$invalidate(0, hairId = hairId % 79 + 1);

    	$$self.$$.on_mount.push(function () {
    		if (hairId === undefined && !('hairId' in $$props || $$self.$$.bound[$$self.$$.props['hairId']])) {
    			console.warn("<HairSelector> was created without expected prop 'hairId'");
    		}

    		if (hairColor === undefined && !('hairColor' in $$props || $$self.$$.bound[$$self.$$.props['hairColor']])) {
    			console.warn("<HairSelector> was created without expected prop 'hairColor'");
    		}

    		if (hairSprite === undefined && !('hairSprite' in $$props || $$self.$$.bound[$$self.$$.props['hairSprite']])) {
    			console.warn("<HairSelector> was created without expected prop 'hairSprite'");
    		}

    		if (hairFancySprite === undefined && !('hairFancySprite' in $$props || $$self.$$.bound[$$self.$$.props['hairFancySprite']])) {
    			console.warn("<HairSelector> was created without expected prop 'hairFancySprite'");
    		}
    	});

    	const writable_props = ['hairId', 'hairColor', 'hairSprite', 'hairFancySprite'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<HairSelector> was created with unknown prop '${key}'`);
    	});

    	function canvas_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvasElement = $$value;
    			$$invalidate(2, canvasElement);
    		});
    	}

    	function input0_input_handler() {
    		hairId = to_number(this.value);
    		$$invalidate(0, hairId);
    	}

    	function input1_input_handler() {
    		hairColor = this.value;
    		$$invalidate(1, hairColor);
    	}

    	$$self.$$set = $$props => {
    		if ('hairId' in $$props) $$invalidate(0, hairId = $$props.hairId);
    		if ('hairColor' in $$props) $$invalidate(1, hairColor = $$props.hairColor);
    		if ('hairSprite' in $$props) $$invalidate(6, hairSprite = $$props.hairSprite);
    		if ('hairFancySprite' in $$props) $$invalidate(7, hairFancySprite = $$props.hairFancySprite);
    	};

    	$$self.$capture_state = () => ({
    		afterUpdate,
    		onMount,
    		Arrow,
    		Line,
    		tint,
    		getContext,
    		fadeIn,
    		fadeOut,
    		hairId,
    		hairColor,
    		hairSprite,
    		hairFancySprite,
    		canvasElement,
    		ctx,
    		draw,
    		drawHair,
    		correctHairId,
    		reduceHair,
    		increaseHair
    	});

    	$$self.$inject_state = $$props => {
    		if ('hairId' in $$props) $$invalidate(0, hairId = $$props.hairId);
    		if ('hairColor' in $$props) $$invalidate(1, hairColor = $$props.hairColor);
    		if ('hairSprite' in $$props) $$invalidate(6, hairSprite = $$props.hairSprite);
    		if ('hairFancySprite' in $$props) $$invalidate(7, hairFancySprite = $$props.hairFancySprite);
    		if ('canvasElement' in $$props) $$invalidate(2, canvasElement = $$props.canvasElement);
    		if ('ctx' in $$props) ctx = $$props.ctx;
    		if ('correctHairId' in $$props) $$invalidate(3, correctHairId = $$props.correctHairId);
    		if ('reduceHair' in $$props) $$invalidate(4, reduceHair = $$props.reduceHair);
    		if ('increaseHair' in $$props) $$invalidate(5, increaseHair = $$props.increaseHair);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		hairId,
    		hairColor,
    		canvasElement,
    		correctHairId,
    		reduceHair,
    		increaseHair,
    		hairSprite,
    		hairFancySprite,
    		canvas_binding,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class HairSelector extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			hairId: 0,
    			hairColor: 1,
    			hairSprite: 6,
    			hairFancySprite: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HairSelector",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get hairId() {
    		throw new Error("<HairSelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hairId(value) {
    		throw new Error("<HairSelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hairColor() {
    		throw new Error("<HairSelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hairColor(value) {
    		throw new Error("<HairSelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hairSprite() {
    		throw new Error("<HairSelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hairSprite(value) {
    		throw new Error("<HairSelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hairFancySprite() {
    		throw new Error("<HairSelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hairFancySprite(value) {
    		throw new Error("<HairSelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/AccessorySelector.svelte generated by Svelte v3.55.1 */
    const file$2 = "src/AccessorySelector.svelte";

    function create_fragment$2(ctx) {
    	let div1;
    	let div0;
    	let arrow0;
    	let t0;
    	let line;
    	let t1;
    	let canvas0;
    	let t2;
    	let canvas1;
    	let t3;
    	let arrow1;
    	let t4;
    	let input;
    	let current;
    	let mounted;
    	let dispose;

    	arrow0 = new Arrow({
    			props: {
    				onclick: /*reduceAccessory*/ ctx[4],
    				dir: "left"
    			},
    			$$inline: true
    		});

    	line = new Line({ $$inline: true });

    	arrow1 = new Arrow({
    			props: {
    				onclick: /*increaseAccessory*/ ctx[5],
    				dir: "right"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(arrow0.$$.fragment);
    			t0 = space();
    			create_component(line.$$.fragment);
    			t1 = space();
    			canvas0 = element("canvas");
    			t2 = space();
    			canvas1 = element("canvas");
    			t3 = space();
    			create_component(arrow1.$$.fragment);
    			t4 = space();
    			input = element("input");
    			attr_dev(canvas0, "width", "640");
    			attr_dev(canvas0, "height", "128");
    			set_style(canvas0, "position", "absolute");
    			add_location(canvas0, file$2, 99, 8, 2840);
    			attr_dev(canvas1, "width", "640");
    			attr_dev(canvas1, "height", "128");
    			set_style(canvas1, "position", "relative");
    			set_style(canvas1, "z-index", "100");
    			add_location(canvas1, file$2, 100, 8, 2929);
    			attr_dev(div0, "class", "inner svelte-1oxb2e4");
    			add_location(div0, file$2, 96, 4, 2741);
    			attr_dev(input, "type", "number");
    			attr_dev(input, "min", "1");
    			attr_dev(input, "max", "20");
    			add_location(input, file$2, 103, 4, 3099);
    			attr_dev(div1, "class", "outer svelte-1oxb2e4");
    			add_location(div1, file$2, 95, 0, 2717);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(arrow0, div0, null);
    			append_dev(div0, t0);
    			mount_component(line, div0, null);
    			append_dev(div0, t1);
    			append_dev(div0, canvas0);
    			/*canvas0_binding*/ ctx[12](canvas0);
    			append_dev(div0, t2);
    			append_dev(div0, canvas1);
    			/*canvas1_binding*/ ctx[13](canvas1);
    			append_dev(div0, t3);
    			mount_component(arrow1, div0, null);
    			append_dev(div1, t4);
    			append_dev(div1, input);
    			set_input_value(input, /*accessoryId*/ ctx[0]);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[14]),
    					listen_dev(input, "change", /*correctAccessoryId*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*accessoryId*/ 1 && to_number(input.value) !== /*accessoryId*/ ctx[0]) {
    				set_input_value(input, /*accessoryId*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(arrow0.$$.fragment, local);
    			transition_in(line.$$.fragment, local);
    			transition_in(arrow1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(arrow0.$$.fragment, local);
    			transition_out(line.$$.fragment, local);
    			transition_out(arrow1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(arrow0);
    			destroy_component(line);
    			/*canvas0_binding*/ ctx[12](null);
    			/*canvas1_binding*/ ctx[13](null);
    			destroy_component(arrow1);
    			mounted = false;
    			run_all(dispose);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AccessorySelector', slots, []);
    	let { skinId } = $$props;
    	let { bodySprite } = $$props;
    	let { skinData } = $$props;
    	let { eyeColor } = $$props;
    	let { hairColor } = $$props;
    	let { accessoryId } = $$props;
    	let { accessorySprite } = $$props;
    	let skinCanvas;
    	let skinCtx;
    	let canvasElement;
    	let ctx;

    	onMount(() => {
    		skinCtx = getContext(skinCanvas);
    		ctx = getContext(canvasElement);
    		bodySprite.callbacks.push(() => draw());
    		accessorySprite.callbacks.push(() => draw());
    		draw();
    	});

    	afterUpdate(() => draw());

    	const draw = () => {
    		if (!ctx || !bodySprite.complete || !skinData || !accessorySprite.complete) {
    			return;
    		}

    		let skin = (skinId || 1) - 1;
    		[0, 1, 2, 3, 4].forEach(i => drawHead(skin, i));
    		let index = (accessoryId || 1) - 2;
    		drawAccessory(index - 2, 0);
    		drawAccessory(index - 1, 1);
    		drawAccessory(index + 0, 2);
    		drawAccessory(index + 1, 3);
    		drawAccessory(index + 2, 4);
    		fadeIn(ctx);
    		fadeIn(skinCtx);
    		fadeOut(ctx);
    		fadeOut(skinCtx);
    	};

    	const drawAccessory = (index, position) => {
    		index = (index < 0 ? 20 + index : index) % 20;
    		ctx.clearRect(position * 128, 0, 128, 128);
    		const xOffset = index % 8 * 16;
    		const yOffset = parseInt(index / 8) * 32;
    		ctx.drawImage(accessorySprite, xOffset, yOffset, 16, 15, position * 128, 0, 128, 120);

    		if (index < 6) {
    			tint(ctx, hairColor, [position * 128, 0, 128, 120]);
    		}
    	};

    	const drawHead = (index, position) => {
    		index = (index < 0 ? 24 + index : index) % 24;
    		skinCtx.clearRect(position * 128, 0, 128, 128);
    		skinCtx.drawImage(bodySprite, 0, 0, 16, 15, position * 128, -16, 128, 120);

    		for (var i = 0; i < 12; i += 4) {
    			replaceColor(skinCtx, skinData.slice(i, i + 3), skinData.slice(index * 12 + i, index * 12 + i + 3), [position * 128, 0, position * 128 + 128, 128]);
    		}

    		skinCtx.fillStyle = eyeColor;
    		skinCtx.fillRect(position * 128 + 48, 72, 8, 16);
    		skinCtx.fillRect(position * 128 + 72, 72, 8, 16);
    	};

    	let correctAccessoryId = () => $$invalidate(0, accessoryId = Math.min(Math.max(accessoryId, 1), 20));
    	let reduceAccessory = () => $$invalidate(0, accessoryId = (accessoryId + 18) % 20 + 1);
    	let increaseAccessory = () => $$invalidate(0, accessoryId = accessoryId % 20 + 1);

    	$$self.$$.on_mount.push(function () {
    		if (skinId === undefined && !('skinId' in $$props || $$self.$$.bound[$$self.$$.props['skinId']])) {
    			console.warn("<AccessorySelector> was created without expected prop 'skinId'");
    		}

    		if (bodySprite === undefined && !('bodySprite' in $$props || $$self.$$.bound[$$self.$$.props['bodySprite']])) {
    			console.warn("<AccessorySelector> was created without expected prop 'bodySprite'");
    		}

    		if (skinData === undefined && !('skinData' in $$props || $$self.$$.bound[$$self.$$.props['skinData']])) {
    			console.warn("<AccessorySelector> was created without expected prop 'skinData'");
    		}

    		if (eyeColor === undefined && !('eyeColor' in $$props || $$self.$$.bound[$$self.$$.props['eyeColor']])) {
    			console.warn("<AccessorySelector> was created without expected prop 'eyeColor'");
    		}

    		if (hairColor === undefined && !('hairColor' in $$props || $$self.$$.bound[$$self.$$.props['hairColor']])) {
    			console.warn("<AccessorySelector> was created without expected prop 'hairColor'");
    		}

    		if (accessoryId === undefined && !('accessoryId' in $$props || $$self.$$.bound[$$self.$$.props['accessoryId']])) {
    			console.warn("<AccessorySelector> was created without expected prop 'accessoryId'");
    		}

    		if (accessorySprite === undefined && !('accessorySprite' in $$props || $$self.$$.bound[$$self.$$.props['accessorySprite']])) {
    			console.warn("<AccessorySelector> was created without expected prop 'accessorySprite'");
    		}
    	});

    	const writable_props = [
    		'skinId',
    		'bodySprite',
    		'skinData',
    		'eyeColor',
    		'hairColor',
    		'accessoryId',
    		'accessorySprite'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AccessorySelector> was created with unknown prop '${key}'`);
    	});

    	function canvas0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			skinCanvas = $$value;
    			$$invalidate(1, skinCanvas);
    		});
    	}

    	function canvas1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvasElement = $$value;
    			$$invalidate(2, canvasElement);
    		});
    	}

    	function input_input_handler() {
    		accessoryId = to_number(this.value);
    		$$invalidate(0, accessoryId);
    	}

    	$$self.$$set = $$props => {
    		if ('skinId' in $$props) $$invalidate(6, skinId = $$props.skinId);
    		if ('bodySprite' in $$props) $$invalidate(7, bodySprite = $$props.bodySprite);
    		if ('skinData' in $$props) $$invalidate(8, skinData = $$props.skinData);
    		if ('eyeColor' in $$props) $$invalidate(9, eyeColor = $$props.eyeColor);
    		if ('hairColor' in $$props) $$invalidate(10, hairColor = $$props.hairColor);
    		if ('accessoryId' in $$props) $$invalidate(0, accessoryId = $$props.accessoryId);
    		if ('accessorySprite' in $$props) $$invalidate(11, accessorySprite = $$props.accessorySprite);
    	};

    	$$self.$capture_state = () => ({
    		afterUpdate,
    		onMount,
    		Arrow,
    		Line,
    		replaceColor,
    		tint,
    		getContext,
    		fadeIn,
    		fadeOut,
    		skinId,
    		bodySprite,
    		skinData,
    		eyeColor,
    		hairColor,
    		accessoryId,
    		accessorySprite,
    		skinCanvas,
    		skinCtx,
    		canvasElement,
    		ctx,
    		draw,
    		drawAccessory,
    		drawHead,
    		correctAccessoryId,
    		reduceAccessory,
    		increaseAccessory
    	});

    	$$self.$inject_state = $$props => {
    		if ('skinId' in $$props) $$invalidate(6, skinId = $$props.skinId);
    		if ('bodySprite' in $$props) $$invalidate(7, bodySprite = $$props.bodySprite);
    		if ('skinData' in $$props) $$invalidate(8, skinData = $$props.skinData);
    		if ('eyeColor' in $$props) $$invalidate(9, eyeColor = $$props.eyeColor);
    		if ('hairColor' in $$props) $$invalidate(10, hairColor = $$props.hairColor);
    		if ('accessoryId' in $$props) $$invalidate(0, accessoryId = $$props.accessoryId);
    		if ('accessorySprite' in $$props) $$invalidate(11, accessorySprite = $$props.accessorySprite);
    		if ('skinCanvas' in $$props) $$invalidate(1, skinCanvas = $$props.skinCanvas);
    		if ('skinCtx' in $$props) skinCtx = $$props.skinCtx;
    		if ('canvasElement' in $$props) $$invalidate(2, canvasElement = $$props.canvasElement);
    		if ('ctx' in $$props) ctx = $$props.ctx;
    		if ('correctAccessoryId' in $$props) $$invalidate(3, correctAccessoryId = $$props.correctAccessoryId);
    		if ('reduceAccessory' in $$props) $$invalidate(4, reduceAccessory = $$props.reduceAccessory);
    		if ('increaseAccessory' in $$props) $$invalidate(5, increaseAccessory = $$props.increaseAccessory);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		accessoryId,
    		skinCanvas,
    		canvasElement,
    		correctAccessoryId,
    		reduceAccessory,
    		increaseAccessory,
    		skinId,
    		bodySprite,
    		skinData,
    		eyeColor,
    		hairColor,
    		accessorySprite,
    		canvas0_binding,
    		canvas1_binding,
    		input_input_handler
    	];
    }

    class AccessorySelector extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			skinId: 6,
    			bodySprite: 7,
    			skinData: 8,
    			eyeColor: 9,
    			hairColor: 10,
    			accessoryId: 0,
    			accessorySprite: 11
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AccessorySelector",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get skinId() {
    		throw new Error("<AccessorySelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set skinId(value) {
    		throw new Error("<AccessorySelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bodySprite() {
    		throw new Error("<AccessorySelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bodySprite(value) {
    		throw new Error("<AccessorySelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get skinData() {
    		throw new Error("<AccessorySelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set skinData(value) {
    		throw new Error("<AccessorySelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get eyeColor() {
    		throw new Error("<AccessorySelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set eyeColor(value) {
    		throw new Error("<AccessorySelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hairColor() {
    		throw new Error("<AccessorySelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hairColor(value) {
    		throw new Error("<AccessorySelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get accessoryId() {
    		throw new Error("<AccessorySelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set accessoryId(value) {
    		throw new Error("<AccessorySelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get accessorySprite() {
    		throw new Error("<AccessorySelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set accessorySprite(value) {
    		throw new Error("<AccessorySelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/CharacterInputs.svelte generated by Svelte v3.55.1 */
    const file$1 = "src/CharacterInputs.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let hairselector;
    	let updating_hairId;
    	let updating_hairColor;
    	let t0;
    	let skinselector;
    	let updating_skinId;
    	let updating_eyeColor;
    	let t1;
    	let shirtselector;
    	let updating_shirtId;
    	let t2;
    	let pantselector;
    	let updating_pantId;
    	let updating_pantColor;
    	let t3;
    	let accessoryselector;
    	let updating_accessoryId;
    	let current;

    	function hairselector_hairId_binding(value) {
    		/*hairselector_hairId_binding*/ ctx[16](value);
    	}

    	function hairselector_hairColor_binding(value) {
    		/*hairselector_hairColor_binding*/ ctx[17](value);
    	}

    	let hairselector_props = {
    		hairSprite: /*hairSprite*/ ctx[8],
    		hairFancySprite: /*hairFancySprite*/ ctx[9]
    	};

    	if (/*hairId*/ ctx[1] !== void 0) {
    		hairselector_props.hairId = /*hairId*/ ctx[1];
    	}

    	if (/*hairColor*/ ctx[0] !== void 0) {
    		hairselector_props.hairColor = /*hairColor*/ ctx[0];
    	}

    	hairselector = new HairSelector({
    			props: hairselector_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(hairselector, 'hairId', hairselector_hairId_binding));
    	binding_callbacks.push(() => bind(hairselector, 'hairColor', hairselector_hairColor_binding));

    	function skinselector_skinId_binding(value) {
    		/*skinselector_skinId_binding*/ ctx[18](value);
    	}

    	function skinselector_eyeColor_binding(value) {
    		/*skinselector_eyeColor_binding*/ ctx[19](value);
    	}

    	let skinselector_props = {
    		bodySprite: /*bodySprite*/ ctx[10],
    		skinData: /*skinData*/ ctx[12]
    	};

    	if (/*skinId*/ ctx[3] !== void 0) {
    		skinselector_props.skinId = /*skinId*/ ctx[3];
    	}

    	if (/*eyeColor*/ ctx[2] !== void 0) {
    		skinselector_props.eyeColor = /*eyeColor*/ ctx[2];
    	}

    	skinselector = new SkinSelector({
    			props: skinselector_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(skinselector, 'skinId', skinselector_skinId_binding));
    	binding_callbacks.push(() => bind(skinselector, 'eyeColor', skinselector_eyeColor_binding));

    	function shirtselector_shirtId_binding(value) {
    		/*shirtselector_shirtId_binding*/ ctx[20](value);
    	}

    	let shirtselector_props = {
    		shirtSprite: /*shirtSprite*/ ctx[13],
    		bodySprite: /*bodySprite*/ ctx[10],
    		skinColors: /*skinColors*/ ctx[11]
    	};

    	if (/*shirtId*/ ctx[4] !== void 0) {
    		shirtselector_props.shirtId = /*shirtId*/ ctx[4];
    	}

    	shirtselector = new ShirtSelector({
    			props: shirtselector_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(shirtselector, 'shirtId', shirtselector_shirtId_binding));

    	function pantselector_pantId_binding(value) {
    		/*pantselector_pantId_binding*/ ctx[21](value);
    	}

    	function pantselector_pantColor_binding(value) {
    		/*pantselector_pantColor_binding*/ ctx[22](value);
    	}

    	let pantselector_props = { pantSprite: /*pantSprite*/ ctx[14] };

    	if (/*pantId*/ ctx[6] !== void 0) {
    		pantselector_props.pantId = /*pantId*/ ctx[6];
    	}

    	if (/*pantColor*/ ctx[5] !== void 0) {
    		pantselector_props.pantColor = /*pantColor*/ ctx[5];
    	}

    	pantselector = new PantSelector({
    			props: pantselector_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(pantselector, 'pantId', pantselector_pantId_binding));
    	binding_callbacks.push(() => bind(pantselector, 'pantColor', pantselector_pantColor_binding));

    	function accessoryselector_accessoryId_binding(value) {
    		/*accessoryselector_accessoryId_binding*/ ctx[23](value);
    	}

    	let accessoryselector_props = {
    		bodySprite: /*bodySprite*/ ctx[10],
    		skinId: /*skinId*/ ctx[3],
    		skinData: /*skinData*/ ctx[12],
    		eyeColor: /*eyeColor*/ ctx[2],
    		hairColor: /*hairColor*/ ctx[0],
    		accessorySprite: /*accessorySprite*/ ctx[15]
    	};

    	if (/*accessoryId*/ ctx[7] !== void 0) {
    		accessoryselector_props.accessoryId = /*accessoryId*/ ctx[7];
    	}

    	accessoryselector = new AccessorySelector({
    			props: accessoryselector_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(accessoryselector, 'accessoryId', accessoryselector_accessoryId_binding));

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(hairselector.$$.fragment);
    			t0 = space();
    			create_component(skinselector.$$.fragment);
    			t1 = space();
    			create_component(shirtselector.$$.fragment);
    			t2 = space();
    			create_component(pantselector.$$.fragment);
    			t3 = space();
    			create_component(accessoryselector.$$.fragment);
    			attr_dev(div, "class", "svelte-brr2ul");
    			add_location(div, file$1, 30, 0, 787);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(hairselector, div, null);
    			append_dev(div, t0);
    			mount_component(skinselector, div, null);
    			append_dev(div, t1);
    			mount_component(shirtselector, div, null);
    			append_dev(div, t2);
    			mount_component(pantselector, div, null);
    			append_dev(div, t3);
    			mount_component(accessoryselector, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const hairselector_changes = {};
    			if (dirty & /*hairSprite*/ 256) hairselector_changes.hairSprite = /*hairSprite*/ ctx[8];
    			if (dirty & /*hairFancySprite*/ 512) hairselector_changes.hairFancySprite = /*hairFancySprite*/ ctx[9];

    			if (!updating_hairId && dirty & /*hairId*/ 2) {
    				updating_hairId = true;
    				hairselector_changes.hairId = /*hairId*/ ctx[1];
    				add_flush_callback(() => updating_hairId = false);
    			}

    			if (!updating_hairColor && dirty & /*hairColor*/ 1) {
    				updating_hairColor = true;
    				hairselector_changes.hairColor = /*hairColor*/ ctx[0];
    				add_flush_callback(() => updating_hairColor = false);
    			}

    			hairselector.$set(hairselector_changes);
    			const skinselector_changes = {};
    			if (dirty & /*bodySprite*/ 1024) skinselector_changes.bodySprite = /*bodySprite*/ ctx[10];
    			if (dirty & /*skinData*/ 4096) skinselector_changes.skinData = /*skinData*/ ctx[12];

    			if (!updating_skinId && dirty & /*skinId*/ 8) {
    				updating_skinId = true;
    				skinselector_changes.skinId = /*skinId*/ ctx[3];
    				add_flush_callback(() => updating_skinId = false);
    			}

    			if (!updating_eyeColor && dirty & /*eyeColor*/ 4) {
    				updating_eyeColor = true;
    				skinselector_changes.eyeColor = /*eyeColor*/ ctx[2];
    				add_flush_callback(() => updating_eyeColor = false);
    			}

    			skinselector.$set(skinselector_changes);
    			const shirtselector_changes = {};
    			if (dirty & /*shirtSprite*/ 8192) shirtselector_changes.shirtSprite = /*shirtSprite*/ ctx[13];
    			if (dirty & /*bodySprite*/ 1024) shirtselector_changes.bodySprite = /*bodySprite*/ ctx[10];
    			if (dirty & /*skinColors*/ 2048) shirtselector_changes.skinColors = /*skinColors*/ ctx[11];

    			if (!updating_shirtId && dirty & /*shirtId*/ 16) {
    				updating_shirtId = true;
    				shirtselector_changes.shirtId = /*shirtId*/ ctx[4];
    				add_flush_callback(() => updating_shirtId = false);
    			}

    			shirtselector.$set(shirtselector_changes);
    			const pantselector_changes = {};
    			if (dirty & /*pantSprite*/ 16384) pantselector_changes.pantSprite = /*pantSprite*/ ctx[14];

    			if (!updating_pantId && dirty & /*pantId*/ 64) {
    				updating_pantId = true;
    				pantselector_changes.pantId = /*pantId*/ ctx[6];
    				add_flush_callback(() => updating_pantId = false);
    			}

    			if (!updating_pantColor && dirty & /*pantColor*/ 32) {
    				updating_pantColor = true;
    				pantselector_changes.pantColor = /*pantColor*/ ctx[5];
    				add_flush_callback(() => updating_pantColor = false);
    			}

    			pantselector.$set(pantselector_changes);
    			const accessoryselector_changes = {};
    			if (dirty & /*bodySprite*/ 1024) accessoryselector_changes.bodySprite = /*bodySprite*/ ctx[10];
    			if (dirty & /*skinId*/ 8) accessoryselector_changes.skinId = /*skinId*/ ctx[3];
    			if (dirty & /*skinData*/ 4096) accessoryselector_changes.skinData = /*skinData*/ ctx[12];
    			if (dirty & /*eyeColor*/ 4) accessoryselector_changes.eyeColor = /*eyeColor*/ ctx[2];
    			if (dirty & /*hairColor*/ 1) accessoryselector_changes.hairColor = /*hairColor*/ ctx[0];
    			if (dirty & /*accessorySprite*/ 32768) accessoryselector_changes.accessorySprite = /*accessorySprite*/ ctx[15];

    			if (!updating_accessoryId && dirty & /*accessoryId*/ 128) {
    				updating_accessoryId = true;
    				accessoryselector_changes.accessoryId = /*accessoryId*/ ctx[7];
    				add_flush_callback(() => updating_accessoryId = false);
    			}

    			accessoryselector.$set(accessoryselector_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hairselector.$$.fragment, local);
    			transition_in(skinselector.$$.fragment, local);
    			transition_in(shirtselector.$$.fragment, local);
    			transition_in(pantselector.$$.fragment, local);
    			transition_in(accessoryselector.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hairselector.$$.fragment, local);
    			transition_out(skinselector.$$.fragment, local);
    			transition_out(shirtselector.$$.fragment, local);
    			transition_out(pantselector.$$.fragment, local);
    			transition_out(accessoryselector.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(hairselector);
    			destroy_component(skinselector);
    			destroy_component(shirtselector);
    			destroy_component(pantselector);
    			destroy_component(accessoryselector);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CharacterInputs', slots, []);
    	let { hairColor = '#c15b32' } = $$props;
    	let { hairId = 1 } = $$props;
    	let { hairSprite } = $$props;
    	let { hairFancySprite } = $$props;
    	let { eyeColor = '#7a4434' } = $$props;
    	let { skinId = 1 } = $$props;
    	let { bodySprite } = $$props;
    	let { skinColors } = $$props;
    	let { skinData } = $$props;
    	let { shirtId = 1 } = $$props;
    	let { shirtSprite } = $$props;
    	let { pantColor = '#2e55b7' } = $$props;
    	let { pantId = 1 } = $$props;
    	let { pantSprite } = $$props;
    	let { accessoryId = 5 } = $$props;
    	let { accessorySprite } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (hairSprite === undefined && !('hairSprite' in $$props || $$self.$$.bound[$$self.$$.props['hairSprite']])) {
    			console.warn("<CharacterInputs> was created without expected prop 'hairSprite'");
    		}

    		if (hairFancySprite === undefined && !('hairFancySprite' in $$props || $$self.$$.bound[$$self.$$.props['hairFancySprite']])) {
    			console.warn("<CharacterInputs> was created without expected prop 'hairFancySprite'");
    		}

    		if (bodySprite === undefined && !('bodySprite' in $$props || $$self.$$.bound[$$self.$$.props['bodySprite']])) {
    			console.warn("<CharacterInputs> was created without expected prop 'bodySprite'");
    		}

    		if (skinColors === undefined && !('skinColors' in $$props || $$self.$$.bound[$$self.$$.props['skinColors']])) {
    			console.warn("<CharacterInputs> was created without expected prop 'skinColors'");
    		}

    		if (skinData === undefined && !('skinData' in $$props || $$self.$$.bound[$$self.$$.props['skinData']])) {
    			console.warn("<CharacterInputs> was created without expected prop 'skinData'");
    		}

    		if (shirtSprite === undefined && !('shirtSprite' in $$props || $$self.$$.bound[$$self.$$.props['shirtSprite']])) {
    			console.warn("<CharacterInputs> was created without expected prop 'shirtSprite'");
    		}

    		if (pantSprite === undefined && !('pantSprite' in $$props || $$self.$$.bound[$$self.$$.props['pantSprite']])) {
    			console.warn("<CharacterInputs> was created without expected prop 'pantSprite'");
    		}

    		if (accessorySprite === undefined && !('accessorySprite' in $$props || $$self.$$.bound[$$self.$$.props['accessorySprite']])) {
    			console.warn("<CharacterInputs> was created without expected prop 'accessorySprite'");
    		}
    	});

    	const writable_props = [
    		'hairColor',
    		'hairId',
    		'hairSprite',
    		'hairFancySprite',
    		'eyeColor',
    		'skinId',
    		'bodySprite',
    		'skinColors',
    		'skinData',
    		'shirtId',
    		'shirtSprite',
    		'pantColor',
    		'pantId',
    		'pantSprite',
    		'accessoryId',
    		'accessorySprite'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CharacterInputs> was created with unknown prop '${key}'`);
    	});

    	function hairselector_hairId_binding(value) {
    		hairId = value;
    		$$invalidate(1, hairId);
    	}

    	function hairselector_hairColor_binding(value) {
    		hairColor = value;
    		$$invalidate(0, hairColor);
    	}

    	function skinselector_skinId_binding(value) {
    		skinId = value;
    		$$invalidate(3, skinId);
    	}

    	function skinselector_eyeColor_binding(value) {
    		eyeColor = value;
    		$$invalidate(2, eyeColor);
    	}

    	function shirtselector_shirtId_binding(value) {
    		shirtId = value;
    		$$invalidate(4, shirtId);
    	}

    	function pantselector_pantId_binding(value) {
    		pantId = value;
    		$$invalidate(6, pantId);
    	}

    	function pantselector_pantColor_binding(value) {
    		pantColor = value;
    		$$invalidate(5, pantColor);
    	}

    	function accessoryselector_accessoryId_binding(value) {
    		accessoryId = value;
    		$$invalidate(7, accessoryId);
    	}

    	$$self.$$set = $$props => {
    		if ('hairColor' in $$props) $$invalidate(0, hairColor = $$props.hairColor);
    		if ('hairId' in $$props) $$invalidate(1, hairId = $$props.hairId);
    		if ('hairSprite' in $$props) $$invalidate(8, hairSprite = $$props.hairSprite);
    		if ('hairFancySprite' in $$props) $$invalidate(9, hairFancySprite = $$props.hairFancySprite);
    		if ('eyeColor' in $$props) $$invalidate(2, eyeColor = $$props.eyeColor);
    		if ('skinId' in $$props) $$invalidate(3, skinId = $$props.skinId);
    		if ('bodySprite' in $$props) $$invalidate(10, bodySprite = $$props.bodySprite);
    		if ('skinColors' in $$props) $$invalidate(11, skinColors = $$props.skinColors);
    		if ('skinData' in $$props) $$invalidate(12, skinData = $$props.skinData);
    		if ('shirtId' in $$props) $$invalidate(4, shirtId = $$props.shirtId);
    		if ('shirtSprite' in $$props) $$invalidate(13, shirtSprite = $$props.shirtSprite);
    		if ('pantColor' in $$props) $$invalidate(5, pantColor = $$props.pantColor);
    		if ('pantId' in $$props) $$invalidate(6, pantId = $$props.pantId);
    		if ('pantSprite' in $$props) $$invalidate(14, pantSprite = $$props.pantSprite);
    		if ('accessoryId' in $$props) $$invalidate(7, accessoryId = $$props.accessoryId);
    		if ('accessorySprite' in $$props) $$invalidate(15, accessorySprite = $$props.accessorySprite);
    	};

    	$$self.$capture_state = () => ({
    		SkinSelector,
    		ShirtSelector,
    		PantSelector,
    		HairSelector,
    		AccessorySelector,
    		hairColor,
    		hairId,
    		hairSprite,
    		hairFancySprite,
    		eyeColor,
    		skinId,
    		bodySprite,
    		skinColors,
    		skinData,
    		shirtId,
    		shirtSprite,
    		pantColor,
    		pantId,
    		pantSprite,
    		accessoryId,
    		accessorySprite
    	});

    	$$self.$inject_state = $$props => {
    		if ('hairColor' in $$props) $$invalidate(0, hairColor = $$props.hairColor);
    		if ('hairId' in $$props) $$invalidate(1, hairId = $$props.hairId);
    		if ('hairSprite' in $$props) $$invalidate(8, hairSprite = $$props.hairSprite);
    		if ('hairFancySprite' in $$props) $$invalidate(9, hairFancySprite = $$props.hairFancySprite);
    		if ('eyeColor' in $$props) $$invalidate(2, eyeColor = $$props.eyeColor);
    		if ('skinId' in $$props) $$invalidate(3, skinId = $$props.skinId);
    		if ('bodySprite' in $$props) $$invalidate(10, bodySprite = $$props.bodySprite);
    		if ('skinColors' in $$props) $$invalidate(11, skinColors = $$props.skinColors);
    		if ('skinData' in $$props) $$invalidate(12, skinData = $$props.skinData);
    		if ('shirtId' in $$props) $$invalidate(4, shirtId = $$props.shirtId);
    		if ('shirtSprite' in $$props) $$invalidate(13, shirtSprite = $$props.shirtSprite);
    		if ('pantColor' in $$props) $$invalidate(5, pantColor = $$props.pantColor);
    		if ('pantId' in $$props) $$invalidate(6, pantId = $$props.pantId);
    		if ('pantSprite' in $$props) $$invalidate(14, pantSprite = $$props.pantSprite);
    		if ('accessoryId' in $$props) $$invalidate(7, accessoryId = $$props.accessoryId);
    		if ('accessorySprite' in $$props) $$invalidate(15, accessorySprite = $$props.accessorySprite);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		hairColor,
    		hairId,
    		eyeColor,
    		skinId,
    		shirtId,
    		pantColor,
    		pantId,
    		accessoryId,
    		hairSprite,
    		hairFancySprite,
    		bodySprite,
    		skinColors,
    		skinData,
    		shirtSprite,
    		pantSprite,
    		accessorySprite,
    		hairselector_hairId_binding,
    		hairselector_hairColor_binding,
    		skinselector_skinId_binding,
    		skinselector_eyeColor_binding,
    		shirtselector_shirtId_binding,
    		pantselector_pantId_binding,
    		pantselector_pantColor_binding,
    		accessoryselector_accessoryId_binding
    	];
    }

    class CharacterInputs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			hairColor: 0,
    			hairId: 1,
    			hairSprite: 8,
    			hairFancySprite: 9,
    			eyeColor: 2,
    			skinId: 3,
    			bodySprite: 10,
    			skinColors: 11,
    			skinData: 12,
    			shirtId: 4,
    			shirtSprite: 13,
    			pantColor: 5,
    			pantId: 6,
    			pantSprite: 14,
    			accessoryId: 7,
    			accessorySprite: 15
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CharacterInputs",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get hairColor() {
    		throw new Error("<CharacterInputs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hairColor(value) {
    		throw new Error("<CharacterInputs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hairId() {
    		throw new Error("<CharacterInputs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hairId(value) {
    		throw new Error("<CharacterInputs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hairSprite() {
    		throw new Error("<CharacterInputs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hairSprite(value) {
    		throw new Error("<CharacterInputs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hairFancySprite() {
    		throw new Error("<CharacterInputs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hairFancySprite(value) {
    		throw new Error("<CharacterInputs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get eyeColor() {
    		throw new Error("<CharacterInputs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set eyeColor(value) {
    		throw new Error("<CharacterInputs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get skinId() {
    		throw new Error("<CharacterInputs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set skinId(value) {
    		throw new Error("<CharacterInputs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bodySprite() {
    		throw new Error("<CharacterInputs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bodySprite(value) {
    		throw new Error("<CharacterInputs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get skinColors() {
    		throw new Error("<CharacterInputs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set skinColors(value) {
    		throw new Error("<CharacterInputs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get skinData() {
    		throw new Error("<CharacterInputs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set skinData(value) {
    		throw new Error("<CharacterInputs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get shirtId() {
    		throw new Error("<CharacterInputs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shirtId(value) {
    		throw new Error("<CharacterInputs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get shirtSprite() {
    		throw new Error("<CharacterInputs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shirtSprite(value) {
    		throw new Error("<CharacterInputs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pantColor() {
    		throw new Error("<CharacterInputs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pantColor(value) {
    		throw new Error("<CharacterInputs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pantId() {
    		throw new Error("<CharacterInputs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pantId(value) {
    		throw new Error("<CharacterInputs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pantSprite() {
    		throw new Error("<CharacterInputs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pantSprite(value) {
    		throw new Error("<CharacterInputs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get accessoryId() {
    		throw new Error("<CharacterInputs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set accessoryId(value) {
    		throw new Error("<CharacterInputs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get accessorySprite() {
    		throw new Error("<CharacterInputs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set accessorySprite(value) {
    		throw new Error("<CharacterInputs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.55.1 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let div2;
    	let characterpreview;
    	let updating_skinColors;
    	let updating_skinData;
    	let t0;
    	let div1;
    	let p;
    	let b;
    	let t2;
    	let button;
    	let t4;
    	let div0;
    	let a0;
    	let t6;
    	let a1;
    	let t8;
    	let characterinputs;
    	let updating_hairColor;
    	let updating_hairId;
    	let updating_eyeColor;
    	let updating_skinId;
    	let updating_shirtId;
    	let updating_pantColor;
    	let updating_pantId;
    	let updating_accessoryId;
    	let current;
    	let mounted;
    	let dispose;

    	function characterpreview_skinColors_binding(value) {
    		/*characterpreview_skinColors_binding*/ ctx[19](value);
    	}

    	function characterpreview_skinData_binding(value) {
    		/*characterpreview_skinData_binding*/ ctx[20](value);
    	}

    	let characterpreview_props = {
    		hairColor: /*hairColor*/ ctx[0],
    		hairId: /*hairId*/ ctx[1],
    		hairSprite: /*hairSprite*/ ctx[10],
    		hairFancySprite: /*hairFancySprite*/ ctx[11],
    		eyeColor: /*eyeColor*/ ctx[2],
    		eyeSprite: /*eyeSprite*/ ctx[12],
    		skinId: /*skinId*/ ctx[3],
    		bodySprite: /*bodySprite*/ ctx[13],
    		skinSprite: /*skinSprite*/ ctx[14],
    		shirtId: /*shirtId*/ ctx[6],
    		shirtSprite: /*shirtSprite*/ ctx[15],
    		pantColor: /*pantColor*/ ctx[7],
    		pantId: /*pantId*/ ctx[8],
    		pantSprite: /*pantSprite*/ ctx[16],
    		accessoryId: /*accessoryId*/ ctx[9],
    		accessorySprite: /*accessorySprite*/ ctx[17]
    	};

    	if (/*skinColors*/ ctx[4] !== void 0) {
    		characterpreview_props.skinColors = /*skinColors*/ ctx[4];
    	}

    	if (/*skinData*/ ctx[5] !== void 0) {
    		characterpreview_props.skinData = /*skinData*/ ctx[5];
    	}

    	characterpreview = new CharacterPreview({
    			props: characterpreview_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(characterpreview, 'skinColors', characterpreview_skinColors_binding));
    	binding_callbacks.push(() => bind(characterpreview, 'skinData', characterpreview_skinData_binding));

    	function characterinputs_hairColor_binding(value) {
    		/*characterinputs_hairColor_binding*/ ctx[21](value);
    	}

    	function characterinputs_hairId_binding(value) {
    		/*characterinputs_hairId_binding*/ ctx[22](value);
    	}

    	function characterinputs_eyeColor_binding(value) {
    		/*characterinputs_eyeColor_binding*/ ctx[23](value);
    	}

    	function characterinputs_skinId_binding(value) {
    		/*characterinputs_skinId_binding*/ ctx[24](value);
    	}

    	function characterinputs_shirtId_binding(value) {
    		/*characterinputs_shirtId_binding*/ ctx[25](value);
    	}

    	function characterinputs_pantColor_binding(value) {
    		/*characterinputs_pantColor_binding*/ ctx[26](value);
    	}

    	function characterinputs_pantId_binding(value) {
    		/*characterinputs_pantId_binding*/ ctx[27](value);
    	}

    	function characterinputs_accessoryId_binding(value) {
    		/*characterinputs_accessoryId_binding*/ ctx[28](value);
    	}

    	let characterinputs_props = {
    		hairSprite: /*hairSprite*/ ctx[10],
    		hairFancySprite: /*hairFancySprite*/ ctx[11],
    		bodySprite: /*bodySprite*/ ctx[13],
    		skinColors: /*skinColors*/ ctx[4],
    		skinData: /*skinData*/ ctx[5],
    		shirtSprite: /*shirtSprite*/ ctx[15],
    		pantSprite: /*pantSprite*/ ctx[16],
    		accessorySprite: /*accessorySprite*/ ctx[17]
    	};

    	if (/*hairColor*/ ctx[0] !== void 0) {
    		characterinputs_props.hairColor = /*hairColor*/ ctx[0];
    	}

    	if (/*hairId*/ ctx[1] !== void 0) {
    		characterinputs_props.hairId = /*hairId*/ ctx[1];
    	}

    	if (/*eyeColor*/ ctx[2] !== void 0) {
    		characterinputs_props.eyeColor = /*eyeColor*/ ctx[2];
    	}

    	if (/*skinId*/ ctx[3] !== void 0) {
    		characterinputs_props.skinId = /*skinId*/ ctx[3];
    	}

    	if (/*shirtId*/ ctx[6] !== void 0) {
    		characterinputs_props.shirtId = /*shirtId*/ ctx[6];
    	}

    	if (/*pantColor*/ ctx[7] !== void 0) {
    		characterinputs_props.pantColor = /*pantColor*/ ctx[7];
    	}

    	if (/*pantId*/ ctx[8] !== void 0) {
    		characterinputs_props.pantId = /*pantId*/ ctx[8];
    	}

    	if (/*accessoryId*/ ctx[9] !== void 0) {
    		characterinputs_props.accessoryId = /*accessoryId*/ ctx[9];
    	}

    	characterinputs = new CharacterInputs({
    			props: characterinputs_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(characterinputs, 'hairColor', characterinputs_hairColor_binding));
    	binding_callbacks.push(() => bind(characterinputs, 'hairId', characterinputs_hairId_binding));
    	binding_callbacks.push(() => bind(characterinputs, 'eyeColor', characterinputs_eyeColor_binding));
    	binding_callbacks.push(() => bind(characterinputs, 'skinId', characterinputs_skinId_binding));
    	binding_callbacks.push(() => bind(characterinputs, 'shirtId', characterinputs_shirtId_binding));
    	binding_callbacks.push(() => bind(characterinputs, 'pantColor', characterinputs_pantColor_binding));
    	binding_callbacks.push(() => bind(characterinputs, 'pantId', characterinputs_pantId_binding));
    	binding_callbacks.push(() => bind(characterinputs, 'accessoryId', characterinputs_accessoryId_binding));

    	const block = {
    		c: function create() {
    			main = element("main");
    			div2 = element("div");
    			create_component(characterpreview.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			p = element("p");
    			b = element("b");
    			b.textContent = "Stardew valley character creator";
    			t2 = space();
    			button = element("button");
    			button.textContent = "Copy to Clipboard";
    			t4 = space();
    			div0 = element("div");
    			a0 = element("a");
    			a0.textContent = "Source";
    			t6 = space();
    			a1 = element("a");
    			a1.textContent = "Submit a bug";
    			t8 = space();
    			create_component(characterinputs.$$.fragment);
    			add_location(b, file, 68, 15, 1816);
    			add_location(p, file, 68, 12, 1813);
    			add_location(button, file, 69, 12, 1872);
    			attr_dev(a0, "href", "https://github.com/robopossum/stardew-character-creator");
    			add_location(a0, file, 71, 16, 1982);
    			attr_dev(a1, "href", "https://github.com/robopossum/stardew-character-creator/issues");
    			add_location(a1, file, 72, 16, 2075);
    			attr_dev(div0, "class", "links svelte-132ullq");
    			add_location(div0, file, 70, 12, 1946);
    			attr_dev(div1, "class", "waffle svelte-132ullq");
    			add_location(div1, file, 67, 8, 1780);
    			attr_dev(div2, "class", "character svelte-132ullq");
    			add_location(div2, file, 45, 4, 1072);
    			attr_dev(main, "class", "svelte-132ullq");
    			add_location(main, file, 44, 0, 1061);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			mount_component(characterpreview, div2, null);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, p);
    			append_dev(p, b);
    			append_dev(div1, t2);
    			append_dev(div1, button);
    			append_dev(div1, t4);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(div0, t6);
    			append_dev(div0, a1);
    			append_dev(main, t8);
    			mount_component(characterinputs, main, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*copyToClipboard*/ ctx[18], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const characterpreview_changes = {};
    			if (dirty & /*hairColor*/ 1) characterpreview_changes.hairColor = /*hairColor*/ ctx[0];
    			if (dirty & /*hairId*/ 2) characterpreview_changes.hairId = /*hairId*/ ctx[1];
    			if (dirty & /*eyeColor*/ 4) characterpreview_changes.eyeColor = /*eyeColor*/ ctx[2];
    			if (dirty & /*skinId*/ 8) characterpreview_changes.skinId = /*skinId*/ ctx[3];
    			if (dirty & /*shirtId*/ 64) characterpreview_changes.shirtId = /*shirtId*/ ctx[6];
    			if (dirty & /*pantColor*/ 128) characterpreview_changes.pantColor = /*pantColor*/ ctx[7];
    			if (dirty & /*pantId*/ 256) characterpreview_changes.pantId = /*pantId*/ ctx[8];
    			if (dirty & /*accessoryId*/ 512) characterpreview_changes.accessoryId = /*accessoryId*/ ctx[9];

    			if (!updating_skinColors && dirty & /*skinColors*/ 16) {
    				updating_skinColors = true;
    				characterpreview_changes.skinColors = /*skinColors*/ ctx[4];
    				add_flush_callback(() => updating_skinColors = false);
    			}

    			if (!updating_skinData && dirty & /*skinData*/ 32) {
    				updating_skinData = true;
    				characterpreview_changes.skinData = /*skinData*/ ctx[5];
    				add_flush_callback(() => updating_skinData = false);
    			}

    			characterpreview.$set(characterpreview_changes);
    			const characterinputs_changes = {};
    			if (dirty & /*skinColors*/ 16) characterinputs_changes.skinColors = /*skinColors*/ ctx[4];
    			if (dirty & /*skinData*/ 32) characterinputs_changes.skinData = /*skinData*/ ctx[5];

    			if (!updating_hairColor && dirty & /*hairColor*/ 1) {
    				updating_hairColor = true;
    				characterinputs_changes.hairColor = /*hairColor*/ ctx[0];
    				add_flush_callback(() => updating_hairColor = false);
    			}

    			if (!updating_hairId && dirty & /*hairId*/ 2) {
    				updating_hairId = true;
    				characterinputs_changes.hairId = /*hairId*/ ctx[1];
    				add_flush_callback(() => updating_hairId = false);
    			}

    			if (!updating_eyeColor && dirty & /*eyeColor*/ 4) {
    				updating_eyeColor = true;
    				characterinputs_changes.eyeColor = /*eyeColor*/ ctx[2];
    				add_flush_callback(() => updating_eyeColor = false);
    			}

    			if (!updating_skinId && dirty & /*skinId*/ 8) {
    				updating_skinId = true;
    				characterinputs_changes.skinId = /*skinId*/ ctx[3];
    				add_flush_callback(() => updating_skinId = false);
    			}

    			if (!updating_shirtId && dirty & /*shirtId*/ 64) {
    				updating_shirtId = true;
    				characterinputs_changes.shirtId = /*shirtId*/ ctx[6];
    				add_flush_callback(() => updating_shirtId = false);
    			}

    			if (!updating_pantColor && dirty & /*pantColor*/ 128) {
    				updating_pantColor = true;
    				characterinputs_changes.pantColor = /*pantColor*/ ctx[7];
    				add_flush_callback(() => updating_pantColor = false);
    			}

    			if (!updating_pantId && dirty & /*pantId*/ 256) {
    				updating_pantId = true;
    				characterinputs_changes.pantId = /*pantId*/ ctx[8];
    				add_flush_callback(() => updating_pantId = false);
    			}

    			if (!updating_accessoryId && dirty & /*accessoryId*/ 512) {
    				updating_accessoryId = true;
    				characterinputs_changes.accessoryId = /*accessoryId*/ ctx[9];
    				add_flush_callback(() => updating_accessoryId = false);
    			}

    			characterinputs.$set(characterinputs_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(characterpreview.$$.fragment, local);
    			transition_in(characterinputs.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(characterpreview.$$.fragment, local);
    			transition_out(characterinputs.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(characterpreview);
    			destroy_component(characterinputs);
    			mounted = false;
    			dispose();
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let hairColor;
    	let hairId;
    	let hairSprite = loadImage('hairstyles');
    	let hairFancySprite = loadImage('hairstyles2');
    	let eyeColor;
    	let eyeSprite = loadImage('eyes');
    	let skinId;
    	let bodySprite = loadImage('farmer_base');
    	let skinSprite = loadImage('skinColors');
    	let skinColors;
    	let skinData;
    	let shirtId;
    	let shirtSprite = loadImage('shirts');
    	let pantColor;
    	let pantId;
    	let pantSprite = loadImage('pants');
    	let accessoryId;
    	let accessorySprite = loadImage('accessories');

    	let copyToClipboard = () => {
    		navigator.clipboard.writeText([
    			skinId,
    			hairId,
    			shirtId,
    			pantId,
    			accessoryId,
    			...rgb2hsv(eyeColor),
    			...rgb2hsv(hairColor),
    			...rgb2hsv(pantColor),
    			1
    		]);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function characterpreview_skinColors_binding(value) {
    		skinColors = value;
    		$$invalidate(4, skinColors);
    	}

    	function characterpreview_skinData_binding(value) {
    		skinData = value;
    		$$invalidate(5, skinData);
    	}

    	function characterinputs_hairColor_binding(value) {
    		hairColor = value;
    		$$invalidate(0, hairColor);
    	}

    	function characterinputs_hairId_binding(value) {
    		hairId = value;
    		$$invalidate(1, hairId);
    	}

    	function characterinputs_eyeColor_binding(value) {
    		eyeColor = value;
    		$$invalidate(2, eyeColor);
    	}

    	function characterinputs_skinId_binding(value) {
    		skinId = value;
    		$$invalidate(3, skinId);
    	}

    	function characterinputs_shirtId_binding(value) {
    		shirtId = value;
    		$$invalidate(6, shirtId);
    	}

    	function characterinputs_pantColor_binding(value) {
    		pantColor = value;
    		$$invalidate(7, pantColor);
    	}

    	function characterinputs_pantId_binding(value) {
    		pantId = value;
    		$$invalidate(8, pantId);
    	}

    	function characterinputs_accessoryId_binding(value) {
    		accessoryId = value;
    		$$invalidate(9, accessoryId);
    	}

    	$$self.$capture_state = () => ({
    		CharacterPreview,
    		CharacterInputs,
    		loadImage,
    		rgb2hsv,
    		hairColor,
    		hairId,
    		hairSprite,
    		hairFancySprite,
    		eyeColor,
    		eyeSprite,
    		skinId,
    		bodySprite,
    		skinSprite,
    		skinColors,
    		skinData,
    		shirtId,
    		shirtSprite,
    		pantColor,
    		pantId,
    		pantSprite,
    		accessoryId,
    		accessorySprite,
    		copyToClipboard
    	});

    	$$self.$inject_state = $$props => {
    		if ('hairColor' in $$props) $$invalidate(0, hairColor = $$props.hairColor);
    		if ('hairId' in $$props) $$invalidate(1, hairId = $$props.hairId);
    		if ('hairSprite' in $$props) $$invalidate(10, hairSprite = $$props.hairSprite);
    		if ('hairFancySprite' in $$props) $$invalidate(11, hairFancySprite = $$props.hairFancySprite);
    		if ('eyeColor' in $$props) $$invalidate(2, eyeColor = $$props.eyeColor);
    		if ('eyeSprite' in $$props) $$invalidate(12, eyeSprite = $$props.eyeSprite);
    		if ('skinId' in $$props) $$invalidate(3, skinId = $$props.skinId);
    		if ('bodySprite' in $$props) $$invalidate(13, bodySprite = $$props.bodySprite);
    		if ('skinSprite' in $$props) $$invalidate(14, skinSprite = $$props.skinSprite);
    		if ('skinColors' in $$props) $$invalidate(4, skinColors = $$props.skinColors);
    		if ('skinData' in $$props) $$invalidate(5, skinData = $$props.skinData);
    		if ('shirtId' in $$props) $$invalidate(6, shirtId = $$props.shirtId);
    		if ('shirtSprite' in $$props) $$invalidate(15, shirtSprite = $$props.shirtSprite);
    		if ('pantColor' in $$props) $$invalidate(7, pantColor = $$props.pantColor);
    		if ('pantId' in $$props) $$invalidate(8, pantId = $$props.pantId);
    		if ('pantSprite' in $$props) $$invalidate(16, pantSprite = $$props.pantSprite);
    		if ('accessoryId' in $$props) $$invalidate(9, accessoryId = $$props.accessoryId);
    		if ('accessorySprite' in $$props) $$invalidate(17, accessorySprite = $$props.accessorySprite);
    		if ('copyToClipboard' in $$props) $$invalidate(18, copyToClipboard = $$props.copyToClipboard);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		hairColor,
    		hairId,
    		eyeColor,
    		skinId,
    		skinColors,
    		skinData,
    		shirtId,
    		pantColor,
    		pantId,
    		accessoryId,
    		hairSprite,
    		hairFancySprite,
    		eyeSprite,
    		bodySprite,
    		skinSprite,
    		shirtSprite,
    		pantSprite,
    		accessorySprite,
    		copyToClipboard,
    		characterpreview_skinColors_binding,
    		characterpreview_skinData_binding,
    		characterinputs_hairColor_binding,
    		characterinputs_hairId_binding,
    		characterinputs_eyeColor_binding,
    		characterinputs_skinId_binding,
    		characterinputs_shirtId_binding,
    		characterinputs_pantColor_binding,
    		characterinputs_pantId_binding,
    		characterinputs_accessoryId_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
