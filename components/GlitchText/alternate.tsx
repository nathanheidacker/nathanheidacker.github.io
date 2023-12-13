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

    const [animating, setAnimating] = useState<boolean>(false);
    const [textIndex, setTextIndex] = useState(0);
    const [displayText, setDisplayText] = useState("");
    const trailLength = 10;

    const [updater, setUpdater] = useState<NodeJS.Timeout>();

    const ghostRef = useRef<HTMLDivElement>(null);
    const displayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!animating) {
            setAnimating(true);
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

            return () => {
                clearInterval(updater);
            };
        }
    }, [text, hover, speed, delay]);

    useEffect(() => {
        if (!animating) {
            const handle = setInterval(() => {
                if (ghostRef.current && displayRef.current) {
                    displayRef.current.style.minHeight = `${ghostRef.current.clientHeight}px`;
                }
            }, 50);

            // Stop updating the heights after one second
            setTimeout(() => {
                clearInterval(handle);
            }, 2000);

            return () => {
                clearInterval(handle);
            };
        }
    }, [text]);

    useEffect(() => {
        if (textIndex - trailLength > text.length) {
            clearInterval(updater);
            setAnimating(false);
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
