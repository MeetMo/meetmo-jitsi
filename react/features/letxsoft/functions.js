
import { Strophe } from 'strophe.js';

import VideoLayout from '../../../modules/UI/videolayout/VideoLayout';
import { getLocalParticipant } from '../base/participants';
import { setTileViewDimensions } from '../filmstrip/actions.web';
import { setTileView, getCurrentLayout } from '../video-layout';

import { getSessionUserType } from './actions.web';

declare var APP;
declare var interfaceConfig;
let TIER_COUNT = 0;
let DT_MARGIN = 3;
let Tier2Count = 0;

/**
 * The change layout function.
 *
 * @param {string} layout - The new layout selected by the user.
 * @param {Object} dispatch - The redux dispatch function.
 *
 * @inheritdoc
 */
export function changeLayout(layout, dispatch) {
    const _b = document.body;

    if (_b) {
        _b.classList.remove('layout-1', 'layout-2', 'layout-3',
        'layout-4', 'layout-5', 'layout-6', 'layout-7', 'layout-8',
        'layout-9', 'layout-10', 'layout-11', 'layout-12', 'layout-13',
        'layout-14', 'layout-15', 'layout-16');
        layout && _b.classList.add(layout);
    }
    dispatch(setTileView(true))
    .then(() => {
        updateLayout();
    });

}

/**
 * Update the layout and video sections dimensions.
 *
 * @inheritdoc
 */
export function updateLayout() {
    TIER_COUNT = 0;
    Tier2Count = 0;

    // Set class for local video.
    // If the layout is not there, skip the dimension.
    if (!document) {
        return;
    }
    const state = APP.store.getState();
    const tileView = getCurrentLayout(state) === 'tile-view' ? 1 : 0;

    if (document.body.classList.value.indexOf('layout-') === -1) {
        updateYoutubeIframe();
        if (tileView) {
            const { gridDimensions } = state['features/filmstrip'].tileViewDimensions;
            const { clientHeight, clientWidth } = state['features/base/responsive-ui'];
            const { isOpen } = state['features/chat'];

            APP.store.dispatch(
                setTileViewDimensions(
                    gridDimensions,
                    {
                        clientHeight,
                        clientWidth
                    },
                    isOpen
                )
            );
            addDimensionRemoteContainer([ '', '', '', '', '', '' ]);
        }
    } else {

        // Set the margin to 0 for the container
        const frvc = document.getElementById('filmstripRemoteVideosContainer');

        frvc.style.margin = 0;
        frvc.style.width = '100%';
        frvc.style.height = '100%';
    }

    // Set the width and height of the span#localVideoContainer
    const lv = document.getElementById('localVideoContainer');

    if (lv && document.body.classList.value.indexOf('layout-') !== -1) {
        // console.log('Update layout =>', localVideo, localVideo.children);
        lv.style.width = '100%';
        lv.style.height = '100%';
        lv.style.minWidth = '';
        lv.style.minHeight = '';
    }

    const localParticipant = getLocalParticipant(state);
    const usertypes = getSessionUserType();

    if (!usertypes) {
        return;
    }

    const videoDimentions = getVideoDimentions();

    updateYoutubeIframe(videoDimentions);

    // Check if the local participant is tier-1
    // If yes then add to the variable to keep the count.
    if (usertypes[localParticipant.id] === 'tier-1') {
        TIER_COUNT = 1;
    } else if (usertypes[localParticipant.id] === 'tier-2') {
        Tier2Count = 1;
    }
    setNewClassDimention(usertypes[localParticipant.id], lv, videoDimentions);

    // Get all the participants
    const participants = APP.conference._room.getParticipants();

    participants.forEach(participant => {
        const par = document.getElementById(`participant_${participant._id}`);


        // Check if the remote participant is tier-1
        // If yes then add to the variable to keep count
        if (usertypes[participant._id] === 'tier-1') {
            TIER_COUNT += 1;
        } else if (usertypes[participant._id] === 'tier-2') {
            Tier2Count += 1;
        }
        setNewClassDimention(usertypes[participant._id], par, videoDimentions);
    });
}

/**
 * Set class and dimnesion of the video section.
 *
 * @param {string} userType - The userType of the participants.
 * @param {Object} ele - The HtmlElement of the participants video.
 * @param {Array} dim - The array containing dimension of the video section.
 *
 * @inheritdoc
 */
function setNewClassDimention(userType, ele, dim) {
    if (!ele) {
        return;
    }
    console.log('BOOOOOOO', userType);
    let _dim = dim;
    const state = APP.store.getState();

    ele.classList.remove('tier-0', 'tier-1', 'tier-2', 'tier-3');
    ele.classList.add(userType);
    if ([ 'tier-0', 'tier-3' ].includes(userType)) {
        return;
    }
    const layout = state['features/letxsoft'].layout;

    // Remove the top, bottom, left, right property of the element from layout-9
    ele.style.left = ele.style.right = ele.style.top
    = ele.style.bottom = ele.style.marginLeft = ele.style.marginRight
    = ele.style.marginTop = ele.style.marginBottom = '';

    // We don't need to set the heights and widths of the tier types
    // when the layout is unset.
    if (layout === '' || layout === undefined) {
        return;
    }

    const _layoutNumber = layout.replace('layout-', '');
    const tileView = getCurrentLayout(state) === 'tile-view' ? 1 : 0;

    // console.log('HHHH layout =>>>', layout, userType);

    const { clientHeight, clientWidth } = state['features/base/responsive-ui'];

    if (userType === 'tier-1' && tileView) {

        const { _halfWidth, _halfHeight, height } = getHalfWidthHeight(_layoutNumber, clientWidth, clientHeight);

        // console.log('tier-1 calculations =>',
        //     [ clientWidth, clientHeight ],
        //     [ _halfWidth, _halfHeight ],
        //     height);

        _dim = [ _halfWidth, height ];

        // Set top/left margin according to the layout.
        // console.log('booom layout =>', layout, _dim);
        if (layout === 'layout-1' || layout === 'layout-2' || layout === undefined
            || layout === 'layout-7' || layout === 'layout-8' || layout === 'layout-10') {
            // Get the top margin.
            const marT = (clientHeight - height) / 2;

            ele.style.marginTop = `${marT}px`;
            ele.style.marginLeft = '';
        } else if (layout === 'layout-3' || layout === 'layout-16') {
            const marL = (clientWidth - _halfWidth) / 2;
            const marT = (_halfHeight - height) / 2;

            ele.style.marginLeft = `${marL}px`;
            ele.style.marginTop = `${marT}px`;
        } else if (layout === 'layout-5' || layout === 'layout-11' || layout === 'layout-12'
            || layout === 'layout-13' || layout === 'layout-14' || layout === 'layout-15') {
            // If the TIER_COUNT is 1 then keep it above
            // On the first place.
            let marT = (clientHeight - (2 * height) - 10) / 2;

            marT = TIER_COUNT === 1 ? marT : marT + height + 10;

            // Add the margin top to the tier-2 box to make it at same level of tier-1
            // Only add the margin when the TIER_COUNT === 1
            // The margin top on the #filmstripRemoteVideosContainer will be calculated
            // by reducing 200px from it.

            // Note: Keep it for only layout-5, layout-14 and layout-15
            if (TIER_COUNT === 1 && [ 'layout-5', 'layout-14', 'layout-15' ].includes(layout)) {

                addDimensionRemoteContainer([ undefined, undefined, `${marT}px` ]);
            }
            ele.style.marginTop = `${marT}px`;
            ele.style.marginLeft = '';
        } else if (layout === 'layout-6') {
            // If the TIER_COUNT is 1 then keep it Left side
            // On the first place.
            let marL = ((clientWidth - (4 * (_halfWidth + 10)))) / 2;

            marL = TIER_COUNT === 1 ? marL : marL + ((_halfWidth + 10) * (TIER_COUNT - 1));

            // Add the margin top to the tier-2 box to make it at same level of tier-1
            // Only add the margin when the TIER_COUNT === 1
            // The margin top on the #filmstripRemoteVideosContainer will be calculated
            // by reducing 200px from it.
            // if (TIER_COUNT === 1) {
            // addMarginRemoteContainer(marL - 10, 'Left');
            // }
            ele.style.marginLeft = `${marL}px`;
            ele.style.marginTop = '';
        } else if (layout === 'layout-4') {
            ele.style.marginLeft = '';
            ele.style.marginTop = '';
        } else if (layout === 'layout-9') {
            // We will keep the distance between users around 40px
            ele.classList.remove('hide');
            const marLR = ((clientWidth - (3 * (_halfWidth + 40)))) / 2;
            const marTB = ((clientHeight - (2 * (height + 40)))) / 2;

            switch (TIER_COUNT) {
            case 1:
                ele.style.left = `${marLR}px`;
                ele.style.top = `${marTB}px`;

                // ele.classList.add('top', 'left');
                break;
            case 2:
                ele.style.right = `${marLR}px`;
                ele.style.top = `${marTB}px`;

                // ele.classList.add('top', 'right');
                break;
            case 3:
                ele.style.left = `${marLR}px`;
                ele.style.bottom = `${marTB}px`;

                // ele.classList.add('bottom', 'left');
                break;
            case 4:
                ele.style.right = `${marLR}px`;
                ele.style.bottom = `${marTB}px`;

                // ele.classList.add('bottom', 'right');
                break;
            default:
                // Hide the element if that is more than 4 number or less than 1
                ele.classList.add('hide');
                break;
            }
        }

        // Remove the marginTop from remote container when the layout is not layout-5
        // if (layout !== 'layout-5') {
        //     addMarginRemoteContainer();
        // }
    } else if (userType === 'tier-2' && tileView) {
        if (layout === 'layout-9') {
            // We will show only one tier-2 in the middle for now
            // For the hack of columbian layout
            const { _halfWidth, height } = getHalfWidthHeight(_layoutNumber, clientWidth, clientHeight);
            const marTB = ((clientHeight - (2 * (height + 40)))) / 2;
            const marLR = (((clientWidth - (3 * (_halfWidth + 40)))) / 2) + (_halfWidth + 40);

            ele.style.top = `${marTB + (height * 0.1)}px`;
            ele.style.right = `${marLR + (_halfWidth * 0.1)}px`;
            _dim = [ _halfWidth * 0.8, height * 0.8 ];

            // } else if(['layout-5', 'layout-14', 'layout-15'].includes(layout)) {

        }
        const whDivident = getSmallLayoutsNumbers(layout);


        // Apply top margin to only middle columns
        // This will be applied only for layout 5, 14, 15
        if ([ '5', '14', '15' ].includes(layout)) {
            if (Tier2Count > whDivident[1]) {
                ele.style.marginTop = `${DT_MARGIN}px`;
            }
            ele.style.marginBottom = `${DT_MARGIN}px`;
        }
    } else {
        ele.style.marginLeft = '';
        ele.style.marginTop = '';
    }

    const __hi = tileView ? `${_dim[1]}px` : '',
        __wi = tileView ? `${_dim[0]}px` : '';

    ele.style.width = __wi;
    ele.style.height = __hi;

    // console.log('setNewClassDimention participant check =>', userType, dim, _dim, ele, __wi, __hi);

    // Update the avatar size if the height is less than 100px
    const avaWh = _dim[1] < 100 ? _dim[1] : 100;
    const ava = ele.querySelector('.avatar-container');

    if (ava) {
        ava.style.width = `${avaWh}px`;
        ava.style.height = `${avaWh}px`;
    }

    if (tileView) {
        ele.style.minWidth = '';
        ele.style.minHeight = '';
    }
}

/**
 * Function to get the tier 1 dimensions.
 *
 * @inheritdoc
 */
function getTier1Dimensions() {
    const state = APP.store.getState();
    const layout = state['features/letxsoft'].layout;
    const _layoutNumber = layout.replace('layout-', '');
    const { clientHeight, clientWidth } = state['features/base/responsive-ui'];

    return getHalfWidthHeight(_layoutNumber, clientWidth, clientHeight);

}

/**
 * This adds the margin top on the remoteVideosContainer.
 *
 * @param {Array} values - The array contains information to be set on filmstripRemoteVideosContainer.
 * It will contain [width, height, marginTop, marginRight, marginBottom, marginLeft].
 * We don't change for undefined values.
 *
 * @inheritdoc
 */
function addDimensionRemoteContainer(values) {
    // Get the #filmstripRemoteVideosContainer and add the margin top/left
    const remoteContainer = document.getElementById('filmstripRemoteVideosContainer');

    values[0] !== undefined && (remoteContainer.style.width = values[0]);
    values[1] !== undefined && (remoteContainer.style.height = values[1]);
    values[2] !== undefined && (remoteContainer.style.marginTop = values[2]);
    values[3] !== undefined && (remoteContainer.style.marginRight = values[3]);
    values[4] !== undefined && (remoteContainer.style.marginBottom = values[4]);
    values[5] !== undefined && (remoteContainer.style.marginLeft = values[5]);
}

/**
 * Get the video dimensions.
 *
 * @inheritdoc
 */
function getVideoDimentions() {
    // remotevideo section dimention
    const state = APP.store.getState();
    const tileView = getCurrentLayout(state) === 'tile-view' ? 1 : 0;
    const frv = document.getElementById('filmstripRemoteVideos');
    const frvc = document.getElementById('filmstripRemoteVideosContainer');

    if (!tileView) {
        frvc.style.margin = '';

        return [ 0, 0 ];
    }
    const layout = state['features/letxsoft'].layout;

    if (!layout) {
        return;
    }

    // For the layout-5, 14 and 15. We need to keep the videos of tier1
    // tier2 on the same level so we get the height of the tier1 and then
    // set the size of the tier2 parent box for the solution.
    let hei;

    if ([ 'layout-5', 'layout-14', 'layout-15' ].includes(layout)) {
        const { height } = getTier1Dimensions();

        hei = (height * 2) + 10;
    } else {
        hei = frv.offsetHeight;
    }

    // For the layout-6. We need to keep the videos of tier1
    // tier2 on the same level so we get the width of the tier1 and then
    // set the size of the tier2 parent box for the solution.
    // if ([ 'layout-6'].includes(layout)) {
    //     const { _halfWidth } = getTier1Dimensions();

    //     wid = (_halfWidth * 4) + 10;
    // } else {
    const wid = frv.offsetWidth;

    // }

    const whDivident = getSmallLayoutsNumbers(layout);

    // Keep the ratio of video to 16/9
    let _w = parseInt(((wid - 10) / whDivident[0]) - 10, 10);
    let _h = parseInt(_w * (9 / 16), 10);

    // Check if the height of the screen can fit the tier-2 videos
    console.log('desired width and height', whDivident, [ _w, _h ], _h * whDivident[1], hei, wid);
    if ((_h + 10) * whDivident[1] > hei) {
        _h = parseInt((hei / whDivident[1]) - 6, 10);
        _w = parseInt(_h * (16 / 9), 10);
    }
    console.log('refined width and height', whDivident, [ _w, _h ], _h * whDivident[1], hei, wid);


    if ([ 'layout-1', 'layout-2', 'layout-3', undefined, 'layout-5', 'layout-6', 'layout-7', 'layout-8', 'layout-11',
        'layout-12', 'layout-14', 'layout-15', 'layout-16' ].includes(layout)) {
        // Get the top margin.
        const th = (hei - ((_h + 6) * whDivident[1])) / 2;
        const tw = (wid - ((_w + 10) * whDivident[0])) / 2;

        console.log(' Layout 1', wid, hei, _w, _h, th, tw, whDivident[1]);

        // Done' apply margin top to layout-16
        if (![ 'layout-16' ].includes(layout)) {
            if (th > 0) {
                frvc.style.marginTop = `${th}px`;
            }
        }

        // Don't apply marginleft for left facing layouts
        if (![ 'layout-1', 'layout-2', 'layout-5', 'layout-7',
            'layout-8', 'layout-10', 'layout-11', 'layout-12',
            'layout-13', 'layout-14', 'layout-15' ].includes(layout)) {
            if (tw > 0) {
                frvc.style.marginLeft = `${tw}px`;
            }
        }

    // } else if (layout === 'layout-3') {
    //     // Get the left margin.
    //     frvc.style.marginLeft = '';
    //     frvc.style.marginTop = '';
    //     frvc.style.width = '';
    //     frvc.style.height = '';
    } else if (layout === 'layout-4') {
        const _marginW = (wid - (_w * whDivident[0])) / 2;
        const _marginH = (hei - (_h * whDivident[1])) / 2;

        frvc.style.marginTop = `${_marginH}px`;
        frvc.style.marginLeft = `${_marginW}px`;
    }

    // Set the width of the container as well
    if ([ 'layout-1', 'layout-2', 'layout-3', 'layout-4',
        'layout-6', 'layout-7', 'layout-8', 'layout-10',
        'layout-11', 'layout-12', 'layout-13' ].includes(layout)) {
        frvc.style.width = `${((_w + 10) * whDivident[0]) + 4}px`;
        frvc.style.height = `${((_h + 10) * whDivident[1]) + 4}px`;
    } else if ([ 'layout-5', 'layout-14', 'layout-15' ].includes(layout)) {
        // For layout 5, 14 and 15 We need to set the height of tier 2 box
        // same as the tier one box, Adding margin dynamically will resolve the issue
        // frvc.style.width = `${wid}px`;
        frvc.style.width = `${((_w + 10) * whDivident[0]) + 4}px`;
        frvc.style.height = `${hei}px`;
        DT_MARGIN = (frvc.offsetHeight - (whDivident[1] * _h)) / ((whDivident[1] * 2) - 2);
    }
    console.log('width and height of the container ', (_w + 5) * whDivident[0], (_h + 5) * whDivident[1]);

    // Set the dynamic margin top for tier 2 users

    // alert('Width and Height '+_w+' --- '+_h);
    return [ _w, _h ];
}

/**
 * This is to get the number of screen in a row for the current layout.
 *
 * @param {string} layout - The layout string for the conference.
 * @returns {Array}
 */
function getSmallLayoutsNumbers(layout) {
    let h, w;

    switch (layout) {
    case 'layout-4':
        w = 2;
        h = 2;
        break;
    case 'layout-2':
        w = 2;
        h = 3;
        break;
    case 'layout-3':
        w = 4;
        h = 2;
        break;
    case 'layout-5':
        w = 4;
        h = 6;
        break;
    case 'layout-6':
        w = 6;
        h = 3;
        break;
    case 'layout-7':
    case 'layout-12':
    case 'layout-15':
        w = 4;
        h = 5;
        break;
    case 'layout-8':
    case 'layout-11':
    case 'layout-14':
        w = 4;
        h = 4;
        break;
    case 'layout-10':
    case 'layout-13':
        w = 4;
        h = 6;
        break;
    case 'layout-16':
        w = 7;
        h = 1;
        break;
    case 'layout-1':
    default:
        w = 3;
        h = 4;
        break;
    }

    return [ w, h ];
}

/**
 * To get the half width and height according to the multiplier.
 *
 * @param {string} _layoutNumber - The number of the current layout.
 * @param {number} clientWidth - Current client width.
 * @param {number} clientHeight - Current client height.
 *
 * @returns {Object}
 */
function getHalfWidthHeight(_layoutNumber, clientWidth, clientHeight) {
    // half Client width
    // 0.5 for only layout 1-4
    // 0.4 for layout 5- +
    let _hMultiplier, _wMultiplier;

    switch (_layoutNumber) {
    case '5':
    case '14':
    case '15':
        _wMultiplier = 0.4;
        _hMultiplier = 0.5;
        break;
    case '6':
        _wMultiplier = 0.25;
        _hMultiplier = 0.29;
        break;
    case '7':
    case '8':
    case '10':
    case '11':
    case '12':
    case '13':
        _wMultiplier = 0.25;
        _hMultiplier = 0.5;
        break;
    case '9':
        _wMultiplier = 0.3;
        _hMultiplier = 0.5;
        break;
    case '16':
        _wMultiplier = 1;
        _hMultiplier = 0.78;
        break;
    case '1':
    case '2':
    case '3':
    case '4':
    default:
        _wMultiplier = 0.5;
        _hMultiplier = 0.5;
        break;
    }
    let _halfWidth = (clientWidth * _wMultiplier) - 20;
    let height = _halfWidth * (9 / 16);
    const _halfHeight = (clientHeight * _hMultiplier) - 20;

    if (height > _halfHeight) {
        height = _halfHeight;
        _halfWidth = _halfHeight * (16 / 9);
    }

    return { _halfWidth,
        _halfHeight,
        height };
}

export const parser = {
    packet2JSON(xmlElement, nodes) {
        for (const child of Array.from(xmlElement.children)) {
            const node = {
                attributes: {},
                children: [],
                tagName: child.tagName
            };

            for (const attr of Array.from(child.attributes)) {
                node.attributes[attr.name] = attr.value;
            }
            const text = Strophe.getText(child);

            if (text) {
                // Using Strophe.getText will do work for traversing all direct
                // child text nodes but returns an escaped value, which is not
                // desirable at this point.
                if (Strophe) {
                    node.value = Strophe.xmlunescape(text);
                }
            }
            nodes.push(node);
            this.packet2JSON(child, node.children);
        }
    },
    json2packet(nodes, packet) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];

            if (node) {
                packet.c(node.tagName, node.attributes);
                if (node.value) {
                    packet.t(node.value);
                }
                if (node.children) {
                    this.json2packet(node.children, packet);
                }
                packet.up();
            }
        }

        // packet.up();
    }
};

/**
 * Update the local control of the user.
 *
 * @inheritdoc
 */
export function updateLocalControls() {
    const localId = APP?.conference?.getMyUserId();
    let settingsSections = [], toolbox = [];

    if (localId) {
        const tierType = getSessionUserType(localId);

        switch (tierType) {
        case 'tier-0':
            toolbox = [
                'fullscreen',

                // 'microphone',
                'profile',

                // 'hangup',
                // 'camera',
                'recording',
                'desktop',
                'chat',
                'security',
                'background',
                'layout',
                'videoquality',
                'livestreaming',
                'sharedvideo',
                'settings',
                'mute-everyone',
                'shortcuts',
                'stats',
                'embedmeeting',
                'tileview',
                'invite'
            ];
            settingsSections = [
                'devices',
                'language',
                'moderator',
                'profile',
                'calendar'
            ];
            break;
        case 'tier-1':
            toolbox = [
                'fullscreen',
                'microphone',

                // 'hangup',
                'camera',
                'chat',
                'desktop',
                'settings',
                'tileview',
                'videoquality'
            ];
            settingsSections = [
                'devices'
            ];
            break;
        case 'tier-2':
            toolbox = [
                'fullscreen',
                'microphone',

                // 'hangup',
                'camera',
                'chat',
                'desktop',
                'settings',
                'tileview',
                'videoquality'
            ];
            settingsSections = [
                'devices'
            ];
            break;
        case 'tier-3':
        default:
            toolbox = [
                'fullscreen',

                // 'hangup',
                'chat',
                'settings',
                'tileview',
                'videoquality'
            ];
            settingsSections = [
                'devices'
            ];
            break;
        }

        interfaceConfig.TOOLBAR_BUTTONS = toolbox;
        interfaceConfig.SETTINGS_SECTIONS = settingsSections;
    }
}

/**
 * Update the youtube iframe.
 *
 * @inheritdoc
 */
function updateYoutubeIframe(videoDimentions) {
    const state = APP.store.getState();
    const layout = state['features/letxsoft'].layout;
    const tileView = getCurrentLayout(state) === 'tile-view' ? 1 : 0;

    // Set the dimention of the #sharedVideo and #sharedVideoContainer
    const iframe = document.getElementById('sharedVideoIFrame'),
        sharedVideoC = document.getElementById('sharedVideoContainer'),
        sharedvideo = document.getElementById('sharedVideo');

    if (sharedVideoC && sharedvideo) {
        if (tileView) {
            iframe.style.display = 'none';
        }
        if (videoDimentions && layout !== 'layout-4') {
            sharedVideoC.style.width = tileView ? `${videoDimentions[0]}px` : '';
            sharedVideoC.style.height = tileView ? `${videoDimentions[1]}px` : '';
        }
        sharedVideoC.style.minWidth = '';
        sharedVideoC.style.minHeight = '';
        if (!sharedVideoC.classList.contains('tier-2')) {
            sharedVideoC.classList.add('tier-2');
        }
        if (videoDimentions && layout !== 'layout-4') {
            sharedvideo.style.width = `${videoDimentions[0]}px`;
            sharedvideo.style.height = `${videoDimentions[1]}px`;
        } else {
            const pos = sharedVideoC.getBoundingClientRect();

            sharedvideo.style.width = tileView ? `${pos.width}px` : '';
            sharedvideo.style.height = tileView ? `${pos.height}px` : '';
        }
        setTimeout(() => {
            if (tileView) {
                const pos = sharedVideoC.getBoundingClientRect();

                sharedvideo.style.top = pos.y;
                sharedvideo.style.position = 'absolute';
                sharedvideo.style.left = pos.x;
                iframe.style.width = '';
                iframe.style.height = '';
                iframe.style.opacity = 1;
                iframe.style.display = 'inline-block';
                sharedvideo.style.zIndex = '9';
            } else {
                sharedvideo.style.top = '';
                sharedvideo.style.left = '';
                sharedvideo.style.position = '';
                sharedvideo.style.zIndex = '';
                sharedvideo.style.width = '';
                sharedvideo.style.height = '';
                VideoLayout.onResize();
            }
        }, 1000);
    }
}
