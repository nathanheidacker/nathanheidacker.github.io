import Image from "next/image";
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
                                <>
                                    <ProjectPanelButton
                                        key={key}
                                        button={button}
                                    ></ProjectPanelButton>
                                    <br />
                                </>
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

function ProjectPanelHero({ project }: { project: ProjectPanelArgs }) {
    const { title, flavor, image, titleOverlay } = project;
    const useTitleOverlay = titleOverlay !== undefined ? titleOverlay : true;
    return (
        <div className="relative overflow-hidden projectPanelHero">
            <div className="absolute flex w-full h-full">
                {useTitleOverlay ? (
                    <div className="z-10 min-w-full font-bold place-self-center projectPanelTitle">
                        {title}
                    </div>
                ) : (
                    <></>
                )}
            </div>
            <Image
                className="opacity-50 grayscale"
                src={image}
                alt={flavor}
                width={4096}
                height={4096}
            ></Image>
        </div>
    );
}

function ProjectPanel({
    className,
    active,
    project,
}: {
    className?: string;
    active: boolean;
    project: ProjectPanelArgs;
}) {
    return (
        <div className={`${className} text-neutral-100 projectPanel`}>
            <ProjectPanelNav project={project}></ProjectPanelNav>
            {active ? (
                <ProjectPanelInfo project={project}></ProjectPanelInfo>
            ) : (
                <></>
            )}
        </div>
    );
}

export default ProjectPanel;
export type { ProjectPanelArgs };
