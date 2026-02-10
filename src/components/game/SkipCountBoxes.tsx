
import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

interface SkipCountBoxesProps {
    step: number;           // 2 for 2とび
    from: number;           // Starting number (2)
    to: number;             // Ending number (18)
    prefilled?: number[];   // Numbers to show as hints (e.g., [2, 4, 8])
    onComplete: (allCorrect: boolean, mistakes: number[]) => void;
}

export interface SkipCountBoxesRef {
    handleInput: (val: string) => void;
}

const SkipCountBoxes = forwardRef<SkipCountBoxesRef, SkipCountBoxesProps>(
    ({ step, from, to, prefilled = [], onComplete }, ref) => {
        // Generate the correct sequence
        const sequence: number[] = [];
        for (let n = from; n <= to; n += step) {
            sequence.push(n);
        }

        const [values, setValues] = useState<string[]>(
            sequence.map(n => prefilled.includes(n) ? n.toString() : '')
        );
        const [currentIndex, setCurrentIndex] = useState(
            prefilled.includes(sequence[0]) ? sequence.findIndex(n => !prefilled.includes(n)) : 0
        );
        const [submitted, setSubmitted] = useState<boolean[]>(
            sequence.map(n => prefilled.includes(n))
        );
        const [correct, setCorrect] = useState<boolean[]>(
            sequence.map(n => prefilled.includes(n))
        );
        const [isComplete, setIsComplete] = useState(false);

        const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

        useEffect(() => {
            // Focus on the current input
            if (currentIndex >= 0 && currentIndex < sequence.length && !submitted[currentIndex]) {
                inputRefs.current[currentIndex]?.focus();
            }
        }, [currentIndex, submitted]);

        // Handle input from NumberPad
        const handleInput = (val: string) => {
            if (isComplete || currentIndex < 0 || currentIndex >= sequence.length || submitted[currentIndex]) return;

            if (val === 'DEL') {
                const newValues = [...values];
                newValues[currentIndex] = values[currentIndex].slice(0, -1);
                setValues(newValues);
                return;
            }

            if (val === 'ENTER') {
                if (values[currentIndex]) {
                    submitAnswer(currentIndex);
                }
                return;
            }

            // Add digit (max 2 digits)
            if (values[currentIndex].length >= 2) return;
            const newValues = [...values];
            newValues[currentIndex] = values[currentIndex] + val;
            setValues(newValues);
        };

        // Expose handleInput to parent via ref
        useImperativeHandle(ref, () => ({
            handleInput
        }));

        const handleInputChange = (index: number, value: string) => {
            // Only allow numbers
            if (!/^\d*$/.test(value)) return;

            const newValues = [...values];
            newValues[index] = value;
            setValues(newValues);
        };

        const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                submitAnswer(index);
            }
        };

        const submitAnswer = (index: number) => {
            const userAnswer = parseInt(values[index], 10);
            const correctAnswer = sequence[index];
            const isCorrect = userAnswer === correctAnswer;

            const newSubmitted = [...submitted];
            newSubmitted[index] = true;
            setSubmitted(newSubmitted);

            const newCorrect = [...correct];
            newCorrect[index] = isCorrect;
            setCorrect(newCorrect);

            // If wrong, show correct answer
            if (!isCorrect) {
                const newValues = [...values];
                newValues[index] = correctAnswer.toString();
                setValues(newValues);
            }

            // Move to next unanswered box
            const nextIndex = sequence.findIndex((_, i) => i > index && !newSubmitted[i]);
            if (nextIndex !== -1) {
                setCurrentIndex(nextIndex);
            } else {
                // All boxes filled
                setIsComplete(true);
                const mistakes = sequence.filter((_, i) => !newCorrect[i]).map((_, i) => sequence[i]);
                onComplete(newCorrect.every(c => c), mistakes);
            }
        };

        return (
            <div className="flex flex-col items-center gap-4 p-4 w-full">
                <div className="text-lg font-bold text-slate-600 mb-2">{step}とび</div>

                {/* Grid layout - wraps to multiple lines */}
                <div className="flex flex-wrap justify-center items-center gap-2 w-full max-w-sm">
                    {sequence.map((num, index) => {
                        const isPrefilled = prefilled.includes(num);
                        const isActive = index === currentIndex && !submitted[index] && !isPrefilled;
                        const isSubmitted = submitted[index];
                        const isCorrectAnswer = correct[index];
                        const hasValue = values[index] !== '';

                        return (
                            <div key={index} className="flex items-center">
                                {/* Box */}
                                <div
                                    className={`
                                    w-12 h-12 flex items-center justify-center relative
                                    border-2 rounded-lg text-xl font-bold
                                    transition-all duration-200
                                    ${isSubmitted
                                            ? isCorrectAnswer
                                                ? 'bg-green-100 border-green-400 text-green-700'
                                                : 'bg-red-100 border-red-400 text-red-700'
                                            : isActive
                                                ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-300'
                                                : isPrefilled
                                                    ? 'bg-slate-100 border-slate-300 text-slate-600'
                                                    : 'bg-white border-slate-200'
                                        }
                                `}
                                >
                                    {/* Small circle for correct answers */}
                                    {isSubmitted && isCorrectAnswer && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-xs">✓</span>
                                        </div>
                                    )}

                                    {isPrefilled ? (
                                        // Prefilled hint value
                                        <span className="text-slate-500">{num}</span>
                                    ) : isActive ? (
                                        // Active input - show value while typing
                                        <span className={hasValue ? 'text-blue-600' : 'text-slate-300'}>
                                            {hasValue ? values[index] : '?'}
                                        </span>
                                    ) : isSubmitted ? (
                                        // Submitted value
                                        <span>{values[index]}</span>
                                    ) : (
                                        // Future boxes - show question mark
                                        <span className="text-slate-300">?</span>
                                    )}
                                </div>

                                {/* Arrow connector (except last) */}
                                {index < sequence.length - 1 && (
                                    <div className="text-slate-300 text-xs mx-1">→</div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Submit button for current box */}
                {!isComplete && currentIndex >= 0 && currentIndex < sequence.length && !submitted[currentIndex] && (
                    <button
                        onClick={() => submitAnswer(currentIndex)}
                        disabled={!values[currentIndex]}
                        className={`
                        px-6 py-3 rounded-xl font-bold text-white text-lg
                        transition-all duration-200 shadow-lg
                        ${values[currentIndex]
                                ? 'bg-blue-500 hover:bg-blue-600 active:scale-95'
                                : 'bg-slate-300 cursor-not-allowed'
                            }
                    `}
                    >
                        次へ
                    </button>
                )}

                {/* Completion message */}
                {isComplete && (
                    <div className={`
                    text-xl font-bold px-6 py-3 rounded-xl
                    ${correct.every(c => c)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }
                `}>
                        {correct.every(c => c)
                            ? '🎉 パーフェクト！'
                            : `完了！ ${correct.filter(c => c).length}/${sequence.length} 正解`
                        }
                    </div>
                )}
            </div>
        );
    }
);

export default SkipCountBoxes;
