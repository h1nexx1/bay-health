const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Разрешаем CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    const { prompt } = JSON.parse(event.body);

    // Твой ключ (возьми его из run.py, он начинается на MDFhM...)
    // В идеале его нужно спрятать в Environment Variables Netlify, но для теста можно так
    const CLIENT_SECRET_BASE64 = process.env.GIGACHAT_SECRET || "MDFhMGU3YzItNzJmYS03MjMxLWE3MjItMjU3ODFiYjIwYTUyOjYwZmVkMDVmLTQyYmMtNDM3Ni05MjJkLWUwZWJiNGY4ZWJkNQ==";

    // 1. Получаем токен
    const authResponse = await fetch('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'RqUID': require('crypto').randomUUID(),
        'Authorization': `Basic ${CLIENT_SECRET_BASE64.trim()}`
      },
      body: 'scope=GIGACHAT_API_PERS'
    });

    if (!authResponse.ok) throw new Error('Ошибка авторизации');
    const authData = await authResponse.json();
    const token = authData.access_token;

    // 2. Запрос к GigaChat
    const aiResponse = await fetch('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model: "GigaChat",
        messages: [
          {"role": "system", "content": "Ты — умный фитнес-тренер Health AI. Отвечай кратко и по делу. Не используй никаких тегов."},
          {"role": "user", "content": prompt}
        ],
        temperature: 0.7
      })
    });

    if (!aiResponse.ok) throw new Error('Ошибка GigaChat');
    const aiData = await aiResponse.json();
    const answer = aiData.choices[0].message.content;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ answer })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};