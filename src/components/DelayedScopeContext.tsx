import {createContext, ReactNode, useContext, useMemo, useState} from "react";

const ScopeContext = createContext<DelayedEntryScope>({
    defaultDelay: 20,
    state: {
        delays: 0,
        nextEntryTime: 0
    }
});
export function DelayedScopeContext({
    children,
    defaultDelay = 20,
    initialDelay = 0
}: {
    children: ReactNode,
    defaultDelay?: number,
    initialDelay?: number
}) {
    const delayedScope = useDelayedEntryScope({defaultDelay, initialDelay});

    return <ScopeContext.Provider value={delayedScope}>
        {children}
    </ScopeContext.Provider>;
}

function useDelayedEntryScope({
    defaultDelay = 20,
    initialDelay = 0
}: {
    defaultDelay?: number,
    initialDelay?: number
} = {}): DelayedEntryScope {
    const [state] = useState<DelayedEntryState>(() => ({
        delays: 0,
        nextEntryTime: Date.now() + initialDelay
    }));

    const scope = useMemo((): DelayedEntryScope => ({
        defaultDelay,
        state: state
    }), [defaultDelay]);

    return scope;
}

export function useDelayedScopeContext({
    exclusiveDuration, delay = 0
}: {
    exclusiveDuration?: number,
    delay?: number
} = {}): DelayedEntry {
    const scope = useContext(ScopeContext);
    exclusiveDuration ??= scope.defaultDelay;

    const [entry] = useState((): DelayedEntry => {
        const scopeState = scope.state;
        scopeState.delays++;

        const now = Date.now();
        const entryTime = scopeState.nextEntryTime <= now
            ? now + delay
            : scopeState.nextEntryTime + delay;

        scopeState.nextEntryTime = entryTime + exclusiveDuration;

        return {
            entryTime,
            hookDelay: entryTime - now
        };
    });

    return entry;
}

type DelayedEntryState = {
    delays: number,
    nextEntryTime: number
};

export type DelayedEntryScope = {
    defaultDelay: number,
    state: DelayedEntryState
};

export type DelayedEntry = {
    entryTime: number,
    hookDelay: number
};
