"use client";
import { useEffect, useState, useRef } from "react";
import GlitchText from "../GlitchText/alternate";
import ProjectPanelButton from "./button";
import ProjectPanelNav from "./nav";
import { ProjectPanelArgs } from "./projects";

function ProjectPanelInfo({ project }: { project: ProjectPanelArgs }) {
    const {
        title,
        flavor,
        description,
        buttons,
        startDate,
        endDate,
        projectStatus,
    } = project;
    const delay = 0;
    const periodTitle =
        projectStatus == "ACTIVE" ? "START_DATE" : "DEVELOPMENT_PERIOD";
    return (
        <div className="projectPanelInfo w-full bg-black opacity-70 tracking-wide flex flex-col my-auto">
            <div className="mb-6">
                <GlitchText
                    className={"text-neutral-500"}
                    delay={delay}
                    text={"// PROJECT_NAME"}
                ></GlitchText>
                <br />
                <GlitchText
                    className={"mb-4"}
                    delay={delay}
                    text={title}
                ></GlitchText>
            </div>
            <div className="mb-6">
                <GlitchText
                    className={"text-neutral-500"}
                    delay={delay}
                    text={"// DEVELOPMENT_STATUS"}
                ></GlitchText>
                <br />
                <GlitchText
                    className={`${
                        projectStatus == "ACTIVE" ? "redGradient font-bold" : ""
                    } mb-4`}
                    delay={delay}
                    text={projectStatus}
                ></GlitchText>
            </div>
            <div className="mb-6">
                <GlitchText
                    className={"text-neutral-500"}
                    delay={delay}
                    text={`// ${periodTitle}`}
                ></GlitchText>
                <br />
                <GlitchText
                    className={"mb-4"}
                    delay={delay}
                    text={endDate ? `${startDate} - ${endDate}` : startDate}
                ></GlitchText>
            </div>
            <div className="mb-6">
                <GlitchText
                    className={"text-neutral-500"}
                    delay={delay}
                    text={"// SUMMARY"}
                ></GlitchText>
                <br />
                <GlitchText
                    className={"mb-4"}
                    delay={delay}
                    text={flavor}
                ></GlitchText>
            </div>
            <div className="mb-6">
                <GlitchText
                    className={"text-neutral-500"}
                    delay={delay}
                    text={"// DESCRIPTION"}
                ></GlitchText>
                <br />
                <div className="flex flex-col place-content-around">
                    {description.map((p, key) => {
                        return (
                            <GlitchText
                                speed={5}
                                key={key}
                                className="mb-4"
                                delay={delay}
                                text={p}
                            ></GlitchText>
                        );
                    })}
                </div>
            </div>
            {(buttons || []).length ? (
                <div>
                    <GlitchText
                        className={"text-neutral-500"}
                        delay={delay}
                        text={"// EXPLORE_PROJECT"}
                    ></GlitchText>
                    <div>
                        {(buttons || []).map((button, key) => {
                            return (
                                <div className="mt-2" key={key}>
                                    <ProjectPanelButton
                                        button={button}
                                    ></ProjectPanelButton>
                                    <br />
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <></>
            )}
        </div>
    );
}

function mod(n: number, m: number) {
    return ((n % m) + m) % m;
}

function ProjectPanel({
    className,
    projects,
}: {
    className?: string;
    projects: ProjectPanelArgs[];
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [projectIndex, setProjectIndex] = useState<number>(0);

    useEffect(() => {
        if (containerRef.current) {
            const nav = containerRef.current.querySelector(".projectPanelNav");
            const info =
                containerRef.current.querySelector(".projectPanelInfo");
            if (nav && info) {
                const [left, middle, right] = Array.from(nav.children);

                const handleLeft = () => {
                    setProjectIndex((current) =>
                        mod(current - 1, projects.length)
                    );
                    left.classList.add("active");
                    setTimeout(() => {
                        left.classList.remove("active");
                    }, 1);
                };
                const handleMiddle = () => {
                    if (info.classList.contains("active")) {
                        info.classList.remove("active");
                    } else {
                        info.classList.add("active");
                    }
                    middle.classList.add("active");
                    setTimeout(() => {
                        middle.classList.remove("active");
                    }, 1);
                };
                const handleRight = () => {
                    setProjectIndex((current) =>
                        mod(current + 1, projects.length)
                    );
                    right.classList.add("active");
                    setTimeout(() => {
                        right.classList.remove("active");
                    }, 1);
                };

                left.addEventListener("pointerdown", handleLeft);
                middle.addEventListener("pointerdown", handleMiddle);
                right.addEventListener("pointerdown", handleRight);

                return () => {
                    removeEventListener("pointerdown", handleLeft);
                    removeEventListener("pointerdown", handleMiddle);
                    removeEventListener("pointerdown", handleRight);
                };
            }
        }
    }, [projects]);

    return (
        <div
            ref={containerRef}
            className={`${className} text-neutral-100 projectPanel`}
        >
            <ProjectPanelNav project={projects[projectIndex]}></ProjectPanelNav>
            <ProjectPanelInfo
                project={projects[projectIndex]}
            ></ProjectPanelInfo>
        </div>
    );
}

export default ProjectPanel;
export type { ProjectPanelArgs };
