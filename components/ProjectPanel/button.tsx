"use client";
import { useRef, useEffect, useState } from "react";
import GlitchText from "../GlitchText/alternate";

interface ProjectPanelButtonArgs {
    text: string;
    className?: string;
}

function ProjectPanelButton({ button }: { button: ProjectPanelButtonArgs }) {
    const buttonRef = useRef<HTMLDivElement>(null);
    const [hover, setHover] = useState<number>(0);

    useEffect(() => {
        if (buttonRef.current) {
            const childText = buttonRef.current.querySelector("span");
            if (childText) {
                buttonRef.current.addEventListener("mouseenter", () => {
                    setHover((h) => h + 1);
                });
            }
        }
    }, []);

    return (
        <span ref={buttonRef} className={button.className}>
            <GlitchText
                speed={0.35}
                text={button.text}
                hover={hover}
                textClassName="redGradient text-xl font-bold font-bold"
            ></GlitchText>
        </span>
    );
}

export default ProjectPanelButton;
export type { ProjectPanelButtonArgs };
