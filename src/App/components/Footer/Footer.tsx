import {DelayedAppearanceDiv} from "../../../components/DelayedAppearanceDiv.js";

import "./Footer.css";

export function Footer() {
    return <DelayedAppearanceDiv delay={150} className="footer">
        <div className="companyName">Catai Labs Inc.</div>
    </DelayedAppearanceDiv>;
}
