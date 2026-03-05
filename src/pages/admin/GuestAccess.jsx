import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { UserPlus, Trash2, Key } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { motion } from 'framer-motion';

const GuestAccess = () => {
    const [guests, setGuests] = useState([]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchGuests();
    }, []);

    const fetchGuests = async () => {
        const querySnapshot = await getDocs(collection(db, 'guest_accounts'));
        const guestData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGuests(guestData);
    };

    const handleCreateGuest = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formattedEmail = email.toLowerCase().trim();
            await addDoc(collection(db, 'guest_accounts'), {
                email: formattedEmail,
                password: password,
                createdAt: serverTimestamp()
            });
            setEmail('');
            setPassword('');
            fetchGuests();
        } catch (error) {
            console.error('Error creating guest:', error);
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, 'guest_accounts', id));
            fetchGuests();
        } catch (error) {
            console.error('Error deleting guest:', error);
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
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.025em', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Guest Credentials</h1>
                        <p style={{ color: '#cbd5e1', marginTop: '0.5rem', fontWeight: 500 }}>Create secure guest login codes to share across users for Presentation Views.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.3)', height: 'fit-content' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', backgroundColor: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem', boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)' }}>
                                    <UserPlus size={24} color="#818cf8" />
                                </div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>Generate Guest Pass</h2>
                            </div>

                            <form onSubmit={handleCreateGuest} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', marginLeft: '0.25rem' }}>Guest Username Identifier</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="eg: guest01@view.com"
                                        style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'rgba(15, 23, 42, 0.5)', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', padding: '0.75rem 1rem', outline: 'none', transition: 'border-color 0.2s', boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)' }}
                                        onFocus={(e) => e.target.style.borderColor = '#818cf8'}
                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', marginLeft: '0.25rem' }}>Passkey</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="eg: securePass123"
                                        style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'rgba(15, 23, 42, 0.5)', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', padding: '0.75rem 1rem', outline: 'none', transition: 'border-color 0.2s', boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)' }}
                                        onFocus={(e) => e.target.style.borderColor = '#818cf8'}
                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        padding: '0.875rem',
                                        marginTop: '0.5rem',
                                        backgroundColor: '#4f46e5',
                                        color: 'white',
                                        fontWeight: 600,
                                        borderRadius: '0.75rem',
                                        border: 'none',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        opacity: loading ? 0.7 : 1,
                                        boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.39)'
                                    }}
                                >
                                    {loading ? 'Generating...' : 'Create Credentials'}
                                </motion.button>
                            </form>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.3)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', backgroundColor: 'rgba(14, 165, 233, 0.2)', border: '1px solid rgba(14, 165, 233, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem', boxShadow: '0 4px 10px rgba(14, 165, 233, 0.2)' }}>
                                    <Key size={24} color="#38bdf8" />
                                </div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>Active Guest Keys</h2>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                {guests.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8', backgroundColor: 'rgba(15, 23, 42, 0.3)', borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                        No guest credentials created yet
                                    </div>
                                ) : (
                                    guests.map((guest, i) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            key={guest.id}
                                            style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1rem', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                        >
                                            <div>
                                                <p style={{ fontWeight: 700, color: '#f8fafc', margin: 0 }}>{guest.email}</p>
                                                <p style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: '#94a3b8', marginTop: '0.375rem', marginBottom: 0, display: 'flex', alignItems: 'center' }}>
                                                    Pass: <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.125rem 0.5rem', borderRadius: '0.25rem', color: '#e2e8f0', marginLeft: '0.5rem' }}>{guest.password}</span>
                                                </p>
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleDelete(guest.id)}
                                                style={{ padding: '0.5rem', color: '#64748b', backgroundColor: 'transparent', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
                                                title="Revoke Access"
                                            >
                                                <Trash2 size={20} />
                                            </motion.button>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default GuestAccess;
