"use client";

import { useEffect, useState } from "react";

function leadingZeroes(n: number, digits: number) {
    let result = n.toString();
    while (result.length < digits) {
        result = `0${result}`;
    }
    return result;
}

function PageCount({ className }: { className?: string }) {
    const [scroll, setScroll] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);

    useEffect(() => {
        if (window) {
            const h = document.body.clientHeight;
            const vh = window.innerHeight;
            setPages(Math.floor(h / vh));

            window.addEventListener("scroll", () => {
                setScroll(Math.floor(window.scrollY));
                setPage(Math.floor(window.scrollY / vh) + 1);
            });
        }
    }, []);

    return (
        <div className={className}>
            // y{leadingZeroes(scroll, 4)}{" "}
            {`<${leadingZeroes(page, 2)}/${leadingZeroes(pages, 2)}>`}
        </div>
    );
}

function Timer({ className }: { className?: string }) {
    const [time, setTime] = useState<string>("");

    useEffect(() => {
        setInterval(() => {
            setTime(new Date().toISOString());
        }, 10);
    }, []);

    return <div className={className}>{time}</div>;
}

function VideoStats({ className }: { className?: string }) {
    const [start, _] = useState<number>(Date.now());
    const [time, setTime] = useState<number>(0);
    const [frames, setFrames] = useState<number>(0);
    const [stats, setStats] = useState<string>("");

    useEffect(() => {
        setStats(`${window.innerWidth}x${window.innerHeight}`);

        const update = () => {
            setFrames((i) => i + 1);
            setTime((Date.now() - start) / 1000);
            requestAnimationFrame(update);
        };

        update();
    }, []);
    return (
        <div className={className}>
            {stats} {leadingZeroes(Math.floor(frames / time), 3)}{" "}
            {Math.floor((time * 1000) / frames)}ms
        </div>
    );
}

function HUD({ className }: { className?: string }) {
    return (
        <div
            className={
                className + " fixed flex h-full w-full place-content-center"
            }
        >
            <div className="hud hudFont self-center grid grid-cols-2 gap-4 place-content-between">
                <PageCount className="m-2"></PageCount>
                <Timer className="m-2 place-self-end text-right whitespace-nowrap"></Timer>
                <div className=""></div>
                <VideoStats className="m-2 place-self-end text-right"></VideoStats>
            </div>
        </div>
    );
}

export default HUD;
