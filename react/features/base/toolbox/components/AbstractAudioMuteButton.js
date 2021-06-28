// @flow

import React from 'react';
import { get, isEmpty } from 'lodash';

import { IconFromConfig } from "../../../base/icons";

import { IconMicDisabled, IconMicrophone } from '../../icons';

import AbstractButton from './AbstractButton';
import type { Props } from './AbstractButton';

declare var interfaceConfig: Object;

/**
 * An abstract implementation of a button for toggling audio mute.
 */
export default class AbstractAudioMuteButton<P: Props, S: *>
    extends AbstractButton<P, S> {
    iconData = get(interfaceConfig, ["meetmoIcons", "microphone"], {});
    icon = !isEmpty(this.iconData) ? (
        <IconFromConfig
            configuration={this.iconData}
            style={{
                width: "32px",
                height: "32px",
                svgWidth: "32",
                svgHeight: "32",
            }}
        />
    ) : (
        IconMicrophone
    );
    toggledIcon = !isEmpty(this.iconData) ? (
        <IconFromConfig
            configuration={this.iconData}
            iconKey="inactive_svg"
            style={{
                width: "32px",
                height: "32px",
                svgWidth: "32",
                svgHeight: "32",
            }}
        />
    ) : (
        IconMicDisabled
    );
    iconFromURL = !isEmpty(this.iconData);


    /**
     * Handles clicking / pressing the button, and toggles the audio mute state
     * accordingly.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this._setAudioMuted(!this._isAudioMuted());
    }

    /**
     * Helper function to be implemented by subclasses, which must return a
     * boolean value indicating if audio is muted or not.
     *
     * @protected
     * @returns {boolean}
     */
    _isAudioMuted() {
        // To be implemented by subclass.
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this._isAudioMuted();
    }

    /**
     * Helper function to perform the actual setting of the audio mute / unmute
     * action.
     *
     * @param {boolean} audioMuted - Whether video should be muted or not.
     * @protected
     * @returns {void}
     */
    _setAudioMuted(audioMuted: boolean) { // eslint-disable-line no-unused-vars
        // To be implemented by subclass.
    }
}
