import Image from "next/image";
import GlitchText from "@/components/GlitchText/component";

function range(x: number) {
    return Array(x)
        .fill(0)
        .map((_, j) => j);
}

function GridBackground() {
    return (
        <div className="h-screen min-w-full w-max grid-cols-40 grid gap-0.5 bg-neutral-900 absolute -z-50">
            {range(800).map((i) => {
                return <div className="bg-neutral-950 gridPanel" key={i}></div>;
            })}
        </div>
    );
}

export default function Home() {
    return (
        <div className="h-screen w-screen relative overflow-hidden">
            <GridBackground></GridBackground>
            <h1 className="text-2xl md:text-4xl tracking-tighter">
                <span>Hi, I&apos;m </span>
                <GlitchText
                    className="glitchRotation font-bold text-3xl md:text-5xl"
                    texts={[
                        "Nathan",
                        "a machine learning engineer",
                        "a web developer",
                        "a digital artist",
                        "an algorithmic trader",
                        "a berkserk enthusiast",
                        "a little bit slow",
                    ]}
                ></GlitchText>
            </h1>
        </div>
    );
}
