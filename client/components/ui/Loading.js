import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="animate-spin text-ink-3 opacity-50">
                <Loader2 size={40} strokeWidth={1} />
            </div>
            <p className="mt-4 text-[15px] font-semibold text-ink-2">Loading...</p>
        </div>
    );
}
