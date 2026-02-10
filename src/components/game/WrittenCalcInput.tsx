import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Question } from '@/types/curriculum';

interface WrittenCalcInputProps {
    question: Question;
    onComplete: (isCorrect: boolean) => void;
}

export interface WrittenCalcInputRef {
    handleInput: (val: string) => void;
}

const WrittenCalcInput = forwardRef<WrittenCalcInputRef, WrittenCalcInputProps>(({ question, onComplete }, ref) => {
    const metadata = question.metadata;
    const valA = metadata?.a || 0;
    const valB = metadata?.b || 0;

    // Convert to string for digit access
    const strA = valA.toString();
    const strB = valB.toString();

    // Calculate expected answer
    const correctAnswer = valA + valB;
    const strAnswer = correctAnswer.toString();

    // State
    // digits: index 0 = ones, 1 = tens, 2 = hundreds
    const [inputs, setInputs] = useState<string[]>(['', '', '']);
    const [carryMarks, setCarryMarks] = useState<boolean[]>([false, false]); // index 0: carry to tens, index 1: carry to hundreds
    const [activeCol, setActiveCol] = useState<number | null>(0); // Start at ones (0)
    const [submitted, setSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [shake, setShake] = useState(false);

    // Reset when question changes
    useEffect(() => {
        setInputs(['', '', '']);
        setCarryMarks([false, false]);
        setActiveCol(0);
        setSubmitted(false);
        setIsCorrect(null);
    }, [question.id]);

    const aOnes = valA % 10;
    const bOnes = valB % 10;
    const hasCarryToTens = (aOnes + bOnes) >= 10;

    const aTens = Math.floor(valA / 10);
    const bTens = Math.floor(valB / 10);
    // Note: This simple calculation assumes user calculates correctly. 
    // Ideally we assume carry is present if hasCarryToTens is true.
    const hasCarryToHundreds = (aTens + bTens + (hasCarryToTens ? 1 : 0)) >= 10;

    const handleInput = (val: string) => {
        if (submitted || activeCol === null) return;

        if (val === 'DEL') {
            if (inputs[activeCol]) {
                const newInputs = [...inputs];
                newInputs[activeCol] = '';
                setInputs(newInputs);
            } else if (activeCol > 0) {
                // Return to previous column logic
                // If we go back from Tens(1) to Ones(0), and it was a carry question,
                // do we uncheck the carry mark? Usually no, but maybe allow re-editing.
                setActiveCol(activeCol - 1);
            }
            return;
        }

        if (val === 'ENTER') {
            checkAnswer();
            return;
        }

        if (val >= '0' && val <= '9') {
            const newInputs = [...inputs];
            newInputs[activeCol] = val;
            setInputs(newInputs);

            // Auto-advance logic
            const maxIndex = strAnswer.length - 1;

            if (activeCol < maxIndex) {
                // Check if we need to force carry mark input
                if (activeCol === 0 && hasCarryToTens && !carryMarks[0]) {
                    // Block advance, wait for carry mark
                    // Ideally show some feedback?
                    return;
                }
                if (activeCol === 1 && hasCarryToHundreds && !carryMarks[1]) {
                    // Block advance
                    return;
                }

                setActiveCol(activeCol + 1);
            } else {
                setTimeout(() => checkAnswer(newInputs), 300);
            }
        }
    };

    useImperativeHandle(ref, () => ({
        handleInput
    }));

    const toggleCarryMark = (colIdx: number) => {
        if (submitted) return;

        // Prevent toggling if not relevant? 
        // User request: "control to write in same order".
        // So maybe only allow toggling if we are at the step that needs it?
        // e.g. activeCol === 0 (after input?) or activeCol === 1 (before input?)

        // Let's just allow toggling but handle the auto-advance.

        const newMarks = [...carryMarks];
        newMarks[colIdx] = !newMarks[colIdx];
        setCarryMarks(newMarks);

        // If we turned ON a carry mark that was blocking progress, advance!
        const isTurningOn = !carryMarks[colIdx];

        if (isTurningOn) {
            // If we are at Ones (0) and just turned on TensCarry (0), move to Tens (1)
            if (activeCol === 0 && colIdx === 0 && inputs[0] !== '') {
                setActiveCol(1);
            }
            // If we are at Tens (1) and just turned on HundredsCarry (1), move to Hundreds (2)
            if (activeCol === 1 && colIdx === 1 && inputs[1] !== '') {
                setActiveCol(2); // Only if strAnswer length allows?
                // Wait, if maxIndex is 2, we go to 2.
                if (strAnswer.length > 2) {
                    setActiveCol(2);
                }
            }
        }
    };

    const checkAnswer = (currentInputs = inputs) => {
        const valA = metadata?.a || 0;
        const valB = metadata?.b || 0;

        // Use provided expected answer if available (for verify/subtraction), else default to addition
        const correctAnswer = metadata?.expectedAnswer !== undefined
            ? parseInt(metadata.expectedAnswer)
            : valA + valB;

        // Also check if inputs are completely empty
        if (currentInputs.every(c => c === '')) return;

        // Inputs are [ones, tens, hundreds].
        // e.g. inputs=['5', '2'] -> 25
        // Join regular: '5','2' -> "52". parseInt("52") = 52.
        // Wait, inputs[0] is ones.
        // If inputs=['5', '2'], that means ones=5, tens=2. Value is 25.
        // Array join: "5,2" -> "52"
        // If we just join, we get "OnesTensHundreds". That's reverse.
        // We need "HundredsTensOnes".
        // So reverse first.
        const inputVal = parseInt([...currentInputs].reverse().join(''));

        const isCorrectVal = inputVal === correctAnswer;

        setSubmitted(true);
        setIsCorrect(isCorrectVal);
        setActiveCol(null);

        if (!isCorrectVal) {
            setShake(true);
            setTimeout(() => setShake(false), 500);
            const audio = new Audio('/sounds/wrong.mp3');
            audio.play().catch(() => { });
        } else {
            const audio = new Audio('/sounds/correct.mp3');
            audio.play().catch(() => { });
        }

        setTimeout(() => {
            onComplete(isCorrectVal);
        }, isCorrectVal ? 500 : 1500);
    };

    // Helper to get digit at specific power (0=ones, 1=tens)
    const getDigit = (str: string, power: number) => {
        if (power >= str.length) return '';
        return str[str.length - 1 - power];
    };

    return (
        <div className="flex flex-col items-center w-full max-w-xs mx-auto px-4 select-none">
            {/* Instruction */}
            <div className="mb-6 text-slate-500 font-bold text-center h-8">
                {activeCol === 0 && !submitted && "一の位を計算しよう"}
                {(activeCol === 'c0' || activeCol === 'c1') && !submitted && "くり上がりをタップしよう"}
                {activeCol === 1 && !submitted && "十の位を計算しよう"}
                {activeCol === 2 && !submitted && "百の位を計算しよう"}
                {submitted && isCorrect && "正解！"}
                {submitted && !isCorrect && "ちがうみたい..."}
            </div>

            {/* Calculation Grid */}
            <div className={`
                flex flex-col items-end text-6xl font-black font-mono leading-none tracking-widest relative
                transition-transform duration-100 ${shake ? 'translate-x-[4px]' : ''} ${shake ? 'translate-x-[-4px]' : ''}
            `}>
                {/* Grid Guides */}
                <div className="absolute inset-0 flex pointer-events-none opacity-10 z-0">
                    <div className="flex-1 border-r-2 border-slate-900 bg-slate-50"></div>
                    <div className="flex-1 border-r-2 border-slate-900 bg-slate-50"></div>
                    <div className="flex-1 bg-slate-50"></div>
                </div>

                {/* Carry Marks Row (Above Top Number) */}
                <div className="flex justify-end gap-2 mb-1 w-full pr-2 relative z-10 h-8">
                    {/* Tens Carry (affects hundreds place) - index 1 of carryMarks means carry TO hundreds */}

                    {/* Carry to Hundreds (Display above Hundreds, visual col 0) */}
                    <div className="w-16 flex justify-center items-end">
                        {/* Only meaningful if we have 3 digits answer */}
                        <div
                            className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 cursor-pointer transition-colors
                                ${carryMarks[1] ? 'bg-blue-100 border-blue-400 text-blue-600 font-bold' : 'border-slate-200 text-transparent hover:border-slate-300'}
                                ${activeCol === 1 && hasCarryToHundreds && !carryMarks[1] && inputs[1] !== '' ? 'animate-bounce ring-2 ring-orange-400 border-orange-400' : ''}
                            `}
                            onClick={() => toggleCarryMark(1)}
                        >
                            1
                        </div>
                    </div>

                    {/* Carry to Tens (Display above Tens, visual col 1) */}
                    <div className="w-16 flex justify-center items-end">
                        <div
                            className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 cursor-pointer transition-colors
                                ${carryMarks[0] ? 'bg-blue-100 border-blue-400 text-blue-600 font-bold' : 'border-slate-200 text-transparent hover:border-slate-300'}
                                ${activeCol === 0 && hasCarryToTens && !carryMarks[0] && inputs[0] !== '' ? 'animate-bounce ring-2 ring-orange-400 border-orange-400' : ''}
                            `}
                            onClick={() => toggleCarryMark(0)}
                        >
                            1
                        </div>
                    </div>

                    {/* Ones place (No carry above it) */}
                    <div className="w-16"></div>
                </div>

                {/* Top Number */}
                <div className="flex justify-end gap-2 mb-2 w-full pr-2 relative z-10">
                    {/* Hundreds */}
                    <div className="w-16 text-center text-slate-700">
                        {getDigit(strA, 2)}
                    </div>
                    {/* Tens */}
                    <div className="w-16 text-center text-slate-700">
                        {getDigit(strA, 1)}
                    </div>
                    {/* Ones */}
                    <div className="w-16 text-center text-slate-700">
                        {getDigit(strA, 0)}
                    </div>
                </div>

                {/* Bottom Row (+ and Number) */}
                <div className="flex justify-end gap-2 mb-2 w-full pr-2 relative z-10">
                    <span className="absolute left-[-1.5rem] bottom-2 text-4xl text-slate-400 font-normal">
                        {metadata?.operator || '+'}
                    </span>

                    {/* Hundreds */}
                    <div className="w-16 text-center text-slate-700">
                        {getDigit(strB, 2)}
                    </div>
                    {/* Tens */}
                    <div className="w-16 text-center text-slate-700">
                        {getDigit(strB, 1)}
                    </div>
                    {/* Ones */}
                    <div className="w-16 text-center text-slate-700">
                        {getDigit(strB, 0)}
                    </div>
                </div>

                {/* Line */}
                <div className="w-full border-b-4 border-slate-800 mb-2 z-10"></div>

                {/* Answer Inputs */}
                <div className="flex justify-end gap-2 w-full pr-2 relative z-10">
                    {/* Hundreds (index 2) */}
                    <div
                        className={`
                            w-16 h-20 rounded-lg flex items-center justify-center text-5xl font-black
                            ${activeCol === 2 && !submitted ? 'bg-blue-100 ring-4 ring-blue-400' : 'bg-transparent'}
                            ${submitted && inputs[2] === getDigit(strAnswer, 2) ? 'text-green-600' : ''}
                            ${submitted && inputs[2] !== getDigit(strAnswer, 2) && getDigit(strAnswer, 2) !== '' ? 'text-red-500 bg-red-50' : ''}
                        `}
                        onClick={() => !submitted && setActiveCol(2)}
                    >
                        {inputs[2]}
                    </div>

                    {/* Tens (index 1) */}
                    <div
                        className={`
                            w-16 h-20 rounded-lg flex items-center justify-center text-5xl font-black
                            ${activeCol === 1 && !submitted ? 'bg-blue-100 ring-4 ring-blue-400' : 'bg-transparent'}
                            ${submitted && inputs[1] === getDigit(strAnswer, 1) ? 'text-green-600' : ''}
                            ${submitted && inputs[1] !== getDigit(strAnswer, 1) ? 'text-red-500 bg-red-50' : ''}
                        `}
                        onClick={() => !submitted && setActiveCol(1)}
                    >
                        {inputs[1]}
                    </div>

                    {/* Ones (index 0) */}
                    <div
                        className={`
                            w-16 h-20 rounded-lg flex items-center justify-center text-5xl font-black
                            ${activeCol === 0 && !submitted ? 'bg-blue-100 ring-4 ring-blue-400' : 'bg-transparent'}
                            ${submitted && inputs[0] === getDigit(strAnswer, 0) ? 'text-green-600' : ''}
                            ${submitted && inputs[0] !== getDigit(strAnswer, 0) ? 'text-red-500 bg-red-50' : ''}
                        `}
                        onClick={() => !submitted && setActiveCol(0)}
                    >
                        {inputs[0]}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default WrittenCalcInput;
