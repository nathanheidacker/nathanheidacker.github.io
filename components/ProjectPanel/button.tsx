"use client";
import { useRef, useEffect, useState } from "react";
import GlitchText from "../GlitchText/alternate";

interface ProjectPanelButtonArgs {
    text: string;
    href: string;
    className?: string;
}

function ProjectPanelButton({ button }: { button: ProjectPanelButtonArgs }) {
    const speed = 0.5;
    const buttonRef = useRef<HTMLSpanElement>(null);
    const [hover, setHover] = useState<number>(0);
    const cooldown = useRef<boolean>(false);

    useEffect(() => {
        if (buttonRef.current) {
            buttonRef.current.addEventListener("mouseenter", () => {
                if (!cooldown.current) {
                    cooldown.current = true;
                    setHover((h) => h + 1);
                }
                setTimeout(() => {
                    cooldown.current = false;
                }, (10 * (button.text.length + 10)) / speed);
            });
        }
    }, []);

    return (
        <a href={button.href}>
            <span ref={buttonRef} className={button.className}>
                <GlitchText
                    speed={speed}
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
