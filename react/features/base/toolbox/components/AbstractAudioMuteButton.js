// @flow

import React from 'react';
import { ReactSVG } from 'react-svg';

import { IconMicDisabled, IconMicrophone } from '../../icons';

import AbstractButton from './AbstractButton';
import type { Props } from './AbstractButton';

declare var interfaceConfig: Object;

/**
 * An abstract implementation of a button for toggling audio mute.
 */
export default class AbstractAudioMuteButton<P: Props, S: *>
    extends AbstractButton<P, S> {

    icon = (interfaceConfig.meetmoIcons && interfaceConfig.meetmoIcons.microphone) ? <ReactSVG style={{width: '50px', height: '50px'}} src={interfaceConfig.meetmoIcons.microphone.active_svg} beforeInjection={(svg) => {
            svg.classList.add('mic-icon-active')
            svg.classList.add(interfaceConfig.meetmoIcons.microphone.hover_effect)
            svg.setAttribute('fill', interfaceConfig.meetmoIcons.microphone.button_active_color)
            var circle = window.document.createElementNS("http://www.w3.org/2000/svg",'circle');
            circle.setAttributeNS(null, 'class', 'cls-1');
            circle.setAttributeNS(null, 'cx', 25);
            circle.setAttributeNS(null, 'cy', 25);
            circle.setAttributeNS(null, 'r', 25);
            circle.setAttributeNS(null, 'style', `fill:${interfaceConfig.meetmoIcons.microphone.svg_active_color}` );
            svg.prepend(circle);
        }}/> : IconMicrophone;
    toggledIcon = (interfaceConfig.meetmoIcons && interfaceConfig.meetmoIcons.microphone) ? <ReactSVG style={{width: '50px', height: '50px'}} src={interfaceConfig.meetmoIcons.microphone.inactive_svg} beforeInjection={(svg) => {
        svg.classList.add('mic-icon-inactive')
    svg.classList.add(interfaceConfig.meetmoIcons.microphone.hover_effect)
        svg.setAttribute('fill', interfaceConfig.meetmoIcons.microphone.button_active_color)
        var circle = window.document.createElementNS("http://www.w3.org/2000/svg",'circle');
        circle.setAttributeNS(null, 'class', 'cls-1');
        circle.setAttributeNS(null, 'cx', 25);
        circle.setAttributeNS(null, 'cy', 25);
        circle.setAttributeNS(null, 'r', 25);
        circle.setAttributeNS(null, 'style', `fill:${interfaceConfig.meetmoIcons.microphone.svg_active_color}` );
        svg.prepend(circle);
    }}/> : IconMicDisabled;
    iconFromURL = !!(interfaceConfig.meetmoIcons && interfaceConfig.meetmoIcons.microphone);


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