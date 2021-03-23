/* global $, APP, YT, interfaceConfig, onVimeoPlayerReady, onVimeoPlayerStateChange,
onVimeoPlayerError */

import Logger from 'jitsi-meet-logger';

import {
    createSharedVideoEvent as createEvent,
    sendAnalytics
} from '../../../react/features/analytics';
import {
    participantJoined,
    participantLeft,
    pinParticipant
} from '../../../react/features/base/participants';
import { dockToolbox, showToolbox } from '../../../react/features/toolbox/actions.web';
import { getToolboxHeight } from '../../../react/features/toolbox/functions.web';
import { VIMEO_PARTICIPANT_NAME } from '../../../react/features/youtube-player/constants';
import UIEvents from '../../../service/UI/UIEvents';
import UIUtil from '../util/UIUtil';
import Filmstrip from '../videolayout/Filmstrip';
import LargeContainer from '../videolayout/LargeContainer';
import VideoLayout from '../videolayout/VideoLayout';

const logger = Logger.getLogger(__filename);

export const SHARED_VIDEO_CONTAINER_TYPE = 'sharedvideo';

/**
 * Example shared vimeo video link.
 * @type {string}
 */
const defaultSharedVimeoVideoLink = 'https://vimeo.com/467136407';
const updateInterval = 5000; // milliseconds

/**
 * The dialog for user input (video link).
 * @type {null}
 */
let dialog = null;

/**
 * Manager of shared video.
 */
export default class SharedVimeoVideoManager {
    /**
     *
     */
    constructor(emitter) {
        this.emitter = emitter;
        this.isSharedVideoShown = false;
        this.isPlayerAPILoaded = false;
        this.mutedWithUserInteraction = false;
        this.playerState = null;
    }

    /**
     * Indicates if the player volume is currently on. This will return true if
     * we have an available player, which is currently in a PLAYING state,
     * which isn't muted and has it's volume greater than 0.
     *
     * @returns {boolean} indicating if the volume of the shared video is
     * currently on.
     */
    isSharedVideoVolumeOn() {
        if (this.player && this.playerState === 'play') {
            const muted = this.player.getMuted(),
            volume = this.player.getVolume();
            return Promise.all([ muted, volume])
                .then((values) => {
                    return !values[0]
                        && values[1];
                });
        } else {
            return false;
        }
    }

    /**
     * Indicates if the local user is the owner of the shared video.
     * @returns {*|boolean}
     */
    isSharedVideoOwner() {
        return this.from && APP.conference.isLocalId(this.from);
    }

    /**
     * Starts shared video by asking user for url, or if its already working
     * asks whether the user wants to stop sharing the video.
     */
    toggleSharedVideo() {
        if (dialog) {
            return;
        }

        if (!this.isSharedVideoShown) {
            requestVideoLink().then(
                    url => {
                        this.emitter.emit(
                            UIEvents.UPDATE_SHARED_VIDEO, url, 'start', null, null, null, 'vimeo');
                        sendAnalytics(createEvent('started'));
                    },
                    err => {
                        logger.log('SHARED VIDEO CANCELED', err);
                        sendAnalytics(createEvent('canceled'));
                    }
            );

            return;
        }

        if (APP.conference.isLocalId(this.from)) {
            showStopVideoPropmpt().then(
                () => {
                    // make sure we stop updates for playing before we send stop
                    // if we stop it after receiving self presence, we can end
                    // up sending stop playing, and on the other end it will not
                    // stop
                    if (this.intervalId) {
                        clearInterval(this.intervalId);
                        this.intervalId = null;
                    }
                    this.emitter.emit(
                        UIEvents.UPDATE_SHARED_VIDEO, this.url, 'stop', null, null, null, 'vimeo');
                    sendAnalytics(createEvent('stopped'));
                },
                () => {}); // eslint-disable-line no-empty-function
        } else {
            APP.UI.messageHandler.showWarning({
                descriptionKey: 'dialog.alreadySharedVideoMsg',
                titleKey: 'dialog.alreadySharedVideoTitle'
            });
            sendAnalytics(createEvent('already.shared'));
        }
    }

    /**
     * Shows the player component and starts the process that will be sending
     * updates, if we are the one shared the video.
     *
     * @param id the id of the sender of the command
     * @param url the video url
     * @param attributes
     */
    onSharedVideoStart(id, url, attributes) {
        if (this.isSharedVideoShown) {
            return;
        }
        
        this.isSharedVideoShown = true;
        
        // the video url
        this.url = url;
        
        // the owner of the video
        this.from = id;
        
        this.mutedWithUserInteraction = APP.conference.isLocalAudioMuted();
        
        // listen for local audio mute events
        this.localAudioMutedListener = this.onLocalAudioMuted.bind(this);
        this.emitter.on(UIEvents.AUDIO_MUTED, this.localAudioMutedListener);
        
        // This code loads the IFrame Player API code asynchronously.
        const tag = document.createElement('script');
        tag.onload = function() {
            window.onVimeoIframeAPIReady();
        }
        tag.src = 'https://player.vimeo.com/api/player.js';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        
        // sometimes we receive errors like player not defined
        // or player.pauseVideo is not a function
        // we need to operate with player after start playing
        // self.player will be defined once it start playing
        // and will process any initial attributes if any
        this.initialAttributes = attributes;
        
        const self = this;
        
        window.onVimeoIframeAPIReady = function() {
            self.isPlayerAPILoaded = true;
            const showControls
                = APP.conference.isLocalId(self.from) ? 1 : 0;
            const p = new Vimeo.Player('sharedVideo', {
                autoplay: 1,
                url: `https://player.vimeo.com/video/${self.url}`,
                controls: showControls
            });

            p.on('loaded', (e) => {
                onVimeoPlayerReady(e);
            });
            p.on('play', (e) => {
                self.playerState = 'play';
                onVimeoPlayerStateChange(e, 'play');
            });
            p.on('pause', (e) => {
                self.playerState = 'pause';
                onVimeoPlayerStateChange(e, 'pause');
            });
            p.on('ended', (e) => {
                self.playerState = 'ended';
                onVimeoPlayerStateChange(e, 'ended');
            });
            p.on('error', onVimeoPlayerError);
            // add listener for volume changes
            p.on('volumechange', onVolumeChange);

            if (APP.conference.isLocalId(self.from)) {
            // adds progress listener that will be firing events
            // while we are paused and we change the progress of the
            // video (seeking forward or backward on the video)
                p.on(
                    'progress', onVideoProgress);
            }
            self.player = p;
        };

        /**
         * Indicates that a change in state has occurred for the shared video.
         * @param event the event notifying us of the change
         */
        window.onVimeoPlayerStateChange = function(event, state) {
            // eslint-disable-next-line eqeqeq
            if (state == 'play') {
                if (self.initialAttributes) {
                    // If a network update has occurred already now is the
                    // time to process it.
                    self.processVideoUpdate(
                        self.player,
                        self.initialAttributes);

                    self.initialAttributes = null;
                }
                self.smartAudioMute();
                // eslint-disable-next-line eqeqeq
            } else if (state == 'pause') {
                self.smartAudioUnmute();
                sendAnalytics(createEvent('paused'));
            }
            // eslint-disable-next-line eqeqeq
            self.fireSharedVideoEvent(state == 'pause');
        };

        /**
         * Track player progress while paused.
         * @param event
         */
        window.onVideoProgress = function(event) {
            const state = self.playerState;
            
            // console.log('on video progress =>>>', event, state);
            // eslint-disable-next-line eqeqeq
            if (state == 'pause') {
                self.fireSharedVideoEvent(true);
            }
        };

        /**
         * Gets notified for volume state changed.
         * @param event
         */
        window.onVolumeChange = function(event) {
            self.fireSharedVideoEvent();

            // console.log('on video volume change =>>>', event);

            // let's check, if player is not muted lets mute locally
            if (event.data.volume > 0 && !event.data.muted) {
                self.smartAudioMute();
            } else if (event.data.volume <= 0 || event.data.muted) {
                self.smartAudioUnmute();
            }
            sendAnalytics(createEvent(
                'volume.changed',
                {
                    volume: event.data.volume,
                    muted: event.data.muted
                }));
        };

        window.onVimeoPlayerReady = function(event) {
            const player = self.player;
            
            // do not relay on autoplay as it is not sending all of the events
            // in onVimeoPlayerStateChange

            player.play();

            // remove the #sharedVideoIFrame div initially present
            document.getElementById('sharedVideoIFrame').remove();

            const iframe = player.element;
            iframe.id = 'sharedVideoIFrame';

            // eslint-disable-next-line no-use-before-define
            self.sharedVideo = new SharedVideoContainer(
                { url,
                    iframe,
                    player });

            // prevents pausing participants not sharing the video
            // to pause the video
            if (!APP.conference.isLocalId(self.from)) {
                $('#sharedVideo').css('pointer-events', 'none');
            }

            VideoLayout.addLargeVideoContainer(
                SHARED_VIDEO_CONTAINER_TYPE, self.sharedVideo);
            
            
            APP.store.dispatch(participantJoined({

                // FIXME The cat is out of the bag already or rather _room is
                // not private because it is used in multiple other places
                // already such as AbstractPageReloadOverlay.
                conference: APP.conference._room,
                id: self.url,
                isFakeParticipant: true,
                name: VIMEO_PARTICIPANT_NAME
            }));

            // Letxsoft, stop pinning the participant on youtube video add.
            setTimeout(() => {
                APP.store.dispatch(pinParticipant(self.url));
            }, 500);

            // If we are sending the command and we are starting the player
            // we need to continuously send the player current time position
            if (APP.conference.isLocalId(self.from)) {
                self.intervalId = setInterval(
                    self.fireSharedVideoEvent.bind(self),
                    updateInterval);
            }
            iframe.width = '100%';
            iframe.height = '100%';
        };

        window.onVimeoPlayerError = function(event) {
            logger.error('Error in the player:', event);

            // store the error player, so we can remove it
            self.errorInPlayer = event.target;
        };
    }

    /**
     * Process attributes, whether player needs to be paused or seek.
     * @param player the player to operate over
     * @param attributes the attributes with the player state we want
     */
    processVideoUpdate(player, attributes) {
        if (!attributes) {
            return;
        }

        // eslint-disable-next-line eqeqeq
        if (attributes.state == 'playing') {

            const isPlayerPaused
                = this.playerState === 'pause';

            // If our player is currently paused force the seek.
            this.processTime(player, attributes, isPlayerPaused);

            // Process mute.
            const isAttrMuted = attributes.muted === 'true';

            player.getMuted()
            .then((isMuted) => {
                if (isMuted !== isAttrMuted) {
                    this.smartPlayerMute(isAttrMuted, true);
                }
            })

            // Process volume
            if (!isAttrMuted
                && attributes.volume !== undefined
                // eslint-disable-next-line eqeqeq
                && player.getVolume() != attributes.volume) {

                player.setVolume(attributes.volume);
                logger.info(`Player change of volume:${attributes.volume}`);
            }

            if (isPlayerPaused) {
                player.play();
            }
            // eslint-disable-next-line eqeqeq
        } else if (attributes.state == 'pause') {
            // if its not paused, pause it
            player.pause();

            this.processTime(player, attributes, true);
        }
    }

    /**
     * Check for time in attributes and if needed seek in current player
     * @param player the player to operate over
     * @param attributes the attributes with the player state we want
     * @param forceSeek whether seek should be forced
     */
    processTime(player, attributes, forceSeek) {
        if (forceSeek) {
            logger.info('Player seekTo:', attributes.time);
            player.setCurrentTime(attributes.time);

            return;
        }

        // check received time and current time
        player.getCurrentTime()
        .then((currentPosition) => {
            const diff = Math.abs(attributes.time - currentPosition);
            // if we drift more than the interval for checking
            // sync, the interval is in milliseconds
            if (diff > updateInterval / 1000) {
                logger.info('Player seekTo:', attributes.time,
                    ' current time is:', currentPosition, ' diff:', diff);
                player.setCurrentTime(attributes.time);
            }
        })
    }

    /**
     * Checks current state of the player and fire an event with the values.
     */
    fireSharedVideoEvent(sendPauseEvent) {
        // ignore update checks if we are not the owner of the video
        // or there is still no player defined or we are stopped
        // (in a process of stopping)
        if (!APP.conference.isLocalId(this.from) || !this.playerState
            || !this.isSharedVideoShown) {
            return;
        }

        const state = this.playerState;

        // if its paused and haven't been pause - send paused
        if (state === 'pause' && sendPauseEvent) {
            this.player.getCurrentTime()
            .then((volume) => {
                this.emitter.emit(UIEvents.UPDATE_SHARED_VIDEO,
                    this.url, 'pause', volume, null, null, 'vimeo');
            })
        } else if (state === 'play') {
            // if its playing and it was paused - send update with time
            // if its playing and was playing just send update with time
            var currentTime = this.player.getCurrentTime(),
            muted = this.player.getMuted(),
            volume = this.player.getVolume();
            Promise.all([currentTime, muted, volume])
            .then((values) => {
                this.emitter.emit(UIEvents.UPDATE_SHARED_VIDEO,
                    this.url, 'playing',
                    values[0],
                    values[1],
                    values[2], 'vimeo');
            })
        }
    }

    /**
     * Updates video, if it's not playing and needs starting or if it's playing
     * and needs to be paused.
     * @param id the id of the sender of the command
     * @param url the video url
     * @param attributes
     */
    onSharedVideoUpdate(id, url, attributes) {
        // if we are sending the event ignore
        if (APP.conference.isLocalId(this.from)) {
            return;
        }

        if (!this.isSharedVideoShown) {
            this.onSharedVideoStart(id, url, attributes);

            return;
        }

        // eslint-disable-next-line no-negated-condition
        if (!this.player) {
            this.initialAttributes = attributes;
        } else {
            this.processVideoUpdate(this.player, attributes);
        }
    }

    /**
     * Stop shared video if it is currently showed. If the user started the
     * shared video is the one in the id (called when user
     * left and we want to remove video if the user sharing it left).
     * @param id the id of the sender of the command
     */
    onSharedVideoStop(id, attributes) {
        if (!this.isSharedVideoShown) {
            return;
        }

        if (this.from !== id) {
            return;
        }

        if (!this.player) {
            // if there is no error in the player till now,
            // store the initial attributes
            if (!this.errorInPlayer) {
                this.initialAttributes = attributes;

                return;
            }
        }

        this.emitter.removeListener(UIEvents.AUDIO_MUTED,
            this.localAudioMutedListener);
        this.localAudioMutedListener = null;

        APP.store.dispatch(participantLeft(this.url, APP.conference._room));

        VideoLayout.showLargeVideoContainer(SHARED_VIDEO_CONTAINER_TYPE, false)
            .then(() => {
                VideoLayout.removeLargeVideoContainer(
                    SHARED_VIDEO_CONTAINER_TYPE);
                
                //Add the sharedVideoIframe div in the app to replace it
                var _iframeIdDiv = document.createElement('div');
                _iframeIdDiv.id = 'sharedVideoIFrame';

                document.getElementById('sharedVideo').appendChild(_iframeIdDiv);

                if (this.player) {
                    this.player.destroy();
                    this.player = null;
                } else if (this.errorInPlayer) {
                    // if there is an error in player, remove that instance
                    this.errorInPlayer.destroy();
                    this.errorInPlayer = null;
                }
                this.smartAudioUnmute();

                // revert to original behavior (prevents pausing
                // for participants not sharing the video to pause it)
                $('#sharedVideo').css('pointer-events', 'auto');

                this.emitter.emit(
                    UIEvents.UPDATE_SHARED_VIDEO, null, 'removed', null, null, null, 'vimeo');
            });

        this.url = null;
        this.isSharedVideoShown = false;
        this.initialAttributes = null;
    }

    /**
     * Receives events for local audio mute/unmute by local user.
     * @param muted boolena whether it is muted or not.
     * @param {boolean} indicates if this mute was a result of user interaction,
     * i.e. pressing the mute button or it was programatically triggerred
     */
    onLocalAudioMuted(muted, userInteraction) {
        if (!this.player) {
            return;
        }

        if (muted) {
            this.mutedWithUserInteraction = userInteraction;
        } else if (this.playerState !== 'pause') {
            this.smartPlayerMute(true, false);

            // Check if we need to update other participants
            this.fireSharedVideoEvent();
        }
    }

    /**
     * Mutes / unmutes the player.
     * @param mute true to mute the shared video, false - otherwise.
     * @param {boolean} Indicates if this mute is a consequence of a network
     * video update or is called locally.
     */
    smartPlayerMute(mute, isVideoUpdate) {
        this.player.getMuted()
        .then((isMuted) => {
            if (!isMuted && mute) {
                this.player.mute();
    
                if (isVideoUpdate) {
                    this.smartAudioUnmute();
                }
            } else if (isMuted && !mute) {
                this.player.unMute();
                if (isVideoUpdate) {
                    this.smartAudioMute();
                }
            }
        })
    }

    /**
     * Smart mike unmute. If the mike is currently muted and it wasn't muted
     * by the user via the mike button and the volume of the shared video is on
     * we're unmuting the mike automatically.
     */
    smartAudioUnmute() {
        if (APP.conference.isLocalAudioMuted()
            && !this.mutedWithUserInteraction
            && !this.isSharedVideoVolumeOn()) {
            sendAnalytics(createEvent('audio.unmuted'));
            logger.log('Shared video: audio unmuted');
            this.emitter.emit(UIEvents.AUDIO_MUTED, false, false);
        }
    }

    /**
     * Smart mike mute. If the mike isn't currently muted and the shared video
     * volume is on we mute the mike.
     */
    smartAudioMute() {
        if (!APP.conference.isLocalAudioMuted()
            && this.isSharedVideoVolumeOn()) {
            sendAnalytics(createEvent('audio.muted'));
            logger.log('Shared video: audio muted');
            this.emitter.emit(UIEvents.AUDIO_MUTED, true, false);
        }
    }
}

/**
 * Container for shared video iframe.
 */
class SharedVideoContainer extends LargeContainer {
    /**
     *
     */
    constructor({ url, iframe, player }) {
        super();

        this.$iframe = $(iframe);
        this.url = url;
        this.player = player;
    }

    /**
     *
     */
    show() {
        const self = this;


        return new Promise(resolve => {
            this.$iframe.fadeIn(300, () => {
                self.bodyBackground = document.body.style.background;
                document.body.style.background = 'black';
                this.$iframe.css({ opacity: 1 });
                APP.store.dispatch(dockToolbox(true));
                resolve();
            });
        });
    }

    /**
     *
     */
    hide() {
        const self = this;

        APP.store.dispatch(dockToolbox(false));

        return new Promise(resolve => {
            this.$iframe.fadeOut(300, () => {
                document.body.style.background = self.bodyBackground;
                this.$iframe.css({ opacity: 0 });
                resolve();
            });
        });
    }

    /**
     *
     */
    onHoverIn() {
        APP.store.dispatch(showToolbox());
    }

    /**
     *
     */
    get id() {
        return this.url;
    }

    /**
     *
     */
    resize(containerWidth, containerHeight) {
        let height, width;

        if (interfaceConfig.VERTICAL_FILMSTRIP) {
            height = containerHeight - getToolboxHeight();
            width = containerWidth - Filmstrip.getVerticalFilmstripWidth();
        } else {
            height = containerHeight - Filmstrip.getFilmstripHeight();
            width = containerWidth;
        }

        this.$iframe.width(width).height(height);
    }

    /**
     * @return {boolean} do not switch on dominant speaker event if on stage.
     */
    stayOnStage() {
        return false;
    }
}

/**
 * Checks if given string is youtube url.
 * @param {string} url string to check.
 * @returns {boolean}
 */
function getVimeoLink(url) {
    const p = /^(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/)(\d+)?$/;// eslint-disable-line max-len


    return url.match(p) ? RegExp.$1 : false;
}

/**
 * Ask user if he want to close shared video.
 */
function showStopVideoPropmpt() {
    return new Promise((resolve, reject) => {
        const submitFunction = function(e, v) {
            if (v) {
                resolve();
            } else {
                reject();
            }
        };

        const closeFunction = function() {
            dialog = null;
        };

        dialog = APP.UI.messageHandler.openTwoButtonDialog({
            titleKey: 'dialog.removeSharedVideoTitle',
            msgKey: 'dialog.removeSharedVideoMsg',
            leftButtonKey: 'dialog.Remove',
            submitFunction,
            closeFunction
        });
    });
}

/**
 * Ask user for shared video url to share with others.
 * Dialog validates client input to allow only youtube urls.
 */
function requestVideoLink() {
    const i18n = APP.translation;
    const cancelButton = i18n.generateTranslationHTML('dialog.Cancel');
    const shareButton = i18n.generateTranslationHTML('dialog.Share');
    const backButton = i18n.generateTranslationHTML('dialog.Back');
    const linkError
        = i18n.generateTranslationHTML('dialog.shareVimeoVideoLinkError');

    return new Promise((resolve, reject) => {
        dialog = APP.UI.messageHandler.openDialogWithStates({
            state0: {
                titleKey: 'dialog.shareVideoTitle',
                html: `
                    <input name='sharedVideoUrl' type='text'
                           class='input-control'
                           data-i18n='[placeholder]defaultLink'
                           autofocus>`,
                persistent: false,
                buttons: [
                    { title: cancelButton,
                        value: false },
                    { title: shareButton,
                        value: true }
                ],
                focus: ':input:first',
                defaultButton: 1,
                submit(e, v, m, f) { // eslint-disable-line max-params
                    e.preventDefault();
                    if (!v) {
                        reject('cancelled');
                        dialog.close();

                        return;
                    }

                    const sharedVideoUrl = f.sharedVideoUrl;

                    if (!sharedVideoUrl) {
                        return;
                    }

                    const urlValue
                        = encodeURI(UIUtil.escapeHtml(sharedVideoUrl));
                    const vVideoId = getVimeoLink(urlValue);

                    if (!vVideoId) {
                        dialog.goToState('state1');

                        return false;
                    }

                    resolve(vVideoId);
                    dialog.close();
                }
            },

            state1: {
                titleKey: 'dialog.shareVideoTitle',
                html: linkError,
                persistent: false,
                buttons: [
                    { title: cancelButton,
                        value: false },
                    { title: backButton,
                        value: true }
                ],
                focus: ':input:first',
                defaultButton: 1,
                submit(e, v) {
                    e.preventDefault();
                    if (v === 0) {
                        reject();
                        dialog.close();
                    } else {
                        dialog.goToState('state0');
                    }
                }
            }
        }, {
            close() {
                dialog = null;
            }
        }, {
            url: defaultSharedVimeoVideoLink
        });
    });
}
