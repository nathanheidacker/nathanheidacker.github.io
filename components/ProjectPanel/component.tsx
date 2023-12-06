import Image from "next/image";
import GlitchText from "../GlitchText/alternate";
import ProjectPanelButton, { ProjectPanelButtonArgs } from "./button";

interface ProjectPanelArgs {
    title: string;
    flavor: string;
    description: string[];
    startDate: string;
    endDate: string;
    image: string;
    buttons?: ProjectPanelButtonArgs[];
    titleOverlay?: boolean;
}

function ProjectPanelInfo({ project }: { project: ProjectPanelArgs }) {
    const { title, flavor, description, buttons } = project;
    const delay = 0;
    return (
        <div className="projectPanelInfo w-full bg-black opacity-70 tracking-wide flex flex-col place-content-around p-12">
            <div>
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
            <div>
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
            <div>
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
                        delay={delay + 900}
                        text={"// EXPLORE_PROJECT"}
                    ></GlitchText>
                    <div>
                        {(buttons || []).map((button, key) => {
                            return (
                                <span key={key}>
                                    <GlitchText
                                        className={
                                            "text-neutral-500 text-xl font-bold inline"
                                        }
                                        text={"//"}
                                    ></GlitchText>
                                    <span> </span>
                                    <ProjectPanelButton
                                        button={button}
                                    ></ProjectPanelButton>
                                    <br />
                                </span>
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

function ProjectPanel({
    className,
    active,
    project,
}: {
    className?: string;
    active: boolean;
    project: ProjectPanelArgs;
}) {
    const { title, flavor, image, titleOverlay } = project;
    const useTitleOverlay = titleOverlay !== undefined ? titleOverlay : true;
    return (
        <div className={`${className} text-neutral-100 projectPanel`}>
            <div className="relative overflow-hidden projectPanelHero">
                <div className="absolute flex w-full h-full">
                    {useTitleOverlay ? (
                        <div className="z-10 min-w-full place-self-center projectPanelTitle">
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
