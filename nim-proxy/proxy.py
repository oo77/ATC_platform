from flask import Flask, request, jsonify, Response, stream_with_context
import requests, json

app = Flask(__name__)

NVIDIA_KEY = "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"
NVIDIA_URL = "https://integrate.api.nvidia.com/v1"

@app.route('/v1/chat/completions', methods=['POST'])
def proxy():
    body = request.json
    is_stream = body.get('stream', False)
    headers = {
        "Authorization": f"Bearer {NVIDIA_KEY}",
        "Content-Type": "application/json"
    }

    if is_stream:
        resp = requests.post(
            f"{NVIDIA_URL}/chat/completions",
            headers=headers, json=body, stream=True
        )
        def generate():
            for line in resp.iter_lines():
                if not line:
                    continue
                line_str = line.decode('utf-8')
                if not line_str.startswith('data: '):
                    yield f"{line_str}\n\n"
                    continue
                data_str = line_str[6:]
                if data_str == '[DONE]':
                    yield "data: [DONE]\n\n"
                    continue
                try:
                    chunk = json.loads(data_str)
                    for choice in chunk.get('choices', []):
                        choice.get('delta', {}).pop('reasoning_content', None)
                    yield f"data: {json.dumps(chunk)}\n\n"
                except Exception:
                    yield f"{line_str}\n\n"

        return Response(
            stream_with_context(generate()),
            content_type='text/event-stream',
            headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'}
        )
    else:
        resp = requests.post(
            f"{NVIDIA_URL}/chat/completions",
            headers=headers, json=body
        )
        result = resp.json()
        for choice in result.get('choices', []):
            choice.get('message', {}).pop('reasoning_content', None)
        return jsonify(result), resp.status_code

@app.route('/v1/models', methods=['GET'])
def models():
    resp = requests.get(f"{NVIDIA_URL}/models",
        headers={"Authorization": f"Bearer {NVIDIA_KEY}"})
    return jsonify(resp.json()), resp.status_code

if __name__ == '__main__':
    print("✅ Proxy ishga tushdi: http://localhost:8899/v1")
    app.run(port=8899)