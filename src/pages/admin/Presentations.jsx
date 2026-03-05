import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { db } from '../../services/firebase';
import { collection, addDoc, getDocs, orderBy, query } from 'firebase/firestore';
import useAuthStore from '../../store/useAuthStore';
import { FileUp, File as FileIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Sidebar from '../../components/Sidebar';

const Presentations = () => {
    const [uploading, setUploading] = useState(false);
    const [presentations, setPresentations] = useState([]);
    const { user } = useAuthStore();

    const fetchPresentations = async () => {
        const q = query(collection(db, 'presentations'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPresentations(list);
    };

    useEffect(() => {
        fetchPresentations();
    }, []);

    const onDrop = useCallback(async (acceptedFiles) => {
        if (!acceptedFiles.length) return;
        const file = acceptedFiles[0];

        setUploading(true);
        try {
            const result = await uploadToCloudinary(file, 'raw');

            await addDoc(collection(db, 'presentations'), {
                title: file.name,
                fileUrl: result.url,
                fileType: result.format || file.name.split('.').pop(),
                createdBy: user.uid,
                createdAt: new Date().toISOString(),
                totalSlides: 1 // Placeholder, ideally extracted from PDF/PPT headers
            });

            fetchPresentations();
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed: ' + error.message);
        } finally {
            setUploading(false);
        }
    }, [user]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.ms-powerpoint': ['.ppt'],
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
        },
        multiple: false
    });

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a', fontFamily: 'system-ui, sans-serif' }}>
            <Sidebar />
            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ maxWidth: '64rem', margin: '0 auto' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                        <div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.025em', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Presentations</h2>
                            <p style={{ color: '#cbd5e1', marginTop: '0.25rem' }}>Upload and manage your slide decks for live sessions.</p>
                        </div>
                    </div>

                    <div
                        {...getRootProps()}
                        style={{
                            border: `2px dashed ${isDragActive ? '#60a5fa' : 'rgba(255,255,255,0.3)'}`,
                            backgroundColor: isDragActive ? 'rgba(96,165,250,0.1)' : 'rgba(255,255,255,0.05)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            borderRadius: '1.5rem',
                            padding: '3rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            marginBottom: '2rem',
                            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)'
                        }}
                    >
                        <input {...getInputProps()} />
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            style={{
                                margin: '0 auto 1.5rem',
                                width: '5rem',
                                height: '5rem',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            {uploading ? (
                                <div style={{ animation: 'spin 1s linear infinite' }}><Loader2 size={36} color="#60a5fa" /></div>
                            ) : (
                                <FileUp size={36} color={isDragActive ? '#60a5fa' : '#94a3b8'} />
                            )}
                        </motion.div>
                        {uploading ? (
                            <p style={{ fontSize: '1.125rem', fontWeight: 500, color: '#60a5fa', margin: 0 }}>Uploading securely to Cloudinary...</p>
                        ) : (
                            <>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f1f5f9', margin: '0 0 0.5rem 0' }}>Drop your presentation here</h3>
                                <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>Or click to browse files. Supports PPT, PPTX, PDF (Max 50MB)</p>
                            </>
                        )}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        style={{
                            backgroundColor: 'rgba(30, 41, 59, 0.7)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            borderRadius: '1.5rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            overflow: 'hidden',
                            boxShadow: '0 10px 30px -5px rgba(0,0,0,0.3)'
                        }}
                    >
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
                            <h3 style={{ fontWeight: 600, color: '#f8fafc', margin: 0, fontSize: '1.125rem' }}>Your Library</h3>
                        </div>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                            {presentations.length === 0 ? (
                                <li style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>No presentations uploaded yet.</li>
                            ) : (
                                presentations.map((item, index) => (
                                    <motion.li
                                        key={item.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        style={{
                                            padding: '1.25rem 1.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            borderBottom: index < presentations.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                            transition: 'background-color 0.2s',
                                            cursor: 'default'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: '0.75rem', marginRight: '1.25rem' }}>
                                                <FileIcon size={28} color="#38bdf8" />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f8fafc', margin: 0, maxWidth: '24rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</p>
                                                <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: '0.25rem 0 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    {item.fileType} <span style={{ opacity: 0.5, margin: '0 0.25rem' }}>•</span> Added {new Date(item.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            <motion.a
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                href={`/admin/timeline/${item.id}`}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 600,
                                                    color: '#ffffff',
                                                    backgroundColor: '#3b82f6',
                                                    borderRadius: '0.5rem',
                                                    textDecoration: 'none',
                                                    boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                Timeline Editor
                                            </motion.a>
                                        </div>
                                    </motion.li>
                                ))
                            )}
                        </ul>
                    </motion.div>
                    <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
                </motion.div>
            </div>
        </div>
    );
};

export default Presentations;
