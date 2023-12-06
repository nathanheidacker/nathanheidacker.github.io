"use client";
import { useEffect, useState, useRef, forwardRef } from "react";

const chars = "!<>-_\\/[]{}—åß∂ƒ©∆æ≈ç√∫=+*^?#________λ$"; //░▒▓

function randomizeCharacter(char: string) {
    return chars[Math.floor(Math.random() * chars.length)];
}

function randomize(text: string) {
    return Array.from(text)
        .map((i) => randomizeCharacter(i))
        .join("");
}

const GlitchText: React.FC<{
    text: string;
    className?: string;
    textClassName?: string;
    delay?: number;
    hover?: number;
    speed?: number;
}> = ({ text, className, textClassName, delay, hover, speed = 1 }) => {
    const _delay = delay || 0;

    const [textIndex, setTextIndex] = useState(0);
    const [displayText, setDisplayText] = useState("");
    const trailLength = 10;

    const [updater, setUpdater] = useState<NodeJS.Timeout>();

    const ghostRef = useRef<HTMLDivElement>(null);
    const displayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTextIndex(0);

        setTimeout(
            () => {
                setUpdater(
                    setInterval(() => {
                        setTextIndex((i) => {
                            const splitIndex = Math.max(0, i - trailLength);
                            const cleanText = text.slice(0, splitIndex);
                            const glitchText = randomize(
                                text.slice(splitIndex, i)
                            );
                            setDisplayText(cleanText + glitchText);
                            return i + 1;
                        });
                    }, 10 / speed)
                );
            },
            hover ? 0 : _delay
        );

        // This is a bit hacky but because we're setting the height explicitly,
        // we need to wait for the fonts/styles to load in to get the correct
        // computed height. Otherwise, things look wonky.
        const updateHeights = setInterval(() => {
            if (ghostRef.current && displayRef.current) {
                displayRef.current.style.minHeight = `${ghostRef.current.clientHeight}px`;
            }
        }, 50);

        // Stop updating the heights after one second
        setTimeout(() => {
            clearInterval(updateHeights);
        }, 2000);
    }, [text, delay, hover]);

    useEffect(() => {
        if (textIndex - trailLength > text.length) {
            clearInterval(updater);
        }
    }, [textIndex]);

    return (
        <span className={`${className} inline-block relative`}>
            <span
                ref={ghostRef}
                className={`${textClassName} inline-block absolute top-0 left-0 opacity-0 fillEmpty`}
            >
                {text}
            </span>
            <span
                ref={displayRef}
                className={`${textClassName} fillEmpty inline-block`}
            >
                {displayText}
            </span>
        </span>
    );
};

export default GlitchText;
