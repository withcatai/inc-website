import React, {useMemo} from "react";
import classNames from "classnames";
import {useDelayedScopeContext} from "./DelayedScopeContext.js";

import "./DelayedAppearanceDiv.css";

export function DelayedAppearanceDiv({exclusiveDuration, className, style: styleProp, ...props}: DelayedAppearanceDivProps) {
    const delayedEntry = useDelayedScopeContext({exclusiveDuration});

    const style = useMemo(() => {
        return {
            ...(styleProp ?? {}),
            "--entry-delay": delayedEntry.hookDelay + "ms"
        };
    }, [styleProp, delayedEntry.hookDelay]);

    return <div className={classNames(className, "uiDelayedAppearance")} style={style} {...props} />;
}

type DivProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
export type DelayedAppearanceDivProps = DivProps & {
    exclusiveDuration?: number
};
