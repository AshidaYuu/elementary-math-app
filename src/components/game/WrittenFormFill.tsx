import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Question } from '@/types/curriculum';

interface WrittenFormFillProps {
    question: Question;
    onComplete: (isCorrect: boolean) => void;
}

export interface WrittenFormFillRef {
    handleInput: (val: string) => void;
}

const WrittenFormFill = forwardRef<WrittenFormFillRef, WrittenFormFillProps>(({ question, onComplete }, ref) => {
    const metadata = question.metadata;
    const topNumber = metadata?.topNumber || 0;
    const bottomNumber = metadata?.bottomNumber || 0;

    // Top digits (display only)
    const topStr = topNumber.toString();
    // Bottom digits (to be filled)
    const bottomStr = bottomNumber.toString();

    // Determine max length for alignment (2 or 3 digits) and column structure
    // We use a fixed 3-column layout (Hundreds, Tens, Ones) for consistency
    // Index 0: Hundreds, 1: Tens, 2: Ones

    const [inputs, setInputs] = useState(['', '', '']);
    const [activeIndex, setActiveIndex] = useState<number | null>(null); // Start with no active index? Or auto-select?
    const [submitted, setSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [shake, setShake] = useState(false);

    // Calculate expected array based on bottomNumber
    // If bottom is 5 (ones), expected is ['', '', '5']
    // If bottom is 15 (tens, ones), expected is ['', '1', '5']
    const expected = ['', '', ''];
    for (let i = 0; i < bottomStr.length; i++) {
        expected[2 - i] = bottomStr[bottomStr.length - 1 - i];
    }

    // Auto-select first empty slot that should represent a digit from the right?
    // Or just start from the rightmost digit?
    // Usually written calculation starts from ones place.
    useEffect(() => {
        setInputs(['', '', '']);
        setSubmitted(false);
        setIsCorrect(null);

        // Find starting index (left-most digit)
        // expected array is always length 3 [Hundreds, Tens, Ones]
        // example: 42 -> ['', '4', '2'] -> start index 1
        // example: 5 -> ['', '', '5'] -> start index 2
        const firstDigitIndex = expected.findIndex(v => v !== '');
        setActiveIndex(firstDigitIndex !== -1 ? firstDigitIndex : 2);
    }, [question.id]);

    const handleInput = (val: string) => {
        if (submitted || activeIndex === null) return;

        if (val === 'DEL') {
            if (inputs[activeIndex]) {
                const newInputs = [...inputs];
                newInputs[activeIndex] = '';
                setInputs(newInputs);
            } else {
                // Move to left (traditional backspace)
                if (activeIndex > 0) {
                    setActiveIndex(activeIndex - 1);
                }
            }
            return;
        }

        if (val === 'ENTER') {
            checkAnswer();
            return;
        }

        if (val >= '0' && val <= '9') {
            const newInputs = [...inputs];
            newInputs[activeIndex] = val;
            setInputs(newInputs);

            // Auto-advance logic (Rightward)
            if (activeIndex < 2) {
                // If next slot is also empty (or expected?), move there
                setActiveIndex(activeIndex + 1);
            } else {
                // Last slot filled
                // Compare with expected
                const filledCount = newInputs.filter(v => v !== '').length;
                // Simply check if all expected slots are filled?
                // expected has empty strings for non-digits.
                // We should wait until user fills all expected digits.

                // If current input matches expected length, check?
                // Or just auto-check when last slot (index 2) is filled?
                // Since we move left-to-right, index 2 is the last one.

                setTimeout(() => checkAnswer(newInputs), 300);
            }
        }
    };

    useImperativeHandle(ref, () => ({
        handleInput
    }));

    const checkAnswer = (currentInputs = inputs) => {
        if (submitted) return;

        // Validation: Correct digits in correct places?
        const correct = currentInputs.every((val, idx) => val === expected[idx]);

        setSubmitted(true);
        setIsCorrect(correct);
        setActiveIndex(null);

        if (!correct) {
            setShake(true);
            setTimeout(() => setShake(false), 500);
        }

        setTimeout(() => {
            onComplete(correct);
        }, correct ? 500 : 1500);
    };

    return (
        <div className="flex flex-col items-center w-full max-w-xs mx-auto px-4">
            <div className="flex flex-col items-center mb-8 bg-blue-50 px-6 py-3 rounded-xl border border-blue-100">
                <div className="text-3xl font-black text-slate-700 tracking-widest mb-1">
                    {topNumber} + {bottomNumber}
                </div>
                <div className="text-sm font-bold text-slate-400">
                    {bottomNumber} を正しく書こう
                </div>
            </div>

            {/* Written Calculation Layout */}
            <div className="flex flex-col items-end text-6xl font-black font-mono leading-none tracking-widest relative">

                {/* Grid Lines (Guides) */}
                <div className="absolute inset-0 flex pointer-events-none opacity-10">
                    <div className="flex-1 border-r-2 border-slate-900"></div>
                    <div className="flex-1 border-r-2 border-slate-900"></div>
                    <div className="flex-1"></div>
                </div>

                {/* Top Number */}
                <div className="flex justify-end gap-2 mb-2 w-full pr-2">
                    {/* Padding for hundreds if 2-digit */}
                    {topStr.length < 3 && <div className="w-16"></div>}
                    {/* Padding for tens if 1-digit */}
                    {topStr.length < 2 && <div className="w-16"></div>}

                    {topStr.split('').map((d: string, i: number) => (
                        <div key={i} className="w-16 text-center text-slate-700">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Plus Sign (Absolute) */}
                <div className="absolute left-[-1rem] bottom-24 text-4xl text-slate-400">
                    +
                </div>

                {/* Bottom Row (Inputs) */}
                <div className={`flex justify-end gap-2 border-b-4 border-slate-800 pb-2 w-full pr-2 transition-transform duration-100 ${shake ? 'translate-x-[4px] border-red-500' : ''} ${shake ? 'translate-x-[-4px]' : ''}`}>
                    {[0, 1, 2].map((idx) => {
                        const val = inputs[idx];
                        const showCorrect = submitted && val === expected[idx];
                        const showIncorrect = submitted && val !== expected[idx];
                        // Only show input box if it's active or has value or is expected
                        // Actually show all 3 slots to allow mistake (placing in wrong column)

                        return (
                            <div
                                key={idx}
                                className={`
                                    w-16 h-24 rounded-lg flex items-center justify-center 
                                    text-5xl font-black text-slate-800
                                    transition-all duration-200 cursor-pointer
                                    ${activeIndex === idx && !submitted ? 'bg-blue-100 ring-4 ring-blue-400 z-10' : 'bg-transparent hover:bg-slate-100'}
                                    ${!submitted ? 'border border-dashed border-slate-300' : ''}
                                    ${showCorrect ? 'bg-green-100 text-green-700 border-green-500 border-solid' : ''}
                                    ${showIncorrect ? 'bg-red-100 text-red-700 border-red-500 border-solid' : ''}
                                `}
                                onClick={() => !submitted && setActiveIndex(idx)}
                            >
                                {val}
                            </div>
                        );
                    })}
                </div>

                {/* Result Area (Empty for this stage) */}
                <div className="h-24 w-full"></div>
            </div>



            {!submitted && (
                <div className="mt-8 text-slate-400 text-sm">
                    上の式と同じように書いてね
                </div>
            )}
        </div>
    );
});

export default WrittenFormFill;
