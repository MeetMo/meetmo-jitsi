// @flow

import { CONFERENCE_JOINED, CONFERENCE_WILL_JOIN } from '../base/conference';
import { getLocalParticipant } from '../base/participants';
import {
    PARTICIPANT_JOINED,
    PARTICIPANT_KICKED,
    PARTICIPANT_LEFT,
    PIN_PARTICIPANT
} from '../base/participants/actionTypes';
import { MiddlewareRegistry } from '../base/redux';
import { CLIENT_RESIZED } from '../base/responsive-ui';
import { TOGGLE_CHAT } from '../chat';
import {
    getCurrentLayout,
    LAYOUTS,
    SET_TILE_VIEW
} from '../video-layout';

import { SET_LAYOUT, SET_BACKGROUND, MAKE_REMOTE_TIER } from './actionTypes';
import {
    updateBackground,
    conferenceWillJoinTier,
    getUserTypeFromJwt,
    setSessionUserType,
    getBackgrounds,
    updateUserTier,
    getRoomInfoAndUpdate
} from './actions.web';
import { updateLayout, changeLayout } from './functions';


/**
 * The middleware of the feature Filmstrip.
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case CLIENT_RESIZED: {
        // const state = store.getState();
        // const layout = getCurrentLayout(state);

        updateLayout();

        // switch (layout) {
        // case LAYOUTS.TILE_VIEW: {
        //     break;
        // }
        // }
        break;
    }
    case PARTICIPANT_JOINED:
    case PARTICIPANT_KICKED:
    case PARTICIPANT_LEFT:
    case TOGGLE_CHAT: {
        const state = store.getState();
        const layout = getCurrentLayout(state);

        switch (layout) {
        case LAYOUTS.TILE_VIEW: {
            updateLayout();
            break;
        }
        }
        break;
    }
    case PIN_PARTICIPANT:
    case SET_TILE_VIEW: {
        console.log('setting tile view');
        setTimeout(() => {
            updateLayout();
        }, 10);
        break;
    }
    case CONFERENCE_JOINED: {
        // Get the conference background from the server.
        store.dispatch(getRoomInfoAndUpdate());

        // Set the userType for the local participant
        const participant = getLocalParticipant(store.getState());

        // Set the usertype to the sessionStorage
        const userTypes = {};

        userTypes[participant.id] = getUserTypeFromJwt(store);
        sessionStorage.setItem('userTypes', JSON.stringify(userTypes));

        store.dispatch(getBackgrounds());

        break;
    }
    case SET_LAYOUT: {
        // Set the style of the remove videos according to the layout
        // Check if the local participant is moderator
        changeLayout(action.layout, store.dispatch);
        break;
    }
    case SET_BACKGROUND: {
        updateBackground(action.background);
        break;
    }
    case CONFERENCE_WILL_JOIN: {
        const { conference } = action;

        conferenceWillJoinTier(store, next, action);

        conference.addCommandListener(
            MAKE_REMOTE_TIER, ({ attributes }) => {
                // We will send the updated presence of the remote user who's
                // user type is going to change.
                if (conference.myUserId() === attributes.id) {
                    conference.room.sendUpdatedTierPresence(attributes.userType);

                    // Update the usertype of local participant as well.
                    setSessionUserType(attributes.id, attributes.userType);

                    // update the userType of local participant to the server as well.
                    store.dispatch(updateUserTier(attributes.userType));
                    updateLayout();
                }
            });
    }
    }

    return result;
});

