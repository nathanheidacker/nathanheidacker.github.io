interface ProjectPanelArgs {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    image: string;
}

function ProjectPanel({
    className,
    args,
}: {
    className?: string;
    args: ProjectPanelArgs;
}) {
    const { title, description, startDate, endDate, image } = args;
    return (
        <div className={`${className}`}>
            <img src={image}></img>
            <div className="min-w-screen">{title}</div>
            <div>{description}</div>
            <div>
                {startDate} - {endDate}
            </div>
        </div>
    );
}

export default ProjectPanel;
