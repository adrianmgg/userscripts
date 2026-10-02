// ==UserScript==
// @name         dogonline keyboard navigation
// @namespace    amgg
// @version      0.2.0
// @description
// @author       amgg
// @match        https://dogonline.net/*
// @icon         https://dogonline.net/favicon.ico
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    /* elhelper by amgg. MIT license. via github.com/adrianmgg/elhelper */
    const elhelper=(function(){function setup(elem,{style:{vars:styleVars={},...style}={},attrs={},dataset={},events={},classList=[],children=[],parent=null,insertBefore=null,...props}){for(const k in style){elem.style[k]=style[k]}for(const k in styleVars){elem.style.setProperty(k,styleVars[k])}for(const k in attrs){elem.setAttribute(k,attrs[k])}for(const k in dataset){elem.dataset[k]=dataset[k]}for(const k in events){elem.addEventListener(k,events[k])}for(const c of classList){elem.classList.add(c)}for(const k in props){elem[k]=props[k]}for(const c of children){elem.appendChild(c)}if(parent!==null){if(insertBefore!==null){parent.insertBefore(elem,insertBefore)}else{parent.appendChild(elem)}}return elem}function create(tagName,options={}){return setup(document.createElement(tagName),options)}function createNS(namespace,tagName,options={}){return setup(document.createElementNS(namespace,tagName),options)}return{setup,create,createNS}})();

    const ui = {
        // dropdown(choices, { default:defaultChoice = null, multiselect = false } = {}) {
        //     const el = elhelper.create('select', {
        //     });
        // },
        view(rootTagName, mkrow, arr, options = {}) {
            return elhelper.create(rootTagName, {
                ...options,
                children: arr.map(mkrow),
            });
        },
        simple: new Proxy({}, {
            get(_target, prop, _reciever) {
                return function(...children) {
                    return elhelper.create(prop, { children });
                };
            },
        }),
    };

    const storage = (() => {
        const PREFIX = "amgg__dogonlinedotnet__keyboardNav";
        class Item {
            constructor(key, defaultValue) {
                this.key = key;
                this.defaultValue = defaultValue;
                this._cached = null;
                this._cacheDirty = true;
            }
            _get() {
                this._cached = GM_getValue(`${PREFIX}__${this.key}`, this.defaultValue);
                this._cacheDirty = false;
                log?.log?.(`loaded : storage -> ${this.key} : ${JSON.stringify(this._cached)}`);
            }
            _set(newValue) {
                log?.log?.(`saving : storage <- ${this.key} : ${JSON.stringify(newValue)}`);
                GM_setValue(`${PREFIX}__${this.key}`, newValue);
            }
            get value() {
                if(this._cacheDirty) this._get();
                return this._cached;
            }
            set value(newValue) {
                this._set(newValue);
                this._cacheDirty = false;
                this._cached = newValue;
            }
            tarnish() {
                this._cacheDirty = true;
                // TODO can prolly skip this
                this._get();
            }
        }
        return { Item };
    })();

    const log = (() => {
        const MAX_LOG_LINES = 200;
        const elt = elhelper.create('div', {
            style: {
                position: 'fixed',
                whiteSpace: 'pre-wrap',
                fontFamily: 'mono', fontSize: '.6rem',
                top: '0px', right: '0px',
                width: '40em', height: '20em',
                backgroundColor: '#000', color: '#fff',
                opacity: 0.75,
                overflowY: 'scroll',
            },
        });
        let prevMsg = null; let repeatCount = 1;
        function log(msg) {
            console.log(msg);
            if(prevMsg === msg) {
                elt.lastChild.textContent = `> ${String(prevMsg)} (${++repeatCount})\n`;
            } else {
                prevMsg = msg;
                repeatCount = 1;
                elt.appendChild(new Text(`> ${String(msg)}\n`));
                while(elt.childNodes.length > MAX_LOG_LINES) elt.removeChild(elt.firstChild);
            }
            elt.scrollTop = elt.scrollHeight;
        }
        function toggleVisibility() {
            if(elt.parentElement === null) document.body.appendChild(elt);
            else document.body.removeChild(elt);
        }
        return { log, toggleVisibility };
    })();

    GM_registerMenuCommand('log', () => { log.toggleVisibility(); });

    // https://www.youtube.com/watch?v=NPwyyjtxlzU
    function mangle(strs, ...classes) {
        let ret = strs[0];
        for(let i = 0; i < classes.length; i++) {
            const cls = classes[i];
            ret += `:is([class^="${cls}__"], [class*=" ${cls}__"])`;
            ret += strs[i+1];
        }
        return ret;
    }


    const action2buttonSelector = {
        yes: [
            // TODO improve that one now that we support predicates
            // confirm quitting
            { selector: mangle`${'Dialog_overlay'} ${'Button_danger'}`, predicate: e => e.textContent === 'Leave!' },
            { selector: mangle`${'tower_tuiPlayerRowButtons'} ${'Button_button'}`, predicate: e => e.textContent === 'Open Chest' },
            { selector: mangle`${'tower_tuiPlayerRowButtons'} ${'Button_button'}`, predicate: e => e.textContent === 'Continue' },
            // start
            mangle`${'tower_enterTowerBtn'}`,
            // textbox
            mangle`${'tower_tuiTextbox'} ${'tower_textboxNextArrow'}`,
            //
            { selector: mangle`${'tower_enterTowerBtns'} ${'Button_button'}`, predicate: e => e.textContent === 'Enter the Tower!' },
        ],
        no: [
            // cancel quitting
            { selector: mangle`${'Dialog_overlay'} ${'Button_neutral'}`, predicate: e => e.textContent === 'Cancel' },
            //
            { selector: mangle`${'tower_tuiButtonsSection2'} > ${'Button_danger'}`, predicate: e => e.textContent === 'Leave the Tower' },
        ],
        up: [mangle`${'tower_dirBtn'}${'tower_btnUp'}`],
        down: [mangle`${'tower_dirBtn'}${'tower_btnDown'}`],
        left: [mangle`${'tower_dirBtn'}${'tower_btnLeft'}`],
        right: [mangle`${'tower_dirBtn'}${'tower_btnRight'}`],
        action1: [mangle`${'tower_tuiCombatItems'} > ${'tower_combatCell'}:nth-child(1)`],
        action2: [mangle`${'tower_tuiCombatItems'} > ${'tower_combatCell'}:nth-child(2)`],
        action3: [mangle`${'tower_tuiCombatItems'} > ${'tower_combatCell'}:nth-child(3)`],
        action4: [mangle`${'tower_tuiCombatItems'} > ${'tower_combatCell'}:nth-child(4)`],
    };

    const ALL_ACTION_TYPES = Object.keys(action2buttonSelector);

    const DEFAULT_BINDINGS = {
        Numpad8: ['up'],
        Numpad2: ['down'],
        Numpad4: ['left'],
        Numpad6: ['right'],
        Numpad7: ['action1', 'yes'],
        Numpad9: ['action2', 'yes'],
        Numpad1: ['action3', 'yes'],
        Numpad3: ['action4', 'yes'],
        Numpad5: ['yes'],
        Numpad0: ['no'],
    };
    const bindings = new storage.Item('keybinds', DEFAULT_BINDINGS);

    function keybindsUI() {
        function actionDropdown(initial) {
            return elhelper.create('select', {
                style: { fontFamily: 'unset' },
                events: {
                    input() { bindings.tarnish(); },
                    change() { bindings.tarnish(); },
                },
                children: ALL_ACTION_TYPES.map(a => elhelper.create('option', {
                    selected: initial === a,
                    textContent: a,
                    label: a,
                })),
            });
        }

        let keybindsTbody;
        function refresh() {
            bindings.value = Object.fromEntries([...keybindsTbody.querySelectorAll(':scope > tr')].map(tr => {
                const code = tr.childNodes[0].textContent;
                const actions = [...tr.childNodes[1].querySelectorAll(':scope > select')].map(s => s.value);
                return [code, actions];
            }));
        }

        function mkKeybindsRow(key, actions) {
            let thisKeybindRow, actionDropdownsBox;
            return thisKeybindRow = ui.simple.tr(
                ui.simple.td(new Text(key)),
                actionDropdownsBox = ui.simple.td(...actions.map(actionDropdown)),
                ui.simple.td(elhelper.create('button', {
                    textContent: '+',
                    classList: ['Button_button__aJ0V6', 'Button_neutral__3MKB9'],
                    events: { click() {
                        actionDropdownsBox.appendChild(actionDropdown(ALL_ACTION_TYPES[0]));
                        refresh();
                    } },
                })),
                ui.simple.td(elhelper.create('button', {
                    textContent: '-',
                    classList: ['Button_button__aJ0V6', 'Button_danger__4QObZ'], // FIXME this'll probably break after some site changes
                    events: { click() {
                        if(actionDropdownsBox.childNodes.length !== null) actionDropdownsBox.removeChild(actionDropdownsBox.lastChild);
                        else thisKeybindRow.parentElement.removeChild(thisKeybindRow);
                        refresh();
                    } },
                })),
            );
        }

        elhelper.create('table', {
            parent: document.body,
            children: [
                keybindsTbody = ui.view(
                    'tbody',
                    ([key, actions]) => mkKeybindsRow(key, actions),
                    Object.entries(bindings.value)
                ),
            ],
        });
    }
    // keybindsUI();
    setTimeout(() => keybindsUI(), 1000);


    document.documentElement.addEventListener('keydown', e => {
        if(window.location.pathname !== '/tower') return;
        if(e.altKey || e.ctrlKey || e.metaKey) return;
        log.log(`${e.code} => ${bindings.value[e.code]}`);
        // console.log(e.code, '=>', bindings[e.code]);
        if(e.code in bindings.value) {
            // const actions = action2buttonSelector[bindings[e.code]];
            const actions = bindings.value[e.code].flatMap(action => action2buttonSelector[action]);
            let didAction = false;
            outer: for(const action of actions) {
                let selector, predicate;
                if(action.constructor === String) { selector = action; predicate = () => true; }
                else { ({ selector, predicate } = action); }
                console.log(selector, predicate);

                for(const candidate of document.querySelectorAll(selector)) {
                    if(candidate === null || candidate === undefined) continue;
                    if(!predicate(candidate)) continue;
                    if(!(candidate.checkVisibility() ?? true)) continue;
                    const style = window.getComputedStyle(candidate);
                    if(style.pointerEvents === 'none') continue;
                    candidate.click();
                    didAction = true;
                    // log.log(`matched action ${action}`);
                    break outer;
                }
            }
            if(didAction) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
        }
    });
})();
