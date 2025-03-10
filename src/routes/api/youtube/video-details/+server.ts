import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { config } from '$lib/server/config';
import { formatDuration } from '$lib/server/youtube-service';

export async function GET({ url }: RequestEvent) {
  try {
    const videoId = url.searchParams.get('id');
    
    if (!videoId) {
      return json({ error: 'Video ID is required' }, { status: 400 });
    }
    
    // Get video details from YouTube API
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${config.youtube.apiKey}`;
    
    const response = await fetch(detailsUrl);
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return json({ error: 'Video not found' }, { status: 404 });
    }
    
    const video = data.items[0];
    
    return json({
      title: video.snippet.title,
      description: video.snippet.description,
      channelTitle: video.snippet.channelTitle,
      duration: formatDuration(video.contentDetails.duration),
      viewCount: video.statistics.viewCount
    });
  } catch (error) {
    console.error('Error fetching video details:', error);
    return json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch video details' 
    }, { status: 500 });
  }
} 