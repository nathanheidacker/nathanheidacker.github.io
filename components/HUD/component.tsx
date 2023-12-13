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
            {"//y"}
            {leadingZeroes(scroll, 4)}{" "}
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
    const [times, setTimes] = useState<number[]>([]);
    const [fps, setFps] = useState<number>(0);
    const [stats, setStats] = useState<string>("");

    function refreshLoop() {
        window.requestAnimationFrame(() => {
            const now = performance.now();
            while (times.length > 0 && times[0] <= now - 1000) {
                times.shift();
            }
            times.push(now);
            setFps(times.length);
            refreshLoop();
        });
    }

    useEffect(() => {
        setStats(`${window.innerWidth}x${window.innerHeight}`);
        refreshLoop();
    }, []);

    return (
        <div className={className}>
            {stats} {leadingZeroes(fps, 3)}{" "}
            {leadingZeroes(Math.floor(1000 / fps), 3)}ms
        </div>
    );
}

function HUD({ className }: { className?: string }) {
    return (
        <div
            className={
                className +
                " fixed flex h-full w-full place-content-center z-50 pointer-events-none"
            }
        >
            <div className="hud self-center grid grid-cols-2 gap-4 place-content-between">
                <PageCount className="hudFont"></PageCount>
                <Timer className="hudFont place-self-end text-right whitespace-nowrap"></Timer>
                <div className="hudFont"></div>
                <VideoStats className="hudFont place-self-end text-right"></VideoStats>
            </div>
        </div>
    );
}

export default HUD;
