import {State} from "lifecycle-utils";

const darkThemeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

export const isDarkThemeState = new State(darkThemeMediaQuery.matches);

darkThemeMediaQuery.addEventListener("change", () => {
    isDarkThemeState.state = darkThemeMediaQuery.matches;
});
isDarkThemeState.state = darkThemeMediaQuery.matches;
