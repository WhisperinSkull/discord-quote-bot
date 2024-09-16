const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quotestats')
        .setDescription('Displays statistics about a user\'s quotes.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to display quote stats for')
                .setRequired(true)),
    async execute(interaction) {
        try {
            const user = interaction.options.getUser('user');
            const userId = user.id;
            const guildMember = await interaction.guild.members.fetch(userId);
            const displayName = guildMember.displayName;

            // Load quotes from quotes.json
            const quotesFilePath = path.join(__dirname, '../../quotes.json');
            if (!fs.existsSync(quotesFilePath)) {
                return await interaction.reply('No quotes found.');
            }
            const quotes = JSON.parse(fs.readFileSync(quotesFilePath, 'utf8'));
            const userQuotes = quotes[userId] || [];

            if (userQuotes.length === 0) {
                return await interaction.reply(`<@${userId}> has no quotes.`);
            }

            // Sort the user's quotes by date for accurate last quote info
            userQuotes.sort((a, b) => new Date(a.date) - new Date(b.date));

            const totalQuotes = userQuotes.length;
            const lastQuote = userQuotes[userQuotes.length - 1];
            const wordCounts = userQuotes.map(q => q.text.split(' ').length);
            const charCounts = userQuotes.map(q => q.text.length);
            const longestQuote = userQuotes.reduce((max, q) => q.text.length > max.text.length ? q : max, userQuotes[0]);
            const shortestQuote = userQuotes.reduce((min, q) => q.text.length < min.text.length ? q : min, userQuotes[0]);

            // Average length of quotes
            const avgWords = (wordCounts.reduce((sum, count) => sum + count, 0) / totalQuotes).toFixed(2);
            const avgChars = (charCounts.reduce((sum, count) => sum + count, 0) / totalQuotes).toFixed(2);

            // Most common word
            const wordFrequency = {};
            userQuotes.forEach(quote => {
                const words = quote.text.split(/\s+/).map(word => word.toLowerCase());
                words.forEach(word => {
                    if (!['the', 'and', 'of', 'a', 'to', 'is'].includes(word)) { // Ignoring common words
                        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
                    }
                });
            });
            const mostCommonWord = Object.keys(wordFrequency).reduce((a, b) => wordFrequency[a] > wordFrequency[b] ? a : b, "");

            // Quotes per year
            const quotesPerYear = {};
            userQuotes.forEach(quote => {
                const year = new Date(quote.date).getFullYear();
                quotesPerYear[year] = (quotesPerYear[year] || 0) + 1;
            });
            const quoteFrequency = (totalQuotes / ((new Date(lastQuote.date) - new Date(userQuotes[0].date)) / (1000 * 60 * 60 * 24))).toFixed(2);

            // Most quoted day of the week
            const dayCounts = Array(7).fill(0); // Sunday to Saturday
            userQuotes.forEach(quote => {
                const day = new Date(quote.date).getDay();
                dayCounts[day]++;
            });
            const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const mostQuotedDay = daysOfWeek[dayCounts.indexOf(Math.max(...dayCounts))];

            // Load colors.json and get the user's color
            const colorsFilePath = path.join(__dirname, '../../colors.json');
            let userColor = 0x00AE86; // Default color
            if (fs.existsSync(colorsFilePath)) {
                const colors = JSON.parse(fs.readFileSync(colorsFilePath, 'utf8'));
                if (colors[userId]) {
                    userColor = colors[userId];
                }
            }

            // Embed creation
            const embed = new EmbedBuilder()
                .setTitle(`${displayName}'s Quote Stats`)
                .setThumbnail(user.displayAvatarURL())
                .setColor(userColor) // Use user's color
                .addFields(
                    { name: 'Most Recent Quote Date', value: `*${new Date(lastQuote.date).toLocaleDateString('en-US')}*`, inline: true },
                    { name: 'Total Quotes', value: `${totalQuotes}`, inline: true },
                    { name: 'Average Words per Quote', value: `${avgWords}`, inline: true },
                    { name: 'Average Characters per Quote', value: `${avgChars}`, inline: true },
                    { name: 'Longest Quote', value: `"${longestQuote.text}"\n*${new Date(longestQuote.date).toLocaleDateString('en-US')}*`, inline: false },
                    { name: 'Shortest Quote', value: `"${shortestQuote.text}"\n*${new Date(shortestQuote.date).toLocaleDateString('en-US')}*`, inline: false },
                    { name: 'Most Common Word', value: `**${mostCommonWord}**`, inline: true },
                    { name: 'Quotes per Year', value: `${Object.entries(quotesPerYear).map(([year, count]) => `${year}: ${count}`).join('\n')}`, inline: false },
                    { name: 'Quote Frequency', value: `${quoteFrequency} days/quote`, inline: true },
                    { name: 'Most Quoted Day of the Week', value: `${mostQuotedDay}`, inline: true }
                )
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error executing /quotestats command:', error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
};
