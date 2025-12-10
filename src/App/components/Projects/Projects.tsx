import {Project} from "./components/Project.js";

export function Projects() {
    return <div className="projects">
        <Project
            title="node-llama-cpp"
            description="Run AI models locally on your machine"
            url="https://node-llama-cpp.withcat.ai/"
        />
    </div>;
}
