// @flow
import React from 'react';
import { ReactSVG } from 'react-svg';
import {
    get,
    isEmpty
} from 'lodash';
import {
    translate
} from '../../base/i18n';
import {
    IconClosedCaption
} from '../../base/icons';
import {
    connect
} from '../../base/redux';

import {
    AbstractClosedCaptionButton,
    _abstractMapStateToProps
} from './AbstractClosedCaptionButton';

/**
 * A button which starts/stops the transcriptions.
 */
class ClosedCaptionButton
extends AbstractClosedCaptionButton {

    iconData = get(interfaceConfig, ["meetmoIcons", "closed_caption"], {});
    iconCCFromURL = !isEmpty(this.iconData);
    iconClosedCaption = !isEmpty(this.iconData) ? < ReactSVG style = {
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
            svg.classList.add('more-action-icon-active')
            svg.classList.add(this.iconData.hover_effect)
            svg.setAttribute('fill', this.iconData.button_active_color)
            svg.setAttribute('stroke', this.iconData.button_active_color)
        }
    }
    /> : IconClosedCaption;

    accessibilityLabel = 'toolbar.accessibilityLabel.cc';
    icon = this.iconClosedCaption;
    iconFromURL = this.iconCCFromURL;
    tooltip = 'transcribing.ccButtonTooltip';
    label = 'toolbar.startSubtitles';
    toggledLabel = 'toolbar.stopSubtitles';
}

export default translate(connect(_abstractMapStateToProps)(
ClosedCaptionButton));