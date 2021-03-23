// @flow

import { FieldTextStateless } from '@atlaskit/field-text';
import React from 'react';

import { translate } from '../../../../base/i18n';
import AbstractStreamKeyForm, {
    type Props as AbstractProps
} from '../AbstractStreamKeyForm';
import { GOOGLE_PRIVACY_POLICY, YOUTUBE_TERMS_URL } from '../constants';

type Props = AbstractProps & {

    /**
     * The stream key for the live streaming.
     */
    streamKey?: string
}

/**
 * A React Component for entering a key for starting a YouTube live stream.
 *
 * @extends Component
 */
class StreamCustomKeyForm extends AbstractStreamKeyForm<Props> {

    /**
     * Initializes a new {@code StreamKeyForm} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code StreamKeyForm} instance with.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);
        const { _rtmpServer, _streamKey } = this._getRtmpStreamKeyFromProps();

        this.state = {
            ...this.state,
            rtmpServer: _rtmpServer,
            streamKey: _streamKey
        };

        // Bind event handlers so they are only bound once per instance.
        this._onOpenHelp = this._onOpenHelp.bind(this);
        this._onServerChange = this._onServerChange.bind(this);
        this._onStreamKeyChange = this._onStreamKeyChange.bind(this);
        this._getRtmpStreamKeyFromProps = this._getRtmpStreamKeyFromProps.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t } = this.props;
        const { _rtmpServer, _streamKey } = this._getRtmpStreamKeyFromProps();

        return (
            <div className = 'stream-key-form'>
                <FieldTextStateless
                    autoFocus = { true }
                    compact = { true }
                    isSpellCheckEnabled = { false }
                    label = { t('dialog.customStreamServer') }
                    name = 'streamServer'
                    okDisabled = { !_rtmpServer }
                    onChange = { this._onServerChange }
                    placeholder = { t('liveStreaming.enterStreamServer') }
                    shouldFitContainer = { true }
                    type = 'text'
                    value = { _rtmpServer } />

                <FieldTextStateless
                    autoFocus = { true }
                    compact = { true }
                    isSpellCheckEnabled = { false }
                    label = { t('dialog.customStreamKey') }
                    name = 'streamId'
                    okDisabled = { !_streamKey }
                    onChange = { this._onStreamKeyChange }
                    placeholder = { t('liveStreaming.enterCustomStreamKey') }
                    shouldFitContainer = { true }
                    type = 'text'
                    value = { _streamKey } />
                <div className = 'form-footer'>
                    <div className = 'help-container'>
                        {
                            this.state.showValidationError
                                ? <span className = 'warning-text'>
                                    { t('liveStreaming.invalidStreamKey') }
                                </span>
                                : null
                        }
                        { this.helpURL
                            ? <a
                                className = 'helper-link'
                                onClick = { this._onOpenHelp }>
                                { t('liveStreaming.streamIdHelp') }
                            </a>
                            : null
                        }
                    </div>
                    <a
                        className = 'helper-link'
                        href = { YOUTUBE_TERMS_URL }
                        rel = 'noopener noreferrer'
                        target = '_blank'>
                        { t('liveStreaming.youtubeTerms') }
                    </a>
                    <a
                        className = 'helper-link'
                        href = { GOOGLE_PRIVACY_POLICY }
                        rel = 'noopener noreferrer'
                        target = '_blank'>
                        { t('liveStreaming.googlePrivacyPolicy') }
                    </a>
                </div>
            </div>
        );
    }

    _onServerChange: Object => void;

    /**
     * Callback invoked when the value of the input field has updated through
     * user input. This forwards the value (string only, even if it was a dom
     * event) to the onChange prop provided to the component.
     *
     * @param {Object | string} change - DOM Event for value change or the
     * changed text.
     * @private
     * @returns {void}
     */
    _onServerChange(change) {
        const value = typeof change === 'object' ? change.target.value : change;

        this.setState({
            rtmpServer: String(value)
        });
        if (this.state.streamKey !== undefined) {
            this.props.onChange(`${value}/${this.state.streamKey}`);
        }
    }

    _onStreamKeyChange: Object => void;

    /**
     * Callback invoked when the value of the input field has updated through
     * user input. This forwards the value (string only, even if it was a dom
     * event) to the onChange prop provided to the component.
     *
     * @param {Object | string} change - DOM Event for value change or the
     * changed text.
     * @private
     * @returns {void}
     */
    _onStreamKeyChange(change) {
        const value = typeof change === 'object' ? change.target.value : change;

        this.setState({
            streamKey: value
        });
        if (this.state.rtmpServer !== undefined) {
            this.props.onChange(`${this.state.rtmpServer}/${value}`);
        }
    }

    _onOpenHelp: () => void

    /**
     * Opens a new tab with information on how to manually locate a YouTube
     * broadcast stream key.
     *
     * @private
     * @returns {void}
     */
    _onOpenHelp() {
        window.open(this.helpURL, '_blank', 'noopener');
    }

    _getRtmpStreamKeyFromProps: () => Object;

    /**
     * Get the values of rtmpServer and streamKey from props.
     *
     * @inheritdoc
     */
    _getRtmpStreamKeyFromProps() {
        const { streamKey } = this.props;
        let _rtmpServer = '', _streamKey = '';


        // Separate the stream key and rtmpserver values from the props
        if (this.state.rtmpServer && streamKey) {
            _streamKey = streamKey.replace(`${this.state.rtmpServer}/`, '');
            _rtmpServer = this.state.rtmpServer;
        }
        if (this.state.streamKey && streamKey) {
            _rtmpServer = streamKey.replace(`/${this.state.streamKey}`, '');
            _streamKey = this.state.streamKey;
        }

        return {
            _rtmpServer,
            _streamKey
        };
    }
}

export default translate(StreamCustomKeyForm);
