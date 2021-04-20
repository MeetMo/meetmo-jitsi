// @flow

import React from 'react';
import { ReactSVG } from 'react-svg';
import { get, isEmpty } from 'lodash';

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { translate } from '../../../base/i18n';
import { IconSecurityOff, IconSecurityOn } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import { toggleSecurityDialog } from '../../actions';

declare var interfaceConfig: Object;

type Props = AbstractButtonProps & {

    /**
     * Whether the shared document is being edited or not.
     */
    _locked: boolean,

    /**
     * On click handler that opens the security dialog.
     */
    onClick: Function

};


/**
 * Implements an {@link AbstractButton} to open the security dialog.
 */
class SecurityDialogButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.security';
    label = 'toolbar.security';
    tooltip = 'toolbar.security';
    iconData = get(interfaceConfig, ["meetmoIcons", "security_options"], {});

    icon = !isEmpty(this.iconData) 
        ? <ReactSVG
                style={{ width: "24px", height: "24px" }}
                src={this.iconData.active_svg}
                beforeInjection={(svg) => {
                    svg.classList.add("mic-icon-active");
                    svg.classList.add(this.iconData.hover_effect);
                    svg.setAttribute("fill", this.iconData.button_active_color);
                }}
            />
        : IconSecurityOff;
    toggledIcon = !isEmpty(this.iconData) 
        ? <ReactSVG
                style={{ width: "24px", height: "24px" }}
                src={this.iconData.inactive_svg}
                beforeInjection={(svg) => {
                    svg.classList.add("mic-icon-active");
                    svg.classList.add(this.iconData.hover_effect);
                    svg.setAttribute("fill", this.iconData.button_active_color);
                }}
            />
        : IconSecurityOn;
    iconFromURL = !isEmpty(this.iconData);

    /**
     * Handles clicking / pressing the button, and opens / closes the appropriate dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        sendAnalytics(createToolbarEvent('toggle.security', { enable: !this.props._locked }));
        this.props.onClick();
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._locked;
    }
}

/**
 * Maps part of the redux state to the component's props.
 *
 * @param {Object} state - The redux store/state.
 * @returns {Props}
 */
function mapStateToProps(state: Object) {
    const { locked } = state['features/base/conference'];
    const { lobbyEnabled } = state['features/lobby'];

    return {
        _locked: locked || lobbyEnabled
    };
}

/**
 * Maps dispatching of some action to React component props.
 *
 * @param {Function} dispatch - Redux action dispatcher.
 * @returns {Props}
 */
const mapDispatchToProps = {
    onClick: () => toggleSecurityDialog()
};

export default translate(connect(mapStateToProps, mapDispatchToProps)(SecurityDialogButton));
