import { create } from 'zustand';
import { auth, db } from '../services/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

const useAuthStore = create((set) => ({
    user: null,
    role: null, // 'admin' | 'guest'
    loading: true,
    error: null,

    login: async (email, password) => {
        set({ loading: true, error: null });
        try {
            // Hardcoded Admin Access Overrides
            const hardcodedAdmins = {
                'lead@hitam.ai': { password: 'lead@123', role: 'admin', title: 'Lead' },
                'co_lead@hitam.ai': { password: 'co_lead@123', role: 'admin', title: 'Co Lead' },
                'media_manager@hitam.ai': { password: 'mm@123', role: 'admin', title: 'Media Manager' },
                'manager@hitam.ai': { password: 'manager@123', role: 'admin', title: 'Manager' }
            };

            const lowercaseEmail = email.toLowerCase().trim();
            const hardcodedUser = hardcodedAdmins[lowercaseEmail];

            if (hardcodedUser) {
                if (hardcodedUser.password === password) {
                    const mockUser = {
                        uid: `hardcoded_${lowercaseEmail.split('@')[0]}`,
                        email: lowercaseEmail,
                        title: hardcodedUser.title
                    };
                    // Store admin auth in localStorage to persist across tabs/restarts
                    localStorage.setItem('auth_user', JSON.stringify({ user: mockUser, role: hardcodedUser.role }));
                    set({ user: mockUser, role: hardcodedUser.role, loading: false });
                    return mockUser;
                } else {
                    throw new Error('Invalid credentials');
                }
            }

            // Check if Guest Account created by Admin
            const guestSnapshot = await getDocs(collection(db, 'guest_accounts'));
            let isGuestRecord = null;
            guestSnapshot.forEach((doc) => {
                if (doc.data().email === lowercaseEmail && doc.data().password === password) {
                    isGuestRecord = { id: doc.id, ...doc.data() };
                }
            });

            if (isGuestRecord) {
                const mockGuest = {
                    uid: `guest_${isGuestRecord.id}`,
                    email: isGuestRecord.email,
                    title: 'Guest Viewer'
                };
                // Store guest auth in sessionStorage to persist only for the current tab/session
                sessionStorage.setItem('auth_user', JSON.stringify({ user: mockGuest, role: 'guest' }));
                set({ user: mockGuest, role: 'guest', loading: false });
                return mockGuest;
            }

            // Fallback for real firebase if needed (disabled for strict hardcoded only if desired)
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

            if (userDoc.exists()) {
                const userData = userDoc.data();
                set({ user: userCredential.user, role: userData.role, loading: false });
                return userCredential.user;
            } else {
                throw new Error('User role not found');
            }
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    logout: async () => {
        // Clear custom auth storage
        localStorage.removeItem('auth_user');
        sessionStorage.removeItem('auth_user');

        await signOut(auth);
        set({ user: null, role: null });
    },

    initializeAuth: () => {
        // First check custom auth storages before checking Firebase
        const localAuth = localStorage.getItem('auth_user');
        if (localAuth) {
            const { user, role } = JSON.parse(localAuth);
            set({ user, role, loading: false });
            return;
        }

        const sessionAuth = sessionStorage.getItem('auth_user');
        if (sessionAuth) {
            const { user, role } = JSON.parse(sessionAuth);
            set({ user, role, loading: false });
            return;
        }

        // Fallback to standard Firebase Auth state observer
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    set({
                        user,
                        role: userDoc.exists() ? userDoc.data().role : null,
                        loading: false
                    });
                } catch (err) {
                    console.error('Error fetching user role on initialize', err);
                    set({ user, role: null, loading: false });
                }
            } else {
                set({ user: null, role: null, loading: false });
            }
        });
    }
}));

export default useAuthStore;
