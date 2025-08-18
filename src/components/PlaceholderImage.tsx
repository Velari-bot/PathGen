import React from 'react';

interface PlaceholderImageProps {
  width: number;
  height: number;
  text?: string;
  bgColor?: string;
  textColor?: string;
  className?: string;
}

const PlaceholderImage: React.FC<PlaceholderImageProps> = ({
  width,
  height,
  text = 'Image',
  bgColor = '#4A90E2',
  textColor = '#FFFFFF',
  className = '',
}) => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.15}" 
            fill="${textColor}" text-anchor="middle" dy="0.35em">
        ${text}
      </text>
    </svg>
  `;

  const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;

  return (
    <img
      src={dataUrl}
      alt={text}
      width={width}
      height={height}
      className={className}
    />
  );
};

export default PlaceholderImage;
