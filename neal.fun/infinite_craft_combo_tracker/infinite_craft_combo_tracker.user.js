// ==UserScript==
// @name         infinite craft combo tracker
// @namespace    https://github.com/adrianmgg
// @version      2.0.1
// @description  tracks how you made things in infinite craft
// @author       amgg
// @match        https://neal.fun/infinite-craft/
// @icon         https://neal.fun/favicons/infinite-craft.png
// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// @compatible   chrome
// @compatible   firefox
// @license      MIT
// ==/UserScript==

// TODO test on firefox

// TODO all the ui related stuff in this could probably use some polish

(function() {
    'use strict';
    const elhelper = (function() { /* via https://github.com/adrianmgg/elhelper */
        function setup(elem, { style: { vars: styleVars = {}, ...style } = {}, attrs = {}, dataset = {}, events = {}, classList = [], children = [], parent = null, insertBefore = null, ...props }) {
            for (const k in style) elem.style[k] = style[k];
            for (const k in styleVars) elem.style.setProperty(k, styleVars[k]);
            for (const k in attrs) elem.setAttribute(k, attrs[k]);
            for (const k in dataset) elem.dataset[k] = dataset[k];
            for (const k in events) elem.addEventListener(k, events[k]);
            for (const c of classList) elem.classList.add(c);
            for (const k in props) elem[k] = props[k];
            for (const c of children) elem.appendChild(c);
            if (parent !== null) {
                if (insertBefore !== null) parent.insertBefore(elem, insertBefore);
                else parent.appendChild(elem);
            }
            return elem;
        }
        function create(tagName, options = {}) { return setup(document.createElement(tagName), options); }
        function createNS(namespace, tagName, options = {}) { return setup(document.createElementNS(namespace, tagName), options); }
        return {setup, create, createNS};
    })();
    const GM_VALUE_KEY = 'infinitecraft_observed_combos';
    // TODO this should probably use the async versions of getvalue/setvalue since we're already only calling it from async code
    function saveCombo(lhs, rhs, result) {
        console.log(`crafted ${lhs} + ${rhs} -> ${result}`);
        const data = GM_getValue(GM_VALUE_KEY, {});
        if(!(result in data)) data[result] = [];
        for(const [a, b] in data[result]) {
            if(a === lhs && b === rhs) return;
        }
        data[result].push([lhs, rhs]);
        GM_setValue(GM_VALUE_KEY, data);
    }
    function getCombos() {
        return GM_getValue(GM_VALUE_KEY, {});
    }
    function* iterCombos() {
        const data = getCombos;
        for(const result in data) {
            for(const [lhs, rhs] of data[result]) {
                yield {lhs, rhs, result};
            }
        }
    }
    function main() {
        const _getCraftResponse = icMain.getCraftResponse;
        icMain.getCraftResponse = async function(lhs, rhs) {
            const resp = await _getCraftResponse.apply(this, arguments);
            saveCombo(lhs.text, rhs.text, resp.result);
            return resp;
        };

        function mkElementItem(element) {
            return elhelper.create('div', {
                classList: ['item'],
                dataset: {'v-0e76d111': ''}, // needed b/c they use some kinda scoped css thing
                children: [
                    elhelper.create('span', {
                        classList: ['item-emoji'],
                        dataset: {'v-0e76d111': ''},
                        textContent: element.emoji,
                        style: {
                            pointerEvents: 'none',
                        },
                    }),
                    document.createTextNode(` ${element.text} `),
                ],
            });
        }

        // recipes popup
        const recipesListContainer = elhelper.create('div', {
        });
        function updateRecipesList() {
            while(recipesListContainer.firstChild !== null) recipesListContainer.removeChild(recipesListContainer.firstChild);
            // build a name -> element map
            const byName = {};
            for(const element of icMain._data.elements) byName[element.text] = element;
            const combos = getCombos();
            function listItemClick(evt) {
                const elementName = evt.target.dataset.comboviewerElement;
                document.querySelector(`[data-comboviewer-section="${CSS.escape(elementName)}"]`).scrollIntoView({block: 'nearest'});
            }
            function mkLinkedElementItem(element) {
                return elhelper.setup(mkElementItem(element), {
                    events: { click: listItemClick },
                    dataset: { comboviewerElement: element.text },
                });
            }
            for(const comboResult in combos) {
                if(comboResult === 'Nothing') continue;
                // anchor for jumping to
                recipesListContainer.appendChild(elhelper.create('div', {
                    dataset: { comboviewerSection: comboResult },
                }));
                for(const [lhs, rhs] of combos[comboResult]) {
                    recipesListContainer.appendChild(elhelper.create('div', {
                        children: [
                            mkLinkedElementItem(byName[comboResult]),
                            document.createTextNode(' = '),
                            mkLinkedElementItem(byName[lhs]),
                            document.createTextNode(' + '),
                            mkLinkedElementItem(byName[rhs]),
                        ],
                    }));
                }
            }
        }
        const recipesDialog = elhelper.create('dialog', {
            parent: document.body,
            children: [
                // close button
                elhelper.create('button', {
                    textContent: 'x',
                    events: {
                        click: (evt) => recipesDialog.close(),
                    },
                }),
                // the main content
                recipesListContainer,
            ],
            style: {
                // need to unset this one thing from the page css
                margin: 'auto',
            },
        });

        // recipes button
        elhelper.create('div', {
            parent: document.querySelector('.side-controls'),
            textContent: 'recipes',
            style: {
                cursor: 'pointer',
            },
            events: {
                click: (evt) => {
                    updateRecipesList();
                    recipesDialog.showModal();
                },
            },
        });
    }
    // stores the object where most of the infinite craft functions live.
    //  can be assumed to be set by the time main is called
    let icMain = null;
    // need to wait for stuff to be actually initialized.
    //  might be an actual thing we can hook into to detect that
    //  but for now just waiting until the function we want exists works well enough
    (function waitForReady(){
        icMain = unsafeWindow?.$nuxt?._route?.matched?.[0]?.instances?.default;
        if(icMain !== undefined && icMain !== null) main();
        else setTimeout(waitForReady, 10);
    })();
})();
