import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Home, Presentation, Music, PlayCircle, UserPlus, Zap } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { motion } from 'framer-motion';

const Sidebar = () => {
    const location = useLocation();
    const { logout, user } = useAuthStore();

    const navItems = [
        { name: 'Dashboard', path: '/admin', icon: Home },
        { name: 'Presentations', path: '/admin/presentations', icon: Presentation },
        { name: 'Audio Library', path: '/admin/audio', icon: Music },
        { name: 'Active Sessions', path: '/admin/sessions', icon: PlayCircle },
        { name: 'Guest Configs', path: '/admin/guests', icon: UserPlus },
    ];

    return (
        <div style={{
            width: '16rem',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 20
        }}>
            <div style={{
                height: '72px',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '1.5rem',
                paddingRight: '1.5rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                backgroundColor: 'transparent'
            }}>
                <div style={{
                    width: '2.25rem',
                    height: '2.25rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '0.75rem',
                    boxShadow: '0 4px 10px rgba(14, 165, 233, 0.4)'
                }}>
                    <Zap size={20} color="#ffffff" style={{ fill: '#ffffff' }} />
                </div>
                <h1 style={{ fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.025em', color: '#f8fafc', margin: 0 }}>
                    Smart<span style={{ color: '#38bdf8' }}>Control</span>
                </h1>
            </div>

            <div style={{
                flex: 1,
                paddingLeft: '1rem',
                paddingRight: '1rem',
                paddingTop: '1.5rem',
                paddingBottom: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
                overflowY: 'auto'
            }}>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/admin');

                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            style={{ textDecoration: 'none' }}
                        >
                            <motion.div
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    paddingLeft: '1rem',
                                    paddingRight: '1rem',
                                    paddingTop: '0.75rem',
                                    paddingBottom: '0.75rem',
                                    borderRadius: '0.75rem',
                                    transition: 'background-color 0.2s, color 0.2s',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    backgroundColor: isActive ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                                    color: isActive ? '#38bdf8' : '#94a3b8',
                                    border: isActive ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid transparent'
                                }}
                            >
                                {isActive && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '0.25rem', height: '1.5rem', backgroundColor: '#38bdf8', borderTopRightRadius: '9999px', borderBottomRightRadius: '9999px' }}></div>}
                                <Icon style={{ height: '20px', width: '20px', marginRight: '0.875rem', transition: 'colors', color: isActive ? '#38bdf8' : '#64748b' }} />
                                <span style={{ fontWeight: 600, fontSize: '14px', letterSpacing: '0.025em' }}>{item.name}</span>
                            </motion.div>
                        </Link>
                    );
                })}
            </div>

            <div style={{ padding: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '1rem', paddingRight: '1rem', paddingTop: '0.75rem', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: '2rem', height: '2rem', borderRadius: '9999px', backgroundColor: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontWeight: 700, marginRight: '0.75rem', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                        {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Admin</p>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(239, 68, 68, 0.15)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => logout()}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', paddingLeft: '1rem', paddingRight: '1rem', paddingTop: '0.625rem', paddingBottom: '0.625rem', fontSize: '0.875rem', fontWeight: 600, color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                    <LogOut style={{ height: '1.125rem', width: '1.125rem', marginRight: '0.75rem' }} />
                    Sign Out
                </motion.button>
            </div>
        </div>
    );
};

export default Sidebar;
