import OpenAI from "openai";

const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0IjoiZ3VpIiwidiI6IjAuMC4wIiwidSI6IlBaWURjZ2lxUmNxem5QaXhRSkZ1d1E9PSIsInV1IjoiTlMxK3BoZ2dRblNqSEdZa0wzN1NsZz09IiwiaWF0IjoxNzc0NDQxNDYwfQ.4owIgj80cszJHZ2riCaQJVQZjoLxUD49lNKZbVUd1gw";
const BASE_URL = "https://api.puter.com/puterai/openai/v1";

const client = new OpenAI({
  apiKey: API_KEY,
  baseURL: BASE_URL,
});

async function main() {
  console.log("=== ТЕСТ PUTER API ===");
  console.log("Отправка запроса...");
  const startTime = Date.now();

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // Имя модели в Puter (они автоматически маппят на нужную)
      messages: [
        {
          role: "user",
          content: "Скажи 'Привет' и подтверди, что ты работаешь. Выведи результат в JSON.",
        },
      ],
      response_format: { type: "json_object" }, // Тестируем и JSON режим тоже
      max_tokens: 50,
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Тест успешно пройден за ${duration}мс!`);
    console.log("\nОтвет API:");
    console.log(response.choices[0]?.message?.content);
  } catch (error: any) {
    console.error("❌ Ошибка при выполнении запроса:");
    console.error(error.message);
    if (error.status) console.error("Статус код:", error.status);
  }
}

main();
