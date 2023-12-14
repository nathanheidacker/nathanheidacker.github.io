"use client";
import { useRef, useEffect } from "react";
import { ProjectPanelArgs } from "./projects";

function NavButton({ direction }: { direction: "left" | "right" }) {
    const icon = direction == "left" ? "<" : ">";
    return (
        <div className="p-8 flex text-[80px] place-content-center grayscale hover:grayscale-0">
            <div className="place-self-center">{icon}</div>
        </div>
    );
}

function ProjectPanelNav({ project }: { project: ProjectPanelArgs }) {
    const { image, title } = project;
    const styleRef = useRef<HTMLStyleElement>(null);

    useEffect(() => {
        if (styleRef.current) {
            styleRef.current.textContent = `
            .projectPanelNav > div:before {
                background: url("${image}");
            }
            `;
        }
    }, [project]);

    return (
        <div>
            <style ref={styleRef}></style>
            <div className="flex h-full mb-4 select-none projectPanelNav">
                <NavButton direction="left"></NavButton>
                <div className="grow flex place-content-center font-bold mx-4 grayscale hover:grayscale-0">
                    <div className="place-self-center">{title}</div>
                </div>
                <NavButton direction="right"></NavButton>
            </div>
        </div>
    );
}

export default ProjectPanelNav;
