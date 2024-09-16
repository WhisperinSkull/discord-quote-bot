const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const quotesFilePath = path.join(__dirname, '../../quotes.json');

// Read quotes from the file
function readQuotes() {
    return new Promise((resolve, reject) => {
        fs.readFile(quotesFilePath, 'utf8', (err, data) => {
            if (err) reject(err);
            else resolve(JSON.parse(data));
        });
    });
}

// Write quotes to the file
function writeQuotes(quotes) {
    return new Promise((resolve, reject) => {
        fs.writeFile(quotesFilePath, JSON.stringify(quotes, null, 2), 'utf8', (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete')
        .setDescription('Deletes a quote from a user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose quote you want to delete')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('quote')
                .setDescription('The exact quote you want to delete')
                .setRequired(true)),
    
    async execute(interaction, client) {
        // Check if the user has admin permissions
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const quoteToDelete = interaction.options.getString('quote');

        try {
            const quotes = await readQuotes();
            const userQuotes = quotes[user.id] || [];

            // Find and delete the quote
            const index = userQuotes.findIndex(quote => quote.text === quoteToDelete);
            if (index === -1) {
                return interaction.reply({ content: 'Quote not found.', ephemeral: true });
            }

            userQuotes.splice(index, 1); // Remove the quote from the array
            if (userQuotes.length > 0) {
                quotes[user.id] = userQuotes;
            } else {
                delete quotes[user.id];
            }

            await writeQuotes(quotes);
            await interaction.reply(`Quote deleted successfully from ${user.tag}.`);
        } catch (error) {
            console.error('Error processing command:', error);
            await interaction.reply({ content: 'There was an error processing the command.', ephemeral: true });
        }
    }
};
