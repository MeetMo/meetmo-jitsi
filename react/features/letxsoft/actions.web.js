// @flow

import JwtDecode from 'jwt-decode';
import type { Dispatch, Store } from 'redux';
import { Strophe } from 'strophe.js';

import { getParticipantDisplayName } from '../base/participants';
import { parseURLParams } from '../base/util';
import { showNotification, showErrorNotification, NOTIFICATION_TIMEOUT } from '../notifications';

import XMPPEvents from './XMPPEvents';
import { SET_LAYOUT, SET_BACKGROUND, MAKE_REMOTE_TIER, UPDATE_BACKGROUND_LIST } from './actionTypes';
import { parser, updateLayout } from './functions';
import logger from './logger';

declare var $: JQuery;
declare var interfaceConfig: Object;
declare var config: Object;

/**
 * Update the background of the conference.
 *
 * @param {string} src - The url of the background image.
 *
 * @inheritdoc
 */
export function updateBackground(src: string) {
    const elem = document.getElementById('largeVideoContainer');

    if (!elem) {
        return;
    }
    elem.style.background = `url(${src})`;
}

/**
 * Sets the current layout to the conference.
 *
 * @param {?string} layout - The new layout.
 * @returns {{
    *     type: SET_LAYOUT,
    *     layout, string
    * }}
    */
export function setLayout(layout: ?string) {
    return {
        type: SET_LAYOUT,
        layout
    };
}

/**
 * Sets the current layout to the conference.
 *
 * @param {?string} background - The new layout.
 * @returns {{
    *     type: SET_BACKGROUND,
    *     background, string
    * }}
    */
export function setBackground(background: ?string) {
    return {
        type: SET_BACKGROUND,
        background
    };
}

/**
 * Update the list of background.
 *
 * @param {?Array} backgroundList - The updated list of backgroundList.
 * @returns {{
    *     type: UPDATE_BACKGROUND_LIST,
    *     backgroundList: Array
    * }}
    */
export function updateBackgroundList(backgroundList?: Array<Object>) {
    return {
        backgroundList,
        type: UPDATE_BACKGROUND_LIST
    };
}

/**
 * Update the new user type to remote participants.
 *
 * @param {?string} id - The id of the remote user.
 * @param {?string} userType - The new user type.
 * @returns {null}
    */
export function makeRemoteTier(id: string, userType: ?string) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const { conference } = getState()['features/base/conference'];

        conference.sendCommandOnce(
            MAKE_REMOTE_TIER,
            { attributes: { id,
                userType } }
        );
    };
}

/**
 Here we override the xmpp chatRoom.js functions according to our need.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code CONNECTION_ESTABLISHED}
 * which is being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified {@code action}.
 */
export function conferenceWillJoinTier(store: Store<*, *>, next: Dispatch<any>, action: Object) {
    const result = next(action);
    const { conference } = action;
    const conferenceOptions = conference.room.options;

    conferenceOptions.userType = getUserTypeFromJwt(store);

    // Update the onPresence function of the chatRoom.js

    /**
     * This is overriden of chatRoom.js function initPresenceMap.
     *
     * @inheritdoc
     * return {void}
     */
    conference.room.initPresenceMap = function(options = {}) {
        this.presMap.to = this.myroomjid;
        this.presMap.xns = 'http://jabber.org/protocol/muc';

        if (options.statsId) {
            this.presMap.nodes.push({
                'tagName': 'stats-id',
                'value': options.statsId
            });
        }

        // Add the iAmHost tag to the presMap
        if (options.userType) {
            this.presMap.nodes.push({
                'tagName': 'userType',
                'attributes': { 'xmlns': 'http://jitsi.org/jitmeet/userType' },
                'value': options.userType
            });
        }

        // We need to broadcast 'videomuted' status from the beginning, cause
        // Jicofo makes decisions based on that. Initialize it with 'false'
        // here.
        this.addVideoInfoToPresence(false);

        if (options.deploymentInfo && options.deploymentInfo.userRegion) {
            this.presMap.nodes.push({
                'tagName': 'region',
                'attributes': {
                    id: options.deploymentInfo.userRegion,
                    xmlns: 'http://jitsi.org/jitsi-meet'
                }
            });
        }
    };

    /**
     * This is overriden of chatRoom.js onPresence function.
     *
     * @inheritdoc
     * return {void}
     */
    conference.room.onPresence = function(pres) {
        const from = pres.getAttribute('from');
        const member = {};
        const statusEl = pres.getElementsByTagName('status')[0];

        if (statusEl) {
            member.status = statusEl.textContent || '';
        }
        let hasStatusUpdate = false;
        let hasVersionUpdate = false;
        let hasUserTypeUpdate = false;
        const xElement
            = pres.getElementsByTagNameNS(
                'http://jabber.org/protocol/muc#user', 'x')[0];
        const mucUserItem
            = xElement && xElement.getElementsByTagName('item')[0];

        const type = pres.getElementsByTagName('userType')[0];

        // Focus recognition
        const jid = mucUserItem && mucUserItem.getAttribute('jid');
	
	// Mobile fix: Currently we don't have any tier feature in mobile jitsi sdk and all the users from mobile
	// Connects to the conference and appears in a web app as a hidden domain.
        // We are making them visible as tier-2 and will remove this fix later .
        let userType = type !== undefined && type.childNodes[0] !== undefined
            ? type.childNodes[0].nodeValue : 'tier-2'; // Replace tier-2 with tier-3

        // make the SIP call to tier-2 by checking the jid
        if (jid.includes(`jigasi@auth.${config.hosts.domain}`)) {
            userType = 'tier-2';
        }

        // member.affiliation
        //     = mucUserItem && mucUserItem.getAttribute('affiliation');
        // member.role = mucUserItem && mucUserItem.getAttribute('role');
        member.userType = userType;

        member.role = userType === 'tier-0' ? 'moderator' : 'participant';
        member.affiliation = userType === 'tier-0' ? 'owner' : 'none';

        member.jid = jid;
        member.isFocus
            = jid && jid.indexOf(`${this.moderator.getFocusUserJid()}/`) === 0;
        member.isHiddenDomain
            = (jid && jid.indexOf('@') > 0
                && this.options.hiddenDomain
                    === jid.substring(jid.indexOf('@') + 1, jid.indexOf('/')))
                    || userType === 'tier-3' || userType === 'tier-0';

        this.eventEmitter.emit(XMPPEvents.PRESENCE_RECEIVED, {
            fromHiddenDomain: member.isHiddenDomain,
            presence: pres
        });

        const xEl = pres.querySelector('x');

        if (xEl) {
            xEl.remove();
        }

        const nodes = [];

        parser.packet2JSON(pres, nodes);
        this.lastPresences[from] = nodes;

        // process nodes to extract data needed for MUC_JOINED and
        // MUC_MEMBER_JOINED events
        const extractIdentityInformation = node => {
            const identity = {};
            const userInfo = node.children.find(c => c.tagName === 'user');

            if (userInfo) {
                identity.user = {};
                for (const tag of [ 'id', 'name', 'avatar' ]) {
                    const child
                        = userInfo.children.find(c => c.tagName === tag);

                    if (child) {
                        identity.user[tag] = child.value;
                    }
                }
            }
            const groupInfo = node.children.find(c => c.tagName === 'group');

            if (groupInfo) {
                identity.group = groupInfo.value;
            }

            return identity;
        };

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];

            switch (node.tagName) {
            case 'bot': {
                const { attributes } = node;

                if (!attributes) {
                    break;
                }
                const _type = attributes.type;

                member.botType = _type;
                break;
            }
            case 'nick':
                member.nick = node.value;
                break;
            case 'userId':
                member.id = node.value;
                break;
            case 'stats-id':
                member.statsID = node.value;
                break;
            case 'identity':
                member.identity = extractIdentityInformation(node);
                break;
            case 'stat': {
                const { attributes } = node;

                if (!attributes) {
                    break;
                }
                const { name } = attributes;

                if (name === 'version') {
                    member.version = attributes.value;
                }
                break;
            }
            }
        }

        if (from === this.myroomjid) {
            const newRole
                = member.affiliation === 'owner' ? member.role : 'none';

            if (this.role !== newRole) {
                this.role = newRole;
                this.eventEmitter.emit(
                    XMPPEvents.LOCAL_ROLE_CHANGED,
                    this.role);
            }
            if (!this.joined) {
                this.joined = true;
                const now = this.connectionTimes['muc.joined']
                    = window.performance.now();

                logger.log('(TIME) MUC joined:\t', now);

                // set correct initial state of locked
                if (this.password) {
                    this.locked = true;
                }

                // Re-send presence in case any presence updates were added,
                // but blocked from sending, during the join process.
                // send the presence only if there was a modification after we had synced it
                if (this.presenceUpdateTime >= this.presenceSyncTime) {
                    this.sendPresence();
                }

                this.eventEmitter.emit(XMPPEvents.MUC_JOINED, member.userType);

                // Now let's check the disco-info to retrieve the
                // meeting Id if any
                !this.options.disableDiscoInfo && this.discoRoomInfo();
            }
        } else if (jid === undefined) {
            logger.info('Ignoring member with undefined JID');
        } else if (this.members[from] === undefined) {
            // new participant
            this.members[from] = member;
            logger.log('entered', from, member);
            hasStatusUpdate = member.status !== undefined;
            hasVersionUpdate = member.version !== undefined;
            hasUserTypeUpdate = member.userType !== undefined;
            if (member.isFocus) {
                this._initFocus(from, jid);
            } else {
                // identity is being added to member joined, so external
                // services can be notified for that (currently identity is
                // not used inside library)
                this.eventEmitter.emit(
                    XMPPEvents.MUC_MEMBER_JOINED,
                    from,
                    member.nick,
                    member.role,
                    member.isHiddenDomain,
                    member.statsID,
                    member.status,
                    member.identity,
                    member.botType,
                    member.jid,
                    member.userType);

                // we are reporting the status with the join
                // so we do not want a second event about status update
                hasStatusUpdate = false;
            }
        } else {
            // Presence update for existing participant
            // Watch role change:
            const memberOfThis = this.members[from];

            if (memberOfThis.role !== member.role) {
                memberOfThis.role = member.role;
                this.eventEmitter.emit(
                    XMPPEvents.MUC_ROLE_CHANGED, from, member.role);
            }

            // affiliation changed
            if (memberOfThis.affiliation !== member.affiliation) {
                memberOfThis.affiliation = member.affiliation;
            }

            // fire event that botType had changed
            if (memberOfThis.botType !== member.botType) {
                memberOfThis.botType = member.botType;
                this.eventEmitter.emit(
                    XMPPEvents.MUC_MEMBER_BOT_TYPE_CHANGED,
                    from,
                    member.botType);
            }

            if (member.isFocus) {
                // From time to time first few presences of the focus are not
                // containing it's jid. That way we can mark later the focus
                // member instead of not marking it at all and not starting the
                // conference.
                // FIXME: Maybe there is a better way to handle this issue. It
                // seems there is some period of time in prosody that the
                // configuration form is received but not applied. And if any
                // participant joins during that period of time the first
                // presence from the focus won't contain
                // <item jid="focus..." />.
                memberOfThis.isFocus = true;
                this._initFocus(from, jid);
            }

            // store the new display name
            if (member.displayName) {
                memberOfThis.displayName = member.displayName;
            }

            // update stored status message to be able to detect changes
            if (memberOfThis.status !== member.status) {
                hasStatusUpdate = true;
                memberOfThis.status = member.status;
            }

            if (memberOfThis.version !== member.version) {
                hasVersionUpdate = true;
                memberOfThis.version = member.version;
            }

            if (memberOfThis.userType !== member.userType) {
                hasUserTypeUpdate = true;
                memberOfThis.userType = member.userType;
            }
        }

        // after we had fired member or room joined events, lets fire events
        // for the rest info we got in presence
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];

            switch (node.tagName) {
            case 'nick':
                if (!member.isFocus) {
                    const displayName
                        = this.xmpp.options.displayJids
                            ? Strophe.getResourceFromJid(from)
                            : member.nick;

                    this.eventEmitter.emit(
                        XMPPEvents.DISPLAY_NAME_CHANGED,
                        from,
                        displayName);
                }
                break;
            case 'bridgeNotAvailable':
                if (member.isFocus && !this.noBridgeAvailable) {
                    this.noBridgeAvailable = true;
                    this.eventEmitter.emit(XMPPEvents.BRIDGE_DOWN);
                }
                break;
            case 'conference-properties':
                if (member.isFocus) {
                    const properties = {};

                    for (let j = 0; j < node.children.length; j++) {
                        const { attributes } = node.children[j];

                        if (attributes && attributes.key) {
                            properties[attributes.key] = attributes.value;
                        }
                    }

                    this.eventEmitter.emit(
                        XMPPEvents.CONFERENCE_PROPERTIES_CHANGED, properties);
                }
                break;
            case 'transcription-status': {
                const { attributes } = node;

                if (!attributes) {
                    break;
                }

                const { status } = attributes;

                if (status && status !== this.transcriptionStatus) {
                    this.transcriptionStatus = status;
                    this.eventEmitter.emit(
                        XMPPEvents.TRANSCRIPTION_STATUS_CHANGED,
                        status
                    );
                }


                break;
            }
            case 'call-control': {
                const att = node.attributes;

                if (!att) {
                    break;
                }
                this.phoneNumber = att.phone || null;
                this.phonePin = att.pin || null;
                this.eventEmitter.emit(XMPPEvents.PHONE_NUMBER_CHANGED);
                break;
            }
            default:
                this.processNode(node, from);
            }
        }

        // Trigger status message update if necessary
        if (hasStatusUpdate) {
            this.eventEmitter.emit(
                XMPPEvents.PRESENCE_STATUS,
                from,
                member.status);
        }

        if (hasUserTypeUpdate) {
            logger.info(`Received new userType for ${jid}: ${member.userType}`);
            this.eventEmitter.emit(
                XMPPEvents.USERTYPE_CHANGED,
                from,
                member.userType);
        }

        if (hasVersionUpdate) {
            logger.info(`Received version for ${jid}: ${member.version}`);
        }
    };
    conference.room.addListener(
        XMPPEvents.MUC_MEMBER_JOINED,
        (...data) => {
            setTimeout(() => {
                const id = Strophe.getResourceFromJid(data[0]);

                updateUserType(store, id, data[9]);
            });
        }
    );
    conference.room.addListener(
        XMPPEvents.USERTYPE_CHANGED,
        (...data) => {
            setTimeout(() => {
                const id = Strophe.getResourceFromJid(data[0]);

                updateUserType(store, id, data[1]);
                updateLayout();
            }, 2000);
        }
    );

    /**
     * Update the userType of remote participant.
     *
     * @param {string} tier - The new Tier of the user to be updated.
     *
     * @inheritdoc
     */
    conference.room.sendUpdatedTierPresence = function(tier) {
        logger.info('update tier', tier);
        const room = conference.room;

        room.removeFromPresence('userType');
        room.addToPresence(
            'userType',
            {
                attributes: { 'xmlns': 'http://jitsi.org/jitmeet/userType' },
                value: tier
            });
        room.sendPresence();
        logger.info('Sending updated tier type to remote', tier);
    };

    conference.room.initPresenceMap(conferenceOptions);

    return result;
}

/**
 * This function is userful to get the userType from jwt.
 *
 * @param {Object} store - The store object of the application.
 *
 * @returns {string} - The userType of the user.
 */
export function getUserTypeFromJwt(store: Object) {
    const { jwt } = store.getState()['features/base/jwt'];

    if (jwt) {
        const payload = new JwtDecode(jwt);

        if (payload.context.user.role !== undefined && payload.context.user.role !== '') {
            return payload.context.user.role;
        }
    }

    // For development only
    if (location.origin.includes('localhost:')) {
        const { locationURL } = store.getState()['features/base/connection'];
        const params1 = parseURLParams(locationURL, true, 'search');

        if (params1.role !== undefined && params1.role !== 'undefined' && params1.role !== '') {
            return params1.role;
        }

        return 'tier-2';
    }

    return 'tier-3';
}

/**
 * Update the userType of the remote/local user whos userType has been changed.
 *
 * @param {Object} store - The store object of the application.
 * @param {string} id - The id of the user whos userType has been updated.
 * @param {string} userType - The new userType of the user.
 *
 * @returns {null}
 */
export function updateUserType(store: Object, id: string, userType: string) {
    const { conference } = store.getState()['features/base/conference'];
    const participant = conference.participants[id];

    if (participant) {
        setSessionUserType(id, userType);
    }
}

/**
 * Get the userType from sessionStorage using userId.
 *
 * @param {string} id - The user id to get the userType from sessionStorage.
 * @returns {string} UserType.
 */
export function getSessionUserType(id?: string) {
    let usertypes = sessionStorage.getItem('userTypes');

    if (usertypes !== null && usertypes !== undefined) {
        usertypes = JSON.parse(usertypes);

        if (id) {
            return usertypes[id];
        }
    }

    return usertypes;
}

/**
 * Set the userType to the sessions.
 *
 * @param {string} id - The id of the user.
 * @param {string} userType - The new userType of the user to be set in sessions.
 *
 * @returns {null}
 */
export function setSessionUserType(id: string, userType: string) {
    const usertypes = getSessionUserType();

    if (usertypes !== null && usertypes !== undefined) {
        usertypes[id] = userType;

        sessionStorage.setItem('userTypes', JSON.stringify(usertypes));
    }
}

/**
 * Action to be dispatched when we change the lobbyVideourl.
 *
 * @param {string} lobbyVideoUrl - The url of the video.
 * @returns {Promise}
    */
export function setLobbyVideoUrl(lobbyVideoUrl: string) {
    return async (dispatch: Dispatch<any>, getState: Function) => {
        const { jwt } = getState()['features/base/jwt'];

        if (jwt) {
            const payload = new JwtDecode(jwt);
            const baseApi = payload.baseApi ?? interfaceConfig.BASE_API;
            const data = new FormData();

            data.append('user_id', payload.context.user.id);
            data.append('lobby_url', lobbyVideoUrl);
            data.append('room_slug', payload.room_slug);

            if (payload.context.user.id && payload.room_slug && baseApi) {
                fetch(`${baseApi}/api/v1/lobby/update/`, {
                    method: 'POST',
                    body: data,
                    cache: false
                })
                .then(async _resp => {
                    const response = await _resp.json();

                    console.log('response =>', response);
                    dispatch(showNotification({
                        descriptionKey: 'lobby.lobbyVideoUrlSuccess',
                        titleKey: 'lobby.lobbyVideoUrl'
                    }, NOTIFICATION_TIMEOUT));
                    sessionStorage.setItem('lobby-video-url', lobbyVideoUrl);
                })
                .catch(error => {
                    console.log(' error =>', error.statusText);
                    dispatch(showErrorNotification({
                        descriptionKey: 'lobby.lobbyVideoUrlError',
                        titleKey: 'lobby.lobbyVideoUrl'
                    }));
                });
            }
        }
    };
}

/**
 * Action to be dispatched when we change the lobbyVideourl.
 *
 * @param {string} file - The new background image.
 * @returns {Promise}
 */
export function uploadNewBackground(file: Object) {
    return async (dispatch: Dispatch<any>, getState: Function) => {
        const { jwt } = getState()['features/base/jwt'];

        if (jwt) {
            const payload = new JwtDecode(jwt);
            const baseApi = payload.baseApi ?? interfaceConfig.BASE_API;

            if (payload.context.user.id && payload.room_slug && baseApi) {
                const data = new FormData();

                data.append('user_id', payload.context.user.id);
                data.append('room_slug', payload.room_slug);
                data.append('background', file);

                return await fetch(`${baseApi}/api/v1/background/update/`, {
                    method: 'POST',
                    body: data
                })
                .then(async _resp => {
                    const response = await _resp.json();

                    console.log('response =>', response);
                    if (response.status === 'success') {
                        dispatch(showNotification({
                            descriptionKey: 'background.backgroundUploadSuccess',
                            titleKey: 'background.backgroundUpload'
                        }, NOTIFICATION_TIMEOUT));
                        const { backgroundList } = getState()['features/letxsoft'];

                        backgroundList.push(response.uploaded_file);
                        dispatch(updateBackgroundList(backgroundList));
                    } else {
                        dispatch(showErrorNotification({
                            descriptionKey: response.message,
                            titleKey: 'background.backgroundUpload'
                        }));
                    }

                    return true;
                })
                .catch(error => {
                    console.log(' error =>', error);
                    dispatch(showErrorNotification({
                        descriptionKey: 'background.backgroundUploadError',
                        titleKey: 'background.backgroundUpload'
                    }));

                    return true;
                });
            }
        }
    };
}

/**
 * Action to be dispatched when the userType has been updated of a user.
 *
 * @param {string} tier - The new tier type of the user.
 * @returns {Promise}
 */
export function updateUserTier(tier: string) {
    return async (dispatch: Dispatch<any>, getState: Function) => {
        const { jwt } = getState()['features/base/jwt'];

        if (jwt) {
            const payload = new JwtDecode(jwt);
            const baseApi = payload.baseApi ?? interfaceConfig.BASE_API;
            const data = new FormData();

            data.append('user_id', payload.context.user.id);
            data.append('tier', tier);


            if (payload.context.user.id && tier && baseApi) {
                fetch(`${baseApi}/api/v1/tier/update/`, {
                    method: 'POST',
                    body: data
                })
                .then(async _resp => {
                    const response = await _resp.json();

                    console.log(' response =>', response);
                    if (response.status === 'success') {
                        dispatch(showNotification({
                            descriptionKey: 'notify.tierUpdateSuccess',
                            titleKey: 'notify.tierUpdate',
                            titleArguments: {
                                userName: getParticipantDisplayName(getState, payload.context.user.id),
                                tier
                            }
                        }, NOTIFICATION_TIMEOUT));
                    } else {
                        dispatch(showErrorNotification({
                            descriptionKey: response.message,
                            titleKey: 'notify.tierUpdate'
                        }));
                    }
                })
                .catch(error => {
                    console.log(' error =>', error);
                    dispatch(showErrorNotification({
                        descriptionKey: 'notify.tierUpdateError',
                        titleKey: 'notify.tierUpdate'
                    }));
                });
            }
        }
    };
}

/**
 * Action to be dispatched when we update the layout of the room.
 *
 * @param {string} layout - The new layout of the conference.
 * @returns {Promise}
 */
export function updateLayoutAPI(layout: string) {
    return async (dispatch: Dispatch<any>, getState: Function) => {
        const { jwt } = getState()['features/base/jwt'];

        if (jwt) {
            const payload = new JwtDecode(jwt);
            const baseApi = payload.baseApi ?? interfaceConfig.BASE_API;
            const data = new FormData();

            data.append('user_id', payload.context.user.id);
            data.append('layout', layout.replace('layout-', ''));

            if (payload.context.user.id && baseApi) {
                fetch(`${baseApi}/api/v1/layout/update/`, {
                    method: 'POST',
                    body: data
                })
                .then(async _resp => {
                    const response = await _resp.json();

                    console.log(' response =>', response);
                    if (response.status === 'success') {
                        dispatch(showNotification({
                            descriptionKey: 'notify.layoutUpdateSuccess',
                            titleKey: 'notify.layoutUpdate'
                        }, NOTIFICATION_TIMEOUT));
                    } else {
                        dispatch(showErrorNotification({
                            descriptionKey: response.message,
                            titleKey: 'notify.layoutUpdate'
                        }));
                    }
                })
                .catch(error => {
                    console.log(' error =>', error);
                    dispatch(showErrorNotification({
                        descriptionKey: 'notify.layoutUpdateError',
                        titleKey: 'notify.layoutUpdate'
                    }));
                });
            }
        }
    };
}

/**
 * Get user backgrounds.
 */

/**
 * Action to be dispatched when we update the layout of the room.
 *
 * @param {string} layout - The new layout of the conference.
 * @returns {Promise}
 */
export function getBackgrounds() {
    return async (dispatch: Dispatch<any>, getState: Function) => {
        const { jwt } = getState()['features/base/jwt'];

        if (jwt) {
            const payload = new JwtDecode(jwt);
            const baseApi = payload.baseApi ?? interfaceConfig.BASE_API;

            if (payload.context.user.id && baseApi) {
                fetch(`${baseApi}/api/v1/user/gallery/get?user_id=${payload.context.user.id}`)
                .then(async _resp => {
                    const response = await _resp.json();

                    console.log('response', response, response.status);
                    if (response.status === 'success') {
                        const { backgroundList } = getState()['features/letxsoft'];

                        response.gallery.forEach((x, y) => {
                            console.log(x, y);
                            backgroundList.push(x.url);
                        });
                        dispatch(updateBackgroundList(backgroundList));
                    } else {
                        dispatch(showErrorNotification({
                            descriptionKey: response.message,
                            titleKey: 'background.backgroundUpdate'
                        }));
                    }
                })
                .catch(error => {
                    console.log(' error =>', error);
                    dispatch(showErrorNotification({
                        descriptionKey: error.statusText,
                        titleKey: 'background.backgroundUpdate'
                    }));
                });
            }
        }
    };
}

/**
 * Action to be dispatched when we update the layout of the room.
 *
 * @param {string} layout - The new layout of the conference.
 * @returns {Promise}
 */
export function getRoomInfoAndUpdate() {
    return async (dispatch: Dispatch<any>, getState: Function) => {
        const { jwt } = getState()['features/base/jwt'];

        if (jwt) {
            const payload = new JwtDecode(jwt);
            const baseApi = payload.baseApi ?? interfaceConfig.BASE_API;

            if (payload.context.user.id && baseApi) {
                fetch(`${baseApi}/api/v1/room/info/get?room_slug=${payload.room_slug}`)
                .then(async _resp => {
                    const response = await _resp.json();

                    console.log('get room info response', response);
                    if (response.status === 'success' && response.current_background !== '') {
                        updateBackground(response.current_background);
                    } else {
                        updateBackground('');
                    }
                })
                .catch(error => {
                    console.log(' error =>', error);
                    updateBackground('');
                    dispatch(showErrorNotification({
                        descriptionKey: error.statusText,
                        titleKey: 'background.backgroundUpdate'
                    }));
                });
            }
        } else {
            updateBackground('');
        }
    };
}

/**
 * Action to be dispatched when we update the background.
 *
 * @param {string} url - The new url of the background.
 * @returns {Promise}
 */
export function setBackgroundToServer(url: string) {
    return async (dispatch: Dispatch<any>, getState: Function) => {
        const { jwt } = getState()['features/base/jwt'];

        if (jwt) {
            const payload = new JwtDecode(jwt);
            const baseApi = payload.baseApi ?? interfaceConfig.BASE_API;
            const data = new FormData();
            const _url = url.includes('https://') ? url : '';

            data.append('url', _url);

            if (payload.context.user.id && baseApi) {
                fetch(`${baseApi}/api/v1/background/change/`, {
                    method: 'POST',
                    body: data
                })
                .then(async _resp => {
                    const response = await _resp.json();

                    console.log('Background updated on server', response);
                })
                .catch(error => {
                    console.log(' error =>', error);
                });
            }
        }
    };
}

/**
 * Action to be dispatched when we delete the background
 * from server.
 *
 * @param {string} url - The new url of the background.
 * @returns {Promise}
 */
export function deleteBackgroundFromServer(url: string) {
    return async (dispatch: Dispatch<any>, getState: Function) => {
        const { jwt } = getState()['features/base/jwt'];

        if (jwt) {
            const payload = new JwtDecode(jwt);
            const baseApi = payload.baseApi ?? interfaceConfig.BASE_API;
            const data = new FormData();

            data.append('url', url);

            if (payload.context.user.id && baseApi) {
                fetch(`${baseApi}/api/v1/background/delete/`, {
                    method: 'POST',
                    body: data
                })
                .then(async _resp => {
                    const response = await _resp.json();

                    console.log('Background deleted from server', response);
                    if (response.status === 'success') {
                        const { backgroundList } = getState()['features/letxsoft'];
                        const _backgroundList = backgroundList.filter(item => item !== url);

                        dispatch(updateBackgroundList(_backgroundList));
                    }
                })
                .catch(error => {
                    console.log(' error =>', error);
                });
            }
        }
    };
}
