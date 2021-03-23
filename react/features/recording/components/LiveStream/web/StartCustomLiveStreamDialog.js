// @flow

// import Spinner from '@atlaskit/spinner';
import React from 'react';

import { sendAnalytics, createLiveStreamingDialogEvent } from '../../../../analytics';
import { Dialog } from '../../../../base/dialog';
import { translate } from '../../../../base/i18n';
import { JitsiRecordingConstants } from '../../../../base/lib-jitsi-meet';
import { connect } from '../../../../base/redux';
import {
    GOOGLE_API_STATES,
    requestAvailableYouTubeBroadcasts,
    requestLiveStreamsForYouTubeBroadcast,
    updateProfile
} from '../../../../google-api';
import AbstractStartLiveStreamDialog, {
    _mapStateToProps as _abstractMapStateToProps,
    type Props as AbstractProps
} from '../AbstractStartLiveStreamDialog';

import StreamCustomKeyForm from './StreamCustomKeyForm';

type Props = AbstractProps & {

    /**
     * The ID for the Google client application used for making stream key
     * related requests.
     */
    _googleApiApplicationClientID: string
}

/**
 * A React Component for requesting a YouTube stream key to use for live
 * streaming of the current conference.
 *
 * @extends Component
 */
class StartCustomLiveStreamDialog
    extends AbstractStartLiveStreamDialog<Props> {

    /**
     * Initializes a new {@code StartLiveStreamDialog} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code StartLiveStreamDialog} instance with.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onGetYouTubeBroadcasts = this._onGetYouTubeBroadcasts.bind(this);
        this._onYouTubeBroadcastIDSelected
            = this._onYouTubeBroadcastIDSelected.bind(this);

        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Implements {@code Component}'s render.
     *
     * @inheritdoc
     */
    render() {

        return (
            <Dialog
                cancelKey = 'dialog.Cancel'
                okKey = 'dialog.startCustomLiveStreaming'
                onCancel = { this._onCancel }
                onSubmit = { this._onSubmit }
                titleKey = 'liveStreaming.start'
                width = { 'small' }>
                <div className = 'live-stream-dialog'>
                    <StreamCustomKeyForm
                        onChange = { this._onStreamKeyChange }
                        streamKey = {
                            this.state.streamKey || this.props._streamKey
                        } />
                </div>
            </Dialog>
        );
    }

    _onCancel: () => boolean;

    _onSubmit: () => boolean;

    /**
     * Invokes the passed in {@link onSubmit} callback with the entered stream
     * key, and then closes {@code StartLiveStreamDialog}.
     *
     * @private
     * @returns {boolean} False if no stream key is entered to preventing
     * closing, true to close the modal.
     */
    _onSubmit() {
        const { broadcasts, selectedBoundStreamID } = this.state;
        const key
            = (this.state.streamKey || this.props._streamKey || '').trim();

        console.log(' rmtp server =>>>', key, this.state);

        if (!key) {
            return false;
        }

        let selectedBroadcastID = null;

        if (selectedBoundStreamID) {
            const selectedBroadcast = broadcasts && broadcasts.find(
                broadcast => broadcast.boundStreamID === selectedBoundStreamID);

            selectedBroadcastID = selectedBroadcast && selectedBroadcast.id;
        }

        sendAnalytics(
            createLiveStreamingDialogEvent('start', 'confirm.button'));

        this.props._conference.startRecording({
            broadcastId: selectedBroadcastID,
            mode: JitsiRecordingConstants.mode.STREAM,
            streamId: key
        });

        return true;
    }

    /**
     * Automatically selects the input field's value after starting to edit the
     * display name.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidUpdate(previousProps) {
        if (previousProps._googleAPIState === GOOGLE_API_STATES.LOADED
            && this.props._googleAPIState === GOOGLE_API_STATES.SIGNED_IN) {
            this._onGetYouTubeBroadcasts();
        }
    }

    _onGetYouTubeBroadcasts: () => void;

    /**
     * Asks the user to sign in, if not already signed in, and then requests a
     * list of the user's YouTube broadcasts.
     *
     * @private
     * @returns {void}
     */
    _onGetYouTubeBroadcasts() {
        this.props.dispatch(updateProfile())
            .catch(response => this._parseErrorFromResponse(response));

        this.props.dispatch(requestAvailableYouTubeBroadcasts())
            .then(broadcasts => {
                this._setStateIfMounted({
                    broadcasts
                });

                if (broadcasts.length === 1) {
                    const broadcast = broadcasts[0];

                    this._onYouTubeBroadcastIDSelected(broadcast.boundStreamID);
                }
            })
            .catch(response => this._parseErrorFromResponse(response));
    }

    _onStreamKeyChange: string => void;

    /**
     * Set the state on stream key change.
     *
     * @param {string} streamKey - The stream key for the live stream.
     *
     * @inheritdoc
     */
    _onStreamKeyChange(streamKey) {
        console.log('stream key changed', streamKey);
        this._setStateIfMounted({
            streamKey,
            selectedBoundStreamID: undefined
        });
    }

    _onYouTubeBroadcastIDSelected: (string) => Object;

    /**
     * Fetches the stream key for a YouTube broadcast and updates the internal
     * state to display the associated stream key as being entered.
     *
     * @param {string} boundStreamID - The bound stream ID associated with the
     * broadcast from which to get the stream key.
     * @private
     * @returns {Promise}
     */
    _onYouTubeBroadcastIDSelected(boundStreamID) {
        this.props.dispatch(
            requestLiveStreamsForYouTubeBroadcast(boundStreamID))
            .then(({ streamKey, selectedBoundStreamID }) =>
                this._setStateIfMounted({
                    streamKey,
                    selectedBoundStreamID
                }));

    }

    /**
     * Only show an error if an external request was made with the Google api.
     * Do not error if the login in canceled.
     * And searches in a Google API error response for the error type.
     *
     * @param {Object} response - The Google API response that may contain an
     * error.
     * @private
     * @returns {string|null}
     */
    _parseErrorFromResponse(response) {

        if (!response || !response.result) {
            return;
        }

        const result = response.result;
        const error = result.error;
        const errors = error && error.errors;
        const firstError = errors && errors[0];

        this._setStateIfMounted({
            errorType: (firstError && firstError.reason) || null
        });
    }

    _setStateIfMounted: Object => void;
}

/**
 * Maps part of the Redux state to the component's props.
 *
 * @param {Object} state - The Redux state.
 * @returns {{
 *     _googleApiApplicationClientID: string
 * }}
*/
function _mapStateToProps(state: Object) {
    return {
        ..._abstractMapStateToProps(state)
    };
}

export default translate(connect(_mapStateToProps)(StartCustomLiveStreamDialog));
