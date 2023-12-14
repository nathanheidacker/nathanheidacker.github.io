"use client";
import { useEffect, useState, useRef } from "react";

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

    const intervals = useRef<NodeJS.Timeout[]>([]);
    const [textIndex, setTextIndex] = useState(0);
    const [displayText, setDisplayText] = useState("");
    const trailLength = 10;

    const ghostRef = useRef<HTMLDivElement>(null);
    const displayRef = useRef<HTMLDivElement>(null);

    const clearIntervals = () => {
        for (let interval of intervals.current) {
            clearInterval(interval);
        }
    };

    useEffect(() => {
        setTextIndex(0);
        setTimeout(
            () => {
                intervals.current.push(
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

        intervals.current.push(
            setInterval(() => {
                if (ghostRef.current && displayRef.current) {
                    displayRef.current.style.minHeight = `${ghostRef.current.clientHeight}px`;
                }
            }, 50)
        );

        return clearIntervals;
    }, [text, hover]);

    useEffect(() => {
        if (textIndex - trailLength > text.length) {
            clearIntervals();
        }
    }, [textIndex]);

    return (
        <span className={`${className} relative`}>
            <span
                ref={ghostRef}
                className={`${textClassName} absolute top-0 left-0 opacity-0 fillEmpty`}
            >
                {text}
            </span>
            <span ref={displayRef} className={`${textClassName} fillEmpty`}>
                {displayText}
            </span>
        </span>
    );
};

export default GlitchText;
