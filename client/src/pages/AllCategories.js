// pages/AllCategories.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AllCategories = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/products', { replace: true });
  }, [navigate]);
  return null;
};

export default AllCategories;