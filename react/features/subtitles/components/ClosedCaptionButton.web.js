// @flow

import { translate } from '../../base/i18n';
import { IconClosedCaption } from '../../base/icons';
import { connect } from '../../base/redux';

import {
    AbstractClosedCaptionButton,
    _abstractMapStateToProps
} from './AbstractClosedCaptionButton';

/**
 * A button which starts/stops the transcriptions.
 */
class ClosedCaptionButton
    extends AbstractClosedCaptionButton {
        
    let iconCCFromURL = !!(interfaceConfig.meetmoIcons && interfaceConfig.meetmoIcons.closed_caption);
    let iconClosedCaption = (interfaceConfig.meetmoIcons && interfaceConfig.meetmoIcons.closed_caption) ? <ReactSVG style={{width: '50px', height: '50px'}} src={interfaceConfig.meetmoIcons.closed_caption.active_svg} beforeInjection={(svg) => {
        svg.classList.add('more-action-icon-active')
        svg.classList.add(interfaceConfig.meetmoIcons.closed_caption.hover_effect)
        svg.setAttribute('fill', interfaceConfig.meetmoIcons.closed_caption.button_active_color)
        var circle = window.document.createElementNS("http://www.w3.org/2000/svg",'circle');
        circle.setAttributeNS(null, 'class', 'cls-1');
        circle.setAttributeNS(null, 'cx', 25);
        circle.setAttributeNS(null, 'cy', 25);
        circle.setAttributeNS(null, 'r', 25);
        circle.setAttributeNS(null, 'style', `fill:${interfaceConfig.meetmoIcons.closed_caption.svg_active_color}` );
        svg.prepend(circle);
    }}/> : IconClosedCaption;

    accessibilityLabel = 'toolbar.accessibilityLabel.cc';
    icon = iconClosedCaption;
    iconFromURL = iconCCFromURL;
    tooltip = 'transcribing.ccButtonTooltip';
    label = 'toolbar.startSubtitles';
    toggledLabel = 'toolbar.stopSubtitles';
}

export default translate(connect(_abstractMapStateToProps)(ClosedCaptionButton));
