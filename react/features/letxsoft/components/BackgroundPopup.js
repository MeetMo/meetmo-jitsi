// @flow

import React, { Component } from 'react';

import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { Icon, IconCross } from '../../base/icons';
import { connect } from '../../base/redux';
import { setBackground, uploadNewBackground, setBackgroundToServer, deleteBackgroundFromServer } from '../actions.web';

type Props = {

    /**
     * The background of the conference.
     */
    _background: string,

    /**
     * The redux dispatch function.
     */
    dispatch: Function,

    /**
     * The room name.
     */
    _room: string,

    /**
     * The backgroundList available for the room.
     */
    _backgroundList: Array<Object>
};

/**
 * React Component to select the layout options for the title view.
 *
 * @extends Component
 */
class BackgroundPopup extends Component<Props, *> {
    /**
     * Initializes a new {@code LayoutPopup} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            newBackFile: undefined,
            backgroundImage: null
        };

        this._onBackgroundChange = this._onBackgroundChange.bind(this);
        this._onUploadBackToServer = this._onUploadBackToServer.bind(this);
        this._onUploadbg = this._onUploadbg.bind(this);
        this._onBackgroundUpdate = this._onBackgroundUpdate.bind(this);
        this._onBackgroundDelete = this._onBackgroundDelete.bind(this);
    }

    _onUploadbg: (HTMLInputElement) => void;

    /**
     * Handle the image selector event.
     *
     * @param {Object} e - The file upload event.
     * @inheritdoc
     */
    _onUploadbg(e) {
        const file = e.target.files[0];

        this.setState({
            newBackFile: file
        });
    }

    _onUploadBackToServer: () => void;

    /**
     * Upload the background image on the server.
     *
     * @inheritdoc
     */
    _onUploadBackToServer(e) {
        e.preventDefault();

        const file = this.state.newBackFile;

        this.props.dispatch(uploadNewBackground(file))
        .finally(() => {
            this.setState({
                newBackFile: null
            });
        });
    }

    /**
     * Render the Background dialog.
     *
     * @inheritdoc
     */
    render() {
        return (
            <Dialog
                okDisabled = { false }
                okKey = 'dialog.Ok'
                onSubmit = { this._onBackgroundUpdate }
                titleKey = 'dialog.changeBackground'
                width = 'large'>
                {this._renderBackgrounds()}
                <div className = 'input-section background' >
                    <input
                        className = 'custom-input'
                        onChange = { this._onUploadbg }
                        type = 'file' />
                </div>
                <div className = 'wrapper-button background'>
                    <button
                        className = 'upload submit-button'
                        onClick = { this._onUploadBackToServer } >Upload</button>
                </div>


            </Dialog>
        );
    }

    /**
     * Render the list of backgrounds.
     *
     * @inheritdoc
     */
    _renderBackgrounds() {

        const { _backgroundList } = this.props;
        const backHtml = [];

        _backgroundList && _backgroundList.forEach((image, index) => {
            const selected = this.props._background === image;

            backHtml.push(
                <div
                    className = 'layout'
                    key = { index }>
                    <img
                        data-src = { image }
                        onClick = { this._onBackgroundChange }
                        src = { image } />
                    <span className = { `layout-bottom ${selected ? 'selected' : ''}` } />
                    { image.includes('https://') ? <span
                        className = { 'delete-button' }
                        data-src = { image }
                        onClick = { this._onBackgroundDelete }>
                        <Icon
                            src = { IconCross } />
                    </span> : '' }
                </div>
            );
        });

        return (
            <div id = 'layout-container'>
                {backHtml}
            </div>
        );
    }

    _onBackgroundChange: () => void;

    /**
     * This function handles the background change event.
     *
     * @inheritdoc
     */
    _onBackgroundChange(event) {
        localStorage.setItem('background', event.target.dataset.src);

        this.setState({
            backgroundImage: event.target.dataset.src
        });
        this.props.dispatch(setBackground(event.target.dataset.src));
    }

    _onBackgroundUpdate: () => void;

    /**
     * This function will handle the submit request of background change
     * and will update the server using the API.
     *
     * @inheritdoc
     */
    _onBackgroundUpdate() {
        if (this.state.backgroundImage !== null) {
            this.props.dispatch(setBackgroundToServer(this.state.backgroundImage));
        }

        return true;
    }

    _onBackgroundDelete: () => void;

    /**
     * This function will handle the submit request of background change
     * and will update the server using the API.
     *
     * @inheritdoc
     */
    _onBackgroundDelete(event) {
        // disable the delete button once clicked.
        const _tar = event.currentTarget;

        _tar.classList.add('disabled');
        this.props.dispatch(deleteBackgroundFromServer(_tar.dataset.src));
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code BackgroundPopup} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const { background, backgroundList } = state['features/letxsoft'];
    const { room } = state['features/base/conference'];

    return {
        _background: background,
        _room: room,
        _backgroundList: backgroundList
    };
}

export default translate(connect(_mapStateToProps)(BackgroundPopup));
