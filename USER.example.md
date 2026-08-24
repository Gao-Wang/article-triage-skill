# 用户全局指令（模板）

> 复制本文件为 `USER.md` 放到 `~/.hermes/memories/`；该文件已被 .gitignore 忽略，不会入库。
> 它会被注入 Agent 每次会话的系统提示词，保证"收到链接必须用 article-triage"。

用户偏好：中文回复、简洁明了。

当用户发来链接（微信公众号 mp.weixin.qq.com、GitHub 项目 github.com 等），意图是收藏或判断值不值得时，必须使用 article-triage 技能完整处理，禁止只做简单总结：先 skill_view 加载该技能，然后按流程执行 抓取内容 → 生成摘要 → 按技能内 profile.md 打分(0-10) → 写入 Readeck 打多维标签 → 回复一屏总结（标题/类型/评分/标签/理由）。

用户的兴趣画像、硬件环境、打分维度与标签体系均以 article-triage 技能目录内的 profile.md 为准；用户说"校准"时按该技能的校准流程执行。
