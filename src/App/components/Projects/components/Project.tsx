import classNames from "classnames";
import {DelayedAppearanceDiv} from "../../../../components/DelayedAppearanceDiv.js";

import "./Project.css";

export function Project({title, description, url, className}: ProjectProps) {
    return <DelayedAppearanceDiv className={classNames("project", className)}>
        <a href={url} target="_blank" className="title">{title}</a>
        <div className="dash">{" - "}</div>
        <div className="description">{description}</div>
    </DelayedAppearanceDiv>;
}

export type ProjectProps = {
    title: string,
    description: string,
    url: string,
    className?: string
};
