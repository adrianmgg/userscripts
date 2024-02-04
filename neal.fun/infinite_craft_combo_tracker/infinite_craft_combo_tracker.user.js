// ==UserScript==
// @name         infinite craft combo tracker
// @namespace    https://github.com/adrianmgg
// @version      1.0.0
// @description  tracks how you made things in infinite craft. no ui yet so just look at the storage data directly
// @author       amgg
// @match        https://neal.fun/infinite-craft/
// @icon         https://neal.fun/favicons/infinite-craft.png
// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// @compatible   chrome
// @license      MIT
// ==/UserScript==

// TODO test on firefox

(function() {
    'use strict';
    const GM_VALUE_KEY = 'infinitecraft_observed_combos';
    // TODO this should probably use the async versions of getvalue/setvalue since we're already only calling it from async code
    function saveCombo(lhs, rhs, result) {
        const data = GM_getValue(GM_VALUE_KEY, {});
        if(!(result in data)) data[result] = [];
        for(const [a, b] in data[result]) {
            if(a === lhs && b === rhs) return;
        }
        data[result].push([lhs, rhs]);
        GM_setValue(GM_VALUE_KEY, data);
    }
    function main() {
        const _getCraftResponse = unsafeWindow.$nuxt._route.matched[0].instances.default.getCraftResponse;
        unsafeWindow.$nuxt._route.matched[0].instances.default.getCraftResponse = async function(lhs, rhs) {
            const resp = await _getCraftResponse.apply(this, arguments);
            saveCombo(lhs.text, rhs.text, resp.result);
            return resp;
        }
    }
    // need to wait for stuff to be actually initialized.
    //  might be an actual thing we can hook into to detect that
    //  but for now just waiting until the function we want exists works well enough
    (function waitForReady(){
        const cur = unsafeWindow?.$nuxt?._route?.matched?.[0]?.instances?.default?.getCraftResponse;
        const ready = cur !== undefined && cur !== null;
        if(ready) main();
        else setTimeout(waitForReady, 10);
    })();
})();
