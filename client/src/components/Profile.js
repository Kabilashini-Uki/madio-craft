// In your profile component, add this function
const handleAvatarUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const response = await axios.post(
      `${process.env.REACT_APP_API_URL}/users/avatar`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

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