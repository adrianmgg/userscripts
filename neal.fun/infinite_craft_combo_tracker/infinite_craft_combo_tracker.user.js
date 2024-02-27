// ==UserScript==
// @name         infinite craft tweaks
// @namespace    https://github.com/adrianmgg
// @version      3.3.2
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

    class GMValue {
        constructor(key, defaultValue) {
            this._key = key;
            this._defaultValue = defaultValue;
        }
        set(value) {
            GM_setValue(this._key, value);
        }
        get() {
            return GM_getValue(this._key, this._defaultValue);
        }
    }

    const VAL_COMBOS = new GMValue('infinitecraft_observed_combos', {});
    const VAL_PINNED_ELEMENTS = new GMValue('infinitecraft_pinned_elements', []);
    const VAL_DATA_VERSION = new GMValue('infinitecraft_data_version', 0);
    // TODO rename this?
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
        VAL_COMBOS.set(data);
        VAL_DATA_VERSION.set(GM_DATAVERSION_LATEST);
    }
    // !! this sorts in-place !!
    function sortRecipeIngredients(components) {
        // internally the site uses localeCompare() but that being locale-specific could cause some problems in our use case
        //  it shouldn't matter though, since as long as we give these *some* consistent order it'll avoid duplicates,
        //  that order doesn't need to be the same as the one the site uses
        return components.sort();
    }
    function getCombos() {
        const data = VAL_COMBOS.get();
        const dataVersion = VAL_DATA_VERSION.get();
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
                // recipes in this version weren't sorted, and may contain duplicates once sorting has been applied
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
            VAL_COMBOS.set(data);
            VAL_DATA_VERSION.set(GM_DATAVERSION_LATEST);
            // (fall through to retun below)
        }
        // the data is definitely current now
        return data;
    }
    function main() {
        const _getCraftResponse = icMain.getCraftResponse;
        const _selectElement = icMain.selectElement;
        const _selectInstance = icMain.selectInstance;
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

        // special search handlers
        const searchHandlers = {
            'regex:': (txt) => {
                const pattern = new RegExp(txt);
                return (element) => pattern.test(element.text);
            },
            'regexi:': (txt) => {
                const pattern = new RegExp(txt, 'i');
                return (element) => pattern.test(element.text);
            },
            'full:': (txt) => {
                return (element) => element.text === txt;
            },
            'fulli:': (txt) => {
                const lower = txt.toLowerCase();
                return (element) => element.text.toLowerCase() === lower;
            },
        };
        const _sortedElements__get = icMain?._computedWatchers?.sortedElements?.getter;
        // if that wasn't where we expected it to be, don't try to patch it
        if(_sortedElements__get !== null && _sortedElements__get !== undefined) {
            icMain._computedWatchers.sortedElements.getter = function() {
                for(const handlerPrefix in searchHandlers) {
                    if(this.searchQuery && this.searchQuery.startsWith(handlerPrefix)) {
                        try {
                            const filter = searchHandlers[handlerPrefix](this.searchQuery.substr(handlerPrefix.length));
                            let elements = this.elements;
                            // discovered filter is cheap, do it early to avoid unnecessary work later
                            if(this.showDiscoveredOnly) { elements = elements.filter(el => el.discovered); }
                            // do the actual filter
                            elements = elements.filter(filter);
                            // sort after all the filtering is done - doesn't change the result but there's no use sorting what we're not gonna see
                            // `elements` is already the result of a `.filter()` call, so sorting `elements` in-place here shouldn't modify the underlying data
                            // (sort functions are grabbed directly from the minified page source)
                            if(this?.sortBy === 'name') {
                                elements = elements.sort((function(a,b){return a.text.localeCompare(b.text)}));
                            } else if(this?.sortBy === 'emoji') {
                                elements = elements.sort((function(a,b){var e=a.emoji||"⬜",t=b.emoji||"⬜";return e.localeCompare(t)}));
                            }
                            return elements;
                        } catch(err) {
                            console.error(`error during search handler '${handlerPrefix}'`, err);
                            return [];
                        }
                    }
                }
                return _sortedElements__get.apply(this, arguments);
            }
        }

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

        /* this will call genFn and iterate all the way through it,
           but taking a break every chunkSize iterations to allow rendering and stuff to happen.
           returns a promise. */
        function nonBlockingChunked(chunkSize, genFn, timeout = 0) {
            return new Promise((resolve, reject) => {
                const gen = genFn();
                (function doChunk() {
                    for(let i = 0; i < chunkSize; i++) {
                        const next = gen.next();
                        if(next.done) {
                            resolve();
                            return;
                        }
                    }
                    setTimeout(doChunk, timeout);
                })();
            });
        }

        // recipes popup
        const recipesListContainer = elhelper.create('div', {
        });
        function clearRecipesDialog() {
            while(recipesListContainer.firstChild !== null) recipesListContainer.removeChild(recipesListContainer.firstChild);
        }
        const recipesDialog = elhelper.create('dialog', {
            // needs to be added to this element or a child of it, since the color scheme css is scoped to there
            parent: document.querySelector('.container'),
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
                // make it work with dark mode
                background: 'var(--sidebar-bg)',
                // need to unset this one thing from the page css
                margin: 'auto',
                // unset default dialog style `color: canvastext` since it prevents the dark mode css from cascading down to our dialog
                color: 'unset',
            },
            events: {
                close: (e) => {
                    clearRecipesDialog();
                },
            },
        });
        async function openRecipesDialog(childGenerator) {
            clearRecipesDialog();
            // create a child to add to for just this call,
            //  as a lazy fix for the bug we'd otherwise have where opening a menu, quickly closing it, then opening it again
            //  would lead to the old menu's task still adding stuff to the new menu.
            //  (this doesn't actually stop any unnecessary work, but it at least prevents the possible visual bugs)
            const container = elhelper.create('div', {parent: recipesListContainer});
            // show the dialog
            recipesDialog.showModal();
            // populate the dialog
            await nonBlockingChunked(512, function*() {
                for(const child of childGenerator()) {
                    container.appendChild(child);
                    yield;
                }
            });
        }

        // recipes button
        function addControlsButton(label, handler) {
            elhelper.create('div', {
                parent: document.querySelector('.side-controls'),
                textContent: label,
                style: {
                    cursor: 'pointer',
                    // because they invert the section containing these elements for dark mode, we need to explicitly NOT change color for dark mode
                    color: '#040404',
                },
                events: {
                    click: handler,
                },
            });
        }

        addControlsButton('recipes', () => {
            // build a name -> element map
            const byName = {};
            const byNameLower = {}; // for fallback stuff
            for(const element of icMain._data.elements) {
                byName[element.text] = element;
                byNameLower[element.text.toLowerCase()] = element;
            }
            function getByName(name) {
                // first, try grabbing it by its exact name
                const fromNormal = byName[name];
                if(fromNormal !== undefined) {
                    return byName[name];
                }
                // if that doesn't do it, try that but ignoring case.
                //  i think it doesn't accept new elements if they're case-insensitive equal to an element the user already has? or something like that at least
                const fromLower = byNameLower[name.toLowerCase()];
                if(fromLower !== undefined) {
                    return fromLower;
                }
                // worst case, we have neither
                return {emoji: "❌", text: `[userscript encountered an error trying to look up element '${name}']`};
            }
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
            openRecipesDialog(function*(){
                for(const comboResult in combos) {
                    if(comboResult === 'Nothing') continue;
                    // anchor for jumping to
                    yield elhelper.create('div', {
                        dataset: { comboviewerSection: comboResult },
                    });
                    for(const [lhs, rhs] of combos[comboResult]) {
                        yield elhelper.create('div', {
                            children: [
                                mkLinkedElementItem(getByName(comboResult)),
                                document.createTextNode(' = '),
                                mkLinkedElementItem(getByName(lhs)),
                                document.createTextNode(' + '),
                                mkLinkedElementItem(getByName(rhs)),
                            ],
                        });
                    }
                }
            });
        });

        // first discoveries list (just gonna hijack the recipes popup for simplicity)
        addControlsButton('discoveries', () => {
            openRecipesDialog(function*() {
                for(const element of icMain._data.elements) {
                    if(element.discovered) {
                        yield mkElementItem(element);
                    }
                }
            });
        });

        // pinned combos thing
        const sidebar = document.querySelector('.container > .sidebar');
        const pinnedCombos = elhelper.create('div', {
            parent: sidebar,
            insertBefore: sidebar.firstChild,
            style: {
                position: 'sticky',
                top: '0',
                background: 'var(--sidebar-bg)',
                width: '100%',
                maxHeight: '50%',
                overflowY: 'auto',
                borderBottom: '1px solid var(--border-color)',
            },
        });
        // !! does NOT save it to pins list
        function addPinnedElementInternal(element) {
            // this isnt a good variable name but it's slightly funny and sometimes that's all that matters
            const elementElement = mkElementItem(element);
            const txt = element.text;
            elhelper.setup(elementElement, {
                parent: pinnedCombos,
                events: {
                    mousedown: (e) => {
                        if(e.buttons === 4 || (e.buttons === 1 && e.altKey && !e.shiftKey)) {
                            pinnedCombos.removeChild(elementElement);
                            const pins = VAL_PINNED_ELEMENTS.get();
                            VAL_PINNED_ELEMENTS.set(pins.filter(p => p !== txt));
                            return;
                        }
                        icMain.selectElement(e, element);
                    },
                },
            });
        }
        // does save it to pins list also
        function addPinnedElement(element) {
            const pins = VAL_PINNED_ELEMENTS.get();
            if(!(pins.some(p => p === element.text))) { // no duplicates
                addPinnedElementInternal(element);
                pins.push(element.text);
                VAL_PINNED_ELEMENTS.set(pins);
            }
        }
        icMain.selectElement = function(mouseEvent, element) {
            if(mouseEvent.buttons === 4 || (mouseEvent.buttons === 1 && mouseEvent.altKey && !mouseEvent.shiftKey)) {
                // this won't actually stop it since what gets passed into this is a mousedown event
                mouseEvent.preventDefault();
                mouseEvent.stopPropagation();
                addPinnedElement(element);
                return;
            }
            return _selectElement.apply(this, arguments);
        };
        icMain.selectInstance = function(mouseEvent, instance) {
            // specifically don't do alt-lmb alias for instances, since it ends up being accidentally set off a bunch by the alt-drag random element feature
            if(mouseEvent.buttons === 4) {
                // this won't actually stop it since what gets passed into this is a mousedown event
                mouseEvent.preventDefault();
                mouseEvent.stopPropagation();
                addPinnedElement({text: instance.text, emoji: instance.emoji});
                return;
            }
            return _selectInstance.apply(this, arguments);
        };
        // load initial pinned elements
        (() => {
            const existingPins = VAL_PINNED_ELEMENTS.get();
            for(const pin of existingPins) {
                const pinElement = icMain._data.elements.find(e => e.text === pin);
                if(pinElement !== undefined) {
                    addPinnedElementInternal(pinElement);
                }
            }
        })();
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
