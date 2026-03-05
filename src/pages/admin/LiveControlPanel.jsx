import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import useSessionStore from '../../store/useSessionStore';
import useAudioStore from '../../store/useAudioStore';
import { db } from '../../services/firebase';
import { doc, getDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { Play, Pause, Square, Volume2, Users, ChevronLeft, ChevronRight, Music, Folder } from 'lucide-react';
import { getPdfPageUrl } from '../../utils/cloudinary';

const LiveControlPanel = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { currentSlide, updateSlide, updateAudio, updateVolume, endSession, guestsCount, activeAudio } = useSessionStore();
    const { playAudio, stopAll, setVolume, globalVolume } = useAudioStore();
    const location = useLocation();
    const [presentation, setPresentation] = useState(location.state?.presentation || null);
    const [loading, setLoading] = useState(presentation === null);
    const [mappings, setMappings] = useState({});

    // Ad-hoc Audio State
    const [audioLibrary, setAudioLibrary] = useState([]);
    const [audioCollections, setAudioCollections] = useState([]);
    const [selectedCollectionId, setSelectedCollectionId] = useState('');

    useEffect(() => {
        const sessionRef = doc(db, 'sessions', sessionId);
        const unsubscribe = onSnapshot(sessionRef, async (snapshot) => {
            if (!snapshot.exists()) {
                navigate('/admin/sessions');
                return;
            }
            const data = snapshot.data();
            if (data.presentationId) {
                try {
                    // Try parallelizing missing data
                    const fetches = [];
                    let pDocSnap = null;
                    let mDocSnap = null;

                    if (!presentation) {
                        fetches.push(
                            getDoc(doc(db, 'presentations', data.presentationId))
                                .then(snap => { pDocSnap = snap; })
                        );
                    }
                    if (Object.keys(mappings).length === 0) {
                        fetches.push(
                            getDoc(doc(db, 'slideAudioMapping', data.presentationId))
                                .then(snap => { mDocSnap = snap; })
                        );
                    }

                    if (fetches.length > 0) {
                        await Promise.all(fetches);
                    }

                    if (pDocSnap?.exists()) {
                        setPresentation({ id: pDocSnap.id, ...pDocSnap.data() });
                    }
                    if (mDocSnap?.exists()) {
                        setMappings(mDocSnap.data().mappings || {});
                    }
                } catch (error) {
                    console.error("Error fetching live presentation details:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        });

        // Fetch Audio Library for Ad-Hoc Playback
        const fetchAudioData = async () => {
            try {
                const colsSnap = await getDocs(collection(db, 'audioCollections'));
                const cols = colsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAudioCollections(cols);
                if (cols.length > 0) setSelectedCollectionId(cols[0].id);

                const audioSnap = await getDocs(collection(db, 'audioLibrary'));
                setAudioLibrary(audioSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Error fetching audio library:", error);
            }
        };
        fetchAudioData();

        return () => unsubscribe();
    }, [sessionId, presentation, navigate, mappings]);

    useEffect(() => {
        if (!activeAudio) return;

        const fetchAndPlayAudio = async () => {
            try {
                const audioDoc = await getDoc(doc(db, 'audioLibrary', activeAudio));
                if (audioDoc.exists()) {
                    const audioData = audioDoc.data();
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
    }, [activeAudio, playAudio]);

    const handleNext = useCallback(() => {
        const next = currentSlide + 1;
        updateSlide(next);
        if (mappings[next]) updateAudio(mappings[next]);
        else updateAudio(null);
    }, [currentSlide, updateSlide, mappings, updateAudio]);

    const handlePrev = useCallback(() => {
        if (currentSlide > 1) {
            const prev = currentSlide - 1;
            updateSlide(prev);
            if (mappings[prev]) updateAudio(mappings[prev]);
            else updateAudio(null);
        }
    }, [currentSlide, updateSlide, mappings, updateAudio]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') {
                handleNext();
            } else if (e.key === 'ArrowLeft') {
                handlePrev();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleNext, handlePrev]);

    const handleEnd = () => {
        endSession();
        stopAll();
        navigate('/admin');
    };

    const handlePlayAdHocAudio = (audioId) => {
        updateAudio(audioId);
    };

    const handleStopAudio = () => {
        updateAudio(null);
        stopAll();
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui', backgroundColor: '#0f172a', color: '#f8fafc', height: '100vh' }}>Loading Live Controls...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif', backgroundColor: '#0f172a' }}>
            <header style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
                <div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>LIVE: {presentation?.title}</h1>
                    <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Session Code: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#4ade80' }}>{sessionId}</span></p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', color: '#cbd5e1' }}>
                        <Users style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
                        <span style={{ fontWeight: 500 }}>{guestsCount} Guests connected</span>
                    </div>
                    <button
                        onClick={handleEnd}
                        style={{ padding: '0.5rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s' }}
                        onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                    >
                        End Session
                    </button>
                </div>
            </header>

            <div style={{ flex: 1, padding: '2rem', display: 'flex', gap: '2rem', overflowY: 'auto' }}>
                <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{
                        backgroundColor: 'rgba(30, 41, 59, 0.7)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        padding: '1.5rem',
                        aspectRatio: '16/9',
                        borderRadius: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 10px 30px -5px rgba(0,0,0,0.3)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top right, rgba(14, 165, 233, 0.1), transparent)', mixBlendMode: 'overlay', pointerEvents: 'none', zIndex: 20 }}></div>

                        {presentation?.fileUrl ? (
                            <>
                                {presentation.fileUrl.endsWith('.pdf') ? (
                                    <img
                                        src={getPdfPageUrl(presentation.fileUrl, currentSlide)}
                                        alt={`Slide ${currentSlide}`}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', inset: 0, zIndex: 10, borderRadius: '1.5rem', backgroundColor: 'white' }}
                                    />
                                ) : (
                                    <iframe
                                        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(presentation.fileUrl)}&wdSlideIndex=${currentSlide}`}
                                        style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', inset: 0, zIndex: 10, borderRadius: '1.5rem', backgroundColor: 'white' }}
                                        title="Slide Preview"
                                    />
                                )}
                                <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', zIndex: 20, backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '0.25rem 0.75rem', borderRadius: '1rem', color: '#f8fafc', fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>Slide {currentSlide}</div>
                            </>
                        ) : (
                            <>
                                <h2 style={{ fontSize: '3rem', fontWeight: 800, color: '#f8fafc', margin: 0, zIndex: 10 }}>Slide {currentSlide}</h2>
                                <p style={{ color: '#94a3b8', marginTop: '1rem', zIndex: 10 }}>(No Presentation File)</p>
                            </>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
                        <button
                            onClick={handlePrev}
                            style={{ padding: '1rem', borderRadius: '50%', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', cursor: currentSlide > 1 ? 'pointer' : 'default', opacity: currentSlide > 1 ? 1 : 0.5, transition: 'all 0.2s' }}
                            onMouseOver={(e) => { if (currentSlide > 1) e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.8)' }}
                            onMouseOut={(e) => { if (currentSlide > 1) e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.6)' }}
                        >
                            <ChevronLeft style={{ width: '2rem', height: '2rem' }} />
                        </button>
                        <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', width: '6rem', textAlign: 'center' }}>{currentSlide}</span>
                        <button
                            onClick={handleNext}
                            style={{ padding: '1rem', borderRadius: '50%', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.8)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.6)'}
                        >
                            <ChevronRight style={{ width: '2rem', height: '2rem' }} />
                        </button>
                    </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{
                        backgroundColor: 'rgba(30, 41, 59, 0.7)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        padding: '1.5rem',
                        borderRadius: '1.5rem',
                        boxShadow: '0 10px 30px -5px rgba(0,0,0,0.3)'
                    }}>
                        <h3 style={{ fontWeight: 700, color: '#f8fafc', margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>Audio Controls</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <Volume2 style={{ width: '1.5rem', height: '1.5rem', color: '#94a3b8' }} />
                                <input
                                    type="range"
                                    min="0" max="1" step="0.05"
                                    value={globalVolume}
                                    onChange={(e) => {
                                        setVolume(parseFloat(e.target.value));
                                        updateVolume(parseFloat(e.target.value));
                                    }}
                                    style={{ flex: 1, accentColor: '#38bdf8' }}
                                />
                            </div>

                            <hr style={{ borderColor: 'rgba(255,255,255,0.05)', margin: '1rem 0' }} />
                            <h4 style={{ color: '#cbd5e1', fontSize: '1rem', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Music size={18} /> Play Custom Audio
                            </h4>

                            {activeAudio && (
                                <button
                                    onClick={handleStopAudio}
                                    style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}
                                >
                                    <Square size={16} fill="currentColor" /> Stop Current Audio
                                </button>
                            )}

                            {audioCollections.length > 0 && (
                                <select
                                    value={selectedCollectionId}
                                    onChange={e => setSelectedCollectionId(e.target.value)}
                                    style={{ padding: '0.5rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', marginBottom: '0.5rem', outline: 'none' }}
                                >
                                    {audioCollections.map(col => (
                                        <option key={col.id} value={col.id}>{col.name}</option>
                                    ))}
                                </select>
                            )}

                            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {audioLibrary.filter(a => a.collectionId === selectedCollectionId).map(audio => (
                                    <button
                                        key={audio.id}
                                        onClick={() => handlePlayAdHocAudio(audio.id)}
                                        style={{
                                            padding: '0.75rem',
                                            backgroundColor: activeAudio === audio.id ? 'rgba(56, 189, 248, 0.1)' : 'rgba(15, 23, 42, 0.4)',
                                            color: activeAudio === audio.id ? '#38bdf8' : '#f8fafc',
                                            border: `1px solid ${activeAudio === audio.id ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                                            borderRadius: '0.5rem',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <Play size={16} />
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{audio.name}</span>
                                    </button>
                                ))}
                                {audioLibrary.filter(a => a.collectionId === selectedCollectionId).length === 0 && (
                                    <p style={{ color: '#64748b', fontSize: '0.875rem', textAlign: 'center', marginTop: '1rem' }}>No audio in this collection.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default LiveControlPanel;
