// @flow

import React from 'react';
import { ReactSVG } from 'react-svg';
import { get, isEmpty } from 'lodash';

import { translate } from '../../../base/i18n';
import { Icon, IconInviteMore } from '../../../base/icons';
import { getParticipantCount } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { beginAddPeople } from '../../../invite';
import { isButtonEnabled, isToolboxVisible } from '../../../toolbox/functions.web';
import { shouldDisplayTileView } from '../../../video-layout/functions';

declare var interfaceConfig: Object;

type Props = {

    /**
     * Whether tile view is enabled.
     */
    _tileViewEnabled: Boolean,

    /**
     * Whether to show the option to invite more people
     * instead of the subject.
     */
    _visible: boolean,

    /**
     * Handler to open the invite dialog.
     */
    onClick: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

/**
 * Represents a replacement for the subject, prompting the
 * sole participant to invite more participants.
 *
 * @param {Object} props - The props of the component.
 * @returns {React$Element<any>}
 */
function InviteMore({
    _tileViewEnabled,
    _visible,
    onClick,
    t
}: Props) {
    
    const iconDataInvitePeople = get(interfaceConfig, ["meetmoIcons", "invite_people"], {});
    const iconInvitePeopleFromURL = !isEmpty(iconDataInvitePeople);
    return (
        _visible
            ? <div className = { `invite-more-container${_tileViewEnabled ? ' elevated' : ''}` }>
                <div className = 'invite-more-header'>
                    {t('addPeople.inviteMoreHeader')}
                </div>
                <div
                    className = 'invite-more-button'
                    onClick = { onClick }>
                        {
                            iconInvitePeopleFromURL ? 
                                <ReactSVG style = {
                                    {
                                        width: '50px',
                                        height: '50px'
                                    }
                                }
                                src = {
                                    iconDataInvitePeople.active_svg
                                }
                                beforeInjection = {
                                    (svg) => {
                                        svg.classList.add('invite-more-icon-active')
                                        svg.classList.add(iconDataInvitePeople.hover_effect)
                                        svg.setAttribute('fill', iconDataInvitePeople.button_active_color)
                                        svg.setAttribute('stroke', iconDataInvitePeople.button_active_color)
                                    }
                                }
                                /> : <Icon src = { IconInviteMore } />
                        }
                    <div className = 'invite-more-button-text'>
                        {t('addPeople.inviteMorePrompt')}
                    </div>
                </div>
            </div> : null
    );
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code Subject}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function mapStateToProps(state) {
    const participantCount = getParticipantCount(state);
    const isAlone = participantCount === 1;
    const hide = interfaceConfig.HIDE_INVITE_MORE_HEADER;

    return {
        _tileViewEnabled: shouldDisplayTileView(state),
        _visible: isToolboxVisible(state) && isButtonEnabled('invite') && isAlone && !hide
    };
}

/**
 * Maps dispatching of some action to React component props.
 *
 * @param {Function} dispatch - Redux action dispatcher.
 * @returns {Props}
 */
const mapDispatchToProps = {
    onClick: () => beginAddPeople()
};

export default translate(connect(mapStateToProps, mapDispatchToProps)(InviteMore));
