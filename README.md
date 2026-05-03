# Slovenščina — карточки

PWA для изучения словенского. Карточки слов и глаголов, конструктор предложений, игра на сопоставление пар. Прогресс синхронизируется через Google-логин.

→ Открыть: **https://bogemniy.github.io/slovenscina/**

## Устройство

| Что | Где |
|---|---|
| Слова | [data/words.jsonl](data/words.jsonl) — append-only, 1 слово/строка |
| Глаголы | [data/verbs.jsonl](data/verbs.jsonl) — append-only, 1 глагол/строка |
| Предложения | [data/sentences.jsonl](data/sentences.jsonl) |
| Категории и местоимения | [data/taxonomy.json](data/taxonomy.json) |
| Код | [src/](src/) — нативные ES-модули, без бандлера |
| Стили | [styles.css](styles.css) |

Деплой — GitHub Pages, автоматически из `main`. Пуш = деплой.

## Добавить слово

В Claude Code из этой репы:

```
/add-word hvala спасибо greet
```

Claude дочитает `data/words.jsonl`, проверит на дубликат, дополнит файл, запустит валидатор, закоммитит и запушит. На GitHub поднимется CI-проверка, дальше Pages автоматически выкладывает новую версию.

Глаголы — `/add-verb živeti жить` (Claude сам проспрягает все 9 форм).

## Локально

```bash
python3 -m http.server 8765
# http://localhost:8765
```

`file://` не сработает — браузеру нужен HTTP-origin для ES-модулей и `fetch`.

## Валидация данных

```bash
node scripts/validate-data.mjs
```

Запускается автоматически в [.github/workflows/validate-data.yml](.github/workflows/validate-data.yml) на каждый PR/push, который трогает `data/`.

## Архитектура и правила игры

См. [CLAUDE.md](CLAUDE.md).
