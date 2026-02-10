import { Question } from "@/types/curriculum";
import { getKukuEquationReading, getKukuAnswerReading } from "@/lib/kukuReading";

interface StandardInputPromptProps {
    question: Question;
    currentInput: string;
    feedback?: 'correct' | 'incorrect' | null;
}

export function StandardInputPrompt({ question, currentInput, feedback }: StandardInputPromptProps) {
    const parts = question.text.split('=');
    const expression = parts[0];

    // 掛け算の読み方を取得
    const isMultiplication = expression.includes('×');
    let equationReading = '';
    let answerReading = '';

    if (isMultiplication) {
        const match = expression.match(/(\d+)×(\d+)/);
        if (match) {
            const n = parseInt(match[1], 10);
            const m = parseInt(match[2], 10);
            equationReading = getKukuEquationReading(n, m);

            // 回答後に答えの読み方を追加
            if (feedback) {
                const answer = n * m;
                answerReading = getKukuAnswerReading(answer);
            }
        }
    }

    return (
        <div className="flex flex-col items-center justify-center mb-2 animate-in slide-in-from-right duration-300">
            {/* 九九読み方 - 掛け算の場合は常に表示 */}
            {equationReading && (
                <div className="text-xl font-bold text-purple-500 mb-1">
                    <span>{equationReading}</span>
                    {feedback && answerReading && (
                        <span className="text-green-500 animate-in fade-in zoom-in duration-300">{answerReading}</span>
                    )}
                </div>
            )}

            <div className="flex items-center justify-center space-x-2">
                <div className="text-4xl font-black text-slate-800 leading-none">
                    {expression}
                </div>
                <div className="text-2xl text-slate-300 font-bold">=</div>
                <div className="min-w-[50px] h-[50px] border-b-2 border-blue-200 flex items-center justify-center relative">
                    <span className={`text-4xl font-bold animate-in zoom-in duration-100 leading-tight ${feedback === 'correct' ? 'text-green-500' :
                        feedback === 'incorrect' ? 'text-red-500' :
                            'text-blue-600'
                        }`}>
                        {feedback === 'incorrect' ? question.answer : currentInput}
                    </span>

                    {/* 正解/不正解マーク - 入力欄の右上に小さく表示 (SakuranboStyle) */}
                    {feedback && (
                        <span className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold shadow-md animate-in zoom-in duration-200 ${feedback === 'correct' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                            }`}>
                            {feedback === 'correct' ? '○' : '×'}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
