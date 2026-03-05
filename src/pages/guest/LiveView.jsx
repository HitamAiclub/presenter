import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSessionStore from '../../store/useSessionStore';
import useAudioStore from '../../store/useAudioStore';
import { realTimeDb, db } from '../../services/firebase';
import { doc, getDoc, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Loader2, AlertTriangle, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPdfPageUrl } from '../../utils/cloudinary';

const LiveView = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { currentSlide, joinSession, activeAudio, volume } = useSessionStore();
    const { setVolume, playAudio, stopAll } = useAudioStore();
    const [presentation, setPresentation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [debugMsg, setDebugMsg] = useState('Initializing Live View...');
    const [hasInteracted, setHasInteracted] = useState(false);

    // Local override state for slide and audio mapping
    const [localSlide, setLocalSlide] = useState(1);
    const [mappings, setMappings] = useState({});

    const [isFull, setIsFull] = useState(false);
    const [connectionState, setConnectionState] = useState('init'); // init, joined, full, error
    const joinAttemptedRef = useRef(false);

    // Effect 1: First fetch and join attempt
    useEffect(() => {
        if (joinAttemptedRef.current) return;
        joinAttemptedRef.current = true;
        let joined = false;

        const attemptJoin = async () => {
            setDebugMsg('Fetching initial session data from Firestore...');
            try {
                const sessionRef = doc(db, 'sessions', sessionId);
                const sessionSnap = await getDoc(sessionRef);
                const data = sessionSnap.data();

                if (!sessionSnap.exists() || !data || !data.presentationId) {
                    setDebugMsg('Session not found.');
                    navigate('/join');
                    return;
                }

                const currentCount = data.guestsCount || 0;
                if (currentCount >= 1) {
                    setDebugMsg('Session is full.');
                    setIsFull(true);
                    setConnectionState('full');
                    setLoading(false);
                    return;
                }

                setDebugMsg('Joining session...');
                await updateDoc(sessionRef, { guestsCount: increment(1) });

                joined = true;
                joinSession(sessionId);
                setConnectionState('joined');
            } catch (error) {
                setDebugMsg('Error joining: ' + error.message);
                console.error("Join session error:", error);
            }
        };

        attemptJoin();

        const handleUnload = () => {
            if (joined) {
                const sessionRef = doc(db, 'sessions', sessionId);
                updateDoc(sessionRef, { guestsCount: increment(-1) }).catch(() => { });
            }
        };

        window.addEventListener('beforeunload', handleUnload);

        return () => {
            window.removeEventListener('beforeunload', handleUnload);
            if (joined) {
                const sessionRef = doc(db, 'sessions', sessionId);
                updateDoc(sessionRef, { guestsCount: increment(-1) }).catch(console.error);
                joined = false;
            }
        };
    }, [sessionId, navigate, joinSession]);

    // Effect 2: Listen for live updates once joined
    useEffect(() => {
        if (connectionState !== 'joined') return;

        setDebugMsg('Connecting live listener to Firestore...');
        const sessionRef = doc(db, 'sessions', sessionId);
        const unsubscribe = onSnapshot(sessionRef, async (snapshot) => {
            if (!snapshot.exists()) {
                navigate('/join');
                return;
            }
            const data = snapshot.data();

            if (!data) {
                navigate('/join');
                return;
            }

            setVolume(data.volume || 1.0);
            if (data.currentSlide) {
                useSessionStore.setState({ currentSlide: data.currentSlide });
            }
            if (data.activeAudio) {
                useSessionStore.setState({ activeAudio: data.activeAudio });
            }

            if (!presentation) {
                setDebugMsg('Fetching presentation details...');
                try {
                    const [docSnap, mappingSnap] = await Promise.all([
                        getDoc(doc(db, 'presentations', data.presentationId)),
                        getDoc(doc(db, 'slideAudioMapping', data.presentationId))
                    ]);

                    if (docSnap.exists()) {
                        setPresentation({ id: docSnap.id, ...docSnap.data() });
                        setDebugMsg('Presentation loaded successfully.');
                    }
                    if (mappingSnap.exists()) {
                        setMappings(mappingSnap.data().mappings || {});
                    }
                } catch (error) {
                    setDebugMsg('Error fetching presentation details.');
                    console.error("Presentation fetch error:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        }, (error) => {
            setDebugMsg('Live listener error: ' + error.message);
            console.error("onValue error:", error);
        });

        return () => {
            unsubscribe();
        };
    }, [sessionId, connectionState, presentation, navigate, setVolume]);

    // Sync global slide to local slide when admin changes it
    useEffect(() => {
        setLocalSlide(currentSlide);
    }, [currentSlide]);

    // Handle Local Slide Changes via Keyboard (Now pushes to Admin)
    const handleNextLocal = useCallback(async () => {
        const next = localSlide + 1;
        setLocalSlide(next);

        try {
            const sessionRef = doc(db, 'sessions', sessionId);
            const updates = { currentSlide: next };
            if (mappings[next]) updates.activeAudio = mappings[next];
            else updates.activeAudio = null;
            await updateDoc(sessionRef, updates);
        } catch (error) {
            console.error("Error pushing slide update from guest:", error);
        }
    }, [localSlide, sessionId, mappings]);

    const handlePrevLocal = useCallback(async () => {
        if (localSlide > 1) {
            const prev = localSlide - 1;
            setLocalSlide(prev);

            try {
                const sessionRef = doc(db, 'sessions', sessionId);
                const updates = { currentSlide: prev };
                if (mappings[prev]) updates.activeAudio = mappings[prev];
                else updates.activeAudio = null;
                await updateDoc(sessionRef, updates);
            } catch (error) {
                console.error("Error pushing slide update from guest:", error);
            }
        }
    }, [localSlide, sessionId, mappings]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!hasInteracted) return;
            if (e.key === 'ArrowRight') handleNextLocal();
            else if (e.key === 'ArrowLeft') handlePrevLocal();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hasInteracted, handleNextLocal, handlePrevLocal]);

    // Play Audio (Global or Local mapped audio)
    useEffect(() => {
        if (!hasInteracted) return;

        // If guest is looking at the same slide as admin, play admin's active audio
        // Otherwise, figure out if there's audio mapped to the slide the guest is looking at
        let audioToPlay = null;
        if (localSlide === currentSlide) {
            audioToPlay = activeAudio;
        } else {
            audioToPlay = mappings[localSlide] || null;
            if (!audioToPlay) {
                stopAll(); // Silence if no local audio mapped
            }
        }

        if (!audioToPlay) return;

        const fetchAndPlayAudio = async () => {
            try {
                const audioDoc = await getDoc(doc(db, 'audioLibrary', audioToPlay));
                if (audioDoc.exists()) {
                    const audioData = audioDoc.data();
                    // Audio store playAudio: (id, url, loop, category)
                    playAudio(
                        audioDoc.id,
                        audioData.fileUrl,
                        audioData.category === 'bgm',
                        audioData.category
                    );
                }
            } catch (error) {
                console.error("Error fetching audio to play:", error);
            }
        };

        fetchAndPlayAudio();
    }, [activeAudio, hasInteracted, playAudio, localSlide, currentSlide, mappings, stopAll]);

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', fontFamily: 'system-ui, sans-serif' }}>
            <Loader2 style={{ color: '#38bdf8', width: '3rem', height: '3rem', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 500 }}>{debugMsg}</p>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );

    return (
        <div style={{ height: '100vh', width: '100%', backgroundColor: '#0f172a', color: 'white', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '50%', left: '25%', width: '24rem', height: '24rem', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: '50%', filter: 'blur(100px)' }}></div>
                <div style={{ position: 'absolute', bottom: '25%', right: '25%', width: '24rem', height: '24rem', backgroundColor: 'rgba(14, 165, 233, 0.1)', borderRadius: '50%', filter: 'blur(100px)' }}></div>
            </div>

            {isFull ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                >
                    <div style={{ textAlign: 'center', padding: '3rem', maxWidth: '32rem', margin: '0 1rem', backgroundColor: 'rgba(30, 41, 59, 0.8)', borderRadius: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                        <div style={{ margin: '0 auto 1.5rem', width: '5rem', height: '5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '1.25rem', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.2)' }}>
                            <AlertTriangle style={{ width: '2.5rem', height: '2.5rem', color: '#ef4444' }} />
                        </div>
                        <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#f8fafc', marginBottom: '1rem' }}>Session Full</h2>
                        <p style={{ color: '#cbd5e1', marginBottom: '2rem', lineHeight: '1.5' }}>This presentation is already being viewed by the maximum number of allowed guests (1).</p>
                        <button
                            onClick={() => navigate('/join')}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', fontSize: '1.125rem', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                        >
                            <ArrowLeft size={18} /> Return to Join Page
                        </button>
                    </div>
                </motion.div>
            ) : null}

            {!hasInteracted && !isFull ? (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                >
                    <div style={{ textAlign: 'center', padding: '3rem', maxWidth: '32rem', margin: '0 1rem', backgroundColor: 'rgba(30, 41, 59, 0.8)', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                        <div style={{ margin: '0 auto 1.5rem', width: '5rem', height: '5rem', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: '1.25rem', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px -5px rgba(56, 189, 248, 0.2)' }}>
                            <Loader2 style={{ width: '2.5rem', height: '2.5rem', color: '#38bdf8', animation: 'spin 1s linear infinite' }} />
                        </div>
                        <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#f8fafc', marginBottom: '1.5rem' }}>Joining {presentation?.title}</h2>
                        <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: '1.5' }}>Please confirm to enable background audio synchronization with the live stream.</p>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setHasInteracted(true)}
                            style={{ width: '100%', padding: '1rem', fontSize: '1.25rem', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px 0 rgba(14, 165, 233, 0.39)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        >
                            CLICK TO START SESSION
                        </motion.button>
                    </div>
                </motion.div>
            ) : null}

            <div style={{ flex: 1, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
                <motion.div
                    key={localSlide}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}
                >
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top right, rgba(14, 165, 233, 0.05), transparent)', mixBlendMode: 'overlay', pointerEvents: 'none', zIndex: 20 }}></div>
                    <div style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '0.875rem', position: 'absolute', top: '1.5rem', left: '1.5rem', display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)', padding: '0.375rem 0.75rem', borderRadius: '9999px', border: '1px solid rgba(56, 189, 248, 0.2)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 20 }}>
                        <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', backgroundColor: '#38bdf8', marginRight: '0.5rem', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></span>
                        Guest Mode - Session: <span style={{ color: 'white', marginLeft: '0.5rem', fontWeight: 700 }}>{sessionId}</span>
                    </div>
                    {presentation?.fileUrl ? (
                        <>
                            {presentation.fileUrl.endsWith('.pdf') ? (
                                <img
                                    src={getPdfPageUrl(presentation.fileUrl, localSlide)}
                                    alt={`Slide ${localSlide}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', inset: 0, zIndex: 10, backgroundColor: 'white', pointerEvents: 'none' }}
                                />
                            ) : (
                                <iframe
                                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(presentation.fileUrl)}&wdSlideIndex=${localSlide}`}
                                    style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', inset: 0, zIndex: 10, backgroundColor: 'white', pointerEvents: 'none' }}
                                    title="Slide Preview"
                                />
                            )}

                            {/* Transparent click zones for mouse/touch navigation */}
                            <div
                                onClick={handlePrevLocal}
                                style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '15%', zIndex: 30, cursor: localSlide > 1 ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: '2rem', opacity: 0, transition: 'opacity 0.2s', background: 'linear-gradient(to right, rgba(0,0,0,0.5), transparent)' }}
                                onMouseOver={e => { if (localSlide > 1) e.currentTarget.style.opacity = 1 }}
                                onMouseOut={e => e.currentTarget.style.opacity = 0}
                            >
                                {localSlide > 1 && <ChevronLeft style={{ color: 'white', width: '4rem', height: '4rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }} />}
                            </div>

                            <div
                                onClick={handleNextLocal}
                                style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '15%', zIndex: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '2rem', opacity: 0, transition: 'opacity 0.2s', background: 'linear-gradient(to left, rgba(0,0,0,0.5), transparent)' }}
                                onMouseOver={e => e.currentTarget.style.opacity = 1}
                                onMouseOut={e => e.currentTarget.style.opacity = 0}
                            >
                                <ChevronRight style={{ color: 'white', width: '4rem', height: '4rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }} />
                            </div>

                            <div style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', zIndex: 20, backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '0.5rem 1rem', borderRadius: '1rem', color: '#f8fafc', fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>Slide {localSlide}</div>
                        </>
                    ) : (
                        <h1 style={{ fontSize: 'clamp(3rem, 10vw, 6rem)', fontWeight: 900, color: 'rgba(255,255,255,0.8)', letterSpacing: '-0.05em', margin: 0, textShadow: '0 4px 20px rgba(0,0,0,0.5)', zIndex: 10 }}>SLIDE {localSlide}</h1>
                    )}
                </motion.div>
            </div>
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
            `}</style>
        </div>
    );
};
export default LiveView;
