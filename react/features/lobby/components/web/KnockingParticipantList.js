// @flow

import React from 'react';

import { Avatar } from '../../../base/avatar';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { isToolboxVisible } from '../../../toolbox/functions.web';
import { setKnockingParticipantApproval } from '../../actions';
import AbstractKnockingParticipantList, {
    mapStateToProps as abstractMapStateToProps,
    type Props as AbstractProps
} from '../AbstractKnockingParticipantList';

type Props = AbstractProps & {

    /**
     * True if the toolbox is visible, so we need to adjust the position.
     */
    _toolboxVisible: boolean,
};

/**
 * Component to render a list for the actively knocking participants.
 */
class KnockingParticipantList extends AbstractKnockingParticipantList<Props> {
    _onRespondToAllParticipant: Function;

    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _participants, _toolboxVisible, _visible, t } = this.props;

        if (!_visible) {
            return null;
        }

        return (
            <div
                className = { _toolboxVisible ? 'toolbox-visible' : '' }
                id = 'knocking-participant-list'>
                <span className = 'title'>
                    { t('lobby.knockingParticipantList') }
                </span>
                <ul>
                    { _participants.map(p => (
                        <li key = { p.id }>
                            <Avatar
                                displayName = { p.name }
                                size = { 48 }
                                testId = 'knockingParticipant.avatar'
                                url = { p.loadableAvatarUrl } />
                            <div className = 'details'>
                                <span data-testid = 'knockingParticipant.name'>
                                    { p.name }
                                </span>
                                { p.email && (
                                    <span data-testid = 'knockingParticipant.email'>
                                        { p.email }
                                    </span>
                                ) }
                            </div>
                            <button
                                className = 'primary'
                                data-testid = 'lobby.allow'
                                onClick = { this._onRespondToParticipant(p.id, true) }
                                type = 'button'>
                                { t('lobby.allow') }
                            </button>
                            <button
                                className = 'borderLess'
                                data-testid = 'lobby.reject'
                                onClick = { this._onRespondToParticipant(p.id, false) }
                                type = 'button'>
                                { t('lobby.reject') }
                            </button>
                        </li>
                    )) }
                    <li key = { '00' }>
                        <button
                            className = 'primary'
                            data-testid = 'lobby.allow'
                            onClick = { this._onRespondToAllParticipant(true) }
                            type = 'button'>
                            { t('lobby.allowAll') }
                        </button>
                        <button
                            className = 'borderLess'
                            data-testid = 'lobby.reject'
                            onClick = { this._onRespondToAllParticipant(false) }
                            type = 'button'>
                            { t('lobby.rejectAll') }
                        </button>
                    </li>
                </ul>
            </div>
        );
    }

    _onRespondToParticipant: (string, boolean) => Function;

    _onRespondToAllParticipant: (boolean) => Function;

    /**
     * Respond to all participants all together.
     *
     * @param {boolean} approve - The response for the knocking.
     * @returns {Function}
     */
    _onRespondToAllParticipant(approve) {
        return () => {
            this.props._participants.forEach(p => {
                this.props.dispatch(setKnockingParticipantApproval(p.id, approve));
            });
        };
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state: Object): $Shape<Props> {
    return {
        ...abstractMapStateToProps(state),
        _toolboxVisible: isToolboxVisible(state)
    };
}

export default translate(connect(_mapStateToProps)(KnockingParticipantList));
