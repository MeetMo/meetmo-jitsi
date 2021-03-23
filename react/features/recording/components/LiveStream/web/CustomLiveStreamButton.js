// @flow

import { openDialog } from '../../../../base/dialog';
import { translate } from '../../../../base/i18n';
import { IconLiveStreaming } from '../../../../base/icons';
import { connect } from '../../../../base/redux';
import AbstractLiveStreamButton, {
    _mapStateToProps as _abstractMapStateToProps,
    type Props
} from '../AbstractLiveStreamButton';

import StartCustomLiveStreamDialog from './StartCustomLiveStreamDialog';
import StopCustomLiveStreamDialog from './StopCustomLiveStreamDialog';

declare var interfaceConfig: Object;

/**
 * An abstract class of a button for starting and stopping live streaming.
 */
class CustomLiveStreamButton<P: Props> extends AbstractLiveStreamButton<P> {
    accessibilityLabel = 'dialog.accessibilityLabel.liveStreaming';
    icon = IconLiveStreaming;
    label = 'dialog.startCustomLiveStreaming';
    toggledLabel = 'dialog.stopCustomLiveStreaming';

    /**
     * Returns the tooltip that should be displayed when the button is disabled.
     *
     * @private
     * @returns {string}
     */
    _getTooltip() {
        return this.props._tooltip || '';
    }

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { _isLiveStreamRunning, dispatch } = this.props;

        dispatch(openDialog(
            _isLiveStreamRunning ? StopCustomLiveStreamDialog : StartCustomLiveStreamDialog
        ));
    }

    /**
     * Returns a boolean value indicating if this button is disabled or not.
     *
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return this.props._disabled;
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._isLiveStreamRunning;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code LiveStreamButton} component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the Component.
 * @private
 * @returns {{
 *     _conference: Object,
 *     _isLiveStreamRunning: boolean,
 *     _disabled: boolean,
 *     visible: boolean
 * }}
 */
function _mapStateToProps(state: Object, ownProps: Props) {
    const abstractProps = _abstractMapStateToProps(state, ownProps);
    let { visible } = ownProps;

    if (typeof visible === 'undefined') {
        visible = interfaceConfig.TOOLBAR_BUTTONS.includes('livestreaming') && abstractProps.visible;
    }

    return {
        ...abstractProps,
        visible
    };
}

export default translate(connect(_mapStateToProps)(CustomLiveStreamButton));
