document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    const displayName = urlParams.get('displayName');  // Get the display name from the URL
    const avatarUrl = urlParams.get('avatarUrl');

    if (!userId) {
        console.error("No user ID found in the URL.");
        document.getElementById("userId").textContent = "No user ID found.";
        return;
    }

    if (displayName) {
        document.getElementById("displayName").textContent = displayName;  // Display the display name
    } else {
        console.error("No display name found in the URL.");
        document.getElementById("displayName").textContent = "Display name not found.";
    }

    if (avatarUrl) {
        document.querySelector(".profile-pic").style.backgroundImage = `url(${avatarUrl})`;  // Set the profile picture
    } else {
        console.error("No avatar URL found.");
    }

    document.getElementById("userId").textContent = `#${userId}`;

    fetch(`/api/user/${userId}`)
        .then(response => response.json())
        .then(userInfo => {
            if (!userInfo || !userInfo.username) {
                console.error("No user information found.");
                document.getElementById("displayName").textContent = "Display name not found";
                return;
            }

            // The display name should already be set, but if not, you could update it here
            if (!displayName) {
                document.getElementById("displayName").textContent = userInfo.username;
            }

            if (userInfo.avatar) {
                const avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${userInfo.avatar}.png`;
                document.querySelector(".profile-pic").style.backgroundImage = `url(${avatarUrl})`;
            }
        })
        .catch(error => {
            console.error('Error fetching user information:', error);
        });

    fetch('../src/quotes.json')
        .then(response => response.json())
        .then(data => {
            if (!data[userId]) {
                console.error("No quotes found for this user.");
                return;
            }

            const userQuotes = data[userId];
            const totalQuotes = userQuotes.length;

            if (totalQuotes === 0) {
                console.error("No quotes found for this user.");
                return;
            }

            userQuotes.sort((a, b) => new Date(a.date) - new Date(b.date));

            const lastQuote = userQuotes[userQuotes.length - 1];
            const wordCounts = userQuotes.map(q => q.text.split(' ').length);
            const charCounts = userQuotes.map(q => q.text.length);
            const longestQuote = userQuotes.reduce((max, q) => q.text.length > max.text.length ? q : max, userQuotes[0]);
            const shortestQuote = userQuotes.reduce((min, q) => q.text.length < min.text.length ? q : min, userQuotes[0]);

            const avgWords = (wordCounts.reduce((sum, count) => sum + count, 0) / totalQuotes).toFixed(2);
            const avgChars = (charCounts.reduce((sum, count) => sum + count, 0) / totalQuotes).toFixed(2);

            const wordFrequency = {};
            userQuotes.forEach(quote => {
                const words = quote.text.split(/\s+/).map(word => word.toLowerCase());
                words.forEach(word => {
                    if (!['the', 'and', 'of', 'a', 'to', 'is'].includes(word)) {
                        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
                    }
                });
            });
            const mostCommonWord = Object.keys(wordFrequency).reduce((a, b) => wordFrequency[a] > wordFrequency[b] ? a : b, "");

            const quoteFrequency = (totalQuotes / ((new Date(lastQuote.date) - new Date(userQuotes[0].date)) / (1000 * 60 * 60 * 24))).toFixed(2);

            const dayCounts = Array(7).fill(0);
            userQuotes.forEach(quote => {
                const day = new Date(quote.date).getDay();
                dayCounts[day]++;
            });
            const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const mostQuotedDay = daysOfWeek[dayCounts.indexOf(Math.max(...dayCounts))];

            document.getElementById("firstQuoteDate").textContent = new Date(userQuotes[0].date).toLocaleDateString('en-US');
            document.getElementById("recentQuote").textContent = `"${lastQuote.text}"`;
            document.getElementById("longestQuote").textContent = `"${longestQuote.text}"`;
            document.getElementById("shortestQuote").textContent = `"${shortestQuote.text}"`;
            document.getElementById("totalQuotes").textContent = totalQuotes;
            document.getElementById("quoteFrequency").textContent = `${quoteFrequency} Days/Quote`;
            document.getElementById("avgWords").textContent = avgWords;
            document.getElementById("avgChars").textContent = avgChars;
            document.getElementById("mostCommonWord").textContent = mostCommonWord;
            document.getElementById("mostQuotedDay").textContent = mostQuotedDay;

// Load user names from the JSON file
let userNames = {};  // This will hold the mapping from ID to display name

fetch('../src/usernames.json')  // Update this path to the actual location of your JSON file
    .then(response => response.json())
    .then(data => {
        userNames = data;
        populateQuotes();  // Call this function after the names are loaded
    })
    .catch(error => {
        console.error('Error loading user names:', error);
        populateQuotes();  // Optionally, still populate quotes if names can't be loaded
    });

// Function to populate the quotes list
function populateQuotes() {
    const quotesList = document.getElementById("quotesList");

    // Sort quotes by date in descending order (most recent first)
    userQuotes.sort((a, b) => new Date(b.date) - new Date(a.date));

    userQuotes.forEach(quote => {
        const quoteItem = document.createElement("div");
        quoteItem.className = "quote-item";
        
        const quoteText = document.createElement("div"); // Changed to "div" for better handling of multiple parts
        quoteText.className = "quote-text";

        if (quote.fullQuote) {
            // Handle multi-user quotes
            const parts = quote.fullQuote.split('|');
            const participants = quote.participants;

            parts.forEach((part, index) => {
                const partText = document.createElement("div");
                partText.className = "quote-part";

                // Get the display name for each participant
                const participantId = participants[index];
                const participantName = userNames[participantId] || participantId;  // Use ID if name not found
                
                partText.innerHTML = `<strong>${participantName}:</strong> ${part.trim()}`;
                quoteText.appendChild(partText);
            });
        } else {
            // Handle single-user quotes
            quoteText.textContent = `"${quote.text}"`;
        }
        
        const quoteDate = document.createElement("span");
        quoteDate.className = "quote-date";
        quoteDate.textContent = ` - ${new Date(quote.date).toLocaleDateString('en-US')}`;
        
        quoteItem.appendChild(quoteText);
        quoteItem.appendChild(quoteDate);
        
        quotesList.appendChild(quoteItem);
    });
}
        })
        .catch(error => {
            console.error('Error fetching or processing the quotes.json file:', error);
        });
});
