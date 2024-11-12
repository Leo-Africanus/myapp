const postsContainer = document.getElementById('posts');
const loadingElement = document.getElementById('loading');
const tabsContainer = document.getElementById('tabs-container');

// Fetch subreddits list
fetch('subreddits.txt')
    .then(response => response.text())
    .then(data => {
        console.log('Subreddits list fetched:', data); // Debugging statement
        const subreddits = data.trim().split('\n').map(sub => sub.trim());
        console.log('Parsed subreddits:', subreddits); // Debugging statement
        subreddits.forEach((subreddit, index) => {
            const tab = document.createElement('button');
            tab.className = 'tab';
            if (index === 0) tab.classList.add('active');
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
            tab.setAttribute('data-subreddit', subreddit);
            tab.textContent = subreddit.charAt(0).toUpperCase() + subreddit.slice(1);
            tabsContainer.appendChild(tab);
        });

        // Add event listeners to tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');
                loadPosts(tab.getAttribute('data-subreddit'));
            });
        });

        // Initial load
        console.log('Initial subreddit:', subreddits[0]); // Debugging statement
        loadPosts(subreddits[0]);
    })
    .catch(error => console.error('Error fetching subreddits list:', error));

const renderPost = (post) => {
    const postElement = document.createElement('article');
    postElement.className = 'post-card';
    postElement.innerHTML = `
        <div class="post-header">
            <span class="author">Posted by u/${post.author}</span>
        </div>
        <h2 class="post-title">${post.title}</h2>
        <p class="post-content">${post.content}</p>
        <div class="post-actions">
            <button class="action-btn" aria-label="Upvote">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4L4 12h4v8h8v-8h4L12 4z"/>
                </svg>
                ${post.upvotes}
            </button>
            <button class="action-btn" aria-label="Comment">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                ${post.comments}
            </button>
        </div>
    `;

    if (post.media) {
        console.log('Post media:', post.media); // Debugging statement
        const mediaContainer = document.createElement('div');
        mediaContainer.className = 'media-container';

        if (post.media.type === 'image') {
            const image = document.createElement('img');
            image.src = post.media.url.replace(/&amp;/g, '&'); // Correctly handle the URL
            image.style.maxWidth = '100%'; // Ensure images don't overflow
            mediaContainer.appendChild(image);
        } else if (post.media.type === 'video') {
            const video = document.createElement('video');
            video.controls = true;
            video.src = post.media.url.replace(/&amp;/g, '&'); // Correctly handle the URL
            video.style.maxWidth = '100%'; // Ensure videos don't overflow
            video.type = 'video/mp4'; // Add the video type
            mediaContainer.appendChild(video);
        }

        postElement.appendChild(mediaContainer);
    }

    // Create and append the "Read More" link at the end of the post
    const link = document.createElement('a');
    link.href = `https://www.reddit.com${post.permalink}`;
    link.target = '_blank'; // Open in new tab
    link.textContent = 'Read More';
    link.className = 'read-more-link';
    postElement.appendChild(link);

    postsContainer.appendChild(postElement);
    console.log('Post appended:', post.title); // Debugging statement
};

const loadPosts = (subreddit) => {
    postsContainer.innerHTML = '';
    loadingElement.style.display = 'block';
    console.log('Loading posts for subreddit:', subreddit); // Debugging statement

    fetch(`storage/hot_topics_${subreddit}.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch posts for subreddit: ${subreddit}`);
            }
            return response.json();
        })
        .then(data => {
            loadingElement.style.display = 'none';
            console.log('Posts data:', data); // Debugging statement
            data.forEach(post => {
                renderPost(post);
            });
        })
        .catch(error => {
            console.error('Error fetching posts:', error);
            loadingElement.style.display = 'none';
        });
};

