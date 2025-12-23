import { Zap, CornerDownRight, Cpu, Code, Aperture, Wifi, Link, Hash } from "lucide-react";

const AuthImagePattern = ({ title, subtitle }) => {
    const dynamicIcons = [Cpu, Code, Aperture, Wifi, Link, Hash];

    const gridStyles = [
        "bg-primary/10",
        "bg-secondary/10",
        "bg-accent/10",
    ];

    return (
        <div className="hidden lg:flex items-center justify-center p-16 relative overflow-hidden bg-base-200 text-base-content transition-colors duration-500">

            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="size-32 rounded-full bg-primary/20 blur-3xl absolute -top-10 -left-10 animate-pulse"></div>
                <div className="size-32 rounded-full bg-secondary/20 blur-3xl absolute -bottom-10 -right-10 animate-pulse"></div>
            </div>

            <div className="max-w-md text-center backdrop-blur-sm bg-base-100/50 border border-base-content/10 rounded-3xl p-10 shadow-2xl relative z-10">

                <div className="grid grid-cols-3 gap-3 mb-8">
                    {[...Array(9)].map((_, i) => {
                        const styleClass = gridStyles[i % gridStyles.length];
                        const IconComponent = (i !== 4 && i % 2 === 0)
                            ? dynamicIcons[i % dynamicIcons.length]
                            : null;

                        return (
                            <div
                                key={i}
                                className={`aspect-square rounded-2xl flex items-center justify-center relative 
                                            ${styleClass} transition-all duration-500
                                            ${i === 4 ? "scale-110 shadow-lg shadow-primary/20 border-2 border-primary" : "border border-base-content/5"}
                                `}
                            >
                                {i === 4 ? (
                                    <Zap className="size-8 text-primary animate-bounce" />
                                ) : IconComponent ? (
                                    <IconComponent className="size-6 text-accent opacity-60" />
                                ) : (
                                    <div className="size-2 rounded-full bg-base-content/20"></div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex flex-col items-center">
                    <h2 className="text-3xl font-bold mb-3 text-base-content">{title}</h2>

                    <div className="flex items-center gap-2 text-primary font-mono text-sm mb-4">
                        <CornerDownRight className="size-4" />
                        <span>Theme-Sync Active</span>
                    </div>

                    <p className="text-base-content/60">{subtitle}</p>
                </div>

            </div>
        </div>
    );
};

export default AuthImagePattern;