// ==UserScript==
// @name         picrew tweaker
// @namespace    https://github.com/adrianmgg
// @version      1.0.1
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

    function patchNuxt(nuxt) {
        try {
            // enable randomizing
            nuxt.state.imageMakerInfo.can_randomize = 1;
            nuxt.state.imageMakerInfo.can_fixed_randomize = 1;
            patchPList(nuxt?.state?.config?.pList);
        } catch(err) {
            console.log('error patching nuxt', err);
        }
    }

    if('__NUXT__' in unsafeWindow) {
        patchNuxt(unsafeWindow.__NUXT__);
    } else {
        let nuxt = undefined;
        Object.defineProperty(unsafeWindow, '__NUXT__', {
            get: () => nuxt,
            set: (v) => {
                nuxt = v;
                patchNuxt(nuxt);
                return nuxt;
            },
        });
    }
})();