import {DelayedAppearanceDiv} from "../../../components/DelayedAppearanceDiv.js";

import "./Header.css";

export function Header() {
    return <DelayedAppearanceDiv className="header">
        <div className="companyName">Catai Labs</div>
    </DelayedAppearanceDiv>;
}
