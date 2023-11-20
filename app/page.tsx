import GlitchText from "@/components/GlitchText/component";

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
            <div
                id="hero"
                className="h-screen text-center flex justify-center md:text-left md:justify-start md:ml-20"
            >
                <h1
                    id="h1"
                    className="font-bold self-center text-3xl md:text-6xl tracking-tighter"
                >
                    <span>
                        Hi. I&apos;m{" "}
                        <span className="glitchRotation">Nathan</span>,<br />
                        and I&apos;m a
                        <GlitchText
                            className="font-bold"
                            texts={["", "", "", "n", " "]}
                        ></GlitchText>
                        <br />
                    </span>
                    <GlitchText
                        className="glitchRotation font-bold"
                        texts={[
                            "machine learning engineer",
                            "web developer",
                            "digital artist",
                            "algorithmic trader",
                            "berkserk enthusiast",
                        ]}
                    ></GlitchText>
                </h1>
            </div>
        </>
    );
}
