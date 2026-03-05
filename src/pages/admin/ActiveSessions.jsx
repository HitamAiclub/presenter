import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import useSessionStore from '../../store/useSessionStore';
import { PlayCircle } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { motion } from 'framer-motion';

const ActiveSessions = () => {
    const [presentations, setPresentations] = useState([]);
    const { startSession } = useSessionStore();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPresentations = async () => {
            const snapshot = await getDocs(collection(db, 'presentations'));
            setPresentations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchPresentations();
    }, []);

    const handleStartSession = async (presentationId, presentationData) => {
        try {
            console.log("Current session store:", useSessionStore.getState());
            const sessionId = Math.random().toString(36).substring(2, 8).toUpperCase();
            await startSession(sessionId, presentationId);
            navigate(`/admin/host/${sessionId}`, { state: { presentation: presentationData } });
        } catch (error) {
            console.error(error);
            alert("Failed to start session: " + error.message);
        }
    };

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
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.025em', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Active Sessions</h2>
                        <p style={{ color: '#cbd5e1', marginTop: '0.25rem' }}>Select a presentation to begin hosting and generate Session Access.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {presentations.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}
                                style={{
                                    backgroundColor: 'rgba(30, 41, 59, 0.7)',
                                    backdropFilter: 'blur(16px)',
                                    WebkitBackdropFilter: 'blur(16px)',
                                    padding: '1.5rem',
                                    borderRadius: '1rem',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{
                                    height: '8rem',
                                    backgroundColor: 'rgba(15, 23, 42, 0.5)',
                                    borderRadius: '0.75rem',
                                    marginBottom: '1.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid rgba(255,255,255,0.02)'
                                }}>
                                    <PlayCircle size={48} color="rgba(255,255,255,0.2)" />
                                </div>
                                <h3 style={{ fontWeight: 600, fontSize: '1.25rem', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                                    {item.title}
                                </h3>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleStartSession(item.id, item)}
                                    style={{
                                        marginTop: '1.25rem',
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.75rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)'
                                    }}
                                >
                                    Start Session
                                </motion.button>
                            </motion.div>
                        ))}

                        {presentations.length === 0 && (
                            <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', color: '#94a3b8', fontSize: '1.125rem', backgroundColor: 'rgba(30, 41, 59, 0.5)', borderRadius: '1.5rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                <p>No presentations available to launch. Create one first!</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ActiveSessions;
