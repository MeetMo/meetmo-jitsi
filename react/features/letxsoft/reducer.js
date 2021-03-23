// @flow

import { CONFERENCE_JOINED } from '../base/conference';
import { ReducerRegistry, set } from '../base/redux';
import logger from '../base/redux/logger';

import { USERTYPE_CHANGED } from './XMPPEvents';
import {
    SET_LAYOUT,
    SET_BACKGROUND,
    UPDATE_BACKGROUND_LIST
} from './actionTypes';
import { updateLocalControls } from './functions';

const DEFAULT_STATE = {
    layout: undefined,
    background: undefined,
    backgroundList: [
        '/images/backgrounds/background1.png'
    ]
};

/**
 * Listen for actions that contain the Follow Me feature active state, so that it can be stored.
 */
ReducerRegistry.register(
    'features/letxsoft',
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {

        case SET_LAYOUT: {
            const newState = set(state, 'layout', action.layout);

            return newState;
        }
        case SET_BACKGROUND: {
            return set(state, 'background', action.background);
        }
        case UPDATE_BACKGROUND_LIST: {
            logger.info('update the new background', action.backgroundList);
            const newState = set(state, 'backgroundList', action.backgroundList);

            return newState;
        }
        case CONFERENCE_JOINED:
        case USERTYPE_CHANGED: {
            setTimeout(() => {
                updateLocalControls();
            }, 200);
        }
        }

        return state;
    });
