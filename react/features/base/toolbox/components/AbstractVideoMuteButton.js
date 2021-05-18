// @flow

import React from 'react';

import { ReactSVG } from 'react-svg';
import { get, isEmpty } from 'lodash';

import { IconCamera, IconCameraDisabled } from '../../icons';

import AbstractButton from './AbstractButton';
import type { Props } from './AbstractButton';

/**
 * An abstract implementation of a button for toggling video mute.
 */
export default class AbstractVideoMuteButton<P : Props, S : *>
    extends AbstractButton<P, S> {
    
    iconData = get(interfaceConfig, ["meetmoIcons", "camera"], {});
    icon = !isEmpty(this.iconData) ? < ReactSVG style = {
        {
            width: '50px',
            height: '50px'
        }
    }
    src = {
        this.iconData.active_svg
    }
    beforeInjection = {
        (svg) => {
            svg.classList.add('mic-icon-active')
            svg.classList.add(this.iconData.hover_effect)
            svg.setAttribute('fill', this.iconData.button_active_color)
            svg.setAttribute('stroke', this.iconData.button_active_color)
        }
    }
    /> : IconCamera;
    toggledIcon = !isEmpty(this.iconData) ? < ReactSVG style = {
        {
            width: '50px',
            height: '50px'
        }
    }
    src = {
        this.iconData.inactive_svg
    }
    beforeInjection = {
        (svg) => {
            svg.classList.add('mic-icon-inactive')
            svg.classList.add(this.iconData.hover_effect)
            svg.setAttribute('fill', this.iconData.button_active_color)
            svg.setAttribute('stroke', this.iconData.button_active_color)
        }
    }
    /> : IconCameraDisabled;
    iconFromURL = !isEmpty(this.iconData);

<<<<<<< HEAD
=======
    icon = IconCamera;
    toggledIcon = IconCameraDisabled;
>>>>>>> letxsoft-1

    /**
     * Handles clicking / pressing the button, and toggles the video mute state
     * accordingly.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this._setVideoMuted(!this._isVideoMuted());
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this._isVideoMuted();
    }

    /**
     * Helper function to be implemented by subclasses, which must return a
     * {@code boolean} value indicating if video is muted or not.
     *
     * @protected
     * @returns {boolean}
     */
    _isVideoMuted() {
        // To be implemented by subclass.
    }

    /**
     * Helper function to perform the actual setting of the video mute / unmute
     * action.
     *
     * @param {boolean} videoMuted - Whether video should be muted or not.
     * @protected
     * @returns {void}
     */
    _setVideoMuted(videoMuted: boolean) { // eslint-disable-line no-unused-vars
        // To be implemented by subclass.
    }
}