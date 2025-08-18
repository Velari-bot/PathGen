import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const width = parseInt(searchParams.get('width') || '400');
    const height = parseInt(searchParams.get('height') || '200');
    const bgColor = searchParams.get('bgColor') || '4A90E2';
    const textColor = searchParams.get('textColor') || 'FFFFFF';
    const text = searchParams.get('text') || 'Image';

    // Validate dimensions
    if (width > 2000 || height > 2000) {
      return new NextResponse('Dimensions too large', { status: 400 });
    }

    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#${bgColor}"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.15}" 
              fill="#${textColor}" text-anchor="middle" dy="0.35em">
          ${text}
        </text>
      </svg>
    `;

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error generating placeholder image:', error);
    return new NextResponse('Error generating image', { status: 500 });
  }
}
