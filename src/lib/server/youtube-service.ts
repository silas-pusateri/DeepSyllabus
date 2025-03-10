import { config } from './config';

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  duration: string;
  viewCount: string;
  url: string;
}

/**
 * Search for relevant educational videos on YouTube
 * Prioritizes:
 * - Longer form content (tutorials, lectures)
 * - Educational channels
 * - Higher quality metrics (views, likes)
 * - Recent content
 */
export async function searchEducationalVideos(query: string, maxResults: number = 3): Promise<YouTubeVideo[]> {
  try {
    // Add educational keywords to improve results
    const searchQuery = `${query} tutorial OR lecture OR course`;
    
    // Initial search to get video IDs
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&videoDuration=long&maxResults=${maxResults}&relevanceLanguage=en&key=${config.youtube.apiKey}`;
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error(`YouTube search failed: ${searchResponse.statusText}`);
    }
    
    const searchData = await searchResponse.json();
    const videoIds = searchData.items.map(item => item.id.videoId).join(',');
    
    // Get detailed video information
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${config.youtube.apiKey}`;
    
    const detailsResponse = await fetch(detailsUrl);
    if (!detailsResponse.ok) {
      throw new Error(`YouTube details fetch failed: ${detailsResponse.statusText}`);
    }
    
    const detailsData = await detailsResponse.json();
    
    // Process and sort videos
    const videos: YouTubeVideo[] = detailsData.items
      .map(item => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        channelTitle: item.snippet.channelTitle,
        duration: item.contentDetails.duration,
        viewCount: item.statistics.viewCount,
        url: `https://www.youtube.com/watch?v=${item.id}`
      }))
      .sort((a, b) => parseInt(b.viewCount) - parseInt(a.viewCount)); // Sort by view count as a quality signal
    
    return videos;
  } catch (error) {
    console.error('Error searching YouTube videos:', error);
    return [];
  }
}

/**
 * Parse ISO 8601 duration to human readable format
 */
export function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '';
  
  const hours = (match[1] || '').replace('H', '');
  const minutes = (match[2] || '').replace('M', '');
  const seconds = (match[3] || '').replace('S', '');
  
  let result = '';
  if (hours) result += `${hours}:`;
  result += `${minutes.padStart(2, '0')}:`;
  result += seconds.padStart(2, '0');
  
  return result;
} 