import http.server
import socketserver
import webbrowser
import threading
import os
import json
import uuid
import requests
import urllib3
from datetime import datetime

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ==========================================
# ВСТАВЬ СВОЙ КЛЮЧ АВТОРИЗАЦИИ СЮДА:
# ==========================================
CLIENT_SECRET_BASE64 = "MDFhMGU3YzItNzJmYS03MjMxLWE3MjItMjU3ODFiYjIwYTUyOjYwZmVkMDVmLTQyYmMtNDM3Ni05MjJkLWUwZWJiNGY4ZWJkNQ=="
# ==========================================

PORT = 8001
DIRECTORY = os.path.dirname(os.path.abspath(__file__))


def get_gigachat_token():
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
    response = session.post(url, headers=headers, data=data, timeout=30)
    response.raise_for_status()
    return response.json()['access_token']


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/chat':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            user_data = json.loads(post_data.decode('utf-8'))
            prompt = user_data.get('prompt', '')

            try:
                token = get_gigachat_token()
                url = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"

                # ИИ теперь просто отвечает на вопросы
                system_prompt = """
                Ты — профессиональный фитнес-тренер и диетолог Health AI.
                Твоя задача — общаться с пользователем, отвечать на его вопросы, анализировать его данные (которые тебе присылают) и давать полезные советы по улучшению здоровья.
                НЕ используй никакие технические теги и скобки в своих ответах. Просто пиши обычный текст.
                """

                payload = {
                    "model": "GigaChat",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7
                }

                headers = {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': f'Bearer {token}'
                }

                session = requests.Session()
                session.verify = False
                response = session.post(url, headers=headers, json=payload, timeout=60)
                response.raise_for_status()
                answer = response.json()['choices'][0]['message']['content']

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'answer': answer}).encode('utf-8'))

            except Exception as e:
                print(f"\n❌ ОШИБКА: {str(e)}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass


def open_browser():
    webbrowser.open(f"http://localhost:{PORT}")


if __name__ == "__main__":
    threading.Timer(1, open_browser).start()
    print(f"🚀 Приложение запущено на http://localhost:{PORT}")
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Сервер остановлен.")