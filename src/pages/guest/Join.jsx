import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { motion } from 'framer-motion';

const Join = () => {
    const [sessionId, setSessionId] = useState('');
    const navigate = useNavigate();

    const handleJoin = (e) => {
        e.preventDefault();
        if (sessionId.trim()) {
            navigate(`/guest/${sessionId.trim()}`);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            padding: '1rem',
            fontFamily: 'system-ui, sans-serif'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                    width: '100%',
                    maxWidth: '28rem',
                    padding: '2.5rem',
                    backgroundColor: 'rgba(30, 41, 59, 0.7)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '1.5rem',
                    boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.3)'
                }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        margin: '0 auto',
                        width: '4.5rem',
                        height: '4.5rem',
                        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 165, 233, 0.3))',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        borderRadius: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1.5rem',
                        boxShadow: '0 10px 20px -5px rgba(14, 165, 233, 0.3)'
                    }}>
                        <Users style={{ height: '2.25rem', width: '2.25rem', color: '#38bdf8' }} />
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.025em', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Join Session</h1>
                    <p style={{ color: '#cbd5e1', marginTop: '0.5rem', fontWeight: 500 }}>Enter the session code to view the live presentation!</p>
                </div>

                <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <input
                            type="text"
                            placeholder="SESSION CODE"
                            required
                            style={{
                                textAlign: 'center',
                                textTransform: 'uppercase',
                                letterSpacing: '0.15em',
                                width: '100%',
                                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                                border: '2px solid rgba(255,255,255,0.1)',
                                borderRadius: '0.75rem',
                                padding: '1rem',
                                outline: 'none',
                                transition: 'all 0.2s',
                                boxSizing: 'border-box',
                                fontSize: '1.5rem',
                                color: '#f8fafc',
                                fontWeight: 700,
                                boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.1)'
                            }}
                            value={sessionId}
                            onChange={(e) => setSessionId(e.target.value.toUpperCase())}
                            onFocus={(e) => e.target.style.borderColor = '#38bdf8'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            padding: '1.25rem',
                            marginTop: '0.5rem',
                            fontSize: '1.125rem',
                            backgroundColor: '#0284c7',
                            color: 'white',
                            fontWeight: 600,
                            borderRadius: '0.75rem',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px 0 rgba(2, 132, 199, 0.39)'
                        }}
                    >
                        Join Presentation
                    </motion.button>

                    <div style={{ marginTop: '1.5rem', textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <a href="/login" style={{ color: '#38bdf8', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#7dd3fc'} onMouseOut={(e) => e.currentTarget.style.color = '#38bdf8'}>
                            ← Back to Portal
                        </a>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default Join;
