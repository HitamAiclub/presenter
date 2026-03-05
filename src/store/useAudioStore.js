import { create } from 'zustand';
import { Howl, Howler } from 'howler';

const useAudioStore = create((set, get) => ({
    activeSounds: {},
    backgroundMusic: null,
    globalVolume: 1.0,

    playAudio: (id, url, loop = false, category = 'effect') => {
        const { activeSounds, globalVolume, backgroundMusic } = get();

        // If it's BGM, we probably want to stop existing BGM
        if (category === 'bgm') {
            if (backgroundMusic) {
                backgroundMusic.stop();
            }
            const bgmHowl = new Howl({
                src: [url],
                loop: true,
                volume: globalVolume,
            });
            bgmHowl.play();
            set({ backgroundMusic: bgmHowl });
            return;
        }

        const sound = new Howl({
            src: [url],
            loop,
            volume: globalVolume,
            onend: () => {
                const currentSounds = { ...get().activeSounds };
                delete currentSounds[id];
                set({ activeSounds: currentSounds });
            }
        });

        sound.play();
        set({ activeSounds: { ...activeSounds, [id]: sound } });
    },

    stopAudio: (id) => {
        const { activeSounds } = get();
        const sound = activeSounds[id];
        if (sound) {
            sound.stop();
            const updatedSounds = { ...activeSounds };
            delete updatedSounds[id];
            set({ activeSounds: updatedSounds });
        }
    },

    stopAll: () => {
        Howler.unload(); // Stops all Howler instances and unloads cache
        set({ activeSounds: {}, backgroundMusic: null });
    },

    setVolume: (volume) => {
        Howler.volume(volume);
        set({ globalVolume: volume });
    }
}));

export default useAudioStore;
