import { Question } from "@/types/curriculum";

interface SakuranboSubVisualProps {
    question: Question;
    steps: string[];
    activeStep: number;
    shake: boolean;
    expectedValues?: { step1: number; step2: number; answer?: string };
}

/**
 * Subtraction Borrow Procedure Visual (減加法)
 * 
 * Example: 13 - 9
 * Simple layout:
 * 
 *   13      −      9           (Top: Problem)
 *    ↓
 *   10      −      9    =  [□] (Mid: step1)
 *    +
 *    3      →     [□]   +  3  =  [答え]  (Bot: step1 + remainder)
 */
export function SakuranboSubVisual({ question, steps, activeStep, shake, expectedValues }: SakuranboSubVisualProps) {
    const { minuend, subtrahend, splitHost, splitGuest } = question.metadata || {};

    // Safety check
    if (!minuend || !subtrahend) return <div>Invalid Question Data</div>;

    const isStepCorrect = (stepIndex: number): boolean => {
        if (!expectedValues) return false;
        const value = steps[stepIndex];
        if (!value) return false;
        if (stepIndex === 0) return value === expectedValues.step1.toString();
        if (stepIndex === 1) return value === expectedValues.step2.toString();
        return false;
    };

    const getInputClass = (stepIndex: number) => {
        const size = "w-14 h-14 sm:w-16 sm:h-16 text-3xl";
        const base = `${size} border-[3px] flex items-center justify-center font-bold bg-white rounded-xl transition-all duration-200 shadow-sm z-10 box-border`;

        let borderColor = "border-slate-300";
        if (activeStep === stepIndex) {
            borderColor = "border-orange-500 ring-4 ring-orange-200 scale-110";
        } else if (stepIndex < activeStep) {
            borderColor = "border-slate-800 bg-slate-50 text-slate-800";
        }

        const shakeClass = (activeStep === stepIndex && shake) ? "animate-shake bg-red-50 border-red-400" : "";

        return `${base} ${borderColor} ${shakeClass}`;
    };

    const CorrectIndicator = () => (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
            ○
        </div>
    );

    return (
        <div className="relative w-full max-w-[360px] aspect-[4/5] mx-auto select-none bg-orange-50/50 rounded-2xl">

            {/* SVG Layer for arrows */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 0 }}>
                <defs>
                    <marker id="arrowheadSub" markerWidth="6" markerHeight="4" refX="0" refY="2" orient="auto">
                        <polygon points="0 0, 6 2, 0 4" fill="#f97316" />
                    </marker>
                </defs>

                {/* minuend -> 10 (straight down) */}
                <path d="M 25 22 L 25 38" stroke="#f97316" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="none" markerEnd="url(#arrowheadSub)" />

                {/* 10 -> splitGuest (side branch) */}
                <path d="M 18 45 L 10 45 L 10 72 L 18 72"
                    stroke="#f97316" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="none" markerEnd="url(#arrowheadSub)" strokeLinejoin="round" />

                {/* step1 result -> bottom calculation */}
                <path d="M 75 55 L 75 68" stroke="#94a3b8" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="none" markerEnd="url(#arrowheadSub)" />
            </svg>

            {/* DOM Elements */}

            {/* Top Row (Y=15%): minuend − subtrahend */}
            <div className="absolute top-[15%] left-[25%] -translate-x-1/2 -translate-y-1/2 text-5xl font-black text-slate-800">{minuend}</div>
            <div className="absolute top-[15%] left-[50%] -translate-x-1/2 -translate-y-1/2 text-3xl text-orange-500 font-bold">−</div>
            <div className="absolute top-[15%] left-[75%] -translate-x-1/2 -translate-y-1/2 text-5xl font-black text-orange-600">{subtrahend}</div>

            {/* Mid Row (Y=45%): 10 − subtrahend = [Box1] */}
            <div className="absolute top-[45%] left-[25%] -translate-x-1/2 -translate-y-1/2 text-5xl font-black text-orange-600">{splitHost}</div>
            <div className="absolute top-[45%] left-[50%] -translate-x-1/2 -translate-y-1/2 text-3xl text-orange-500 font-bold">−</div>
            <div className="absolute top-[45%] left-[60%] -translate-x-1/2 -translate-y-1/2 text-4xl font-black text-orange-600">{subtrahend}</div>
            <div className="absolute top-[45%] left-[70%] -translate-x-1/2 -translate-y-1/2 text-2xl text-slate-400 font-bold">=</div>
            <div className="absolute top-[45%] left-[82%] -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                    <div className={getInputClass(0)}>{steps[0]}</div>
                    {isStepCorrect(0) && <CorrectIndicator />}
                </div>
            </div>

            {/* Bot Row (Y=75%): [step1] + splitGuest = [Box2] */}
            <div className="absolute top-[75%] left-[25%] -translate-x-1/2 -translate-y-1/2 text-5xl font-black text-blue-600">{splitGuest}</div>
            <div className="absolute top-[75%] left-[43%] -translate-x-1/2 -translate-y-1/2 text-3xl text-green-500 font-bold">+</div>
            <div className="absolute top-[75%] left-[55%] -translate-x-1/2 -translate-y-1/2 text-4xl font-black text-slate-600">
                {steps[0] || "?"}
            </div>
            <div className="absolute top-[75%] left-[70%] -translate-x-1/2 -translate-y-1/2 text-2xl text-slate-400 font-bold">=</div>
            <div className="absolute top-[75%] left-[82%] -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                    <div className={getInputClass(1)}>{steps[1]}</div>
                    {isStepCorrect(1) && <CorrectIndicator />}
                </div>
            </div>

            {/* Helper Text */}
            <div className="absolute bottom-1 left-0 w-full text-center text-slate-400 text-xs font-bold animate-pulse">
                {activeStep === 0 && `10 から ${subtrahend} をひくと？`}
                {activeStep === 1 && `${splitGuest} を たすと？`}
            </div>

            <style>
                {`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out 2;
                }
                `}
            </style>
        </div>
    );
}
