/* @flow */

import InlineDialog from '@atlaskit/inline-dialog';
import React, { Component } from 'react';

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { translate } from '../../../base/i18n';
import { IconMenuThumb } from '../../../base/icons';

import ToolbarButton from './ToolbarButton';

/**
 * The type of the React {@code Component} props of {@link OverflowMenuButton}.
 */
type Props = {

    /**
     * A child React Element to display within {@code InlineDialog}.
     */
    children: React$Node,

    /**
     * Whether or not the OverflowMenu popover should display.
     */
    isOpen: boolean,

    /**
     * Calback to change the visibility of the overflow menu.
     */
    onVisibilityChange: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * A React {@code Component} for opening or closing the {@code OverflowMenu}.
 *
 * @extends Component
 */
class OverflowMenuButton extends Component<Props> {
    /**
     * Initializes a new {@code OverflowMenuButton} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onCloseDialog = this._onCloseDialog.bind(this);
        this._onToggleDialogVisibility
            = this._onToggleDialogVisibility.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { children, isOpen, t } = this.props;
        let iconMoreActionFromURL = !!(interfaceConfig.meetmoIcons && interfaceConfig.meetmoIcons.more_actions);
        let iconMenuThumb = (interfaceConfig.meetmoIcons && interfaceConfig.meetmoIcons.more_actions) ? <ReactSVG style={{width: '50px', height: '50px'}} src={interfaceConfig.meetmoIcons.more_actions.active_svg} beforeInjection={(svg) => {
            svg.classList.add('more-action-icon-active')
            svg.classList.add(interfaceConfig.meetmoIcons.more_actions.hover_effect)
            svg.setAttribute('fill', interfaceConfig.meetmoIcons.more_actions.button_active_color)
            var circle = window.document.createElementNS("http://www.w3.org/2000/svg",'circle');
            circle.setAttributeNS(null, 'class', 'cls-1');
            circle.setAttributeNS(null, 'cx', 25);
            circle.setAttributeNS(null, 'cy', 25);
            circle.setAttributeNS(null, 'r', 25);
            circle.setAttributeNS(null, 'style', `fill:${interfaceConfig.meetmoIcons.more_actions.svg_active_color}` );
            svg.prepend(circle);
        }}/> : IconMenuThumb;
        return (
            <div className = 'toolbox-button-wth-dialog'>
                <InlineDialog
                    content = { children }
                    isOpen = { isOpen }
                    onClose = { this._onCloseDialog }
                    position = { 'top right' }>
                    <ToolbarButton
                        accessibilityLabel =
                            { t('toolbar.accessibilityLabel.moreActions') }
                        icon = { iconMenuThumb }
                        iconFromURL = { iconMoreActionFromURL }
                        onClick = { this._onToggleDialogVisibility }
                        toggled = { isOpen }
                        tooltip = { t('toolbar.moreActions') } />
                </InlineDialog>
            </div>
        );
    }

    _onCloseDialog: () => void;

    /**
     * Callback invoked when {@code InlineDialog} signals that it should be
     * close.
     *
     * @private
     * @returns {void}
     */
    _onCloseDialog() {
        this.props.onVisibilityChange(false);
    }

    _onToggleDialogVisibility: () => void;

    /**
     * Callback invoked to signal that an event has occurred that should change
     * the visibility of the {@code InlineDialog} component.
     *
     * @private
     * @returns {void}
     */
    _onToggleDialogVisibility() {
        sendAnalytics(createToolbarEvent('overflow'));

        this.props.onVisibilityChange(!this.props.isOpen);
    }
}

export default translate(OverflowMenuButton);
