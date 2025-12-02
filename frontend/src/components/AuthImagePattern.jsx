import { Zap, CornerDownRight, Cpu, Code, Aperture, Wifi, Link, Hash } from "lucide-react";

const AuthImagePattern = ({ title, subtitle }) => {
    
    // A pool of modern, tech-related icons to choose from
    const dynamicIcons = [Cpu, Code, Aperture, Wifi, Link, Hash];

    // Define subtle colors and styles for the modern grid elements
    const gridStyles = [
        "bg-primary/15",
        "bg-white/10 backdrop-blur-sm", 
        "bg-secondary/10",
    ];

    return (
        <div 
            className="hidden lg:flex items-center justify-center p-16 relative overflow-hidden text-base-content"
            style={{ 
                background: "radial-gradient(circle at center, var(--fallback-bc,oklch(var(--bc))) 0%, var(--fallback-b3,oklch(var(--b3))) 100%)",
            }}
        >
            
            {/* Abstract Background Dots (Visual Depth) */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="size-4 rounded-full bg-primary absolute top-[10%] left-[20%] animate-ping-slow"></div>
                <div className="size-6 rounded-full bg-secondary absolute bottom-[15%] right-[25%] animate-pulse-slow"></div>
                <div className="size-8 rounded-full bg-accent absolute top-[40%] right-[10%] animate-spin-slow"></div>
            </div>

            {/* Content Card (Glassmorphism & High Contrast) */}
            <div className="max-w-md text-center backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-10 shadow-3xl relative z-10 transition-all duration-500 hover:shadow-4xl">
                
                {/* Dynamic Content Grid Pattern */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                    {[...Array(9)].map((_, i) => {
                        const styleClass = gridStyles[i % gridStyles.length];
                        
                        // Select a random icon for certain boxes (e.g., every 3rd box, but not the center)
                        const IconComponent = (i !== 4 && i % 3 === 0) 
                            ? dynamicIcons[Math.floor(Math.random() * dynamicIcons.length)] 
                            : null;

                        return (
                            <div
                                key={i}
                                className={`aspect-square rounded-xl flex items-center justify-center relative 
                                            ${styleClass} transition-all duration-300 ease-out text-white/50
                                            ${i % 2 === 0 ? "hover:rotate-3" : "hover:-translate-y-0.5"}
                                            ${i === 4 ? "shadow-lg shadow-primary/40 scale-110 border-2 border-primary/50" : ""}
                                `}
                            >
                                {/* Center Box (Focal Point) */}
                                {i === 4 ? (
                                    <Zap className="size-8 text-primary animate-pulse" />
                                ) : IconComponent ? (
                                    // Boxes with Icons
                                    <IconComponent className="size-5 text-secondary/80 opacity-70" />
                                ) : (
                                    // Boxes with ID Tag/Number
                                    <span className="text-xs font-mono opacity-50">ID-{(i + 1).toString().padStart(2, '0')}</span>
                                )}

                            </div>
                        );
                    })}
                </div>

                {/* Modern Header Group */}
                <div className="flex flex-col items-center">
                    <Zap className="size-8 text-primary mb-4 animate-flash-subtle" />
                    
                    <h2 className="text-4xl font-black mb-3 text-white leading-tight tracking-wide">{title}</h2>
                    
                    <div className="text-sm font-mono text-primary flex items-center mb-6">
                        <CornerDownRight className="size-4 mr-1"/> 
                        A modern perspective
                    </div>

                    <p className="text-lg text-white/70">{subtitle}</p>
                </div>

            </div>
        </div>
    );
};

export default AuthImagePattern;