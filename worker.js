export default {
  async fetch(request, env) {
    return await handleRequest(request, env);
  },
};

async function handleRequest(request, env) {
  const API_KEY = env.API_KEY;
  const cache = caches.default;

  if (!API_KEY) {
    return new Response('API key is not set in environment variables.', {
      status: 500,
    });
  }

  const url = new URL(request.url);
  const city = url.searchParams.get('city') || 'Beijing';

  const cacheKey = new Request(url.toString(), request);
  let cachedResponse = await cache.match(cacheKey);

  if (cachedResponse) {
    return cachedResponse;
  }

  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&appid=${API_KEY}&units=metric&lang=zh_cn`;

  try {
    const apiResponse = await fetch(apiUrl);
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return new Response(
        `Failed to fetch weather data from OpenWeatherMap API: ${errorText}`,
        { status: apiResponse.status }
      );
    }
    const data = await apiResponse.json();

    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="zh-cn">
      <head>
        <meta charset="UTF-8">
        <title>${data.name}的天气</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #f0f0f0;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          .weather-widget {
            display: flex;
            flex-direction: row;
            align-items: center;
            background-color: #ffffff;
            padding: 1rem 2rem;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            width: 100%;
          }
          .weather-icon {
            flex: 0 0 auto;
            width: 100px;
            height: 100px;
            margin-right: 1rem;
          }
          .temperature {
            flex: 0 0 auto;
            font-size: 3rem;
            font-weight: bold;
            margin-right: 1rem;
          }
          .details {
            flex: 1 1 auto;
          }
          .details p {
            margin: 0.5rem 0;
            font-size: 1.2rem;
          }
          .city-name {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
          }
        </style>
      </head>
      <body>
        <div class="weather-widget">
          <img class="weather-icon" src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="天气图标">
          <div class="temperature">${Math.round(data.main.temp)}°C</div>
          <div class="details">
            <div class="city-name">${data.name}</div>
            <p>湿度：${data.main.humidity}%</p>
            <p>风速：${data.wind.speed} m/s</p>
            <p>天气：${data.weather[0].description}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const newResponse = new Response(htmlContent, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 's-maxage=600',
      },
    });

    await cache.put(cacheKey, newResponse.clone());

    return newResponse;
  } catch (error) {
    return new Response(`Error fetching weather data: ${error.message}`, {
      status: 500,
    });
  }
}
