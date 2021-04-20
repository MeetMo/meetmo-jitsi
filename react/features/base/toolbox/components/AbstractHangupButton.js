// @flow

import React from 'react';
import { ReactSVG } from 'react-svg';
import { get, isEmpty } from 'lodash';

import { IconHangup } from '../../icons';
import AbstractButton from './AbstractButton';
import type { Props } from './AbstractButton';

/**
 * An abstract implementation of a button for disconnecting a conference.
 */
export default class AbstractHangupButton<P : Props, S: *>
    extends AbstractButton<P, S> {

    // icon = IconHangup;
    iconData = get(interfaceConfig, ["meetmoIcons", "hangup"], {})
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
            svg.classList.add('hangup-icon-active')
            svg.classList.add(this.iconData.hover_effect)
            svg.setAttribute('fill', this.iconData.button_active_color)
            svg.setAttribute('stroke', this.iconData.button_active_color)
        }
    }
    /> : IconHangup;

    iconFromURL = !isEmpty(this.iconData);

    /**
     * Handles clicking / pressing the button, and disconnects the conference.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this._doHangup();
    }

    /**
     * Helper function to perform the actual hangup action.
     *
     * @protected
     * @returns {void}
     */
    _doHangup() {
        // To be implemented by subclass.
    }
}
