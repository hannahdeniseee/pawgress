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

const Profile = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth0();
  
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch if the user is authenticated and we have their auth0Id
    if (isAuthenticated && user?.sub) {
      const fetchProfileData = async () => {
        try {
          setLoading(true);
          
          const [profileRes, statsRes] = await Promise.all([
            fetch(`/api/profile/${user.sub}`),
            fetch(`/api/profile/${user.sub}/stats`)
          ]);

          if (!profileRes.ok || !statsRes.ok) {
            throw new Error('Failed to fetch profile data');
          }

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
      <div className="profile-header" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '2rem' }}>
        <img 
          src={profile.avatarUrl || user?.picture || 'https://via.placeholder.com/100'} 
          alt="User Avatar" 
          style={{ width: '100px', height: '100px', borderRadius: '50%' }}
        />
        <div>
          <h2>{profile.username || user?.nickname || 'Pawgress User'}</h2>
          <p style={{ color: '#666' }}>Joined: {new Date(profile.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <hr style={{ border: '1px solid #eee', marginBottom: '2rem' }} />

    {/* Pet Information */}
      <div className="pet-section" style={{ marginBottom: '2rem' }}>
        <h3>Your Companion</h3>
        {profile.pet ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: '#f9f9f9', padding: '1rem', borderRadius: '8px' }}>
             {/* Note: Ensure the image path resolves correctly in your actual public/assets folder */}
            <img 
              src={profile.pet.image} 
              alt={profile.pet.type} 
              style={{ width: '80px', height: '80px', objectFit: 'contain' }} 
            />
            <div>
              <p><strong>Type:</strong> {profile.pet.type}</p>
              <p><strong>Breed:</strong> {profile.pet.breed}</p>
              <p><strong>Adopted:</strong> {new Date(profile.pet.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        ) : (
          <div style={{ background: '#fff3cd', padding: '1rem', borderRadius: '8px', color: '#856404' }}>
            <p>You haven't adopted a pet yet! Head over to the selection page to find your new companion.</p>
          </div>
        )}
      </div>
    
    {/* Statistics */}
      <div className="stats-section">
        <h3>Journey Statistics</h3>
        <div style={{ height: '300px', width: '100%', background: '#fff', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
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

    </div>
  );
};

export default Profile;