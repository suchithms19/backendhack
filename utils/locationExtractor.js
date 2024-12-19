const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function extractLocationFromText(text) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Extract location information from the following text. Return only latitude and longitude if possible."
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 100
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error extracting location:', error);
    return null;
  }
}

module.exports = { extractLocationFromText }; 