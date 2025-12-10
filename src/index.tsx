import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/inter/opsz-italic.css";
import "./index.css";
import {App} from "./App/App.tsx";
import {Background} from "./App/components/Background/Background.js";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <App />
        <Background />
    </React.StrictMode>
);
