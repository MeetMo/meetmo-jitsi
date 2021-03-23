// @flow

import React, { PureComponent } from 'react';

import { Iframe } from '../../../../letxsoft';
import { AudioSettingsButton, VideoSettingsButton } from '../../../../toolbox/components/web';

import Preview from './Preview';

type Props = {

    /**
     * Children component(s) to be rendered on the screen.
     */
    children: React$Node,

    /**
     * Footer to be rendered for the page (if any).
     */
    footer?: React$Node,

    /**
     * The name of the participant.
     */
    name?: string,

    /**
     * Indicates whether the avatar should be shown when video is off
     */
    showAvatar: boolean,

    /**
     * Indicates whether the label and copy url action should be shown
     */
    showConferenceInfo: boolean,

    /**
     * Title of the screen.
     */
    title: string,

    /**
     * The 'Skip prejoin' button to be rendered (if any).
     */
     skipPrejoinButton?: React$Node,

    /**
     * True if the preview overlay should be muted, false otherwise.
     */
    videoMuted?: boolean,

    /**
     * The video track to render as preview (if omitted, the default local track will be rendered).
     */
    videoTrack?: Object,

    /**
     * The lobby video url for the lobby room.
     */
    lobbyVideo?: string
}

/**
 * Implements a pre-meeting screen that can be used at various pre-meeting phases, for example
 * on the prejoin screen (pre-connection) or lobby (post-connection).
 */
export default class PreMeetingScreen extends PureComponent<Props> {
    iframeRef: Object;

    /**
     * Instantiates a new component for premeeting.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.iframeRef = React.createRef();
    }

    /**
     * The component did mount function to reload the iframe.
     *
     * @inheritdoc
     */
    componentDidMount() {
        // Reload the iframe to play the video/
        const iframe: Iframe = document.getElementById('lobby-video-iframe');

        if (iframe !== null) {
            const src = iframe.src;

            iframe.src = src;
        }
    }


    /**
     * Default values for {@code Prejoin} component's properties.
     *
     * @static
     */
    static defaultProps = {
        showAvatar: true,
        showConferenceInfo: true
    };

    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        const { name, showAvatar, showConferenceInfo, title, videoMuted, videoTrack, lobbyVideo } = this.props;
        const _lobbyVideoNumber = lobbyVideo === undefined || lobbyVideo === null
            ? '' : lobbyVideo.replace('https://vimeo.com/', '');
        const _src = `https://player.vimeo.com/video/${
            _lobbyVideoNumber
        }?title=0&amp;byline=0&amp;portrait=0&amp;
        color=3a6774&amp;autoplay=1&amp;loop=1`;

        console.log(' lobby url =>>>', lobbyVideo, _lobbyVideoNumber, _lobbyVideoNumber.length > 0, _src);

        return (
            <div
                className = 'premeeting-screen'
                id = 'lobby-screen'>
                <Preview
                    name = { name }
                    showAvatar = { showAvatar }
                    videoMuted = { videoMuted }
                    videoTrack = { videoTrack } />
                {!videoMuted && <div className = 'preview-overlay' />}
                <div className = 'content'>
                    <div className = 'video'>
                        { _lobbyVideoNumber.length > 0
                            ? <Iframe
                                ref = { this.iframeRef }
                                src = { _src } />
                            : ''
                        }
                    </div>
                    {showConferenceInfo && (
                        <>
                            <div className = 'title'>
                                { title }
                            </div>
                            {/* <CopyMeetingUrl /> */}
                        </>
                    )}
                    { this.props.children }
                    <div className = 'media-btn-container'>
                        <AudioSettingsButton visible = { true } />
                        <VideoSettingsButton visible = { true } />
                    </div>
                    { this.props.skipPrejoinButton }
                    { this.props.footer }
                </div>
            </div>
        );
    }
}
