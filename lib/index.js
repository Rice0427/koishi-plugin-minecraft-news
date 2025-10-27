var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Config: () => Config,
  apply: () => apply
});
module.exports = __toCommonJS(src_exports);
var import_koishi = require("koishi");
var import_fs = require("fs");
var import_path = __toESM(require("path"));
var StorageManager = class {
  static {
    __name(this, "StorageManager");
  }
  dataDir;
  constructor(ctx) {
    this.dataDir = import_path.default.join(ctx.baseDir, "data", "minecraft-news");
  }
  async ensureDataDir() {
    try {
      await import_fs.promises.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
    }
  }
  async getStoredList(key) {
    await this.ensureDataDir();
    const filePath = import_path.default.join(this.dataDir, `${key}.json`);
    try {
      const data = await import_fs.promises.readFile(filePath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }
  async updateStoredList(key, data) {
    await this.ensureDataDir();
    const filePath = import_path.default.join(this.dataDir, `${key}.json`);
    await import_fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  }
  async isFirstRun(key) {
    const filePath = import_path.default.join(this.dataDir, `${key}.json`);
    try {
      await import_fs.promises.access(filePath);
      return false;
    } catch (error) {
      return true;
    }
  }
};
var Config = import_koishi.Schema.object({
  debug: import_koishi.Schema.boolean().default(false).description("启用调试模式"),
  updateInterval: import_koishi.Schema.number().default(5).description("自动更新间隔（分钟）"),
  enableAutoUpdate: import_koishi.Schema.boolean().default(false).description("启用自动更新推送"),
  enableOfficialNews: import_koishi.Schema.boolean().default(true).description("启用官网新闻推送"),
  enableFeedbackNews: import_koishi.Schema.boolean().default(true).description("启用Feedback新闻推送"),
  broadcastTarget: import_koishi.Schema.string().default("").description("推送目标频道/群组ID，多个用逗号分隔，为空则推送到所有频道")
});
async function fetchLatestNews() {
  try {
    const response = await fetch("https://www.minecraft.net/content/minecraftnet/language-masters/en-us/jcr:content/root/container/image_grid_a_copy_64.articles.page-1.json", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0"
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    const newsItems = [];
    if (data.article_grid && data.article_grid.length > 0) {
      const latestArticle = data.article_grid[0];
      const defaultTile = latestArticle.default_tile;
      if (defaultTile) {
        newsItems.push({
          title: defaultTile.title || "无标题",
          description: defaultTile.sub_header || "无描述",
          image: latestArticle.default_tile?.image?.imageURL ? "https://www.minecraft.net" + latestArticle.default_tile.image.imageURL : "https://www.minecraft.net/favicon.ico",
          link: "https://www.minecraft.net" + (latestArticle.article_url || ""),
          timestamp: "最新",
          category: latestArticle.primary_category || "未分类",
          publishTime: latestArticle.publish_date || "未知时间"
        });
      }
    }
    return newsItems;
  } catch (error) {
    throw new Error(`获取新闻失败: ${error.message}`);
  }
}
__name(fetchLatestNews, "fetchLatestNews");
async function fetchFeedbackNews() {
  const sections = [
    {
      name: "beta",
      url: "https://minecraftfeedback.zendesk.com/api/v2/help_center/en-us/sections/360001185332/articles?per_page=5"
    },
    {
      name: "article",
      url: "https://minecraftfeedback.zendesk.com/api/v2/help_center/en-us/sections/360001186971/articles?per_page=5"
    }
  ];
  const result = { beta: [], article: [] };
  for (const section of sections) {
    try {
      const response = await fetch(section.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0"
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (data.articles) {
        result[section.name] = data.articles.map((article) => ({
          name: article.name,
          html_url: article.html_url,
          created_at: article.created_at
        }));
      }
    } catch (error) {
      throw new Error(`获取Feedback ${section.name}文章失败: ${error.message}`);
    }
  }
  return result;
}
__name(fetchFeedbackNews, "fetchFeedbackNews");
async function smartBroadcast(ctx, message, config, logger) {
  try {
    if (config.broadcastTarget) {
      const targets = config.broadcastTarget.split(",").map((id) => id.trim());
      await ctx.broadcast(targets, message);
      logger.debug(`推送消息到指定目标: ${targets.join(", ")}`);
    } else {
      await ctx.broadcast(message);
      logger.debug("全局广播消息");
    }
  } catch (error) {
    logger.error(`广播消息失败: ${error.message}`);
  }
}
__name(smartBroadcast, "smartBroadcast");
async function checkAndPushUpdates(ctx, storage, logger, config) {
  try {
    if (config.enableOfficialNews) {
      const baseurl = "https://www.minecraft.net";
      const articlesUrl = "https://www.minecraft.net/content/minecraftnet/language-masters/en-us/jcr:content/root/container/image_grid_a_copy_64.articles.page-1.json";
      const articlesResponse = await fetch(articlesUrl);
      if (articlesResponse.ok) {
        const data = await articlesResponse.json();
        const storedTitles = await storage.getStoredList("mcnews");
        const firstRun = await storage.isFirstRun("mcnews");
        if (data.article_grid) {
          const newTitles = [];
          for (const article of data.article_grid) {
            const title = article.default_tile?.title;
            if (title && !storedTitles.includes(title)) {
              if (!firstRun) {
                const desc = article.default_tile?.sub_header || "";
                const articleUrl = article.article_url;
                const link = baseurl + articleUrl;
                const imageUrl = article.default_tile?.image?.imageURL ? "https://www.minecraft.net" + article.default_tile.image.imageURL : null;
                let message = `【Minecraft新闻提醒】发现新文章啦！

🔖 标题：${title}
📝 分类：${article.primary_category || "未分类"}
⏰ 发布时间：${article.publish_date || "未知时间"}
📄 描述：${desc}
🔗 链接：${link}`;
                if (imageUrl) {
                  message += `
🖼️ 配图：${imageUrl}`;
                }
                await smartBroadcast(ctx, message, config, logger);
                logger.info(`推送MC官网文章更新：${title}`);
              }
              newTitles.push(title);
            }
          }
          if (newTitles.length > 0 || firstRun) {
            const updatedTitles = [...storedTitles, ...newTitles];
            await storage.updateStoredList("mcnews", updatedTitles);
            if (firstRun) {
              logger.info("首次运行，初始化官网文章列表完成。");
            }
          }
        }
      }
    }
    if (config.enableFeedbackNews) {
      const feedbackData = await fetchFeedbackNews();
      const feedbackSections = [
        { name: "beta", key: "mcfeedbacknews_beta", displayName: "Beta" },
        { name: "article", key: "mcfeedbacknews_article", displayName: "Article" }
      ];
      for (const section of feedbackSections) {
        const storedTitles = await storage.getStoredList(section.key);
        const firstRun = await storage.isFirstRun(section.key);
        const articles = feedbackData[section.name];
        const newTitles = [];
        for (const article of articles) {
          if (article.name && !storedTitles.includes(article.name)) {
            if (!firstRun) {
              const message = `📝 Minecraft Feedback 发布了新的${section.displayName}文章：
${article.name}
🔗 ${article.html_url}`;
              await smartBroadcast(ctx, message, config, logger);
              logger.info(`推送MC Feedback ${section.displayName}文章更新：${article.name}`);
            }
            newTitles.push(article.name);
          }
        }
        if (newTitles.length > 0 || firstRun) {
          const updatedTitles = [...storedTitles, ...newTitles];
          await storage.updateStoredList(section.key, updatedTitles);
          if (firstRun) {
            logger.info(`首次运行，初始化Feedback ${section.displayName}文章列表完成。`);
          }
        }
      }
    }
  } catch (error) {
    logger.error(`检查更新时出错: ${error.message}`);
  }
}
__name(checkAndPushUpdates, "checkAndPushUpdates");
function apply(ctx, config) {
  const logger = ctx.logger("minecraft-news");
  const storage = new StorageManager(ctx);
  ctx.command("mcversion", "获取我的世界最新版本信息").action(async () => {
    try {
      const response = await fetch("https://news.bugjump.net/apis/versions/latest");
      if (!response.ok) {
        return "获取版本信息失败，请稍后重试。";
      }
      const data = await response.json();
      let message = "📰 我的世界最新版本信息\n\n";
      if (data.release) {
        message += `📦 最新正式版: ${data.release.title}
`;
        message += `类型: ${data.release["version-type"]}
`;
        if (data.release.intro) {
          message += `简介: ${data.release.intro}
`;
        }
        message += `版本号: ${data.release["version-id"]}
`;
        message += `官方链接: ${data.release["official-link"]}
`;
        message += `Wiki: ${data.release["wiki-link"]}
`;
        message += `服务端 JAR: ${data.release["server-jar"]}
`;
        if (data.release.translator) {
          message += `翻译: ${data.release.translator}
`;
        }
        message += "\n";
      }
      if (data.snapshot) {
        message += `📸 最新快照版: ${data.snapshot.title}
`;
        message += `类型: ${data.snapshot["version-type"]}
`;
        if (data.snapshot.intro) {
          message += `简介: ${data.snapshot.intro}
`;
        }
        message += `版本号: ${data.snapshot["version-id"]}
`;
        message += `官方链接: ${data.snapshot["official-link"]}
`;
        message += `Wiki: ${data.snapshot["wiki-link"]}
`;
        message += `服务端 JAR: ${data.snapshot["server-jar"]}
`;
        if (data.snapshot.translator) {
          message += `翻译: ${data.snapshot.translator}
`;
        }
      }
      return message;
    } catch (error) {
      logger.error("获取我的世界版本信息失败:", error);
      return "获取版本信息时发生错误，请稍后重试。";
    }
  });
  ctx.command("mcnews", "获取我的世界最新新闻").action(async () => {
    try {
      const newsItems = await fetchLatestNews();
      logger.info(`获取到 ${newsItems.length} 条新闻`);
      if (newsItems.length === 0) {
        return "未找到新闻内容，请稍后重试。";
      }
      const item = newsItems[0];
      const result = `【Minecraft新闻提醒】发现新文章啦！

🔖 标题：${item.title}
📝 分类：${item.category || "未分类"}
⏰ 发布时间：${item.publishTime || "未知时间"}
📄 描述：${item.description}
🔗 链接：${item.link}`;
      if (item.image && item.image !== "https://www.minecraft.net/favicon.ico") {
        return result + `
[CQ:image,file=${item.image}]`;
      }
      return result;
    } catch (error) {
      logger.error("获取我的世界新闻失败:", error);
      return `获取新闻时发生错误，请稍后重试。错误详情: ${error.message}`;
    }
  });
  ctx.command("mcfeedback", "获取Minecraft Feedback最新文章").action(async () => {
    try {
      const feedbackData = await fetchFeedbackNews();
      let message = "📝 Minecraft Feedback 最新文章\n\n";
      if (feedbackData.beta.length > 0) {
        message += "🔧 Beta 文章:\n";
        feedbackData.beta.slice(0, 3).forEach((article, index) => {
          message += `${index + 1}. ${article.name}
`;
          message += `   🔗 ${article.html_url}
`;
        });
        message += "\n";
      }
      if (feedbackData.article.length > 0) {
        message += "📄 文章:\n";
        feedbackData.article.slice(0, 3).forEach((article, index) => {
          message += `${index + 1}. ${article.name}
`;
          message += `   🔗 ${article.html_url}
`;
        });
      }
      if (feedbackData.beta.length === 0 && feedbackData.article.length === 0) {
        return "未找到Feedback文章内容，请稍后重试。";
      }
      return message;
    } catch (error) {
      logger.error("获取Minecraft Feedback文章失败:", error);
      return `获取Feedback文章时发生错误，请稍后重试。错误详情: ${error.message}`;
    }
  });
  if (config.enableAutoUpdate) {
    ctx.setInterval(async () => {
      await checkAndPushUpdates(ctx, storage, logger, config);
    }, config.updateInterval * 60 * 1e3);
    ctx.on("ready", async () => {
      logger.info("Minecraft News 插件已启动，开始检查更新...");
      await checkAndPushUpdates(ctx, storage, logger, config);
    });
  }
}
__name(apply, "apply");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Config,
  apply
});
