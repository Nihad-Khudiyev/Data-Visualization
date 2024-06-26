
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop$1() { }
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
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
    function empty$1() {
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
    function children$1(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value == null) {
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

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
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
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
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
            flush_render_callbacks($$.after_update);
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
    function init$1(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop$1,
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
                const nodes = children$1(options.target);
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
            this.$destroy = noop$1;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop$1;
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
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
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
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
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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

    function ascending$1(a, b) {
      return a == null || b == null ? NaN : a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
    }

    function descending(a, b) {
      return a == null || b == null ? NaN
        : b < a ? -1
        : b > a ? 1
        : b >= a ? 0
        : NaN;
    }

    function bisector(f) {
      let compare1, compare2, delta;

      // If an accessor is specified, promote it to a comparator. In this case we
      // can test whether the search value is (self-) comparable. We can’t do this
      // for a comparator (except for specific, known comparators) because we can’t
      // tell if the comparator is symmetric, and an asymmetric comparator can’t be
      // used to test whether a single value is comparable.
      if (f.length !== 2) {
        compare1 = ascending$1;
        compare2 = (d, x) => ascending$1(f(d), x);
        delta = (d, x) => f(d) - x;
      } else {
        compare1 = f === ascending$1 || f === descending ? f : zero$1;
        compare2 = f;
        delta = f;
      }

      function left(a, x, lo = 0, hi = a.length) {
        if (lo < hi) {
          if (compare1(x, x) !== 0) return hi;
          do {
            const mid = (lo + hi) >>> 1;
            if (compare2(a[mid], x) < 0) lo = mid + 1;
            else hi = mid;
          } while (lo < hi);
        }
        return lo;
      }

      function right(a, x, lo = 0, hi = a.length) {
        if (lo < hi) {
          if (compare1(x, x) !== 0) return hi;
          do {
            const mid = (lo + hi) >>> 1;
            if (compare2(a[mid], x) <= 0) lo = mid + 1;
            else hi = mid;
          } while (lo < hi);
        }
        return lo;
      }

      function center(a, x, lo = 0, hi = a.length) {
        const i = left(a, x, lo, hi - 1);
        return i > lo && delta(a[i - 1], x) > -delta(a[i], x) ? i - 1 : i;
      }

      return {left, center, right};
    }

    function zero$1() {
      return 0;
    }

    function number$1(x) {
      return x === null ? NaN : +x;
    }

    const ascendingBisect = bisector(ascending$1);
    const bisectRight = ascendingBisect.right;
    bisector(number$1).center;
    var bisect = bisectRight;

    class InternMap extends Map {
      constructor(entries, key = keyof) {
        super();
        Object.defineProperties(this, {_intern: {value: new Map()}, _key: {value: key}});
        if (entries != null) for (const [key, value] of entries) this.set(key, value);
      }
      get(key) {
        return super.get(intern_get(this, key));
      }
      has(key) {
        return super.has(intern_get(this, key));
      }
      set(key, value) {
        return super.set(intern_set(this, key), value);
      }
      delete(key) {
        return super.delete(intern_delete(this, key));
      }
    }

    function intern_get({_intern, _key}, value) {
      const key = _key(value);
      return _intern.has(key) ? _intern.get(key) : value;
    }

    function intern_set({_intern, _key}, value) {
      const key = _key(value);
      if (_intern.has(key)) return _intern.get(key);
      _intern.set(key, value);
      return value;
    }

    function intern_delete({_intern, _key}, value) {
      const key = _key(value);
      if (_intern.has(key)) {
        value = _intern.get(key);
        _intern.delete(key);
      }
      return value;
    }

    function keyof(value) {
      return value !== null && typeof value === "object" ? value.valueOf() : value;
    }

    const e10 = Math.sqrt(50),
        e5 = Math.sqrt(10),
        e2 = Math.sqrt(2);

    function tickSpec(start, stop, count) {
      const step = (stop - start) / Math.max(0, count),
          power = Math.floor(Math.log10(step)),
          error = step / Math.pow(10, power),
          factor = error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1;
      let i1, i2, inc;
      if (power < 0) {
        inc = Math.pow(10, -power) / factor;
        i1 = Math.round(start * inc);
        i2 = Math.round(stop * inc);
        if (i1 / inc < start) ++i1;
        if (i2 / inc > stop) --i2;
        inc = -inc;
      } else {
        inc = Math.pow(10, power) * factor;
        i1 = Math.round(start / inc);
        i2 = Math.round(stop / inc);
        if (i1 * inc < start) ++i1;
        if (i2 * inc > stop) --i2;
      }
      if (i2 < i1 && 0.5 <= count && count < 2) return tickSpec(start, stop, count * 2);
      return [i1, i2, inc];
    }

    function ticks(start, stop, count) {
      stop = +stop, start = +start, count = +count;
      if (!(count > 0)) return [];
      if (start === stop) return [start];
      const reverse = stop < start, [i1, i2, inc] = reverse ? tickSpec(stop, start, count) : tickSpec(start, stop, count);
      if (!(i2 >= i1)) return [];
      const n = i2 - i1 + 1, ticks = new Array(n);
      if (reverse) {
        if (inc < 0) for (let i = 0; i < n; ++i) ticks[i] = (i2 - i) / -inc;
        else for (let i = 0; i < n; ++i) ticks[i] = (i2 - i) * inc;
      } else {
        if (inc < 0) for (let i = 0; i < n; ++i) ticks[i] = (i1 + i) / -inc;
        else for (let i = 0; i < n; ++i) ticks[i] = (i1 + i) * inc;
      }
      return ticks;
    }

    function tickIncrement(start, stop, count) {
      stop = +stop, start = +start, count = +count;
      return tickSpec(start, stop, count)[2];
    }

    function tickStep(start, stop, count) {
      stop = +stop, start = +start, count = +count;
      const reverse = stop < start, inc = reverse ? tickIncrement(stop, start, count) : tickIncrement(start, stop, count);
      return (reverse ? -1 : 1) * (inc < 0 ? 1 / -inc : inc);
    }

    function initRange(domain, range) {
      switch (arguments.length) {
        case 0: break;
        case 1: this.range(domain); break;
        default: this.range(range).domain(domain); break;
      }
      return this;
    }

    const implicit = Symbol("implicit");

    function ordinal() {
      var index = new InternMap(),
          domain = [],
          range = [],
          unknown = implicit;

      function scale(d) {
        let i = index.get(d);
        if (i === undefined) {
          if (unknown !== implicit) return unknown;
          index.set(d, i = domain.push(d) - 1);
        }
        return range[i % range.length];
      }

      scale.domain = function(_) {
        if (!arguments.length) return domain.slice();
        domain = [], index = new InternMap();
        for (const value of _) {
          if (index.has(value)) continue;
          index.set(value, domain.push(value) - 1);
        }
        return scale;
      };

      scale.range = function(_) {
        return arguments.length ? (range = Array.from(_), scale) : range.slice();
      };

      scale.unknown = function(_) {
        return arguments.length ? (unknown = _, scale) : unknown;
      };

      scale.copy = function() {
        return ordinal(domain, range).unknown(unknown);
      };

      initRange.apply(scale, arguments);

      return scale;
    }

    function define(constructor, factory, prototype) {
      constructor.prototype = factory.prototype = prototype;
      prototype.constructor = constructor;
    }

    function extend(parent, definition) {
      var prototype = Object.create(parent.prototype);
      for (var key in definition) prototype[key] = definition[key];
      return prototype;
    }

    function Color() {}

    var darker = 0.7;
    var brighter = 1 / darker;

    var reI = "\\s*([+-]?\\d+)\\s*",
        reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*",
        reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
        reHex = /^#([0-9a-f]{3,8})$/,
        reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`),
        reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`),
        reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`),
        reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`),
        reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`),
        reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);

    var named = {
      aliceblue: 0xf0f8ff,
      antiquewhite: 0xfaebd7,
      aqua: 0x00ffff,
      aquamarine: 0x7fffd4,
      azure: 0xf0ffff,
      beige: 0xf5f5dc,
      bisque: 0xffe4c4,
      black: 0x000000,
      blanchedalmond: 0xffebcd,
      blue: 0x0000ff,
      blueviolet: 0x8a2be2,
      brown: 0xa52a2a,
      burlywood: 0xdeb887,
      cadetblue: 0x5f9ea0,
      chartreuse: 0x7fff00,
      chocolate: 0xd2691e,
      coral: 0xff7f50,
      cornflowerblue: 0x6495ed,
      cornsilk: 0xfff8dc,
      crimson: 0xdc143c,
      cyan: 0x00ffff,
      darkblue: 0x00008b,
      darkcyan: 0x008b8b,
      darkgoldenrod: 0xb8860b,
      darkgray: 0xa9a9a9,
      darkgreen: 0x006400,
      darkgrey: 0xa9a9a9,
      darkkhaki: 0xbdb76b,
      darkmagenta: 0x8b008b,
      darkolivegreen: 0x556b2f,
      darkorange: 0xff8c00,
      darkorchid: 0x9932cc,
      darkred: 0x8b0000,
      darksalmon: 0xe9967a,
      darkseagreen: 0x8fbc8f,
      darkslateblue: 0x483d8b,
      darkslategray: 0x2f4f4f,
      darkslategrey: 0x2f4f4f,
      darkturquoise: 0x00ced1,
      darkviolet: 0x9400d3,
      deeppink: 0xff1493,
      deepskyblue: 0x00bfff,
      dimgray: 0x696969,
      dimgrey: 0x696969,
      dodgerblue: 0x1e90ff,
      firebrick: 0xb22222,
      floralwhite: 0xfffaf0,
      forestgreen: 0x228b22,
      fuchsia: 0xff00ff,
      gainsboro: 0xdcdcdc,
      ghostwhite: 0xf8f8ff,
      gold: 0xffd700,
      goldenrod: 0xdaa520,
      gray: 0x808080,
      green: 0x008000,
      greenyellow: 0xadff2f,
      grey: 0x808080,
      honeydew: 0xf0fff0,
      hotpink: 0xff69b4,
      indianred: 0xcd5c5c,
      indigo: 0x4b0082,
      ivory: 0xfffff0,
      khaki: 0xf0e68c,
      lavender: 0xe6e6fa,
      lavenderblush: 0xfff0f5,
      lawngreen: 0x7cfc00,
      lemonchiffon: 0xfffacd,
      lightblue: 0xadd8e6,
      lightcoral: 0xf08080,
      lightcyan: 0xe0ffff,
      lightgoldenrodyellow: 0xfafad2,
      lightgray: 0xd3d3d3,
      lightgreen: 0x90ee90,
      lightgrey: 0xd3d3d3,
      lightpink: 0xffb6c1,
      lightsalmon: 0xffa07a,
      lightseagreen: 0x20b2aa,
      lightskyblue: 0x87cefa,
      lightslategray: 0x778899,
      lightslategrey: 0x778899,
      lightsteelblue: 0xb0c4de,
      lightyellow: 0xffffe0,
      lime: 0x00ff00,
      limegreen: 0x32cd32,
      linen: 0xfaf0e6,
      magenta: 0xff00ff,
      maroon: 0x800000,
      mediumaquamarine: 0x66cdaa,
      mediumblue: 0x0000cd,
      mediumorchid: 0xba55d3,
      mediumpurple: 0x9370db,
      mediumseagreen: 0x3cb371,
      mediumslateblue: 0x7b68ee,
      mediumspringgreen: 0x00fa9a,
      mediumturquoise: 0x48d1cc,
      mediumvioletred: 0xc71585,
      midnightblue: 0x191970,
      mintcream: 0xf5fffa,
      mistyrose: 0xffe4e1,
      moccasin: 0xffe4b5,
      navajowhite: 0xffdead,
      navy: 0x000080,
      oldlace: 0xfdf5e6,
      olive: 0x808000,
      olivedrab: 0x6b8e23,
      orange: 0xffa500,
      orangered: 0xff4500,
      orchid: 0xda70d6,
      palegoldenrod: 0xeee8aa,
      palegreen: 0x98fb98,
      paleturquoise: 0xafeeee,
      palevioletred: 0xdb7093,
      papayawhip: 0xffefd5,
      peachpuff: 0xffdab9,
      peru: 0xcd853f,
      pink: 0xffc0cb,
      plum: 0xdda0dd,
      powderblue: 0xb0e0e6,
      purple: 0x800080,
      rebeccapurple: 0x663399,
      red: 0xff0000,
      rosybrown: 0xbc8f8f,
      royalblue: 0x4169e1,
      saddlebrown: 0x8b4513,
      salmon: 0xfa8072,
      sandybrown: 0xf4a460,
      seagreen: 0x2e8b57,
      seashell: 0xfff5ee,
      sienna: 0xa0522d,
      silver: 0xc0c0c0,
      skyblue: 0x87ceeb,
      slateblue: 0x6a5acd,
      slategray: 0x708090,
      slategrey: 0x708090,
      snow: 0xfffafa,
      springgreen: 0x00ff7f,
      steelblue: 0x4682b4,
      tan: 0xd2b48c,
      teal: 0x008080,
      thistle: 0xd8bfd8,
      tomato: 0xff6347,
      turquoise: 0x40e0d0,
      violet: 0xee82ee,
      wheat: 0xf5deb3,
      white: 0xffffff,
      whitesmoke: 0xf5f5f5,
      yellow: 0xffff00,
      yellowgreen: 0x9acd32
    };

    define(Color, color, {
      copy(channels) {
        return Object.assign(new this.constructor, this, channels);
      },
      displayable() {
        return this.rgb().displayable();
      },
      hex: color_formatHex, // Deprecated! Use color.formatHex.
      formatHex: color_formatHex,
      formatHex8: color_formatHex8,
      formatHsl: color_formatHsl,
      formatRgb: color_formatRgb,
      toString: color_formatRgb
    });

    function color_formatHex() {
      return this.rgb().formatHex();
    }

    function color_formatHex8() {
      return this.rgb().formatHex8();
    }

    function color_formatHsl() {
      return hslConvert(this).formatHsl();
    }

    function color_formatRgb() {
      return this.rgb().formatRgb();
    }

    function color(format) {
      var m, l;
      format = (format + "").trim().toLowerCase();
      return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
          : l === 3 ? new Rgb((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
          : l === 8 ? rgba(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
          : l === 4 ? rgba((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
          : null) // invalid hex
          : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
          : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
          : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
          : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
          : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
          : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
          : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
          : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
          : null;
    }

    function rgbn(n) {
      return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
    }

    function rgba(r, g, b, a) {
      if (a <= 0) r = g = b = NaN;
      return new Rgb(r, g, b, a);
    }

    function rgbConvert(o) {
      if (!(o instanceof Color)) o = color(o);
      if (!o) return new Rgb;
      o = o.rgb();
      return new Rgb(o.r, o.g, o.b, o.opacity);
    }

    function rgb(r, g, b, opacity) {
      return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
    }

    function Rgb(r, g, b, opacity) {
      this.r = +r;
      this.g = +g;
      this.b = +b;
      this.opacity = +opacity;
    }

    define(Rgb, rgb, extend(Color, {
      brighter(k) {
        k = k == null ? brighter : Math.pow(brighter, k);
        return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
      },
      darker(k) {
        k = k == null ? darker : Math.pow(darker, k);
        return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
      },
      rgb() {
        return this;
      },
      clamp() {
        return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
      },
      displayable() {
        return (-0.5 <= this.r && this.r < 255.5)
            && (-0.5 <= this.g && this.g < 255.5)
            && (-0.5 <= this.b && this.b < 255.5)
            && (0 <= this.opacity && this.opacity <= 1);
      },
      hex: rgb_formatHex, // Deprecated! Use color.formatHex.
      formatHex: rgb_formatHex,
      formatHex8: rgb_formatHex8,
      formatRgb: rgb_formatRgb,
      toString: rgb_formatRgb
    }));

    function rgb_formatHex() {
      return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
    }

    function rgb_formatHex8() {
      return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
    }

    function rgb_formatRgb() {
      const a = clampa(this.opacity);
      return `${a === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a === 1 ? ")" : `, ${a})`}`;
    }

    function clampa(opacity) {
      return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
    }

    function clampi(value) {
      return Math.max(0, Math.min(255, Math.round(value) || 0));
    }

    function hex(value) {
      value = clampi(value);
      return (value < 16 ? "0" : "") + value.toString(16);
    }

    function hsla(h, s, l, a) {
      if (a <= 0) h = s = l = NaN;
      else if (l <= 0 || l >= 1) h = s = NaN;
      else if (s <= 0) h = NaN;
      return new Hsl(h, s, l, a);
    }

    function hslConvert(o) {
      if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
      if (!(o instanceof Color)) o = color(o);
      if (!o) return new Hsl;
      if (o instanceof Hsl) return o;
      o = o.rgb();
      var r = o.r / 255,
          g = o.g / 255,
          b = o.b / 255,
          min = Math.min(r, g, b),
          max = Math.max(r, g, b),
          h = NaN,
          s = max - min,
          l = (max + min) / 2;
      if (s) {
        if (r === max) h = (g - b) / s + (g < b) * 6;
        else if (g === max) h = (b - r) / s + 2;
        else h = (r - g) / s + 4;
        s /= l < 0.5 ? max + min : 2 - max - min;
        h *= 60;
      } else {
        s = l > 0 && l < 1 ? 0 : h;
      }
      return new Hsl(h, s, l, o.opacity);
    }

    function hsl(h, s, l, opacity) {
      return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
    }

    function Hsl(h, s, l, opacity) {
      this.h = +h;
      this.s = +s;
      this.l = +l;
      this.opacity = +opacity;
    }

    define(Hsl, hsl, extend(Color, {
      brighter(k) {
        k = k == null ? brighter : Math.pow(brighter, k);
        return new Hsl(this.h, this.s, this.l * k, this.opacity);
      },
      darker(k) {
        k = k == null ? darker : Math.pow(darker, k);
        return new Hsl(this.h, this.s, this.l * k, this.opacity);
      },
      rgb() {
        var h = this.h % 360 + (this.h < 0) * 360,
            s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
            l = this.l,
            m2 = l + (l < 0.5 ? l : 1 - l) * s,
            m1 = 2 * l - m2;
        return new Rgb(
          hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
          hsl2rgb(h, m1, m2),
          hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
          this.opacity
        );
      },
      clamp() {
        return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
      },
      displayable() {
        return (0 <= this.s && this.s <= 1 || isNaN(this.s))
            && (0 <= this.l && this.l <= 1)
            && (0 <= this.opacity && this.opacity <= 1);
      },
      formatHsl() {
        const a = clampa(this.opacity);
        return `${a === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a === 1 ? ")" : `, ${a})`}`;
      }
    }));

    function clamph(value) {
      value = (value || 0) % 360;
      return value < 0 ? value + 360 : value;
    }

    function clampt(value) {
      return Math.max(0, Math.min(1, value || 0));
    }

    /* From FvD 13.37, CSS Color Module Level 3 */
    function hsl2rgb(h, m1, m2) {
      return (h < 60 ? m1 + (m2 - m1) * h / 60
          : h < 180 ? m2
          : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
          : m1) * 255;
    }

    var constant$4 = x => () => x;

    function linear$1(a, d) {
      return function(t) {
        return a + t * d;
      };
    }

    function exponential(a, b, y) {
      return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
        return Math.pow(a + t * b, y);
      };
    }

    function gamma(y) {
      return (y = +y) === 1 ? nogamma : function(a, b) {
        return b - a ? exponential(a, b, y) : constant$4(isNaN(a) ? b : a);
      };
    }

    function nogamma(a, b) {
      var d = b - a;
      return d ? linear$1(a, d) : constant$4(isNaN(a) ? b : a);
    }

    var interpolateRgb = (function rgbGamma(y) {
      var color = gamma(y);

      function rgb$1(start, end) {
        var r = color((start = rgb(start)).r, (end = rgb(end)).r),
            g = color(start.g, end.g),
            b = color(start.b, end.b),
            opacity = nogamma(start.opacity, end.opacity);
        return function(t) {
          start.r = r(t);
          start.g = g(t);
          start.b = b(t);
          start.opacity = opacity(t);
          return start + "";
        };
      }

      rgb$1.gamma = rgbGamma;

      return rgb$1;
    })(1);

    function numberArray(a, b) {
      if (!b) b = [];
      var n = a ? Math.min(b.length, a.length) : 0,
          c = b.slice(),
          i;
      return function(t) {
        for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t;
        return c;
      };
    }

    function isNumberArray(x) {
      return ArrayBuffer.isView(x) && !(x instanceof DataView);
    }

    function genericArray(a, b) {
      var nb = b ? b.length : 0,
          na = a ? Math.min(nb, a.length) : 0,
          x = new Array(na),
          c = new Array(nb),
          i;

      for (i = 0; i < na; ++i) x[i] = interpolate$1(a[i], b[i]);
      for (; i < nb; ++i) c[i] = b[i];

      return function(t) {
        for (i = 0; i < na; ++i) c[i] = x[i](t);
        return c;
      };
    }

    function date(a, b) {
      var d = new Date;
      return a = +a, b = +b, function(t) {
        return d.setTime(a * (1 - t) + b * t), d;
      };
    }

    function interpolateNumber(a, b) {
      return a = +a, b = +b, function(t) {
        return a * (1 - t) + b * t;
      };
    }

    function object(a, b) {
      var i = {},
          c = {},
          k;

      if (a === null || typeof a !== "object") a = {};
      if (b === null || typeof b !== "object") b = {};

      for (k in b) {
        if (k in a) {
          i[k] = interpolate$1(a[k], b[k]);
        } else {
          c[k] = b[k];
        }
      }

      return function(t) {
        for (k in i) c[k] = i[k](t);
        return c;
      };
    }

    var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
        reB = new RegExp(reA.source, "g");

    function zero(b) {
      return function() {
        return b;
      };
    }

    function one(b) {
      return function(t) {
        return b(t) + "";
      };
    }

    function interpolateString(a, b) {
      var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
          am, // current match in a
          bm, // current match in b
          bs, // string preceding current number in b, if any
          i = -1, // index in s
          s = [], // string constants and placeholders
          q = []; // number interpolators

      // Coerce inputs to strings.
      a = a + "", b = b + "";

      // Interpolate pairs of numbers in a & b.
      while ((am = reA.exec(a))
          && (bm = reB.exec(b))) {
        if ((bs = bm.index) > bi) { // a string precedes the next number in b
          bs = b.slice(bi, bs);
          if (s[i]) s[i] += bs; // coalesce with previous string
          else s[++i] = bs;
        }
        if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
          if (s[i]) s[i] += bm; // coalesce with previous string
          else s[++i] = bm;
        } else { // interpolate non-matching numbers
          s[++i] = null;
          q.push({i: i, x: interpolateNumber(am, bm)});
        }
        bi = reB.lastIndex;
      }

      // Add remains of b.
      if (bi < b.length) {
        bs = b.slice(bi);
        if (s[i]) s[i] += bs; // coalesce with previous string
        else s[++i] = bs;
      }

      // Special optimization for only a single match.
      // Otherwise, interpolate each of the numbers and rejoin the string.
      return s.length < 2 ? (q[0]
          ? one(q[0].x)
          : zero(b))
          : (b = q.length, function(t) {
              for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
              return s.join("");
            });
    }

    function interpolate$1(a, b) {
      var t = typeof b, c;
      return b == null || t === "boolean" ? constant$4(b)
          : (t === "number" ? interpolateNumber
          : t === "string" ? ((c = color(b)) ? (b = c, interpolateRgb) : interpolateString)
          : b instanceof color ? interpolateRgb
          : b instanceof Date ? date
          : isNumberArray(b) ? numberArray
          : Array.isArray(b) ? genericArray
          : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object
          : interpolateNumber)(a, b);
    }

    function interpolateRound(a, b) {
      return a = +a, b = +b, function(t) {
        return Math.round(a * (1 - t) + b * t);
      };
    }

    var degrees = 180 / Math.PI;

    var identity$3 = {
      translateX: 0,
      translateY: 0,
      rotate: 0,
      skewX: 0,
      scaleX: 1,
      scaleY: 1
    };

    function decompose(a, b, c, d, e, f) {
      var scaleX, scaleY, skewX;
      if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
      if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
      if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
      if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
      return {
        translateX: e,
        translateY: f,
        rotate: Math.atan2(b, a) * degrees,
        skewX: Math.atan(skewX) * degrees,
        scaleX: scaleX,
        scaleY: scaleY
      };
    }

    var svgNode;

    /* eslint-disable no-undef */
    function parseCss(value) {
      const m = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "");
      return m.isIdentity ? identity$3 : decompose(m.a, m.b, m.c, m.d, m.e, m.f);
    }

    function parseSvg(value) {
      if (value == null) return identity$3;
      if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
      svgNode.setAttribute("transform", value);
      if (!(value = svgNode.transform.baseVal.consolidate())) return identity$3;
      value = value.matrix;
      return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
    }

    function interpolateTransform(parse, pxComma, pxParen, degParen) {

      function pop(s) {
        return s.length ? s.pop() + " " : "";
      }

      function translate(xa, ya, xb, yb, s, q) {
        if (xa !== xb || ya !== yb) {
          var i = s.push("translate(", null, pxComma, null, pxParen);
          q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
        } else if (xb || yb) {
          s.push("translate(" + xb + pxComma + yb + pxParen);
        }
      }

      function rotate(a, b, s, q) {
        if (a !== b) {
          if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
          q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: interpolateNumber(a, b)});
        } else if (b) {
          s.push(pop(s) + "rotate(" + b + degParen);
        }
      }

      function skewX(a, b, s, q) {
        if (a !== b) {
          q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: interpolateNumber(a, b)});
        } else if (b) {
          s.push(pop(s) + "skewX(" + b + degParen);
        }
      }

      function scale(xa, ya, xb, yb, s, q) {
        if (xa !== xb || ya !== yb) {
          var i = s.push(pop(s) + "scale(", null, ",", null, ")");
          q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
        } else if (xb !== 1 || yb !== 1) {
          s.push(pop(s) + "scale(" + xb + "," + yb + ")");
        }
      }

      return function(a, b) {
        var s = [], // string constants and placeholders
            q = []; // number interpolators
        a = parse(a), b = parse(b);
        translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
        rotate(a.rotate, b.rotate, s, q);
        skewX(a.skewX, b.skewX, s, q);
        scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
        a = b = null; // gc
        return function(t) {
          var i = -1, n = q.length, o;
          while (++i < n) s[(o = q[i]).i] = o.x(t);
          return s.join("");
        };
      };
    }

    var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
    var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

    var epsilon2 = 1e-12;

    function cosh(x) {
      return ((x = Math.exp(x)) + 1 / x) / 2;
    }

    function sinh(x) {
      return ((x = Math.exp(x)) - 1 / x) / 2;
    }

    function tanh(x) {
      return ((x = Math.exp(2 * x)) - 1) / (x + 1);
    }

    var interpolateZoom = (function zoomRho(rho, rho2, rho4) {

      // p0 = [ux0, uy0, w0]
      // p1 = [ux1, uy1, w1]
      function zoom(p0, p1) {
        var ux0 = p0[0], uy0 = p0[1], w0 = p0[2],
            ux1 = p1[0], uy1 = p1[1], w1 = p1[2],
            dx = ux1 - ux0,
            dy = uy1 - uy0,
            d2 = dx * dx + dy * dy,
            i,
            S;

        // Special case for u0 ≅ u1.
        if (d2 < epsilon2) {
          S = Math.log(w1 / w0) / rho;
          i = function(t) {
            return [
              ux0 + t * dx,
              uy0 + t * dy,
              w0 * Math.exp(rho * t * S)
            ];
          };
        }

        // General case.
        else {
          var d1 = Math.sqrt(d2),
              b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1),
              b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1),
              r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0),
              r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
          S = (r1 - r0) / rho;
          i = function(t) {
            var s = t * S,
                coshr0 = cosh(r0),
                u = w0 / (rho2 * d1) * (coshr0 * tanh(rho * s + r0) - sinh(r0));
            return [
              ux0 + u * dx,
              uy0 + u * dy,
              w0 * coshr0 / cosh(rho * s + r0)
            ];
          };
        }

        i.duration = S * 1000 * rho / Math.SQRT2;

        return i;
      }

      zoom.rho = function(_) {
        var _1 = Math.max(1e-3, +_), _2 = _1 * _1, _4 = _2 * _2;
        return zoomRho(_1, _2, _4);
      };

      return zoom;
    })(Math.SQRT2, 2, 4);

    function constants(x) {
      return function() {
        return x;
      };
    }

    function number(x) {
      return +x;
    }

    var unit = [0, 1];

    function identity$2(x) {
      return x;
    }

    function normalize(a, b) {
      return (b -= (a = +a))
          ? function(x) { return (x - a) / b; }
          : constants(isNaN(b) ? NaN : 0.5);
    }

    function clamper(a, b) {
      var t;
      if (a > b) t = a, a = b, b = t;
      return function(x) { return Math.max(a, Math.min(b, x)); };
    }

    // normalize(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
    // interpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding range value x in [a,b].
    function bimap(domain, range, interpolate) {
      var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
      if (d1 < d0) d0 = normalize(d1, d0), r0 = interpolate(r1, r0);
      else d0 = normalize(d0, d1), r0 = interpolate(r0, r1);
      return function(x) { return r0(d0(x)); };
    }

    function polymap(domain, range, interpolate) {
      var j = Math.min(domain.length, range.length) - 1,
          d = new Array(j),
          r = new Array(j),
          i = -1;

      // Reverse descending domains.
      if (domain[j] < domain[0]) {
        domain = domain.slice().reverse();
        range = range.slice().reverse();
      }

      while (++i < j) {
        d[i] = normalize(domain[i], domain[i + 1]);
        r[i] = interpolate(range[i], range[i + 1]);
      }

      return function(x) {
        var i = bisect(domain, x, 1, j) - 1;
        return r[i](d[i](x));
      };
    }

    function copy(source, target) {
      return target
          .domain(source.domain())
          .range(source.range())
          .interpolate(source.interpolate())
          .clamp(source.clamp())
          .unknown(source.unknown());
    }

    function transformer() {
      var domain = unit,
          range = unit,
          interpolate = interpolate$1,
          transform,
          untransform,
          unknown,
          clamp = identity$2,
          piecewise,
          output,
          input;

      function rescale() {
        var n = Math.min(domain.length, range.length);
        if (clamp !== identity$2) clamp = clamper(domain[0], domain[n - 1]);
        piecewise = n > 2 ? polymap : bimap;
        output = input = null;
        return scale;
      }

      function scale(x) {
        return x == null || isNaN(x = +x) ? unknown : (output || (output = piecewise(domain.map(transform), range, interpolate)))(transform(clamp(x)));
      }

      scale.invert = function(y) {
        return clamp(untransform((input || (input = piecewise(range, domain.map(transform), interpolateNumber)))(y)));
      };

      scale.domain = function(_) {
        return arguments.length ? (domain = Array.from(_, number), rescale()) : domain.slice();
      };

      scale.range = function(_) {
        return arguments.length ? (range = Array.from(_), rescale()) : range.slice();
      };

      scale.rangeRound = function(_) {
        return range = Array.from(_), interpolate = interpolateRound, rescale();
      };

      scale.clamp = function(_) {
        return arguments.length ? (clamp = _ ? true : identity$2, rescale()) : clamp !== identity$2;
      };

      scale.interpolate = function(_) {
        return arguments.length ? (interpolate = _, rescale()) : interpolate;
      };

      scale.unknown = function(_) {
        return arguments.length ? (unknown = _, scale) : unknown;
      };

      return function(t, u) {
        transform = t, untransform = u;
        return rescale();
      };
    }

    function continuous() {
      return transformer()(identity$2, identity$2);
    }

    function formatDecimal(x) {
      return Math.abs(x = Math.round(x)) >= 1e21
          ? x.toLocaleString("en").replace(/,/g, "")
          : x.toString(10);
    }

    // Computes the decimal coefficient and exponent of the specified number x with
    // significant digits p, where x is positive and p is in [1, 21] or undefined.
    // For example, formatDecimalParts(1.23) returns ["123", 0].
    function formatDecimalParts(x, p) {
      if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
      var i, coefficient = x.slice(0, i);

      // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
      // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
      return [
        coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
        +x.slice(i + 1)
      ];
    }

    function exponent(x) {
      return x = formatDecimalParts(Math.abs(x)), x ? x[1] : NaN;
    }

    function formatGroup(grouping, thousands) {
      return function(value, width) {
        var i = value.length,
            t = [],
            j = 0,
            g = grouping[0],
            length = 0;

        while (i > 0 && g > 0) {
          if (length + g + 1 > width) g = Math.max(1, width - length);
          t.push(value.substring(i -= g, i + g));
          if ((length += g + 1) > width) break;
          g = grouping[j = (j + 1) % grouping.length];
        }

        return t.reverse().join(thousands);
      };
    }

    function formatNumerals(numerals) {
      return function(value) {
        return value.replace(/[0-9]/g, function(i) {
          return numerals[+i];
        });
      };
    }

    // [[fill]align][sign][symbol][0][width][,][.precision][~][type]
    var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;

    function formatSpecifier(specifier) {
      if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
      var match;
      return new FormatSpecifier({
        fill: match[1],
        align: match[2],
        sign: match[3],
        symbol: match[4],
        zero: match[5],
        width: match[6],
        comma: match[7],
        precision: match[8] && match[8].slice(1),
        trim: match[9],
        type: match[10]
      });
    }

    formatSpecifier.prototype = FormatSpecifier.prototype; // instanceof

    function FormatSpecifier(specifier) {
      this.fill = specifier.fill === undefined ? " " : specifier.fill + "";
      this.align = specifier.align === undefined ? ">" : specifier.align + "";
      this.sign = specifier.sign === undefined ? "-" : specifier.sign + "";
      this.symbol = specifier.symbol === undefined ? "" : specifier.symbol + "";
      this.zero = !!specifier.zero;
      this.width = specifier.width === undefined ? undefined : +specifier.width;
      this.comma = !!specifier.comma;
      this.precision = specifier.precision === undefined ? undefined : +specifier.precision;
      this.trim = !!specifier.trim;
      this.type = specifier.type === undefined ? "" : specifier.type + "";
    }

    FormatSpecifier.prototype.toString = function() {
      return this.fill
          + this.align
          + this.sign
          + this.symbol
          + (this.zero ? "0" : "")
          + (this.width === undefined ? "" : Math.max(1, this.width | 0))
          + (this.comma ? "," : "")
          + (this.precision === undefined ? "" : "." + Math.max(0, this.precision | 0))
          + (this.trim ? "~" : "")
          + this.type;
    };

    // Trims insignificant zeros, e.g., replaces 1.2000k with 1.2k.
    function formatTrim(s) {
      out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
        switch (s[i]) {
          case ".": i0 = i1 = i; break;
          case "0": if (i0 === 0) i0 = i; i1 = i; break;
          default: if (!+s[i]) break out; if (i0 > 0) i0 = 0; break;
        }
      }
      return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
    }

    var prefixExponent;

    function formatPrefixAuto(x, p) {
      var d = formatDecimalParts(x, p);
      if (!d) return x + "";
      var coefficient = d[0],
          exponent = d[1],
          i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
          n = coefficient.length;
      return i === n ? coefficient
          : i > n ? coefficient + new Array(i - n + 1).join("0")
          : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
          : "0." + new Array(1 - i).join("0") + formatDecimalParts(x, Math.max(0, p + i - 1))[0]; // less than 1y!
    }

    function formatRounded(x, p) {
      var d = formatDecimalParts(x, p);
      if (!d) return x + "";
      var coefficient = d[0],
          exponent = d[1];
      return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
          : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
          : coefficient + new Array(exponent - coefficient.length + 2).join("0");
    }

    var formatTypes = {
      "%": (x, p) => (x * 100).toFixed(p),
      "b": (x) => Math.round(x).toString(2),
      "c": (x) => x + "",
      "d": formatDecimal,
      "e": (x, p) => x.toExponential(p),
      "f": (x, p) => x.toFixed(p),
      "g": (x, p) => x.toPrecision(p),
      "o": (x) => Math.round(x).toString(8),
      "p": (x, p) => formatRounded(x * 100, p),
      "r": formatRounded,
      "s": formatPrefixAuto,
      "X": (x) => Math.round(x).toString(16).toUpperCase(),
      "x": (x) => Math.round(x).toString(16)
    };

    function identity$1(x) {
      return x;
    }

    var map = Array.prototype.map,
        prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

    function formatLocale(locale) {
      var group = locale.grouping === undefined || locale.thousands === undefined ? identity$1 : formatGroup(map.call(locale.grouping, Number), locale.thousands + ""),
          currencyPrefix = locale.currency === undefined ? "" : locale.currency[0] + "",
          currencySuffix = locale.currency === undefined ? "" : locale.currency[1] + "",
          decimal = locale.decimal === undefined ? "." : locale.decimal + "",
          numerals = locale.numerals === undefined ? identity$1 : formatNumerals(map.call(locale.numerals, String)),
          percent = locale.percent === undefined ? "%" : locale.percent + "",
          minus = locale.minus === undefined ? "−" : locale.minus + "",
          nan = locale.nan === undefined ? "NaN" : locale.nan + "";

      function newFormat(specifier) {
        specifier = formatSpecifier(specifier);

        var fill = specifier.fill,
            align = specifier.align,
            sign = specifier.sign,
            symbol = specifier.symbol,
            zero = specifier.zero,
            width = specifier.width,
            comma = specifier.comma,
            precision = specifier.precision,
            trim = specifier.trim,
            type = specifier.type;

        // The "n" type is an alias for ",g".
        if (type === "n") comma = true, type = "g";

        // The "" type, and any invalid type, is an alias for ".12~g".
        else if (!formatTypes[type]) precision === undefined && (precision = 12), trim = true, type = "g";

        // If zero fill is specified, padding goes after sign and before digits.
        if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

        // Compute the prefix and suffix.
        // For SI-prefix, the suffix is lazily computed.
        var prefix = symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
            suffix = symbol === "$" ? currencySuffix : /[%p]/.test(type) ? percent : "";

        // What format function should we use?
        // Is this an integer type?
        // Can this type generate exponential notation?
        var formatType = formatTypes[type],
            maybeSuffix = /[defgprs%]/.test(type);

        // Set the default precision if not specified,
        // or clamp the specified precision to the supported range.
        // For significant precision, it must be in [1, 21].
        // For fixed precision, it must be in [0, 20].
        precision = precision === undefined ? 6
            : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
            : Math.max(0, Math.min(20, precision));

        function format(value) {
          var valuePrefix = prefix,
              valueSuffix = suffix,
              i, n, c;

          if (type === "c") {
            valueSuffix = formatType(value) + valueSuffix;
            value = "";
          } else {
            value = +value;

            // Determine the sign. -0 is not less than 0, but 1 / -0 is!
            var valueNegative = value < 0 || 1 / value < 0;

            // Perform the initial formatting.
            value = isNaN(value) ? nan : formatType(Math.abs(value), precision);

            // Trim insignificant zeros.
            if (trim) value = formatTrim(value);

            // If a negative value rounds to zero after formatting, and no explicit positive sign is requested, hide the sign.
            if (valueNegative && +value === 0 && sign !== "+") valueNegative = false;

            // Compute the prefix and suffix.
            valuePrefix = (valueNegative ? (sign === "(" ? sign : minus) : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
            valueSuffix = (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign === "(" ? ")" : "");

            // Break the formatted value into the integer “value” part that can be
            // grouped, and fractional or exponential “suffix” part that is not.
            if (maybeSuffix) {
              i = -1, n = value.length;
              while (++i < n) {
                if (c = value.charCodeAt(i), 48 > c || c > 57) {
                  valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
                  value = value.slice(0, i);
                  break;
                }
              }
            }
          }

          // If the fill character is not "0", grouping is applied before padding.
          if (comma && !zero) value = group(value, Infinity);

          // Compute the padding.
          var length = valuePrefix.length + value.length + valueSuffix.length,
              padding = length < width ? new Array(width - length + 1).join(fill) : "";

          // If the fill character is "0", grouping is applied after padding.
          if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

          // Reconstruct the final output based on the desired alignment.
          switch (align) {
            case "<": value = valuePrefix + value + valueSuffix + padding; break;
            case "=": value = valuePrefix + padding + value + valueSuffix; break;
            case "^": value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length); break;
            default: value = padding + valuePrefix + value + valueSuffix; break;
          }

          return numerals(value);
        }

        format.toString = function() {
          return specifier + "";
        };

        return format;
      }

      function formatPrefix(specifier, value) {
        var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
            e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
            k = Math.pow(10, -e),
            prefix = prefixes[8 + e / 3];
        return function(value) {
          return f(k * value) + prefix;
        };
      }

      return {
        format: newFormat,
        formatPrefix: formatPrefix
      };
    }

    var locale;
    var format;
    var formatPrefix;

    defaultLocale({
      thousands: ",",
      grouping: [3],
      currency: ["$", ""]
    });

    function defaultLocale(definition) {
      locale = formatLocale(definition);
      format = locale.format;
      formatPrefix = locale.formatPrefix;
      return locale;
    }

    function precisionFixed(step) {
      return Math.max(0, -exponent(Math.abs(step)));
    }

    function precisionPrefix(step, value) {
      return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 - exponent(Math.abs(step)));
    }

    function precisionRound(step, max) {
      step = Math.abs(step), max = Math.abs(max) - step;
      return Math.max(0, exponent(max) - exponent(step)) + 1;
    }

    function tickFormat(start, stop, count, specifier) {
      var step = tickStep(start, stop, count),
          precision;
      specifier = formatSpecifier(specifier == null ? ",f" : specifier);
      switch (specifier.type) {
        case "s": {
          var value = Math.max(Math.abs(start), Math.abs(stop));
          if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) specifier.precision = precision;
          return formatPrefix(specifier, value);
        }
        case "":
        case "e":
        case "g":
        case "p":
        case "r": {
          if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
          break;
        }
        case "f":
        case "%": {
          if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) specifier.precision = precision - (specifier.type === "%") * 2;
          break;
        }
      }
      return format(specifier);
    }

    function linearish(scale) {
      var domain = scale.domain;

      scale.ticks = function(count) {
        var d = domain();
        return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
      };

      scale.tickFormat = function(count, specifier) {
        var d = domain();
        return tickFormat(d[0], d[d.length - 1], count == null ? 10 : count, specifier);
      };

      scale.nice = function(count) {
        if (count == null) count = 10;

        var d = domain();
        var i0 = 0;
        var i1 = d.length - 1;
        var start = d[i0];
        var stop = d[i1];
        var prestep;
        var step;
        var maxIter = 10;

        if (stop < start) {
          step = start, start = stop, stop = step;
          step = i0, i0 = i1, i1 = step;
        }
        
        while (maxIter-- > 0) {
          step = tickIncrement(start, stop, count);
          if (step === prestep) {
            d[i0] = start;
            d[i1] = stop;
            return domain(d);
          } else if (step > 0) {
            start = Math.floor(start / step) * step;
            stop = Math.ceil(stop / step) * step;
          } else if (step < 0) {
            start = Math.ceil(start * step) / step;
            stop = Math.floor(stop * step) / step;
          } else {
            break;
          }
          prestep = step;
        }

        return scale;
      };

      return scale;
    }

    function linear() {
      var scale = continuous();

      scale.copy = function() {
        return copy(scale, linear());
      };

      initRange.apply(scale, arguments);

      return linearish(scale);
    }

    var noop = {value: () => {}};

    function dispatch() {
      for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
        if (!(t = arguments[i] + "") || (t in _) || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
        _[t] = [];
      }
      return new Dispatch(_);
    }

    function Dispatch(_) {
      this._ = _;
    }

    function parseTypenames$1(typenames, types) {
      return typenames.trim().split(/^|\s+/).map(function(t) {
        var name = "", i = t.indexOf(".");
        if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
        if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
        return {type: t, name: name};
      });
    }

    Dispatch.prototype = dispatch.prototype = {
      constructor: Dispatch,
      on: function(typename, callback) {
        var _ = this._,
            T = parseTypenames$1(typename + "", _),
            t,
            i = -1,
            n = T.length;

        // If no callback was specified, return the callback of the given type and name.
        if (arguments.length < 2) {
          while (++i < n) if ((t = (typename = T[i]).type) && (t = get$1(_[t], typename.name))) return t;
          return;
        }

        // If a type was specified, set the callback for the given type and name.
        // Otherwise, if a null callback was specified, remove callbacks of the given name.
        if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
        while (++i < n) {
          if (t = (typename = T[i]).type) _[t] = set$1(_[t], typename.name, callback);
          else if (callback == null) for (t in _) _[t] = set$1(_[t], typename.name, null);
        }

        return this;
      },
      copy: function() {
        var copy = {}, _ = this._;
        for (var t in _) copy[t] = _[t].slice();
        return new Dispatch(copy);
      },
      call: function(type, that) {
        if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
        if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
        for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
      },
      apply: function(type, that, args) {
        if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
        for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
      }
    };

    function get$1(type, name) {
      for (var i = 0, n = type.length, c; i < n; ++i) {
        if ((c = type[i]).name === name) {
          return c.value;
        }
      }
    }

    function set$1(type, name, callback) {
      for (var i = 0, n = type.length; i < n; ++i) {
        if (type[i].name === name) {
          type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
          break;
        }
      }
      if (callback != null) type.push({name: name, value: callback});
      return type;
    }

    var xhtml = "http://www.w3.org/1999/xhtml";

    var namespaces = {
      svg: "http://www.w3.org/2000/svg",
      xhtml: xhtml,
      xlink: "http://www.w3.org/1999/xlink",
      xml: "http://www.w3.org/XML/1998/namespace",
      xmlns: "http://www.w3.org/2000/xmlns/"
    };

    function namespace(name) {
      var prefix = name += "", i = prefix.indexOf(":");
      if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
      return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name; // eslint-disable-line no-prototype-builtins
    }

    function creatorInherit(name) {
      return function() {
        var document = this.ownerDocument,
            uri = this.namespaceURI;
        return uri === xhtml && document.documentElement.namespaceURI === xhtml
            ? document.createElement(name)
            : document.createElementNS(uri, name);
      };
    }

    function creatorFixed(fullname) {
      return function() {
        return this.ownerDocument.createElementNS(fullname.space, fullname.local);
      };
    }

    function creator(name) {
      var fullname = namespace(name);
      return (fullname.local
          ? creatorFixed
          : creatorInherit)(fullname);
    }

    function none() {}

    function selector(selector) {
      return selector == null ? none : function() {
        return this.querySelector(selector);
      };
    }

    function selection_select(select) {
      if (typeof select !== "function") select = selector(select);

      for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
          if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
            if ("__data__" in node) subnode.__data__ = node.__data__;
            subgroup[i] = subnode;
          }
        }
      }

      return new Selection$1(subgroups, this._parents);
    }

    // Given something array like (or null), returns something that is strictly an
    // array. This is used to ensure that array-like objects passed to d3.selectAll
    // or selection.selectAll are converted into proper arrays when creating a
    // selection; we don’t ever want to create a selection backed by a live
    // HTMLCollection or NodeList. However, note that selection.selectAll will use a
    // static NodeList as a group, since it safely derived from querySelectorAll.
    function array(x) {
      return x == null ? [] : Array.isArray(x) ? x : Array.from(x);
    }

    function empty() {
      return [];
    }

    function selectorAll(selector) {
      return selector == null ? empty : function() {
        return this.querySelectorAll(selector);
      };
    }

    function arrayAll(select) {
      return function() {
        return array(select.apply(this, arguments));
      };
    }

    function selection_selectAll(select) {
      if (typeof select === "function") select = arrayAll(select);
      else select = selectorAll(select);

      for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            subgroups.push(select.call(node, node.__data__, i, group));
            parents.push(node);
          }
        }
      }

      return new Selection$1(subgroups, parents);
    }

    function matcher(selector) {
      return function() {
        return this.matches(selector);
      };
    }

    function childMatcher(selector) {
      return function(node) {
        return node.matches(selector);
      };
    }

    var find$1 = Array.prototype.find;

    function childFind(match) {
      return function() {
        return find$1.call(this.children, match);
      };
    }

    function childFirst() {
      return this.firstElementChild;
    }

    function selection_selectChild(match) {
      return this.select(match == null ? childFirst
          : childFind(typeof match === "function" ? match : childMatcher(match)));
    }

    var filter = Array.prototype.filter;

    function children() {
      return Array.from(this.children);
    }

    function childrenFilter(match) {
      return function() {
        return filter.call(this.children, match);
      };
    }

    function selection_selectChildren(match) {
      return this.selectAll(match == null ? children
          : childrenFilter(typeof match === "function" ? match : childMatcher(match)));
    }

    function selection_filter(match) {
      if (typeof match !== "function") match = matcher(match);

      for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
          if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
            subgroup.push(node);
          }
        }
      }

      return new Selection$1(subgroups, this._parents);
    }

    function sparse(update) {
      return new Array(update.length);
    }

    function selection_enter() {
      return new Selection$1(this._enter || this._groups.map(sparse), this._parents);
    }

    function EnterNode(parent, datum) {
      this.ownerDocument = parent.ownerDocument;
      this.namespaceURI = parent.namespaceURI;
      this._next = null;
      this._parent = parent;
      this.__data__ = datum;
    }

    EnterNode.prototype = {
      constructor: EnterNode,
      appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
      insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
      querySelector: function(selector) { return this._parent.querySelector(selector); },
      querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
    };

    function constant$3(x) {
      return function() {
        return x;
      };
    }

    function bindIndex(parent, group, enter, update, exit, data) {
      var i = 0,
          node,
          groupLength = group.length,
          dataLength = data.length;

      // Put any non-null nodes that fit into update.
      // Put any null nodes into enter.
      // Put any remaining data into enter.
      for (; i < dataLength; ++i) {
        if (node = group[i]) {
          node.__data__ = data[i];
          update[i] = node;
        } else {
          enter[i] = new EnterNode(parent, data[i]);
        }
      }

      // Put any non-null nodes that don’t fit into exit.
      for (; i < groupLength; ++i) {
        if (node = group[i]) {
          exit[i] = node;
        }
      }
    }

    function bindKey(parent, group, enter, update, exit, data, key) {
      var i,
          node,
          nodeByKeyValue = new Map,
          groupLength = group.length,
          dataLength = data.length,
          keyValues = new Array(groupLength),
          keyValue;

      // Compute the key for each node.
      // If multiple nodes have the same key, the duplicates are added to exit.
      for (i = 0; i < groupLength; ++i) {
        if (node = group[i]) {
          keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + "";
          if (nodeByKeyValue.has(keyValue)) {
            exit[i] = node;
          } else {
            nodeByKeyValue.set(keyValue, node);
          }
        }
      }

      // Compute the key for each datum.
      // If there a node associated with this key, join and add it to update.
      // If there is not (or the key is a duplicate), add it to enter.
      for (i = 0; i < dataLength; ++i) {
        keyValue = key.call(parent, data[i], i, data) + "";
        if (node = nodeByKeyValue.get(keyValue)) {
          update[i] = node;
          node.__data__ = data[i];
          nodeByKeyValue.delete(keyValue);
        } else {
          enter[i] = new EnterNode(parent, data[i]);
        }
      }

      // Add any remaining nodes that were not bound to data to exit.
      for (i = 0; i < groupLength; ++i) {
        if ((node = group[i]) && (nodeByKeyValue.get(keyValues[i]) === node)) {
          exit[i] = node;
        }
      }
    }

    function datum(node) {
      return node.__data__;
    }

    function selection_data(value, key) {
      if (!arguments.length) return Array.from(this, datum);

      var bind = key ? bindKey : bindIndex,
          parents = this._parents,
          groups = this._groups;

      if (typeof value !== "function") value = constant$3(value);

      for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
        var parent = parents[j],
            group = groups[j],
            groupLength = group.length,
            data = arraylike(value.call(parent, parent && parent.__data__, j, parents)),
            dataLength = data.length,
            enterGroup = enter[j] = new Array(dataLength),
            updateGroup = update[j] = new Array(dataLength),
            exitGroup = exit[j] = new Array(groupLength);

        bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

        // Now connect the enter nodes to their following update node, such that
        // appendChild can insert the materialized enter node before this node,
        // rather than at the end of the parent node.
        for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
          if (previous = enterGroup[i0]) {
            if (i0 >= i1) i1 = i0 + 1;
            while (!(next = updateGroup[i1]) && ++i1 < dataLength);
            previous._next = next || null;
          }
        }
      }

      update = new Selection$1(update, parents);
      update._enter = enter;
      update._exit = exit;
      return update;
    }

    // Given some data, this returns an array-like view of it: an object that
    // exposes a length property and allows numeric indexing. Note that unlike
    // selectAll, this isn’t worried about “live” collections because the resulting
    // array will only be used briefly while data is being bound. (It is possible to
    // cause the data to change while iterating by using a key function, but please
    // don’t; we’d rather avoid a gratuitous copy.)
    function arraylike(data) {
      return typeof data === "object" && "length" in data
        ? data // Array, TypedArray, NodeList, array-like
        : Array.from(data); // Map, Set, iterable, string, or anything else
    }

    function selection_exit() {
      return new Selection$1(this._exit || this._groups.map(sparse), this._parents);
    }

    function selection_join(onenter, onupdate, onexit) {
      var enter = this.enter(), update = this, exit = this.exit();
      if (typeof onenter === "function") {
        enter = onenter(enter);
        if (enter) enter = enter.selection();
      } else {
        enter = enter.append(onenter + "");
      }
      if (onupdate != null) {
        update = onupdate(update);
        if (update) update = update.selection();
      }
      if (onexit == null) exit.remove(); else onexit(exit);
      return enter && update ? enter.merge(update).order() : update;
    }

    function selection_merge(context) {
      var selection = context.selection ? context.selection() : context;

      for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
        for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
          if (node = group0[i] || group1[i]) {
            merge[i] = node;
          }
        }
      }

      for (; j < m0; ++j) {
        merges[j] = groups0[j];
      }

      return new Selection$1(merges, this._parents);
    }

    function selection_order() {

      for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
        for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
          if (node = group[i]) {
            if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
            next = node;
          }
        }
      }

      return this;
    }

    function selection_sort(compare) {
      if (!compare) compare = ascending;

      function compareNode(a, b) {
        return a && b ? compare(a.__data__, b.__data__) : !a - !b;
      }

      for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            sortgroup[i] = node;
          }
        }
        sortgroup.sort(compareNode);
      }

      return new Selection$1(sortgroups, this._parents).order();
    }

    function ascending(a, b) {
      return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
    }

    function selection_call() {
      var callback = arguments[0];
      arguments[0] = this;
      callback.apply(null, arguments);
      return this;
    }

    function selection_nodes() {
      return Array.from(this);
    }

    function selection_node() {

      for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
        for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
          var node = group[i];
          if (node) return node;
        }
      }

      return null;
    }

    function selection_size() {
      let size = 0;
      for (const node of this) ++size; // eslint-disable-line no-unused-vars
      return size;
    }

    function selection_empty() {
      return !this.node();
    }

    function selection_each(callback) {

      for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
        for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
          if (node = group[i]) callback.call(node, node.__data__, i, group);
        }
      }

      return this;
    }

    function attrRemove$1(name) {
      return function() {
        this.removeAttribute(name);
      };
    }

    function attrRemoveNS$1(fullname) {
      return function() {
        this.removeAttributeNS(fullname.space, fullname.local);
      };
    }

    function attrConstant$1(name, value) {
      return function() {
        this.setAttribute(name, value);
      };
    }

    function attrConstantNS$1(fullname, value) {
      return function() {
        this.setAttributeNS(fullname.space, fullname.local, value);
      };
    }

    function attrFunction$1(name, value) {
      return function() {
        var v = value.apply(this, arguments);
        if (v == null) this.removeAttribute(name);
        else this.setAttribute(name, v);
      };
    }

    function attrFunctionNS$1(fullname, value) {
      return function() {
        var v = value.apply(this, arguments);
        if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
        else this.setAttributeNS(fullname.space, fullname.local, v);
      };
    }

    function selection_attr(name, value) {
      var fullname = namespace(name);

      if (arguments.length < 2) {
        var node = this.node();
        return fullname.local
            ? node.getAttributeNS(fullname.space, fullname.local)
            : node.getAttribute(fullname);
      }

      return this.each((value == null
          ? (fullname.local ? attrRemoveNS$1 : attrRemove$1) : (typeof value === "function"
          ? (fullname.local ? attrFunctionNS$1 : attrFunction$1)
          : (fullname.local ? attrConstantNS$1 : attrConstant$1)))(fullname, value));
    }

    function defaultView(node) {
      return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
          || (node.document && node) // node is a Window
          || node.defaultView; // node is a Document
    }

    function styleRemove$1(name) {
      return function() {
        this.style.removeProperty(name);
      };
    }

    function styleConstant$1(name, value, priority) {
      return function() {
        this.style.setProperty(name, value, priority);
      };
    }

    function styleFunction$1(name, value, priority) {
      return function() {
        var v = value.apply(this, arguments);
        if (v == null) this.style.removeProperty(name);
        else this.style.setProperty(name, v, priority);
      };
    }

    function selection_style(name, value, priority) {
      return arguments.length > 1
          ? this.each((value == null
                ? styleRemove$1 : typeof value === "function"
                ? styleFunction$1
                : styleConstant$1)(name, value, priority == null ? "" : priority))
          : styleValue(this.node(), name);
    }

    function styleValue(node, name) {
      return node.style.getPropertyValue(name)
          || defaultView(node).getComputedStyle(node, null).getPropertyValue(name);
    }

    function propertyRemove(name) {
      return function() {
        delete this[name];
      };
    }

    function propertyConstant(name, value) {
      return function() {
        this[name] = value;
      };
    }

    function propertyFunction(name, value) {
      return function() {
        var v = value.apply(this, arguments);
        if (v == null) delete this[name];
        else this[name] = v;
      };
    }

    function selection_property(name, value) {
      return arguments.length > 1
          ? this.each((value == null
              ? propertyRemove : typeof value === "function"
              ? propertyFunction
              : propertyConstant)(name, value))
          : this.node()[name];
    }

    function classArray(string) {
      return string.trim().split(/^|\s+/);
    }

    function classList(node) {
      return node.classList || new ClassList(node);
    }

    function ClassList(node) {
      this._node = node;
      this._names = classArray(node.getAttribute("class") || "");
    }

    ClassList.prototype = {
      add: function(name) {
        var i = this._names.indexOf(name);
        if (i < 0) {
          this._names.push(name);
          this._node.setAttribute("class", this._names.join(" "));
        }
      },
      remove: function(name) {
        var i = this._names.indexOf(name);
        if (i >= 0) {
          this._names.splice(i, 1);
          this._node.setAttribute("class", this._names.join(" "));
        }
      },
      contains: function(name) {
        return this._names.indexOf(name) >= 0;
      }
    };

    function classedAdd(node, names) {
      var list = classList(node), i = -1, n = names.length;
      while (++i < n) list.add(names[i]);
    }

    function classedRemove(node, names) {
      var list = classList(node), i = -1, n = names.length;
      while (++i < n) list.remove(names[i]);
    }

    function classedTrue(names) {
      return function() {
        classedAdd(this, names);
      };
    }

    function classedFalse(names) {
      return function() {
        classedRemove(this, names);
      };
    }

    function classedFunction(names, value) {
      return function() {
        (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
      };
    }

    function selection_classed(name, value) {
      var names = classArray(name + "");

      if (arguments.length < 2) {
        var list = classList(this.node()), i = -1, n = names.length;
        while (++i < n) if (!list.contains(names[i])) return false;
        return true;
      }

      return this.each((typeof value === "function"
          ? classedFunction : value
          ? classedTrue
          : classedFalse)(names, value));
    }

    function textRemove() {
      this.textContent = "";
    }

    function textConstant$1(value) {
      return function() {
        this.textContent = value;
      };
    }

    function textFunction$1(value) {
      return function() {
        var v = value.apply(this, arguments);
        this.textContent = v == null ? "" : v;
      };
    }

    function selection_text(value) {
      return arguments.length
          ? this.each(value == null
              ? textRemove : (typeof value === "function"
              ? textFunction$1
              : textConstant$1)(value))
          : this.node().textContent;
    }

    function htmlRemove() {
      this.innerHTML = "";
    }

    function htmlConstant(value) {
      return function() {
        this.innerHTML = value;
      };
    }

    function htmlFunction(value) {
      return function() {
        var v = value.apply(this, arguments);
        this.innerHTML = v == null ? "" : v;
      };
    }

    function selection_html(value) {
      return arguments.length
          ? this.each(value == null
              ? htmlRemove : (typeof value === "function"
              ? htmlFunction
              : htmlConstant)(value))
          : this.node().innerHTML;
    }

    function raise() {
      if (this.nextSibling) this.parentNode.appendChild(this);
    }

    function selection_raise() {
      return this.each(raise);
    }

    function lower() {
      if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
    }

    function selection_lower() {
      return this.each(lower);
    }

    function selection_append(name) {
      var create = typeof name === "function" ? name : creator(name);
      return this.select(function() {
        return this.appendChild(create.apply(this, arguments));
      });
    }

    function constantNull() {
      return null;
    }

    function selection_insert(name, before) {
      var create = typeof name === "function" ? name : creator(name),
          select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
      return this.select(function() {
        return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
      });
    }

    function remove() {
      var parent = this.parentNode;
      if (parent) parent.removeChild(this);
    }

    function selection_remove() {
      return this.each(remove);
    }

    function selection_cloneShallow() {
      var clone = this.cloneNode(false), parent = this.parentNode;
      return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
    }

    function selection_cloneDeep() {
      var clone = this.cloneNode(true), parent = this.parentNode;
      return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
    }

    function selection_clone(deep) {
      return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
    }

    function selection_datum(value) {
      return arguments.length
          ? this.property("__data__", value)
          : this.node().__data__;
    }

    function contextListener(listener) {
      return function(event) {
        listener.call(this, event, this.__data__);
      };
    }

    function parseTypenames(typenames) {
      return typenames.trim().split(/^|\s+/).map(function(t) {
        var name = "", i = t.indexOf(".");
        if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
        return {type: t, name: name};
      });
    }

    function onRemove(typename) {
      return function() {
        var on = this.__on;
        if (!on) return;
        for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
          if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
            this.removeEventListener(o.type, o.listener, o.options);
          } else {
            on[++i] = o;
          }
        }
        if (++i) on.length = i;
        else delete this.__on;
      };
    }

    function onAdd(typename, value, options) {
      return function() {
        var on = this.__on, o, listener = contextListener(value);
        if (on) for (var j = 0, m = on.length; j < m; ++j) {
          if ((o = on[j]).type === typename.type && o.name === typename.name) {
            this.removeEventListener(o.type, o.listener, o.options);
            this.addEventListener(o.type, o.listener = listener, o.options = options);
            o.value = value;
            return;
          }
        }
        this.addEventListener(typename.type, listener, options);
        o = {type: typename.type, name: typename.name, value: value, listener: listener, options: options};
        if (!on) this.__on = [o];
        else on.push(o);
      };
    }

    function selection_on(typename, value, options) {
      var typenames = parseTypenames(typename + ""), i, n = typenames.length, t;

      if (arguments.length < 2) {
        var on = this.node().__on;
        if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
          for (i = 0, o = on[j]; i < n; ++i) {
            if ((t = typenames[i]).type === o.type && t.name === o.name) {
              return o.value;
            }
          }
        }
        return;
      }

      on = value ? onAdd : onRemove;
      for (i = 0; i < n; ++i) this.each(on(typenames[i], value, options));
      return this;
    }

    function dispatchEvent(node, type, params) {
      var window = defaultView(node),
          event = window.CustomEvent;

      if (typeof event === "function") {
        event = new event(type, params);
      } else {
        event = window.document.createEvent("Event");
        if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
        else event.initEvent(type, false, false);
      }

      node.dispatchEvent(event);
    }

    function dispatchConstant(type, params) {
      return function() {
        return dispatchEvent(this, type, params);
      };
    }

    function dispatchFunction(type, params) {
      return function() {
        return dispatchEvent(this, type, params.apply(this, arguments));
      };
    }

    function selection_dispatch(type, params) {
      return this.each((typeof params === "function"
          ? dispatchFunction
          : dispatchConstant)(type, params));
    }

    function* selection_iterator() {
      for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
        for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
          if (node = group[i]) yield node;
        }
      }
    }

    var root = [null];

    function Selection$1(groups, parents) {
      this._groups = groups;
      this._parents = parents;
    }

    function selection() {
      return new Selection$1([[document.documentElement]], root);
    }

    function selection_selection() {
      return this;
    }

    Selection$1.prototype = selection.prototype = {
      constructor: Selection$1,
      select: selection_select,
      selectAll: selection_selectAll,
      selectChild: selection_selectChild,
      selectChildren: selection_selectChildren,
      filter: selection_filter,
      data: selection_data,
      enter: selection_enter,
      exit: selection_exit,
      join: selection_join,
      merge: selection_merge,
      selection: selection_selection,
      order: selection_order,
      sort: selection_sort,
      call: selection_call,
      nodes: selection_nodes,
      node: selection_node,
      size: selection_size,
      empty: selection_empty,
      each: selection_each,
      attr: selection_attr,
      style: selection_style,
      property: selection_property,
      classed: selection_classed,
      text: selection_text,
      html: selection_html,
      raise: selection_raise,
      lower: selection_lower,
      append: selection_append,
      insert: selection_insert,
      remove: selection_remove,
      clone: selection_clone,
      datum: selection_datum,
      on: selection_on,
      dispatch: selection_dispatch,
      [Symbol.iterator]: selection_iterator
    };

    function select(selector) {
      return typeof selector === "string"
          ? new Selection$1([[document.querySelector(selector)]], [document.documentElement])
          : new Selection$1([[selector]], root);
    }

    function sourceEvent(event) {
      let sourceEvent;
      while (sourceEvent = event.sourceEvent) event = sourceEvent;
      return event;
    }

    function pointer(event, node) {
      event = sourceEvent(event);
      if (node === undefined) node = event.currentTarget;
      if (node) {
        var svg = node.ownerSVGElement || node;
        if (svg.createSVGPoint) {
          var point = svg.createSVGPoint();
          point.x = event.clientX, point.y = event.clientY;
          point = point.matrixTransform(node.getScreenCTM().inverse());
          return [point.x, point.y];
        }
        if (node.getBoundingClientRect) {
          var rect = node.getBoundingClientRect();
          return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
        }
      }
      return [event.pageX, event.pageY];
    }

    function selectAll(selector) {
      return typeof selector === "string"
          ? new Selection$1([document.querySelectorAll(selector)], [document.documentElement])
          : new Selection$1([array(selector)], root);
    }

    // These are typically used in conjunction with noevent to ensure that we can
    // preventDefault on the event.
    const nonpassive = {passive: false};
    const nonpassivecapture = {capture: true, passive: false};

    function nopropagation$1(event) {
      event.stopImmediatePropagation();
    }

    function noevent$1(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    function dragDisable(view) {
      var root = view.document.documentElement,
          selection = select(view).on("dragstart.drag", noevent$1, nonpassivecapture);
      if ("onselectstart" in root) {
        selection.on("selectstart.drag", noevent$1, nonpassivecapture);
      } else {
        root.__noselect = root.style.MozUserSelect;
        root.style.MozUserSelect = "none";
      }
    }

    function yesdrag(view, noclick) {
      var root = view.document.documentElement,
          selection = select(view).on("dragstart.drag", null);
      if (noclick) {
        selection.on("click.drag", noevent$1, nonpassivecapture);
        setTimeout(function() { selection.on("click.drag", null); }, 0);
      }
      if ("onselectstart" in root) {
        selection.on("selectstart.drag", null);
      } else {
        root.style.MozUserSelect = root.__noselect;
        delete root.__noselect;
      }
    }

    var constant$2 = x => () => x;

    function DragEvent(type, {
      sourceEvent,
      subject,
      target,
      identifier,
      active,
      x, y, dx, dy,
      dispatch
    }) {
      Object.defineProperties(this, {
        type: {value: type, enumerable: true, configurable: true},
        sourceEvent: {value: sourceEvent, enumerable: true, configurable: true},
        subject: {value: subject, enumerable: true, configurable: true},
        target: {value: target, enumerable: true, configurable: true},
        identifier: {value: identifier, enumerable: true, configurable: true},
        active: {value: active, enumerable: true, configurable: true},
        x: {value: x, enumerable: true, configurable: true},
        y: {value: y, enumerable: true, configurable: true},
        dx: {value: dx, enumerable: true, configurable: true},
        dy: {value: dy, enumerable: true, configurable: true},
        _: {value: dispatch}
      });
    }

    DragEvent.prototype.on = function() {
      var value = this._.on.apply(this._, arguments);
      return value === this._ ? this : value;
    };

    // Ignore right-click, since that should open the context menu.
    function defaultFilter$1(event) {
      return !event.ctrlKey && !event.button;
    }

    function defaultContainer() {
      return this.parentNode;
    }

    function defaultSubject(event, d) {
      return d == null ? {x: event.x, y: event.y} : d;
    }

    function defaultTouchable$1() {
      return navigator.maxTouchPoints || ("ontouchstart" in this);
    }

    function drag() {
      var filter = defaultFilter$1,
          container = defaultContainer,
          subject = defaultSubject,
          touchable = defaultTouchable$1,
          gestures = {},
          listeners = dispatch("start", "drag", "end"),
          active = 0,
          mousedownx,
          mousedowny,
          mousemoving,
          touchending,
          clickDistance2 = 0;

      function drag(selection) {
        selection
            .on("mousedown.drag", mousedowned)
          .filter(touchable)
            .on("touchstart.drag", touchstarted)
            .on("touchmove.drag", touchmoved, nonpassive)
            .on("touchend.drag touchcancel.drag", touchended)
            .style("touch-action", "none")
            .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
      }

      function mousedowned(event, d) {
        if (touchending || !filter.call(this, event, d)) return;
        var gesture = beforestart(this, container.call(this, event, d), event, d, "mouse");
        if (!gesture) return;
        select(event.view)
          .on("mousemove.drag", mousemoved, nonpassivecapture)
          .on("mouseup.drag", mouseupped, nonpassivecapture);
        dragDisable(event.view);
        nopropagation$1(event);
        mousemoving = false;
        mousedownx = event.clientX;
        mousedowny = event.clientY;
        gesture("start", event);
      }

      function mousemoved(event) {
        noevent$1(event);
        if (!mousemoving) {
          var dx = event.clientX - mousedownx, dy = event.clientY - mousedowny;
          mousemoving = dx * dx + dy * dy > clickDistance2;
        }
        gestures.mouse("drag", event);
      }

      function mouseupped(event) {
        select(event.view).on("mousemove.drag mouseup.drag", null);
        yesdrag(event.view, mousemoving);
        noevent$1(event);
        gestures.mouse("end", event);
      }

      function touchstarted(event, d) {
        if (!filter.call(this, event, d)) return;
        var touches = event.changedTouches,
            c = container.call(this, event, d),
            n = touches.length, i, gesture;

        for (i = 0; i < n; ++i) {
          if (gesture = beforestart(this, c, event, d, touches[i].identifier, touches[i])) {
            nopropagation$1(event);
            gesture("start", event, touches[i]);
          }
        }
      }

      function touchmoved(event) {
        var touches = event.changedTouches,
            n = touches.length, i, gesture;

        for (i = 0; i < n; ++i) {
          if (gesture = gestures[touches[i].identifier]) {
            noevent$1(event);
            gesture("drag", event, touches[i]);
          }
        }
      }

      function touchended(event) {
        var touches = event.changedTouches,
            n = touches.length, i, gesture;

        if (touchending) clearTimeout(touchending);
        touchending = setTimeout(function() { touchending = null; }, 500); // Ghost clicks are delayed!
        for (i = 0; i < n; ++i) {
          if (gesture = gestures[touches[i].identifier]) {
            nopropagation$1(event);
            gesture("end", event, touches[i]);
          }
        }
      }

      function beforestart(that, container, event, d, identifier, touch) {
        var dispatch = listeners.copy(),
            p = pointer(touch || event, container), dx, dy,
            s;

        if ((s = subject.call(that, new DragEvent("beforestart", {
            sourceEvent: event,
            target: drag,
            identifier,
            active,
            x: p[0],
            y: p[1],
            dx: 0,
            dy: 0,
            dispatch
          }), d)) == null) return;

        dx = s.x - p[0] || 0;
        dy = s.y - p[1] || 0;

        return function gesture(type, event, touch) {
          var p0 = p, n;
          switch (type) {
            case "start": gestures[identifier] = gesture, n = active++; break;
            case "end": delete gestures[identifier], --active; // falls through
            case "drag": p = pointer(touch || event, container), n = active; break;
          }
          dispatch.call(
            type,
            that,
            new DragEvent(type, {
              sourceEvent: event,
              subject: s,
              target: drag,
              identifier,
              active: n,
              x: p[0] + dx,
              y: p[1] + dy,
              dx: p[0] - p0[0],
              dy: p[1] - p0[1],
              dispatch
            }),
            d
          );
        };
      }

      drag.filter = function(_) {
        return arguments.length ? (filter = typeof _ === "function" ? _ : constant$2(!!_), drag) : filter;
      };

      drag.container = function(_) {
        return arguments.length ? (container = typeof _ === "function" ? _ : constant$2(_), drag) : container;
      };

      drag.subject = function(_) {
        return arguments.length ? (subject = typeof _ === "function" ? _ : constant$2(_), drag) : subject;
      };

      drag.touchable = function(_) {
        return arguments.length ? (touchable = typeof _ === "function" ? _ : constant$2(!!_), drag) : touchable;
      };

      drag.on = function() {
        var value = listeners.on.apply(listeners, arguments);
        return value === listeners ? drag : value;
      };

      drag.clickDistance = function(_) {
        return arguments.length ? (clickDistance2 = (_ = +_) * _, drag) : Math.sqrt(clickDistance2);
      };

      return drag;
    }

    var frame = 0, // is an animation frame pending?
        timeout$1 = 0, // is a timeout pending?
        interval = 0, // are any timers active?
        pokeDelay = 1000, // how frequently we check for clock skew
        taskHead,
        taskTail,
        clockLast = 0,
        clockNow = 0,
        clockSkew = 0,
        clock = typeof performance === "object" && performance.now ? performance : Date,
        setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) { setTimeout(f, 17); };

    function now() {
      return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
    }

    function clearNow() {
      clockNow = 0;
    }

    function Timer() {
      this._call =
      this._time =
      this._next = null;
    }

    Timer.prototype = timer.prototype = {
      constructor: Timer,
      restart: function(callback, delay, time) {
        if (typeof callback !== "function") throw new TypeError("callback is not a function");
        time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
        if (!this._next && taskTail !== this) {
          if (taskTail) taskTail._next = this;
          else taskHead = this;
          taskTail = this;
        }
        this._call = callback;
        this._time = time;
        sleep();
      },
      stop: function() {
        if (this._call) {
          this._call = null;
          this._time = Infinity;
          sleep();
        }
      }
    };

    function timer(callback, delay, time) {
      var t = new Timer;
      t.restart(callback, delay, time);
      return t;
    }

    function timerFlush() {
      now(); // Get the current time, if not already set.
      ++frame; // Pretend we’ve set an alarm, if we haven’t already.
      var t = taskHead, e;
      while (t) {
        if ((e = clockNow - t._time) >= 0) t._call.call(undefined, e);
        t = t._next;
      }
      --frame;
    }

    function wake() {
      clockNow = (clockLast = clock.now()) + clockSkew;
      frame = timeout$1 = 0;
      try {
        timerFlush();
      } finally {
        frame = 0;
        nap();
        clockNow = 0;
      }
    }

    function poke() {
      var now = clock.now(), delay = now - clockLast;
      if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
    }

    function nap() {
      var t0, t1 = taskHead, t2, time = Infinity;
      while (t1) {
        if (t1._call) {
          if (time > t1._time) time = t1._time;
          t0 = t1, t1 = t1._next;
        } else {
          t2 = t1._next, t1._next = null;
          t1 = t0 ? t0._next = t2 : taskHead = t2;
        }
      }
      taskTail = t0;
      sleep(time);
    }

    function sleep(time) {
      if (frame) return; // Soonest alarm already set, or will be.
      if (timeout$1) timeout$1 = clearTimeout(timeout$1);
      var delay = time - clockNow; // Strictly less than if we recomputed clockNow.
      if (delay > 24) {
        if (time < Infinity) timeout$1 = setTimeout(wake, time - clock.now() - clockSkew);
        if (interval) interval = clearInterval(interval);
      } else {
        if (!interval) clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
        frame = 1, setFrame(wake);
      }
    }

    function timeout(callback, delay, time) {
      var t = new Timer;
      delay = delay == null ? 0 : +delay;
      t.restart(elapsed => {
        t.stop();
        callback(elapsed + delay);
      }, delay, time);
      return t;
    }

    var emptyOn = dispatch("start", "end", "cancel", "interrupt");
    var emptyTween = [];

    var CREATED = 0;
    var SCHEDULED = 1;
    var STARTING = 2;
    var STARTED = 3;
    var RUNNING = 4;
    var ENDING = 5;
    var ENDED = 6;

    function schedule(node, name, id, index, group, timing) {
      var schedules = node.__transition;
      if (!schedules) node.__transition = {};
      else if (id in schedules) return;
      create(node, id, {
        name: name,
        index: index, // For context during callback.
        group: group, // For context during callback.
        on: emptyOn,
        tween: emptyTween,
        time: timing.time,
        delay: timing.delay,
        duration: timing.duration,
        ease: timing.ease,
        timer: null,
        state: CREATED
      });
    }

    function init(node, id) {
      var schedule = get(node, id);
      if (schedule.state > CREATED) throw new Error("too late; already scheduled");
      return schedule;
    }

    function set(node, id) {
      var schedule = get(node, id);
      if (schedule.state > STARTED) throw new Error("too late; already running");
      return schedule;
    }

    function get(node, id) {
      var schedule = node.__transition;
      if (!schedule || !(schedule = schedule[id])) throw new Error("transition not found");
      return schedule;
    }

    function create(node, id, self) {
      var schedules = node.__transition,
          tween;

      // Initialize the self timer when the transition is created.
      // Note the actual delay is not known until the first callback!
      schedules[id] = self;
      self.timer = timer(schedule, 0, self.time);

      function schedule(elapsed) {
        self.state = SCHEDULED;
        self.timer.restart(start, self.delay, self.time);

        // If the elapsed delay is less than our first sleep, start immediately.
        if (self.delay <= elapsed) start(elapsed - self.delay);
      }

      function start(elapsed) {
        var i, j, n, o;

        // If the state is not SCHEDULED, then we previously errored on start.
        if (self.state !== SCHEDULED) return stop();

        for (i in schedules) {
          o = schedules[i];
          if (o.name !== self.name) continue;

          // While this element already has a starting transition during this frame,
          // defer starting an interrupting transition until that transition has a
          // chance to tick (and possibly end); see d3/d3-transition#54!
          if (o.state === STARTED) return timeout(start);

          // Interrupt the active transition, if any.
          if (o.state === RUNNING) {
            o.state = ENDED;
            o.timer.stop();
            o.on.call("interrupt", node, node.__data__, o.index, o.group);
            delete schedules[i];
          }

          // Cancel any pre-empted transitions.
          else if (+i < id) {
            o.state = ENDED;
            o.timer.stop();
            o.on.call("cancel", node, node.__data__, o.index, o.group);
            delete schedules[i];
          }
        }

        // Defer the first tick to end of the current frame; see d3/d3#1576.
        // Note the transition may be canceled after start and before the first tick!
        // Note this must be scheduled before the start event; see d3/d3-transition#16!
        // Assuming this is successful, subsequent callbacks go straight to tick.
        timeout(function() {
          if (self.state === STARTED) {
            self.state = RUNNING;
            self.timer.restart(tick, self.delay, self.time);
            tick(elapsed);
          }
        });

        // Dispatch the start event.
        // Note this must be done before the tween are initialized.
        self.state = STARTING;
        self.on.call("start", node, node.__data__, self.index, self.group);
        if (self.state !== STARTING) return; // interrupted
        self.state = STARTED;

        // Initialize the tween, deleting null tween.
        tween = new Array(n = self.tween.length);
        for (i = 0, j = -1; i < n; ++i) {
          if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
            tween[++j] = o;
          }
        }
        tween.length = j + 1;
      }

      function tick(elapsed) {
        var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1),
            i = -1,
            n = tween.length;

        while (++i < n) {
          tween[i].call(node, t);
        }

        // Dispatch the end event.
        if (self.state === ENDING) {
          self.on.call("end", node, node.__data__, self.index, self.group);
          stop();
        }
      }

      function stop() {
        self.state = ENDED;
        self.timer.stop();
        delete schedules[id];
        for (var i in schedules) return; // eslint-disable-line no-unused-vars
        delete node.__transition;
      }
    }

    function interrupt(node, name) {
      var schedules = node.__transition,
          schedule,
          active,
          empty = true,
          i;

      if (!schedules) return;

      name = name == null ? null : name + "";

      for (i in schedules) {
        if ((schedule = schedules[i]).name !== name) { empty = false; continue; }
        active = schedule.state > STARTING && schedule.state < ENDING;
        schedule.state = ENDED;
        schedule.timer.stop();
        schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
        delete schedules[i];
      }

      if (empty) delete node.__transition;
    }

    function selection_interrupt(name) {
      return this.each(function() {
        interrupt(this, name);
      });
    }

    function tweenRemove(id, name) {
      var tween0, tween1;
      return function() {
        var schedule = set(this, id),
            tween = schedule.tween;

        // If this node shared tween with the previous node,
        // just assign the updated shared tween and we’re done!
        // Otherwise, copy-on-write.
        if (tween !== tween0) {
          tween1 = tween0 = tween;
          for (var i = 0, n = tween1.length; i < n; ++i) {
            if (tween1[i].name === name) {
              tween1 = tween1.slice();
              tween1.splice(i, 1);
              break;
            }
          }
        }

        schedule.tween = tween1;
      };
    }

    function tweenFunction(id, name, value) {
      var tween0, tween1;
      if (typeof value !== "function") throw new Error;
      return function() {
        var schedule = set(this, id),
            tween = schedule.tween;

        // If this node shared tween with the previous node,
        // just assign the updated shared tween and we’re done!
        // Otherwise, copy-on-write.
        if (tween !== tween0) {
          tween1 = (tween0 = tween).slice();
          for (var t = {name: name, value: value}, i = 0, n = tween1.length; i < n; ++i) {
            if (tween1[i].name === name) {
              tween1[i] = t;
              break;
            }
          }
          if (i === n) tween1.push(t);
        }

        schedule.tween = tween1;
      };
    }

    function transition_tween(name, value) {
      var id = this._id;

      name += "";

      if (arguments.length < 2) {
        var tween = get(this.node(), id).tween;
        for (var i = 0, n = tween.length, t; i < n; ++i) {
          if ((t = tween[i]).name === name) {
            return t.value;
          }
        }
        return null;
      }

      return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
    }

    function tweenValue(transition, name, value) {
      var id = transition._id;

      transition.each(function() {
        var schedule = set(this, id);
        (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
      });

      return function(node) {
        return get(node, id).value[name];
      };
    }

    function interpolate(a, b) {
      var c;
      return (typeof b === "number" ? interpolateNumber
          : b instanceof color ? interpolateRgb
          : (c = color(b)) ? (b = c, interpolateRgb)
          : interpolateString)(a, b);
    }

    function attrRemove(name) {
      return function() {
        this.removeAttribute(name);
      };
    }

    function attrRemoveNS(fullname) {
      return function() {
        this.removeAttributeNS(fullname.space, fullname.local);
      };
    }

    function attrConstant(name, interpolate, value1) {
      var string00,
          string1 = value1 + "",
          interpolate0;
      return function() {
        var string0 = this.getAttribute(name);
        return string0 === string1 ? null
            : string0 === string00 ? interpolate0
            : interpolate0 = interpolate(string00 = string0, value1);
      };
    }

    function attrConstantNS(fullname, interpolate, value1) {
      var string00,
          string1 = value1 + "",
          interpolate0;
      return function() {
        var string0 = this.getAttributeNS(fullname.space, fullname.local);
        return string0 === string1 ? null
            : string0 === string00 ? interpolate0
            : interpolate0 = interpolate(string00 = string0, value1);
      };
    }

    function attrFunction(name, interpolate, value) {
      var string00,
          string10,
          interpolate0;
      return function() {
        var string0, value1 = value(this), string1;
        if (value1 == null) return void this.removeAttribute(name);
        string0 = this.getAttribute(name);
        string1 = value1 + "";
        return string0 === string1 ? null
            : string0 === string00 && string1 === string10 ? interpolate0
            : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
      };
    }

    function attrFunctionNS(fullname, interpolate, value) {
      var string00,
          string10,
          interpolate0;
      return function() {
        var string0, value1 = value(this), string1;
        if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
        string0 = this.getAttributeNS(fullname.space, fullname.local);
        string1 = value1 + "";
        return string0 === string1 ? null
            : string0 === string00 && string1 === string10 ? interpolate0
            : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
      };
    }

    function transition_attr(name, value) {
      var fullname = namespace(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate;
      return this.attrTween(name, typeof value === "function"
          ? (fullname.local ? attrFunctionNS : attrFunction)(fullname, i, tweenValue(this, "attr." + name, value))
          : value == null ? (fullname.local ? attrRemoveNS : attrRemove)(fullname)
          : (fullname.local ? attrConstantNS : attrConstant)(fullname, i, value));
    }

    function attrInterpolate(name, i) {
      return function(t) {
        this.setAttribute(name, i.call(this, t));
      };
    }

    function attrInterpolateNS(fullname, i) {
      return function(t) {
        this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
      };
    }

    function attrTweenNS(fullname, value) {
      var t0, i0;
      function tween() {
        var i = value.apply(this, arguments);
        if (i !== i0) t0 = (i0 = i) && attrInterpolateNS(fullname, i);
        return t0;
      }
      tween._value = value;
      return tween;
    }

    function attrTween(name, value) {
      var t0, i0;
      function tween() {
        var i = value.apply(this, arguments);
        if (i !== i0) t0 = (i0 = i) && attrInterpolate(name, i);
        return t0;
      }
      tween._value = value;
      return tween;
    }

    function transition_attrTween(name, value) {
      var key = "attr." + name;
      if (arguments.length < 2) return (key = this.tween(key)) && key._value;
      if (value == null) return this.tween(key, null);
      if (typeof value !== "function") throw new Error;
      var fullname = namespace(name);
      return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
    }

    function delayFunction(id, value) {
      return function() {
        init(this, id).delay = +value.apply(this, arguments);
      };
    }

    function delayConstant(id, value) {
      return value = +value, function() {
        init(this, id).delay = value;
      };
    }

    function transition_delay(value) {
      var id = this._id;

      return arguments.length
          ? this.each((typeof value === "function"
              ? delayFunction
              : delayConstant)(id, value))
          : get(this.node(), id).delay;
    }

    function durationFunction(id, value) {
      return function() {
        set(this, id).duration = +value.apply(this, arguments);
      };
    }

    function durationConstant(id, value) {
      return value = +value, function() {
        set(this, id).duration = value;
      };
    }

    function transition_duration(value) {
      var id = this._id;

      return arguments.length
          ? this.each((typeof value === "function"
              ? durationFunction
              : durationConstant)(id, value))
          : get(this.node(), id).duration;
    }

    function easeConstant(id, value) {
      if (typeof value !== "function") throw new Error;
      return function() {
        set(this, id).ease = value;
      };
    }

    function transition_ease(value) {
      var id = this._id;

      return arguments.length
          ? this.each(easeConstant(id, value))
          : get(this.node(), id).ease;
    }

    function easeVarying(id, value) {
      return function() {
        var v = value.apply(this, arguments);
        if (typeof v !== "function") throw new Error;
        set(this, id).ease = v;
      };
    }

    function transition_easeVarying(value) {
      if (typeof value !== "function") throw new Error;
      return this.each(easeVarying(this._id, value));
    }

    function transition_filter(match) {
      if (typeof match !== "function") match = matcher(match);

      for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
          if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
            subgroup.push(node);
          }
        }
      }

      return new Transition(subgroups, this._parents, this._name, this._id);
    }

    function transition_merge(transition) {
      if (transition._id !== this._id) throw new Error;

      for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
        for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
          if (node = group0[i] || group1[i]) {
            merge[i] = node;
          }
        }
      }

      for (; j < m0; ++j) {
        merges[j] = groups0[j];
      }

      return new Transition(merges, this._parents, this._name, this._id);
    }

    function start(name) {
      return (name + "").trim().split(/^|\s+/).every(function(t) {
        var i = t.indexOf(".");
        if (i >= 0) t = t.slice(0, i);
        return !t || t === "start";
      });
    }

    function onFunction(id, name, listener) {
      var on0, on1, sit = start(name) ? init : set;
      return function() {
        var schedule = sit(this, id),
            on = schedule.on;

        // If this node shared a dispatch with the previous node,
        // just assign the updated shared dispatch and we’re done!
        // Otherwise, copy-on-write.
        if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

        schedule.on = on1;
      };
    }

    function transition_on(name, listener) {
      var id = this._id;

      return arguments.length < 2
          ? get(this.node(), id).on.on(name)
          : this.each(onFunction(id, name, listener));
    }

    function removeFunction(id) {
      return function() {
        var parent = this.parentNode;
        for (var i in this.__transition) if (+i !== id) return;
        if (parent) parent.removeChild(this);
      };
    }

    function transition_remove() {
      return this.on("end.remove", removeFunction(this._id));
    }

    function transition_select(select) {
      var name = this._name,
          id = this._id;

      if (typeof select !== "function") select = selector(select);

      for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
          if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
            if ("__data__" in node) subnode.__data__ = node.__data__;
            subgroup[i] = subnode;
            schedule(subgroup[i], name, id, i, subgroup, get(node, id));
          }
        }
      }

      return new Transition(subgroups, this._parents, name, id);
    }

    function transition_selectAll(select) {
      var name = this._name,
          id = this._id;

      if (typeof select !== "function") select = selectorAll(select);

      for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            for (var children = select.call(node, node.__data__, i, group), child, inherit = get(node, id), k = 0, l = children.length; k < l; ++k) {
              if (child = children[k]) {
                schedule(child, name, id, k, children, inherit);
              }
            }
            subgroups.push(children);
            parents.push(node);
          }
        }
      }

      return new Transition(subgroups, parents, name, id);
    }

    var Selection = selection.prototype.constructor;

    function transition_selection() {
      return new Selection(this._groups, this._parents);
    }

    function styleNull(name, interpolate) {
      var string00,
          string10,
          interpolate0;
      return function() {
        var string0 = styleValue(this, name),
            string1 = (this.style.removeProperty(name), styleValue(this, name));
        return string0 === string1 ? null
            : string0 === string00 && string1 === string10 ? interpolate0
            : interpolate0 = interpolate(string00 = string0, string10 = string1);
      };
    }

    function styleRemove(name) {
      return function() {
        this.style.removeProperty(name);
      };
    }

    function styleConstant(name, interpolate, value1) {
      var string00,
          string1 = value1 + "",
          interpolate0;
      return function() {
        var string0 = styleValue(this, name);
        return string0 === string1 ? null
            : string0 === string00 ? interpolate0
            : interpolate0 = interpolate(string00 = string0, value1);
      };
    }

    function styleFunction(name, interpolate, value) {
      var string00,
          string10,
          interpolate0;
      return function() {
        var string0 = styleValue(this, name),
            value1 = value(this),
            string1 = value1 + "";
        if (value1 == null) string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
        return string0 === string1 ? null
            : string0 === string00 && string1 === string10 ? interpolate0
            : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
      };
    }

    function styleMaybeRemove(id, name) {
      var on0, on1, listener0, key = "style." + name, event = "end." + key, remove;
      return function() {
        var schedule = set(this, id),
            on = schedule.on,
            listener = schedule.value[key] == null ? remove || (remove = styleRemove(name)) : undefined;

        // If this node shared a dispatch with the previous node,
        // just assign the updated shared dispatch and we’re done!
        // Otherwise, copy-on-write.
        if (on !== on0 || listener0 !== listener) (on1 = (on0 = on).copy()).on(event, listener0 = listener);

        schedule.on = on1;
      };
    }

    function transition_style(name, value, priority) {
      var i = (name += "") === "transform" ? interpolateTransformCss : interpolate;
      return value == null ? this
          .styleTween(name, styleNull(name, i))
          .on("end.style." + name, styleRemove(name))
        : typeof value === "function" ? this
          .styleTween(name, styleFunction(name, i, tweenValue(this, "style." + name, value)))
          .each(styleMaybeRemove(this._id, name))
        : this
          .styleTween(name, styleConstant(name, i, value), priority)
          .on("end.style." + name, null);
    }

    function styleInterpolate(name, i, priority) {
      return function(t) {
        this.style.setProperty(name, i.call(this, t), priority);
      };
    }

    function styleTween(name, value, priority) {
      var t, i0;
      function tween() {
        var i = value.apply(this, arguments);
        if (i !== i0) t = (i0 = i) && styleInterpolate(name, i, priority);
        return t;
      }
      tween._value = value;
      return tween;
    }

    function transition_styleTween(name, value, priority) {
      var key = "style." + (name += "");
      if (arguments.length < 2) return (key = this.tween(key)) && key._value;
      if (value == null) return this.tween(key, null);
      if (typeof value !== "function") throw new Error;
      return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
    }

    function textConstant(value) {
      return function() {
        this.textContent = value;
      };
    }

    function textFunction(value) {
      return function() {
        var value1 = value(this);
        this.textContent = value1 == null ? "" : value1;
      };
    }

    function transition_text(value) {
      return this.tween("text", typeof value === "function"
          ? textFunction(tweenValue(this, "text", value))
          : textConstant(value == null ? "" : value + ""));
    }

    function textInterpolate(i) {
      return function(t) {
        this.textContent = i.call(this, t);
      };
    }

    function textTween(value) {
      var t0, i0;
      function tween() {
        var i = value.apply(this, arguments);
        if (i !== i0) t0 = (i0 = i) && textInterpolate(i);
        return t0;
      }
      tween._value = value;
      return tween;
    }

    function transition_textTween(value) {
      var key = "text";
      if (arguments.length < 1) return (key = this.tween(key)) && key._value;
      if (value == null) return this.tween(key, null);
      if (typeof value !== "function") throw new Error;
      return this.tween(key, textTween(value));
    }

    function transition_transition() {
      var name = this._name,
          id0 = this._id,
          id1 = newId();

      for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            var inherit = get(node, id0);
            schedule(node, name, id1, i, group, {
              time: inherit.time + inherit.delay + inherit.duration,
              delay: 0,
              duration: inherit.duration,
              ease: inherit.ease
            });
          }
        }
      }

      return new Transition(groups, this._parents, name, id1);
    }

    function transition_end() {
      var on0, on1, that = this, id = that._id, size = that.size();
      return new Promise(function(resolve, reject) {
        var cancel = {value: reject},
            end = {value: function() { if (--size === 0) resolve(); }};

        that.each(function() {
          var schedule = set(this, id),
              on = schedule.on;

          // If this node shared a dispatch with the previous node,
          // just assign the updated shared dispatch and we’re done!
          // Otherwise, copy-on-write.
          if (on !== on0) {
            on1 = (on0 = on).copy();
            on1._.cancel.push(cancel);
            on1._.interrupt.push(cancel);
            on1._.end.push(end);
          }

          schedule.on = on1;
        });

        // The selection was empty, resolve end immediately
        if (size === 0) resolve();
      });
    }

    var id = 0;

    function Transition(groups, parents, name, id) {
      this._groups = groups;
      this._parents = parents;
      this._name = name;
      this._id = id;
    }

    function newId() {
      return ++id;
    }

    var selection_prototype = selection.prototype;

    Transition.prototype = {
      constructor: Transition,
      select: transition_select,
      selectAll: transition_selectAll,
      selectChild: selection_prototype.selectChild,
      selectChildren: selection_prototype.selectChildren,
      filter: transition_filter,
      merge: transition_merge,
      selection: transition_selection,
      transition: transition_transition,
      call: selection_prototype.call,
      nodes: selection_prototype.nodes,
      node: selection_prototype.node,
      size: selection_prototype.size,
      empty: selection_prototype.empty,
      each: selection_prototype.each,
      on: transition_on,
      attr: transition_attr,
      attrTween: transition_attrTween,
      style: transition_style,
      styleTween: transition_styleTween,
      text: transition_text,
      textTween: transition_textTween,
      remove: transition_remove,
      tween: transition_tween,
      delay: transition_delay,
      duration: transition_duration,
      ease: transition_ease,
      easeVarying: transition_easeVarying,
      end: transition_end,
      [Symbol.iterator]: selection_prototype[Symbol.iterator]
    };

    function cubicInOut(t) {
      return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
    }

    var defaultTiming = {
      time: null, // Set on use.
      delay: 0,
      duration: 250,
      ease: cubicInOut
    };

    function inherit(node, id) {
      var timing;
      while (!(timing = node.__transition) || !(timing = timing[id])) {
        if (!(node = node.parentNode)) {
          throw new Error(`transition ${id} not found`);
        }
      }
      return timing;
    }

    function selection_transition(name) {
      var id,
          timing;

      if (name instanceof Transition) {
        id = name._id, name = name._name;
      } else {
        id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
      }

      for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            schedule(node, name, id, i, group, timing || inherit(node, id));
          }
        }
      }

      return new Transition(groups, this._parents, name, id);
    }

    selection.prototype.interrupt = selection_interrupt;
    selection.prototype.transition = selection_transition;

    var constant$1 = x => () => x;

    function ZoomEvent(type, {
      sourceEvent,
      target,
      transform,
      dispatch
    }) {
      Object.defineProperties(this, {
        type: {value: type, enumerable: true, configurable: true},
        sourceEvent: {value: sourceEvent, enumerable: true, configurable: true},
        target: {value: target, enumerable: true, configurable: true},
        transform: {value: transform, enumerable: true, configurable: true},
        _: {value: dispatch}
      });
    }

    function Transform(k, x, y) {
      this.k = k;
      this.x = x;
      this.y = y;
    }

    Transform.prototype = {
      constructor: Transform,
      scale: function(k) {
        return k === 1 ? this : new Transform(this.k * k, this.x, this.y);
      },
      translate: function(x, y) {
        return x === 0 & y === 0 ? this : new Transform(this.k, this.x + this.k * x, this.y + this.k * y);
      },
      apply: function(point) {
        return [point[0] * this.k + this.x, point[1] * this.k + this.y];
      },
      applyX: function(x) {
        return x * this.k + this.x;
      },
      applyY: function(y) {
        return y * this.k + this.y;
      },
      invert: function(location) {
        return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
      },
      invertX: function(x) {
        return (x - this.x) / this.k;
      },
      invertY: function(y) {
        return (y - this.y) / this.k;
      },
      rescaleX: function(x) {
        return x.copy().domain(x.range().map(this.invertX, this).map(x.invert, x));
      },
      rescaleY: function(y) {
        return y.copy().domain(y.range().map(this.invertY, this).map(y.invert, y));
      },
      toString: function() {
        return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
      }
    };

    var identity = new Transform(1, 0, 0);

    Transform.prototype;

    function nopropagation(event) {
      event.stopImmediatePropagation();
    }

    function noevent(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    // Ignore right-click, since that should open the context menu.
    // except for pinch-to-zoom, which is sent as a wheel+ctrlKey event
    function defaultFilter(event) {
      return (!event.ctrlKey || event.type === 'wheel') && !event.button;
    }

    function defaultExtent() {
      var e = this;
      if (e instanceof SVGElement) {
        e = e.ownerSVGElement || e;
        if (e.hasAttribute("viewBox")) {
          e = e.viewBox.baseVal;
          return [[e.x, e.y], [e.x + e.width, e.y + e.height]];
        }
        return [[0, 0], [e.width.baseVal.value, e.height.baseVal.value]];
      }
      return [[0, 0], [e.clientWidth, e.clientHeight]];
    }

    function defaultTransform() {
      return this.__zoom || identity;
    }

    function defaultWheelDelta(event) {
      return -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002) * (event.ctrlKey ? 10 : 1);
    }

    function defaultTouchable() {
      return navigator.maxTouchPoints || ("ontouchstart" in this);
    }

    function defaultConstrain(transform, extent, translateExtent) {
      var dx0 = transform.invertX(extent[0][0]) - translateExtent[0][0],
          dx1 = transform.invertX(extent[1][0]) - translateExtent[1][0],
          dy0 = transform.invertY(extent[0][1]) - translateExtent[0][1],
          dy1 = transform.invertY(extent[1][1]) - translateExtent[1][1];
      return transform.translate(
        dx1 > dx0 ? (dx0 + dx1) / 2 : Math.min(0, dx0) || Math.max(0, dx1),
        dy1 > dy0 ? (dy0 + dy1) / 2 : Math.min(0, dy0) || Math.max(0, dy1)
      );
    }

    function zoom() {
      var filter = defaultFilter,
          extent = defaultExtent,
          constrain = defaultConstrain,
          wheelDelta = defaultWheelDelta,
          touchable = defaultTouchable,
          scaleExtent = [0, Infinity],
          translateExtent = [[-Infinity, -Infinity], [Infinity, Infinity]],
          duration = 250,
          interpolate = interpolateZoom,
          listeners = dispatch("start", "zoom", "end"),
          touchstarting,
          touchfirst,
          touchending,
          touchDelay = 500,
          wheelDelay = 150,
          clickDistance2 = 0,
          tapDistance = 10;

      function zoom(selection) {
        selection
            .property("__zoom", defaultTransform)
            .on("wheel.zoom", wheeled, {passive: false})
            .on("mousedown.zoom", mousedowned)
            .on("dblclick.zoom", dblclicked)
          .filter(touchable)
            .on("touchstart.zoom", touchstarted)
            .on("touchmove.zoom", touchmoved)
            .on("touchend.zoom touchcancel.zoom", touchended)
            .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
      }

      zoom.transform = function(collection, transform, point, event) {
        var selection = collection.selection ? collection.selection() : collection;
        selection.property("__zoom", defaultTransform);
        if (collection !== selection) {
          schedule(collection, transform, point, event);
        } else {
          selection.interrupt().each(function() {
            gesture(this, arguments)
              .event(event)
              .start()
              .zoom(null, typeof transform === "function" ? transform.apply(this, arguments) : transform)
              .end();
          });
        }
      };

      zoom.scaleBy = function(selection, k, p, event) {
        zoom.scaleTo(selection, function() {
          var k0 = this.__zoom.k,
              k1 = typeof k === "function" ? k.apply(this, arguments) : k;
          return k0 * k1;
        }, p, event);
      };

      zoom.scaleTo = function(selection, k, p, event) {
        zoom.transform(selection, function() {
          var e = extent.apply(this, arguments),
              t0 = this.__zoom,
              p0 = p == null ? centroid(e) : typeof p === "function" ? p.apply(this, arguments) : p,
              p1 = t0.invert(p0),
              k1 = typeof k === "function" ? k.apply(this, arguments) : k;
          return constrain(translate(scale(t0, k1), p0, p1), e, translateExtent);
        }, p, event);
      };

      zoom.translateBy = function(selection, x, y, event) {
        zoom.transform(selection, function() {
          return constrain(this.__zoom.translate(
            typeof x === "function" ? x.apply(this, arguments) : x,
            typeof y === "function" ? y.apply(this, arguments) : y
          ), extent.apply(this, arguments), translateExtent);
        }, null, event);
      };

      zoom.translateTo = function(selection, x, y, p, event) {
        zoom.transform(selection, function() {
          var e = extent.apply(this, arguments),
              t = this.__zoom,
              p0 = p == null ? centroid(e) : typeof p === "function" ? p.apply(this, arguments) : p;
          return constrain(identity.translate(p0[0], p0[1]).scale(t.k).translate(
            typeof x === "function" ? -x.apply(this, arguments) : -x,
            typeof y === "function" ? -y.apply(this, arguments) : -y
          ), e, translateExtent);
        }, p, event);
      };

      function scale(transform, k) {
        k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], k));
        return k === transform.k ? transform : new Transform(k, transform.x, transform.y);
      }

      function translate(transform, p0, p1) {
        var x = p0[0] - p1[0] * transform.k, y = p0[1] - p1[1] * transform.k;
        return x === transform.x && y === transform.y ? transform : new Transform(transform.k, x, y);
      }

      function centroid(extent) {
        return [(+extent[0][0] + +extent[1][0]) / 2, (+extent[0][1] + +extent[1][1]) / 2];
      }

      function schedule(transition, transform, point, event) {
        transition
            .on("start.zoom", function() { gesture(this, arguments).event(event).start(); })
            .on("interrupt.zoom end.zoom", function() { gesture(this, arguments).event(event).end(); })
            .tween("zoom", function() {
              var that = this,
                  args = arguments,
                  g = gesture(that, args).event(event),
                  e = extent.apply(that, args),
                  p = point == null ? centroid(e) : typeof point === "function" ? point.apply(that, args) : point,
                  w = Math.max(e[1][0] - e[0][0], e[1][1] - e[0][1]),
                  a = that.__zoom,
                  b = typeof transform === "function" ? transform.apply(that, args) : transform,
                  i = interpolate(a.invert(p).concat(w / a.k), b.invert(p).concat(w / b.k));
              return function(t) {
                if (t === 1) t = b; // Avoid rounding error on end.
                else { var l = i(t), k = w / l[2]; t = new Transform(k, p[0] - l[0] * k, p[1] - l[1] * k); }
                g.zoom(null, t);
              };
            });
      }

      function gesture(that, args, clean) {
        return (!clean && that.__zooming) || new Gesture(that, args);
      }

      function Gesture(that, args) {
        this.that = that;
        this.args = args;
        this.active = 0;
        this.sourceEvent = null;
        this.extent = extent.apply(that, args);
        this.taps = 0;
      }

      Gesture.prototype = {
        event: function(event) {
          if (event) this.sourceEvent = event;
          return this;
        },
        start: function() {
          if (++this.active === 1) {
            this.that.__zooming = this;
            this.emit("start");
          }
          return this;
        },
        zoom: function(key, transform) {
          if (this.mouse && key !== "mouse") this.mouse[1] = transform.invert(this.mouse[0]);
          if (this.touch0 && key !== "touch") this.touch0[1] = transform.invert(this.touch0[0]);
          if (this.touch1 && key !== "touch") this.touch1[1] = transform.invert(this.touch1[0]);
          this.that.__zoom = transform;
          this.emit("zoom");
          return this;
        },
        end: function() {
          if (--this.active === 0) {
            delete this.that.__zooming;
            this.emit("end");
          }
          return this;
        },
        emit: function(type) {
          var d = select(this.that).datum();
          listeners.call(
            type,
            this.that,
            new ZoomEvent(type, {
              sourceEvent: this.sourceEvent,
              target: zoom,
              type,
              transform: this.that.__zoom,
              dispatch: listeners
            }),
            d
          );
        }
      };

      function wheeled(event, ...args) {
        if (!filter.apply(this, arguments)) return;
        var g = gesture(this, args).event(event),
            t = this.__zoom,
            k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], t.k * Math.pow(2, wheelDelta.apply(this, arguments)))),
            p = pointer(event);

        // If the mouse is in the same location as before, reuse it.
        // If there were recent wheel events, reset the wheel idle timeout.
        if (g.wheel) {
          if (g.mouse[0][0] !== p[0] || g.mouse[0][1] !== p[1]) {
            g.mouse[1] = t.invert(g.mouse[0] = p);
          }
          clearTimeout(g.wheel);
        }

        // If this wheel event won’t trigger a transform change, ignore it.
        else if (t.k === k) return;

        // Otherwise, capture the mouse point and location at the start.
        else {
          g.mouse = [p, t.invert(p)];
          interrupt(this);
          g.start();
        }

        noevent(event);
        g.wheel = setTimeout(wheelidled, wheelDelay);
        g.zoom("mouse", constrain(translate(scale(t, k), g.mouse[0], g.mouse[1]), g.extent, translateExtent));

        function wheelidled() {
          g.wheel = null;
          g.end();
        }
      }

      function mousedowned(event, ...args) {
        if (touchending || !filter.apply(this, arguments)) return;
        var currentTarget = event.currentTarget,
            g = gesture(this, args, true).event(event),
            v = select(event.view).on("mousemove.zoom", mousemoved, true).on("mouseup.zoom", mouseupped, true),
            p = pointer(event, currentTarget),
            x0 = event.clientX,
            y0 = event.clientY;

        dragDisable(event.view);
        nopropagation(event);
        g.mouse = [p, this.__zoom.invert(p)];
        interrupt(this);
        g.start();

        function mousemoved(event) {
          noevent(event);
          if (!g.moved) {
            var dx = event.clientX - x0, dy = event.clientY - y0;
            g.moved = dx * dx + dy * dy > clickDistance2;
          }
          g.event(event)
           .zoom("mouse", constrain(translate(g.that.__zoom, g.mouse[0] = pointer(event, currentTarget), g.mouse[1]), g.extent, translateExtent));
        }

        function mouseupped(event) {
          v.on("mousemove.zoom mouseup.zoom", null);
          yesdrag(event.view, g.moved);
          noevent(event);
          g.event(event).end();
        }
      }

      function dblclicked(event, ...args) {
        if (!filter.apply(this, arguments)) return;
        var t0 = this.__zoom,
            p0 = pointer(event.changedTouches ? event.changedTouches[0] : event, this),
            p1 = t0.invert(p0),
            k1 = t0.k * (event.shiftKey ? 0.5 : 2),
            t1 = constrain(translate(scale(t0, k1), p0, p1), extent.apply(this, args), translateExtent);

        noevent(event);
        if (duration > 0) select(this).transition().duration(duration).call(schedule, t1, p0, event);
        else select(this).call(zoom.transform, t1, p0, event);
      }

      function touchstarted(event, ...args) {
        if (!filter.apply(this, arguments)) return;
        var touches = event.touches,
            n = touches.length,
            g = gesture(this, args, event.changedTouches.length === n).event(event),
            started, i, t, p;

        nopropagation(event);
        for (i = 0; i < n; ++i) {
          t = touches[i], p = pointer(t, this);
          p = [p, this.__zoom.invert(p), t.identifier];
          if (!g.touch0) g.touch0 = p, started = true, g.taps = 1 + !!touchstarting;
          else if (!g.touch1 && g.touch0[2] !== p[2]) g.touch1 = p, g.taps = 0;
        }

        if (touchstarting) touchstarting = clearTimeout(touchstarting);

        if (started) {
          if (g.taps < 2) touchfirst = p[0], touchstarting = setTimeout(function() { touchstarting = null; }, touchDelay);
          interrupt(this);
          g.start();
        }
      }

      function touchmoved(event, ...args) {
        if (!this.__zooming) return;
        var g = gesture(this, args).event(event),
            touches = event.changedTouches,
            n = touches.length, i, t, p, l;

        noevent(event);
        for (i = 0; i < n; ++i) {
          t = touches[i], p = pointer(t, this);
          if (g.touch0 && g.touch0[2] === t.identifier) g.touch0[0] = p;
          else if (g.touch1 && g.touch1[2] === t.identifier) g.touch1[0] = p;
        }
        t = g.that.__zoom;
        if (g.touch1) {
          var p0 = g.touch0[0], l0 = g.touch0[1],
              p1 = g.touch1[0], l1 = g.touch1[1],
              dp = (dp = p1[0] - p0[0]) * dp + (dp = p1[1] - p0[1]) * dp,
              dl = (dl = l1[0] - l0[0]) * dl + (dl = l1[1] - l0[1]) * dl;
          t = scale(t, Math.sqrt(dp / dl));
          p = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
          l = [(l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2];
        }
        else if (g.touch0) p = g.touch0[0], l = g.touch0[1];
        else return;

        g.zoom("touch", constrain(translate(t, p, l), g.extent, translateExtent));
      }

      function touchended(event, ...args) {
        if (!this.__zooming) return;
        var g = gesture(this, args).event(event),
            touches = event.changedTouches,
            n = touches.length, i, t;

        nopropagation(event);
        if (touchending) clearTimeout(touchending);
        touchending = setTimeout(function() { touchending = null; }, touchDelay);
        for (i = 0; i < n; ++i) {
          t = touches[i];
          if (g.touch0 && g.touch0[2] === t.identifier) delete g.touch0;
          else if (g.touch1 && g.touch1[2] === t.identifier) delete g.touch1;
        }
        if (g.touch1 && !g.touch0) g.touch0 = g.touch1, delete g.touch1;
        if (g.touch0) g.touch0[1] = this.__zoom.invert(g.touch0[0]);
        else {
          g.end();
          // If this was a dbltap, reroute to the (optional) dblclick.zoom handler.
          if (g.taps === 2) {
            t = pointer(t, this);
            if (Math.hypot(touchfirst[0] - t[0], touchfirst[1] - t[1]) < tapDistance) {
              var p = select(this).on("dblclick.zoom");
              if (p) p.apply(this, arguments);
            }
          }
        }
      }

      zoom.wheelDelta = function(_) {
        return arguments.length ? (wheelDelta = typeof _ === "function" ? _ : constant$1(+_), zoom) : wheelDelta;
      };

      zoom.filter = function(_) {
        return arguments.length ? (filter = typeof _ === "function" ? _ : constant$1(!!_), zoom) : filter;
      };

      zoom.touchable = function(_) {
        return arguments.length ? (touchable = typeof _ === "function" ? _ : constant$1(!!_), zoom) : touchable;
      };

      zoom.extent = function(_) {
        return arguments.length ? (extent = typeof _ === "function" ? _ : constant$1([[+_[0][0], +_[0][1]], [+_[1][0], +_[1][1]]]), zoom) : extent;
      };

      zoom.scaleExtent = function(_) {
        return arguments.length ? (scaleExtent[0] = +_[0], scaleExtent[1] = +_[1], zoom) : [scaleExtent[0], scaleExtent[1]];
      };

      zoom.translateExtent = function(_) {
        return arguments.length ? (translateExtent[0][0] = +_[0][0], translateExtent[1][0] = +_[1][0], translateExtent[0][1] = +_[0][1], translateExtent[1][1] = +_[1][1], zoom) : [[translateExtent[0][0], translateExtent[0][1]], [translateExtent[1][0], translateExtent[1][1]]];
      };

      zoom.constrain = function(_) {
        return arguments.length ? (constrain = _, zoom) : constrain;
      };

      zoom.duration = function(_) {
        return arguments.length ? (duration = +_, zoom) : duration;
      };

      zoom.interpolate = function(_) {
        return arguments.length ? (interpolate = _, zoom) : interpolate;
      };

      zoom.on = function() {
        var value = listeners.on.apply(listeners, arguments);
        return value === listeners ? zoom : value;
      };

      zoom.clickDistance = function(_) {
        return arguments.length ? (clickDistance2 = (_ = +_) * _, zoom) : Math.sqrt(clickDistance2);
      };

      zoom.tapDistance = function(_) {
        return arguments.length ? (tapDistance = +_, zoom) : tapDistance;
      };

      return zoom;
    }

    function colors(specifier) {
      var n = specifier.length / 6 | 0, colors = new Array(n), i = 0;
      while (i < n) colors[i] = "#" + specifier.slice(i * 6, ++i * 6);
      return colors;
    }

    var schemeCategory10 = colors("1f77b4ff7f0e2ca02cd627289467bd8c564be377c27f7f7fbcbd2217becf");

    function forceCenter(x, y) {
      var nodes, strength = 1;

      if (x == null) x = 0;
      if (y == null) y = 0;

      function force() {
        var i,
            n = nodes.length,
            node,
            sx = 0,
            sy = 0;

        for (i = 0; i < n; ++i) {
          node = nodes[i], sx += node.x, sy += node.y;
        }

        for (sx = (sx / n - x) * strength, sy = (sy / n - y) * strength, i = 0; i < n; ++i) {
          node = nodes[i], node.x -= sx, node.y -= sy;
        }
      }

      force.initialize = function(_) {
        nodes = _;
      };

      force.x = function(_) {
        return arguments.length ? (x = +_, force) : x;
      };

      force.y = function(_) {
        return arguments.length ? (y = +_, force) : y;
      };

      force.strength = function(_) {
        return arguments.length ? (strength = +_, force) : strength;
      };

      return force;
    }

    function tree_add(d) {
      const x = +this._x.call(null, d),
          y = +this._y.call(null, d);
      return add(this.cover(x, y), x, y, d);
    }

    function add(tree, x, y, d) {
      if (isNaN(x) || isNaN(y)) return tree; // ignore invalid points

      var parent,
          node = tree._root,
          leaf = {data: d},
          x0 = tree._x0,
          y0 = tree._y0,
          x1 = tree._x1,
          y1 = tree._y1,
          xm,
          ym,
          xp,
          yp,
          right,
          bottom,
          i,
          j;

      // If the tree is empty, initialize the root as a leaf.
      if (!node) return tree._root = leaf, tree;

      // Find the existing leaf for the new point, or add it.
      while (node.length) {
        if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
        if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
        if (parent = node, !(node = node[i = bottom << 1 | right])) return parent[i] = leaf, tree;
      }

      // Is the new point is exactly coincident with the existing point?
      xp = +tree._x.call(null, node.data);
      yp = +tree._y.call(null, node.data);
      if (x === xp && y === yp) return leaf.next = node, parent ? parent[i] = leaf : tree._root = leaf, tree;

      // Otherwise, split the leaf node until the old and new point are separated.
      do {
        parent = parent ? parent[i] = new Array(4) : tree._root = new Array(4);
        if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
        if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
      } while ((i = bottom << 1 | right) === (j = (yp >= ym) << 1 | (xp >= xm)));
      return parent[j] = node, parent[i] = leaf, tree;
    }

    function addAll(data) {
      var d, i, n = data.length,
          x,
          y,
          xz = new Array(n),
          yz = new Array(n),
          x0 = Infinity,
          y0 = Infinity,
          x1 = -Infinity,
          y1 = -Infinity;

      // Compute the points and their extent.
      for (i = 0; i < n; ++i) {
        if (isNaN(x = +this._x.call(null, d = data[i])) || isNaN(y = +this._y.call(null, d))) continue;
        xz[i] = x;
        yz[i] = y;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }

      // If there were no (valid) points, abort.
      if (x0 > x1 || y0 > y1) return this;

      // Expand the tree to cover the new points.
      this.cover(x0, y0).cover(x1, y1);

      // Add the new points.
      for (i = 0; i < n; ++i) {
        add(this, xz[i], yz[i], data[i]);
      }

      return this;
    }

    function tree_cover(x, y) {
      if (isNaN(x = +x) || isNaN(y = +y)) return this; // ignore invalid points

      var x0 = this._x0,
          y0 = this._y0,
          x1 = this._x1,
          y1 = this._y1;

      // If the quadtree has no extent, initialize them.
      // Integer extent are necessary so that if we later double the extent,
      // the existing quadrant boundaries don’t change due to floating point error!
      if (isNaN(x0)) {
        x1 = (x0 = Math.floor(x)) + 1;
        y1 = (y0 = Math.floor(y)) + 1;
      }

      // Otherwise, double repeatedly to cover.
      else {
        var z = x1 - x0 || 1,
            node = this._root,
            parent,
            i;

        while (x0 > x || x >= x1 || y0 > y || y >= y1) {
          i = (y < y0) << 1 | (x < x0);
          parent = new Array(4), parent[i] = node, node = parent, z *= 2;
          switch (i) {
            case 0: x1 = x0 + z, y1 = y0 + z; break;
            case 1: x0 = x1 - z, y1 = y0 + z; break;
            case 2: x1 = x0 + z, y0 = y1 - z; break;
            case 3: x0 = x1 - z, y0 = y1 - z; break;
          }
        }

        if (this._root && this._root.length) this._root = node;
      }

      this._x0 = x0;
      this._y0 = y0;
      this._x1 = x1;
      this._y1 = y1;
      return this;
    }

    function tree_data() {
      var data = [];
      this.visit(function(node) {
        if (!node.length) do data.push(node.data); while (node = node.next)
      });
      return data;
    }

    function tree_extent(_) {
      return arguments.length
          ? this.cover(+_[0][0], +_[0][1]).cover(+_[1][0], +_[1][1])
          : isNaN(this._x0) ? undefined : [[this._x0, this._y0], [this._x1, this._y1]];
    }

    function Quad(node, x0, y0, x1, y1) {
      this.node = node;
      this.x0 = x0;
      this.y0 = y0;
      this.x1 = x1;
      this.y1 = y1;
    }

    function tree_find(x, y, radius) {
      var data,
          x0 = this._x0,
          y0 = this._y0,
          x1,
          y1,
          x2,
          y2,
          x3 = this._x1,
          y3 = this._y1,
          quads = [],
          node = this._root,
          q,
          i;

      if (node) quads.push(new Quad(node, x0, y0, x3, y3));
      if (radius == null) radius = Infinity;
      else {
        x0 = x - radius, y0 = y - radius;
        x3 = x + radius, y3 = y + radius;
        radius *= radius;
      }

      while (q = quads.pop()) {

        // Stop searching if this quadrant can’t contain a closer node.
        if (!(node = q.node)
            || (x1 = q.x0) > x3
            || (y1 = q.y0) > y3
            || (x2 = q.x1) < x0
            || (y2 = q.y1) < y0) continue;

        // Bisect the current quadrant.
        if (node.length) {
          var xm = (x1 + x2) / 2,
              ym = (y1 + y2) / 2;

          quads.push(
            new Quad(node[3], xm, ym, x2, y2),
            new Quad(node[2], x1, ym, xm, y2),
            new Quad(node[1], xm, y1, x2, ym),
            new Quad(node[0], x1, y1, xm, ym)
          );

          // Visit the closest quadrant first.
          if (i = (y >= ym) << 1 | (x >= xm)) {
            q = quads[quads.length - 1];
            quads[quads.length - 1] = quads[quads.length - 1 - i];
            quads[quads.length - 1 - i] = q;
          }
        }

        // Visit this point. (Visiting coincident points isn’t necessary!)
        else {
          var dx = x - +this._x.call(null, node.data),
              dy = y - +this._y.call(null, node.data),
              d2 = dx * dx + dy * dy;
          if (d2 < radius) {
            var d = Math.sqrt(radius = d2);
            x0 = x - d, y0 = y - d;
            x3 = x + d, y3 = y + d;
            data = node.data;
          }
        }
      }

      return data;
    }

    function tree_remove(d) {
      if (isNaN(x = +this._x.call(null, d)) || isNaN(y = +this._y.call(null, d))) return this; // ignore invalid points

      var parent,
          node = this._root,
          retainer,
          previous,
          next,
          x0 = this._x0,
          y0 = this._y0,
          x1 = this._x1,
          y1 = this._y1,
          x,
          y,
          xm,
          ym,
          right,
          bottom,
          i,
          j;

      // If the tree is empty, initialize the root as a leaf.
      if (!node) return this;

      // Find the leaf node for the point.
      // While descending, also retain the deepest parent with a non-removed sibling.
      if (node.length) while (true) {
        if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
        if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
        if (!(parent = node, node = node[i = bottom << 1 | right])) return this;
        if (!node.length) break;
        if (parent[(i + 1) & 3] || parent[(i + 2) & 3] || parent[(i + 3) & 3]) retainer = parent, j = i;
      }

      // Find the point to remove.
      while (node.data !== d) if (!(previous = node, node = node.next)) return this;
      if (next = node.next) delete node.next;

      // If there are multiple coincident points, remove just the point.
      if (previous) return (next ? previous.next = next : delete previous.next), this;

      // If this is the root point, remove it.
      if (!parent) return this._root = next, this;

      // Remove this leaf.
      next ? parent[i] = next : delete parent[i];

      // If the parent now contains exactly one leaf, collapse superfluous parents.
      if ((node = parent[0] || parent[1] || parent[2] || parent[3])
          && node === (parent[3] || parent[2] || parent[1] || parent[0])
          && !node.length) {
        if (retainer) retainer[j] = node;
        else this._root = node;
      }

      return this;
    }

    function removeAll(data) {
      for (var i = 0, n = data.length; i < n; ++i) this.remove(data[i]);
      return this;
    }

    function tree_root() {
      return this._root;
    }

    function tree_size() {
      var size = 0;
      this.visit(function(node) {
        if (!node.length) do ++size; while (node = node.next)
      });
      return size;
    }

    function tree_visit(callback) {
      var quads = [], q, node = this._root, child, x0, y0, x1, y1;
      if (node) quads.push(new Quad(node, this._x0, this._y0, this._x1, this._y1));
      while (q = quads.pop()) {
        if (!callback(node = q.node, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1) && node.length) {
          var xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
          if (child = node[3]) quads.push(new Quad(child, xm, ym, x1, y1));
          if (child = node[2]) quads.push(new Quad(child, x0, ym, xm, y1));
          if (child = node[1]) quads.push(new Quad(child, xm, y0, x1, ym));
          if (child = node[0]) quads.push(new Quad(child, x0, y0, xm, ym));
        }
      }
      return this;
    }

    function tree_visitAfter(callback) {
      var quads = [], next = [], q;
      if (this._root) quads.push(new Quad(this._root, this._x0, this._y0, this._x1, this._y1));
      while (q = quads.pop()) {
        var node = q.node;
        if (node.length) {
          var child, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1, xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
          if (child = node[0]) quads.push(new Quad(child, x0, y0, xm, ym));
          if (child = node[1]) quads.push(new Quad(child, xm, y0, x1, ym));
          if (child = node[2]) quads.push(new Quad(child, x0, ym, xm, y1));
          if (child = node[3]) quads.push(new Quad(child, xm, ym, x1, y1));
        }
        next.push(q);
      }
      while (q = next.pop()) {
        callback(q.node, q.x0, q.y0, q.x1, q.y1);
      }
      return this;
    }

    function defaultX(d) {
      return d[0];
    }

    function tree_x(_) {
      return arguments.length ? (this._x = _, this) : this._x;
    }

    function defaultY(d) {
      return d[1];
    }

    function tree_y(_) {
      return arguments.length ? (this._y = _, this) : this._y;
    }

    function quadtree(nodes, x, y) {
      var tree = new Quadtree(x == null ? defaultX : x, y == null ? defaultY : y, NaN, NaN, NaN, NaN);
      return nodes == null ? tree : tree.addAll(nodes);
    }

    function Quadtree(x, y, x0, y0, x1, y1) {
      this._x = x;
      this._y = y;
      this._x0 = x0;
      this._y0 = y0;
      this._x1 = x1;
      this._y1 = y1;
      this._root = undefined;
    }

    function leaf_copy(leaf) {
      var copy = {data: leaf.data}, next = copy;
      while (leaf = leaf.next) next = next.next = {data: leaf.data};
      return copy;
    }

    var treeProto = quadtree.prototype = Quadtree.prototype;

    treeProto.copy = function() {
      var copy = new Quadtree(this._x, this._y, this._x0, this._y0, this._x1, this._y1),
          node = this._root,
          nodes,
          child;

      if (!node) return copy;

      if (!node.length) return copy._root = leaf_copy(node), copy;

      nodes = [{source: node, target: copy._root = new Array(4)}];
      while (node = nodes.pop()) {
        for (var i = 0; i < 4; ++i) {
          if (child = node.source[i]) {
            if (child.length) nodes.push({source: child, target: node.target[i] = new Array(4)});
            else node.target[i] = leaf_copy(child);
          }
        }
      }

      return copy;
    };

    treeProto.add = tree_add;
    treeProto.addAll = addAll;
    treeProto.cover = tree_cover;
    treeProto.data = tree_data;
    treeProto.extent = tree_extent;
    treeProto.find = tree_find;
    treeProto.remove = tree_remove;
    treeProto.removeAll = removeAll;
    treeProto.root = tree_root;
    treeProto.size = tree_size;
    treeProto.visit = tree_visit;
    treeProto.visitAfter = tree_visitAfter;
    treeProto.x = tree_x;
    treeProto.y = tree_y;

    function constant(x) {
      return function() {
        return x;
      };
    }

    function jiggle(random) {
      return (random() - 0.5) * 1e-6;
    }

    function x$1(d) {
      return d.x + d.vx;
    }

    function y$1(d) {
      return d.y + d.vy;
    }

    function forceCollide(radius) {
      var nodes,
          radii,
          random,
          strength = 1,
          iterations = 1;

      if (typeof radius !== "function") radius = constant(radius == null ? 1 : +radius);

      function force() {
        var i, n = nodes.length,
            tree,
            node,
            xi,
            yi,
            ri,
            ri2;

        for (var k = 0; k < iterations; ++k) {
          tree = quadtree(nodes, x$1, y$1).visitAfter(prepare);
          for (i = 0; i < n; ++i) {
            node = nodes[i];
            ri = radii[node.index], ri2 = ri * ri;
            xi = node.x + node.vx;
            yi = node.y + node.vy;
            tree.visit(apply);
          }
        }

        function apply(quad, x0, y0, x1, y1) {
          var data = quad.data, rj = quad.r, r = ri + rj;
          if (data) {
            if (data.index > node.index) {
              var x = xi - data.x - data.vx,
                  y = yi - data.y - data.vy,
                  l = x * x + y * y;
              if (l < r * r) {
                if (x === 0) x = jiggle(random), l += x * x;
                if (y === 0) y = jiggle(random), l += y * y;
                l = (r - (l = Math.sqrt(l))) / l * strength;
                node.vx += (x *= l) * (r = (rj *= rj) / (ri2 + rj));
                node.vy += (y *= l) * r;
                data.vx -= x * (r = 1 - r);
                data.vy -= y * r;
              }
            }
            return;
          }
          return x0 > xi + r || x1 < xi - r || y0 > yi + r || y1 < yi - r;
        }
      }

      function prepare(quad) {
        if (quad.data) return quad.r = radii[quad.data.index];
        for (var i = quad.r = 0; i < 4; ++i) {
          if (quad[i] && quad[i].r > quad.r) {
            quad.r = quad[i].r;
          }
        }
      }

      function initialize() {
        if (!nodes) return;
        var i, n = nodes.length, node;
        radii = new Array(n);
        for (i = 0; i < n; ++i) node = nodes[i], radii[node.index] = +radius(node, i, nodes);
      }

      force.initialize = function(_nodes, _random) {
        nodes = _nodes;
        random = _random;
        initialize();
      };

      force.iterations = function(_) {
        return arguments.length ? (iterations = +_, force) : iterations;
      };

      force.strength = function(_) {
        return arguments.length ? (strength = +_, force) : strength;
      };

      force.radius = function(_) {
        return arguments.length ? (radius = typeof _ === "function" ? _ : constant(+_), initialize(), force) : radius;
      };

      return force;
    }

    function index(d) {
      return d.index;
    }

    function find(nodeById, nodeId) {
      var node = nodeById.get(nodeId);
      if (!node) throw new Error("node not found: " + nodeId);
      return node;
    }

    function forceLink(links) {
      var id = index,
          strength = defaultStrength,
          strengths,
          distance = constant(30),
          distances,
          nodes,
          count,
          bias,
          random,
          iterations = 1;

      if (links == null) links = [];

      function defaultStrength(link) {
        return 1 / Math.min(count[link.source.index], count[link.target.index]);
      }

      function force(alpha) {
        for (var k = 0, n = links.length; k < iterations; ++k) {
          for (var i = 0, link, source, target, x, y, l, b; i < n; ++i) {
            link = links[i], source = link.source, target = link.target;
            x = target.x + target.vx - source.x - source.vx || jiggle(random);
            y = target.y + target.vy - source.y - source.vy || jiggle(random);
            l = Math.sqrt(x * x + y * y);
            l = (l - distances[i]) / l * alpha * strengths[i];
            x *= l, y *= l;
            target.vx -= x * (b = bias[i]);
            target.vy -= y * b;
            source.vx += x * (b = 1 - b);
            source.vy += y * b;
          }
        }
      }

      function initialize() {
        if (!nodes) return;

        var i,
            n = nodes.length,
            m = links.length,
            nodeById = new Map(nodes.map((d, i) => [id(d, i, nodes), d])),
            link;

        for (i = 0, count = new Array(n); i < m; ++i) {
          link = links[i], link.index = i;
          if (typeof link.source !== "object") link.source = find(nodeById, link.source);
          if (typeof link.target !== "object") link.target = find(nodeById, link.target);
          count[link.source.index] = (count[link.source.index] || 0) + 1;
          count[link.target.index] = (count[link.target.index] || 0) + 1;
        }

        for (i = 0, bias = new Array(m); i < m; ++i) {
          link = links[i], bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
        }

        strengths = new Array(m), initializeStrength();
        distances = new Array(m), initializeDistance();
      }

      function initializeStrength() {
        if (!nodes) return;

        for (var i = 0, n = links.length; i < n; ++i) {
          strengths[i] = +strength(links[i], i, links);
        }
      }

      function initializeDistance() {
        if (!nodes) return;

        for (var i = 0, n = links.length; i < n; ++i) {
          distances[i] = +distance(links[i], i, links);
        }
      }

      force.initialize = function(_nodes, _random) {
        nodes = _nodes;
        random = _random;
        initialize();
      };

      force.links = function(_) {
        return arguments.length ? (links = _, initialize(), force) : links;
      };

      force.id = function(_) {
        return arguments.length ? (id = _, force) : id;
      };

      force.iterations = function(_) {
        return arguments.length ? (iterations = +_, force) : iterations;
      };

      force.strength = function(_) {
        return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initializeStrength(), force) : strength;
      };

      force.distance = function(_) {
        return arguments.length ? (distance = typeof _ === "function" ? _ : constant(+_), initializeDistance(), force) : distance;
      };

      return force;
    }

    // https://en.wikipedia.org/wiki/Linear_congruential_generator#Parameters_in_common_use
    const a = 1664525;
    const c = 1013904223;
    const m = 4294967296; // 2^32

    function lcg() {
      let s = 1;
      return () => (s = (a * s + c) % m) / m;
    }

    function x(d) {
      return d.x;
    }

    function y(d) {
      return d.y;
    }

    var initialRadius = 10,
        initialAngle = Math.PI * (3 - Math.sqrt(5));

    function forceSimulation(nodes) {
      var simulation,
          alpha = 1,
          alphaMin = 0.001,
          alphaDecay = 1 - Math.pow(alphaMin, 1 / 300),
          alphaTarget = 0,
          velocityDecay = 0.6,
          forces = new Map(),
          stepper = timer(step),
          event = dispatch("tick", "end"),
          random = lcg();

      if (nodes == null) nodes = [];

      function step() {
        tick();
        event.call("tick", simulation);
        if (alpha < alphaMin) {
          stepper.stop();
          event.call("end", simulation);
        }
      }

      function tick(iterations) {
        var i, n = nodes.length, node;

        if (iterations === undefined) iterations = 1;

        for (var k = 0; k < iterations; ++k) {
          alpha += (alphaTarget - alpha) * alphaDecay;

          forces.forEach(function(force) {
            force(alpha);
          });

          for (i = 0; i < n; ++i) {
            node = nodes[i];
            if (node.fx == null) node.x += node.vx *= velocityDecay;
            else node.x = node.fx, node.vx = 0;
            if (node.fy == null) node.y += node.vy *= velocityDecay;
            else node.y = node.fy, node.vy = 0;
          }
        }

        return simulation;
      }

      function initializeNodes() {
        for (var i = 0, n = nodes.length, node; i < n; ++i) {
          node = nodes[i], node.index = i;
          if (node.fx != null) node.x = node.fx;
          if (node.fy != null) node.y = node.fy;
          if (isNaN(node.x) || isNaN(node.y)) {
            var radius = initialRadius * Math.sqrt(0.5 + i), angle = i * initialAngle;
            node.x = radius * Math.cos(angle);
            node.y = radius * Math.sin(angle);
          }
          if (isNaN(node.vx) || isNaN(node.vy)) {
            node.vx = node.vy = 0;
          }
        }
      }

      function initializeForce(force) {
        if (force.initialize) force.initialize(nodes, random);
        return force;
      }

      initializeNodes();

      return simulation = {
        tick: tick,

        restart: function() {
          return stepper.restart(step), simulation;
        },

        stop: function() {
          return stepper.stop(), simulation;
        },

        nodes: function(_) {
          return arguments.length ? (nodes = _, initializeNodes(), forces.forEach(initializeForce), simulation) : nodes;
        },

        alpha: function(_) {
          return arguments.length ? (alpha = +_, simulation) : alpha;
        },

        alphaMin: function(_) {
          return arguments.length ? (alphaMin = +_, simulation) : alphaMin;
        },

        alphaDecay: function(_) {
          return arguments.length ? (alphaDecay = +_, simulation) : +alphaDecay;
        },

        alphaTarget: function(_) {
          return arguments.length ? (alphaTarget = +_, simulation) : alphaTarget;
        },

        velocityDecay: function(_) {
          return arguments.length ? (velocityDecay = 1 - _, simulation) : 1 - velocityDecay;
        },

        randomSource: function(_) {
          return arguments.length ? (random = _, forces.forEach(initializeForce), simulation) : random;
        },

        force: function(name, _) {
          return arguments.length > 1 ? ((_ == null ? forces.delete(name) : forces.set(name, initializeForce(_))), simulation) : forces.get(name);
        },

        find: function(x, y, radius) {
          var i = 0,
              n = nodes.length,
              dx,
              dy,
              d2,
              node,
              closest;

          if (radius == null) radius = Infinity;
          else radius *= radius;

          for (i = 0; i < n; ++i) {
            node = nodes[i];
            dx = x - node.x;
            dy = y - node.y;
            d2 = dx * dx + dy * dy;
            if (d2 < radius) closest = node, radius = d2;
          }

          return closest;
        },

        on: function(name, _) {
          return arguments.length > 1 ? (event.on(name, _), simulation) : event.on(name);
        }
      };
    }

    function forceManyBody() {
      var nodes,
          node,
          random,
          alpha,
          strength = constant(-30),
          strengths,
          distanceMin2 = 1,
          distanceMax2 = Infinity,
          theta2 = 0.81;

      function force(_) {
        var i, n = nodes.length, tree = quadtree(nodes, x, y).visitAfter(accumulate);
        for (alpha = _, i = 0; i < n; ++i) node = nodes[i], tree.visit(apply);
      }

      function initialize() {
        if (!nodes) return;
        var i, n = nodes.length, node;
        strengths = new Array(n);
        for (i = 0; i < n; ++i) node = nodes[i], strengths[node.index] = +strength(node, i, nodes);
      }

      function accumulate(quad) {
        var strength = 0, q, c, weight = 0, x, y, i;

        // For internal nodes, accumulate forces from child quadrants.
        if (quad.length) {
          for (x = y = i = 0; i < 4; ++i) {
            if ((q = quad[i]) && (c = Math.abs(q.value))) {
              strength += q.value, weight += c, x += c * q.x, y += c * q.y;
            }
          }
          quad.x = x / weight;
          quad.y = y / weight;
        }

        // For leaf nodes, accumulate forces from coincident quadrants.
        else {
          q = quad;
          q.x = q.data.x;
          q.y = q.data.y;
          do strength += strengths[q.data.index];
          while (q = q.next);
        }

        quad.value = strength;
      }

      function apply(quad, x1, _, x2) {
        if (!quad.value) return true;

        var x = quad.x - node.x,
            y = quad.y - node.y,
            w = x2 - x1,
            l = x * x + y * y;

        // Apply the Barnes-Hut approximation if possible.
        // Limit forces for very close nodes; randomize direction if coincident.
        if (w * w / theta2 < l) {
          if (l < distanceMax2) {
            if (x === 0) x = jiggle(random), l += x * x;
            if (y === 0) y = jiggle(random), l += y * y;
            if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
            node.vx += x * quad.value * alpha / l;
            node.vy += y * quad.value * alpha / l;
          }
          return true;
        }

        // Otherwise, process points directly.
        else if (quad.length || l >= distanceMax2) return;

        // Limit forces for very close nodes; randomize direction if coincident.
        if (quad.data !== node || quad.next) {
          if (x === 0) x = jiggle(random), l += x * x;
          if (y === 0) y = jiggle(random), l += y * y;
          if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
        }

        do if (quad.data !== node) {
          w = strengths[quad.data.index] * alpha / l;
          node.vx += x * w;
          node.vy += y * w;
        } while (quad = quad.next);
      }

      force.initialize = function(_nodes, _random) {
        nodes = _nodes;
        random = _random;
        initialize();
      };

      force.strength = function(_) {
        return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initialize(), force) : strength;
      };

      force.distanceMin = function(_) {
        return arguments.length ? (distanceMin2 = _ * _, force) : Math.sqrt(distanceMin2);
      };

      force.distanceMax = function(_) {
        return arguments.length ? (distanceMax2 = _ * _, force) : Math.sqrt(distanceMax2);
      };

      force.theta = function(_) {
        return arguments.length ? (theta2 = _ * _, force) : Math.sqrt(theta2);
      };

      return force;
    }

    /* src\NetworkGraphCanvas.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1, window: window_1 } = globals;

    const file$1 = "src\\NetworkGraphCanvas.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[33] = list[i];
    	return child_ctx;
    }

    // (311:4) {#each legendItems as item}
    function create_each_block_1(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let t1_value = /*item*/ ctx[33].label + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(div0, "class", "legend-color svelte-1y0o42m");
    			set_style(div0, "background-color", /*item*/ ctx[33].color);
    			add_location(div0, file$1, 312, 8, 8123);
    			attr_dev(div1, "class", "legend-label svelte-1y0o42m");
    			add_location(div1, file$1, 313, 8, 8203);
    			attr_dev(div2, "class", "legend-item svelte-1y0o42m");
    			add_location(div2, file$1, 311, 6, 8089);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, t1);
    			append_dev(div2, t2);
    		},
    		p: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(311:4) {#each legendItems as item}",
    		ctx
    	});

    	return block;
    }

    // (318:2) {#if activeNode}
    function create_if_block(ctx) {
    	let breadcrumb;
    	let strong;
    	let t0_value = /*activeNode*/ ctx[1].id.split(/(?=[A-Z])/).join(' ') + "";
    	let t0;
    	let t1;
    	let br;
    	let t2;
    	let if_block = /*activeNode*/ ctx[1].details && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			breadcrumb = element("breadcrumb");
    			strong = element("strong");
    			t0 = text(t0_value);
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			if (if_block) if_block.c();
    			add_location(strong, file$1, 319, 6, 8341);
    			add_location(br, file$1, 320, 6, 8409);
    			attr_dev(breadcrumb, "id", "nodeDetails");
    			attr_dev(breadcrumb, "class", "svelte-1y0o42m");
    			add_location(breadcrumb, file$1, 318, 4, 8305);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, breadcrumb, anchor);
    			append_dev(breadcrumb, strong);
    			append_dev(strong, t0);
    			append_dev(breadcrumb, t1);
    			append_dev(breadcrumb, br);
    			append_dev(breadcrumb, t2);
    			if (if_block) if_block.m(breadcrumb, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*activeNode*/ 2 && t0_value !== (t0_value = /*activeNode*/ ctx[1].id.split(/(?=[A-Z])/).join(' ') + "")) set_data_dev(t0, t0_value);

    			if (/*activeNode*/ ctx[1].details) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(breadcrumb, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(breadcrumb);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(318:2) {#if activeNode}",
    		ctx
    	});

    	return block;
    }

    // (322:6) {#if activeNode.details}
    function create_if_block_1(ctx) {
    	let each_1_anchor;
    	let each_value = Object.entries(/*activeNode*/ ctx[1].details);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty$1();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*activeNode*/ 2) {
    				each_value = Object.entries(/*activeNode*/ ctx[1].details);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(322:6) {#if activeNode.details}",
    		ctx
    	});

    	return block;
    }

    // (323:8) {#each Object.entries(activeNode.details) as detail}
    function create_each_block(ctx) {
    	let t0_value = /*detail*/ ctx[30][0] + "";
    	let t0;
    	let t1;
    	let t2_value = /*detail*/ ctx[30][1] + "";
    	let t2;
    	let t3;
    	let br;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = text(":\n          ");
    			t2 = text(t2_value);
    			t3 = space();
    			br = element("br");
    			add_location(br, file$1, 325, 10, 8563);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, br, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*activeNode*/ 2 && t0_value !== (t0_value = /*detail*/ ctx[30][0] + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*activeNode*/ 2 && t2_value !== (t2_value = /*detail*/ ctx[30][1] + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(323:8) {#each Object.entries(activeNode.details) as detail}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let h2;
    	let t1;
    	let div1;
    	let div0;
    	let t2;
    	let t3;
    	let canvas_1;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*legendItems*/ ctx[2];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let if_block = /*activeNode*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Mapping Customer Relations Network";
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			if (if_block) if_block.c();
    			t3 = space();
    			canvas_1 = element("canvas");
    			set_style(h2, "color", "white");
    			add_location(h2, file$1, 305, 0, 7896);
    			attr_dev(div0, "class", "legend svelte-1y0o42m");
    			add_location(div0, file$1, 309, 2, 8030);
    			attr_dev(canvas_1, "class", "svelte-1y0o42m");
    			add_location(canvas_1, file$1, 330, 2, 8626);
    			attr_dev(div1, "class", "chart-container svelte-1y0o42m");
    			add_location(div1, file$1, 308, 0, 7998);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}

    			append_dev(div1, t2);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t3);
    			append_dev(div1, canvas_1);
    			/*canvas_1_binding*/ ctx[8](canvas_1);

    			if (!mounted) {
    				dispose = listen_dev(window_1, "resize", /*resize*/ ctx[3], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*legendItems*/ 4) {
    				each_value_1 = /*legendItems*/ ctx[2];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (/*activeNode*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div1, t3);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			if (if_block) if_block.d();
    			/*canvas_1_binding*/ ctx[8](null);
    			mounted = false;
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

    const nodeRadius = 5;

    function groupColour(context, d) {
    	let nodesize = 2 + Math.sqrt(d.size) / 5;
    	let radgrad = context.createRadialGradient(d.x, d.y, nodesize / 3, d.x, d.y, nodesize);
    	radgrad.addColorStop(0, "#01abfc");
    	radgrad.addColorStop(0.1, "#01abfc");
    	radgrad.addColorStop(1, "#01abfc00");
    	let radgrad2 = context.createRadialGradient(d.x, d.y, nodesize / 3, d.x, d.y, nodesize);
    	radgrad2.addColorStop(0, "#7A17F6");
    	radgrad2.addColorStop(0.1, "#7A17F6");
    	radgrad2.addColorStop(1, "#7A17F600");
    	let radgrad3 = context.createRadialGradient(d.x, d.y, nodesize / 3, d.x, d.y, nodesize);
    	radgrad3.addColorStop(0, "#006400");
    	radgrad3.addColorStop(0.1, "#006400");
    	radgrad3.addColorStop(1, "#00FF0000");
    	let radgrad4 = context.createRadialGradient(d.x, d.y, nodesize / 3, d.x, d.y, nodesize);
    	radgrad4.addColorStop(0, "#FFD700");
    	radgrad4.addColorStop(0.1, "#FFD700");
    	radgrad4.addColorStop(1, "#FFD70000");
    	let radgrad5 = context.createRadialGradient(d.x, d.y, nodesize / 3, d.x, d.y, nodesize);
    	radgrad5.addColorStop(0, "#800080");
    	radgrad5.addColorStop(0.1, "#800080");
    	radgrad5.addColorStop(1, "#80008000");
    	let radgrads = [radgrad, radgrad2, radgrad3, radgrad4, radgrad5];
    	return radgrads[d.group % 5];
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let xScale;
    	let yScale;
    	let xTicks;
    	let yTicks;
    	let d3yScale;
    	let links;
    	let nodes;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NetworkGraphCanvas', slots, []);

    	const legendItems = [
    		{ label: "Countries", color: "#006400" },
    		{
    			label: "Distribution Centers",
    			color: "#FFD700"
    		},
    		{
    			label: "Production Plants",
    			color: "#01abfc"
    		},
    		{ label: "Material", color: "#800080" },
    		{ label: "Customers", color: "#7A17F6" }
    	];

    	let d3 = {
    		zoom,
    		zoomIdentity: identity,
    		scaleLinear: linear,
    		scaleOrdinal: ordinal,
    		schemeCategory10,
    		select,
    		selectAll,
    		pointer,
    		drag,
    		forceSimulation,
    		forceLink,
    		forceManyBody,
    		forceCenter,
    		forceCollide
    	};

    	let { graph } = $$props;
    	let canvas;
    	let width = 500;
    	let height = 600;
    	let max = 100;
    	let activeNode = false;
    	const padding = { top: 20, right: 40, bottom: 40, left: 25 };
    	let showCard;
    	let transform = d3.zoomIdentity;
    	let simulation, context;
    	let dpi = 1;

    	onMount(() => {
    		dpi = window.devicePixelRatio || 1;
    		context = canvas.getContext("2d");
    		resize();
    		fitToWindow(canvas);

    		window.addEventListener("resize", () => {
    			fitToWindow(canvas);
    			simulationUpdate();
    		});

    		simulation = d3.forceSimulation(nodes).force("link", d3.forceLink(links).id(d => d.id).distance(d => 2 + Math.sqrt(max) / 4 + 130 * Math.pow(2, -d.value / 1000))).force("charge", d3.forceManyBody()).force("center", d3.forceCenter(width / 2, height / 2)).force('collision', d3.forceCollide().radius(d => Math.sqrt(d.size) / 4)).on("tick", simulationUpdate);

    		// title
    		d3.select(context.canvas).on("mousemove", event => {
    			const d = simulation.find(transform.invertX(event.offsetX * dpi), transform.invertY(event.offsetY * dpi), 50);
    			if (d) $$invalidate(1, activeNode = d); else $$invalidate(1, activeNode = false);
    		});

    		d3.select(context.canvas).on("click", () => {
    			if (activeNode) {
    				showCard = JSON.parse(JSON.stringify({
    					id: activeNode.id,
    					details: activeNode.details
    				}));
    			}
    		});

    		d3.select(canvas).call(d3.drag().container(canvas).subject(dragsubject).on("start", dragstarted).on("drag", dragged).on("end", dragended)).call(d3.zoom().scaleExtent([1 / 10, 8]).on("zoom", zoomed));
    	});

    	function simulationUpdate() {
    		context.save();
    		context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    		context.translate(transform.x, transform.y);
    		context.scale(transform.k, transform.k);

    		links.forEach(d => {
    			context.beginPath();
    			context.moveTo(d.source.x, d.source.y);
    			context.lineTo(d.target.x, d.target.y);
    			context.globalAlpha = 0.3;
    			context.strokeStyle = "#999";
    			context.lineWidth = Math.cbrt(d.value) / 2;
    			context.stroke();
    			context.globalAlpha = 1;
    		});

    		nodes.forEach((d, i) => {
    			context.beginPath();
    			context.arc(d.x, d.y, 2 + Math.sqrt(d.size) / 5, 0, 2 * Math.PI);
    			context.strokeStyle = "transparent";
    			context.lineWidth = 1.5;
    			context.stroke();
    			context.fillStyle = groupColour(context, d);
    			context.fill();

    			if (d.size > max / 50) {
    				context.fillStyle = "white";
    				d.id.split(/(?=[A-Z])/).forEach((word, index) => context.fillText(word, d.x - 10, d.y + 10 * index));
    			}
    		});

    		context.restore();
    	}

    	function zoomed(currentEvent) {
    		transform = currentEvent.transform;
    		simulationUpdate();
    	}

    	// Use the d3-force simulation to locate the node
    	function dragsubject(currentEvent) {
    		const node = simulation.find(transform.invertX(currentEvent.x * dpi), transform.invertY(currentEvent.y * dpi), 50);

    		if (node) {
    			node.x = transform.applyX(node.x);
    			node.y = transform.applyY(node.y);
    		}

    		return node;
    	}

    	function dragstarted(currentEvent) {
    		if (!currentEvent.active) simulation.alphaTarget(0.3).restart();
    		currentEvent.subject.fx = transform.invertX(currentEvent.subject.x);
    		currentEvent.subject.fy = transform.invertY(currentEvent.subject.y);
    	}

    	function dragged(currentEvent) {
    		currentEvent.subject.fx = transform.invertX(currentEvent.x);
    		currentEvent.subject.fy = transform.invertY(currentEvent.y);
    	}

    	function dragended(currentEvent) {
    		if (!currentEvent.active) simulation.alphaTarget(0);
    		currentEvent.subject.fx = null;
    		currentEvent.subject.fy = null;
    	}

    	function resize() {
    		$$invalidate(5, { width, height } = canvas, width, $$invalidate(6, height));
    	}

    	function fitToWindow(canvas) {
    		const dpi = window.devicePixelRatio || 1;
    		const screenWidth = window.innerWidth;
    		const screenHeight = window.innerHeight;
    		canvas.width = screenWidth * dpi;
    		canvas.height = screenHeight * dpi;

    		// Set CSS width and height to fill the entire window
    		canvas.style.width = screenWidth + "px";

    		canvas.style.height = screenHeight + "px";

    		// Update width and height variables
    		$$invalidate(5, width = screenWidth * dpi);

    		$$invalidate(6, height = screenHeight * dpi);
    	}

    	$$self.$$.on_mount.push(function () {
    		if (graph === undefined && !('graph' in $$props || $$self.$$.bound[$$self.$$.props['graph']])) {
    			console.warn("<NetworkGraphCanvas> was created without expected prop 'graph'");
    		}
    	});

    	const writable_props = ['graph'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NetworkGraphCanvas> was created with unknown prop '${key}'`);
    	});

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvas = $$value;
    			$$invalidate(0, canvas);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('graph' in $$props) $$invalidate(4, graph = $$props.graph);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		scaleLinear: linear,
    		scaleOrdinal: ordinal,
    		zoom,
    		zoomIdentity: identity,
    		schemeCategory10,
    		select,
    		selectAll,
    		pointer,
    		drag,
    		forceSimulation,
    		forceLink,
    		forceManyBody,
    		forceCenter,
    		forceCollide,
    		legendItems,
    		d3,
    		graph,
    		canvas,
    		width,
    		height,
    		max,
    		nodeRadius,
    		activeNode,
    		padding,
    		groupColour,
    		showCard,
    		transform,
    		simulation,
    		context,
    		dpi,
    		simulationUpdate,
    		zoomed,
    		dragsubject,
    		dragstarted,
    		dragged,
    		dragended,
    		resize,
    		fitToWindow,
    		nodes,
    		links,
    		d3yScale,
    		yTicks,
    		xTicks,
    		yScale,
    		xScale
    	});

    	$$self.$inject_state = $$props => {
    		if ('d3' in $$props) d3 = $$props.d3;
    		if ('graph' in $$props) $$invalidate(4, graph = $$props.graph);
    		if ('canvas' in $$props) $$invalidate(0, canvas = $$props.canvas);
    		if ('width' in $$props) $$invalidate(5, width = $$props.width);
    		if ('height' in $$props) $$invalidate(6, height = $$props.height);
    		if ('max' in $$props) $$invalidate(7, max = $$props.max);
    		if ('activeNode' in $$props) $$invalidate(1, activeNode = $$props.activeNode);
    		if ('showCard' in $$props) showCard = $$props.showCard;
    		if ('transform' in $$props) transform = $$props.transform;
    		if ('simulation' in $$props) simulation = $$props.simulation;
    		if ('context' in $$props) context = $$props.context;
    		if ('dpi' in $$props) dpi = $$props.dpi;
    		if ('nodes' in $$props) nodes = $$props.nodes;
    		if ('links' in $$props) links = $$props.links;
    		if ('d3yScale' in $$props) d3yScale = $$props.d3yScale;
    		if ('yTicks' in $$props) yTicks = $$props.yTicks;
    		if ('xTicks' in $$props) xTicks = $$props.xTicks;
    		if ('yScale' in $$props) yScale = $$props.yScale;
    		if ('xScale' in $$props) xScale = $$props.xScale;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*width*/ 32) {
    			xScale = linear().domain([0, 20]).range([padding.left, width - padding.right]);
    		}

    		if ($$self.$$.dirty[0] & /*height*/ 64) {
    			yScale = linear().domain([0, 12]).range([height - padding.bottom, padding.top]);
    		}

    		if ($$self.$$.dirty[0] & /*width*/ 32) {
    			xTicks = width > 180 ? [0, 4, 8, 12, 16, 20] : [0, 10, 20];
    		}

    		if ($$self.$$.dirty[0] & /*height*/ 64) {
    			yTicks = height > 180 ? [0, 2, 4, 6, 8, 10, 12] : [0, 4, 8, 12];
    		}

    		if ($$self.$$.dirty[0] & /*height*/ 64) {
    			d3yScale = linear().domain([0, height]).range([height, 0]);
    		}

    		if ($$self.$$.dirty[0] & /*graph*/ 16) {
    			links = graph.links.map(d => Object.create(d));
    		}

    		if ($$self.$$.dirty[0] & /*graph, max*/ 144) {
    			nodes = graph.nodes.map(d => {
    				d.size = Math.pow(graph.links.filter(link => link.source == d.id || link.target == d.id).map(link => link.value).reduce((a, b) => a + b), 2);

    				if (d.id == "You") {
    					$$invalidate(7, max = d.size);
    					d.details.messages = max;
    				}

    				return Object.create(d);
    			});
    		}
    	};

    	return [
    		canvas,
    		activeNode,
    		legendItems,
    		resize,
    		graph,
    		width,
    		height,
    		max,
    		canvas_1_binding
    	];
    }

    class NetworkGraphCanvas extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$1, create_fragment$1, safe_not_equal, { graph: 4 }, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NetworkGraphCanvas",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get graph() {
    		throw new Error("<NetworkGraphCanvas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set graph(value) {
    		throw new Error("<NetworkGraphCanvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var data = {
      "nodes": [
        {
            "id": "Ryan-Lesch",
            "group": 1
        },
        {
            "id": "Denesik-Lesch",
            "group": 1
        },
        {
            "id": "Kuvalis-Rogahn",
            "group": 1
        },
        {
            "id": "Toy-Beatty",
            "group": 1
        },
        {
            "id": "Jast-West",
            "group": 1
        },
        {
            "id": "Fritsch LLC",
            "group": 1
        },
        {
            "id": "Kemmer-Pouros",
            "group": 1
        },
        {
            "id": "Collins Group",
            "group": 1
        },
        {
            "id": "Willms-Lockman",
            "group": 1
        },
        {
            "id": "Will Inc",
            "group": 1
        },
        {
            "id": "Hills LLC",
            "group": 1
        },
        {
            "id": "Batz Inc",
            "group": 1
        },
        {
            "id": "Schuppe Inc",
            "group": 1
        },
        {
            "id": "Nitzsche LLC",
            "group": 1
        },
        {
            "id": "Green-Kuphal",
            "group": 1
        },
        {
            "id": "Breitenberg Group",
            "group": 1
        },
        {
            "id": "Ernser Inc",
            "group": 1
        },
        {
            "id": "Haag-Greenfelder",
            "group": 1
        },
        {
            "id": "Rowe Inc",
            "group": 1
        },
        {
            "id": "Farrell Group",
            "group": 1
        },
        {
            "id": "Prohaska-Batz",
            "group": 1
        },
        {
            "id": "O'Conner-Stokes",
            "group": 1
        },
        {
            "id": "Bogisich Group",
            "group": 1
        },
        {
            "id": "Casper and Sons",
            "group": 1
        },
        {
            "id": "Rogahn Group",
            "group": 1
        },
        {
            "id": "Murphy-Hirthe",
            "group": 1
        },
        {
            "id": "King Group",
            "group": 1
        },
        {
            "id": "Klocko Inc",
            "group": 1
        },
        {
            "id": "Hirthe-McClure",
            "group": 1
        },
        {
            "id": "McClure LLC",
            "group": 1
        },
        {
            "id": "Zulauf-Ryan",
            "group": 1
        },
        {
            "id": "Carroll-Feest",
            "group": 1
        },
        {
            "id": "Kuhn Inc",
            "group": 1
        },
        {
            "id": "Stanton-Wisozk",
            "group": 1
        },
        {
            "id": "Schultz-Mertz",
            "group": 1
        },
        {
            "id": "Davis Inc",
            "group": 1
        },
        {
            "id": "O'Conner-Lind",
            "group": 1
        },
        {
            "id": "Lebsack-Wintheiser",
            "group": 1
        },
        {
            "id": "Feest LLC",
            "group": 1
        },
        {
            "id": "Koelpin LLC",
            "group": 1
        },
        {
            "id": "Hodkiewicz LLC",
            "group": 1
        },
        {
            "id": "Balistreri-Sipes",
            "group": 1
        },
        {
            "id": "Rempel and Sons",
            "group": 1
        },
        {
            "id": "Block and Sons",
            "group": 1
        },
        {
            "id": "Kling-Walker",
            "group": 1
        },
        {
            "id": "O'Hara and Sons",
            "group": 1
        },
        {
            "id": "Strosin LLC",
            "group": 1
        },
        {
            "id": "Bartoletti-Stehr",
            "group": 1
        },
        {
            "id": "Ward Group",
            "group": 1
        },
        {
            "id": "Brown-Hamill",
            "group": 1
        },
        {
            "id": "Bradtke-Pagac",
            "group": 1
        },
        {
            "id": "Wolf Group",
            "group": 1
        },
        {
            "id": "Bosco-Bergnaum",
            "group": 1
        },
        {
            "id": "Dicki-Rice",
            "group": 1
        },
        {
            "id": "Medhurst LLC",
            "group": 1
        },
        {
            "id": "Bayer-Kozey",
            "group": 1
        },
        {
            "id": "Barrows Group",
            "group": 1
        },
        {
            "id": "McGlynn Inc",
            "group": 1
        },
        {
            "id": "Pollich-Boyle",
            "group": 1
        },
        {
            "id": "Moen-Zboncak",
            "group": 1
        },
        {
            "id": "McKenzie-McCullough",
            "group": 1
        },
        {
            "id": "Jacobi Group",
            "group": 1
        },
        {
            "id": "Koelpin-Pouros",
            "group": 1
        },
        {
            "id": "Kautzer Group",
            "group": 1
        },
        {
            "id": "Zieme Group",
            "group": 1
        },
        {
            "id": "Streich-MacGyver",
            "group": 1
        },
        {
            "id": "West LLC",
            "group": 1
        },
        {
            "id": "Mertz-O'Hara",
            "group": 1
        },
        {
            "id": "Heller Group",
            "group": 1
        },
        {
            "id": "Sawayn Group",
            "group": 1
        },
        {
            "id": "Russel-Weber",
            "group": 1
        },
        {
            "id": "Smitham and Sons",
            "group": 1
        },
        {
            "id": "Rau and Sons",
            "group": 1
        },
        {
            "id": "Bruen and Sons",
            "group": 1
        },
        {
            "id": "Monahan-Dickinson",
            "group": 1
        },
        {
            "id": "Schneider-Wunsch",
            "group": 1
        },
        {
            "id": "Ledner-Hilpert",
            "group": 1
        },
        {
            "id": "Nader-Tremblay",
            "group": 1
        },
        {
            "id": "Jerde Group",
            "group": 1
        },
        {
            "id": "Schoen Group",
            "group": 1
        },
        {
            "id": "Abbott-Hintz",
            "group": 1
        },
        {
            "id": "Reichel Inc",
            "group": 1
        },
        {
            "id": "Monahan and Sons",
            "group": 1
        },
        {
            "id": "Shields Group",
            "group": 1
        },
        {
            "id": "Wolf Inc",
            "group": 1
        },
        {
            "id": "Gibson LLC",
            "group": 1
        },
        {
            "id": "Hoppe Group",
            "group": 1
        },
        {
            "id": "Bernhard-Bartell",
            "group": 1
        },
        {
            "id": "Little-Hintz",
            "group": 1
        },
        {
            "id": "Wiza LLC",
            "group": 1
        },
        {
            "id": "Lakin Inc",
            "group": 1
        },
        {
            "id": "Hintz-Purdy",
            "group": 1
        },
        {
            "id": "Vandervort-Kerluke",
            "group": 1
        },
        {
            "id": "Bergnaum Inc",
            "group": 1
        },
        {
            "id": "Rau-Osinski",
            "group": 1
        },
        {
            "id": "Pfeffer and Sons",
            "group": 1
        },
        {
            "id": "Hilpert and Sons",
            "group": 1
        },
        {
            "id": "Blanda-Dicki",
            "group": 1
        },
        {
            "id": "Larson LLC",
            "group": 1
        },
        {
            "id": "Considine-Haley",
            "group": 1
        },
        {
            "id": "Latvia",
            "group": 2
        },
        {
            "id": "France",
            "group": 2
        },
        {
            "id": "Poland",
            "group": 2
        },
        {
            "id": "Germany",
            "group": 2
        },
        {
            "id": "Croatia",
            "group": 2
        },
        {
            "id": "Greece",
            "group": 2
        },
        {
            "id": "Netherlands",
            "group": 2
        },
        {
            "id": "Czech Republic",
            "group": 2
        },
        {
            "id": "Spain",
            "group": 2
        },
        {
            "id": "Belgium",
            "group": 2
        },
        {
            "id": "Norway",
            "group": 2
        },
        {
            "id": "Hungary",
            "group": 2
        },
        {
            "id": "Sweden",
            "group": 2
        },
        {
            "id": "Finland",
            "group": 2
        },
        {
            "id": "Portugal",
            "group": 2
        },
        {
            "id": "Slovenia",
            "group": 2
        },
        {
            "id": "Lithuania",
            "group": 2
        },
        {
            "id": "United Kingdom",
            "group": 2
        },
        {
            "id": "Denmark",
            "group": 2
        },
        {
            "id": "Estonia",
            "group": 2
        },
        {
            "id": "Goteborg DC",
            "group": 3
        },
        {
            "id": "Lyon DC",
            "group": 3
        },
        {
            "id": "Wroclaw DC",
            "group": 3
        },
        {
            "id": "Antwerp DC",
            "group": 3
        },
        {
            "id": "Birmingham DC",
            "group": 3
        },
        {
            "id": "EV Car Battery",
            "group": 4
        },
        {
            "id": "Home Battery",
            "group": 4
        },
        {
            "id": "Wroclaw Production",
            "group": 5
        },
        {
            "id": "Antwerp Production",
            "group": 5
        },
        {
            "id": "Lyon Production",
            "group": 5
        }
    ],
    "links": [
        {
            "source": "Antwerp DC",
            "target": "Carroll-Feest",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Lyon Production",
            "target": "Medhurst LLC",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Considine-Haley",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Czech Republic",
            "target": "Lyon Production",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "Lakin Inc",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Lyon Production",
            "value": 5
        },
        {
            "source": "Czech Republic",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Antwerp Production",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "France",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "France",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "Antwerp Production",
            "value": 5
        },
        {
            "source": "Sweden",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "Portugal",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Strosin LLC",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Little-Hintz",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Little-Hintz",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "Ryan-Lesch",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Antwerp Production",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "France",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Willms-Lockman",
            "value": 5
        },
        {
            "source": "France",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Brown-Hamill",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "Slovenia",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "Pfeffer and Sons",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "McClure LLC",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Antwerp Production",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Heller Group",
            "value": 5
        },
        {
            "source": "Hintz-Purdy",
            "target": "Lyon Production",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "France",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Belgium",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Rowe Inc",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "France",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "Ryan-Lesch",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Sweden",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Stanton-Wisozk",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Denesik-Lesch",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "France",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Sweden",
            "value": 5
        },
        {
            "source": "Hirthe-McClure",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Greece",
            "value": 5
        },
        {
            "source": "France",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Balistreri-Sipes",
            "target": "Hungary",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "Sweden",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Wolf Group",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Sweden",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Sweden",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Antwerp Production",
            "target": "Poland",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Kemmer-Pouros",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Russel-Weber",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "Toy-Beatty",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "Balistreri-Sipes",
            "value": 5
        },
        {
            "source": "Haag-Greenfelder",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Greece",
            "target": "Vandervort-Kerluke",
            "value": 5
        },
        {
            "source": "Mertz-O'Hara",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "Poland",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Breitenberg Group",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Antwerp Production",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Carroll-Feest",
            "value": 5
        },
        {
            "source": "Jerde Group",
            "target": "Lyon Production",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Poland",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Medhurst LLC",
            "target": "France",
            "value": 5
        },
        {
            "source": "Poland",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "Larson LLC",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Netherlands",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Hoppe Group",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Antwerp Production",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Portugal",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Czech Republic",
            "value": 5
        },
        {
            "source": "Portugal",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "Greece",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Lyon Production",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Bogisich Group",
            "target": "Sweden",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Schoen Group",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "France",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "Greece",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Czech Republic",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Monahan and Sons",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Finland",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "Lebsack-Wintheiser",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Blanda-Dicki",
            "value": 5
        },
        {
            "source": "Antwerp Production",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Hirthe-McClure",
            "target": "Antwerp Production",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "McGlynn Inc",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Lyon Production",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "Koelpin-Pouros",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "Greece",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Belgium",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Kuvalis-Rogahn",
            "value": 5
        },
        {
            "source": "Schultz-Mertz",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Antwerp Production",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Dicki-Rice",
            "target": "Czech Republic",
            "value": 5
        },
        {
            "source": "Norway",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "Lithuania",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Denesik-Lesch",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Slovenia",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "Lyon Production",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Considine-Haley",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Lithuania",
            "target": "Green-Kuphal",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "France",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "McKenzie-McCullough",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "Feest LLC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Rau and Sons",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Wolf Inc",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Croatia",
            "value": 5
        },
        {
            "source": "Ward Group",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Bruen and Sons",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Sweden",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "Antwerp Production",
            "target": "Poland",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Vandervort-Kerluke",
            "target": "Greece",
            "value": 5
        },
        {
            "source": "Poland",
            "target": "Farrell Group",
            "value": 5
        },
        {
            "source": "Lyon Production",
            "target": "France",
            "value": 5
        },
        {
            "source": "Antwerp Production",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Jerde Group",
            "value": 5
        },
        {
            "source": "Koelpin LLC",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "France",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Belgium",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "Sweden",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Poland",
            "value": 5
        },
        {
            "source": "Latvia",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "Koelpin LLC",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Lyon Production",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "Barrows Group",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "King Group",
            "target": "Antwerp Production",
            "value": 5
        },
        {
            "source": "Belgium",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "Poland",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Streich-MacGyver",
            "value": 5
        },
        {
            "source": "O'Hara and Sons",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "Portugal",
            "target": "Rempel and Sons",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "Lithuania",
            "value": 5
        },
        {
            "source": "McGlynn Inc",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Ledner-Hilpert",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Will Inc",
            "value": 5
        },
        {
            "source": "Sawayn Group",
            "target": "Antwerp Production",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Stanton-Wisozk",
            "value": 5
        },
        {
            "source": "Portugal",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Kuvalis-Rogahn",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "Antwerp Production",
            "value": 5
        },
        {
            "source": "Hungary",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "France",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Schoen Group",
            "value": 5
        },
        {
            "source": "Schneider-Wunsch",
            "target": "Sweden",
            "value": 5
        },
        {
            "source": "Ernser Inc",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Lyon Production",
            "value": 5
        },
        {
            "source": "Lyon Production",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Belgium",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Collins Group",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Lyon Production",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Bergnaum Inc",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Portugal",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "France",
            "target": "Schultz-Mertz",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "O'Conner-Lind",
            "value": 5
        },
        {
            "source": "Lyon Production",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "France",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Kling-Walker",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "Slovenia",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Finland",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Wolf Inc",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "France",
            "target": "Abbott-Hintz",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "Lyon Production",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Antwerp Production",
            "target": "Czech Republic",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Lyon Production",
            "value": 5
        },
        {
            "source": "Murphy-Hirthe",
            "target": "Sweden",
            "value": 5
        },
        {
            "source": "Block and Sons",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Lyon Production",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Hills LLC",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Belgium",
            "value": 5
        },
        {
            "source": "Netherlands",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Antwerp Production",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "Greece",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "Portugal",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Will Inc",
            "value": 5
        },
        {
            "source": "Greece",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Lyon Production",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Mertz-O'Hara",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Hoppe Group",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Nitzsche LLC",
            "value": 5
        },
        {
            "source": "Poland",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "Portugal",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Antwerp Production",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Denmark",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Monahan-Dickinson",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Streich-MacGyver",
            "target": "France",
            "value": 5
        },
        {
            "source": "Sweden",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Antwerp Production",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "Bayer-Kozey",
            "target": "Greece",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Poland",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Moen-Zboncak",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "O'Hara and Sons",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Ward Group",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Nitzsche LLC",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Poland",
            "value": 5
        },
        {
            "source": "Lithuania",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "Bosco-Bergnaum",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Portugal",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Casper and Sons",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Bernhard-Bartell",
            "value": 5
        },
        {
            "source": "Estonia",
            "target": "Antwerp Production",
            "value": 5
        },
        {
            "source": "Lyon Production",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Poland",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Belgium",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Lyon Production",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "France",
            "value": 5
        },
        {
            "source": "Lyon Production",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Lakin Inc",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "France",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Lyon Production",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "Latvia",
            "value": 5
        },
        {
            "source": "Poland",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Belgium",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Jast-West",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Sweden",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Croatia",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "Blanda-Dicki",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Bruen and Sons",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Bayer-Kozey",
            "target": "Greece",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Belgium",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "Vandervort-Kerluke",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Strosin LLC",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "Czech Republic",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "Sweden",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Klocko Inc",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Slovenia",
            "target": "Hills LLC",
            "value": 5
        },
        {
            "source": "Antwerp Production",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Klocko Inc",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Rogahn Group",
            "target": "Antwerp Production",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Breitenberg Group",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Hintz-Purdy",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Czech Republic",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Batz Inc",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Netherlands",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "Spain",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "Nader-Tremblay",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Czech Republic",
            "target": "Antwerp Production",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Hodkiewicz LLC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Antwerp Production",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Lyon Production",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Poland",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "West LLC",
            "value": 5
        },
        {
            "source": "Belgium",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Zulauf-Ryan",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Prohaska-Batz",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Belgium",
            "value": 5
        },
        {
            "source": "Belgium",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Finland",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "Batz Inc",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Sweden",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Czech Republic",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Haag-Greenfelder",
            "value": 5
        },
        {
            "source": "Rogahn Group",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Poland",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Bogisich Group",
            "value": 5
        },
        {
            "source": "Monahan and Sons",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Shields Group",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Greece",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Ernser Inc",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "Wiza LLC",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Rau and Sons",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Greece",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "Haag-Greenfelder",
            "value": 5
        },
        {
            "source": "O'Conner-Lind",
            "target": "Czech Republic",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "Green-Kuphal",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "Hilpert and Sons",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "O'Conner-Stokes",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Sweden",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Pollich-Boyle",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Toy-Beatty",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Ernser Inc",
            "value": 5
        },
        {
            "source": "Hodkiewicz LLC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Greece",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Smitham and Sons",
            "value": 5
        },
        {
            "source": "West LLC",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "Norway",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Kling-Walker",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Belgium",
            "value": 5
        },
        {
            "source": "Antwerp Production",
            "target": "Kautzer Group",
            "value": 5
        },
        {
            "source": "Bernhard-Bartell",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "Smitham and Sons",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Belgium",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "Rau-Osinski",
            "value": 5
        },
        {
            "source": "Kautzer Group",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "Bosco-Bergnaum",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Schuppe Inc",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Belgium",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Lithuania",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "Czech Republic",
            "target": "Kautzer Group",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Antwerp Production",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Norway",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "McClure LLC",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Pfeffer and Sons",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Bartoletti-Stehr",
            "target": "France",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "Rempel and Sons",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Greece",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp Production",
            "value": 5
        },
        {
            "source": "Feest LLC",
            "target": "Greece",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Antwerp Production",
            "target": "Czech Republic",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Blanda-Dicki",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "Antwerp Production",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Belgium",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Prohaska-Batz",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "France",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Reichel Inc",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Rowe Inc",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Czech Republic",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "France",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "Sweden",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "Farrell Group",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Netherlands",
            "value": 5
        },
        {
            "source": "Sweden",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "Czech Republic",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "United Kingdom",
            "target": "Birmingham DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Schuppe Inc",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "Casper and Sons",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Greece",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "France",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "Koelpin-Pouros",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Heller Group",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Dicki-Rice",
            "value": 5
        },
        {
            "source": "Ledner-Hilpert",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Belgium",
            "value": 5
        },
        {
            "source": "Greece",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Moen-Zboncak",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Sweden",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "Poland",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "France",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "Portugal",
            "value": 5
        },
        {
            "source": "Davis Inc",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "Kuhn Inc",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Zieme Group",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "Portugal",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Reichel Inc",
            "value": 5
        },
        {
            "source": "United Kingdom",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "Greece",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Antwerp Production",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "Bradtke-Pagac",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "France",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Schneider-Wunsch",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Bernhard-Bartell",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "Fritsch LLC",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Finland",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Greece",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Belgium",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Lyon Production",
            "value": 5
        },
        {
            "source": "France",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Antwerp Production",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Norway",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "Brown-Hamill",
            "value": 5
        },
        {
            "source": "Antwerp Production",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "Poland",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Davis Inc",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Collins Group",
            "target": "Poland",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Schoen Group",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Poland",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Blanda-Dicki",
            "value": 5
        },
        {
            "source": "Barrows Group",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "Rau-Osinski",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "Poland",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Portugal",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Jast-West",
            "value": 5
        },
        {
            "source": "Block and Sons",
            "target": "Sweden",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Koelpin LLC",
            "value": 5
        },
        {
            "source": "Willms-Lockman",
            "target": "Poland",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "France",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Batz Inc",
            "target": "Lyon Production",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Little-Hintz",
            "value": 5
        },
        {
            "source": "Slovenia",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "Portugal",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "Latvia",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Antwerp Production",
            "target": "Belgium",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "Sweden",
            "value": 5
        },
        {
            "source": "Monahan-Dickinson",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "O'Conner-Stokes",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Spain",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "Czech Republic",
            "value": 5
        },
        {
            "source": "Hills LLC",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "Larson LLC",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Lyon Production",
            "target": "Greece",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Greece",
            "value": 5
        },
        {
            "source": "Hungary",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Croatia",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Zieme Group",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Norway",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "King Group",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Gibson LLC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "Fritsch LLC",
            "value": 5
        },
        {
            "source": "Greece",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Antwerp Production",
            "target": "Finland",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Zulauf-Ryan",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "France",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Wiza LLC",
            "value": 5
        },
        {
            "source": "Antwerp Production",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "Norway",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Zieme Group",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Antwerp Production",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Hilpert and Sons",
            "value": 5
        },
        {
            "source": "Greece",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Belgium",
            "value": 5
        },
        {
            "source": "France",
            "target": "Kuhn Inc",
            "value": 5
        },
        {
            "source": "Bergnaum Inc",
            "target": "Czech Republic",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Lyon Production",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Finland",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "France",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Lyon Production",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "France",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "Bradtke-Pagac",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "Belgium",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "France",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Sweden",
            "target": "Kemmer-Pouros",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Sweden",
            "target": "Rowe Inc",
            "value": 5
        },
        {
            "source": "Belgium",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Abbott-Hintz",
            "target": "France",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp Production",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Sweden",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "Greece",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Koelpin-Pouros",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Greece",
            "value": 5
        },
        {
            "source": "Belgium",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Antwerp Production",
            "value": 5
        },
        {
            "source": "Sweden",
            "target": "Nader-Tremblay",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Netherlands",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "Czech Republic",
            "value": 5
        },
        {
            "source": "France",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Poland",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "Jacobi Group",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "Lyon Production",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "United Kingdom",
            "value": 5
        },
        {
            "source": "France",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Russel-Weber",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Portugal",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Hintz-Purdy",
            "value": 5
        },
        {
            "source": "Kling-Walker",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Antwerp Production",
            "target": "Murphy-Hirthe",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Poland",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Belgium",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Sweden",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "France",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "Shields Group",
            "value": 5
        },
        {
            "source": "Finland",
            "target": "Koelpin-Pouros",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "Antwerp Production",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Lyon Production",
            "value": 5
        },
        {
            "source": "Barrows Group",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "McKenzie-McCullough",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "Portugal",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Hungary",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Sweden",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Sawayn Group",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Greece",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Birmingham DC",
            "value": 5
        },
        {
            "source": "Lyon DC",
            "target": "Portugal",
            "value": 5
        },
        {
            "source": "Bartoletti-Stehr",
            "target": "Antwerp Production",
            "value": 5
        },
        {
            "source": "Antwerp Production",
            "target": "Wroclaw DC",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Norway",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Wroclaw Production",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Wolf Group",
            "target": "Birmingham DC",
            "value": 5
        },
        {
            "source": "Estonia",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Pollich-Boyle",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Block and Sons",
            "value": 5
        },
        {
            "source": "Wroclaw DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Goteborg DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Portugal",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "Lebsack-Wintheiser",
            "target": "Goteborg DC",
            "value": 5
        },
        {
            "source": "France",
            "target": "Lyon DC",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "Antwerp DC",
            "target": "EV Car Battery",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Wroclaw Production",
            "value": 5
        },
        {
            "source": "EV Car Battery",
            "target": "Rau and Sons",
            "value": 5
        },
        {
            "source": "Home Battery",
            "target": "Czech Republic",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Germany",
            "target": "Home Battery",
            "value": 5
        },
        {
            "source": "Gibson LLC",
            "target": "Germany",
            "value": 5
        },
        {
            "source": "Antwerp Production",
            "target": "Antwerp DC",
            "value": 5
        },
        {
            "source": "Jacobi Group",
            "target": "Portugal",
            "value": 5
        }
    ]
        };

    /* src\App.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let div;
    	let networkgraph;
    	let current;
    	networkgraph = new NetworkGraphCanvas({ props: { graph: data }, $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(networkgraph.$$.fragment);
    			attr_dev(div, "class", "chart svelte-3diudx");
    			add_location(div, file, 17, 0, 281);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(networkgraph, div, null);
    			current = true;
    		},
    		p: noop$1,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(networkgraph.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(networkgraph.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(networkgraph);
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
    	console.log(data);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ NetworkGraph: NetworkGraphCanvas, data });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
