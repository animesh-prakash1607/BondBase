import React, { useEffect, useState } from 'react'; 
import { useParams } from 'react-router-dom';
import axios from 'axios';

const UserProfile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.post(
          "http://localhost:3000/api/user/id", 
          { id },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            }
          }
        );
        setProfile(response.data.user);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };

    fetchProfile();
  }, [id]);

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-lg space-y-6">
        
        {/* Profile Header */}
        <div className="flex items-center space-x-5">
          <img
            src={profile.profilePhoto || '/default-profile.png'}
            alt={profile.firstName}
            className="w-20 h-20 rounded-full border object-cover"
          />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-sm text-gray-500">{profile.email}</p>
            {profile.title && (
              <p className="text-sm text-gray-600 mt-1 italic">{profile.title}</p>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-gray-700 text-sm leading-relaxed">{profile.bio}</p>
        ) || (
          <p className="text-gray-500 text-sm">No bio available</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 text-center border-t border-gray-200 pt-4">
          <div>
            <p className="text-lg font-semibold">{profile.posts?.length || 0}</p>
            <p className="text-xs text-gray-500">Posts</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{profile.followers?.length || 0}</p>
            <p className="text-xs text-gray-500">Followers</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{profile.following?.length || 0}</p>
            <p className="text-xs text-gray-500">Following</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
