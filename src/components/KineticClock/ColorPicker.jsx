import React, { useState, useCallback } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';

export const ColorPicker = ({ color, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };
  
  // Convert RGB to hex
  const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, x)).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };
  
  const rgb = hexToRgb(color);
  
  const handleRgbChange = useCallback((channel, value) => {
    const newRgb = { ...rgb, [channel]: parseInt(value) || 0 };
    onChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  }, [rgb, onChange]);

  return (
    <div className="mb-4">
      <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">{label}</label>
      
      {/* Color preview button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full p-2 rounded bg-gray-800 hover:bg-gray-750 transition-colors"
      >
        <div 
          className="w-8 h-8 rounded border border-gray-600"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm text-gray-300 font-mono uppercase">{color}</span>
      </button>
      
      {/* Color picker dropdown */}
      {isOpen && (
        <div className="mt-2 p-3 bg-gray-850 rounded-lg border border-gray-700">
          {/* Color wheel */}
          <div className="color-picker-wrapper mb-3">
            <HexColorPicker color={color} onChange={onChange} />
          </div>
          
          {/* Hex input */}
          <div className="mb-3">
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Hex Code</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">#</span>
              <HexColorInput 
                color={color} 
                onChange={onChange}
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-300 font-mono uppercase focus:outline-none focus:border-gray-600"
                prefixed={false}
              />
            </div>
          </div>
          
          {/* RGB inputs */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">RGB Values</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[9px] text-red-400 block mb-0.5">R</label>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.r}
                  onChange={(e) => handleRgbChange('r', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-300 font-mono focus:outline-none focus:border-gray-600"
                />
              </div>
              <div className="flex-1">
                <label className="text-[9px] text-green-400 block mb-0.5">G</label>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.g}
                  onChange={(e) => handleRgbChange('g', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-300 font-mono focus:outline-none focus:border-gray-600"
                />
              </div>
              <div className="flex-1">
                <label className="text-[9px] text-blue-400 block mb-0.5">B</label>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.b}
                  onChange={(e) => handleRgbChange('b', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-300 font-mono focus:outline-none focus:border-gray-600"
                />
              </div>
            </div>
          </div>
          
          {/* Preset colors */}
          <div className="mt-3 pt-3 border-t border-gray-700">
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Presets</label>
            <div className="flex flex-wrap gap-1.5">
              {['#ff0000', '#ff6b00', '#ffdd00', '#00ff00', '#00ffff', '#0066ff', '#8800ff', '#ff00ff', '#ffffff', '#888888', '#000000'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => onChange(preset)}
                  className={`w-6 h-6 rounded border transition-transform hover:scale-110 ${color === preset ? 'border-white ring-1 ring-white' : 'border-gray-600'}`}
                  style={{ backgroundColor: preset }}
                  title={preset}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
