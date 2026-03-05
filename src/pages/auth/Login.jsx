import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading, error, user, role } = useAuthStore();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (user && role === 'admin') {
            navigate('/admin');
        }
    }, [user, role, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const user = await login(email, password);
            if (user && user.title === 'Guest Viewer') {
                // If a guest tries to log in through the admin portal
                await useAuthStore.getState().logout();
                throw new Error('This portal is for Admins only. Please use the Guest Login.');
            } else {
                navigate('/admin');
            }
        } catch (error) {
            console.error('Login failed:', error);
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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
                        <Lock style={{ height: '2.25rem', width: '2.25rem', color: '#38bdf8' }} />
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.025em', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Admin Portal</h1>
                    <p style={{ color: '#cbd5e1', marginTop: '0.5rem', fontWeight: 500 }}>Smart Presentation Control</p>
                </div>

                {error && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '0.875rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center', fontWeight: 500, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.5rem', marginLeft: '0.25rem' }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, paddingLeft: '1rem', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                                <Mail style={{ height: '1.25rem', width: '1.25rem', color: '#64748b' }} />
                            </div>
                            <input
                                type="email"
                                required
                                style={{
                                    paddingLeft: '2.75rem',
                                    width: '100%',
                                    backgroundColor: 'rgba(15, 23, 42, 0.5)',
                                    border: '2px solid rgba(255,255,255,0.1)',
                                    borderRadius: '0.75rem',
                                    padding: '0.875rem 1rem 0.875rem 2.75rem',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    boxSizing: 'border-box',
                                    fontSize: '1rem',
                                    color: '#f8fafc',
                                    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.1)'
                                }}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                onFocus={(e) => e.target.style.borderColor = '#38bdf8'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.5rem', marginLeft: '0.25rem' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, paddingLeft: '1rem', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                                <Lock style={{ height: '1.25rem', width: '1.25rem', color: '#64748b' }} />
                            </div>
                            <input
                                type="password"
                                required
                                style={{
                                    paddingLeft: '2.75rem',
                                    width: '100%',
                                    backgroundColor: 'rgba(15, 23, 42, 0.5)',
                                    border: '2px solid rgba(255,255,255,0.1)',
                                    borderRadius: '0.75rem',
                                    padding: '0.875rem 1rem 0.875rem 2.75rem',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    boxSizing: 'border-box',
                                    fontSize: '1rem',
                                    color: '#f8fafc',
                                    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.1)'
                                }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                onFocus={(e) => e.target.style.borderColor = '#38bdf8'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            padding: '1rem',
                            marginTop: '0.5rem',
                            fontSize: '1rem',
                            backgroundColor: '#0284c7',
                            color: 'white',
                            fontWeight: 600,
                            borderRadius: '0.75rem',
                            border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 14px 0 rgba(2, 132, 199, 0.39)',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </motion.button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <a href="/guest/login" style={{ color: '#38bdf8', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#7dd3fc'} onMouseOut={(e) => e.currentTarget.style.color = '#38bdf8'}>
                        Joining as a guest? Click here <span style={{ marginLeft: '0.25rem' }}>→</span>
                    </a>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
