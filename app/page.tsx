import GlitchText from "@/components/GlitchText/component";
import Diamond from "@/components/Diamond/component";

function range(x: number) {
    return Array(x)
        .fill(0)
        .map((_, j) => j);
}

function GridBackground() {
    return (
        <div className="h-screen min-w-full w-max grid-cols-40 grid gap-0.5 bg-neutral-900 fixed -z-50 overflow-hidden">
            {range(800).map((i) => {
                return <div className="bg-neutral-950 gridPanel" key={i}></div>;
            })}
        </div>
    );
}

export default function Home() {
    return (
        <>
            <GridBackground></GridBackground>
            <Diamond className="h-screen w-screen overflow-hidden fixed -z-40 ml-20"></Diamond>
            <div
                id="hero"
                className="h-screen text-left flex flex-col place-items-start justify-start ml-8 md:ml-28"
            >
                <div className="flex-1 max-h-28 md:max-h-full"></div>
                <h1
                    id="h1"
                    className="font-bold flex-1 text-3xl md:text-6xl tracking-tighter"
                >
                    <span>
                        Hi. I&apos;m <span className="redGradient">Nathan</span>
                        ,<br />
                        and I&apos;m a
                        <GlitchText
                            className="font-bold"
                            texts={["", "n", " ", "", "lways", " "]}
                        ></GlitchText>
                        <br />
                    </span>
                    <GlitchText
                        className="redGradient font-bold"
                        texts={[
                            "machine learning engineer",
                            "algorithmic trader",
                            "web developer",
                            "digital artist",
                            "learning",
                            "ベルセルク enthusiast",
                        ]}
                    ></GlitchText>
                </h1>
                <div className="flex-1"></div>
            </div>
        </>
    );
}
