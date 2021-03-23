// @flow

import React, { Component } from 'react';

import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import { getCurrentLayout } from '../../video-layout';

type Props = {

    /**
     * The current view of the conference, Tile or filmstrip.
     *
     */
    _currentView: string,

    /**
     * The redux dispatch function.
     */
    dispatch: Function,

    /**
     * The selected layout of the conference.
     */
    _layout: string
};

/**
 * React component for the video in the layout background.
 *
 * @extends Component
 */
class LayoutBackgroundVideo extends Component<Props, *> {

    /**
     * Render the video section.
     *
     * @inheritdoc
     */
    render() {
        return (
            this.props._layout === 'layout-9' && this.props._currentView === 'tile-view'
                ? <video
                    autoPlay = { true }
                    id = 'backgroundVideo'
                    loop = { true }
                    muted = { true }>
                    <source
                        src = '/videos/background.mp4'
                        type = 'video/mp4' />
                </video>
                : ''
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code LayoutPopup} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const { layout } = state['features/letxsoft'];
    const currentView = getCurrentLayout(state);

    return {
        _layout: layout,
        _currentView: currentView
    };
}

export default translate(connect(_mapStateToProps)(LayoutBackgroundVideo));
