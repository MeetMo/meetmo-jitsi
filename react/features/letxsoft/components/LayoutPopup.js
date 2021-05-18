// @flow

import React, { Component } from 'react';

import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import { setLayout, updateLayoutAPI } from '../actions.web';

type Props = {

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
 * React Component to select the layout options for the title view.
 *
 * @extends Component
 */
class LayoutPopup extends Component<Props, *> {
    /**
     * Initializes a new {@code LayoutPopup} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onLayoutChange = this._onLayoutChange.bind(this);
    }

    /**
     * Render the layout dialog.
     *
     * @inheritdoc
     */
    render() {
        return (
            <Dialog
                okDisabled = { false }
                okKey = 'dialog.Ok'

                // onSubmit = { this._onSubmit }
                titleKey = 'dialog.changeLayout'
                width = 'large'>
                {this._renderLayouts()}
            </Dialog>
        );
    }

    /**
     * Render the list of layouts.
     *
     * @inheritdoc
     */
    _renderLayouts() {
        const layouts = [];

        for (let index = 1; index < 17; index++) {
            const selected = document.body ? document.body.classList.contains(`layout-${index}`) : false;

            layouts.push(
                <div
                    className = 'layout'
                    data-layout = { `layout-${index}` }
                    key = { index }
                    onClick = { this._onLayoutChange }>
                    <img src = { `/images/layouts/layout${index}.png` } />
                    <span className = { `layout-bottom ${selected ? 'selected' : ''}` } />
                </div>
            );
        }

        return (
            <div id = 'layout-container'>
                {layouts}
            </div>
        );
    }

    _onLayoutChange: () => void;

    /**
     *  Change the layout of the conference.
     *
     * @inheritdoc
     */
    _onLayoutChange(event) {
        event.preventDefault();
        const _tar = event.target,
            elem = _tar.classList.contains('layout') ? _tar : _tar.closest('.layout');
        let layout = elem.dataset.layout;


        // check if the current click layout is already selected.
        // If it is already selected than unselect the current layout.
        if (elem.getElementsByClassName('layout-bottom')[0].classList.contains('selected')) {
            layout = '';
        }

        this.props.dispatch(updateLayoutAPI(layout));
        this.props.dispatch(setLayout(layout));
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

    console.log('Layout update');

    return {
        _layout: layout
    };
}

export default translate(connect(_mapStateToProps)(LayoutPopup));
