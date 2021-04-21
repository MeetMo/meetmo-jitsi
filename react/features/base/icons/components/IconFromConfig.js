// @flow

import React from "react";
import { ReactSVG } from "react-svg";
import { isEmpty } from "lodash";

import { styleTypeToObject } from "../../styles";

type Props = {
    /**
     * Configuration object.
     */
    configuration: Object,

    /**
     * Key has a string from the configuration which represents the src value.
     * Basically, which key has the icon URL.
     */
    iconKey?: String,

    /**
     * Class name for the ReactSVG component.
     */
    className: String,

    /**
     * Style object to be applied.
     */
    style?: Object,
};

/**
 * Implements an IconFromConfig component that takes a configuration object like this
 * {
 *      "active_svg": "https://test.meetmo.io/images/assets/chat.svg",
 *      "svg_active_color": "#ff9900",
 *      "button_active_color": "#ff9900",
 *      "hover_effect": "darker"
 * }
 * as props and returns a ReactSVG component.
 *
 * @param {Props} props - The props of the component.
 * @returns {Reactelement}
 */
export default function IconFromConfig(props: Props) {
    const { configuration, iconKey, className, style } = props;
    const {
        svgWidth = "24",
        svgHeight = "24",
        ...restStyle
    } = styleTypeToObject(style ?? {});

    if (isEmpty(configuration)) return null;

    return (
        <ReactSVG
            className={className}
            style={restStyle}
            src={configuration[iconKey]}
            beforeInjection={(svg) => {
                svg.classList.add(configuration.hover_effect);
                svg.setAttribute("fill", configuration.button_active_color);
                svg.setAttribute("stroke", configuration.svg_active_color);
                svg.setAttribute("width", svgWidth);
                svg.setAttribute("height", svgHeight);
                svg.style.pointerEvents = "none";
            }}
        />
    );
}

IconFromConfig.defaultProps = {
    iconKey: "active_svg",
    className: "jitsi-icon",
};