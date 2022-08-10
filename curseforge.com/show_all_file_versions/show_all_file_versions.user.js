// ==UserScript==
// @name         show all file version tags
// @namespace    https://github.com/adrianmgg
// @version      1.0.0
// @description  show all the versions listed for a file, rather than hiding them behind a +2 thing you need to hover over
// @author       amgg
// @match        https://www.curseforge.com/minecraft/mc-mods/*/files
// @match        https://www.curseforge.com/minecraft/mc-mods/*/files/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=curseforge.com
// @grant        unsafeWindow
// @run-at       document-start
// @license      MIT
// @compatible   chrome
// @compatible   firefox
// ==/UserScript==


// the list of other versions is present in the initial html (in the title of an
// element), but they remove that after they set up the +2 hover thing, so if we
// want to get that info we need to get to those elements right away before they
// have a chance to modify it.


// replaces the .extra-versions placeholder with a list versions, changes styles
// to make it display nicely
function modifyExtraVersionsElem(elem) {
    // in case we happen to get the same one multiple times
    if(elem.parentElement === null) return;
    for(const version of elem.title.split('<br />')) {
        const div = document.createElement('div');
        div.classList.add('mr-2');
        div.textContent = version;
        elem.parentElement.appendChild(div);
    }
    elem.parentElement.classList.add('flex-col');
    elem.parentElement.parentElement.style.paddingTop = '2.5px';
    elem.parentElement.parentElement.style.paddingBottom = '2.5px';
    elem.parentElement.parentElement.style.verticalAlign = 'bottom';
    elem.parentElement.removeChild(elem);
}

const observer = new MutationObserver((mutations, observer) => {
    for(const mutation of mutations) {
        if(mutation.type === 'childList') {
            for(const node of mutation.addedNodes) {
                if(node.nodeType === Node.ELEMENT_NODE) {
                    if(node.classList.contains('extra-versions')) {
                        modifyExtraVersionsElem(node);
                    }
                    node.querySelectorAll('.extra-versions').forEach(modifyExtraVersionsElem);
                }
            }
        }
    }
});

observer.observe(document, { childList: true, subtree: true });

// once the page is finished loading we don't need to be watching for new nodes,
// so we disconnect the observer
window.addEventListener('DOMContentLoaded', (e) => {
    observer.disconnect();
});
