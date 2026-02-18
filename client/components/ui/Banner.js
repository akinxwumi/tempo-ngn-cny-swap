import { X } from "lucide-react";

const styles = {
    error: "bg-danger-dim text-danger border-danger/10",
    info: "bg-accent-dim text-accent border-accent/10",
    success: "bg-success-dim text-success border-success/10",
};

export default function Banner({ type, text, onClose }) {
    if (!text) return null;
    return (
        <div className={`mt-3 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium animate-slide-in border ${styles[type] || styles.info}`}>
            <span className="flex-1 min-w-0 break-all whitespace-pre-wrap">{text}</span>
            {onClose && (
                <button onClick={onClose} className="opacity-50 hover:opacity-100 cursor-pointer"><X size={12} /></button>
            )}
        </div>
    );
}
