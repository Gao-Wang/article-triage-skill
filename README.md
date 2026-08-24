# article-triage 🦞 文章打分收藏 Skill

> 把链接丢给 Agent，让它替你"读 + 判断 + 归档"：抓取内容 → 生成摘要 →
> 按你的兴趣画像打分（0–10）→ 存入 Readeck（多维标签）→ 回复一屏总结。

## 它解决什么问题

刷到喜欢的文章（微信公众号 / GitHub 开源项目 / AI 玩法）时，没时间立即尝试，
只能先收藏。等真正想试时，还要花时间重新"读一遍 + 判断值不值得"。

**这个技能把"读一遍 → 判断"交给 Agent 代劳**：你只需要把链接发给 Agent，
它替你完成摘要、打分、归档，你花 10 秒看结论决定要不要深入。

## 工作流

```
你发链接（mp.weixin.qq.com / github.com / 任意文章URL）
  → 1. 抓取内容（公众号正文 / GitHub README + star 数）
  → 2. 生成 200–300 字摘要
  → 3. 对照兴趣画像打分（0–10）
  → 4. 写入 Readeck，打多维标签
  → 5. 回复一屏总结（标题 / 类型 / 评分 / 标签 / 理由）
```

## 评分档位

| 分数 | 优先级标签 | 说明 |
|------|-----------|------|
| ≥8 | `#高优先` | 很想试 / 很想读 |
| 4–7 | `#稍后读` | 有兴趣，稍后再看 |
| <4 | `#归档` | 低分也保存，容错看走眼 |

## 标签体系（多维）

- **内容域**：`#AI` `#编程` `#工具` `#Agent技能` `#硬件/部署` `#其他`（可按用户领域自定义）
- **优先级**：`#高优先` `#稍后读` `#归档`
- **硬件匹配**：`#可跑Mac` `#可跑Ubuntu`
- Agent 可补充更贴切的具体标签

## 特性

- ✅ **裸链接自动触发**：发链接就全流程执行，无需点名技能
- ✅ **去重**：已存过的链接自动识别，不产生重复条目，可重新评估
- ✅ **静默执行**：回复只展示结论，不暴露命令/代码/脚本细节
- ✅ **每周校准**：说"校准"，Agent 基于 Readeck 强信号（打星/note/标签/删除）提出画像修改建议，你确认后生效、可回滚
- ✅ **隐私优先**：凭据走环境变量，不写死在代码里
- ✅ **标准兼容**：遵循 [agentskills.io](https://agentskills.io) 规范，可在 Hermes / Claude Code 等支持 SKILL.md 的 Agent 间迁移

## 目录结构

```
article-triage/
├── SKILL.md            # 技能主文件（工作流/评分标准/标签体系/校准流程）
├── profile.example.md  # 兴趣画像模板（复制为 profile.md 后填写，不入库）
├── USER.example.md     # 全局触发指令模板（复制为 USER.md，不入库）
└── scripts/
    └── readeck.mjs     # Readeck API 封装（find / add --note / note / delete / list）
```

## 快速开始（Hermes）

### 1. 安装技能

```bash
mkdir -p ~/.hermes/skills/article-triage/scripts
cp SKILL.md ~/.hermes/skills/article-triage/
cp scripts/readeck.mjs ~/.hermes/skills/article-triage/scripts/
chmod +x ~/.hermes/skills/article-triage/scripts/readeck.mjs
```

### 2. 个性化配置（从模板复制，填写后不入库）

```bash
cp profile.example.md ~/.hermes/skills/article-triage/profile.md   # 填写你的兴趣画像
cp USER.example.md ~/.hermes/memories/USER.md                      # 全局触发指令
```

### 3. 配置凭据（`~/.hermes/.env`，权限 600）

```bash
echo -e "\n# article-triage skill: Readeck API\nREADEK_URL=http://<你的Readeck地址>:8080\nREADEK_TOKEN=<你的Readeck令牌>" >> ~/.hermes/.env
chmod 600 ~/.hermes/.env
```

### 4. 微信平台启用 skills 工具集（`~/.hermes/config.yaml`）

```yaml
platform_toolsets:
  weixin:
    - hermes-weixin
    - skills
    - memory
    - session_search
    - clarify
    - todo
    - cronjob
```

### 5. 重启网关

```bash
hermes gateway restart
```

然后在微信里给机器人发一个链接即可。

## 技术栈

- [Hermes Agent](https://github.com/NousResearch/hermes-agent)（Nous Research）
- [Readeck](https://readeck.org) 自托管稍后读服务（REST API）
- [agentskills.io](https://agentskills.io) 技能标准
- Node.js（readeck.mjs 封装脚本，Node 22+）

## 相关文档

- 详细设计方案与 Agent 选型调研过程见提交历史
- 迁移部署：整个 `~/.hermes/skills/article-triage/` + `~/.hermes/memories/USER.md` + `.env` 一起搬走即可
- 个性化文件（`profile.md` / `USER.md` / `.env`）已被 `.gitignore` 忽略，不会随仓库公开

## License

MIT
