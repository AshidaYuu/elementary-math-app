
"use client";



interface NumberPadProps {
    onInput: (char: string) => void;
    onReference?: (val: string) => void; // For parent to handle specialized actions
    disabled?: boolean;
}

export function NumberPad({ onInput, disabled }: NumberPadProps) {
    const buttons = [
        { label: "7", val: "7" },
        { label: "8", val: "8" },
        { label: "9", val: "9" },
        { label: "4", val: "4" },
        { label: "5", val: "5" },
        { label: "6", val: "6" },
        { label: "1", val: "1" },
        { label: "2", val: "2" },
        { label: "3", val: "3" },
        { label: "DEL", val: "DEL", action: true },
        { label: "0", val: "0" },
        { label: "OK", val: "ENTER", primary: true, action: true },
    ];

    return (
        <div className="grid grid-cols-3 gap-1 p-1 w-full max-w-sm mx-auto">
            {buttons.map((btn) => (
                <button
                    key={btn.label}
                    onClick={() => onInput(btn.val)}
                    disabled={disabled}
                    className={`
            flex items-center justify-center rounded-lg p-2 text-lg font-medium transition-colors active:scale-95
            ${btn.primary
                            ? "bg-blue-100 text-blue-600 hover:bg-blue-200 active:bg-blue-300"
                            : btn.action
                                ? "bg-slate-100 text-slate-500 hover:bg-slate-200 active:bg-slate-300"
                                : "bg-white text-slate-700 active:bg-slate-50 border border-slate-100"
                        }
            ${disabled ? "opacity-50 cursor-not-allowed" : "hover:brightness-95"}
            h-10
          `}
                >
                    {btn.label}
                </button>
            ))}
        </div>
    );
}
