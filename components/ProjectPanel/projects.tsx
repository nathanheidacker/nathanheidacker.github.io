import { ProjectPanelButtonArgs } from "./button";

export interface ProjectPanelArgs {
    title: string;
    flavor: string;
    description: string[];
    projectStatus: string;
    image: string;
    startDate: string;
    endDate?: string;
    buttons?: ProjectPanelButtonArgs[];
    titleOverlay?: boolean;
    font?: string;
}

const ALPHAGRADIENT = {
    title: "AlphaGradient",
    flavor: "A python library for quickly developing and backtesting financial algorithms",
    description: [
        "AlphaGradient is a python package for creating and backtesting financial algorithms. AlphaGradient implements asset and portfolio-analagous data structures that interact in intuitive ways, and provides a framework for developing algorithms that utilize these objects in highly parallelized backtests. AlphaGradient is built on top of the industry's most widely adopted libraries, and requires comparatively minimal technical know-how to pick up.",
        "Where other libraries might require you to be a programmer first and and a certified quantitative financial analyst second, AlphaGradient is truly geared towards hobbyist algorithmic traders who want to play around with ideas for financial algorithms. Within minutes, you can have a fully backtestable algorithm using nothing but basic python.",
        "If you have even a passing interest in finance or algorithmic trading, this package makes it as easy as possible to get involved without having a background in computer science.",
    ],
    projectStatus: "SUSPENDED",
    startDate: "November 2021",
    endDate: "July 2022",
    image: "alphagradient.png",
    buttons: [
        {
            text: "// DOCS",
            href: "https://nathanheidacker.github.io/alphagradient",
        },
        {
            text: "// CODE",
            href: "https://github.com/nathanheidacker/alphagradient",
        },
    ],
    font: "asd",
};

const HEIDACKERAI = {
    title: "heidacker.ai",
    flavor: "A digital marketing agency created by my brother and I",
    description: [
        "heidacker.ai is a digital marketing agency that specializes in creating captivating 3D art installations for generative AI startups. Our team is a fusion of creativity and expertise, dedicated to translating complex innovations into immersive web experiences.",
        "heidacker.ai aims to craft interactive 3D showcases that bring AI-driven products to life. Our goal is to seamlessly demonstrate the value and possibilities of these innovations to businesses and individuals alike. Through our work, we aim to transform intricate concepts into engaging digital narratives.",
        "Our approach is rooted in collaboration and skill. We deeply understand your product, design a compelling 3D narrative, and then bring it to life using cutting-edge technology. The result is an intuitive, cross-platform experience that lets your product shine without distractions.",
    ],
    projectStatus: "ACTIVE",
    startDate: "August 2023",
    image: "heidackerai2.png",
    buttons: [
        {
            text: "// WEBSITE",
            href: "https://heidacker.ai",
        },
    ],
    font: "helvetica",
};

const YUGEN = {
    title: "Yūgen",
    flavor: "A 3D digital storefront for Japanese ceramic artists",
    description: [
        "Yūgen is a cutting-edge 3D digital storefront designed to showcase the exquisite craftsmanship of Japanese ceramic artists. Yūgen is not merely a marketplace; it's a curated gallery where every piece comes to life in stunning three-dimensional detail, allowing patrons to explore the intricate nuances and timeless beauty of each creation.",
        "At the heart of Yūgen lies the groundbreaking Gaussian Splatting rendering technique, a state-of-the-art method that elevates the visualization of ceramic art to unprecedented levels. Unlike conventional rendering techniques, Gaussian Splatting meticulously captures the delicate textures, intricate details, and subtle nuances of each ceramic masterpiece, providing a true-to-life representation that goes beyond the limitations of traditional images. This novel approach ensures that users can authentically experience the artistry and craftsmanship of Japanese ceramics as if they were holding the pieces in their hands.",
        "Yūgen serves as a bridge between art and technology, creating a digital space where the profound beauty of Japanese ceramics is celebrated and accessible worldwide. By incorporating Gaussian Splatting, we redefine the standards of online art appreciation, offering a unique and unparalleled experience for enthusiasts, collectors, and connoisseurs alike.",
    ],
    projectStatus: "ACTIVE",
    startDate: "November 2023",
    image: "yugen.png",
    buttons: [
        {
            text: "// WEBSITE",
            href: "https://www.google.com",
        },
    ],
    titleOverlay: false,
    font: "ivymode",
};

const PORTFOLIOSITE = {
    title: "Portfolio",
    flavor: "This portfolio website :)",
    description: [""],
    projectStatus: "ACTIVE",
    startDate: "October 2023",
    image: "alphagradient.png",
    buttons: [
        {
            text: "// MY RESUME",
            href: "https://www.google.com",
        },
    ],
};

// Rearrange order here
const PROJECTS: ProjectPanelArgs[] = [YUGEN, HEIDACKERAI, ALPHAGRADIENT];

export default PROJECTS;
