import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Question } from '@/types/curriculum';

interface MentalAddStepProps {
    question: Question;
    onComplete: (answer: string) => void;
}

export interface MentalAddStepHandle {
    handleInput: (val: string) => void;
}

export const MentalAddStep = forwardRef<MentalAddStepHandle, MentalAddStepProps>(({ question, onComplete }, ref) => {
    const [step, setStep] = useState<'tens' | 'ones' | 'complete'>('tens');
    const [tensInput, setTensInput] = useState('');
    const [onesInput, setOnesInput] = useState('');

    const { a, b, tensPart, onesPart, hasCarry } = question.metadata;

    useEffect(() => {
        setStep('tens');
        setTensInput('');
        setOnesInput('');
    }, [question.id]);

    const handleInput = (val: string) => {
        if (val === 'ENTER') {
            // Enter is usually auto-handled by valid input, but if manual check needed:
            return;
        }
        if (val === 'DEL') {
            if (step === 'ones') {
                if (onesInput) setOnesInput('');
                else setStep('tens'); // Go back
            } else if (step === 'tens') {
                setTensInput('');
            }
            return;
        }

        // Numeric Input
        if (step === 'tens') {
            const inputNum = parseInt(val);
            if (!isNaN(inputNum)) {
                // Correctness check immediate? Or allow wrong?
                // The prompt implies we want them to get it right.
                // Let's allow input, check against correct tensPart.

                // For training, maybe we block incorrect input or shake?
                // Let's do simple input for now.
                // If it matches expected, move next.
                if (inputNum === tensPart) {
                    setTensInput(val);
                    setStep('ones');
                } else {
                    // Feedback loop could be here. For now just ignore or maybe flash red?
                    // User requested "Training", so immediate feedback is good.
                    // Let's assume strict mode: only correct input accepts.
                }
            }
        } else if (step === 'ones') {
            const inputNum = parseInt(val);
            if (!isNaN(inputNum)) {
                if (inputNum === onesPart) {
                    setOnesInput(val);
                    setStep('complete');
                    onComplete(`${tensPart}${onesPart}`);
                }
            }
        }
    };

    useImperativeHandle(ref, () => ({
        handleInput
    }));

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto px-4 py-8">
            <div className="mb-10 text-center min-h-[60px]">
                <h2 className="text-xl font-bold mb-2 text-slate-700">
                    {step === 'tens' ? '十の位の答えは？' : step === 'ones' ? '一の位の答えは？' : '正解！'}
                </h2>
                <div className="text-sm text-slate-500">
                    {step === 'tens' && (
                        hasCarry ? (
                            <span>
                                <span className="font-bold text-red-500">一の位の和</span>が
                                <span className="font-bold text-red-500 mx-1">{a % 10 + b % 10}</span>
                                になります。<br />
                                1繰り上げて、十の位を決めよう。
                            </span>
                        ) : (
                            <span>
                                大きい位から計算しよう。<br />
                                十の位はどうなるかな？
                            </span>
                        )
                    )}
                    {step === 'ones' && '一の位同士の和の、一の位だけ書こう。'}
                </div>
            </div>

            <div className="flex items-center justify-center text-5xl font-mono font-bold space-x-4 mb-16 scale-110">
                <div className="flex items-center tracking-widest text-slate-700">
                    <div className="flex flex-col items-end leading-none">
                        {/* Highlights (Optional) */}
                    </div>
                    <span>{a}</span>
                    <span className="mx-3 text-slate-400">+</span>
                    <span>{b}</span>
                    <span className="mx-3 text-slate-400">=</span>
                </div>

                <div className="flex space-x-2">
                    {/* Tens Place */}
                    <div className={`
                        w-14 h-20 border-b-4 flex items-center justify-center rounded-t-lg transition-colors duration-200
                        ${step === 'tens' ? 'border-primary-500 bg-primary-50 text-primary-600 shadow-sm animate-pulse' : 'border-slate-200 text-slate-800'}
                    `}>
                        {tensInput}
                    </div>

                    {/* Ones Place */}
                    <div className={`
                        w-14 h-20 border-b-4 flex items-center justify-center rounded-t-lg transition-colors duration-200
                        ${step === 'ones' ? 'border-pink-500 bg-pink-50 text-pink-600 shadow-sm animate-pulse' : 'border-slate-200 text-slate-800'}
                     `}>
                        {onesInput}
                    </div>
                </div>
            </div>

            {/* Visual Hint / Diagram */}
            <div className="w-full max-w-xs h-32 relative">
                {/* Tens Hint */}
                <div className={`absolute inset-0 flex flex-col items-center transition-all duration-500 border-t-2 border-dashed border-slate-200 pt-4
                    ${step === 'tens' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                    <div className="text-xs text-slate-400 mb-1">考え方メモ</div>
                    {hasCarry ? (
                        <>
                            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                                <span className="text-slate-500">{a % 10} + {b % 10} = </span>
                                <span className="font-bold text-red-500 text-lg">{a % 10 + b % 10}</span>
                                <span className="text-red-400 text-xs ml-1">(10オーバー!)</span>
                            </div>
                            <div className="mt-2 text-primary-600 font-bold text-sm">
                                十の位は {Math.floor(a / 10) + Math.floor(b / 10)} + 1 = {tensPart}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                            <span className="text-slate-500">一の位はくり上がらないよ</span>
                        </div>
                    )}
                </div>

                {/* Ones Hint */}
                <div className={`absolute inset-0 flex flex-col items-center transition-all duration-500 border-t-2 border-dashed border-slate-200 pt-4
                    ${step === 'ones' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                    <div className="text-xs text-slate-400 mb-1">考え方メモ</div>
                    <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                        <span className="text-slate-500">一の位は...</span>
                        <span className="font-bold text-pink-500 text-lg">{(a % 10 + b % 10) % 10}</span>
                    </div>
                </div>
            </div>

        </div>
    );
});

MentalAddStep.displayName = 'MentalAddStep';
