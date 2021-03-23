/* @flow */

import React from 'react';

import { openDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { IconSettings } from '../../base/icons';
import {
    getLocalParticipant,
    getParticipantById,
    isParticipantModerator,
    PARTICIPANT_ROLE
} from '../../base/participants';
import { connect } from '../../base/redux';
import {
    AbstractButton,
    type AbstractButtonProps
} from '../../base/toolbox/components';
import RemoteVideoMenuButton from '../../remote-video-menu/components/web/RemoteVideoMenuButton';
import { getSessionUserType } from '../actions.web';

import MakeTierDialog from './MakeTierDialog';

type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * The ID of the participant for whom to grant new tier status.
     */
    participantID: string,

    /**
     * The function to be used to translate i18n labels.
     */
    t: Function,

    /**
     * The flag which indicates if the option is visible.
     */
    visible: Boolean,

    /**
     * New tier type of the participant.
     */
    newTier: string,
};

/**
 * Implements a React {@link Component} which displays a button for granting
 * moderator to a participant.
 */
class ChangeUserTier extends AbstractButton<Props, *> {
    /**
     * Instantiates a new {@code GrantModeratorButton}.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._handleClick = this._handleClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { participantID, t, visible, newTier } = this.props;

        if (!visible) {
            return null;
        }

        return (
            <RemoteVideoMenuButton
                buttonText = { t('dialog.makeTier', {
                    tierId: newTier
                }) }
                displayClass = 'grantmoderatorlink'
                icon = { IconSettings }
                id = { `grantmoderatorlink_${participantID}` }
                // eslint-disable-next-line react/jsx-handler-names
                onClick = { this._handleClick } />
        );
    }

    _handleClick: () => void;

    /**
     * Handles clicking / pressing the button, and kicks the participant.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, participantID, newTier } = this.props;

        dispatch(openDialog(MakeTierDialog, { participantID,
            newTier }));
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @param {Object} ownProps - Properties of component.
 * @private
 * @returns {{
    *     visible: boolean
    * }}
    */
export function _mapStateToProps(state: Object, ownProps: Props) {
    const { participantID } = ownProps;

    const localParticipant = getLocalParticipant(state);
    const targetParticipant = getParticipantById(state, participantID);
    const userType = getSessionUserType(participantID);

    return {
        visible: Boolean(localParticipant?.role === PARTICIPANT_ROLE.MODERATOR)
             && !isParticipantModerator(targetParticipant),
        newTier: userType === 'tier-2' ? 'tier-1' : 'tier-2'
    };
}

export default translate(connect(_mapStateToProps)(ChangeUserTier));
