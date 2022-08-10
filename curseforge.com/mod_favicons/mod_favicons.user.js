// ==UserScript==
// @name         curseforge mod favicon
// @namespace    https://github.com/adrianmgg
// @version      1.0.0
// @description  use a mod's icon (or a mod category's icon) as its curseforge page's favicon
// @author       amgg
// @match        https://www.curseforge.com/*
// @grant        none
// @run-at       document-end
// @license      MIT
// @compatible   chrome
// @compatible   firefox
// ==/UserScript==

function getCategoryPageIcon() {
    // get category links (need to look inside `nav`s specifically because otherwise other dropdowns will also get matched)
    const categoryIcons = [...document.querySelectorAll('nav .category-list-item [data-value="category-link"]')]
        .filter(el => el.querySelector(':scope > .bg-primary-0') !== null) // just the selected ones
        .map(el => el.querySelector(':scope > div > figure > img')) // get icon inside it
        .map(img => img.src);
    // if there's multiple we want the last one, for the cases when a sub-category is selected
    return categoryIcons[categoryIcons.length - 1] ?? null;
}

function getModPageIcon() {
    const fromIconElem = document.querySelector('.project-avatar > a > img')?.src ?? null;
    const fromOpengraphTags = document.querySelector('html > head > meta[property="og:image"]')?.content ?? null;
    // some specific pages don't have og tags, so we use the icon element as a fallback on those only
    if(/\/relations\/(dependents|dependencies)\/?$|\/issues\/?$/.test(window.location.pathname)) {
        return fromIconElem;
    } else {
        return fromOpengraphTags;
    }
}

(function() {
    const faviconLink = document.querySelector('link[rel~="icon"]');
    if(faviconLink === null) return;
    const categoryPageIcon = getCategoryPageIcon();
    const modPageIcon = getModPageIcon();
    if(categoryPageIcon !== null) {
        faviconLink.href = categoryPageIcon;
    } else if(modPageIcon !== null) {
        faviconLink.href = modPageIcon;
    }
})();
