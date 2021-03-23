// @flow

import React from 'react';

type P = {

    /**
     * The srouce of the iframe.
     */
    src: string
}

/**
 * The custom Iframe wrapper for react.
 *
 * @inheritdoc
 */
export default class Iframe extends React.Component<P, *> {

    /**
     * The default render function of the Iframe component.
     *
     * @inheritdoc
     */
    render() {
        return this.props.src === undefined
            ? ''
            : <div>
                <iframe
                    allow = 'autoplay'
                    height = '100%'
                    id = 'lobby-video-iframe'
                    src = { this.props.src }
                    width = '100%' />
            </div>

        ;
    }
}
