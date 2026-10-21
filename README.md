# ClaraMuz 🤝

**Claude와 ChatGPT가 서로 일을 나눠 하는 플러그인**이에요.

![ClaraMuz 한눈에 보기](docs/img/hero.svg)

> English summary is at the bottom. ⬇️

## 이게 뭐예요?

Claude 앱 안에서 "이 일은 ChatGPT(Codex)가 해줘", "검토는 Claude가 해줘"처럼 **일을 나눠 맡길 수 있게** 해줘요.
둘이 같이 보는 **공유 메모장**도 있어서, 한쪽이 하던 일을 다른 쪽이 이어받을 수 있어요.

- **설치할 건 앱 두 개뿐**이에요: Claude 앱, Codex(ChatGPT) 앱. 로그인만 하면 돼요.
- Node.js, 서버, MCP, API 키는 **필요 없어요**.
- 새 프로그램을 만든 게 아니라 **설명서(명령어 파일)만 들어 있는 플러그인**이라서 가볍고 안전해요.

## 어떤 기능이 있어요?

| 기능 | 설명 |
|---|---|
| `/clara-muz-team 할 일` | 할 일을 쪼개서 Claude와 ChatGPT에게 나눠 맡기고, 결과를 직접 확인해서 알려줘요 |
| `/ai-memory` | 둘이 같이 보는 메모장을 보고, 쓰고, 찾고, 지워요 |
| `/ai-memory handoff` | "여기까지 했고 이건 남았어" 인수인계 문서를 만들어요. 앱을 바꿔 쓸 때(예: Claude 사용량이 다 떨어졌을 때) 복사해서 붙여넣으면 돼요 ![이어받기](docs/img/handoff.svg) |
| `/ai-memory init-codex` | Codex도 같은 메모장을 읽고 쓰게 연결해요 (한 번만) |

## 설치 방법 (4단계)

### 1단계. 앱 설치하고 로그인 (처음 한 번만)

![1단계](docs/img/step1.svg)

- **Claude 앱** (데스크톱): 설치하고 로그인해요.
- **Codex 앱** (ChatGPT 계정): 설치하고 ChatGPT로 로그인해요. 없으면 Claude 쪽 기능만 돼요.

### 2단계. 플러그인 가게 등록

![2단계](docs/img/step2.svg)

Claude 앱의 **Code 탭** 입력창에 이걸 붙여넣고 Enter:

```
/plugin marketplace add Jay-Hyun/ClaraMuz
```

### 3단계. 플러그인 설치

![3단계](docs/img/step3.svg)

```
/plugin install clara-muz@clara-muz
```

### 4단계. 써보기

![4단계](docs/img/step4.svg)

```
/clara-muz-team README를 읽고 오타를 찾아줘
/ai-memory add 버튼 색은 파란색으로
```

- **처음 쓸 때** Codex 명령 도구가 없으면 Claude가 "설치해도 될까요?"라고 물어봐요. **"응"** 이라고 하면 공식 설치 방법으로 대신 설치해줘요. 그 다음 Codex 앱에서 ChatGPT로 로그인되어 있는지만 확인해주세요.
- Claude가 파일을 읽거나 명령을 실행해도 되냐고 물을 수 있어요. 내용을 보고 허락하면 돼요.

> 그림 속 화면은 이해를 돕기 위한 **예시 그림**이에요. 실제 화면과 글자가 조금 다를 수 있어요.

## Claude나 ChatGPT 채팅 화면만 쓰는 사람은요?

플러그인 명령(`/clara-muz-team`)은 **Claude 앱의 Code 탭**에서 돌아가요. 일반 채팅 화면에서는 다른 프로그램을 실행할 수 없어서 자동으로 일을 나눌 수 없어요.
대신 이렇게 쓸 수 있어요.

1. Code 탭에서 `/ai-memory handoff` 를 실행하면 인수인계 글이 만들어져요.
2. 그 글을 복사해서 ChatGPT(또는 다른 Claude 채팅)에 붙여넣고 "이어서 해줘"라고 해요.

## 공유 메모장은 어떻게 생겼나요?

[ai-memory](https://github.com/akitaonrails/ai-memory)처럼 **평범한 마크다운 파일**이에요. (`~/.clara-muz/memory/*.md`, Windows는 `C:\Users\내이름\.clara-muz\memory`)
메모장으로 열어 고치거나 git에 올릴 수 있어요. **비밀번호나 개인정보는 적지 마세요.**
ai-memory는 서버와 훅까지 갖춘 별도의 큰 프로젝트이고, ClaraMuz는 그 아이디어(마크다운 메모, 한 번만 가져가는 인수인계)를 가볍게 빌려왔어요. 둘은 서로 독립적이에요.

## 자주 묻는 질문

- **돈이 드나요?** ClaraMuz는 무료예요. Claude와 ChatGPT는 각자 쓰던 구독 그대로예요.
- **Node.js를 깔아야 하나요?** 아니요.
- **Codex 없이도 되나요?** 네. Claude 쪽 기능과 메모장은 돼요.
- **안전한가요?** Codex에게 일을 맡길 때는 읽기 전용이 기본이고, 파일을 고치게 할 때만 쓰기 모드를 써요. 지금 작업 중인 폴더 밖은 건드리지 않도록 지시해요(지시일 뿐, 강제 차단은 아니에요).
- **예전 Node 서버는요?** 고급 사용자용으로 `extras/node-server/`에 남겨뒀어요. 기본 설치에서는 쓰지 않아요.

## 현재 상태 (솔직하게)

v0.5.0. 시험한 것: Claude로 `/ai-memory add`가 메모 파일을 올바른 형식으로 만드는 것(리눅스).
**아직 시험 못 한 것**: `/clara-muz-team` 전체 흐름, 진짜 Codex 실행, Codex 자동 설치 단계, Windows, Claude 데스크톱 앱에서의 플러그인 등록 화면과 입력 방식(앱 버전에 따라 메뉴 이름이 다를 수 있어요).

---

## English

ClaraMuz is a Claude plugin that lets Claude and ChatGPT (Codex) split work and share memory. It is just command files: **no Node.js, no server, no MCP, no API keys**. Install the Claude app and the Codex app, sign in to both, add the plugin.

- `/clara-muz-team <task>`: Claude leads; Claude workers via the Agent tool, GPT workers via `codex exec`; results are verified, not trusted.
- `/ai-memory`: shared plain-markdown notes and one-time handoffs, inspired by [ai-memory](https://github.com/akitaonrails/ai-memory). `handoff` produces a paste-able summary for chat-only use.
- If `codex` is missing, Claude offers to run the official installer after your confirmation.

Install: `/plugin marketplace add Jay-Hyun/ClaraMuz`, then `/plugin install clara-muz@clara-muz`.

Untested: the full `/clara-muz-team` flow, real Codex runs, the auto-install step, Windows, and the desktop app plugin UI. The earlier Node implementation (job tracking, enforced allowed roots, MCP mode) is kept in `extras/node-server/`.

## License

MIT
