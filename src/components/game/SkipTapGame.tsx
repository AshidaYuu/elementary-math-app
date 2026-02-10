import React, { useState, useEffect, useMemo, useRef } from 'react';

interface SkipTapGameProps {
    step: number;           // 2 for 2とび
    from: number;           // Starting number (2)
    to: number;             // Ending number (18)
    totalNumbers: number;   // Total numbers to display (e.g., 12)
    timeLimit: number;      // Time in seconds
    onComplete: (allCorrect: boolean, score: number, total: number) => void;
}

export default function SkipTapGame({ step, from, to, totalNumbers, timeLimit, onComplete }: SkipTapGameProps) {
    // Generate target multiples (correct answers) - memoized
    const targets = useMemo(() => {
        const result: number[] = [];
        for (let n = from; n <= to; n += step) {
            result.push(n);
        }
        return result;
    }, [step, from, to]);

    // Generate random numbers ONCE on mount - memoized
    const numbers = useMemo(() => {
        const allNumbers: number[] = [...targets];

        // Add distractors (numbers not in the sequence)
        const distractorCount = totalNumbers - targets.length;
        const possibleDistractors: number[] = [];
        for (let i = 1; i <= to + 5; i++) {
            if (!targets.includes(i)) {
                possibleDistractors.push(i);
            }
        }

        // Shuffle and pick distractors
        for (let i = 0; i < distractorCount && possibleDistractors.length > 0; i++) {
            const randIdx = Math.floor(Math.random() * possibleDistractors.length);
            allNumbers.push(possibleDistractors.splice(randIdx, 1)[0]);
        }

        // Shuffle all numbers
        return allNumbers.sort(() => Math.random() - 0.5);
    }, [targets, totalNumbers, to]);

    const [tapped, setTapped] = useState<Set<number>>(new Set());
    const [wrongTaps, setWrongTaps] = useState<Set<number>>(new Set());
    const [timeLeft, setTimeLeft] = useState(timeLimit);
    const [isComplete, setIsComplete] = useState(false);

    // Refs to track latest state for timer callback
    const tappedRef = useRef(tapped);
    const wrongTapsRef = useRef(wrongTaps);
    useEffect(() => { tappedRef.current = tapped; }, [tapped]);
    useEffect(() => { wrongTapsRef.current = wrongTaps; }, [wrongTaps]);

    // Timer
    useEffect(() => {
        if (isComplete) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0.1) {
                    clearInterval(timer);
                    // Time's up - calculate score using refs
                    finishGame(tappedRef.current, wrongTapsRef.current);
                    return 0;
                }
                return prev - 0.1;
            });
        }, 100);

        return () => clearInterval(timer);
    }, [isComplete]);

    const finishGame = (tappedSet: Set<number>, wrongSet: Set<number>) => {
        if (isComplete) return;
        setIsComplete(true);

        const correctTaps = Array.from(tappedSet).filter(n => targets.includes(n)).length;
        const allTargetsTapped = targets.every(t => tappedSet.has(t));

        onComplete(allTargetsTapped && wrongSet.size === 0, correctTaps, targets.length);
    };

    // Check if all targets are tapped
    useEffect(() => {
        if (isComplete) return;

        const allTapped = targets.every(t => tapped.has(t));
        if (allTapped) {
            finishGame(tapped, wrongTaps);
        }
    }, [tapped, targets, isComplete, wrongTaps]);

    const handleTap = (num: number) => {
        if (isComplete || tapped.has(num)) return;

        // 次にタップすべき数字を取得（順番通り）
        const nextExpected = targets[tapped.size];

        if (num === nextExpected) {
            // 正解：順番通りの数字をタップ
            setTapped(prev => new Set([...prev, num]));
        } else if (!targets.includes(num)) {
            // ターゲット以外の間違った数字のみwrongTapsに追加
            if (!wrongTaps.has(num)) {
                setWrongTaps(prev => new Set([...prev, num]));
            }
        }
        // ターゲット数字の順番違いは何もしない（ボタンは押せるまま）
    };

    const progressPercent = (tapped.size / targets.length) * 100;

    return (
        <div className="flex flex-col items-center gap-4 p-4 w-full">
            {/* Header */}
            <div className="text-lg font-bold text-slate-600">{step}とびの数をタップ！</div>

            {/* Progress bar */}
            <div className="w-full max-w-xs h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            {/* Timer */}
            <div className={`text-xl font-bold ${timeLeft < 5 ? 'text-red-500 animate-pulse' : 'text-slate-600'}`}>
                {timeLeft.toFixed(1)}秒
            </div>

            {/* Number Grid */}
            <div className="grid grid-cols-4 gap-3 w-full max-w-sm">
                {numbers.map((num, index) => {
                    const isTapped = tapped.has(num);
                    const isWrong = wrongTaps.has(num);

                    return (
                        <button
                            key={index}
                            onClick={() => handleTap(num)}
                            disabled={isTapped || isWrong || isComplete}
                            className={`
                                w-full aspect-square flex items-center justify-center
                                text-2xl font-bold rounded-xl shadow-md
                                ${isTapped
                                    ? 'bg-green-500 text-white'
                                    : isWrong
                                        ? 'bg-red-100 text-red-400'
                                        : 'bg-white text-slate-700 active:bg-blue-100'
                                }
                            `}
                        >
                            {num}
                            {isTapped && (
                                <span className="ml-1 text-sm">✓</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Target hint */}
            <div className="text-sm text-slate-400 mt-2">
                {step}とび: {from}〜{to}
            </div>

            {/* Completion message */}
            {isComplete && (
                <div className={`
                    text-xl font-bold px-6 py-3 rounded-xl mt-4
                    ${wrongTaps.size === 0 && tapped.size === targets.length
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }
                `}>
                    {wrongTaps.size === 0 && tapped.size === targets.length
                        ? '🎉 パーフェクト！'
                        : `${tapped.size}/${targets.length} 正解`
                    }
                </div>
            )}
        </div>
    );
}
