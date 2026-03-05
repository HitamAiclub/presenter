import { create } from 'zustand';
import { db } from '../services/firebase';
import { doc, setDoc, onSnapshot, updateDoc, deleteDoc, increment } from 'firebase/firestore';

const useSessionStore = create((set, get) => ({
    currentSessionId: null,
    presentationId: null,
    currentSlide: 1,
    activeAudio: null,
    backgroundMusic: null,
    volume: 1.0,
    isPlaying: false,
    guestsCount: 0,

    startSession: async (sessionId, presentationId) => {
        try {
            const sessionRef = doc(db, 'sessions', sessionId);
            const initialData = {
                presentationId,
                currentSlide: 1,
                activeAudio: null,
                backgroundMusic: null,
                volume: 1.0,
                isPlaying: false,
                guestsCount: 0
            };
            await setDoc(sessionRef, initialData);
            set({ currentSessionId: sessionId, ...initialData });
        } catch (error) {
            console.error("Failed to start session:", error);
            throw error;
        }
    },

    joinSession: (sessionId) => {
        const sessionRef = doc(db, 'sessions', sessionId);
        onSnapshot(sessionRef, (snapshot) => {
            if (snapshot.exists()) {
                set({ ...snapshot.data(), currentSessionId: sessionId });
            } else {
                set({ currentSessionId: null });
                console.error('Session not found');
            }
        });
    },

    updateSlide: async (slideNumber) => {
        const { currentSessionId } = get();
        if (currentSessionId) {
            const sessionRef = doc(db, 'sessions', currentSessionId);
            await updateDoc(sessionRef, { currentSlide: slideNumber, activeAudio: null }); // Stop previous slide audio
        }
    },

    updateAudio: async (audioId) => {
        const { currentSessionId } = get();
        if (currentSessionId) {
            const sessionRef = doc(db, 'sessions', currentSessionId);
            await updateDoc(sessionRef, { activeAudio: audioId });
        }
    },

    updateVolume: async (volumeLevel) => {
        const { currentSessionId } = get();
        if (currentSessionId) {
            const sessionRef = doc(db, 'sessions', currentSessionId);
            await updateDoc(sessionRef, { volume: volumeLevel });
        }
    },

    endSession: async () => {
        const { currentSessionId } = get();
        if (currentSessionId) {
            const sessionRef = doc(db, 'sessions', currentSessionId);
            await deleteDoc(sessionRef);
            set({ currentSessionId: null, presentationId: null, currentSlide: 1, activeAudio: null });
        }
    }
}));

export default useSessionStore;
