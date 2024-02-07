// ==UserScript==
// @name         infinite craft tweaks
// @namespace    https://github.com/adrianmgg
// @version      3.0.0
// @description  recipe tracking + other various tweaks for infinite craft
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
    const GM_DATAVERSION_KEY = 'infinitecraft_data_version';
    const GM_DATAVERSION_LATEST = 1;
    // TODO this should probably use the async versions of getvalue/setvalue since we're already only calling it from async code
    function saveCombo(lhs, rhs, result) {
        console.log(`crafted ${lhs} + ${rhs} -> ${result}`);
        const data = getCombos();
        if(!(result in data)) data[result] = [];
        const sortedLhsRhs = sortRecipeIngredients([lhs, rhs]);
        for(const existingPair of data[result]) {
            if(sortedLhsRhs[0] === existingPair[0] && sortedLhsRhs[1] === existingPair[1]) return;
        }
        const pair = [lhs, rhs];
        pair.sort();
        data[result].push(pair);
        GM_setValue(GM_VALUE_KEY, data);
        GM_setValue(GM_VALUE_KEY, GM_DATAVERSION_LATEST);
    }
    // !! this sorts in-place !!
    function sortRecipeIngredients(components) {
        // internally the site uses localeCompare() but that being locale-specific could cause some problems in our use case
        //  it shouldn't matter though, since as long as we give these *some* consistent order it'll avoid duplicates,
        //  that order doesn't need to be the same as the one the site uses
        return components.sort();
    }
    function getCombos() {
        const data = GM_getValue(GM_VALUE_KEY, {});
        const dataVersion = GM_getValue(GM_DATAVERSION_KEY, 0);
        if(dataVersion > GM_DATAVERSION_LATEST) {
            // uh oh
            // not gonna even try to handle this case, just toss up an error alert
            const msg = `infinite craft tweaks userscript's internal save data was marked as version ${dataVersion}, but the highest expected version was ${GM_DATAVERSION_LATEST}.
if you've downgraded the userscript or copied save data from someone else, update the userscript and try again. otherwise, please file a bug report at https://github.amgg.gg/userscripts/issues`;
            alert(msg);
            throw new Error(msg);
        }
        if(dataVersion < GM_DATAVERSION_LATEST) {
            // confirm that user wants to update save data
            const updateConfirm = confirm(`infinite craft tweaks userscript's internal save data is from an earlier version, and needs to be upgraded. (if you select cancel, userscript will be non-functional, so this choice is mostly for if you want to take a moment to manually back up the data just in case.)

proceed with upgrading save data?`);
            if(!updateConfirm) {
                throw new Error('user chose not to update save data');
            }
            // upgrade the data
            if(dataVersion <= 0) {
                // recipes in this version weren's sorted, and may contain duplicates once sorting has been applied
                for(const result in data) {
                    // sort the recipes (just do it in place, since we're not gonna use the old data again
                    for(const recipe of data[result]) {
                        sortRecipeIngredients(recipe);
                    }
                    // build new list with just the ones that remain not duplicate
                    const newRecipesList = [];
                    for(const recipe of data[result]) {
                        if(!(newRecipesList.some(r => recipe[0] === r[0] && recipe[1] === r[1]))) {
                            newRecipesList.push(recipe);
                        }
                    }
                    data[result] = newRecipesList;
                }
            }
            // now that it's upgraded, save the upgraded data & update the version
            GM_setValue(GM_VALUE_KEY, data);
            GM_setValue(GM_DATAVERSION_KEY, GM_DATAVERSION_LATEST);
            // (fall through to retun below)
        }
        // the data is definitely current now
        return data;
    }
    function main() {
        const _getCraftResponse = icMain.getCraftResponse;
        const _selectElement = icMain.selectElement;
        icMain.getCraftResponse = async function(lhs, rhs) {
            const resp = await _getCraftResponse.apply(this, arguments);
            saveCombo(lhs.text, rhs.text, resp.result);
            return resp;
        };

        // random element thing
        document.documentElement.addEventListener('mousedown', e => {
            if(e.buttons === 1 && e.altKey && !e.shiftKey) { // left mouse + alt
                e.preventDefault();
                e.stopPropagation();
                const elements = icMain._data.elements;
                const randomElement = elements[Math.floor(Math.random() * elements.length)];
                _selectElement(e, randomElement);
            } else if(e.buttons === 1 && !e.altKey && e.shiftKey) { // lmb + shift
                e.preventDefault();
                e.stopPropagation();
                const instances = icMain._data.instances;
                const lastInstance = instances[instances.length - 1];
                const lastInstanceElement = icMain._data.elements.filter(e => e.text === lastInstance.text)[0];
                _selectElement(e, lastInstanceElement);
            }
        }, {capture: false});

        // get the dataset thing they use for scoping css stuff
        // TODO add some better handling for if there's zero/multiple dataset attrs on that element in future
        const cssScopeDatasetThing = Object.keys(icMain.$el.dataset)[0];

        function mkElementItem(element) {
            return elhelper.create('div', {
                classList: ['item'],
                dataset: {[cssScopeDatasetThing]: ''},
                children: [
                    elhelper.create('span', {
                        classList: ['item-emoji'],
                        dataset: {[cssScopeDatasetThing]: ''},
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
            function getByName(name) { return byName[name] ?? {emoji: "❌", text: `[userscript encountered an error trying to look up element '${name}']`}; }
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
                            mkLinkedElementItem(getByName(comboResult)),
                            document.createTextNode(' = '),
                            mkLinkedElementItem(getByName(lhs)),
                            document.createTextNode(' + '),
                            mkLinkedElementItem(getByName(rhs)),
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
        function addControlsButton(label, handler) {
            elhelper.create('div', {
                parent: document.querySelector('.side-controls'),
                textContent: label,
                style: {
                    cursor: 'pointer',
                },
                events: {
                    click: handler,
                },
            });
        }
        addControlsButton('recipes', () => {
            recipesDialog.showModal();
            updateRecipesList();
        });

        // first discoveries list (just gonna hijack the recipes popup for simplicity)
        addControlsButton('discoveries', () => {
            while(recipesListContainer.firstChild !== null) recipesListContainer.removeChild(recipesListContainer.firstChild);
            elhelper.setup(recipesListContainer, {
                children: icMain._data.elements.filter(e => e.discovered).map(mkElementItem),
            });
            recipesDialog.showModal();
        });

        // pinned combos thing
        const sidebar = document.querySelector('.container > .sidebar');
        const pinnedCombos = elhelper.create('div', {
            parent: sidebar,
            insertBefore: sidebar.firstChild,
            style: {
                position: 'sticky',
                top: '0',
                background: 'white',
                width: '100%',
                maxHeight: '50%',
                overflowY: 'auto',
            },
        });
        icMain.selectElement = function(mouseEvent, element) {
            if(mouseEvent.buttons === 4 || (mouseEvent.buttons === 1 && mouseEvent.altKey && !mouseEvent.shiftKey)) {
                // this won't actually stop it since what gets passed into this is a mousedown event
                mouseEvent.preventDefault();
                mouseEvent.stopPropagation();
                // this isnt a good variable name but it's slightly funny and sometimes that's all that matters
                const elementElement = mkElementItem(element);
                elhelper.setup(elementElement, {
                    parent: pinnedCombos,
                    events: {
                        mousedown: (e) => {
                            if(e.buttons === 4 || (e.buttons === 1 && e.altKey && !e.shiftKey)) {
                                pinnedCombos.removeChild(elementElement);
                                return;
                            }
                            icMain.selectElement(e, element);
                        },
                    },
                });
                return;
            }
            return _selectElement.apply(this, arguments);
        };
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
