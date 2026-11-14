import requests
import json
import uuid
import urllib3

# Отключаем предупреждения SSL
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ==========================================
# ВСТАВЬ СВОЙ КЛЮЧ АВТОРИЗАЦИИ СЮДА:
# ==========================================
CLIENT_SECRET_BASE64 = "MDFhMGU3YzItNzJmYS03MjMxLWE3MjItMjU3ODFiYjIwYTUyOjYwZmVkMDVmLTQyYmMtNDM3Ni05MjJkLWUwZWJiNGY4ZWJkNQ=="


# ==========================================

def test():
    print("1. Отправляем запрос за токеном...")
    url = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"

    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'RqUID': str(uuid.uuid4()),
        'Authorization': f'Basic {CLIENT_SECRET_BASE64.strip()}'
    }
    data = {"scope": "GIGACHAT_API_PERS"}

    session = requests.Session()
    session.verify = False

    try:
        response = session.post(url, headers=headers, data=data, timeout=30)
        response.raise_for_status()
        token = response.json()['access_token']
        print("✅ ТОКЕН УСПЕШНО ПОЛУЧЕН!")
    except Exception as e:
        print(f"❌ ОШИБКА ПОЛУЧЕНИЯ ТОКЕНА: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Ответ сервера: {e.response.text}")
        return

    print("\n2. Отправляем тестовый запрос в GigaChat...")
    url_chat = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"

    # Тестовый вопрос и инструкция для ИИ
    test_message = "Я ошибся, вычти из питания 2 яйца"

    payload = {
        "model": "GigaChat",
        "messages": [
            {"role": "system",
             "content": "Ты профессиональный фитнес-тренер. Если пользователь просит УБРАТЬ или ВЫЧЕСТЬ еду, добавь в конец ответа тег [FOOD_SUB: название, калории]. Если СЪЕЛ — [FOOD_ADD: название, калории]."},
            {"role": "user", "content": test_message}
        ],
        "temperature": 0.7
    }

    headers_chat = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': f'Bearer {token}'
    }

    try:
        response = session.post(url_chat, headers=headers_chat, json=payload, timeout=60)
        response.raise_for_status()
        ai_data = response.json()

        print("✅ ОТВЕТ ИИ ПОЛУЧЕН:")
        print(ai_data['choices'][0]['message']['content'])
        print("\nЕсли в ответе есть тег [FOOD_SUB: ...], значит ИИ правильно понял команду 'вычесть'.")
    except Exception as e:
        print(f"❌ ОШИБКА ЗАПРОСА К ИИ: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Ответ сервера: {e.response.text}")


if __name__ == "__main__":
    test()