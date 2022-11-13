// ==UserScript==
// @name         picrew tweaker
// @namespace    https://github.com/adrianmgg
// @version      1.0.0
// @description  force-enables various picrew features
// @author       amgg
// @match        https://picrew.me/image_maker/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=picrew.me
// @run-at       document-start
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    // apply our modifications to the parts list
    function patchPList(pList) {
        try {
            pList.forEach(p=>{
                // i think various *Cnt attrs have max of 99 via editor? maybe
                // enable move button
                p.canMv = 1;
                // x axis move
                p.isMX = 1; // enable x axis movement
                p.ticX = p.ticX ?? 2; // needs to have a step size
                p.lCnt = Infinity; // left steps
                p.rCnt = Infinity; // right steps
                // y axis move
                p.isMY = 1; // enable y axis movement
                p.ticY = p.ticY ?? 2; // needs to have a step size
                p.upCnt = Infinity; // up steps
                p.dwnCnt = Infinity; // down steps
                // rotation
                p.isRota = 1; // enable rotation
                p.ticRota = p.ticRota ?? 2; // needs to have a step size
                p.rotaLCnt = Infinity; // left rot steps
                p.rotaRCnt = Infinity; // right rot steps
                // resize
                // p.isRsiz = 1; // enable
                // const is_patched = p.items.every(item=>p.lyrs.every(layer=>data.cpList[p.cpId].every(color=>patched_imgs[item.itmId]?.[layer]?.[color.cId])));
                // if(is_patched){
                //     // if patched
                //     p.miSNo = -10 + 10; // min
                //     p.mxSNo = 20; // max
                //     p.sNo = 10; // current
                //     data.zeroConf[p.pId].sNo = p.sNo;
                // } else {
                //     p.miSNo = -10; // min
                //     p.mxSNo = 20; // max
                //     p.sNo = 0; // current
                // }
                // enable removing part
                p.isRmv = 1;
                //
                // p.isMy = 0;
                // p.isRmv = 0;
                // delete p.ticY;
                // ^no effect
                // delete p.dwnCnt;
                // delete p.upCnt;
                // ^deleting either up or dwn removes
                //
                // p.canMv = 1; // enable move button
                // p.isMx = 0; // enable x axis move
                // p.isMy = 1; // enable y axis move
                // p.isRmv = 1; // enable move
                // p.ticY = 2; // ?
                // p.dwnCnt = 3; // ?
                // p.upCnd = 3; // ?
                // p.isRmv = 1;
            });
        } catch(err) {
            console.error('error patchcing pList', err);
        }
    }

    // ==================
    //  vue nuxt patches
    // ==================
    {
        // this doesn't work if the nuxt element has already loaded/been processed so if that's the case we need to just try again.
        if('__NUXT__' in unsafeWindow) {
            window.location.reload();
        }
        let nuxt = undefined;
        Object.defineProperty(unsafeWindow, '__NUXT__', {
            get: () => nuxt,
            set: (v) => {
                nuxt = v;
                // console.log('patching __NUXT__');
                try {
                    // enable randomizing
                    nuxt.state.imageMakerInfo.can_randomize = 1;
                    nuxt.state.imageMakerInfo.can_fixed_randomize = 1;
                    patchPList(nuxt?.state?.config?.pList);
                } catch(err) {
                    console.log('error patching __NUXT__', err);
                }
                return nuxt;
            },
        });
    }


    // ==========================
    //  patches to fetched files
    // ==========================
    // as far as I can tell the fetches this targeted aren't used anymore, but i'm leaving it here for now just in case they switch back
    // {
    //     const original_fetch = unsafeWindow.fetch;
    //     let cf_resolve = null;
    //     const cf_await = new Promise((resolve)=>{ cf_resolve=resolve; });
    //     let patched_imgs_resolve = null;
    //     const patched_imgs_await = new Promise((resolve)=>{ patched_imgs_resolve=resolve; });
    //     unsafeWindow.fetch = function(resource, init) {
    //         // if(resource.endsWith('img.json')) {
    //         //     console.log('fetch img', resource, init);
    //         //     return original_fetch.apply(this, arguments).then(async (response)=>{
    //         //         response.json = async function() {
    //         //             const data = await Response.prototype.json.apply(this, arguments);
    //         //             console.log('rewriting img.json');
    //         //             // setup dummy x2 urls for items without them, to avoid crash zooming above 1x
    //         //             const patched_imgs = {};
    //         //             for(const item_id in data.lst) {
    //         //                 for(const layer_id in data.lst[item_id]) {
    //         //                     for(const color_id in data.lst[item_id][layer_id]) {
    //         //                         const img_entry = data.lst[item_id][layer_id][color_id];
    //         //                         if(img_entry.x2Url === undefined) {
    //         //                             patched_imgs[item_id] ??= {};
    //         //                             patched_imgs[item_id][layer_id] ??= {};
    //         //                             patched_imgs[item_id][layer_id][color_id] = true;
    //         //                             const url = img_entry.url;
    //         //                             img_entry.url = url.replace(/^(\/app\/image_maker\/\d+\/\d+\/)i_(.*\.png)$/, '$1ih_$2');
    //         //                             img_entry.x2Url = url;
    //         //                         }
    //         //                     }
    //         //                 }
    //         //             }
    //         //             console.log('rewritten img', data);
    //         //             patched_imgs_resolve(patched_imgs);
    //         //             return data;
    //         //         };
    //         //         return response;
    //         //     });
    //         // }
    //         if(resource.endsWith('/cf.json')) {
    //             // console.log('fetch cf', resource, init);
    //             return original_fetch.apply(this, arguments).then(async (response)=>{
    //                 response.json = async function() {
    //                     const data = await Response.prototype.json.apply(this, arguments);
    //                     // console.log('rewriting cf.json');
    //                     try {
    //                         // const patched_imgs = await patched_imgs_await;
    //                         patchPList(data.pList);
    //                     } catch(e) {
    //                         console.error('error while rewriting cf', e);
    //                         alert('error while rewriting cf, see console');
    //                     }
    //                     console.log('rewritten cf', data);
    //                     cf_resolve(data);
    //                     return data;
    //                 };
    //                 return response;
    //             });
    //         }
    //         // else if(resource.endsWith('/i_rule.json')) { // TODO do proper url parse rather than just endswith
    //         //     console.log('fetch i_rule', resource, init);
    //         //     return original_fetch.apply(this, arguments).then(async (response)=>{
    //         //         response.json = async function() {
    //         //             console.log('rewriting i_rule.json');
    //         //             // const data = await Response.prototype.json.apply(this, arguments);
    //         //             const data = {};
    //         //             console.log('awaiting cf');
    //         //             const cf = await cf_await;
    //         //             console.log('got cf');
    //         //             // for(const plentry of cf.pList) {
    //         //             //     for(const item of plentry) {
    //         //             //         data[item.itmId] = {};
    //         //             //     }
    //         //             // }
    //         //             console.log('rewritten i_rule', data);
    //         //             return data;
    //         //         };
    //         //         return response;
    //         //     });
    //         // }
    //         return original_fetch.apply(this, arguments);
    //     };
    // }
})();