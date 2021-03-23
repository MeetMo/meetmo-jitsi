// @flow
import React, { Component } from 'react';

import { sendAnalytics, createRemoteVideoMenuButtonEvent } from '../../analytics';
import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import { makeRemoteTier } from '../actions.web';

type Props = {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * The ID of the remote participant to be granted moderator rights.
     */
    participantID: string,

    /**
     * Function to translate i18n labels.
     */
    t: Function,

    /**
     * New tier type of the participant.
     */
    newTier: string,
};

/**
 * Dialog to confirm a grant moderator action.
 */
class MakeTierDialog extends Component<Props> {
    /**
     * Initializes a new {@code AbstractGrantModeratorDialog} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onSubmit = this._onSubmit.bind(this);
    }

    _onSubmit: () => boolean;

    /**
     * Callback for the confirm button.
     *
     * @private
     * @returns {boolean} - True (to note that the modal should be closed).
     */
    _onSubmit() {
        const { dispatch, participantID, newTier } = this.props;

        sendAnalytics(createRemoteVideoMenuButtonEvent(
            `grant.make.${newTier}`,
            {
                'participant_id': participantID
            }));

        dispatch(makeRemoteTier(participantID, newTier));

        return true;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { newTier } = this.props;

        return (
            <Dialog
                okKey = 'dialog.Yes'
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.makeTier'
                width = 'small'>
                <div>
                    { this.props.t('dialog.makeTierDialog', { tierId: newTier }) }
                </div>
            </Dialog>
        );
    }
}

export default translate(connect()(MakeTierDialog));
