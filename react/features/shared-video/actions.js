import {
    SET_SHARED_VIDEO_STATUS,
    TOGGLE_SHARED_VIDEO,
    TOGGLE_SHARED_VIMEO_VIDEO,
    SET_SHARED_VIMEO_VIDEO_STATUS
} from './actionTypes';

/**
 * Updates the current known status of the shared YouTube video.
 *
 * @param {string} status - The current status of the YouTube video being
 * shared.
 * @returns {{
 *     type: SET_SHARED_VIDEO_STATUS,
 *     status: string
 * }}
 */
export function setSharedVideoStatus(status) {
    return {
        type: SET_SHARED_VIDEO_STATUS,
        status
    };
}

/**
 * Updates the current known status of the shared YouTube video.
 *
 * @param {string} vimeoStatus - The current status of the YouTube video being
 * shared.
 * @returns {{
    *     type: SET_SHARED_VIMEO_VIDEO_STATUS,
    *     vimeoStatus: string
    * }}
    */
export function setSharedVimeoVideoStatus(vimeoStatus) {
    return {
        type: SET_SHARED_VIMEO_VIDEO_STATUS,
        vimeoStatus
    };
}

/**
 * Starts the flow for starting or stopping a shared YouTube video.
 *
 * @returns {{
 *     type: TOGGLE_SHARED_VIDEO
 * }}
 */
export function toggleSharedVideo() {
    return {
        type: TOGGLE_SHARED_VIDEO
    };
}

/**
 * Starts the flow for starting or stopping a shared Vimeo video.
 *
 * @returns {{
    *     type: TOGGLE_SHARED_VIMEO_VIDEO
    * }}
    */
export function toggleSharedVimeoVideo() {
    return {
        type: TOGGLE_SHARED_VIMEO_VIDEO
    };
}
