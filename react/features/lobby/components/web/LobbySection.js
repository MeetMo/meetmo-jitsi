// @flow

import React, { PureComponent } from 'react';

import { translate } from '../../../base/i18n';
import { isLocalParticipantModerator } from '../../../base/participants';
import { Switch } from '../../../base/react';
import { connect } from '../../../base/redux';
import { setLobbyVideoUrl } from '../../../letxsoft/actions.web';
import { toggleLobbyMode } from '../../actions';

type Props = {

    /**
     * True if lobby is currently enabled in the conference.
     */
    _lobbyEnabled: boolean,

    /**
     * The current video url of the lobby room.
     */
    _lobbyVideoUrl: string,

    /**
     * True if the section should be visible.
     */
    _visible: boolean,

    /**
     * The Redux Dispatch function.
     */
    dispatch: Function,

    /**
     * Function to be used to translate i18n labels.
     */
    t: Function
};

type State = {

    /**
     * True if the lobby switch is toggled on.
     */
    lobbyEnabled: boolean,

    /**
     * The state to hold the url of the lobby video.
     */
    lobbyVideoUrl: string
}

/**
 * Implements a security feature section to control lobby mode.
 */
class LobbySection extends PureComponent<Props, State> {
    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            lobbyEnabled: props._lobbyEnabled,
            lobbyVideoUrl: props._lobbyVideoUrl
        };

        this._onChangeUrl = this._onChangeUrl.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
        this._onToggleLobby = this._onToggleLobby.bind(this);
    }

    /**
     * Implements React's {@link Component#getDerivedStateFromProps()}.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props: Props, state: Object) {
        if (props._lobbyEnabled !== state.lobbyEnabled) {

            return {
                lobbyEnabled: props._lobbyEnabled
            };
        }

        return null;
    }

    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _visible, t } = this.props;

        if (!_visible) {
            return null;
        }

        return (
            <>
                <div id = 'lobby-section'>
                    <p className = 'description'>
                        { t('lobby.enableDialogText') }
                    </p>
                    <div className = 'control-row'>
                        <label>
                            { t('lobby.toggleLabel') }
                        </label>
                        <Switch
                            onValueChange = { this._onToggleLobby }
                            value = { this.state.lobbyEnabled } />
                    </div>
                </div>
                <div id = 'lobby-section'>
                    <div id = 'lobby-section-mode'>
                        <label >
                            <br />
                            { t('lobby.toggleLabellobbyvideo') }
                        </label>
                        <div className = 'input-section'>
                            <input
                                className = 'custom-input'
                                name = 'videoURl'
                                onChange = { this._onChangeUrl }
                                placeholder = 'Enter your Vimeo Video url'
                                spellCheck = 'false'
                                type = 'url'
                                value = { this.state.lobbyVideoUrl } />
                        </div>
                        <div className = 'wrapper-button'>
                            <button
                                className = 'submit-button'
                                onClick = { this._onSubmit }> Update video URL </button>
                        </div>
                    </div>
                </div>

                <div className = 'separator-line' />
            </>
        );
    }

    _onToggleLobby: () => void;

    /**
     * Callback to be invoked when the user toggles the lobby feature on or off.
     *
     * @returns {void}
     */
    _onToggleLobby() {
        const newValue = !this.state.lobbyEnabled;

        this.setState({
            lobbyEnabled: newValue
        });

        this.props.dispatch(toggleLobbyMode(newValue));
    }

    _onChangeUrl: () => void;

    /**
     * Save the changed url in the state.
     *
     * @param {HTMLEvent} event - The HtmlEvent for the change url.
     *
     * @inheritdoc
     */
    _onChangeUrl(event) {
        const videoUrl = event.target.value;

        this.setState({
            lobbyVideoUrl: videoUrl
        });
    }

    _onSubmit: () => void;

    /**
     * Submit the lobby url to the API.
     *
     * @param {HTMLEvent} event - The HTMLEvent of the submit click.
     * @inheritdoc
     */
    _onSubmit(event) {
        event.preventDefault();

        const videoUrl = this.state.lobbyVideoUrl;

        if (videoUrl !== '') {
            this.props.dispatch(setLobbyVideoUrl(videoUrl));
        }
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function mapStateToProps(state: Object): $Shape<Props> {
    const { conference } = state['features/base/conference'];
    const { lobbyEnabled, lobbyVideoUrl } = state['features/lobby'];

    return {
        _lobbyEnabled: lobbyEnabled,
        _lobbyVideoUrl: lobbyVideoUrl,
        _visible: conference && conference.isLobbySupported() && isLocalParticipantModerator(state)

    };
}

export default translate(connect(mapStateToProps)(LobbySection));
