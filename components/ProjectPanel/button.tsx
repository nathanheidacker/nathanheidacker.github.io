"use client";
import { useRef, useEffect, useState } from "react";
import GlitchText from "../GlitchText/alternate";

interface ProjectPanelButtonArgs {
    text: string;
    href: string;
    className?: string;
}

function ProjectPanelButton({ button }: { button: ProjectPanelButtonArgs }) {
    const buttonRef = useRef<HTMLDivElement>(null);
    const [hover, setHover] = useState<number>(0);

    useEffect(() => {
        if (buttonRef.current) {
            buttonRef.current.addEventListener("mouseenter", () => {
                setHover((h) => h + 1);
            });
        }
    }, []);

    return (
        <a href={button.href}>
            <span ref={buttonRef} className={button.className}>
                <GlitchText
                    speed={0.25}
                    text={button.text}
                    hover={hover}
                    textClassName="redGradient text-xl font-bold font-bold"
                ></GlitchText>
            </span>
        </a>
    );
}

export default ProjectPanelButton;
export type { ProjectPanelButtonArgs };
