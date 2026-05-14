const STORAGE_KEY = "syncronus-message-sound";

export const isMessageSoundEnabled = () => {
    try {
        return localStorage.getItem(STORAGE_KEY) !== "0";
    } catch {
        return true;
    }
};

export const setMessageSoundEnabled = (enabled) => {
    try {
        localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
    } catch {
        /* ignore */
    }
};

/** Tiếng ping ngắn khi có tin mới (không cần file âm thanh) */
export function playMessageSound() {
    if (!isMessageSoundEnabled()) return;
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
        osc.onended = () => ctx.close?.();
    } catch {
        /* ignore */
    }
}
