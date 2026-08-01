/* ===================== 工作台 Workbench v2 ===================== */
(function () {
  "use strict";

  const LS_KEY = "workbench.data.v1";
  const SB_URL_KEY = "workbench.sb.url";
  const SB_KEY_KEY = "workbench.sb.anon";
  const SB_BOARD_KEY = "workbench.sb.board";
  const SB_PASS_KEY = "workbench.sb.pass";
  const AUTO_KEY = "workbench.sb.auto";
  const THEME_KEY = "workbench.theme";

  const STUDENT_BASE = ["姓名", "学号", "性别", "电话", "备注"];
  const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB — 超过此大小的文件仅本地存档，不同步云端

  // ---------- 非阻塞加载 CDN 库 ----------
  function preloadScript(src) {
    const s = document.createElement("script");
    s.src = src; s.async = true;
    document.head.appendChild(s);
    return new Promise((res) => { s.onload = () => res(true); s.onerror = () => res(false); });
  }
  preloadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
  preloadScript("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js");

  // ---------- 全局错误捕获（调试用）----------
  window.addEventListener("error", (e) => {
    const msg = e.error ? e.error.message + "\n" + (e.error.stack || "") : (e.message || "Unknown error");
    console.error("[Workbench Error]", msg);
    const d = document.createElement("div");
    d.style.cssText = "position:fixed;top:0;left:0;right:0;background:#c00;color:#fff;padding:10px 12px;z-index:99999;font-size:13px;white-space:pre-wrap;word-break:break-all";
    d.textContent = "JS错误: " + msg;
    document.body && document.body.appendChild(d);
  });

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function mkNode(name, color, type) {
    return {
      id: uid(), name: name, color: color || "#4f46e5", type: type || "normal",
      notes: "", items: [], children: [], classes: [],
    };
  }
  // ---------- 韩国高校硕士招生预置数据 ----------
  const KOREAN_UNI_DATA = [
    {
      id: uid(), university: "首尔大学 (Seoul National University)", country: "韩国·首尔",
      program: "全球人才特别选拔（硕/博/硕博连读）",
      majors: "核安全与应急管理、公共健康与环境科学（含辐射防护方向）",
      intake: "2027年3月春季入学", language: "TOPIK 3级+ 或 TOEFL/IELTS（视专业而定）",
      deadline: "网申：2026.07.06-07.09（已截止）｜结果：2026.11公布",
      tuition: "约 500-800万韩元/学期", scholarship: "GSFS奖学金（全额学费+生活费）、SPF奖学金（博士全奖+机票）",
      url: "https://useoul.edu/admission/overview/notice?bbsidx=170633&md=v",
      note: "韩国排名第一，QS全球约31位。核工程系设有核安全与应急管理专项研究方向。",
      updated: "2026-08-01", tags: ["应急管理", "核安全"]
    },
    {
      id: uid(), university: "韩国科学技术院 (KAIST)", country: "韩国·大田",
      program: "国际研究生（硕/硕博连读/博士）",
      majors: "原子能与量子工程（核安全与AI融合方向）",
      intake: "2027年3月春季入学", language: "全英文授课，需TOEFL/IELTS（不接受TOPIK替代）",
      deadline: "网申：2026.08.18-09.01｜推荐信：09.08截止｜结果：2026.12.18公布",
      tuition: "约 2,000万韩元/年（获奖学金可减免）", scholarship: "全额奖学金+月生活费约50万韩元",
      url: "https://gradapply.kaist.ac.kr",
      note: "韩国理工科顶尖，QS全球约90位。核安全与人工智能融合方向为特色交叉学科。",
      updated: "2026-08-01", tags: ["核安全", "应急管理"]
    },
    {
      id: uid(), university: "东义大学 (Dong-A University)", country: "韩国·釜山",
      program: "灾害管理学（硕/博）— 产学研合作项目",
      majors: "灾害管理、公共安全服务融合内容、公共企业安全管理、灾害急救医疗管理",
      intake: "2027年3月春季入学", language: "韩语或英语（需流利）",
      deadline: "待公布（预计2026.10-11月网申）",
      tuition: "约 500万韩元/学期", scholarship: "产学合作奖学金可申请",
      url: "https://www.donga.ac.kr/dms/CMS/Contents/Contents.do?mCode=MN085",
      note: "韩国首个授予「灾害管理」硕博士学位的学科（2017年设立），与釜山消防本部、忠南灾害安全院合作。认可消防行政、消防防灾工程等专业背景。",
      updated: "2026-08-01", tags: ["防灾减灾", "安全管理", "消防"]
    },
    {
      id: uid(), university: "成均馆大学 (Sungkyunkwan University)", country: "韩国·水原/首尔",
      program: "危机·灾害·风险管理跨学科项目（硕/博）",
      majors: "灾害管理、安全管理、城市防灾、风险分析与危机应对",
      intake: "2027年3月春季入学", language: "韩语为主（部分英文课程）",
      deadline: "待公布（预计2026.09-10月网申）",
      tuition: "约 600-800万韩元/学期", scholarship: "韩国公共安全部支持项目，有多种奖学金",
      url: "https://skb.skku.edu/eng_enc/crisis_intro.do",
      note: "由韩国公共安全部（MPSS）支持的跨学科项目，2012年设立，融合工学/人文社科/法学。课程涵盖灾害类型分析、防灾规划、危机应对技术等。",
      updated: "2026-08-01", tags: ["应急管理", "防灾减灾", "安全管理"]
    },
    {
      id: uid(), university: "蔚山大学 (University of Ulsan)", country: "韩国·蔚山",
      program: "安全促进与职业健康（硕士）",
      majors: "职业健康、安全管理、工业通风工程",
      intake: "2027年3月春季入学", language: "全英文授课",
      deadline: "网申截止：2026年11月（预估）",
      tuition: "约 10,200美元/年", scholarship: "有奖学金名额",
      url: "https://www.mastersportal.com/studies/370434/safety-promotion-and-occupational-health.html",
      note: "全英文授课，适合无韩语基础申请者。QS全球排名约3%顶尖大学。",
      updated: "2026-08-01", tags: ["安全管理", "职业健康"]
    },
    {
      id: uid(), university: "蔚山科学技术院 (UNIST)", country: "韩国·蔚山",
      program: "土木·城市·地球与环境工程（硕士）",
      majors: "灾害管理工程（DME）、环境科学与工程、城市基础设施工程",
      intake: "2027年3月春季入学", language: "英文授课（TOEFL/IELTS/TOEIC等）",
      deadline: "网申截止：2026.07.17（已截止）｜下一轮待公布",
      tuition: "约 1,258万韩元/2年", scholarship: "研究型项目多有资助",
      url: "https://gradsmatch.com/programs/ulsan-national-institute-of-science-and-technology/civil-urban-earth-and-environmental-engineering-65361",
      note: "研究型硕士，灾害管理工程为三个方向之一。英文授课，国际学生友好。",
      updated: "2026-08-01", tags: ["防灾减灾", "安全管理"]
    },
    {
      id: uid(), university: "庆北大学 (Gyeongkuk National University)", country: "韩国·安东",
      program: "地震防灾工程（硕士）",
      majors: "结构抗震设计、岩土工程、灾害风险评估",
      intake: "2027年3月/9月（两季招生）", language: "全英文授课",
      deadline: "待公布（预计2026.10月网申）",
      tuition: "免学费（国立大学）", scholarship: "申请费全免",
      url: "https://www.globaladmissions.com/program/earthquake-disaster-prevention-engineering-1/pMGYEM3T0",
      note: "国立大学，全英文授课，无申请费。专注地震防灾与结构抗震。",
      updated: "2026-08-01", tags: ["防灾减灾", "安全管理"]
    },
    {
      id: uid(), university: "汉阳大学 (Hanyang University)", country: "韩国·首尔/安山",
      program: "工程科学硕士（含安全工程方向）",
      majors: "核安全（国家核安全研究生院）、建筑工程、土木与环境系统工程",
      intake: "2027年3月春季入学", language: "TOEFL 80+ 或 IELTS 6.0+",
      deadline: "网申截止：2026.09.19（预估）",
      tuition: "约 3,234万韩元/2年", scholarship: "多种留学生奖学金",
      url: "https://www.hanyang.ac.kr/english",
      note: "设有国家核安全研究生院，提供应急管理硕士课程。QS全球约159位。ERICA校区有产业安全方向。",
      updated: "2026-08-01", tags: ["应急管理", "核安全", "安全管理"]
    },
    {
      id: uid(), university: "嘉泉大学 (Gachon University)", country: "韩国·京畿道",
      program: "设备·消防工学科（硕士）",
      majors: "设备工程、消防工程",
      intake: "2027年3月/9月", language: "TOPIK 3级+ 或 TOEFL 71+/IELTS 5.5+",
      deadline: "提前6个月申请（预计2026.09月网申）",
      tuition: "约 603万韩元/学期", scholarship: "TOPIK 4级减免100%一学期学费，TOPIK 6级减免两学期100%",
      url: "http://sd.yuloo.com/cglx/hgjqdx1238/jianzhang/1592.shtml",
      note: "工科学院下设设备·消防工学科，奖学金丰厚。TOPIK成绩越高减免越多。",
      updated: "2026-08-01", tags: ["消防", "安全管理"]
    },
    {
      id: uid(), university: "庆熙大学 (Kyung Hee University)", country: "韩国·首尔",
      program: "防灾减灾工程及防护工程（硕士）",
      majors: "防灾减灾工程、防护工程",
      intake: "2027年3月/9月", language: "TOPIK 3-4级+ 或英语成绩",
      deadline: "待公布（预计2026.09-10月网申）",
      tuition: "约 1,410万韩元/年（中外合作项目）", scholarship: "多种留学生奖学金",
      url: "https://www.khu.ac.kr/kor/main/index.do",
      note: "设有防灾减灾工程及防护工程专业方向。中外合作办学项目可免联考入学。",
      updated: "2026-08-01", tags: ["防灾减灾", "安全管理"]
    },
  ];

  // ---------- 国内高职资讯预填充数据 ----------
  const DOMESTIC_NEWS_DATA = [
    {
      id: uid(), title: `国务院印发《现代化应急体系建设"十五五"规划》`, source: `国务院`,
      docName: `现代化应急体系建设"十五五"规划`, docNo: `国发〔2026〕15号`,
      pubDate: `2026-05-30`, scope: `全国`, fields: `应急管理、防灾减灾、安全生产、消防安全`,
      coIssuers: `国务院`, url: `https://www.sohu.com/a/1034256288_503494`,
      note: `明确支持应急管理特色高校和职业大学发展，加强高校、科研院所应急管理相关学科专业建设。办好应急管理大学和4所消防救援学院，发展特色优势学科专业集群。鼓励引导高校毕业生到基层应急管理一线就业。`,
      updated: `2026-08-01`, tags: [`国家文件`, `应急管理`, `高职教育`]
    },
    {
      id: uid(), title: `《全民消防安全素质提升行动工作方案(2026—2030年)》`, source: `国家消防救援局`,
      docName: `全民消防安全素质提升行动工作方案(2026—2030年)`, docNo: `消防〔2026〕41号`,
      pubDate: `2026-07-23`, scope: `全国`, fields: `消防安全、宣传教育、应急演练`,
      coIssuers: `国家消防救援局、中央社会工作部、全国总工会、教育部、民政部、人社部、文旅部`,
      url: `http://he.119.gov.cn/2026-07/31/content_9541938.htm`,
      note: `七部门联合印发。要求教育部门将消防教育融入课程与社会实践，常态化开展公开课、职业院校技能大赛等活动。推动学校将消防安全教育融入日常教学。涵盖消防常识普及、基本技能实操实训、疏散自救演练、案例教育警示四大行动。`,
      updated: `2026-08-01`, tags: [`国家文件`, `消防安全`, `教育部`]
    },
    {
      id: uid(), title: `2026年全国应急管理工作会议召开`, source: `应急管理部`,
      docName: `2026年全国应急管理工作会议`, docNo: `—`,
      pubDate: `2026-01-07`, scope: `全国`, fields: `自然灾害防治、安全生产、灾害预警、基层应急管理`,
      coIssuers: `应急管理部`,
      url: `https://www.news.cn/politics/20260107/bf9019f89dee4025963c7ec310be76b6/c.html`,
      note: `2026年应急管理工作重点聚焦自然灾害防治、安全生产、灾害预警、基层应急管理和消防安全治理。将全面完成安全生产治本攻坚三年行动，完善重大事故隐患判定标准。2025年全国生产安全事故起数和死亡人数同比分别下降9.4%、7.7%。`,
      updated: `2026-08-01`, tags: [`应急管理部`, `政策动态`]
    },
    {
      id: uid(), title: `"应急使命·2026"超高层建筑火灾扑救演习新质救援能力征集比测`, source: `应急管理部办公厅`,
      docName: `关于开展"应急使命·2026"超高层建筑火灾扑救演习新质救援能力征集比测的通知`, docNo: `—`,
      pubDate: `2026-07-17`, scope: `全国`, fields: `消防救援、超高层建筑火灾扑救、新质救援能力`,
      coIssuers: `应急管理部办公厅、工业和信息化部办公厅`,
      url: `https://www.mem.gov.cn`,
      note: `应急管理部与工信部联合开展超高层建筑火灾扑救演习新质救援能力征集比测，推动消防救援技术创新和装备升级。`,
      updated: `2026-08-01`, tags: [`应急管理部`, `消防救援`]
    },
    {
      id: uid(), title: `国务院安委会挂牌督办福建泉州"7·9"重大火灾`, source: `国务院安委会`,
      docName: `关于福建泉州"7·9"重大火灾查处挂牌督办的函`, docNo: `—`,
      pubDate: `2026-07-11`, scope: `全国`, fields: `火灾事故查处、安全生产监管`,
      coIssuers: `国务院安委会`,
      url: `https://www.mem.gov.cn`,
      note: `国务院安委会对福建泉州"7·9"重大火灾实行挂牌督办，要求彻查事故原因，严肃追责问责，深刻汲取教训。`,
      updated: `2026-08-01`, tags: [`安全监管`, `火灾事故`]
    },
    {
      id: uid(), title: `《中华人民共和国危险化学品安全法》`, source: `全国人大常委会`,
      docName: `中华人民共和国危险化学品安全法`, docNo: `—`,
      pubDate: `2026-01-28`, scope: `全国`, fields: `危险化学品安全、安全生产`,
      coIssuers: `全国人大常委会`,
      url: `https://www.mem.gov.cn`,
      note: `新修订的危险化学品安全法，加强危险化学品全链条安全监管，对生产、储存、使用、经营、运输各环节提出更严格要求。`,
      updated: `2026-08-01`, tags: [`法律法规`, `安全管理`]
    },
    {
      id: uid(), title: `广西安全工程职业技术学院2026年招生`, source: `广西安全工程职业技术学院`,
      docName: `2026年广西安全工程职业技术学院招生章程`, docNo: `—`,
      pubDate: `2026-06`, scope: `广西`, fields: `安全技术与管理、建筑消防技术、应急救援技术、消防救援技术`,
      coIssuers: `广西教育厅`,
      url: `https://m.dxsbb.com/news/56044.html`,
      note: `全国安全职业教育教学指导委员"消防救援专门委员会"秘书长单位。开设安全技术与管理、建筑消防技术等32个安全应急特色专业。与广西消防救援总队签订战略合作协议，重点推进人才培养、实习实训、就业招录合作。应急救援技术专业群实行准军事化管理。`,
      updated: `2026-08-01`, tags: [`高职院校`, `招生`, `消防`]
    },
    {
      id: uid(), title: `湖南安全技术职业学院2026年应急(消防)救援技术专业招生`, source: `湖南安全技术职业学院`,
      docName: `2026年应急(消防)救援技术专业专科提前批招生方案`, docNo: `—`,
      pubDate: `2026-06`, scope: `湖南`, fields: `应急救援技术、消防救援技术（城市消防/消防通信/消防设施）`,
      coIssuers: `湖南省消防救援总队、湖南安全技术职业学院`,
      url: `https://zs.hnvist.cn/info/1098/12461.htm`,
      note: `与湖南省消防救援总队及各市州支队签订联合培养协议，定向培养政府专职消防员。2026年计划招生745人，专科提前批录取，实行准军事化管理。毕业生定向到户籍所在市州基层消防救援队伍就业。`,
      updated: `2026-08-01`, tags: [`高职院校`, `招生`, `消防`, `定向培养`]
    },
    {
      id: uid(), title: `江西应用工程职业学院"校队"协同应急救援人才培养新模式`, source: `江西应用工程职业学院`,
      docName: `"校隊"协同——应急救援人才培养新范式`, docNo: `—`,
      pubDate: `2025-06-17`, scope: `江西`, fields: `应急救援技术、消防救援技术`,
      coIssuers: `江西应用工程职业学院、江西省矿山救护总队`,
      url: `https://big5.china.com.cn/gate/big5/gx.china.com.cn/2025-06/17/content_43146472.html`,
      note: `江西省首批开设安全类专业的高职院校。与江西省矿山救护总队建立"校队"协同育人机制，共建应急救援实训基地。实行"认知实习—岗位实习—实战演练"三级实践体系。学生技能证书获取率达98%，95%以上取得"应急救援员"国家职业资格证书。承办"一带一路暨金砖国家技能大赛"生产事故应急技术赛项。`,
      updated: `2026-08-01`, tags: [`高职院校`, `人才培养`, `校企合作`]
    },
    {
      id: uid(), title: `浙江安防职业技术学院建筑消防技术专业建设方案`, source: `浙江安防职业技术学院`,
      docName: `建筑消防技术2025级专业学生全面发展计划`, docNo: `专业代码440406`,
      pubDate: `2026-05-27`, scope: `浙江`, fields: `建筑消防技术、消防工程设计施工、消防设施维保检测`,
      coIssuers: `浙江安防职业技术学院`,
      url: `https://www.zjcst.edu.cn/wap/Art/Art_70/Art_70_21837.html`,
      note: `三年制高职专业。面向建筑安装业、消防和应急救援人员等职业，培养消防工程设计与施工、消防系统安装调试维保检测、智慧消防技术应用等高技能人才。对接消防设施操作员证（应急管理部消防局发证）、低压电工证等多项职业资格证书。`,
      updated: `2026-08-01`, tags: [`高职院校`, `消防工程`, `专业建设`]
    },
  ];

  function defaultState() {
    return {
      version: 2,
      tasks: [
        mkNode("待办", "#c9a84c"),
        (function () {
          const p = mkNode("绵飞院", "#3a9b6e");
          p.children = [
            mkNode("教学", "#5b8db8"),
            (function () { const s = mkNode("学生管理", "#2d8659", "students"); s.classes = []; return s; })(),
          ];
          return p;
        })(),
        (function () {
          const p = mkNode("资讯", "#b8c4cc");
          const m = mkNode("硕士申请", "#6b9b7d", "news");
          m.newsType = "korean";
          m.newsItems = KOREAN_UNI_DATA;
          const dz = mkNode("高职资讯", "#7a8a6d", "news");
          dz.newsType = "domestic";
          dz.newsItems = DOMESTIC_NEWS_DATA;
          p.children = [m, dz];
          return p;
        })(),
      ],
      updatedAt: Date.now(),
    };
  }
  function normalize(n) {
    n.id = n.id || uid();
    n.color = n.color || "#4f46e5";
    n.type = n.type || "normal";
    n.notes = n.notes || "";
    n.items = n.items || [];
    n.children = n.children || [];
    n.classes = n.classes || [];
    n.newsItems = n.newsItems || [];
    n.newsType = n.newsType || "korean";
    n.children.forEach(normalize);
    // Ensure each class has columnOrder and hiddenCols
    n.classes.forEach((c) => {
      c.columnOrder = c.columnOrder || [];
      c.hiddenCols = c.hiddenCols || [];
    });
  }
  function loadState() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return defaultState();
      const data = JSON.parse(raw);
      if (!data.tasks || !data.tasks.length) return defaultState();
      data.tasks.forEach(normalize);
      // 迁移：工作 -> 绵飞院，并补齐二级任务
      const slytherinColors = {
        "待办": "#c9a84c", "绵飞院": "#3a9b6e", "教学": "#5b8db8",
        "学生管理": "#2d8659", "资讯": "#b8c4cc", "硕士申请": "#6b9b7d",
        "高职资讯": "#7a8a6d", "咨询": "#b8c4cc"
      };
      data.tasks.forEach((t) => {
        if (slytherinColors[t.name]) t.color = slytherinColors[t.name];
        if (t.name === "工作") {
          t.name = "绵飞院";
          t.color = "#3a9b6e";
          t.children = t.children || [];
          const has = (nm) => t.children.some((c) => c.name === nm);
          if (!has("教学")) t.children.push(mkNode("教学", "#5b8db8"));
          if (!has("学生管理")) { const s = mkNode("学生管理", "#2d8659", "students"); s.classes = []; t.children.push(s); }
          t.children.forEach((c) => { if (slytherinColors[c.name]) c.color = slytherinColors[c.name]; });
        }
        // 迁移：咨询 -> 资讯，并补齐硕士申请、高职资讯子任务
        if (t.name === "咨询") {
          t.name = "资讯";
          t.children = t.children || [];
          const has = (nm) => t.children.some((c) => c.name === nm);
          if (!has("硕士申请")) {
            const m = mkNode("硕士申请", "#6b9b7d", "news");
            m.newsType = "korean";
            m.newsItems = KOREAN_UNI_DATA;
            t.children.push(m);
          }
          if (!has("高职资讯")) {
            const dz = mkNode("高职资讯", "#7a8a6d", "news");
            dz.newsType = "domestic";
            dz.newsItems = DOMESTIC_NEWS_DATA;
            t.children.push(dz);
          }
          t.children.forEach((c) => {
            if (c.name === "硕士申请" && !c.newsType) { c.newsType = "korean"; if (!c.newsItems || !c.newsItems.length) c.newsItems = KOREAN_UNI_DATA; }
            if (slytherinColors[c.name]) c.color = slytherinColors[c.name];
          });
        }
        // 也处理已经是"资讯"但缺少子任务的情况
        if (t.name === "资讯") {
          t.children = t.children || [];
          const hasDZ = t.children.some((c) => c.name === "高职资讯");
          if (!hasDZ) {
            const dz = mkNode("高职资讯", "#7a8a6d", "news");
            dz.newsType = "domestic";
            dz.newsItems = DOMESTIC_NEWS_DATA;
            t.children.push(dz);
          }
          // 确保硕士申请有 newsType
          t.children.forEach((c) => {
            if (c.name === "硕士申请" && !c.newsType) { c.newsType = "korean"; if (!c.newsItems || !c.newsItems.length) c.newsItems = KOREAN_UNI_DATA; }
            if (c.name === "高职资讯" && !c.newsType) { c.newsType = "domestic"; if (!c.newsItems || !c.newsItems.length) c.newsItems = DOMESTIC_NEWS_DATA; }
          });
        }
      });
      return data;
    } catch (e) {
      console.error("加载失败", e);
      return defaultState();
    }
  }

  let state = loadState();
  let currentId = state.tasks[0] ? state.tasks[0].id : null;
  let activeClassId = null;
  let sortCol = null, sortDir = 1, filterText = "";
  const $ = (s) => document.querySelector(s);

  // ---------- 自定义弹窗（替代 prompt/confirm/alert）----------
  function customDialog(opts) {
    return new Promise((resolve) => {
      const modal = $("#dialogModal");
      $("#dialogTitle").textContent = opts.title || "提示";
      const msgEl = $("#dialogMsg");
      const inp = $("#dialogInput");
      const cancelBtn = $("#dialogCancel");
      const okBtn = $("#dialogOk");
      if (opts.message) { msgEl.style.display = ""; msgEl.textContent = opts.message; }
      else { msgEl.style.display = "none"; }
      if (opts.input) {
        inp.hidden = false;
        inp.type = opts.inputType || "text";
        inp.value = opts.inputValue || "";
        inp.placeholder = opts.placeholder || "";
        setTimeout(() => { inp.focus(); inp.select(); }, 60);
      } else { inp.hidden = true; }
      cancelBtn.hidden = opts.showCancel === false;
      okBtn.textContent = opts.okText || "确定";
      cancelBtn.textContent = opts.cancelText || "取消";
      function done(val) {
        modal.hidden = true;
        okBtn.removeEventListener("click", onOk);
        cancelBtn.removeEventListener("click", onCancel);
        inp.removeEventListener("keydown", onKey);
        modal.removeEventListener("click", onBackdrop);
        resolve(val);
      }
      function onOk() { if (opts.input) done(inp.value); else done(true); }
      function onCancel() { done(null); }
      function onKey(e) { if (e.key === "Enter") { e.preventDefault(); onOk(); } if (e.key === "Escape") onCancel(); }
      function onBackdrop(e) { if (e.target === modal) onCancel(); }
      okBtn.addEventListener("click", onOk);
      cancelBtn.addEventListener("click", onCancel);
      inp.addEventListener("keydown", onKey);
      modal.addEventListener("click", onBackdrop);
      modal.hidden = false;
    });
  }
  function customPrompt(message, defaultValue, title) {
    return customDialog({ title: title || "输入", message: message, input: true, inputValue: defaultValue || "", showCancel: true });
  }
  async function customConfirm(message, title) {
    const r = await customDialog({ title: title || "确认", message: message, showCancel: true });
    return r === true || r !== null;
  }
  function customAlert(message, title) {
    return customDialog({ title: title || "提示", message: message, showCancel: false });
  }

  // ---------- 查找 ----------
  function findTask(id, list) {
    list = list || state.tasks;
    for (const n of list) {
      if (n.id === id) return n;
      if (n.children) { const f = findTask(id, n.children); if (f) return f; }
    }
    return null;
  }
  function findParent(id, list, parent) {
    list = list || state.tasks;
    for (const n of list) {
      if (n.id === id) return parent || null;
      if (n.children) { const f = findParent(id, n.children, n); if (f !== undefined && f !== null) return f; }
    }
    return null;
  }
  function currentTask() { return findTask(currentId) || state.tasks[0]; }
  function activeClass() {
    const t = currentTask();
    if (!t || !t.classes) return null;
    return t.classes.find((c) => c.id === activeClassId) || null;
  }

  // ---------- 自动保存 ----------
  let saveTimer = null, toastTimer = null;
  function scheduleSave() {
    state.updatedAt = Date.now();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
      showToast("已保存");
      if (autoSyncEnabled() && cloudReady() && !remoteApplying) pushToCloud(true);
    }, 600);
  }
  function showToast(msg) {
    const t = $("#saveToast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1200);
  }
  function commitEditor() {
    const t = currentTask();
    if (t) t.notes = $("#notesEditor").innerHTML;
  }

  // ---------- 侧边栏（树）----------
  function renderSidebar() {
    const list = $("#taskList");
    list.innerHTML = "";
    state.tasks.forEach((t) => list.appendChild(renderNode(t, 0)));
  }
  function renderNode(node, depth) {
    const wrap = document.createElement("div");
    wrap.className = "task-node";
    const el = document.createElement("div");
    el.className = "task-item" + (node.id === currentId ? " active" : "");
    el.style.paddingLeft = 10 + depth * 16 + "px";
    const hasKids = node.children && node.children.length;
    el.innerHTML =
      '<span class="caret' + (hasKids ? "" : " empty") + '">▾</span>' +
      '<span class="dot" style="background:' + node.color + '"></span>' +
      '<span class="label"></span>';
    el.querySelector(".label").textContent = node.name;
    el.addEventListener("click", (e) => {
      if (e.target.classList.contains("caret")) { wrap.classList.toggle("collapsed"); return; }
      selectTask(node.id);
    });
    wrap.appendChild(el);
    if (hasKids) {
      const sub = document.createElement("div");
      sub.className = "sub-list";
      node.children.forEach((c) => sub.appendChild(renderNode(c, depth + 1)));
      wrap.appendChild(sub);
    }
    return wrap;
  }

  function selectTask(id) {
    commitEditor();
    currentId = id;
    activeClassId = null;
    renderSidebar();
    renderMain();
    closeSidebarMobile();
  }

  // ---------- 主内容 ----------
  function renderMain() {
    const t = currentTask();
    if (!t) return;
    $("#taskView").hidden = false;
    $("#classView").hidden = true;
    $("#taskNameInput").value = t.name;
    const ed = $("#notesEditor");
    ed.innerHTML = t.notes || "";
    ed.setAttribute("data-placeholder", "在这里自由记录 " + t.name + " 的笔记…");
    renderItems(t);
    // 班级管理（仅学生管理类）
    if (t.type === "students") { $("#classesPanel").hidden = false; renderClassCards(t); }
    else $("#classesPanel").hidden = true;
    // 资讯卡片（仅 news 类）
    if (t.type === "news") { $("#newsPanel").hidden = false; renderNewsCards(t); }
    else $("#newsPanel").hidden = true;
    renderFiles(t.id);
  }

  function renderItems(t) {
    const box = $("#itemsList");
    box.innerHTML = "";
    t.items.forEach((it, idx) => {
      const row = document.createElement("div");
      row.className = "item" + (it.done ? " done" : "");
      row.draggable = true;
      row.innerHTML =
        '<span class="handle">⠿</span>' +
        '<input type="checkbox" class="chk"' + (it.done ? " checked" : "") + " />" +
        '<input type="text" class="txt" />' +
        '<button class="del" title="删除">🗑</button>';
      const txt = row.querySelector(".txt");
      txt.value = it.text;
      row.querySelector(".chk").addEventListener("change", (e) => {
        it.done = e.target.checked; row.classList.toggle("done", it.done); scheduleSave();
      });
      txt.addEventListener("input", () => { it.text = txt.value; scheduleSave(); });
      row.querySelector(".del").addEventListener("click", () => {
        t.items.splice(idx, 1); renderItems(t); scheduleSave();
      });
      bindDrag(row, t, idx);
      box.appendChild(row);
    });
  }
  let dragIdx = null;
  function bindDrag(row, t, idx) {
    row.addEventListener("dragstart", () => { dragIdx = idx; row.classList.add("dragging"); });
    row.addEventListener("dragend", () => { row.classList.remove("dragging"); dragIdx = null; });
    row.addEventListener("dragover", (e) => e.preventDefault());
    row.addEventListener("drop", (e) => {
      e.preventDefault();
      if (dragIdx === null || dragIdx === idx) return;
      const moved = t.items.splice(dragIdx, 1)[0];
      t.items.splice(idx, 0, moved);
      renderItems(t); scheduleSave();
    });
  }

  // 任务名 / 重命名 / 删除 / 子任务
  $("#taskNameInput").addEventListener("input", (e) => {
    const t = currentTask(); if (t) { t.name = e.target.value; renderSidebar(); scheduleSave(); }
  });
  $("#renameTaskBtn").addEventListener("click", async () => {
    const t = currentTask(); const name = await customPrompt("重命名任务：", t.name);
    if (name && name.trim()) { t.name = name.trim(); renderSidebar(); renderMain(); scheduleSave(); }
  });
  $("#deleteTaskBtn").addEventListener("click", async () => {
    const t = currentTask();
    const parent = findParent(t.id);
    if (parent && parent.children) {
      if (!await customConfirm('确定删除子任务「' + t.name + '」？')) return;
      parent.children = parent.children.filter((c) => c.id !== t.id);
    } else {
      if (state.tasks.length <= 1) { await customAlert("至少保留一个任务"); return; }
      if (!await customConfirm('确定删除任务「' + t.name + '」？')) return;
      state.tasks = state.tasks.filter((c) => c.id !== t.id);
    }
    currentId = state.tasks[0].id;
    renderSidebar(); renderMain(); scheduleSave();
  });
  $("#addTaskBtn").addEventListener("click", async () => {
    const name = await customPrompt("新的一级任务名称：", "");
    if (!name || !name.trim()) return;
    const colors = ["#3a9b6e", "#c9a84c", "#5b8db8", "#b8c4cc", "#2d8659", "#6b9b7d"];
    const t = mkNode(name.trim(), colors[state.tasks.length % colors.length]);
    state.tasks.push(t); currentId = t.id;
    renderSidebar(); renderMain(); scheduleSave();
  });
  $("#addSubBtn").addEventListener("click", async () => {
    const t = currentTask(); const name = await customPrompt("子任务名称：", "");
    if (!name || !name.trim()) return;
    const colors = ["#5b8db8", "#2d8659", "#c9a84c", "#6b9b7d", "#b8c4cc"];
    const child = mkNode(name.trim(), colors[(t.children ? t.children.length : 0) % colors.length]);
    t.children = t.children || []; t.children.push(child); currentId = child.id;
    renderSidebar(); renderMain(); scheduleSave();
  });

  // 清单项
  function addItem() {
    const t = currentTask(); const inp = $("#newItemInput"); const val = inp.value.trim();
    if (!val) return;
    t.items.push({ id: uid(), text: val, done: false });
    inp.value = ""; renderItems(t); scheduleSave();
  }
  $("#addItemBtn").addEventListener("click", addItem);
  $("#newItemInput").addEventListener("keydown", (e) => { if (e.key === "Enter") addItem(); });

  // 富文本工具栏
  $("#editorToolbar").addEventListener("click", async (e) => {
    const btn = e.target.closest("button"); if (!btn) return;
    const cmd = btn.dataset.cmd;
    $("#notesEditor").focus();
    if (cmd === "createLink") {
      const url = await customPrompt("输入链接地址：", "https://");
      if (url) document.execCommand("createLink", false, url);
    } else if (cmd === "formatBlock") {
      document.execCommand("formatBlock", false, btn.dataset.val);
    } else { document.execCommand(cmd, false, null); }
    scheduleSave();
  });
  $("#notesEditor").addEventListener("input", scheduleSave);

  // ---------- 资讯卡片 ----------
  function renderNewsCards(t) {
    const box = $("#newsCards");
    box.innerHTML = "";
    const items = t.newsItems || [];
    const nt = t.newsType || "korean";
    // 更新面板标题
    const panelLabel = $("#newsPanelLabel");
    if (nt === "domestic") {
      panelLabel.textContent = "国内高职教育资讯（应急管理 / 防灾减灾 / 安全管理 / 消防）";
    } else {
      panelLabel.textContent = "韩国高校硕士招生信息（2027年3月入学）";
    }
    if (!items.length) {
      box.innerHTML = '<p style="color:var(--text-soft);font-size:14px;padding:12px 0">暂无资讯数据。定期爬取任务会自动更新，也可手动添加。</p>';
      return;
    }
    // 不同类型使用不同字段标签和卡片结构
    const fieldConfig = nt === "domestic" ? {
      headTitle: "title", headSub: "source",
      program: "docName",
      fields: [
        ["核心内容", "fields"],
        ["发布日期", "pubDate"],
        ["文号", "docNo"],
        ["适用范围", "scope"],
        ["涉及领域", "fields"],
        ["联合发文", "coIssuers"],
      ],
      linkText: "↗ 查看原文",
    } : {
      headTitle: "university", headSub: "country",
      program: "program",
      fields: [
        ["专业方向", "majors"],
        ["入学时间", "intake"],
        ["语言要求", "language"],
        ["申请截止", "deadline"],
        ["学费", "tuition"],
        ["奖学金", "scholarship"],
      ],
      linkText: "↗ 访问官网",
    };
    items.forEach((item, idx) => {
      const card = document.createElement("div");
      card.className = "news-card tone-" + (idx % 10);
      const tags = (item.tags || []).map((tg) => '<span class="news-tag">' + tg + '</span>').join("");
      card.innerHTML =
        '<div class="news-card-head">' +
          '<div class="news-uni"></div>' +
          '<div class="news-country"></div>' +
        '</div>' +
        '<div class="news-program"></div>' +
        '<div class="news-info"></div>' +
        '<div class="news-tags">' + tags + '</div>' +
        '<div class="news-note"></div>' +
        '<div class="news-actions">' +
          '<span class="news-updated">更新于 ' + (item.updated || "—") + '</span>' +
          '<a class="news-link tool-btn primary" target="_blank" rel="noopener">' + fieldConfig.linkText + '</a>' +
        '</div>';
      card.querySelector(".news-uni").textContent = item[fieldConfig.headTitle] || "";
      card.querySelector(".news-country").textContent = item[fieldConfig.headSub] || "";
      card.querySelector(".news-program").textContent = item[fieldConfig.program] || "";
      const info = card.querySelector(".news-info");
      const fields = fieldConfig.fields;
      info.innerHTML = fields.map(([k, key]) =>
        '<div class="news-field"><span class="nf-label">' + k + '</span><span class="nf-val"></span></div>'
      ).join("");
      info.querySelectorAll(".nf-val").forEach((el, i) => { el.textContent = item[fields[i][1]] || "—"; });
      card.querySelector(".news-note").textContent = item.note || "";
      const link = card.querySelector(".news-link");
      link.href = item.url || "#";
      if (!item.url) link.style.display = "none";
      box.appendChild(card);
    });
  }

  // ---------- 班级管理 ----------
  function renderClassCards(t) {
    const box = $("#classCards"); box.innerHTML = "";
    (t.classes || []).forEach((c) => {
      const card = document.createElement("div");
      card.className = "class-card";
      card.innerHTML = '<div class="cc-name"></div><div class="cc-meta"></div>';
      card.querySelector(".cc-name").textContent = c.name;
      card.querySelector(".cc-meta").textContent = (c.students ? c.students.length : 0) + " 名学生";
      card.addEventListener("click", () => openClass(c.id));
      box.appendChild(card);
    });
  }
  $("#addClassBtn").addEventListener("click", async () => {
    const t = currentTask(); const name = await customPrompt("班级名称：", "");
    if (!name || !name.trim()) return;
    t.classes = t.classes || [];
    t.classes.push({ id: uid(), name: name.trim(), students: [] });
    renderClassCards(t); scheduleSave();
  });
  function openClass(cid) {
    const t = currentTask(); const cls = (t.classes || []).find((c) => c.id === cid);
    if (!cls) return;
    activeClassId = cid; sortCol = null; filterText = "";
    $("#taskView").hidden = true; $("#classView").hidden = false;
    $("#classNameTitle").textContent = t.name + " · " + cls.name;
    $("#studentFilter").value = "";
    $("#colTogglePanel").hidden = true;
    renderStudentTable(cls);
  }
  $("#backClassBtn").addEventListener("click", () => {
    activeClassId = null; $("#classView").hidden = true; $("#taskView").hidden = false; renderMain();
  });

  function computeColumns(cls) {
    const allKeys = new Set();
    cls.students.forEach((s) => Object.keys(s).forEach((k) => { if (k !== "_id") allKeys.add(k); }));
    // Use stored column order from import, fallback to STUDENT_BASE
    let order = (cls.columnOrder && cls.columnOrder.length) ? cls.columnOrder : STUDENT_BASE.slice();
    // Filter to keys that actually exist in student data
    const cols = order.filter((c) => allKeys.has(c));
    // Append any new keys not in stored order
    [...allKeys].sort().forEach((k) => { if (!cols.includes(k)) cols.push(k); });
    // Remove hidden columns
    const hidden = cls.hiddenCols || [];
    return cols.filter((c) => !hidden.includes(c));
  }
  function renderStudentTable(cls) {
    const cols = computeColumns(cls);
    const tbl = $("#studentTable"); tbl.innerHTML = "";
    const thead = document.createElement("thead");
    const htr = document.createElement("tr");
    cols.forEach((c) => {
      const th = document.createElement("th");
      if (c === "姓名") th.classList.add("col-name");
      th.textContent = c + (sortCol === c ? (sortDir > 0 ? " ▲" : " ▼") : "");
      th.addEventListener("click", () => {
        if (sortCol === c) sortDir *= -1; else { sortCol = c; sortDir = 1; }
        renderStudentTable(cls);
      });
      htr.appendChild(th);
    });
    const thOp = document.createElement("th"); thOp.textContent = "操作"; htr.appendChild(thOp);
    thead.appendChild(htr); tbl.appendChild(thead);

    let rows = cls.students.slice();
    if (filterText) {
      const f = filterText.toLowerCase();
      rows = rows.filter((s) => cols.some((c) => (s[c] || "").toString().toLowerCase().includes(f)));
    }
    if (sortCol) {
      rows.sort((a, b) => {
        const x = (a[sortCol] || "").toString(), y = (b[sortCol] || "").toString();
        return x < y ? -sortDir : x > y ? sortDir : 0;
      });
    }
    const tbody = document.createElement("tbody");
    rows.forEach((s) => {
      const tr = document.createElement("tr");
      cols.forEach((c) => {
        const td = document.createElement("td");
        if (c === "姓名") td.classList.add("col-name");
        if (c === "姓名") {
          // 姓名列：可点击链接，打开学生名片
          const link = document.createElement("a");
          link.href = "#"; link.className = "student-name-link";
          link.textContent = s[c] || "（未命名）";
          link.addEventListener("click", (ev) => { ev.preventDefault(); openStudentCard(s._id); });
          td.appendChild(link);
        } else {
          const inp = document.createElement("input");
          inp.value = s[c] || "";
          inp.addEventListener("input", () => { s[c] = inp.value; scheduleSave(); });
          td.appendChild(inp);
        }
        tr.appendChild(td);
      });
      const tdOp = document.createElement("td");
      const cardBtn = document.createElement("button");
      cardBtn.textContent = "🜲"; cardBtn.className = "tool-btn"; cardBtn.style.padding = "4px 8px";
      cardBtn.title = "查看名片";
      cardBtn.addEventListener("click", () => openStudentCard(s._id));
      tdOp.appendChild(cardBtn);
      const del = document.createElement("button");
      del.textContent = "🗑"; del.className = "tool-btn"; del.style.padding = "4px 8px";
      del.addEventListener("click", () => { cls.students = cls.students.filter((x) => x._id !== s._id); renderStudentTable(cls); scheduleSave(); });
      tdOp.appendChild(del); tr.appendChild(tdOp);
      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
  }
  $("#addStudentBtn").addEventListener("click", () => {
    const cls = activeClass(); if (!cls) return;
    cls.students.push({ _id: uid(), 姓名: "" });
    renderStudentTable(cls); scheduleSave();
  });
  $("#studentFilter").addEventListener("input", (e) => {
    filterText = e.target.value; const cls = activeClass(); if (cls) renderStudentTable(cls);
  });
  // 列设置（显示/隐藏列）
  $("#colToggleBtn").addEventListener("click", () => {
    const cls = activeClass(); if (!cls) return;
    const panel = $("#colTogglePanel");
    if (!panel.hidden) { panel.hidden = true; return; }
    const allCols = computeColumns(cls);
    // Also show hidden columns so user can re-enable them
    const hidden = cls.hiddenCols || [];
    // Get full column list (visible + hidden)
    const allKeys = new Set();
    cls.students.forEach((s) => Object.keys(s).forEach((k) => { if (k !== "_id") allKeys.add(k); }));
    const order = (cls.columnOrder && cls.columnOrder.length) ? cls.columnOrder : STUDENT_BASE.slice();
    const fullCols = order.filter((c) => allKeys.has(c));
    [...allKeys].sort().forEach((k) => { if (!fullCols.includes(k)) fullCols.push(k); });
    panel.innerHTML = "";
    fullCols.forEach((c) => {
      const lbl = document.createElement("label");
      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.checked = !hidden.includes(c);
      if (c === "姓名") { chk.checked = true; chk.disabled = true; }
      chk.addEventListener("change", () => {
        cls.hiddenCols = cls.hiddenCols || [];
        if (chk.checked) cls.hiddenCols = cls.hiddenCols.filter((x) => x !== c);
        else cls.hiddenCols.push(c);
        scheduleSave();
        renderStudentTable(cls);
      });
      lbl.appendChild(chk);
      const span = document.createElement("span");
      span.textContent = c;
      lbl.appendChild(span);
      panel.appendChild(lbl);
    });
    panel.hidden = false;
  });
  // Click outside to close column toggle panel
  document.addEventListener("click", (e) => {
    const panel = $("#colTogglePanel");
    if (panel.hidden) return;
    if (!panel.contains(e.target) && e.target.id !== "colToggleBtn") panel.hidden = true;
  });

  // ---------- 学生信息名片 ----------
  function getStudentById(sid) {
    const cls = activeClass();
    if (!cls) return null;
    return cls.students.find((s) => s._id === sid) || null;
  }
  function openStudentCard(sid) {
    const s = getStudentById(sid);
    if (!s) return;
    const cls = activeClass();
    // 构建所有字段列表（含隐藏列）
    const allKeys = new Set();
    cls.students.forEach((st) => Object.keys(st).forEach((k) => { if (k !== "_id" && k !== "_notes") allKeys.add(k); }));
    const order = (cls.columnOrder && cls.columnOrder.length) ? cls.columnOrder : STUDENT_BASE.slice();
    const cols = order.filter((c) => allKeys.has(c));
    [...allKeys].sort().forEach((k) => { if (!cols.includes(k)) cols.push(k); });

    const modal = $("#studentCardModal");
    $("#studentCardName").textContent = s["姓名"] || "（未命名）";
    const fieldsBox = $("#studentCardFields");
    fieldsBox.innerHTML = "";
    cols.forEach((c) => {
      const row = document.createElement("div");
      row.className = "card-field";
      const lbl = document.createElement("label");
      lbl.className = "card-field-label";
      lbl.textContent = c;
      const inp = document.createElement("input");
      inp.className = "card-field-input";
      inp.value = s[c] || "";
      inp.addEventListener("input", () => { s[c] = inp.value; scheduleSave(); if (c === "姓名") $("#studentCardName").textContent = inp.value || "（未命名）"; });
      row.appendChild(lbl); row.appendChild(inp);
      fieldsBox.appendChild(row);
    });

    // 备注栏（碎片信息）
    const notesArea = $("#studentCardNotes");
    notesArea.value = s._notes || "";
    notesArea.oninput = () => { s._notes = notesArea.value; scheduleSave(); };

    // 关闭 & 保存
    const closeCard = () => { modal.hidden = true; renderStudentTable(cls); };
    $("#studentCardClose").onclick = closeCard;
    $("#studentCardOk").onclick = closeCard;
    modal.addEventListener("click", function onBackdrop(e) { if (e.target === modal) { closeCard(); modal.removeEventListener("click", onBackdrop); } });

    modal.hidden = false;
  }

  // ---------- Excel 导入 / 导出 / 模版 ----------
  function downloadBlob(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function importStudents(cls, file) {
    if (typeof XLSX === "undefined") { customAlert("Excel库正在加载中，请稍后重试"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        // Capture header order from the first row of the Excel sheet
        const headerRow = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0 })[0];
        if (headerRow && headerRow.length) {
          cls.columnOrder = headerRow.map((h) => h.toString().trim()).filter((h) => h);
        }
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const map = {};
        cls.students.forEach((s) => { if (s.姓名) map[s.姓名] = s; });
        let added = 0, updated = 0;
        rows.forEach((r) => {
          const name = (r["姓名"] || "").toString().trim();
          if (!name) return;
          const isNew = !map[name];
          const s = map[name] || { _id: uid() };
          Object.keys(r).forEach((k) => { s[k] = (r[k] === undefined || r[k] === null) ? "" : r[k].toString(); });
          map[name] = s;
          isNew ? added++ : updated++;
        });
        cls.students = Object.values(map);
        renderStudentTable(cls); scheduleSave();
        showToast("导入：" + added + " 新增 / " + updated + " 更新");
      } catch (err) {
        customAlert("导入失败：" + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }
  function exportStudents(cls) {
    if (typeof XLSX === "undefined") { customAlert("Excel库正在加载中，请稍后重试"); return; }
    // Export ALL columns (including hidden ones)
    const allKeys = new Set();
    cls.students.forEach((s) => Object.keys(s).forEach((k) => { if (k !== "_id") allKeys.add(k); }));
    const order = (cls.columnOrder && cls.columnOrder.length) ? cls.columnOrder : STUDENT_BASE.slice();
    const cols = order.filter((c) => allKeys.has(c));
    [...allKeys].sort().forEach((k) => { if (!cols.includes(k)) cols.push(k); });
    const data = cls.students.map((s) => { const o = {}; cols.forEach((c) => (o[c] = s[c] || "")); return o; });
    const ws = XLSX.utils.json_to_sheet(data, { header: cols });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "学生");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    downloadBlob(new Blob([out], { type: "application/octet-stream" }), (cls.name || "学生") + "-学生名单.xlsx");
  }
  function downloadTemplate() {
    if (typeof XLSX === "undefined") { customAlert("Excel库正在加载中，请稍后重试"); return; }
    const sample = { 姓名: "张三", 学号: "2024001", 性别: "男", 电话: "13800000000", 备注: "" };
    const ws = XLSX.utils.json_to_sheet([sample], { header: STUDENT_BASE });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "模版");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    downloadBlob(new Blob([out], { type: "application/octet-stream" }), "学生导入模版.xlsx");
  }
  $("#importStudentBtn").addEventListener("click", () => $("#studentFile").click());
  $("#studentFile").addEventListener("change", (e) => {
    const f = e.target.files[0]; const cls = activeClass();
    if (f && cls) importStudents(cls, f);
    e.target.value = "";
  });
  $("#exportStudentBtn").addEventListener("click", () => { const cls = activeClass(); if (cls) exportStudents(cls); });
  $("#tplStudentBtn").addEventListener("click", downloadTemplate);

  // ---------- 文件存档（IndexedDB + Supabase 云端同步）----------
  let fileSyncingFromCloud = false; // 防止云端同步时触发回写循环

  // File <-> Base64 转换
  function fileToBase64(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => {
        const result = r.result; // data:...;base64,XXXX
        const comma = result.indexOf(",");
        res({ mime: result.slice(5, comma), data: result.slice(comma + 1) });
      };
      r.onerror = () => rej(r.error);
      r.readAsDataURL(file);
    });
  }
  function base64ToBlob(b64, mime) {
    try {
      const bin = atob(b64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return new Blob([arr], { type: mime || "" });
    } catch (e) { return new Blob([], { type: "" }); }
  }

  // 云端文件操作
  function fileId(board, taskId, name) { return board + "__" + taskId + "__" + name; }
  async function uploadFileToCloud(taskId, file) {
    if (!cloudReady() || !autoSyncEnabled()) return;
    if (file.size > FILE_SIZE_LIMIT) return; // 超限文件跳过云端
    const client = getSbClient(); if (!client) return;
    try {
      const { mime, data } = await fileToBase64(file);
      const row = {
        id: fileId(boardId(), taskId, file.name),
        board_id: boardId(), task_id: taskId,
        file_name: file.name, file_type: file.type || mime,
        file_size: file.size, file_data: data,
        passcode: passcode(), created_at: new Date().toISOString(),
      };
      const { error } = await client.from("workbench_files").upsert(row);
      if (error) console.error("[File Cloud Upload]", error);
    } catch (e) { console.error("[File Cloud Upload]", e); }
  }
  async function deleteFileFromCloud(taskId, name) {
    if (!cloudReady() || !autoSyncEnabled()) return;
    const client = getSbClient(); if (!client) return;
    try {
      const { error } = await client.from("workbench_files")
        .delete().eq("id", fileId(boardId(), taskId, name));
      if (error) console.error("[File Cloud Delete]", error);
    } catch (e) { console.error("[File Cloud Delete]", e); }
  }
  // 全量同步：云端 → 本地（拉取时调用）
  async function syncFilesFromCloud() {
    if (!cloudReady()) return;
    const client = getSbClient(); if (!client) return;
    try {
      let q = client.from("workbench_files").select("*").eq("board_id", boardId());
      if (passcode()) q = q.eq("passcode", passcode());
      const { data, error } = await q;
      if (error || !data) { console.error("[File Cloud Pull]", error); return; }

      // 构建云端文件集合
      const cloudMap = {};
      data.forEach((row) => { cloudMap[row.task_id + "\u0000" + row.file_name] = row; });

      // 获取本地全部文件
      const localAll = await FM.listAll();
      const localMap = {};
      localAll.forEach((f) => { localMap[f.taskId + "\u0000" + f.name] = f; });

      fileSyncingFromCloud = true;

      // 下载云端有但本地没有的文件
      for (const key in cloudMap) {
        if (!localMap[key]) {
          const cf = cloudMap[key];
          const blob = base64ToBlob(cf.file_data, cf.file_type);
          const file = new File([blob], cf.file_name, {
            type: cf.file_type || "", lastModified: cf.created_at ? new Date(cf.created_at).getTime() : Date.now()
          });
          await FM.add(cf.task_id, file);
        }
      }

      // 删除本地有但云端没有的文件（保持一致）
      for (const key in localMap) {
        if (!cloudMap[key]) {
          const lf = localMap[key];
          await FM.del(lf.taskId, lf.name);
        }
      }

      fileSyncingFromCloud = false;
      // 刷新当前任务文件列表
      const t = currentTask(); if (t) renderFiles(t.id);
    } catch (e) {
      fileSyncingFromCloud = false;
      console.error("[File Cloud Pull]", e);
    }
  }
  // 全量同步：本地 → 云端（手动上传时调用）
  async function syncFilesToCloud() {
    if (!cloudReady()) return;
    const client = getSbClient(); if (!client) return;
    try {
      const localAll = await FM.listAll();
      // 上传所有本地文件
      fileSyncingFromCloud = true;
      for (const f of localAll) {
        const rec = await FM.get(f.taskId, f.name);
        if (rec && rec.blob) {
          const file = rec.blob;
          if (file.size <= FILE_SIZE_LIMIT) {
            const { mime, data } = await fileToBase64(file);
            const row = {
              id: fileId(boardId(), f.taskId, f.name),
              board_id: boardId(), task_id: f.taskId,
              file_name: f.name, file_type: f.type || mime,
              file_size: f.size, file_data: data,
              passcode: passcode(), created_at: new Date().toISOString(),
            };
            await client.from("workbench_files").upsert(row);
          }
        }
      }
      // 查询云端文件，删除本地已不存在的
      let q = client.from("workbench_files").select("id,task_id,file_name").eq("board_id", boardId());
      if (passcode()) q = q.eq("passcode", passcode());
      const { data: cloudFiles } = await q;
      if (cloudFiles) {
        const localSet = new Set(localAll.map((f) => f.taskId + "\u0000" + f.name));
        for (const cf of cloudFiles) {
          if (!localSet.has(cf.task_id + "\u0000" + cf.file_name)) {
            await client.from("workbench_files").delete().eq("id", cf.id);
          }
        }
      }
      fileSyncingFromCloud = false;
    } catch (e) {
      fileSyncingFromCloud = false;
      console.error("[File Cloud Push]", e);
    }
  }

  const FM = {
    dbp: null,
    db() {
      return new Promise((res, rej) => {
        if (FM.dbp) return res(FM.dbp);
        const r = indexedDB.open("wb_files", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("files", { keyPath: ["taskId", "name"] });
        r.onsuccess = () => { FM.dbp = r.result; res(r.result); };
        r.onerror = () => rej(r.error);
      });
    },
    add(taskId, file) {
      return FM.db().then((db) => new Promise((res, rej) => {
        const tx = db.transaction("files", "readwrite");
        tx.objectStore("files").put({ taskId, name: file.name, type: file.type, size: file.size, lastModified: file.lastModified, blob: file });
        tx.oncomplete = () => {
          res();
          // 自动同步到云端（跳过从云端拉取时的回写）
          if (!fileSyncingFromCloud) uploadFileToCloud(taskId, file);
        };
        tx.onerror = () => rej(tx.error);
      }));
    },
    list(taskId) {
      return FM.db().then((db) => new Promise((res, rej) => {
        const tx = db.transaction("files", "readonly"); const out = [];
        const rq = tx.objectStore("files").openCursor();
        rq.onsuccess = (e) => { const c = e.target.result; if (c) { if (c.value.taskId === taskId) out.push(c.value); c.continue(); } else res(out); };
        rq.onerror = () => rej(rq.error);
      }));
    },
    listAll() {
      return FM.db().then((db) => new Promise((res, rej) => {
        const tx = db.transaction("files", "readonly"); const out = [];
        const rq = tx.objectStore("files").openCursor();
        rq.onsuccess = (e) => { const c = e.target.result; if (c) { out.push(c.value); c.continue(); } else res(out); };
        rq.onerror = () => rej(rq.error);
      }));
    },
    get(taskId, name) {
      return FM.db().then((db) => new Promise((res, rej) => {
        const rq = db.transaction("files", "readonly").objectStore("files").get([taskId, name]);
        rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error);
      }));
    },
    del(taskId, name) {
      return FM.db().then((db) => new Promise((res, rej) => {
        const tx = db.transaction("files", "readwrite");
        tx.objectStore("files").delete([taskId, name]);
        tx.oncomplete = () => {
          res();
          if (!fileSyncingFromCloud) deleteFileFromCloud(taskId, name);
        };
        tx.onerror = () => rej(tx.error);
      }));
    },
  };
  function fmtSize(b) { if (b < 1024) return b + " B"; if (b < 1048576) return (b / 1024).toFixed(1) + " KB"; return (b / 1048576).toFixed(1) + " MB"; }
  function renderFiles(taskId) {
    FM.list(taskId).then((files) => {
      const box = $("#fileList"); box.innerHTML = "";
      files.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));
      files.forEach((f) => {
        const row = document.createElement("div");
        row.className = "file-item";
        const d = f.lastModified ? new Date(f.lastModified).toLocaleString() : "";
        row.innerHTML =
          '<span class="fi-name"></span>' +
          '<span class="fi-meta">' + fmtSize(f.size) + " · " + d + "</span>" +
          '<span class="fi-act"><button class="dl" title="下载">⬇</button><button class="rm" title="删除">✕</button></span>';
        row.querySelector(".fi-name").textContent = f.name;
        row.querySelector(".dl").addEventListener("click", () => {
          FM.get(taskId, f.name).then((rec) => { if (rec) downloadBlob(rec.blob, rec.name); });
        });
        row.querySelector(".rm").addEventListener("click", async () => {
          if (await customConfirm("删除文件「" + f.name + "」？")) FM.del(taskId, f.name).then(() => renderFiles(taskId));
        });
        box.appendChild(row);
      });
    }).catch(() => {});
  }
  $("#uploadFileBtn").addEventListener("click", () => $("#fileInput").click());
  $("#fileInput").addEventListener("change", (e) => {
    const files = Array.from(e.target.files); const tid = currentTask().id;
    // 文件大小检查
    const oversized = files.filter((f) => f.size > FILE_SIZE_LIMIT);
    if (oversized.length) {
      const names = oversized.map((f) => f.name + " (" + fmtSize(f.size) + ")").join("、");
      customAlert("以下文件超过 10MB 限制，将仅本地存档不会同步云端：\n" + names);
    }
    let chain = Promise.resolve();
    files.forEach((f) => { chain = chain.then(() => FM.add(tid, f)); });
    chain.then(() => { renderFiles(tid); showToast("已存档 " + files.length + " 个文件"); }).catch(() => customAlert("文件存档失败"));
    e.target.value = "";
  });

  // ---------- 导出 / 导入（整个工作台 JSON）----------
  $("#exportBtn").addEventListener("click", () => {
    commitEditor();
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    downloadBlob(blob, "workbench-" + new Date().toISOString().slice(0, 10) + ".json");
  });
  $("#importBtn").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data.tasks) throw new Error("格式不正确");
        if (!await customConfirm("导入将覆盖当前所有数据，确定继续？")) return;
        state = data; currentId = state.tasks[0].id; activeClassId = null;
        renderSidebar(); renderMain(); scheduleSave(); customAlert("导入成功");
      } catch (err) { customAlert("导入失败：" + err.message); }
    };
    reader.readAsText(file); e.target.value = "";
  });

  // ---------- 移动端抽屉 ----------
  function openSidebarMobile() { $("#sidebar").classList.add("open"); $("#overlay").style.display = "block"; }
  function closeSidebarMobile() { $("#sidebar").classList.remove("open"); $("#overlay").style.display = "none"; }
  $("#menuBtn").addEventListener("click", openSidebarMobile);
  $("#overlay").addEventListener("click", closeSidebarMobile);
  $("#menuMoreBtn").addEventListener("click", () => $("#syncBtn").click());
  $("#sidebarSyncBtn").addEventListener("click", () => $("#syncBtn").click());

  // ---------- 主题 ----------
  function applyTheme(theme) { document.documentElement.setAttribute("data-theme", theme); localStorage.setItem(THEME_KEY, theme); }
  $("#themeBtn").addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    applyTheme(cur === "dark" ? "light" : "dark");
  });

  // ---------- 云端同步（Supabase）----------
  let remoteApplying = false, rtClient = null;
  function cloudReady() { return !!localStorage.getItem(SB_URL_KEY) && !!localStorage.getItem(SB_KEY_KEY); }
  function autoSyncEnabled() { return localStorage.getItem(AUTO_KEY) === "1"; }
  function getSbClient() {
    if (rtClient) return rtClient;
    const url = localStorage.getItem(SB_URL_KEY), key = localStorage.getItem(SB_KEY_KEY);
    if (!url || !key || typeof window.supabase === "undefined") return null;
    rtClient = window.supabase.createClient(url, key);
    return rtClient;
  }
  function boardId() { return localStorage.getItem(SB_BOARD_KEY) || "default"; }
  function passcode() { return localStorage.getItem(SB_PASS_KEY) || ""; }
  function setStatus(msg, type) {
    const s = $("#syncStatus"); s.textContent = msg; s.className = "sync-status" + (type ? " " + type : "");
  }
  async function pushToCloud(silent) {
    if (!cloudReady()) { if (!silent) setStatus("请先填写 Supabase 配置", "err"); return; }
    const client = getSbClient();
    if (!client) { if (!silent) setStatus("Supabase 库未加载（需联网后重试）", "err"); return; }
    try {
      if (!silent) setStatus("正在上传…");
      commitEditor();
      const row = { id: boardId(), data: state, passcode: passcode(), updated_at: new Date().toISOString() };
      const { error } = await client.from("workbench").upsert(row);
      if (error) throw error;
      // 手动上传时同步文件
      if (!silent) { setStatus("正在同步文件…"); await syncFilesToCloud(); }
      subscribeRealtime(client);
      if (!silent) setStatus("已上传到云端 ✓", "ok"); else showToast("已同步云端");
    } catch (e) { if (!silent) setStatus("上传失败：" + (e.message || e), "err"); console.error(e); }
  }
  async function pullFromCloud() {
    if (!cloudReady()) { setStatus("请先填写 Supabase 配置", "err"); return; }
    const client = getSbClient();
    if (!client) { setStatus("Supabase 库未加载（需联网后重试）", "err"); return; }
    try {
      setStatus("正在拉取…");
      let q = client.from("workbench").select("data,updated_at").eq("id", boardId());
      if (passcode()) q = q.eq("passcode", passcode());
      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      if (!data) { setStatus("云端暂无该看板数据，可先上传", ""); return; }
      const incoming = data.data;
      if (!incoming || !incoming.tasks) throw new Error("数据格式异常");
      remoteApplying = true;
      state = incoming; currentId = state.tasks[0].id; activeClassId = null;
      renderSidebar(); renderMain();
      localStorage.setItem(LS_KEY, JSON.stringify(state));
      remoteApplying = false;
      // 同步文件
      setStatus("正在同步文件…");
      await syncFilesFromCloud();
      subscribeRealtime(client);
      setStatus("已从云端拉取 ✓", "ok");
    } catch (e) { remoteApplying = false; setStatus("拉取失败：" + (e.message || e), "err"); }
  }
  let rtSub = null;
  function subscribeRealtime(client) {
    if (rtSub) return;
    try {
      rtSub = client.channel("wb-" + boardId())
        .on("postgres_changes", { event: "*", schema: "public", table: "workbench", filter: "id=eq." + boardId() }, () => {
          if (!remoteApplying) pullFromCloud();
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "workbench_files", filter: "board_id=eq." + boardId() }, () => {
          if (!remoteApplying && !fileSyncingFromCloud) syncFilesFromCloud();
        })
        .subscribe();
    } catch (e) { /* 实时为可选项 */ }
  }
  $("#syncBtn").addEventListener("click", () => {
    $("#sbUrlInput").value = localStorage.getItem(SB_URL_KEY) || "";
    $("#sbKeyInput").value = localStorage.getItem(SB_KEY_KEY) || "";
    $("#sbBoardInput").value = localStorage.getItem(SB_BOARD_KEY) || "default";
    $("#sbPassInput").value = localStorage.getItem(SB_PASS_KEY) || "";
    $("#autoSyncInput").checked = autoSyncEnabled();
    setStatus(cloudReady() ? "已配置，可同步" : "未连接（填写后测试）", cloudReady() ? "ok" : "");
    $("#syncModal").hidden = false;
  });
  $("#syncClose").addEventListener("click", () => ($("#syncModal").hidden = true));
  $("#syncModal").addEventListener("click", (e) => { if (e.target === $("#syncModal")) $("#syncModal").hidden = true; });
  function saveSbConfig() {
    localStorage.setItem(SB_URL_KEY, $("#sbUrlInput").value.trim());
    localStorage.setItem(SB_KEY_KEY, $("#sbKeyInput").value.trim());
    localStorage.setItem(SB_BOARD_KEY, ($("#sbBoardInput").value.trim() || "default"));
    localStorage.setItem(SB_PASS_KEY, $("#sbPassInput").value.trim());
  }
  $("#testBtn").addEventListener("click", async () => {
    saveSbConfig();
    const client = getSbClient();
    if (!client) return setStatus("请填写 URL 与 Anon Key，并保持联网", "err");
    try {
      setStatus("测试中…");
      const { error } = await client.from("workbench").select("id").limit(1);
      if (error) throw error;
      setStatus("连接成功 ✓", "ok");
    } catch (e) { setStatus("连接失败：" + (e.message || e), "err"); }
  });
  $("#pushBtn").addEventListener("click", () => { saveSbConfig(); pushToCloud(false); });
  $("#pullBtn").addEventListener("click", () => { saveSbConfig(); pullFromCloud(); });
  $("#autoSyncInput").addEventListener("change", (e) => {
    localStorage.setItem(AUTO_KEY, e.target.checked ? "1" : "0");
    if (e.target.checked) saveSbConfig();
  });

  // ---------- 初始化 ----------
  function init() {
    try {
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme) applyTheme(savedTheme);
      else applyTheme("dark"); // 默认斯莱特林暗色主题
      renderSidebar(); renderMain();
      if (cloudReady() && autoSyncEnabled()) { const c = getSbClient(); if (c) pullFromCloud(); }
      window.addEventListener("beforeunload", () => { commitEditor(); localStorage.setItem(LS_KEY, JSON.stringify(state)); });
      // 注销旧 Service Worker（之前缓存策略导致按钮失灵，已弃用 SW）
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => { regs.forEach((r) => r.unregister()); }).catch(() => {});
      }
    } catch (err) {
      console.error("[Init Error]", err);
      const d = document.createElement("div");
      d.style.cssText = "position:fixed;top:0;left:0;right:0;background:#c00;color:#fff;padding:10px 12px;z-index:99999;font-size:13px;white-space:pre-wrap";
      d.textContent = "初始化错误: " + (err.message || err);
      document.body && document.body.appendChild(d);
    }
  }
  init();
})();
