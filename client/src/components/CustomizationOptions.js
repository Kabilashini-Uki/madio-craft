// src/components/CustomizationOptions.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiCheck, FiPlus, FiMinus, FiCalendar,
  FiRuler, FiType, FiDroplet, FiBox
} from 'react-icons/fi';
import { useSecureChat } from '../context/SecureChatContext';
import toast from 'react-hot-toast';

const CustomizationOptions = ({ product, onStartChat }) => {
  const [options, setOptions] = useState({});
  const [dimensions, setDimensions] = useState({ width: '', height: '', depth: '' });
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [deadline, setDeadline] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState(product?.price || 0);

  const { createCustomizationRoom } = useSecureChat();

  const handleOptionChange = (optionName, value, priceAdjustment = 0) => {
    setOptions(prev => ({
      ...prev,
      [optionName]: { value, priceAdjustment }
    }));

    // Recalculate price
    let newPrice = product.price;
    Object.values({ ...options, [optionName]: { value, priceAdjustment } }).forEach(opt => {
      newPrice += opt.priceAdjustment || 0;
    });
    newPrice *= quantity;
    setEstimatedPrice(newPrice);
  };

  const handleStartCustomization = async () => {
    const customizationData = {
      options,
      dimensions,
      quantity,
      notes,
      deadline,
      estimatedPrice,
      productId: product._id,
      productName: product.name
    };

    const room = await createCustomizationRoom(
      product.artisan?._id,
      product._id,
      customizationData
    );

    if (room) {
      onStartChat(room, customizationData);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Customize Your Product</h3>

      {/* Customization Options */}
      {product.customizationOptions?.map((option, index) => (
        <div key={index} className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {option.name}
            {option.required && <span className="text-red-500 ml-1">*</span>}
          </label>

          {option.type === 'color' && (
            <div className="flex flex-wrap gap-3">
              {option.options?.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOptionChange(option.name, color, option.priceAdjustment)}
                  className={`w-12 h-12 rounded-full border-2 transition-all ${
                    options[option.name]?.value === color
                      ? 'border-primary ring-4 ring-primary/20'
                      : 'border-gray-300 hover:border-primary'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          )}

          {option.type === 'size' && (
            <div className="flex flex-wrap gap-3">
              {option.options?.map((size, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOptionChange(option.name, size, option.priceAdjustment)}
                  className={`px-6 py-3 border-2 rounded-xl font-medium transition-all ${
                    options[option.name]?.value === size
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 text-gray-700 hover:border-primary'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}

          {option.type === 'material' && (
            <select
              value={options[option.name]?.value || ''}
              onChange={(e) => handleOptionChange(option.name, e.target.value, option.priceAdjustment)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
            >
              <option value="">Select {option.name}</option>
              {option.options?.map((material, idx) => (
                <option key={idx} value={material}>
                  {material}
                </option>
              ))}
            </select>
          )}

          {option.type === 'text' && (
            <input
              type="text"
              value={options[option.name]?.value || ''}
              onChange={(e) => handleOptionChange(option.name, e.target.value, option.priceAdjustment)}
              placeholder={`Enter ${option.name}`}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
            />
          )}
        </div>
      ))}

      {/* Dimensions */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
          <FiRuler className="mr-2" /> Dimensions (cm)
        </label>
        <div className="grid grid-cols-3 gap-4">
          <input
            type="number"
            placeholder="Width"
            value={dimensions.width}
            onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
          />
          <input
            type="number"
            placeholder="Height"
            value={dimensions.height}
            onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
          />
          <input
            type="number"
            placeholder="Depth"
            value={dimensions.depth}
            onChange={(e) => setDimensions({ ...dimensions, depth: e.target.value })}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Quantity */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Quantity</label>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-12 h-12 border-2 border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50"
          >
            <FiMinus />
          </button>
          <span className="text-2xl font-bold w-16 text-center">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="w-12 h-12 border-2 border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50"
          >
            <FiPlus />
          </button>
        </div>
      </div>

      {/* Deadline */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
          <FiCalendar className="mr-2" /> Preferred Deadline (Optional)
        </label>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Additional Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows="4"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary resize-none"
          placeholder="Describe your requirements, ideas, or questions..."
        />
      </div>

      {/* Price Estimate */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Estimated Price:</span>
          <span className="text-2xl font-bold text-primary">Rs{estimatedPrice}</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          *Final price may vary based on artisan's quote
        </p>
      </div>

      {/* Action Button */}
      <button
        onClick={handleStartCustomization}
        className="w-full px-6 py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2"
      >
        <FiMessageCircle className="h-5 w-5" />
        <span>Start Customization Chat</span>
      </button>

      <p className="text-xs text-gray-500 text-center mt-4 flex items-center justify-center">
        <FiLock className="mr-1" />
        Your conversation is private and secure
      </p>
    </div>
  );
};

export default CustomizationOptions;