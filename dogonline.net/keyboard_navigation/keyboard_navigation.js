// ==UserScript==
// @name         dogonline keyboard navigation
// @namespace    amgg
// @version      0.4.0
// @description
// @author       amgg
// @match        https://dogonline.net/*
// @icon         https://dogonline.net/favicon.ico
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    const USERSCRIPT_STYLE_PREFIX = 'amgg__dogonlinedotnet__keyboardNav';
    const userscriptClass = (...s) => [USERSCRIPT_STYLE_PREFIX, ...s].join('__');
    GM_addStyle(`
.${userscriptClass()} * {
    color: #fff;
    font-family: mono;
    font-size: 20px;
}

.${userscriptClass(`menubar`)} {
    position: absolute;
    top: 0px;
    left: 0px;
    z-index: 999
    background-color: #000;
    color: #fff;
}

.${userscriptClass('button')} {
    border: 1px solid #fff;
    margin: 2px;
    min-width: 1em;
    min-height: 1.5em;
    padding-inline: 0.25em;
}

${Object.entries({ close: '00f', add: '0f0', delete: 'f00' }).map(([kind, hex]) => `
.${userscriptClass('button', kind)} {
    border-color: #${hex};
    color: #${hex};
}`).join('\n')}

.${userscriptClass('log')} {
	position: fixed;
	white-space: pre-wrap;
	font-family: mono;
	font-size: 0.6rem;
	top: 0px;
	right: 0px;
	width: 40em;
	height: 20em;
	background-color: #000;
	color: #fff;
	opacity: 0.75;
	overflow-y: scroll;
	text-indent: 2em hanging;
}
.${userscriptClass('log')} > * {
    font-size: inherit; font-family: inherit; color: inherit;
 }
`);

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
        button(textContent, kind, description, click, { events, ...props } = {}) {
            description ??= textContent;
            kind ??= 'plain';
            return elhelper.create('button', {
                ...props,
                type: 'button',
                classList: [userscriptClass('button'), userscriptClass('button', kind)],
                textContent,
                title: description,
                ariaRole: description,
                events: {
                    ...events,
                    click,
                },
            });
        },
    };

    const storage = (() => {
        const PREFIX = "amgg__dogonlinedotnet__keyboardNav";
        const all_used_storage_keys = [];
        class Item {
            constructor(key, defaultValue) {
                this.key = key;
                this.defaultValue = defaultValue;
                this._cached = null;
                this._cacheDirty = true;
                all_used_storage_keys.push(this._fullKey);
            }
            get _fullKey() { return `${PREFIX}__${this.key}`; }
            _get() {
                this._cached = GM_getValue(this._fullKey, this.defaultValue);
                this._cacheDirty = false;
                log?.log?.(`loaded : storage -> ${this.key} : ${JSON.stringify(this._cached)}`);
            }
            _set(newValue) {
                log?.log?.(`saving : storage <- ${this.key} : ${JSON.stringify(newValue)}`);
                GM_setValue(this._fullKey, newValue);
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
        function clearAll() {
            for(const key of all_used_storage_keys) {
                GM_deleteValue(key);
            }
        }
        return { Item, clearAll };
    })();
    GM_registerMenuCommand('clear stored settings', () => {
        storage.clearAll();
        window.location.reload();
    });

    const log = (() => {
        const MAX_LOG_LINES = 200;
        const elt = elhelper.create('div', { classList: [userscriptClass('log')] });
        let prevMsg = null; let prevMsgRepeatCountNode = null; let repeatCount = 1;
        function log(msg) {
            console.log(msg);
            if(prevMsg === msg) {
                prevMsgRepeatCountNode.nodeValue = ` (x${++repeatCount})`;
            } else {
                prevMsg = msg;
                repeatCount = 1;
                elhelper.create('div', {
                    parent: elt,
                    children: [
                        new Text(msg),
                        prevMsgRepeatCountNode=new Text(''),
                    ],
                });
                // elt.appendChild(new Text(`> ${String(msg)}\n`));
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

    const predicate = {
        textContent(...strs) { return e => strs.some(s => e.textContent === s); }
    };


    const action2buttonSelector = {
        yes: [
            // confirm quitting
            { selector: mangle`${'Dialog_overlay'} ${'Button_danger'}`, predicate: predicate.textContent('Leave!') },
            { selector: mangle`${'tower_tuiPlayerRowButtons'} ${'Button_button'}${'Button_primary'}`, predicate: predicate.textContent('Open Chest', 'Drink') },
            { selector: mangle`${'tower_tuiPlayerRowButtons'} ${'Button_button'}${'Button_neutral'}`, predicate: predicate.textContent('Continue') },
            { selector: mangle`${'tower_tuiCutscene'} ${'Button_button'}`, predicate: predicate.textContent('Skip Cutscene') },
            // start
            mangle`${'tower_enterTowerBtn'}`,
            //
            { selector: mangle`${'tower_enterTowerBtns'} ${'Button_button'}`, predicate: predicate.textContent('Enter the Tower!') },
        ],
        // advance combat
        advance: [
            mangle`${'tower_tuiTextbox'} ${'tower_textboxNextArrow'}`,
        ],
        no: [
            // decline fountain for now
            { selector: mangle`${'tower_tuiPlayerRowButtons'} ${'Button_button'}${'Button_neutral'}`, predicate: predicate.textContent('Leave') },
            // cancel quitting
            { selector: mangle`${'Dialog_overlay'} ${'Button_neutral'}`, predicate: predicate.textContent('Cancel') },
            //
            { selector: mangle`${'tower_tuiButtonsSection2'} > ${'Button_danger'}`, predicate: predicate.textContent('Leave the Tower') },
            { selector: mangle`${'tower_enterTowerBtns'} ${'Button_button'}`, predicate: predicate.textContent('← Back to Icy Cliffs') },
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
        Numpad7: ['action1', 'advance'],
        Numpad9: ['action2', 'advance'],
        Numpad1: ['action3', 'advance'],
        Numpad3: ['action4', 'advance'],
        Numpad5: ['advance', 'yes'],
        Numpad0: ['no'],
    };
    const bindings = new storage.Item('keybinds', DEFAULT_BINDINGS);

    function keybindsUI() {
        function actionDropdown(initial) {
            return elhelper.create('select', {
                style: { fontFamily: 'unset' },
                events: {
                    input() { refresh(); },
                    change() { refresh(); },
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
                const code = tr.childNodes[0].childNodes[0].value;
                const actions = [...tr.childNodes[1].querySelectorAll(':scope > select')].map(s => s.value);
                return [code, actions];
            }));
        }

        function mkKeybindsRow(key, actions) {
            let thisKeybindRow, actionDropdownsBox;
            return thisKeybindRow = ui.simple.tr(
                ui.simple.td(elhelper.create('input', {
                    type: 'text', value: key,
                    style: { fontFamily: 'unset' },
                    events: {
                        input() { refresh(); },
                        change() { refresh(); },
                    },
                })),
                actionDropdownsBox = ui.simple.td(...actions.map(actionDropdown)),
                ui.simple.td(ui.button('+', 'add', 'add another action to this keybind', () => {
                    actionDropdownsBox.appendChild(actionDropdown(ALL_ACTION_TYPES[0]));
                    refresh();
                })),
                ui.simple.td(ui.button('-', 'delete', 'remove an action from this keybind', () => {
                    if(actionDropdownsBox.childNodes.length >= 2) actionDropdownsBox.removeChild(actionDropdownsBox.lastChild);
                    else thisKeybindRow.parentElement.removeChild(thisKeybindRow);
                    refresh();
                })),
            );
        }

        return elhelper.create('table', {
            children: [
                keybindsTbody = ui.view(
                    'tbody',
                    ([key, actions]) => mkKeybindsRow(key, actions),
                    Object.entries(bindings.value)
                ),
                ui.simple.tfoot(ui.simple.tr(ui.button('+', 'add', 'add another keybind', () => {
                    keybindsTbody.appendChild(mkKeybindsRow('', [ALL_ACTION_TYPES[0]]));
                    refresh();
                }))),
            ],
        });
    }

    const keybindsModal = elhelper.create('dialog', {
        parent: document.body,
        classList: [USERSCRIPT_STYLE_PREFIX],
        children: [
            ui.button('x', 'close', 'close', () => { keybindsModal.close(); }),
            keybindsUI(),
            elhelper.create('div', {
                textContent: `\
Each keybind maps a key to one or more actions. If multiple actions are chosen, then the second action is only attempted if the first action wasn't relevant here, then the third, and so on until it reaches an action can be done at which point the remaining actions are ignored.`,
                style: { width: '30em' },
            }),
        ],
    });
    function toggleKeybindsMenu() {
        if(keybindsModal.open) keybindsModal.close();
        else keybindsModal.showModal();
    }


    elhelper.create('div', {
        parent: document.body,
        classList: [USERSCRIPT_STYLE_PREFIX, userscriptClass`menubar`],
        children: [
            ui.button('\u2699\ufe0e keybinds', null, 'open keybinds menu', () => { toggleKeybindsMenu(); }),
            ui.button('\u2261 log', null, 'toggle log display', () => { log.toggleVisibility(); }),
        ],
    });



    document.documentElement.addEventListener('keydown', e => {
        if(window.location.pathname !== '/tower') return;
        if(e.altKey || e.ctrlKey || e.metaKey) return;
        // when specific elements focused we don't want to do this stuff
        if(e.target !== document.body) return;

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
                // console.log(selector, predicate);
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
