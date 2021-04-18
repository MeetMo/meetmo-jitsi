// @flow

import { IconHangup } from '../../icons';

import AbstractButton from './AbstractButton';
import type { Props } from './AbstractButton';

/**
 * An abstract implementation of a button for disconnecting a conference.
 */
export default class AbstractHangupButton<P : Props, S: *>
    extends AbstractButton<P, S> {

    icon = IconHangup;
    
    icon = (interfaceConfig.meetmoIcons && interfaceConfig.meetmoIcons.hangup) ? <ReactSVG style={{width: '50px', height: '50px'}} src={interfaceConfig.meetmoIcons.hangup.active_svg} beforeInjection={(svg) => {
            svg.classList.add('hangup-icon-active')
            svg.classList.add(interfaceConfig.meetmoIcons.hangup.hover_effect)
            svg.setAttribute('fill', interfaceConfig.meetmoIcons.hangup.button_active_color)
            var circle = window.document.createElementNS("http://www.w3.org/2000/svg",'circle');
            circle.setAttributeNS(null, 'class', 'cls-1');
            circle.setAttributeNS(null, 'cx', 25);
            circle.setAttributeNS(null, 'cy', 25);
            circle.setAttributeNS(null, 'r', 25);
            circle.setAttributeNS(null, 'style', `fill:${interfaceConfig.meetmoIcons.hangup.svg_active_color}` );
            svg.prepend(circle);
        }}/> : IconHangup;

    iconFromURL = !!(interfaceConfig.meetmoIcons && interfaceConfig.meetmoIcons.camera);

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
