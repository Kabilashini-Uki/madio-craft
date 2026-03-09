import api from '../services/api';
// In your profile component, add this function
const handleAvatarUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const response = await api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    if (response.data.success) {
      updateUser({ ...user, avatar: response.data.avatar });
      toast.success('Profile picture updated!');
    }
  } catch (error) {
    toast.error('Failed to upload image');
  }
};

// In your JSX:
<input
  type="file"
  accept="image/*"
  onChange={handleAvatarUpload}
  className="hidden"
  ref={fileInputRef}
/>