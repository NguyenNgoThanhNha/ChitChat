import { useCallback, useEffect, useRef, useState } from "react";

const iceServers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

export function useVoiceChannel(socket, channelId, userId) {
    const [joined, setJoined] = useState(false);
    const [error, setError] = useState(null);
    const localStreamRef = useRef(null);
    const peersRef = useRef(new Map());
    const remoteAudioContainerRef = useRef(null);

    const addRemoteAudio = (stream, peerId) => {
        const host = remoteAudioContainerRef.current;
        if (!host) return;
        let el = host.querySelector(`audio[data-peer="${peerId}"]`);
        if (!el) {
            el = document.createElement("audio");
            el.dataset.peer = peerId;
            el.autoplay = true;
            el.playsInline = true;
            host.appendChild(el);
        }
        el.srcObject = stream;
    };

    const removeRemoteAudio = (peerId) => {
        const host = remoteAudioContainerRef.current;
        const el = host?.querySelector?.(`audio[data-peer="${peerId}"]`);
        el?.remove();
    };

    const closePeer = (peerId) => {
        const pc = peersRef.current.get(peerId);
        if (pc) {
            pc.close();
            peersRef.current.delete(peerId);
        }
        removeRemoteAudio(peerId);
    };

    const ensurePc = (peerId) => {
        if (!socket || !userId) return null;
        if (peersRef.current.has(peerId)) return peersRef.current.get(peerId);

        const pc = new RTCPeerConnection(iceServers);
        peersRef.current.set(peerId, pc);

        localStreamRef.current?.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));

        pc.onicecandidate = (e) => {
            if (!e.candidate || !channelId) return;
            socket.emit("voice-signal", {
                channelId,
                toUserId: peerId,
                fromUserId: userId,
                signal: { type: "ice-candidate", candidate: e.candidate }
            });
        };

        pc.ontrack = (e) => {
            if (e.streams[0]) addRemoteAudio(e.streams[0], peerId);
        };

        return pc;
    };

    const sendOffer = async (peerId) => {
        try {
            const pc = ensurePc(peerId);
            if (!pc || !channelId) return;
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("voice-signal", {
                channelId,
                toUserId: peerId,
                fromUserId: userId,
                signal: { type: "offer", sdp: offer.sdp }
            });
        } catch (e) {
            console.error(e);
            setError("Could not start voice connection");
        }
    };

    const handleSignal = async ({ fromUserId, signal }) => {
        if (!fromUserId || !signal || !channelId || !userId) return;
        const peerId = fromUserId;

        try {
            if (signal.type === "offer") {
                const pc = ensurePc(peerId);
                await pc.setRemoteDescription({ type: "offer", sdp: signal.sdp });
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit("voice-signal", {
                    channelId,
                    toUserId: peerId,
                    fromUserId: userId,
                    signal: { type: "answer", sdp: answer.sdp }
                });
            } else if (signal.type === "answer") {
                const pc = peersRef.current.get(peerId);
                if (pc) await pc.setRemoteDescription({ type: "answer", sdp: signal.sdp });
            } else if (signal.type === "ice-candidate" && signal.candidate) {
                const pc = peersRef.current.get(peerId);
                if (pc && pc.remoteDescription) {
                    await pc.addIceCandidate(signal.candidate);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (!socket || !channelId || !userId) return;

        const onPeers = ({ peers }) => {
            (peers || []).forEach((pid) => {
                if (pid !== userId) sendOffer(pid);
            });
        };

        const onLeft = ({ userId: uid }) => {
            if (uid) closePeer(uid);
        };

        const onSignal = (payload) => {
            if (payload.channelId === channelId) handleSignal(payload);
        };

        socket.on("voice-room-peers", onPeers);
        socket.on("voice-user-left", onLeft);
        socket.on("voice-signal", onSignal);

        return () => {
            socket.off("voice-room-peers", onPeers);
            socket.off("voice-user-left", onLeft);
            socket.off("voice-signal", onSignal);
        };
    }, [socket, channelId, userId]);

    const joinVoice = useCallback(async () => {
        if (!socket || !channelId || !userId) return;
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = stream;
            socket.emit("voice-join", { channelId, userId });
            setJoined(true);
        } catch (e) {
            console.error(e);
            setError("Microphone access denied or unavailable");
        }
    }, [socket, channelId, userId]);

    const leaveVoice = useCallback(() => {
        peersRef.current.forEach((_, pid) => closePeer(pid));
        peersRef.current.clear();
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
        }
        if (socket && channelId && userId) {
            socket.emit("voice-leave", { channelId, userId });
        }
        setJoined(false);
    }, [socket, channelId, userId]);

    return { joined, error, joinVoice, leaveVoice, remoteAudioContainerRef };
}
