"use client";
import { useRef, useEffect } from "react";
import { ProjectPanelArgs } from "./projects";

function NavButton({ direction }: { direction: "left" | "right" }) {
    const icon = direction == "left" ? "<" : ">";
    return (
        <div
            className={`${direction} p-4 md:p-8 flex place-content-center align-middle grayscale`}
        >
            <div className="place-self-center">{icon}</div>
        </div>
    );
}

function ProjectPanelNav({ project }: { project: ProjectPanelArgs }) {
    const { image, title, font } = project;
    const styleRef = useRef<HTMLStyleElement>(null);
    const fontClass = font
        ? `
    .projectPanelNav > div.middle {
        font-family: '${font}'; 
    }
    `
        : "";

    useEffect(() => {
        if (styleRef.current) {
            styleRef.current.textContent = `
            .projectPanelNav > div:before {
                background-image: url(${image});
            }

            ${fontClass}
            `;
        }
    }, [project]);

    return (
        <div>
            <style ref={styleRef}></style>
            <div className="flex h-full mb-4 select-none projectPanelNav">
                <NavButton direction="left"></NavButton>
                <div className="middle grow flex place-content-center font-bold mx-4 grayscale">
                    <div className="place-self-center">{title}</div>
                </div>
                <NavButton direction="right"></NavButton>
            </div>
        </div>
    );
}

export default ProjectPanelNav;
