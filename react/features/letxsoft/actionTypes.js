// @flow

/**
 * The name of the new layout.
 *
 * {
 *     type: SET_LAYOUT,
 *     layout: string
 * }
 */
export const SET_LAYOUT = 'SET_LAYOUT';

/**
 * The new background of the current conference.
 *
 *
 * {
 *     type: SET_BACKGROUND,
 *     background: string
 * }
 */
export const SET_BACKGROUND = 'SET_BACKGROUND';

/**
 * The updated backgroundList of the images.
 *
 *
 * {
 *     type: UPDATE_BACKGROUND_LIST,
 *     backgroundList: array
 * }
 */
export const UPDATE_BACKGROUND_LIST = 'UPDATE_BACKGROUND_LIST';

/**
 * The new tier type of the remote user.
 *
 *
 * {
 *     type: MAKE_REMOTE_TIER,
 *     userType: string
 * }
 */
export const MAKE_REMOTE_TIER = 'MAKE_REMOTE_TIER';
