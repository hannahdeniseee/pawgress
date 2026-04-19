import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import Friends from './Friends.jsx';
import PawBackground from "../components/PawBackground";

const Profile = ({ currentUser }) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth0();
  
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRewards, setUserRewards] = useState({ coins: 0, xp: 0 });

  // Load rewards from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("user_data");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUserRewards({ coins: userData.coins || 0, xp: userData.xp || 0 });
    } else {
      localStorage.setItem("user_data", JSON.stringify({ coins: 0, xp: 0 }));
    }
  }, []);

  // Listen for updates from quests
  useEffect(() => {
    const handleRewardUpdate = (event) => {
      if (event.detail) {
        setUserRewards({ coins: event.detail.coins || 0, xp: event.detail.xp || 0 });
      }
    };
    
    window.addEventListener('userRewardsUpdated', handleRewardUpdate);
    
    return () => {
      window.removeEventListener('userRewardsUpdated', handleRewardUpdate);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.sub) {
      const fetchProfileData = async () => {
        try {
            setLoading(true);
          
            const encodedId = encodeURIComponent(user.sub);

            const [profileRes, statsRes] = await Promise.all([
                fetch(`http://localhost:5000/api/profile/${encodedId}`),
                fetch(`http://localhost:5000/api/stats?auth0Id=${encodedId}`)
            ]);

            if (!profileRes.ok) throw new Error('Profile not found');

            const profileData = await profileRes.json();
            const statsData = await statsRes.json();

            setProfile(profileData);
            setStats(statsData);
            } catch (err) {
            setError(err.message);
            } finally {
            setLoading(false);
            }
        };

        fetchProfileData();
        } else if (!authLoading && !isAuthenticated) {
        setLoading(false);
        setError('Please log in to view your profile.');
        }
    }, [isAuthenticated, user, authLoading]);

    if (authLoading || loading) return <div className="loading-spinner">Loading Profile...</div>;
    if (error) return <div className="error-message">Error: {error}</div>;
    if (!profile) return <div>No profile data found.</div>;

    const chartData = [
        {
        name: 'Duration (Days)',
        'Account Age': stats?.accountAgeDays || 0,
        'Pet Ownership': stats?.petOwnershipDays || 0,
        }
    ];

    return (
        <div className="profile-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Profile Header */}
        <div className="profile-header" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '2rem', marginTop: '5rem' }}>
            <img 
            src={profile.avatarUrl || user?.picture || 'https://via.placeholder.com/100'} 
            alt="User Avatar" 
            style={{ width: '100px', height: '100px', borderRadius: '50%' }}
            />
            <div>
            <h2 style={{ fontFamily: "'Jersey 15', serif", color: '#4E56C0' }}>{profile.username || user?.nickname || 'Pawgress User'}</h2>
            <p style={{ color: '#666', fontFamily: "'Jersey 15', serif" }}>Joined: {new Date(profile.createdAt).toLocaleDateString()}</p>
            </div>
        </div>

        {/* Rewards Section - 2 cards in one row */}
        <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontFamily: "'Jersey 15', serif", color: '#4E56C0', fontSize: '24px', marginBottom: '1rem' }}>💰 Your Rewards</h3>
            <div style={{ 
                display: 'flex', 
                flexDirection: 'row',
                gap: '20px', 
                justifyContent: 'space-between'
            }}>
                <div style={{ 
                    flex: 1,
                    background: 'white',
                    border: '2.5px solid #4E56C0',
                    padding: '1.5rem', 
                    borderRadius: '20px',
                    boxShadow: '0 4px 20px rgba(100, 120, 200, 0.12)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#4E56C0', fontFamily: "'Jersey 15', serif" }}>{userRewards.coins}</div>
                    <div style={{ color: '#8890d8', fontFamily: "'Jersey 15', serif", fontSize: '18px' }}>🐾 Coins</div>
                </div>
                <div style={{ 
                    flex: 1,
                    background: 'white',
                    border: '2.5px solid #4E56C0',
                    padding: '1.5rem', 
                    borderRadius: '20px',
                    boxShadow: '0 4px 20px rgba(100, 120, 200, 0.12)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#4E56C0', fontFamily: "'Jersey 15', serif" }}>{userRewards.xp}</div>
                    <div style={{ color: '#8890d8', fontFamily: "'Jersey 15', serif", fontSize: '18px' }}>⭐ XP Points</div>
                </div>
            </div>
        </div>

        {/* Pet Information */}
        <div className="pet-section" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontFamily: "'Jersey 15', serif", color: '#4E56C0', fontSize: '24px', marginBottom: '1rem' }}>🐾 Your Companion</h3>
            {profile.pet && profile.pet.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'white', border: '2.5px solid #4E56C0', padding: '1rem', borderRadius: '20px', boxShadow: '0 4px 20px rgba(100, 120, 200, 0.12)' }}>
                <img 
                src={profile.pet[0].image} 
                alt={profile.pet[0].type} 
                style={{ width: '80px', height: '80px', objectFit: 'contain' }} 
                />
                <div>
                <p style={{ fontFamily: "'Jersey 15', serif", fontSize: '18px', color: '#4E56C0' }}><strong>Type:</strong> {profile.pet[0].type}</p>
                <p style={{ fontFamily: "'Jersey 15', serif", fontSize: '18px', color: '#4E56C0' }}><strong>Breed:</strong> {profile.pet[0].breed}</p>
                <p style={{ fontFamily: "'Jersey 15', serif", fontSize: '18px', color: '#4E56C0' }}><strong>Adopted:</strong> {new Date(profile.pet[0].createdAt).toLocaleDateString()}</p>
                </div>
            </div>
            ) : (
            <div style={{ background: '#fff3cd', padding: '1rem', borderRadius: '20px', border: '2.5px solid #4E56C0', color: '#856404' }}>
                <p style={{ fontFamily: "'Jersey 15', serif", fontSize: '18px' }}>You haven't adopted a pet yet! Head over to the selection page to find your new companion.</p>
            </div>
            )}
        </div>
        
        {/* Statistics */}
        <div className="stats-section" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontFamily: "'Jersey 15', serif", color: '#4E56C0', fontSize: '24px', marginBottom: '1rem' }}>📊 Journey Statistics</h3>
            <div style={{ height: '300px', width: '100%', background: 'white', padding: '1rem', borderRadius: '20px', border: '2.5px solid #4E56C0', boxShadow: '0 4px 20px rgba(100, 120, 200, 0.12)' }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip cursor={{ fill: '#f5f5f5' }} />
                <Legend />
                <Bar dataKey="Account Age" fill="#8884d8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pet Ownership" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
            </div>
        </div>

        {/* Friends Section */}
        <div className="friends-section">
            <h3 style={{ fontFamily: "'Jersey 15', serif", color: '#4E56C0', fontSize: '24px', marginBottom: '1rem' }}>👥 Your Friends</h3>
            {currentUser && <Friends currentUser={currentUser} />}
        </div>

        </div>
    );
};

export default Profile;