# 설치 가이드 (터미널 / CLI)

개발자용이에요. 비개발자는 [GUI 설치 가이드](INSTALL-GUI.ko.md)가 더 쉬워요.

## Claude Code

세션 안에서:

```
/plugin marketplace add Jay-Hyun/ClaraMuz
/plugin install clara-muz@clara-muz
```

터미널에서 바로:

```
claude plugin marketplace add Jay-Hyun/ClaraMuz
claude plugin install clara-muz@clara-muz
```

- 설치 후 새 세션을 열어요. 호출 이름은 `/clara-muz:clara-muz-team`, `/clara-muz:ai-memory` 예요.
- 설치 없이 폴더로 시험하기: `claude --plugin-dir ./plugins/clara-muz`
- 구조 검사: `claude plugin validate .` (저장소 루트에서), `claude plugin validate plugins/clara-muz`

## Codex CLI

```
codex plugin marketplace add Jay-Hyun/ClaraMuz
codex plugin marketplace list
```

- 그 다음 ChatGPT 데스크톱 앱을 재시작하고 Plugins 화면에서 설치해요. (Codex CLI에서는 `/plugins` 로 플러그인 목록을 열어요.)
- 브랜치를 고정하려면 `codex plugin marketplace add Jay-Hyun/ClaraMuz --ref main`
- 갱신: `codex plugin marketplace upgrade` / 삭제: `codex plugin marketplace remove clara-muz`
- 로컬 폴더로 시험하기: 저장소 루트에서 `codex plugin marketplace add ./`

## 상대 AI의 명령 도구

`clara-muz-team`은 상대 AI를 `codex exec`(Claude가 리더일 때) 또는 `claude -p`(Codex가 리더일 때)로 불러요. 없으면 AI가 설치해도 되는지 먼저 물어봐요. 직접 설치하려면 공식 안내를 따르세요.

- Codex CLI: https://developers.openai.com/codex/quickstart?setup=cli
- Claude Code: https://claude.com/download

로그인은 각 앱에서 한 번만 하면 돼요(`codex login`, 또는 `claude` 실행 후 로그인).

## 선택: 예전 Node 서버

작업 취소, 허용 폴더 강제, MCP 모드가 필요하면 `extras/node-server/` 를 보세요. 기본 설치에는 필요 없어요.
