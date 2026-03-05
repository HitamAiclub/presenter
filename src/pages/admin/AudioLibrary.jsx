import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadToCloudinary, deleteFromCloudinary, deleteFolderFromCloudinary } from '../../utils/cloudinary';
import { db } from '../../services/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, where, serverTimestamp, updateDoc } from 'firebase/firestore';
import useAuthStore from '../../store/useAuthStore';
import { Music, Loader2, Play, Square, Trash2, FolderPlus, Folder, Search, Volume2, Edit3, X } from 'lucide-react';
import { Howl, Howler } from 'howler';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/Sidebar';

const AudioLibrary = () => {
    const { user } = useAuthStore();

    // State
    const [collections, setCollections] = useState([]);
    const [activeCollectionId, setActiveCollectionId] = useState(null);
    const [audioItems, setAudioItems] = useState([]);
    const [uploading, setUploading] = useState(false);

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreatingCollection, setIsCreatingCollection] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [newCollectionDesc, setNewCollectionDesc] = useState('');

    // Edit Audio State
    const [editingAudio, setEditingAudio] = useState(null);
    const [editAudioName, setEditAudioName] = useState('');
    const [editAudioDesc, setEditAudioDesc] = useState('');

    // Audio Player State
    const [playingId, setPlayingId] = useState(null);
    const [activeHowl, setActiveHowl] = useState(null);
    const [volume, setVolume] = useState(0.8);

    // Initial Load
    useEffect(() => {
        loadCollections();
        return () => Howler.unload();
    }, []);

    // Load audio when active collection changes
    useEffect(() => {
        if (activeCollectionId) {
            loadAudioFiles(activeCollectionId);
        } else {
            setAudioItems([]);
        }
    }, [activeCollectionId]);

    const loadCollections = async () => {
        const q = query(collection(db, 'audioCollections'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const cols = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCollections(cols);
        if (cols.length > 0 && !activeCollectionId) {
            setActiveCollectionId(cols[0].id);
        }
    };

    const loadAudioFiles = async (colId) => {
        const q = query(collection(db, 'audioLibrary'), where('collectionId', '==', colId));
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort in memory since we are filtering by collectionId
        items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAudioItems(items);
    };

    const handleCreateCollection = async (e) => {
        e.preventDefault();
        if (!newCollectionName.trim()) return;

        try {
            const docRef = await addDoc(collection(db, 'audioCollections'), {
                name: newCollectionName.trim(),
                description: newCollectionDesc.trim(),
                createdBy: user?.uid,
                createdAt: new Date().toISOString()
            });

            setNewCollectionName('');
            setNewCollectionDesc('');
            setIsCreatingCollection(false);
            await loadCollections();
            setActiveCollectionId(docRef.id);
        } catch (error) {
            console.error('Failed to create collection', error);
        }
    };

    const handleSaveAudioEdit = async (e) => {
        e.preventDefault();
        if (!editingAudio) return;
        try {
            await updateDoc(doc(db, 'audioLibrary', editingAudio.id), {
                name: editAudioName.trim() || editingAudio.name,
                description: editAudioDesc.trim()
            });
            setEditingAudio(null);
            await loadAudioFiles(activeCollectionId);
        } catch (err) {
            console.error("Failed to update audio:", err);
            alert("Failed to update audio info.");
        }
    };

    const onDrop = useCallback(async (files) => {
        if (!files || files.length === 0 || !activeCollectionId) return;

        const activeCol = collections.find(c => c.id === activeCollectionId);
        if (!activeCol) return;

        setUploading(true);
        try {
            // Upload sequentially or in parallel. Let's do parallel for speed.
            const uploadPromises = files.map(async (file) => {
                const folderPath = `hitam_ai/presenter/audio/${activeCol.name}`;
                const result = await uploadToCloudinary(file, 'video', folderPath);

                return addDoc(collection(db, 'audioLibrary'), {
                    name: file.name,
                    fileName: file.name,
                    fileUrl: result.url,
                    publicId: result.publicId, // Store publicId for deletion
                    category: 'effect',
                    description: '',
                    duration: result.duration || 0,
                    collectionId: activeCollectionId,
                    createdBy: user?.uid,
                    createdAt: new Date().toISOString()
                });
            });

            await Promise.all(uploadPromises);
            await loadAudioFiles(activeCollectionId);
        } catch (e) {
            console.error('Audio upload failed', e);
            alert('Some uploads failed. Please check the logs.');
        } finally {
            setUploading(false);
        }
    }, [activeCollectionId, collections, user]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'audio/*': [] },
        disabled: !activeCollectionId
    });

    const togglePlay = (item) => {
        if (playingId === item.id) {
            activeHowl?.stop();
            setPlayingId(null);
        } else {
            activeHowl?.unload();
            const h = new Howl({
                src: [item.fileUrl],
                volume: volume,
                onend: () => setPlayingId(null)
            });
            h.play();
            setActiveHowl(h);
            setPlayingId(item.id);
        }
    };

    const handleVolumeChange = (e) => {
        const vol = parseFloat(e.target.value);
        setVolume(vol);
        if (activeHowl) {
            activeHowl.volume(vol);
        }
    };

    const handleDeleteAudio = async (e, item) => {
        e.stopPropagation();
        if (window.confirm(`Delete "${item.name}" forever?`)) {
            if (playingId === item.id) activeHowl?.stop();

            try {
                // Remove from Cloudinary if publicId exists
                if (item.publicId) {
                    await deleteFromCloudinary(item.publicId, 'video');
                }

                // Remove from Firestore
                await deleteDoc(doc(db, 'audioLibrary', item.id));
                await loadAudioFiles(activeCollectionId);
            } catch (error) {
                console.error("Failed to delete audio fully:", error);
                alert("Failed to delete the file securely. See console.");
            }
        }
    };

    const handleDeleteCollection = async (e, col) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete the "${col.name}" collection AND all its audio files? This cannot be undone.`)) {
            try {
                // Fetch all audio files for this collection
                const q = query(collection(db, 'audioLibrary'), where('collectionId', '==', col.id));
                const snapshot = await getDocs(q);

                // Delete each file from Cloudinary (video type handles audio) and then from Firestore
                const deletePromises = snapshot.docs.map(async (docSnap) => {
                    const itemData = docSnap.data();
                    if (itemData.publicId) {
                        try {
                            await deleteFromCloudinary(itemData.publicId, 'video');
                        } catch (err) {
                            console.warn(`Failed to delete ${itemData.publicId} from Cloudinary:`, err);
                        }
                    }
                    return deleteDoc(doc(db, 'audioLibrary', docSnap.id));
                });

                await Promise.all(deletePromises);

                // Delete the collection from Firestore
                await deleteDoc(doc(db, 'audioCollections', col.id));

                if (activeCollectionId === col.id) {
                    setActiveCollectionId(null);
                    setAudioItems([]);
                    activeHowl?.stop();
                    setPlayingId(null);
                }

                await loadCollections();
            } catch (error) {
                console.error("Failed to delete collection:", error);
                alert("Failed to delete the collection securely.");
            }
        }
    };

    const searchedItems = useMemo(() => {
        if (!searchQuery) return audioItems;
        const q = searchQuery.toLowerCase();
        return audioItems.filter(item => item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q));
    }, [audioItems, searchQuery]);

    const activeCollection = collections.find(c => c.id === activeCollectionId);

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#0f172a', fontFamily: 'system-ui, sans-serif' }}>
            <Sidebar />

            {/* Split Pane Container */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* Left Pane - Collections List */}
                <div style={{ width: '280px', backgroundColor: 'rgba(15, 23, 42, 0.4)', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 1rem 0' }}>Collections</h2>
                        <button
                            onClick={() => setIsCreatingCollection(true)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.2)'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.1)'}
                        >
                            <FolderPlus size={18} /> New Collection
                        </button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                        {collections.map(col => (
                            <div
                                key={col.id}
                                onClick={() => setActiveCollectionId(col.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    backgroundColor: activeCollectionId === col.id ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                                    border: activeCollectionId === col.id ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
                                    color: activeCollectionId === col.id ? '#f8fafc' : '#cbd5e1',
                                    transition: 'all 0.2s',
                                    marginBottom: '0.5rem'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                                    <Folder size={18} color={activeCollectionId === col.id ? '#38bdf8' : '#64748b'} />
                                    <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{col.name}</span>
                                </div>
                                <button
                                    onClick={(e) => handleDeleteCollection(e, col)}
                                    style={{ padding: '0.25rem', backgroundColor: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                                    onMouseOut={e => e.currentTarget.style.color = '#64748b'}
                                    title="Delete collection"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {collections.length === 0 && (
                            <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem', marginTop: '2rem' }}>No collections yet.</p>
                        )}
                    </div>
                </div>

                {/* Right Pane - Audio List & Dropzone */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'transparent', position: 'relative' }}>

                    {/* Header */}
                    <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(16px)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>{activeCollection ? activeCollection.name : 'Select a Collection'}</h1>
                                <p style={{ color: '#94a3b8', marginTop: '0.25rem' }}>{activeCollection ? activeCollection.description || 'No description provided.' : 'Create or select a collection from the sidebar.'}</p>
                            </div>

                            {/* Toolbar (Search & Volume) */}
                            {activeCollection && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                    <div style={{ position: 'relative' }}>
                                        <Search size={18} color="#64748b" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                                        <input
                                            type="text"
                                            placeholder="Search collection..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', padding: '0.5rem 1rem 0.5rem 2.5rem', borderRadius: '9999px', outline: 'none', transition: 'border 0.2s', width: '200px' }}
                                            onFocus={e => e.target.style.borderColor = '#38bdf8'}
                                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(15, 23, 42, 0.4)', padding: '0.5rem 1rem', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <Volume2 size={18} color="#94a3b8" />
                                        <input type="range" min="0" max="1" step="0.05" value={volume} onChange={handleVolumeChange} style={{ width: '80px', accentColor: '#38bdf8' }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto' }}>
                        {activeCollection ? (
                            <>
                                {/* Dropzone */}
                                <div
                                    {...getRootProps()}
                                    style={{
                                        border: `2px dashed ${isDragActive ? '#38bdf8' : 'rgba(255,255,255,0.2)'}`,
                                        backgroundColor: isDragActive ? 'rgba(56, 189, 248, 0.05)' : 'rgba(30, 41, 59, 0.4)',
                                        borderRadius: '1rem',
                                        padding: '2.5rem',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        marginBottom: '2rem'
                                    }}
                                >
                                    <input {...getInputProps()} />
                                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '4rem', height: '4rem', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: '1rem' }}>
                                        {uploading ? <Loader2 size={24} color="#38bdf8" style={{ animation: 'spin 1s linear infinite' }} /> : <Music size={24} color="#94a3b8" />}
                                    </div>
                                    {uploading ? (
                                        <h3 style={{ color: '#38bdf8', margin: 0, fontWeight: 600 }}>Uploading to Cloudinary...</h3>
                                    ) : (
                                        <div>
                                            <h3 style={{ color: '#f8fafc', margin: '0 0 0.5rem 0', fontWeight: 600 }}>Upload Audio to Collection</h3>
                                            <p style={{ color: '#64748b', margin: 0, fontSize: '0.875rem' }}>Drag & drop MP3, WAV, M4A here.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Audio Grid/List */}
                                {searchedItems.length > 0 ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                        {searchedItems.map((item, i) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                style={{
                                                    backgroundColor: 'rgba(30, 41, 59, 0.6)',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    borderRadius: '1rem',
                                                    padding: '1.25rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '1rem',
                                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                                }}
                                            >
                                                <button
                                                    onClick={() => togglePlay(item)}
                                                    style={{ width: '3rem', height: '3rem', flexShrink: 0, borderRadius: '50%', backgroundColor: playingId === item.id ? '#38bdf8' : 'rgba(255,255,255,0.05)', border: 'none', color: playingId === item.id ? '#0f172a' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                                                >
                                                    {playingId === item.id ? <Square size={16} /> : <Play size={16} style={{ marginLeft: '0.125rem' }} />}
                                                </button>
                                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                                    <h4 style={{ color: '#f8fafc', margin: '0 0 0.25rem 0', fontWeight: 600, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.name}>{item.name}</h4>
                                                    {item.description && (
                                                        <p style={{ color: '#94a3b8', margin: '0 0 0.5rem 0', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.description}>{item.description}</p>
                                                    )}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
                                                        <span>{item.duration ? Math.round(item.duration) + 's' : 'Unknown length'}</span>
                                                        <span>•</span>
                                                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingAudio(item);
                                                            setEditAudioName(item.name || '');
                                                            setEditAudioDesc(item.description || '');
                                                        }}
                                                        style={{ padding: '0.5rem', backgroundColor: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', borderRadius: '0.5rem', transition: 'color 0.2s, background 0.2s' }}
                                                        onMouseOver={e => { e.currentTarget.style.color = '#38bdf8'; e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.1)'; }}
                                                        onMouseOut={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                        title="Edit details"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteAudio(e, item)}
                                                        style={{ padding: '0.5rem', backgroundColor: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', borderRadius: '0.5rem', transition: 'color 0.2s, background 0.2s' }}
                                                        onMouseOver={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
                                                        onMouseOut={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                        title="Delete permanently"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'rgba(30, 41, 59, 0.3)', borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                        <Music size={32} color="#475569" style={{ margin: '0 auto 1rem auto' }} />
                                        <p style={{ color: '#94a3b8', margin: 0 }}>This collection is empty.</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#64748b' }}>
                                <Folder size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                                <h2>No Collection Selected</h2>
                                <p>Select a collection from the sidebar or define a new one.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Collection Creation Modal */}
            <AnimatePresence>
                {isCreatingCollection && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            style={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', padding: '2rem', width: '100%', maxWidth: '28rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.5rem', fontWeight: 700 }}>New Audio Collection</h2>
                                <button onClick={() => setIsCreatingCollection(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.25rem' }}><X size={20} /></button>
                            </div>

                            <form onSubmit={handleCreateCollection} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.875rem', fontWeight: 500 }}>Collection Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newCollectionName}
                                        onChange={e => setNewCollectionName(e.target.value)}
                                        placeholder="e.g. Background Music"
                                        style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.875rem', fontWeight: 500 }}>Description (Optional)</label>
                                    <textarea
                                        value={newCollectionDesc}
                                        onChange={e => setNewCollectionDesc(e.target.value)}
                                        placeholder="Soft background music for AI seminars..."
                                        rows={3}
                                        style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', outline: 'none', resize: 'none' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="button" onClick={() => setIsCreatingCollection(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: 'transparent', color: '#94a3b8', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#38bdf8', color: '#0f172a', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(56, 189, 248, 0.3)' }}>Create Collection</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}

                {editingAudio && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            style={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', padding: '2rem', width: '100%', maxWidth: '28rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.5rem', fontWeight: 700 }}>Edit Audio Details</h2>
                                <button onClick={() => setEditingAudio(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.25rem' }}><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSaveAudioEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.875rem', fontWeight: 500 }}>Audio Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={editAudioName}
                                        onChange={e => setEditAudioName(e.target.value)}
                                        placeholder="e.g. Intro Theme"
                                        style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.875rem', fontWeight: 500 }}>Description (Optional)</label>
                                    <textarea
                                        value={editAudioDesc}
                                        onChange={e => setEditAudioDesc(e.target.value)}
                                        placeholder="Add a description for this audio track..."
                                        rows={3}
                                        style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', outline: 'none', resize: 'none' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="button" onClick={() => setEditingAudio(null)} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: 'transparent', color: '#94a3b8', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#38bdf8', color: '#0f172a', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(56, 189, 248, 0.3)' }}>Save Details</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div >
    );
};

export default AudioLibrary;

