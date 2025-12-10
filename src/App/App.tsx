import {DelayedScopeContext} from "../components/DelayedScopeContext.js";
import {Header} from "./components/Header/Header.js";
import {Footer} from "./components/Footer/Footer.js";
import {Projects} from "./components/Projects/Projects.js";

import "./App.css";


export function App() {
    return <div className="app">
        <DelayedScopeContext initialDelay={300} defaultDelay={200}>
            <div className="container">
                <div className="about">
                    <Header />
                    <Projects />
                </div>
            </div>
        </DelayedScopeContext>
        <Footer />
    </div>;
}
