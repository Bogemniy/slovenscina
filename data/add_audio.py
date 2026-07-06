import json
import sys

# Загружаем маппинг аудио
with open('slovenian_words.json') as f:
    audio_data = json.load(f)

# Строим словарь: словенское слово -> имя аудио файла
audio_map = {}
for item in audio_data:
    sl_word = item['russian']  # поле 'russian' содержит словенское слово
    audio_map[sl_word] = item['audio']

# Обрабатываем words.jsonl
input_file = 'words.jsonl'
output_file = 'words_with_audio.jsonl'

matched = 0
total = 0

with open(input_file) as f_in, open(output_file, 'w') as f_out:
    for line in f_in:
        line = line.strip()
        if not line:
            continue
        word = json.loads(line)
        total += 1
        sl = word.get('sl', '')
        if sl in audio_map:
            word['audio'] = audio_map[sl]
            matched += 1
        f_out.write(json.dumps(word, ensure_ascii=False) + '\n')

print(f'Всего слов: {total}')
print(f'Совпало: {matched}')
print(f'Без аудио: {total - matched}')
print(f'Результат сохранён в: {output_file}')
