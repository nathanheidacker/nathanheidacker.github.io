"use client";
import { useRef, useEffect } from "react";
import { ProjectPanelArgs } from "./projects";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChevronRight,
    faChevronLeft,
} from "@fortawesome/free-solid-svg-icons";

function NavButton({ direction }: { direction: "left" | "right" }) {
    return (
        <div className="grow">
            <FontAwesomeIcon
                icon={direction == "left" ? faChevronLeft : faChevronRight}
                className=""
            ></FontAwesomeIcon>
        </div>
    );
}

function ProjectPanelNav({ project }: { project: ProjectPanelArgs }) {
    const { image } = project;
    const styleRef = useRef<HTMLStyleElement>(null);

    useEffect(() => {
        if (styleRef.current) {
            styleRef.current.textContent = `
            .projectPanelNav > div:before {
                background: url("${image}") no-repeat;
            }
            `;
        }
    }, [project]);

    return (
        <div>
            <style ref={styleRef}></style>
            <div className="flex h-full mb-4 projectPanelNav">
                <NavButton direction="left"></NavButton>
                <div className="grow mx-4"></div>
                <NavButton direction="right"></NavButton>
            </div>
        </div>
    );
}

export default ProjectPanelNav;
