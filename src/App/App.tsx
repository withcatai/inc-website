import {DelayedScopeContext} from "../components/DelayedScopeContext.js";
import {Header} from "./components/Header/Header.js";
import {Footer} from "./components/Footer/Footer.js";
import {Projects} from "./components/Projects/Projects.js";

import "./App.css";


export function App() {
    return <div className="app">
        <DelayedScopeContext initialDelay={250} defaultDelay={50}>
            <div className="container">
                <div className="about">
                    <Header />
                    <Projects />
                </div>
            </div>
            <Footer />
        </DelayedScopeContext>
    </div>;
}
