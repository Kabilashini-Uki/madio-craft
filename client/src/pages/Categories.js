// pages/Categories.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Categories = () => {
  const navigate = useNavigate();
  useEffect(() => {
    // Redirect to home (categories removed)
    navigate('/', { replace: true });
  }, [navigate]);
  return null;
};

export default Categories;