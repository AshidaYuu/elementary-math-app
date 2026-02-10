import { useState, useEffect } from 'react';
import { Question } from '@/types/curriculum';

interface CarryMarkTapProps {
    question: Question;
    onComplete: (isCorrect: boolean) => void;
}

export default function CarryMarkTap({ question, onComplete }: CarryMarkTapProps) {
    const metadata = question.metadata;
    const a = metadata?.a || 0;
    const b = metadata?.b || 0;

    const onesA = a % 10;
    const onesB = b % 10;
    const hasCarry = (onesA + onesB) >= 10;

    const [marked, setMarked] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    useEffect(() => {
        setMarked(false);
        setSubmitted(false);
        setIsCorrect(null);
    }, [question.id]);

    const handleToggleMark = () => {
        if (submitted) return;
        setMarked(!marked);
    };

    const handleSubmit = () => {
        if (submitted) return;

        // Correct if:
        // (hasCarry AND marked) OR (!hasCarry AND !marked)
        const correct = (hasCarry && marked) || (!hasCarry && !marked);

        setSubmitted(true);
        setIsCorrect(correct);

        setTimeout(() => {
            onComplete(correct);
        }, correct ? 500 : 1500);
    };

    // Helper to get digit
    const getDigit = (num: number, place: number) => {
        const str = num.toString();
        // place 0 = ones, 1 = tens
        const idx = str.length - 1 - place;
        if (idx < 0) return '';
        return str[idx];
    };

    return (
        <div className="flex flex-col items-center w-full max-w-xs mx-auto px-4 select-none">
            <div className="mb-6 text-slate-500 font-bold text-center h-8">
                {!submitted && "くり上がりは ある？"}
                {submitted && isCorrect && "正解！"}
                {submitted && !isCorrect && "ちがうみたい..."}
            </div>

            <div className="flex flex-col items-end text-6xl font-black font-mono leading-none tracking-widest relative mb-8">
                {/* Carry Mark Area */}
                <div className="flex justify-end gap-2 mb-1 w-full pr-2 relative z-10 h-8">
                    {/* Tens Place Carry Mark */}
                    <div className="w-16 flex justify-center items-end">
                        <div
                            className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 cursor-pointer transition-colors
                                ${marked ? 'bg-blue-100 border-blue-400 text-blue-600 font-bold' : 'border-slate-200 text-transparent hover:border-slate-300'}
                            `}
                            onClick={handleToggleMark}
                        >
                            1
                        </div>
                    </div>
                    {/* Ones Place */}
                    <div className="w-16"></div>
                </div>

                {/* Top Number */}
                <div className="flex justify-end gap-2 mb-2 w-full pr-2 relative z-10">
                    <div className="w-16 text-center text-slate-700">{getDigit(a, 1)}</div>
                    <div className="w-16 text-center text-slate-700">{getDigit(a, 0)}</div>
                </div>

                {/* Bottom Number */}
                <div className="flex justify-end gap-2 mb-2 w-full pr-2 relative z-10">
                    <span className="absolute left-[-1.5rem] bottom-2 text-4xl text-slate-400 font-normal">+</span>
                    <div className="w-16 text-center text-slate-700">{getDigit(b, 1)}</div>
                    <div className="w-16 text-center text-slate-700">{getDigit(b, 0)}</div>
                </div>

                {/* Line */}
                <div className="w-full border-b-4 border-slate-800 mb-2 z-10"></div>
            </div>

            {/* Check Button */}
            <button
                className={`
                    px-8 py-3 rounded-xl font-bold text-xl shadow-md transition-all
                    ${submitted
                        ? 'bg-slate-300 text-slate-500'
                        : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg active:scale-95'
                    }
                `}
                onClick={handleSubmit}
                disabled={submitted}
            >
                答え合わせ
            </button>
        </div>
    );
}
