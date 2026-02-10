
import React from "react";

interface TenBlockVisualProps {
    base: number;      // The number given (e.g. 7 in 7 + ? = 10)
    userInput: string; // What the user has typed so far
}

export function TenBlockVisual({ base, userInput }: TenBlockVisualProps) {
    const inputValue = parseInt(userInput) || 0;

    // Ten frame indices: 0-9
    // Layout: 2 rows of 5
    // 0 1 2 3 4
    // 5 6 7 8 9

    const slots = Array.from({ length: 10 }, (_, i) => {
        const isBase = i < base;
        const isInputFill = !isBase && (i < base + inputValue);
        return { id: i, isBase, isInputFill };
    });

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-slate-100/50 rounded-2xl w-fit mx-auto mt-4">
            <div className="grid grid-cols-5 gap-1 p-2 bg-slate-800 rounded-lg shadow-xl border-4 border-slate-700">
                {slots.map((slot) => {
                    // Visual state
                    let bgClass = "bg-slate-900"; // Empty/Gap background
                    let borderClass = "border-slate-800";

                    if (slot.isBase) {
                        // Fixed Blue Block
                        bgClass = "bg-blue-500";
                        borderClass = "border-blue-400 border-t-4 border-l-4 border-r-4 border-b-4 border-b-blue-700 border-r-blue-600";
                    } else if (slot.isInputFill) {
                        // User Input - Orange Block "Snapping" in
                        bgClass = "bg-orange-500 animate-in fade-in zoom-in duration-300 fill-mode-both";
                        borderClass = "border-orange-400 border-t-4 border-l-4 border-r-4 border-b-4 border-b-orange-700 border-r-orange-600";
                    } else {
                        // Empty Gap Slot - Invisible to prevent counting
                        bgClass = "bg-transparent";
                        borderClass = "border-transparent";
                    }

                    return (
                        <div
                            key={slot.id}
                            className={`w-12 h-12 flex items-center justify-center rounded-sm ${bgClass} ${borderClass} transition-all duration-200 relative overflow-hidden`}
                        >
                            {/* Inner Shine for 3D effect */}
                            {(slot.isBase || slot.isInputFill) && (
                                <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-white to-transparent pointer-events-none" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Overflow warning if needed */}
            {inputValue > (10 - base) && (
                <div className="mt-2 text-red-500 font-bold text-xs animate-pulse">
                    はみだしています！
                </div>
            )}
        </div>
    );
}
