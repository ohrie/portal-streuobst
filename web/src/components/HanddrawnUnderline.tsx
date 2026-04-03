interface HanddrawnUnderlineProps {
    className?: string;
}

export default function HanddrawnUnderline({ className = "" }: HanddrawnUnderlineProps) {
    return (
        <svg
            width="600"
            height="60"
            viewBox="0 0 600 60"
            className={`w-80 md:w-[500px] ${className}`}
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M10,40 Q150,25 300,35 Q450,45 590,30"
                stroke="var(--color-primary)"
                strokeWidth="40"
                fill="none"
                strokeLinecap="round"
                className="opacity-80"
            />
        </svg>
    );
}
