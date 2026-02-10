import { useState, useEffect } from 'react';
import { Question } from '@/types/curriculum';

interface WrittenFormChoiceProps {
    question: Question;
    onComplete: (isCorrect: boolean) => void;
}

export default function WrittenFormChoice({ question, onComplete }: WrittenFormChoiceProps) {
    const metadata = question.metadata;
    const topNumber = metadata?.topNumber || 0;
    const bottomNumber = metadata?.bottomNumber || 0;
    const choices = metadata?.choices || [];

    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    useEffect(() => {
        setSelectedIdx(null);
        setSubmitted(false);
        setIsCorrect(null);
    }, [question.id]);

    const handleSelect = (idx: number) => {
        if (submitted) return;

        const choice = choices[idx];
        const correct = choice.isCorrect;

        setSelectedIdx(idx);
        setSubmitted(true);
        setIsCorrect(correct);

        setTimeout(() => {
            onComplete(correct);
        }, correct ? 500 : 1500);
    };

    // Helper to render a single written calculation layout choice
    const renderChoice = (choice: { layout: string, isCorrect: boolean }, idx: number) => {
        const isSelected = selectedIdx === idx;
        const showResult = submitted && isSelected;

        // Determine offsets based on layout type
        // standard: A (top) is aligned right? Actually usually both right aligned.
        // E01 (位ズレ): e.g. 23 + 5 where 5 is under 2.

        const topStr = topNumber.toString();
        const bottomStr = bottomNumber.toString();

        // Grid setup: 3 columns (Hundreds, Tens, Ones)
        // correct: align right (index 2)
        // left_shift: shift bottom left by 1 (align to index 1)
        // right_shift: shift top left? or bottom right (index 3? off grid?)
        // blank_shift: weird gap?

        // Let's define visual columns: [0, 1, 2]
        // top is always correct (e.g. 23 -> "2", "3" in [1], [2])

        const getColumn = (str: string, colIdx: number, shift: number) => {
            // align right to col 2.
            // string index for col 2 is length-1.
            // visual col 2 corresponds to 10^0.

            // logic:
            // digit at 10^k should be at col (2-k).
            // k=0 (ones) -> col 2
            // k=1 (tens) -> col 1

            // if shift = 0 (correct)
            // if shift = -1 (left shift) -> k=0 displayed at col 1

            // map visual col to digit power
            // visual 2 -> power 0 (ones) - shift
            // power = 2 - colIdx - shift

            const power = 2 - colIdx - shift;
            if (power < 0 || power >= str.length) return "";
            // str is "23". power 0 is '3', power 1 is '2'.
            // str index = len - 1 - power
            return str[str.length - 1 - power];
        };

        let bottomShift = 0;
        let topShift = 0;

        if (choice.layout === 'left_shift') {
            bottomShift = 1; // bottom numbers shifted left (ones appearing in tens place)
        } else if (choice.layout === 'right_shift') {
            // Maybe top shifted left? Or bottom shifted right (impossible if already at edge)?
            // Let's simulate "misaligned columns".
            // Maybe bottom is correct but Top is shifted left?
            // Or bottom is shifted way left (shift=2)
            bottomShift = -1; // Shifted right? (ones at index 3?)
            // if shift is -1, power becomes 2 - col - (-1) = 3 - col.
            // col 2 -> power 1. (5 displayed as 50) - Wait, that's left shift.

            // Wait:
            // Correct: 5 at col 2 (ones).
            // Left Shift: 5 at col 1 (tens).
            // Right Shift: 5 at col 3? (tenths?) - visual glitch style?
        }

        // Simplification for MVP:
        // correct: Top aligned, Bottom aligned.
        // left_shift: Bottom shifted left (e.g. ones under tens).
        // right_shift: Bottom shifted right (e.g. tens under ones - only for 2 digit?)
        // blank_shift: Top shifted left?

        if (choice.layout === 'left_shift') {
            bottomShift = 1;
        } else if (choice.layout === 'right_shift') {
            // Only valid if bottom has >1 digit or we shift wildly.
            // Let's make it "Top is shifted left" effect?
            topShift = 1;
        } else if (choice.layout === 'blank_shift') {
            bottomShift = 2; // Way off
        }

        return (
            <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={submitted}
                className={`
                    relative p-4 rounded-xl border-4 transition-all duration-200
                    flex flex-col items-center gap-2 bg-white
                    ${isSelected
                        ? (choice.isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50 ring-4 ring-red-200')
                        : 'border-slate-200 hover:border-blue-300 hover:shadow-lg'
                    }
                    ${submitted && !isSelected ? 'opacity-40 grayscale' : ''}
                `}
            >
                {/* Visual Representation */}
                <div className="text-3xl font-black font-mono leading-none flex flex-col items-end">

                    {/* Top Row */}
                    {/* Top Row */}
                    <div className="flex justify-end gap-2 mb-0">
                        {[0, 1, 2].map(c => {
                            const val = getColumn(topStr, c, topShift);
                            return (
                                <div key={`t-${c}`} className="w-6 text-center text-slate-700">
                                    {val}
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom Row & Plus */}
                    <div className="flex justify-end gap-2 mb-0 relative">
                        <span className="absolute left-[-0.5rem] bottom-[2px] text-xl text-slate-400 font-bold">+</span>
                        {[0, 1, 2].map(c => {
                            const val = getColumn(bottomStr, c, bottomShift);
                            return (
                                <div key={`b-${c}`} className="w-6 text-center text-slate-800">
                                    {val}
                                </div>
                            );
                        })}
                    </div>

                    {/* Line */}
                    <div className="w-full border-b-4 border-slate-800 mt-1"></div>
                </div>

                {/* Selection Marker */}
                {isSelected && (
                    <div className={`absolute top-2 right-2 text-2xl ${choice.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                        {choice.isCorrect ? '⭕️' : '❌'}
                    </div>
                )}
            </button>
        );
    };

    return (
        <div className="flex flex-col items-center w-full px-2">
            <h2 className="text-xl font-bold text-slate-600 mb-6">
                正しい書き方はどれ？
            </h2>

            <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
                {choices.map((choice: any, idx: number) => renderChoice(choice, idx))}
            </div>


        </div>
    );
}
