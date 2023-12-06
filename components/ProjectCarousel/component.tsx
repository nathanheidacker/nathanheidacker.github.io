"use client";
import { useEffect, useState } from "react";
import ProjectPanel from "../ProjectPanel/component";
import { ProjectPanelArgs } from "../ProjectPanel/component";

function ProjectCarousel({ projects }: { projects: ProjectPanelArgs[] }) {
    const [selected, setSelected] = useState<number>(0);

    useEffect(() => {}, []);

    return (
        <div className="projectCarousel w-full flex overflow-x-auto">
            {projects.map((project) => (
                <ProjectPanel project={project} active={true}></ProjectPanel>
            ))}
        </div>
    );
}

export default ProjectCarousel;
