// ==UserScript==
// @name         dogonline keyboard navigation
// @namespace    amgg
// @version      0.1.0
// @description
// @author       amgg
// @match        https://dogonline.net/*
// @icon         https://dogonline.net/favicon.ico
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';

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

    const log = (() => {
        const MAX_LOG_LINES = 200;
        const elt = document.createElement('div');
        Object.assign(elt.style, {
            position: 'fixed',
            whiteSpace: 'pre-wrap',
            fontFamily: 'mono', fontSize: '.6rem',
            top: '0px', right: '0px',
            width: '40em', height: '20em',
            backgroundColor: '#000', color: '#fff',
            opacity: 0.75,
            overflowY: 'scroll',
        });
        document.body.appendChild(elt);
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
        function open() {} // TOOD
        function close() {}
        return { log, open, close };
    })();

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
    const bindings = {
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

    document.documentElement.addEventListener('keydown', e => {
        if(e.altKey || e.ctrlKey || e.metaKey) return;
        log.log(`${e.code} => ${bindings[e.code]}`);
        // console.log(e.code, '=>', bindings[e.code]);
        if(e.code in bindings) {
            // const actions = action2buttonSelector[bindings[e.code]];
            const actions = bindings[e.code].flatMap(action => action2buttonSelector[action]);
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
