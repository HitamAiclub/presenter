import React, { useEffect, useState } from 'react';
import { db } from '../../services/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import Sidebar from '../../components/Sidebar';
import { seedDummyData } from '../../utils/seedDummyData';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalPresentations: 0,
        activeSessions: 0,
        audioTracks: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const presSnap = await getDocs(collection(db, 'presentations'));
                const audioSnap = await getDocs(collection(db, 'audioLibrary'));

                setStats(prev => ({
                    ...prev,
                    totalPresentations: presSnap.size,
                    audioTracks: audioSnap.size,
                    activeSessions: 0 // Will connect to Realtime DB later
                }));
            } catch (error) {
                console.error("Error fetching stats:", error);
            }
        };
        fetchStats();
    }, []);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a', fontFamily: 'system-ui, sans-serif' }}>
            {/* Sidebar rendered externally so keeping Layout rendering context here*/}
            <Sidebar />
            <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ maxWidth: '80rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}
                >
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem' }}>
                        <div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.025em', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Dashboard Overview</h1>
                            <p style={{ color: '#cbd5e1', marginTop: '0.5rem', fontWeight: 500 }}>Welcome back!</p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={seedDummyData}
                            style={{ padding: '0.75rem 1.5rem', backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', borderRadius: '0.75rem', border: '1px solid rgba(56, 189, 248, 0.3)', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.1)' }}
                            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(56, 189, 248, 0.3)'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(56, 189, 248, 0.2)'}
                        >
                            Seed Dummy Data
                        </motion.button>
                    </header>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <motion.div
                            whileHover={{ y: -4 }}
                            style={{
                                backgroundColor: 'rgba(30, 41, 59, 0.7)',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                borderLeft: '4px solid #10b981',
                                borderRight: '1px solid rgba(255,255,255,0.05)',
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                padding: '1.5rem',
                                borderRadius: '0 1rem 1rem 0',
                                boxShadow: '0 10px 30px -5px rgba(0,0,0,0.3)',
                                cursor: 'pointer'
                            }}
                        >
                            <h3 style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Total Presentations</h3>
                            <p style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f8fafc', marginTop: '0.75rem', margin: 0 }}>{stats.totalPresentations}</p>
                        </motion.div>
                        <motion.div
                            whileHover={{ y: -4 }}
                            style={{
                                backgroundColor: 'rgba(30, 41, 59, 0.7)',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                borderLeft: '4px solid #0ea5e9',
                                borderRight: '1px solid rgba(255,255,255,0.05)',
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                padding: '1.5rem',
                                borderRadius: '0 1rem 1rem 0',
                                boxShadow: '0 10px 30px -5px rgba(0,0,0,0.3)',
                                cursor: 'pointer'
                            }}
                        >
                            <h3 style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Active Sessions</h3>
                            <p style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f8fafc', marginTop: '0.75rem', margin: 0 }}>{stats.activeSessions}</p>
                        </motion.div>
                        <motion.div
                            whileHover={{ y: -4 }}
                            style={{
                                backgroundColor: 'rgba(30, 41, 59, 0.7)',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                borderLeft: '4px solid #a855f7',
                                borderRight: '1px solid rgba(255,255,255,0.05)',
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                padding: '1.5rem',
                                borderRadius: '0 1rem 1rem 0',
                                boxShadow: '0 10px 30px -5px rgba(0,0,0,0.3)',
                                cursor: 'pointer'
                            }}
                        >
                            <h3 style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Audio Tracks</h3>
                            <p style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f8fafc', marginTop: '0.75rem', margin: 0 }}>{stats.audioTracks}</p>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        style={{
                            backgroundColor: 'rgba(30, 41, 59, 0.7)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            padding: '2rem',
                            borderRadius: '1.5rem',
                            minHeight: '400px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            boxShadow: '0 10px 30px -5px rgba(0,0,0,0.3)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>Recent Activity</h2>
                            <button style={{ fontSize: '0.875rem', fontWeight: 500, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(56, 189, 248, 0.2)', cursor: 'pointer' }}>View All</button>
                        </div>
                        <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: '5rem', height: '5rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                <span style={{ fontSize: '2rem', opacity: 0.8 }}>📊</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '1.125rem' }}>No recent activity detected.</p>
                            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#475569' }}>Activities to appear soon once guests join.</p>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;
