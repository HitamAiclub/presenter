import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../services/firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { Save, Music, PlayCircle } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { getPdfPageUrl } from '../../utils/cloudinary';

const SlideTimelineEditor = () => {
    const { presentationId } = useParams();
    const navigate = useNavigate();
    const [presentation, setPresentation] = useState(null);
    const [collections, setCollections] = useState([]);
    const [audioFiles, setAudioFiles] = useState([]);
    const [mappings, setMappings] = useState({}); // { slideNumber: audioId }
    const [totalSlides, setTotalSlides] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const pDoc = await getDoc(doc(db, 'presentations', presentationId));
                if (pDoc.exists()) {
                    const pData = pDoc.data();
                    setPresentation({ id: pDoc.id, ...pData });
                    setTotalSlides(pData.totalSlides || 1);
                }

                const colSnap = await getDocs(collection(db, 'audioCollections'));
                setCollections(colSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                const aSnap = await getDocs(collection(db, 'audioLibrary'));
                setAudioFiles(aSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                const mDoc = await getDoc(doc(db, 'slideAudioMapping', presentationId));
                if (mDoc.exists()) {
                    setMappings(mDoc.data().mappings || {});
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [presentationId]);

    const handleSave = async () => {
        try {
            await setDoc(doc(db, 'slideAudioMapping', presentationId), { mappings });
            await updateDoc(doc(db, 'presentations', presentationId), { totalSlides });
            alert('Timeline saved securely!');
        } catch (e) {
            console.error(e);
            alert('Failed to save mappings.');
        }
    };

    const handleMappingChange = (slideNumber, audioId) => {
        setMappings(prev => ({
            ...prev,
            [slideNumber]: audioId === 'none' ? null : audioId
        }));
    };

    if (loading) return <div style={{ padding: '2rem', paddingBottom: 0, textAlign: 'center', color: '#6b7280' }}>Loading Editor...</div>;
    if (!presentation) return <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444', fontWeight: 'bold' }}>Presentation not found.</div>;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a', fontFamily: 'system-ui, sans-serif' }}>
            <Sidebar />
            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                <div style={{ maxWidth: '64rem', margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                        <div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.025em', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Timeline Editor: {presentation.title}</h2>
                            <p style={{ color: '#cbd5e1', marginTop: '0.5rem', margin: 0, fontWeight: 500 }}>Attach background music and sound effects to specific slides.</p>
                        </div>
                        <button
                            onClick={handleSave}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: '#4f46e5',
                                color: 'white',
                                padding: '0.625rem 1.25rem',
                                borderRadius: '0.5rem',
                                fontWeight: 500,
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                transition: 'background-color 0.2s',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
                        >
                            <Save size={20} style={{ marginRight: '0.5rem' }} />
                            Save Timeline
                        </button>
                    </div>

                    <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.05)', color: '#f8fafc', borderRadius: '1.5rem', boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.3)', flex: 1, overflowY: 'auto', width: '100%', padding: '1rem 0' }}>
                        {/* We simplify for this MVP and just iterate 1 to N slides. N can be parsed from PDF or user provided later */}
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {Array.from({ length: totalSlides }).map((_, i) => {
                                const slideNumber = i + 1;
                                return (
                                    <li key={slideNumber} style={{
                                        padding: '1.25rem 2rem',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        transition: 'background-color 0.2s'
                                    }}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 0 }}>
                                            <div style={{ width: '10rem', height: '5.625rem', backgroundColor: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '0.5rem', marginRight: '1.25rem', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                                                {presentation?.fileUrl ? (
                                                    presentation.fileUrl.endsWith('.pdf') ? (
                                                        <iframe
                                                            src={`https://docs.google.com/gview?url=${encodeURIComponent(presentation.fileUrl)}&embedded=true`}
                                                            style={{ width: '400%', height: '400%', transform: 'scale(0.25)', transformOrigin: 'top left', border: 'none', position: 'absolute', top: 0, left: 0, pointerEvents: 'none', backgroundColor: 'white' }}
                                                            title={`Slide ${slideNumber} Preview`}
                                                        />
                                                    ) : (
                                                        <iframe
                                                            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(presentation.fileUrl)}&wdSlideIndex=${slideNumber}`}
                                                            style={{ width: '400%', height: '400%', transform: 'scale(0.25)', transformOrigin: 'top left', border: 'none', position: 'absolute', top: 0, left: 0, pointerEvents: 'none', backgroundColor: 'white' }}
                                                            title={`Slide ${slideNumber} Preview`}
                                                        />
                                                    )
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#818cf8', fontSize: '1.5rem' }}>
                                                        {slideNumber}
                                                    </div>
                                                )}
                                                <div style={{ position: 'absolute', bottom: '0.25rem', right: '0.25rem', backgroundColor: 'rgba(15, 23, 42, 0.8)', color: '#f8fafc', padding: '0.125rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 700, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                    {slideNumber}
                                                </div>
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 700, color: '#f8fafc', margin: 0, fontSize: '1.125rem' }}>Content Slide {slideNumber}</p>
                                                <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Select audio to play when this slide activates.</p>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', minWidth: '220px', width: '33.333333%' }}>
                                            <Music size={20} color="#60a5fa" style={{ marginRight: '1rem' }} />
                                            <select
                                                style={{
                                                    width: '100%',
                                                    backgroundColor: 'rgba(15, 23, 42, 0.5)',
                                                    color: '#f8fafc',
                                                    borderRadius: '0.75rem',
                                                    padding: '0.875rem 1rem',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 600,
                                                    outline: 'none',
                                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                                    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)'
                                                }}
                                                onFocus={(e) => { e.currentTarget.style.borderColor = '#818cf8' }}
                                                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
                                                value={mappings[slideNumber] || 'none'}
                                                onChange={(e) => handleMappingChange(slideNumber, e.target.value)}
                                            >
                                                <option value="none">No Audio Action</option>
                                                {collections.map(col => {
                                                    const filesInCol = audioFiles.filter(a => a.collectionId === col.id);
                                                    if (filesInCol.length === 0) return null;
                                                    return (
                                                        <optgroup key={col.id} label={col.name}>
                                                            {filesInCol.map(audio => (
                                                                <option key={audio.id} value={audio.id}>
                                                                    {audio.name} ({Math.round(audio.duration || 0)}s)
                                                                </option>
                                                            ))}
                                                        </optgroup>
                                                    );
                                                })}
                                                {/* Uncategorized items */}
                                                {audioFiles.filter(a => (!a.collectionId || collections.findIndex(c => c.id === a.collectionId) === -1)).length > 0 && (
                                                    <optgroup label="Uncategorized">
                                                        {audioFiles.filter(a => (!a.collectionId || collections.findIndex(c => c.id === a.collectionId) === -1)).map(audio => (
                                                            <option key={audio.id} value={audio.id}>
                                                                {audio.name} ({Math.round(audio.duration || 0)}s)
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                )}
                                            </select>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <button
                                onClick={() => setTotalSlides(prev => Math.max(1, prev - 1))}
                                style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                            >
                                - Remove Slide
                            </button>
                            <button
                                onClick={() => setTotalSlides(prev => prev + 1)}
                                style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.2)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.2)'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.1)'}
                            >
                                + Add Slide
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SlideTimelineEditor;
