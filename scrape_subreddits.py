import os
import requests
import json
from dotenv import load_dotenv, find_dotenv

## Load environment variables from .env file
load_dotenv(find_dotenv())

REDDIT_CLIENT_ID = os.getenv('REDDIT_CLIENT_ID')
REDDIT_CLIENT_SECRET = os.getenv('REDDIT_CLIENT_SECRET')
USER_AGENT = os.getenv('USER_AGENT')
REDDIT_USERNAME = os.getenv('REDDIT_USERNAME')
REDDIT_PASSWORD = os.getenv('REDDIT_PASSWORD')

# Get access token
auth = requests.auth.HTTPBasicAuth(REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET)
data = {
    'grant_type': 'password',
    'username': REDDIT_USERNAME,
    'password': REDDIT_PASSWORD
}
headers = {'User-Agent': USER_AGENT}
res = requests.post('https://www.reddit.com/api/v1/access_token', auth=auth, data=data, headers=headers)
res.raise_for_status()
token = res.json()['access_token']

# Read subreddits from subreddits.txt
with open('subreddits.txt', 'r') as f:
    subreddits = [line.strip() for line in f if line.strip()]

# Create the storage directory if it does not exist
if not os.path.exists('storage'):
    os.makedirs('storage')

# Fetch and save data for each subreddit
for subreddit in subreddits:
    print(f"Fetching posts from /r/{subreddit}")
    headers = {
        'Authorization': f'bearer {token}',
        'User-Agent': USER_AGENT
    }
    response = requests.get(f'https://oauth.reddit.com/r/{subreddit}/hot?limit=20', headers=headers)
    response.raise_for_status()
    data = response.json()['data']['children']
    posts = []

    for post in data:
        post_data = post['data']
        media = None

        # Check for Reddit videos
        if post_data.get('media') and post_data['media'] and 'reddit_video' in post_data['media']:
            media = {
                'type': 'video',
                'url': post_data['media']['reddit_video']['fallback_url']
            }
        # Check for video previews
        elif post_data.get('reddit_video_preview'):
            media = {
                'type': 'video',
                'url': post_data['reddit_video_preview']['fallback_url']
            }
        # Check for images
        elif 'preview' in post_data and post_data['preview'].get('images'):
            media = {
                'type': 'image',
                'url': post_data['preview']['images'][0]['source']['url']
            }
        
        # Append post data
        posts.append({
            'id': post_data['id'],
            'author': post_data['author'],
            'title': post_data['title'],
            'content': post_data.get('selftext', ''),
            'upvotes': post_data['ups'],
            'comments': post_data['num_comments'],
            'media': media,
            'permalink': post_data['permalink'] # Add permalink field
        })

    # Save the data to a JSON file in the storage directory
    with open(f'storage/hot_topics_{subreddit}.json', 'w') as f:
        json.dump(posts, f, indent=4)
    print(f"Data from /r/{subreddit} saved to storage/hot_topics_{subreddit}.json")

