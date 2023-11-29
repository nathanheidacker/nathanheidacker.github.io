import GlitchText from "@/components/GlitchText/component";
import Diamond from "@/components/Diamond/component";
import ProjectPanel from "@/components/ProjectPanel/component";
import PROJECTS from "@/components/ProjectPanel/projects";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    IconDefinition,
    faEnvelope,
} from "@fortawesome/free-regular-svg-icons";
import { faInstagram, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import GridBackground from "@/components/GridBackground/component";

function range(x: number) {
    return Array(x)
        .fill(0)
        .map((_, j) => j);
}

function GridBackgroundOld() {
    return (
        <div className="w-max grid-cols-40 grid gap-0.5 bg-neutral-900 fixed -z-50">
            {range(800).map((i) => {
                return <div className="bg-neutral-950 gridPanel" key={i}></div>;
            })}
        </div>
    );
}

function SocialIcon({ icon, href }: { icon: IconDefinition; href?: string }) {
    return (
        <a href={href}>
            <button className="w-24 h-24 p-8 sm:w-32 sm:h-32 sm:p-12 2xl:w-40 2xl:h-40 2xl:p-14 -mx-2 border rounded-full font-thin">
                <FontAwesomeIcon icon={icon} className=""></FontAwesomeIcon>
            </button>
        </a>
    );
}

function Socials({ className }: { className?: string }) {
    return (
        <div className={className}>
            <SocialIcon
                icon={faEnvelope}
                href="mailto:nathan@heidacker.ai"
            ></SocialIcon>
            <SocialIcon
                icon={faInstagram}
                href="https://www.instagram.com/nathanheidacker/"
            ></SocialIcon>
            <SocialIcon
                icon={faLinkedin}
                href="https://www.linkedin.com/in/nathanheidacker/"
            ></SocialIcon>
        </div>
    );
}

function HeroText({ className, id }: { className?: string; id?: string }) {
    return (
        <div className={className} id={id}>
            <span className="mr-2">Hi.</span> I&apos;m
            <span className="redGradient"> Nathan</span>,<br />
            and I&apos;m a
            <GlitchText texts={["", "n", " ", "", "lways", " "]}></GlitchText>
            <br />
            <GlitchText
                className="redGradient whitespace-nowrap"
                texts={[
                    "machine learning",
                    "algorithmic trader",
                    "web developer",
                    "digital artist",
                    "learning",
                    "ベルセルク enthusiast",
                ]}
            ></GlitchText>
            <br />
            <GlitchText
                className="redGradient fillEmpty"
                texts={[
                    "engineer",
                    "\x00\x00\x00\x00\x00\x00\x00",
                    "",
                    "",
                    "",
                    "",
                ]}
            ></GlitchText>
        </div>
    );
}

function Hero() {
    return (
        <div className="flex flex-col place-content-center h-screen max-w-[2500px] relative hero">
            <div className="fixed h-full w-full max-w-[2500px] -z-40">
                <Diamond className="h-full overflow-hidden absolute top-0 left-0 diamond"></Diamond>
            </div>
            <HeroText
                id="heroText"
                className="text-neutral-300 font-bold text-4xl md:text-5xl xl:text-6xl tracking-tighter mb-24"
            ></HeroText>
            <Socials className="flex items-center"></Socials>
        </div>
    );
}

function Divider() {
    return <div className="h-80"></div>;
}

export default function Home() {
    return (
        <>
            <GridBackground className="fixed h-screen w-screen -z-50"></GridBackground>
            <div id="HOME_CONTENT">
                <Hero></Hero>
                <Divider></Divider>
                <div className="h-screen">
                    <div className="h-24"></div>
                    <div className="text-neutral-300 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter">
                        More About Me
                    </div>
                </div>
            </div>
        </>
    );
}
