import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { nftId } = req.body;

    if (!nftId) {
      return res.status(400).json({ message: 'NFT ID is required' });
    }

    // Define the image types and their file paths
    const imageTypes = [
      { type: 'high', path: `4000x4000backgrounds/${nftId}.png` },
      { type: 'normal', path: `thumbnail/${nftId}.png` },
      { type: 'nobg', path: `4000x4000pngs/${nftId}.png` }
    ];

    const imageDataArray = [];

    for (const imageType of imageTypes) {
      try {
        // Fetch the image from the public URL
        const response = await fetch(`https://mepycqaceqmcdcjvuyuj.supabase.co/storage/v1/object/public/${imageType.path}`);
        
        if (!response.ok) {
          console.error(`Failed to fetch ${imageType.type}:`, response.statusText);
          continue;
        }

        // Get the image as a blob
        const imageBlob = await response.blob();
        
        // Convert blob to base64
        const arrayBuffer = await imageBlob.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        
        // Get the content type from the response
        const contentType = response.headers.get('content-type') || 'image/png';
        
        imageDataArray.push({
          type: imageType.type,
          data: `data:${contentType};base64,${base64}`,
          filename: `REVERSOZ_${nftId}_${imageType.type}.png`
        });

      } catch (error) {
        console.error(`Error processing ${imageType.type}:`, error);
      }
    }

    res.status(200).json({ images: imageDataArray });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 