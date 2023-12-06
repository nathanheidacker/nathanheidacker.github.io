"use client";
import { useEffect, useRef, useState } from "react";

const chars = "!<>-_\\/[]{}—åß∂ƒ©░▒▓∆æ≈ç√∫=+*^?#________λ$";

function randomizeCharacter(char: string, proportion: number) {
    if (Math.random() > proportion) {
        return char;
    }
    return chars[Math.floor(Math.random() * chars.length)];
}

function randomize(text: string, proportion: number) {
    return Array.from(text)
        .map((i) => randomizeCharacter(i, proportion))
        .join("");
}

function easeInQuint(x: number): number {
    return x * x * x * x * x;
}

const GlitchText: React.FC<{ texts: string[]; className?: string }> = ({
    texts,
    className,
}) => {
    const [textIndex, setTextIndex] = useState(0);
    const [displayText, setDisplayText] = useState(texts[textIndex]);

    let time = Date.now();
    const iters = 80;
    const iterTime = 30;
    const totalIterTime = iters * iterTime;

    useEffect(() => {
        time = Date.now();
        let randomizer = setInterval(() => {
            const proportion = Math.max(
                (totalIterTime - (Date.now() - time)) / totalIterTime,
                0.0
            );
            setDisplayText(
                randomize(texts[textIndex], easeInQuint(proportion))
            );
        }, iterTime);

        setTimeout(() => {
            clearInterval(randomizer);
        }, totalIterTime);

        return () => {
            clearInterval(randomizer);
        };
    }, [textIndex]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTextIndex((index) => (index + 1) % texts.length);
        }, 5000);
        return () => {
            clearInterval(interval);
        };
    }, [texts]);

    return <span className={className}>{displayText}</span>;
};

export default GlitchText;
