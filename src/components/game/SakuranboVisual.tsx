import { Question } from "@/types/curriculum";

interface SakuranboVisualProps {
    question: Question;
    steps: string[];
    activeStep: number;
    shake: boolean;
    expectedValues?: { complement: number; remainder: number; answer?: string };
}

export function SakuranboVisual({ question, steps, activeStep, shake, expectedValues }: SakuranboVisualProps) {
    const { splitHost, splitGuest } = question.metadata || {};

    // Safety check
    if (!splitHost || !splitGuest) return <div>Invalid Question Data</div>;

    const sakuranboMode = question.metadata?.sakuranboMode || '';
    const isSplitOnly = sakuranboMode.includes('split_only');
    const isFullNoTen = sakuranboMode.includes('full_no_ten');

    // steps[0]: Complement (Box 1 - Middle Right)
    // steps[1]: Remainder (Box 2 - Bottom Right)
    // steps[2]: Final Answer (Box 3 - Bottom Far Right)

    // Check if a step has the correct value
    const isStepCorrect = (stepIndex: number): boolean => {
        if (!expectedValues) return false;
        const value = steps[stepIndex];
        if (!value) return false;
        if (stepIndex === 0) return value === expectedValues.complement.toString();
        if (stepIndex === 1) return value === expectedValues.remainder.toString();
        if (stepIndex === 2 && expectedValues.answer !== undefined) return value === expectedValues.answer;
        return false;
    };

    const getInputClass = (stepIndex: number, isSmall: boolean = false) => {
        const size = isSmall ? "w-12 h-12 text-2xl" : "w-14 h-14 sm:w-16 sm:h-16 text-3xl";
        const base = `${size} border-[3px] flex items-center justify-center font-bold bg-white rounded-xl transition-all duration-200 shadow-sm z-10 box-border`;

        let borderColor = "border-slate-300";
        if (activeStep === stepIndex) {
            borderColor = "border-blue-500 ring-4 ring-blue-200 scale-110";
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

    // ========== FULL NO TEN LAYOUT ==========
    // Layout: Top row: splitHost + splitGuest (with split arrows from splitGuest)
    //         Bottom row: splitHost + [box1] + [box2] = [box3]
    if (isFullNoTen) {
        return (
            <div className="relative w-full max-w-[400px] aspect-[3/4] mx-auto select-none bg-slate-50/50 rounded-2xl">
                {/* SVG Layer for arrows - from splitGuest to bottom boxes */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 0 }}>
                    <defs>
                        <marker id="arrowhead2" markerWidth="6" markerHeight="4" refX="0" refY="2" orient="auto">
                            <polygon points="0 0, 6 2, 0 4" fill="#94a3b8" />
                        </marker>
                    </defs>
                    {/* splitGuest -> Box1 (left branch) - going down to ~40% position */}
                    <path d="M 72 22 L 35 55" stroke="#94a3b8" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="none" markerEnd="url(#arrowhead2)" />
                    {/* splitGuest -> Box2 (right branch) - going down to ~60% position */}
                    <path d="M 78 22 L 58 55" stroke="#94a3b8" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="none" markerEnd="url(#arrowhead2)" />
                </svg>

                {/* Top: Problem display */}
                <div className="absolute top-[15%] left-[30%] -translate-x-1/2 -translate-y-1/2 text-5xl font-black text-slate-800">{splitHost}</div>
                <div className="absolute top-[15%] left-[50%] -translate-x-1/2 -translate-y-1/2 text-3xl text-slate-400 font-bold">+</div>
                <div className="absolute top-[15%] left-[75%] -translate-x-1/2 -translate-y-1/2 text-5xl font-black text-slate-800">{splitGuest}</div>

                {/* Bottom: splitHost + [Box1] + [Box2] = [Box3] - all input boxes here */}
                <div className="absolute top-[65%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex items-center space-x-3">
                    <span className="text-4xl font-black text-slate-800">{splitHost}</span>
                    <span className="text-2xl text-slate-400 font-bold">+</span>
                    <div className="relative">
                        <div className={getInputClass(0, true)}>{steps[0]}</div>
                        {isStepCorrect(0) && <CorrectIndicator />}
                    </div>
                    <span className="text-2xl text-slate-400 font-bold">+</span>
                    <div className="relative">
                        <div className={getInputClass(1, true)}>{steps[1]}</div>
                        {isStepCorrect(1) && <CorrectIndicator />}
                    </div>
                    <span className="text-2xl text-slate-400 font-bold">=</span>
                    <div className="relative">
                        <div className={getInputClass(2, true)}>{steps[2]}</div>
                        {isStepCorrect(2) && <CorrectIndicator />}
                    </div>
                </div>

                {/* Helper Text */}
                <div className="absolute bottom-4 left-0 w-full text-center text-slate-400 text-sm font-bold animate-pulse">
                    {activeStep === 0 && `あと いくつで 10？`}
                    {activeStep === 1 && `のこりは いくつ？`}
                    {activeStep === 2 && `あわせて いくつ？`}
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
                    @keyframes pop {
                        0% { transform: scale(0); opacity: 0; }
                        50% { transform: scale(1.3); }
                        100% { transform: scale(1); opacity: 1; }
                    }
                    .animate-pop {
                        animation: pop 0.3s ease-out;
                    }
                    `}
                </style>
            </div>
        );
    }

    // ========== ORIGINAL LAYOUT (split_only and default) ==========
    return (
        <div className="relative w-full max-w-[360px] aspect-[4/5] mx-auto select-none bg-slate-50/50 rounded-2xl">

            {/* SVG Layer (viewBox 0 0 100 100) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 0 }}>
                <defs>
                    <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="0" refY="2" orient="auto">
                        <polygon points="0 0, 6 2, 0 4" fill="#94a3b8" />
                    </marker>
                </defs>

                {/* 1. Top Host -> Mid Host (Straight Down) */}
                {/* 25, 15 -> 25, 45 */}
                <path d="M 25 22 L 25 38" stroke="#94a3b8" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="none" markerEnd="url(#arrowhead)" />

                {/* 2. Top Guest -> Mid Box 1 (Straight Down) */}
                {/* 75, 15 -> 75, 45 */}
                <path d="M 75 22 L 75 38" stroke="#94a3b8" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="none" markerEnd="url(#arrowhead)" />

                {/* 3. Top Guest -> Bot Box 2 (Side Path) */}
                {/* 75, 15 -> Out 90 -> Down -> In 75, 75 */}
                <path d="M 82 15 L 92 15 L 92 72 L 82 72"
                    stroke="#94a3b8" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="none" markerEnd="url(#arrowhead)" strokeLinejoin="round" />

                {/* 4. Make 10 Merge: Mid Host & Mid Box 1 -> Bot Ten */}
                {!isSplitOnly && (
                    <>
                        {/* Host (25, 45) -> Down */}
                        <path d="M 25 55 L 25 68" stroke="#94a3b8" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="none" />
                        {/* Box 1 (75, 45) -> Down-Left */}
                        <path d="M 75 55 L 75 62 L 25 62 L 25 68" stroke="#94a3b8" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="none" markerEnd="url(#arrowhead)" strokeLinejoin="round" />
                    </>
                )}

            </svg>

            {/* DOM Elements (Absolute Positioning using %) */}

            {/* Top Row (Y=15%) */}
            <div className="absolute top-[15%] left-[25%] -translate-x-1/2 -translate-y-1/2 text-5xl font-black text-slate-800">{splitHost}</div>
            <div className="absolute top-[15%] left-[50%] -translate-x-1/2 -translate-y-1/2 text-3xl text-slate-400 font-bold">+</div>
            <div className="absolute top-[15%] left-[75%] -translate-x-1/2 -translate-y-1/2 text-5xl font-black text-slate-800">{splitGuest}</div>

            {/* Mid Row (Y=45%) */}
            <div className="absolute top-[45%] left-[25%] -translate-x-1/2 -translate-y-1/2 text-5xl font-black text-slate-800">{splitHost}</div>
            <div className="absolute top-[45%] left-[50%] -translate-x-1/2 -translate-y-1/2 text-3xl text-slate-400 font-bold">+</div>

            {/* Box 1: Complement */}
            <div className="absolute top-[45%] left-[75%] -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                    <div className={getInputClass(0)}>{steps[0]}</div>
                    {isStepCorrect(0) && <CorrectIndicator />}
                </div>
            </div>

            {/* Bot Row (Y=75-85%) */}
            {/* 10 Group */}
            {!isSplitOnly && (
                <>
                    <div className="absolute top-[75%] left-[25%] -translate-x-1/2 -translate-y-1/2 text-5xl font-black text-slate-600">10</div>
                    <div className="absolute top-[75%] left-[50%] -translate-x-1/2 -translate-y-1/2 text-3xl text-slate-300 font-bold">+</div>
                </>
            )}

            {/* Box 2: Remainder */}
            <div className="absolute top-[75%] left-[75%] -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                    <div className={getInputClass(1)}>{steps[1]}</div>
                    {isStepCorrect(1) && <CorrectIndicator />}
                </div>
            </div>

            {/* Equals and Answer */}
            {!isSplitOnly && (
                <div className="absolute top-[90%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex items-center space-x-2">
                    <span className="text-3xl text-slate-300 font-bold">=</span>
                    <div className="relative">
                        <div className={`${getInputClass(2)} border-blue-500 text-blue-600 w-20`}>
                            {steps[2]}
                        </div>
                        {isStepCorrect(2) && <CorrectIndicator />}
                    </div>
                </div>
            )}

            {/* Helper Text */}
            <div className="absolute bottom-1 left-0 w-full text-center text-slate-400 text-xs font-bold animate-pulse">
                {activeStep === 0 && `あと いくつで 10？`}
                {activeStep === 1 && `のこりは いくつ？`}
                {activeStep === 2 && `あわせて いくつ？`}
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
                @keyframes pop {
                    0% { transform: scale(0); opacity: 0; }
                    50% { transform: scale(1.3); }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-pop {
                    animation: pop 0.3s ease-out;
                }
                `}
            </style>
        </div>
    );
}
