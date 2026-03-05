import { collection, addDoc, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const DUMMY_PRESENTATIONS = [
    {
        title: 'Q1 Financial Review',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/sample.pdf',
        fileType: 'pdf',
        totalSlides: 12,
        createdBy: 'admin_user',
        createdAt: new Date().toISOString(),
    },
    {
        title: 'Product Roadmap 2026',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/sample.pdf',
        fileType: 'pdf',
        totalSlides: 8,
        createdBy: 'admin_user',
        createdAt: new Date().toISOString(),
    }
];

const DUMMY_AUDIO = [
    {
        name: 'Corporate Background Music',
        category: 'Background Music',
        fileUrl: 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg',
        duration: 120,
        createdBy: 'admin_user',
    },
    {
        name: 'Slide Transition Chime',
        category: 'Slide Effects',
        fileUrl: 'https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg',
        duration: 2,
        createdBy: 'admin_user',
    }
];

export const seedDummyData = async () => {
    try {
        console.log('Clearing existing dummy data...');
        // Optional: you could clear existing collections here, but we'll just add for now to be safe.

        console.log('Seeding Presentations...');
        const presRefs = [];
        for (const pres of DUMMY_PRESENTATIONS) {
            const docRef = await addDoc(collection(db, 'presentations'), pres);
            presRefs.push(docRef.id);
        }

        console.log('Seeding Audio...');
        const audioRefs = [];
        for (const audio of DUMMY_AUDIO) {
            const docRef = await addDoc(collection(db, 'audioLibrary'), audio);
            audioRefs.push(docRef.id);
        }

        console.log('Seeding Slide Audio Mappings...');
        // Map audio to the first presentation
        if (presRefs.length > 0 && audioRefs.length > 0) {
            const mappingData = {
                presentationId: presRefs[0],
                slideNumber: 1,
                autoNextTime: 10,
                triggers: [
                    {
                        audioId: audioRefs[0],
                        triggerType: 'onLoad',
                        timestamp: 0
                    }
                ]
            };
            await addDoc(collection(db, 'slideAudioMapping'), mappingData);
        }

        alert('Dummy data seeded successfully!');
        window.location.reload(); // Reload to fetch new stats
    } catch (error) {
        console.error('Error seeding data:', error);
        alert('Failed to seed dummy data: ' + error.message);
    }
};
