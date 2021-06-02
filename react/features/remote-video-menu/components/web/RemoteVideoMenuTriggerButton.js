// @flow

import React, { Component } from 'react';
import { get, isEqual } from "lodash";

import { Icon, IconMenuThumb } from '../../../base/icons';
import { getLocalParticipant, PARTICIPANT_ROLE } from '../../../base/participants';
import { Popover } from '../../../base/popover';
import { connect } from '../../../base/redux';
import { ChangeUserTier } from '../../../letxsoft/components';

import {
    GrantModeratorButton,
    MuteButton,
    MuteEveryoneElseButton,
    KickButton,
    PrivateMessageMenuButton,
    RemoteControlButton,
    RemoteVideoMenu,
    VolumeSlider
} from './';


declare var $: Object;
declare var interfaceConfig: Object;

/**
 * The type of the React {@code Component} props of
 * {@link RemoteVideoMenuTriggerButton}.
 */
type Props = {

    /**
     * Whether or not to display the kick button.
     */
    _disableKick: boolean,

    /**
     * Whether or not to display the remote mute buttons.
     */
    _disableRemoteMute: Boolean,

    /**
     * Whether or not the participant is a conference moderator.
     */
    _isModerator: boolean,

    /**
     * A value between 0 and 1 indicating the volume of the participant's
     * audio element.
     */
    initialVolumeValue: number,

    /**
     * Whether or not the participant is currently muted.
     */
    isAudioMuted: boolean,

    /**
     * Callback to invoke when the popover has been displayed.
     */
    onMenuDisplay: Function,

    /**
     * Callback to invoke choosing to start a remote control session with
     * the participant.
     */
    onRemoteControlToggle: Function,

    /**
     * Callback to invoke when changing the level of the participant's
     * audio element.
     */
    onVolumeChange: Function,

    /**
     * The position relative to the trigger the remote menu should display
     * from. Valid values are those supported by AtlasKit
     * {@code InlineDialog}.
     */
    menuPosition: string,

    /**
     * The ID for the participant on which the remote video menu will act.
     */
    participantID: string,

    /**
     * The current state of the participant's remote control session.
     */
    remoteControlState: number
};

/**
 * React {@code Component} for displaying an icon associated with opening the
 * the {@code RemoteVideoMenu}.
 *
 * @extends {Component}
 */
class RemoteVideoMenuTriggerButton extends Component<Props> {
    /**
     * The internal reference to topmost DOM/HTML element backing the React
     * {@code Component}. Accessed directly for associating an element as
     * the trigger for a popover.
     *
     * @private
     * @type {HTMLDivElement}
     */
    _rootElement = null;

    /**
     * Initializes a new {#@code RemoteVideoMenuTriggerButton} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Object) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onShowRemoteMenu = this._onShowRemoteMenu.bind(this);
    }

    /**
     * Listen to component update. Used to check if volume is updated in redux and call
     * appropriate function to set user volume.
     * 
     * This will update only that widget which has the same participant ID as that of the
     * volume update command's user parameter.
     * 
     * @param {Object} prevProps - Previous props value to compare against current this.props
     */
    componentDidUpdate(prevProps) {
        if (
            !isEqual(get(prevProps, ['volumeUpdate', 'volume'], null), get(this, ['props', 'volumeUpdate', 'volume'], null)) &&
            isEqual(get(this, ['props', 'volumeUpdate', 'user'], null), get(this, ['props', 'participantID'], null))
        ) {
            this.props.onVolumeChange(get(this, ['props', 'volumeUpdate', 'volume'], 100));
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const content = this._renderRemoteVideoMenu();

        if (!content) {
            return null;
        }

        return (
            <Popover
                content = { content }
                onPopoverOpen = { this._onShowRemoteMenu }
                position = { this.props.menuPosition }>
                <span
                    className = 'popover-trigger remote-video-menu-trigger'>
                    <Icon
                        size = '1em'
                        src = { IconMenuThumb }
                        title = 'Remote user controls' />
                </span>
            </Popover>
        );
    }

    _onShowRemoteMenu: () => void;

    /**
     * Opens the {@code RemoteVideoMenu}.
     *
     * @private
     * @returns {void}
     */
    _onShowRemoteMenu() {
        this.props.onMenuDisplay();
    }

    /**
     * Creates a new {@code RemoteVideoMenu} with buttons for interacting with
     * the remote participant.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderRemoteVideoMenu() {
        const {
            _disableKick,
            _disableRemoteMute,
            _isModerator,
            initialVolumeValue,
            isAudioMuted,
            onRemoteControlToggle,
            onVolumeChange,
            remoteControlState,
            participantID
        } = this.props;

        const buttons = [];

        if (_isModerator) {
            if (!_disableRemoteMute) {
                buttons.push(
                    <MuteButton
                        isAudioMuted = { isAudioMuted }
                        key = 'mute'
                        participantID = { participantID } />
                );
                buttons.push(
                    <MuteEveryoneElseButton
                        key = 'mute-others'
                        participantID = { participantID } />
                );
            }

            buttons.push(
                <GrantModeratorButton
                    key = 'grant-moderator'
                    participantID = { participantID } />
            );

            if (!_disableKick) {
                buttons.push(
                    <KickButton
                        key = 'kick'
                        participantID = { participantID } />
                );
            }

            buttons.push(
                <ChangeUserTier
                    key = 'grant-moderator-inner'
                    participantID = { participantID } />
            );
        }

        if (remoteControlState) {
            buttons.push(
                <RemoteControlButton
                    key = 'remote-control'
                    onClick = { onRemoteControlToggle }
                    participantID = { participantID }
                    remoteControlState = { remoteControlState } />
            );
        }

        buttons.push(
            <PrivateMessageMenuButton
                key = 'privateMessage'
                participantID = { participantID } />
        );

        if (onVolumeChange) {
            buttons.push(
                <VolumeSlider
                    initialValue = { initialVolumeValue }
                    key = 'volume-slider'
                    onChange = { onVolumeChange } />
            );
        }

        if (buttons.length > 0) {
            return (
                <RemoteVideoMenu id = { participantID }>
                    { buttons }
                </RemoteVideoMenu>
            );
        }

        return null;
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code RemoteVideoMenuTriggerButton}'s props.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {{
 *     _isModerator: boolean
 * }}
 */
function _mapStateToProps(state) {
    const participant = getLocalParticipant(state);
    const { remoteVideoMenu = {}, disableRemoteMute } = state['features/base/config'];
    const { disableKick } = remoteVideoMenu;
    const { volumeUpdate } = state["features/base/settings"];

    return {
        _isModerator: Boolean(participant?.role === PARTICIPANT_ROLE.MODERATOR),
        _disableKick: Boolean(disableKick),
        _disableRemoteMute: Boolean(disableRemoteMute),
        volumeUpdate
    };
}

export default connect(_mapStateToProps)(RemoteVideoMenuTriggerButton);
