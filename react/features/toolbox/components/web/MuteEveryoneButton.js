// @flow
import React from 'react';
import { ReactSVG } from 'react-svg';
import { get, isEmpty } from 'lodash';

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { openDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { IconMuteEveryone } from '../../../base/icons';
import { getLocalParticipant, PARTICIPANT_ROLE } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import { MuteEveryoneDialog } from '../../../remote-video-menu';

type Props = AbstractButtonProps & {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /*
     ** Whether the local participant is a moderator or not.
     */
    isModerator: Boolean,

    /**
     * The ID of the local participant.
     */
    localParticipantId: string
};

/**
 * Implements a React {@link Component} which displays a button for audio muting
 * every participant (except the local one)
 */
class MuteEveryoneButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.muteEveryone';
    label = 'toolbar.muteEveryone';
    tooltip = 'toolbar.muteEveryone';
    iconData = get(interfaceConfig, ["meetmoIcons", "mute-everyone"], {});

    icon = !isEmpty(this.iconData) 
        ? <ReactSVG
                style={{ width: "24px", height: "24px" }}
                src={this.iconData.active_svg}
                beforeInjection={(svg) => {
                    svg.classList.add("mic-icon-active");
                    svg.classList.add(this.iconData.hover_effect);
                    svg.setAttribute("fill", this.iconData.button_active_color);
                    svg.setAttribute("stroke", this.iconData.button_active_color);
                }}
            />
        : IconMuteEveryone;
    iconFromURL = !isEmpty(this.iconData);

    /**
     * Handles clicking / pressing the button, and opens a confirmation dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, localParticipantId } = this.props;

        sendAnalytics(createToolbarEvent('mute.everyone.pressed'));
        dispatch(openDialog(MuteEveryoneDialog, {
            exclude: [ localParticipantId ]
        }));
    }
}

/**
 * Maps part of the redux state to the component's props.
 *
 * @param {Object} state - The redux store/state.
 * @param {Props} ownProps - The component's own props.
 * @returns {Object}
 */
function _mapStateToProps(state: Object, ownProps: Props) {
    const localParticipant = getLocalParticipant(state);
    const isModerator = localParticipant.role === PARTICIPANT_ROLE.MODERATOR;
    const { visible } = ownProps;
    const { disableRemoteMute } = state['features/base/config'];

    return {
        isModerator,
        localParticipantId: localParticipant.id,
        visible: visible && isModerator && !disableRemoteMute
    };
}

export default translate(connect(_mapStateToProps)(MuteEveryoneButton));
