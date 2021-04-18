// @flow

import React from 'react';

import { ReactSVG } from 'react-svg';

import { IconCamera, IconCameraDisabled } from '../../icons';

import AbstractButton from './AbstractButton';
import type { Props } from './AbstractButton';

declare var interfaceConfig: Object;

/**
 * An abstract implementation of a button for toggling video mute.
 */
export default class AbstractVideoMuteButton<P : Props, S : *>
    extends AbstractButton<P, S> {

    // icon = IconCamera;
    // toggledIcon = IconCameraDisabled;
    // icon = (interfaceConfig.meetmoIcons && interfaceConfig.meetmoIcons.camera) ? <ReactSVG style={{width: '50px', height: '50px'}} src={interfaceConfig.meetmoIcons.camera.active_svg} /> : IconCamera;
    // toggledIcon = (interfaceConfig.meetmoIcons && interfaceConfig.meetmoIcons.camera) ? <ReactSVG style={{width: '50px', height: '50px'}} src={interfaceConfig.meetmoIcons.camera.inactive_svg} /> : IconCameraDisabled;
    // iconFromURL = !!(interfaceConfig.meetmoIcons && interfaceConfig.meetmoIcons.camera);
    
    icon = (interfaceConfig.meetmoIcons && interfaceConfig.meetmoIcons.camera) ? <ReactSVG style={{width: '50px', height: '50px'}} src={interfaceConfig.meetmoIcons.camera.active_svg} beforeInjection={(svg) => {
            svg.classList.add('mic-icon-active')
            svg.classList.add(interfaceConfig.meetmoIcons.camera.hover_effect)
            svg.setAttribute('fill', interfaceConfig.meetmoIcons.camera.button_active_color)
            var circle = window.document.createElementNS("http://www.w3.org/2000/svg",'circle');
            circle.setAttributeNS(null, 'class', 'cls-1');
            circle.setAttributeNS(null, 'cx', 25);
            circle.setAttributeNS(null, 'cy', 25);
            circle.setAttributeNS(null, 'r', 25);
            circle.setAttributeNS(null, 'style', `fill:${interfaceConfig.meetmoIcons.camera.svg_active_color}` );
            svg.prepend(circle);
        }}/> : IconCamera;
    toggledIcon = (interfaceConfig.meetmoIcons && interfaceConfig.meetmoIcons.camera) ? <ReactSVG style={{width: '50px', height: '50px'}} src={interfaceConfig.meetmoIcons.camera.inactive_svg} beforeInjection={(svg) => {
        svg.classList.add('mic-icon-inactive')
        svg.classList.add(interfaceConfig.meetmoIcons.camera.hover_effect)
        svg.setAttribute('fill', interfaceConfig.meetmoIcons.camera.button_active_color)
        var circle = window.document.createElementNS("http://www.w3.org/2000/svg",'circle');
        circle.setAttributeNS(null, 'class', 'cls-1');
        circle.setAttributeNS(null, 'cx', 25);
        circle.setAttributeNS(null, 'cy', 25);
        circle.setAttributeNS(null, 'r', 25);
        circle.setAttributeNS(null, 'style', `fill:${interfaceConfig.meetmoIcons.camera.svg_active_color}` );
        svg.prepend(circle);
    }}/> : IconCameraDisabled;
    iconFromURL = !!(interfaceConfig.meetmoIcons && interfaceConfig.meetmoIcons.camera);


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
