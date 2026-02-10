import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Question } from '@/types/curriculum';

interface PlaceValueInputProps {
    question: Question;
    onComplete: (isCorrect: boolean) => void;
}

export interface PlaceValueInputRef {
    handleInput: (val: string) => void;
}

const PlaceValueInput = forwardRef<PlaceValueInputRef, PlaceValueInputProps>(({ question, onComplete }, ref) => {
    const metadata = question.metadata;
    const is3Digit = metadata?.poolType === 'place_value_3d';

    // 2桁か3桁かによってinputの数を決定
    const [values, setValues] = useState<(string)[]>(is3Digit ? ['', '', ''] : ['', '']);
    const [activeIndex, setActiveIndex] = useState(0); // 0 or -1 (submitted)
    const [submitted, setSubmitted] = useState(false);
    const [shake, setShake] = useState(false);

    // Expected values
    const expectedValues = is3Digit
        ? [
            metadata?.hundreds !== undefined ? String(metadata.hundreds) : '',
            metadata?.tens !== undefined ? String(metadata.tens) : '',
            metadata?.ones !== undefined ? String(metadata.ones) : ''
        ]
        : [
            metadata?.tens !== undefined ? String(metadata.tens) : '',
            metadata?.ones !== undefined ? String(metadata.ones) : ''
        ];

    console.log('[PlaceValueInput] Debug:', { values, expectedValues, metadata });

    const placeholders = is3Digit ? ['百', '十', '一'] : ['十', '一'];

    // Reset when question changes
    useEffect(() => {
        setValues(is3Digit ? ['', '', ''] : ['', '']);
        setActiveIndex(0);
        setSubmitted(false);
    }, [question.id, is3Digit]);

    // Handle input from parent (NumberPad)
    const handleInput = (val: string) => {
        if (submitted) return;

        if (val === 'DEL') {
            if (values[activeIndex]) {
                // Delete current value
                const newValues = [...values];
                newValues[activeIndex] = '';
                setValues(newValues);
            } else if (activeIndex > 0) {
                // Go back to previous
                setActiveIndex(activeIndex - 1);
            }
            return;
        }

        if (val === 'ENTER') {
            // Check if all filled
            if (values.every(v => v !== '')) {
                checkAnswer();
            }
            return;
        }

        // Number input
        if (val >= '0' && val <= '9') {
            const newValues = [...values];
            newValues[activeIndex] = val;
            setValues(newValues);

            // Auto-advance to next empty slot
            if (activeIndex < values.length - 1) {
                setActiveIndex(activeIndex + 1);
            } else {
                // All filled, auto-check
                setTimeout(() => checkAnswer(newValues), 300);
            }
        }
    };

    // Expose handleInput via ref
    useImperativeHandle(ref, () => ({
        handleInput
    }));

    const checkAnswer = (currentValues = values) => {
        if (submitted) return;

        // Check answers (ignore empty string vs undefined mismatch, stricter check)
        const currentIsCorrect = currentValues.every((v, i) => v === expectedValues[i]);
        setSubmitted(true);
        // setIsCorrect(currentIsCorrect);

        console.log('[PlaceValueInput] Check:', { currentValues, expectedValues, isCorrect: currentIsCorrect });

        if (!currentIsCorrect) {
            setShake(true);
            setTimeout(() => setShake(false), 500);
        }

        setTimeout(() => {
            onComplete(currentIsCorrect);
        }, currentIsCorrect ? 1000 : 2000);
    };

    return (
        <div className="flex flex-col items-center w-full px-4">
            {/* Display number */}
            <div className="text-6xl font-black text-slate-800 mb-8 select-none">
                {question.text}
            </div>

            {/* Place value boxes */}
            <div className={`flex gap-3 transition-transform duration-100 ${shake ? 'translate-x-[-4px]' : ''} ${shake ? 'translate-x-[4px]' : ''}`}>
                {values.map((val, idx) => {
                    const showCorrect = submitted && val === expectedValues[idx];
                    const showIncorrect = submitted && val !== expectedValues[idx];
                    const isZero = expectedValues[idx] === '0';

                    return (
                        <div key={idx} className="flex flex-col items-center">
                            {/* Place label */}
                            <div className="text-sm text-slate-500 mb-1 font-bold select-none">
                                {placeholders[idx]}の位
                            </div>

                            {/* Input box */}
                            <div
                                className={`
                                    w-16 h-20 rounded-xl flex items-center justify-center text-4xl font-black
                                    transition-all duration-200 cursor-pointer select-none
                                    ${activeIndex === idx && !submitted ? 'ring-4 ring-blue-400 bg-blue-50' : 'bg-white'}
                                    ${showCorrect ? 'bg-green-100 ring-4 ring-green-400 text-green-700' : ''}
                                    ${showIncorrect ? 'bg-red-100 ring-4 ring-red-400 text-red-700' : ''}
                                    ${!submitted ? 'shadow-lg border-2 border-slate-200' : ''}
                                `}
                                onClick={() => !submitted && setActiveIndex(idx)}
                            >
                                {val}
                            </div>

                            {/* Zero indicator for 3-digit (helper text) */}
                            {isZero && is3Digit && !submitted && (
                                <div className="text-xs text-slate-400 mt-1 select-none">
                                    (0かも)
                                </div>
                            )}

                            {/* Show correct answer on incorrect */}
                            {showIncorrect && (
                                <div className="text-sm text-red-500 mt-1 font-bold select-none animate-pulse">
                                    {expectedValues[idx]}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>



            {/* Hint for input order */}
            {!submitted && (
                <div className="mt-6 text-slate-400 text-sm select-none">
                    左から順に入力してね
                </div>
            )}
        </div>
    );
});

export default PlaceValueInput;
