/**
 * Deterministic LBTI x SBTI x zodiac cross-reading.
 *
 * LBTI remains the analytical core. SBTI and zodiac are optional authored
 * narrative layers: they change presentation and scene texture, never scores.
 */
import { archetypeByCode, dimensionOrder } from '@/data/content';
import { resolvePath, translations, type LanguageCode } from '@/i18n';
import type { ScoreResult } from '@/features/scoring/types';

type L = Record<LanguageCode, string>;
type ZodiacSign = (typeof ZODIAC_SIGNS)[number];
type Axis = 'evidence' | 'risk' | 'tempo' | 'social';
type LbtiMode = 'explorer' | 'builder' | 'verifier' | 'storyteller' | 'guardian' | 'operator';
type SbtiMode = 'private' | 'expressive' | 'cautious' | 'competitive' | 'caretaking' | 'detached';
type ZodiacElement = 'fire' | 'earth' | 'air' | 'water';

export const SBTI_TYPE_OPTIONS = [
  { code: 'CTRL', cn: '拿捏者' },
  { code: 'ATM-er', cn: '送钱者' },
  { code: 'Dior-s', cn: '屌丝' },
  { code: 'BOSS', cn: '领导者' },
  { code: 'THAN-K', cn: '感恩者' },
  { code: 'OH-NO', cn: '哦不人' },
  { code: 'GOGO', cn: '行者' },
  { code: 'SEXY', cn: '尤物' },
  { code: 'LOVE-R', cn: '多情者' },
  { code: 'MUM', cn: '妈妈' },
  { code: 'FAKE', cn: '伪人' },
  { code: 'OJBK', cn: '无所谓人' },
  { code: 'MALO', cn: '吗喽' },
  { code: 'JOKE-R', cn: '小丑' },
  { code: 'WOC!', cn: '握草人' },
  { code: 'THIN-K', cn: '思考者' },
  { code: 'SHIT', cn: '愤世者' },
  { code: 'ZZZZ', cn: '装死者' },
  { code: 'POOR', cn: '贫困者' },
  { code: 'MONK', cn: '僧人' },
  { code: 'IMSB', cn: '傻者' },
  { code: 'SOLO', cn: '孤儿' },
  { code: 'FUCK', cn: '草者' },
  { code: 'DEAD', cn: '死者' },
  { code: 'IMFW', cn: '废物' },
  { code: 'HHHH', cn: '傻乐者' },
  { code: 'DRUNK', cn: '酒鬼' },
] as const;

export const SBTI_TYPES: string[] = SBTI_TYPE_OPTIONS.map((type) => type.code);

export const ZODIAC_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;

const ELEMENT_OF: Record<ZodiacSign, ZodiacElement> = {
  aries: 'fire', leo: 'fire', sagittarius: 'fire',
  taurus: 'earth', virgo: 'earth', capricorn: 'earth',
  gemini: 'air', libra: 'air', aquarius: 'air',
  cancer: 'water', scorpio: 'water', pisces: 'water',
};

const l = (zhCN: string, zhTW: string, en: string): L => ({ 'zh-CN': zhCN, 'zh-TW': zhTW, en });
const pick = (value: L, lang: LanguageCode) => value[lang] ?? value.en;

export const elementOf = (sign: ZodiacSign): ZodiacElement => ELEMENT_OF[sign];
export const isSbtiType = (value: string): boolean => SBTI_TYPES.includes(value);
export const isZodiacSign = (value: string): value is ZodiacSign =>
  (ZODIAC_SIGNS as readonly string[]).includes(value);

export interface CrossReading {
  header: string;
  combinationTitle: string;
  hook: string;
  openingScene: string;
  researchDecision: string;
  experimentDesign: string;
  collaboration: string;
  pressureResponse: string;
  usefulContradiction: string;
  laboratoryRole: string;
  failureMode: string;
  survivalAdvice: string[];
  shareLine: string;
  badges: { label: string; value: string }[];
}

export interface GenerateCrossReadingArgs {
  lbtiType: string;
  sbtiType?: string;
  zodiac?: string;
  language: LanguageCode;
  scores: number[];
  classificationMargin?: number;
}

interface LbtiProfile {
  mode: LbtiMode;
  axis: Axis;
  title: L;
  hook: L;
  evidence: L;
  decision: L;
  design: L;
  collaboration: L;
  pressure: L;
  contradiction: L;
  role: L;
  notForever: L;
  failure: L;
  scene: L;
  share: L;
  advice: [L, L, L];
}

interface SbtiModifier {
  mode: SbtiMode;
  titleAccent: L;
  presentation: L;
  uncertainty: L;
  meeting: L;
  recognition: L;
}

interface ZodiacModifier {
  element: ZodiacElement;
  titleImage: L;
  tempo: L;
  ritual: L;
  pressure: L;
  successStory: L;
}

const LBTI_PROFILES: Record<string, LbtiProfile> = {
  BAYES: core('verifier', 'evidence', '把异常点留到最后的人', '把异常点留到最後的人', 'the one who keeps the outlier until the end',
    '你不会急着删掉坏点，而是先问它是不是另一个机制的入口。', '你不會急著刪掉壞點，而是先問它是不是另一個機制的入口。', 'You do not delete the odd point first; you ask whether it opens another mechanism.',
    '异常点、可信区间和先验假设会立刻抓住你的注意力。', '異常點、可信區間和先驗假設會立刻抓住你的注意力。', 'Outliers, intervals and prior assumptions catch your eye before the headline result.',
    '你会等证据形成形状再下注；直觉可以进门，但必须坐在 Bayesian model 旁边接受盘问。', '你會等證據形成形狀再下注；直覺可以進門，但必須坐在 Bayesian model 旁邊接受盤問。', 'You commit after the evidence has a shape; intuition may enter, but it has to sit beside the Bayesian model.',
    '你先建模型和 sensitivity check，再决定哪个实验值得花样本量。', '你先建模型和 sensitivity check，再決定哪個實驗值得花樣本量。', 'You model and sensitivity-check first, then decide which experiment deserves sample size.',
    '你适合当那个把“看起来很显著”翻译成“我们真的知道多少”的人。', '你適合當那個把「看起來很顯著」翻譯成「我們真的知道多少」的人。', 'You are useful as the person translating “looks significant” into “what do we actually know.”',
    'deadline 逼近时，你会删掉漂亮但脆弱的解释，留下能经得起 source data 的版本。', 'deadline 逼近時，你會刪掉漂亮但脆弱的解釋，留下能經得起 source data 的版本。', 'Near deadline, you cut the elegant fragile story and keep the one source data can survive.',
    '你谨慎，却会被一个解释力很强的小异常诱惑。', '你謹慎，卻會被一個解釋力很強的小異常誘惑。', 'You are cautious, yet very temptable by a small anomaly with explanatory power.',
    '统计审问官', '統計審問官', 'statistical interrogator',
    '不要把你永久放在“帮大家算一下 p 值”的位置。', '不要把你永久放在「幫大家算一下 p 值」的位置。', 'Do not leave you forever as the group’s p-value help desk.',
    '你可能把一个足够能发表的结果审问到失去温度。', '你可能把一個足夠能發表的結果審問到失去溫度。', 'You can interrogate a publishable result until it loses heat.',
    '凌晨两点，你在 notebook 里把一个离群点圈出来，旁边写着“不要删，先问为什么”。', '凌晨兩點，你在 notebook 裡把一個離群點圈出來，旁邊寫著「不要刪，先問為什麼」。', 'At 2 a.m., you circle one outlier in the notebook and write: do not delete; ask why.',
    '你相信重复实验，直到异常结果开始讲一个更好的故事。', '你相信重複實驗，直到異常結果開始講一個更好的故事。', 'You trust replication until the strange result starts telling a better story.'),
  PIPET: core('operator', 'tempo', '手比会议快的人', '手比會議快的人', 'the hands faster than the meeting',
    '别人还在讨论 protocol 名称时，你已经把第一板细胞铺好了。', '別人還在討論 protocol 名稱時，你已經把第一板細胞鋪好了。', 'While others debate the protocol name, you have plated the first cells.',
    '稳定读数、手感异常和批次差异会先进入你的雷达。', '穩定讀數、手感異常和批次差異會先進入你的雷達。', 'Stable readouts, odd handling and batch effects reach your radar first.',
    '你决定得快，但会用重复实验确认手没有骗你。', '你決定得快，但會用重複實驗確認手沒有騙你。', 'You decide quickly, then replicate to make sure your hands did not fool you.',
    '你会先做预实验，把最容易翻车的温度、时间和抗体稀释度压出来。', '你會先做預實驗，把最容易翻車的溫度、時間和抗體稀釋度壓出來。', 'You prototype the fragile parameters: temperature, timing, antibody dilution.',
    '你喜欢靠谱交接：管子标清楚，冰盒别乱放，source data 当天传。', '你喜歡靠譜交接：管子標清楚，冰盒別亂放，source data 當天傳。', 'You trust clean handoffs: labelled tubes, orderly ice boxes, source data uploaded today.',
    '仪器坏掉时，你先判断是不是人、试剂、机器还是 batch effect。', '儀器壞掉時，你先判斷是不是人、試劑、機器還是 batch effect。', 'When equipment fails, you separate person, reagent, machine and batch effect.',
    '你动作很快，但对“不知道为什么成功”没有耐心。', '你動作很快，但對「不知道為什麼成功」沒有耐心。', 'You move fast, but have little patience for success without a reason.',
    '实验台稳定器', '實驗台穩定器', 'bench stabiliser',
    '不要让你无限期接管所有没人愿意优化的实验。', '不要讓你無限期接管所有沒人願意優化的實驗。', 'Do not make you inherit every experiment nobody wants to optimise.',
    '你可能为了让 western blot 变漂亮，把生物学问题追丢。', '你可能為了讓 western blot 變漂亮，把生物學問題追丟。', 'You may chase a prettier western blot until the biological question wanders off.',
    '离心机还在降速，你已经把下一轮稀释梯度写在手套盒旁边。', '離心機還在降速，你已經把下一輪稀釋梯度寫在手套盒旁邊。', 'The centrifuge is still slowing down; your next dilution series is already on the glove box.',
    '你不是迷信手感，你只是知道手感什么时候在报警。', '你不是迷信手感，你只是知道手感什麼時候在報警。', 'You are not superstitious about technique; you know when technique is sounding an alarm.'),
  R2D2: core('operator', 'tempo', '把问题转成脚本的人', '把問題轉成腳本的人', 'the person who turns trouble into a script',
    '只要流程重复两次，你就开始想它为什么还没有自动化。', '只要流程重複兩次，你就開始想它為什麼還沒有自動化。', 'If a step repeats twice, you wonder why it is not automated.',
    '日志、版本、pipeline 断点和不可复现的参数最能引起你警觉。', '日誌、版本、pipeline 斷點和不可重現的參數最能引起你警覺。', 'Logs, versions, pipeline breaks and unreproducible parameters alarm you first.',
    '你不怕换方向，但讨厌没有记录的换方向。', '你不怕換方向，但討厭沒有記錄的換方向。', 'You can change direction; undocumented direction changes irritate you.',
    '你先搭 v1，让数据跑起来，再把脆弱部分换成可维护模块。', '你先搭 v1，讓資料跑起來，再把脆弱部分換成可維護模組。', 'You build v1 so data can move, then replace fragile parts with maintainable modules.',
    '你喜欢异步协作：issue 写清楚，commit 有意义，别把决定埋在聊天记录里。', '你喜歡非同步協作：issue 寫清楚，commit 有意義，別把決定埋在聊天記錄裡。', 'You like asynchronous collaboration: clear issues, meaningful commits, no decisions buried in chat.',
    'reviewer 要求补分析时，你会先问原始数据、环境和脚本能不能重跑。', 'reviewer 要求補分析時，你會先問原始資料、環境和腳本能不能重跑。', 'When reviewers ask for analyses, you first ask whether data, environment and scripts rerun.',
    '你很愿意救火，但容易变成全组默认维修工。', '你很願意救火，但容易變成全組預設維修工。', 'You willingly fight fires and can become the lab’s default repair service.',
    'pipeline 维修员', 'pipeline 維修員', 'pipeline mechanic',
    '不要让你永远维护别人临时写出的半条脚本。', '不要讓你永遠維護別人臨時寫出的半條腳本。', 'Do not leave you maintaining everyone else’s half-script forever.',
    '你可能把项目推进变成工具重构，最后大家忘了最初要回答什么。', '你可能把專案推進變成工具重構，最後大家忘了最初要回答什麼。', 'You can turn progress into tooling until the original question fades.',
    '组会投影还没连上，你已经在本地复现了报错并开了一个 issue。', '組會投影還沒連上，你已經在本地重現了報錯並開了一個 issue。', 'Before the projector connects, you have reproduced the error locally and opened an issue.',
    '别人说“跑一下”，你会问“在哪个环境里跑”。', '別人說「跑一下」，你會問「在哪個環境裡跑」。', 'When someone says “just run it,” you ask “in which environment?”'),
  FIG1: makeProfile('storyteller', 'evidence', '把机制画清楚的人', '把機制畫清楚的人', 'the one who makes the mechanism visible', '你会把混乱结果变成一张别人愿意继续看的 Figure 1。', '你會把混亂結果變成一張別人願意繼續看的 Figure 1。', 'You turn messy findings into a Figure 1 people want to keep reading.', '图例、对照位置和读者第一眼看见什么会决定你的判断。', '圖例、對照位置和讀者第一眼看見什麼會決定你的判斷。', 'Legends, controls and what readers see first shape your judgment.', '图像建筑师', '圖像建築師', 'figure architect'),
  NULL: makeProfile('guardian', 'evidence', '认真对待阴性结果的人', '認真對待陰性結果的人', 'the person who takes negative results seriously', '别人想翻页时，你会问阴性结果是不是最诚实的发现。', '別人想翻頁時，你會問陰性結果是不是最誠實的發現。', 'When others want to move on, you ask whether the negative result is the honest finding.', '缺失的效应、失败的对照和沉默的重复实验会让你停下来。', '缺失的效應、失敗的對照和沉默的重複實驗會讓你停下來。', 'Missing effects, failed controls and quiet replications make you stop.', '阴性结果守门人', '陰性結果守門人', 'negative-result gatekeeper'),
  GIT: makeProfile('builder', 'tempo', '给混乱装版本号的人', '給混亂裝版本號的人', 'the one who puts version numbers on chaos', '你相信早提交，因为没有历史记录的灵感很快会变成事故。', '你相信早提交，因為沒有歷史記錄的靈感很快會變成事故。', 'You commit early because inspiration without history soon becomes an incident.', '文件名、分支、权限和谁改了哪一行会影响你的信任。', '檔名、分支、權限和誰改了哪一行會影響你的信任。', 'Filenames, branches, permissions and authorship history affect your trust.', '版本控制圣骑士', '版本控制聖騎士', 'version-control paladin'),
  EXCEL: makeProfile('operator', 'social', '把数据先收拢的人', '把資料先收攏的人', 'the one who gathers the data first', '你能把散在邮箱、截图和表格里的事实先排成队。', '你能把散在信箱、截圖和表格裡的事實先排成隊。', 'You line up facts scattered across emails, screenshots and spreadsheets.', '表头、缺失值和谁忘了填 batch 会先影响你的心情。', '表頭、缺失值和誰忘了填 batch 會先影響你的心情。', 'Headers, missing values and forgotten batch fields shape your mood first.', '表格巫师', '表格巫師', 'spreadsheet conjurer'),
  OMNI: makeProfile('explorer', 'risk', '给每条支线留门的人', '給每條支線留門的人', 'the one who leaves every branch a door', '你看到一个问题，脑中会同时亮起三个模型、两种实验和一个荒唐但有趣的对照。', '你看到一個問題，腦中會同時亮起三個模型、兩種實驗和一個荒唐但有趣的對照。', 'One question lights up three models, two experiments and one absurd but useful control.', '跨领域的相似结构比单个漂亮结果更吸引你。', '跨領域的相似結構比單個漂亮結果更吸引你。', 'Cross-domain structure attracts you more than a single pretty result.', '什么都想问的探索者', '什麼都想問的探索者', 'omnivorous explorer'),
  NIGHT: makeProfile('explorer', 'tempo', '在凌晨两点突然清醒的人', '在凌晨兩點突然清醒的人', 'the one who becomes lucid at 2 a.m.', '你的最佳想法经常出现在别人准备关电脑之后。', '你的最佳想法經常出現在別人準備關電腦之後。', 'Your best idea often arrives after everyone else is closing laptops.', '夜里重新打开的 notebook 和突然连上的曲线会改变你的路线。', '夜裡重新打開的 notebook 和突然連上的曲線會改變你的路線。', 'A reopened notebook and a curve that suddenly connects can redirect you.', '细胞守夜人', '細胞守夜人', 'night-shift cell watcher'),
  REPRO: makeProfile('verifier', 'evidence', '让结果站稳的人', '讓結果站穩的人', 'the one who makes results stand', '你不反对新故事，但它必须先经得住重复实验。', '你不反對新故事，但它必須先經得住重複實驗。', 'You do not oppose a new story; it has to survive replication first.', '独立重复、盲法分析和 source data 比漂亮摘要更重要。', '獨立重複、盲法分析和 source data 比漂亮摘要更重要。', 'Independent replication, blinded analysis and source data outrank a pretty abstract.', '重复性警察', '重複性警察', 'reproducibility sentinel'),
  TODO: makeProfile('builder', 'tempo', '把下一步写成清单的人', '把下一步寫成清單的人', 'the one who turns next steps into a list', '你未必爱清单，但清单显然很爱你。', '你未必愛清單，但清單顯然很愛你。', 'You may not love lists, but lists clearly love you.', '未完成项、依赖关系和谁卡住谁会先进入你的视野。', '未完成項、依賴關係和誰卡住誰會先進入你的視野。', 'Open tasks, dependencies and who blocks whom enter your view first.', '永远补实验者', '永遠補實驗者', 'permanent follow-up experimenter'),
  ESC: makeProfile('explorer', 'risk', '把失败改成转向的人', '把失敗改成轉向的人', 'the one who turns failure into a redirect', '你不把失败实验当终点，更像把它当导航重新计算。', '你不把失敗實驗當終點，更像把它當導航重新計算。', 'You treat failed experiments less like endings and more like rerouting.',
    '能解释失败原因的线索，比单纯成功更能让你兴奋。', '能解釋失敗原因的線索，比單純成功更能讓你興奮。', 'Clues that explain failure excite you more than simple success.', '战略转向大师', '戰略轉向大師', 'strategic rerouter'),
  MODEL: makeProfile('builder', 'evidence', '先建宇宙再做实验的人', '先建宇宙再做實驗的人', 'the one who builds the universe first', '你会先问系统的结构是什么，再问哪一个实验最省力地撬开它。', '你會先問系統的結構是什麼，再問哪一個實驗最省力地撬開它。', 'You ask what structure the system has before asking which experiment can pry it open.', '参数、边界条件和解释范围比单点读数更有吸引力。', '參數、邊界條件和解釋範圍比單點讀數更有吸引力。', 'Parameters, boundary conditions and explanatory range attract you more than single readouts.', '模型宇宙建造师', '模型宇宙建造師', 'model-universe builder'),
  GRANT: makeProfile('storyteller', 'social', '把愿景翻成预算的人', '把願景翻成預算的人', 'the one who turns desire into budget', '你能把一个松散愿望改写成三年计划和合理预算。', '你能把一個鬆散願望改寫成三年計畫和合理預算。', 'You can turn a loose wish into a three-year plan and plausible budget.', 'milestone、资源和谁能承担哪一块，会影响你怎么看项目。', 'milestone、資源和誰能承擔哪一塊，會影響你怎麼看專案。', 'Milestones, resources and ownership shape how you see a project.', '经费召唤师', '經費召喚師', 'grant summoner'),
  PREPRINT: makeProfile('storyteller', 'risk', '先把半成品推上服务器的人', '先把半成品推上伺服器的人', 'the one who ships the half-finished draft', '你愿意把不成熟的想法变成可讨论的 v1，再用反馈决定它值不值得长大。', '你願意把不成熟的想法變成可討論的 v1，再用回饋決定它值不值得長大。', 'You turn an immature idea into a discussable v1, then let feedback decide whether it grows.', '新曲线、可讲述机制和 preprint 读者会迅速吸走你的注意力。', '新曲線、可講述機制和 preprint 讀者會迅速吸走你的注意力。', 'A new curve, narratable mechanism and preprint audience pull you in quickly.', '预印本冲锋手', '預印本衝鋒手', 'preprint sprinter'),
  SOLO: makeProfile('operator', 'social', '关门后效率最高的人', '關門後效率最高的人', 'the one who works best behind a closed door', '你不是不会合作，只是很多工作在安静里做得更诚实。', '你不是不會合作，只是很多工作在安靜裡做得更誠實。', 'You can collaborate; you just do some work more honestly in quiet.', '独立判断、深工作和不被打断的分析窗口会决定你的产出。', '獨立判斷、深工作和不被打斷的分析窗口會決定你的產出。', 'Independent judgment, deep work and uninterrupted analysis windows decide your output.', '科研孤狼', '科研孤狼', 'solitary analyst'),
  CONTROL: makeProfile('verifier', 'evidence', '先问对照在哪里的人', '先問對照在哪裡的人', 'the one who asks where the control is', '你可以接受坏消息，但不能接受没有对照组的好消息。', '你可以接受壞消息，但不能接受沒有對照組的好消息。', 'You can accept bad news, but not good news without controls.', '阴性对照、阳性对照和 batch effect 是你读图的第一层。', '陰性對照、陽性對照和 batch effect 是你讀圖的第一層。', 'Negative controls, positive controls and batch effects are your first reading layer.', '对照组护法', '對照組護法', 'control guardian'),
  PIPELINE: makeProfile('builder', 'tempo', '把数据河道修好的人', '把資料河道修好的人', 'the one who builds the data channel', '你关心的不只是结果，而是结果能不能稳定地从原始数据走到图。', '你關心的不只是結果，而是結果能不能穩定地從原始資料走到圖。', 'You care not only about results, but whether they travel from raw data to figure reliably.', '输入格式、QC 阈值和自动报告会先决定你的安全感。', '輸入格式、QC 閾值和自動報告會先決定你的安全感。', 'Input formats, QC thresholds and automated reports determine your comfort first.', '流程管线工', '流程管線工', 'pipeline engineer'),
  PI: makeProfile('storyteller', 'social', '把别人项目排成生态的人', '把別人專案排成生態的人', 'the one who arranges projects into an ecosystem', '你会把五条看似无关的支线排成一个 grant 能听懂的生态。', '你會把五條看似無關的支線排成一個 grant 能聽懂的生態。', 'You arrange five unrelated branches into an ecosystem a grant can understand.', '人员、资源和论文窗口会和数据一起进入你的判断。', '人員、資源和論文窗口會和資料一起進入你的判斷。', 'People, resources and publication windows enter your judgment alongside data.', '课题组天气系统', '課題組天氣系統', 'lab weather system'),
  GHOST: makeProfile('operator', 'social', '消失但留下痕迹的人', '消失但留下痕跡的人', 'the one who disappears but leaves traces', '你不一定出现在每次组会，但代码、注释或半张图会突然证明你来过。', '你不一定出現在每次組會，但程式、註解或半張圖會突然證明你來過。', 'You may miss meetings, but a script, note or half-finished figure proves you were there.', '异步证据、个人节奏和低干扰环境最能保护你的产出。', '非同步證據、個人節奏和低干擾環境最能保護你的產出。', 'Asynchronous evidence, private rhythm and low interruption protect your output.', '幽灵合作者', '幽靈合作者', 'ghost collaborator'),
  POLISH: makeProfile('guardian', 'evidence', '把图修到会发光的人', '把圖修到會發光的人', 'the one who polishes the figure until it glows', '你能发现图里那条会让 reviewer 分心的线宽。', '你能發現圖裡那條會讓 reviewer 分心的線寬。', 'You notice the line width that will distract reviewer two.', '排版、source data 对齐和图注里的小漏洞会先刺到你。', '排版、source data 對齊和圖註裡的小漏洞會先刺到你。', 'Layout, source-data alignment and tiny legend gaps prick you first.', '图表抛光师', '圖表拋光師', 'figure polisher'),
};

const SBTI_MODIFIERS: Record<string, SbtiModifier> = {
  CTRL: sbti('cautious', '带着遥控器', '拿著遙控器', 'with a remote control', '你会把表达收束成指令、顺序和停止条件。', '你會把表達收束成指令、順序和停止條件。', 'You compress expression into instructions, order and stop rules.'),
  'ATM-er': sbti('caretaking', '一边付账一边救场', '一邊付帳一邊救場', 'rescuing while paying the bill', '你习惯把别人的焦虑先接过来，再慢慢意识到自己也有实验要做。', '你習慣把別人的焦慮先接過來，再慢慢意識到自己也有實驗要做。', 'You absorb other people’s panic before remembering you have work too.'),
  'Dior-s': sbti('detached', '坐在桶里晒太阳', '坐在桶裡曬太陽', 'sunlit in the barrel', '你会用冷幽默降低场面热度，让野心看起来像一种不太体面的副作用。', '你會用冷幽默降低場面熱度，讓野心看起來像一種不太體面的副作用。', 'Dry humour cools the room and makes ambition look like an embarrassing side effect.'),
  BOSS: sbti('competitive', '像在开项目启动会', '像在開專案啟動會', 'as if launching a project', '你会把不确定性讲成任务分配，大家还没反应过来就已经领了模块。', '你會把不確定性講成任務分配，大家還沒反應過來就已經領了模組。', 'You narrate uncertainty as task allocation; people have modules before they notice.'),
  'THAN-K': sbti('caretaking', '先道谢再推进', '先道謝再推進', 'thanking before pushing', '你把锋利意见包进感谢里，但真正的标准并没有降低。', '你把鋒利意見包進感謝裡，但真正的標準並沒有降低。', 'You wrap sharp feedback in gratitude without lowering the standard.'),
  'OH-NO': sbti('cautious', '随身带着警报器', '隨身帶著警報器', 'carrying an alarm', '你会先想最坏情况，因此也常最早发现那个真的会坏的地方。', '你會先想最壞情況，因此也常最早發現那個真的會壞的地方。', 'You imagine the worst case first, which often finds the part that really will fail.'),
  GOGO: sbti('expressive', '踩着加速踏板', '踩著加速踏板', 'with the accelerator down', '你倾向把想法说出来招人上车，速度本身就是你的说服力。', '你傾向把想法說出來招人上車，速度本身就是你的說服力。', 'You recruit aloud; speed itself becomes your persuasion.'),
  SEXY: sbti('expressive', '把结果讲得有舞台灯', '把結果講得有舞台燈', 'under stage lights', '你会让结果显得值得被看见，也容易对无聊叙事失去耐心。', '你會讓結果顯得值得被看見，也容易對無聊敘事失去耐心。', 'You make results feel visible and lose patience with dull storytelling.'),
  'LOVE-R': sbti('caretaking', '带着关系温度', '帶著關係溫度', 'with relational heat', '你会在合作里投入情绪，既能点燃项目，也容易被冷处理刺到。', '你會在合作裡投入情緒，既能點燃專案，也容易被冷處理刺到。', 'You invest emotionally; it can ignite a project and make silence sting.'),
  MUM: sbti('caretaking', '像实验室临时家长', '像實驗室臨時家長', 'like the lab’s temporary parent', '你会记得谁没吃饭、谁没传数据，以及谁又把枪头盒用空了。', '你會記得誰沒吃飯、誰沒傳資料，以及誰又把槍頭盒用空了。', 'You remember who skipped lunch, who forgot data and who emptied the tips.'),
  FAKE: sbti('private', '戴着一层礼貌面具', '戴著一層禮貌面具', 'behind a polite mask', '你在会上保持体面，真正的判断常在会后私下成形。', '你在會上保持體面，真正的判斷常在會後私下成形。', 'You stay polished in meetings; the real judgment forms after.'),
  OJBK: sbti('detached', '看起来都行', '看起來都行', 'apparently fine with everything', '你表面说都可以，但心里会默默避开最浪费生命的路线。', '你表面說都可以，但心裡會默默避開最浪費生命的路線。', 'You say everything is fine while quietly avoiding the most life-wasting path.'),
  MALO: sbti('expressive', '带一点树枝乱晃', '帶一點樹枝亂晃', 'with branches waving', '你会把严肃判断讲得像临场反应，但里面常有真实观察。', '你會把嚴肅判斷講得像臨場反應，但裡面常有真實觀察。', 'You make serious judgments sound improvised, but there is real observation inside.'),
  'JOKE-R': sbti('expressive', '用玩笑试探边界', '用玩笑試探邊界', 'testing boundaries with jokes', '你用笑话降低风险；如果没人接住，真正的意见也会撤回去。', '你用笑話降低風險；如果沒人接住，真正的意見也會撤回去。', 'Jokes lower the risk; if nobody catches them, the real opinion retreats.'),
  'WOC!': sbti('expressive', '先感叹再分析', '先感嘆再分析', 'exclaiming before analysis', '你对异常的第一反应很响，第二反应通常开始找机制。', '你對異常的第一反應很響，第二反應通常開始找機制。', 'Your first response to anomalies is loud; the second starts looking for mechanism.'),
  'THIN-K': sbti('private', '把脑内会议开很久', '把腦內會議開很久', 'holding a long internal meeting', '你会先在心里推演三轮，才把最能活下来的版本说出口。', '你會先在心裡推演三輪，才把最能活下來的版本說出口。', 'You simulate three rounds internally before speaking the version that survives.'),
  SHIT: sbti('competitive', '带着审稿人二号的眉头', '帶著審稿人二號的眉頭', 'with reviewer two’s eyebrow', '你会先挑破漂亮叙事的洞；这不讨喜，但常常救命。', '你會先挑破漂亮敘事的洞；這不討喜，但常常救命。', 'You puncture pretty stories first; it is not charming, but often saves the work.'),
  ZZZZ: sbti('detached', '像快睡着但没错过重点', '像快睡著但沒錯過重點', 'almost asleep, missing nothing', '你看起来低电量，却会突然指出别人跳过的关键对照。', '你看起來低電量，卻會突然指出別人跳過的關鍵對照。', 'You look low-battery, then point out the skipped control.'),
  POOR: sbti('cautious', '用低预算思维过日子', '用低預算思維過日子', 'thinking in low-budget mode', '你会先问这个实验值不值得消耗试剂、时间和仅剩的耐心。', '你會先問這個實驗值不值得消耗試劑、時間和僅剩的耐心。', 'You ask whether an experiment deserves reagents, time and remaining patience.'),
  MONK: sbti('private', '像在修行', '像在修行', 'like a lab monk', '你能把欲望降到很低，只留下方法、节律和一杯冷掉的茶。', '你能把欲望降到很低，只留下方法、節律和一杯冷掉的茶。', 'You lower desire until only method, rhythm and cold tea remain.'),
  IMSB: sbti('detached', '笨拙但诚实', '笨拙但誠實', 'clumsy but honest', '你表达可能绕路，但对“不懂”这件事比很多人诚实。', '你表達可能繞路，但對「不懂」這件事比很多人誠實。', 'Your expression may wander, but you are unusually honest about not knowing.'),
  SOLO: sbti('private', '把门轻轻关上', '把門輕輕關上', 'quietly closing the door', '你不急着证明自己合群，先把能独立完成的部分做好。', '你不急著證明自己合群，先把能獨立完成的部分做好。', 'You do not rush to prove you are social; you finish the independent part first.'),
  FUCK: sbti('competitive', '带着一点怒气推进', '帶著一點怒氣推進', 'pushed by useful anger', '你对低效和敷衍的耐受度很低，怒气有时会变成推进力。', '你對低效和敷衍的耐受度很低，怒氣有時會變成推進力。', 'You have low tolerance for sloppy work; anger can become thrust.'),
  DEAD: sbti('detached', '像已经下班但还在看图', '像已經下班但還在看圖', 'off-duty but still reading the figure', '你把期待降到最低，于是偶尔能冷静地看见真问题。', '你把期待降到最低，於是偶爾能冷靜地看見真問題。', 'With expectations lowered, you sometimes see the real problem clearly.'),
  IMFW: sbti('cautious', '带着疲惫的自嘲', '帶著疲憊的自嘲', 'with tired self-mockery', '你会把不安全感说成笑话，但真正需要的是可控边界。', '你會把不安全感說成笑話，但真正需要的是可控邊界。', 'You turn insecurity into jokes, while really needing controllable boundaries.'),
  HHHH: sbti('expressive', '用傻乐抵抗崩溃', '用傻樂抵抗崩潰', 'laughing at the cliff edge', '你用笑声拖住场面，直到有人终于承认事情真的需要重做。', '你用笑聲拖住場面，直到有人終於承認事情真的需要重做。', 'You hold the room with laughter until someone admits the work needs doing again.'),
  DRUNK: sbti('expressive', '被异常因子接管', '被異常因子接管', 'hijacked by the anomaly factor', '你的叙事会突然加速，像把白板、组会和保温杯接到同一个电源。', '你的敘事會突然加速，像把白板、組會和保溫杯接到同一個電源。', 'Your narrative accelerates as if the whiteboard, meeting and thermos share one power source.'),
};

const ZODIAC_MODIFIERS: Record<ZodiacSign, ZodiacModifier> = {
  aries: zodiac('fire', '带火星的预实验', '帶火星的預實驗', 'sparked pilot run', '你会先动手，等第一轮数据回来再补一个更漂亮的解释。', '你會先動手，等第一輪資料回來再補一個更漂亮的解釋。', 'You move first and let the first data round earn the explanation.'),
  taurus: zodiac('earth', '稳稳压住离心机', '穩穩壓住離心機', 'steady as a balanced centrifuge', '你喜欢可重复的节奏：同一支笔、同一版 protocol、同一个保存路径。', '你喜歡可重複的節奏：同一支筆、同一版 protocol、同一個儲存路徑。', 'You like repeatable rhythm: same pen, same protocol, same save path.'),
  gemini: zodiac('air', '白板旁边多一支笔', '白板旁邊多一支筆', 'one extra marker at the whiteboard', '你会把一次观察讲成三个可测试方向，听众需要自己系好安全带。', '你會把一次觀察講成三個可測試方向，聽眾需要自己繫好安全帶。', 'You turn one observation into three testable directions; listeners need seatbelts.'),
  cancer: zodiac('water', '冰盒旁边的情绪温度计', '冰盒旁邊的情緒溫度計', 'emotional thermometer beside the ice box', '你会注意数据之外的疲惫、尴尬和谁其实快撑不住了。', '你會注意資料之外的疲憊、尷尬和誰其實快撐不住了。', 'You notice fatigue, awkwardness and who is quietly running out of margin.'),
  leo: zodiac('fire', '组会聚光灯', '組會聚光燈', 'meeting spotlight', '你可以接受失败，但很难接受一个好结果被讲得像库存清单。', '你可以接受失敗，但很難接受一個好結果被講得像庫存清單。', 'You can accept failure, not a good result narrated like inventory.'),
  virgo: zodiac('earth', '图注里的细针', '圖註裡的細針', 'needle in the figure legend', '你会被多余空格、未解释缩写和漏写 n 数刺到。', '你會被多餘空格、未解釋縮寫和漏寫 n 數刺到。', 'Extra spaces, unexplained abbreviations and missing n values prick you.'),
  libra: zodiac('air', '两边都先听完', '兩邊都先聽完', 'hearing both sides first', '你会让冲突先变成可讨论的句子，而不是马上变成立场。', '你會讓衝突先變成可討論的句子，而不是馬上變成立場。', 'You turn conflict into discussable sentences before it hardens into positions.'),
  scorpio: zodiac('water', '盯住关键对照', '盯住關鍵對照', 'locked on the critical control', '你嘴上说只是看看，实际上已经为那条可疑支线建了文件夹。', '你嘴上說只是看看，實際上已經為那條可疑支線建了資料夾。', 'You say you are just checking, while a folder for the suspicious branch already exists.'),
  sagittarius: zodiac('fire', '把门推开一点', '把門推開一點', 'door pushed open', '你会把失败实验讲成下一站地图，哪怕地图还画在餐巾纸上。', '你會把失敗實驗講成下一站地圖，哪怕地圖還畫在餐巾紙上。', 'You narrate failed experiments as a map to the next place, even if drawn on a napkin.'),
  capricorn: zodiac('earth', 'grant 截止日前的日历', 'grant 截止日前的日曆', 'calendar before grant deadline', '你会把热情压进里程碑，让野心看起来像项目管理。', '你會把熱情壓進里程碑，讓野心看起來像專案管理。', 'You press enthusiasm into milestones until ambition looks like management.'),
  aquarius: zodiac('air', '给支线单独开文件夹', '給支線單獨開資料夾', 'separate folder for the side branch', '你对奇怪偏差很宽容，只要它能提出一个更有趣的问题。', '你對奇怪偏差很寬容，只要它能提出一個更有趣的問題。', 'You are tolerant of strange deviations if they ask a better question.'),
  pisces: zodiac('water', '显微镜下的一点戏剧性', '顯微鏡下的一點戲劇性', 'a little drama under the microscope', '你可以接受实验失败，但很难接受失败得毫无叙事结构。', '你可以接受實驗失敗，但很難接受失敗得毫無敘事結構。', 'You can accept experimental failure, but not failure without narrative structure.'),
};

const NEUTRAL_SBTI: SbtiModifier = sbti('private', '不额外加戏', '不額外加戲', 'without extra theatre', '你让 LBTI 核心直接说话，少一层外部人设滤镜。', '你讓 LBTI 核心直接說話，少一層外部人設濾鏡。', 'You let the LBTI core speak with one fewer external persona filter.');
const NEUTRAL_ZODIAC: ZodiacModifier = zodiac('earth', '无星座滤镜', '無星座濾鏡', 'without star-sign garnish', '节奏来自你的 LBTI 分数本身，而不是额外的戏剧装饰。', '節奏來自你的 LBTI 分數本身，而不是額外的戲劇裝飾。', 'The tempo comes from the LBTI scores themselves, not extra dramatic garnish.');

const LBTI_SBTI_INTERACTIONS: Record<LbtiMode, Record<SbtiMode, L>> = {
  explorer: {
    private: l('你会先私下测试不合群的想法，等它有两轮数据再拿出来。', '你會先私下測試不合群的想法，等它有兩輪資料再拿出來。', 'You test the unconventional idea privately until it has two rounds of data.'),
    expressive: l('你会把支线讲成邀请函，让别人还没看完图就想加入。', '你會把支線講成邀請函，讓別人還沒看完圖就想加入。', 'You make side branches sound like invitations before people finish reading the figure.'),
    cautious: l('你不会一开始押注高风险方案；但一旦异常重复出现，会迅速切换成追踪新机制。', '你不會一開始押注高風險方案；但一旦異常重複出現，會迅速切換成追蹤新機制。', 'You do not bet on risk immediately; repeated anomalies flip you into mechanism-chasing.'),
    competitive: l('你把未知当挑战，容易把一个控制实验升级成公开擂台。', '你把未知當挑戰，容易把一個控制實驗升級成公開擂台。', 'You treat the unknown as a challenge and can turn a control experiment into a public contest.'),
    caretaking: l('你会带着别人一起冒险，先确认每个人知道自己负责哪一段。', '你會帶著別人一起冒險，先確認每個人知道自己負責哪一段。', 'You bring others into the risk, after making sure everyone knows their part.'),
    detached: l('你表面像随便看看，实际上已经把新机制的文件夹建好了。', '你表面像隨便看看，實際上已經把新機制的資料夾建好了。', 'You look casual, but the new-mechanism folder already exists.'),
  },
  builder: {
    private: l('你会安静地把 v1 搭好，等流程能跑再接受意见。', '你會安靜地把 v1 搭好，等流程能跑再接受意見。', 'You quietly build v1 and accept comments once the workflow runs.'),
    expressive: l('你会边搭流程边招呼大家上车，动量来得很快。', '你會邊搭流程邊招呼大家上車，動量來得很快。', 'You build while recruiting; momentum arrives early.'),
    cautious: l('你的计划很整齐，但每一步都要有失败出口。', '你的計畫很整齊，但每一步都要有失敗出口。', 'Your plan is orderly, with failure exits built into each step.'),
    competitive: l('你会把里程碑变成比赛，进度条本身开始有压迫感。', '你會把里程碑變成比賽，進度條本身開始有壓迫感。', 'You turn milestones into a contest; the progress bar becomes pressure.'),
    caretaking: l('你喜欢把责任写清楚，因为照顾项目也包括照顾人。', '你喜歡把責任寫清楚，因為照顧專案也包括照顧人。', 'You write ownership clearly because caring for a project includes caring for people.'),
    detached: l('你看起来不急，实际已经把依赖关系排成了隐藏甘特图。', '你看起來不急，實際已經把依賴關係排成了隱藏甘特圖。', 'You look unhurried; a hidden Gantt chart already exists.'),
  },
  verifier: {
    private: l('你会先补对照，不急着宣布怀疑；证据够硬时才开口。', '你會先補對照，不急著宣布懷疑；證據夠硬時才開口。', 'You add controls before announcing doubt; you speak when evidence is hard enough.'),
    expressive: l('你会把复现要求讲得很响，让房间知道漂亮结果还没过关。', '你會把重現要求講得很響，讓房間知道漂亮結果還沒過關。', 'You say the replication requirement loudly enough for the room to hear.'),
    cautious: l('你和风险保持距离，直到对照组允许你靠近。', '你和風險保持距離，直到對照組允許你靠近。', 'You keep risk at a distance until the control group permits approach.'),
    competitive: l('你会把方法标准抬高，像在和 reviewer two 提前对打。', '你會把方法標準抬高，像在和 reviewer two 提前對打。', 'You raise methodological standards as if sparring with reviewer two early.'),
    caretaking: l('你会保护团队不被假阳性带跑，也会保护学生不被一句“重做”压垮。', '你會保護團隊不被假陽性帶跑，也會保護學生不被一句「重做」壓垮。', 'You protect the team from false positives and students from being crushed by “redo it.”'),
    detached: l('你冷静得像不在乎，其实只是把感情留到 source data 之后。', '你冷靜得像不在乎，其實只是把感情留到 source data 之後。', 'You seem detached because emotion waits until after source data.'),
  },
  storyteller: {
    private: l('你先把故事藏在草稿里，等图和逻辑站稳再给别人看。', '你先把故事藏在草稿裡，等圖和邏輯站穩再給別人看。', 'You hide the story in a draft until figures and logic stand.'),
    expressive: l('你能让一个初步结果获得注意，也容易太早给它起标题。', '你能讓一個初步結果獲得注意，也容易太早給它起標題。', 'You can make early data visible, and may title it too soon.'),
    cautious: l('你会把雄心包装成技术改进，让大胆故事先穿实验服。', '你會把雄心包裝成技術改進，讓大膽故事先穿實驗服。', 'You package ambition as a technical improvement so the bold story wears a lab coat.'),
    competitive: l('你会把叙事变成战场：谁的模型能解释更多，谁就先上 Figure 1。', '你會把敘事變成戰場：誰的模型能解釋更多，誰就先上 Figure 1。', 'You turn narrative into a contest: the model explaining more earns Figure 1.'),
    caretaking: l('你会替项目找一个别人愿意相信的入口，而不是只追求炫目。', '你會替專案找一個別人願意相信的入口，而不是只追求炫目。', 'You find the project an entrance people can trust, not just admire.'),
    detached: l('你像不在意传播，其实已经默默删掉了最无聊的三版标题。', '你像不在意傳播，其實已經默默刪掉了最無聊的三版標題。', 'You seem indifferent to communication while quietly deleting three dull titles.'),
  },
  guardian: {
    private: l('你会私下修补漏洞，直到必须公开指出问题。', '你會私下修補漏洞，直到必須公開指出問題。', 'You patch holes privately until the problem has to be named aloud.'),
    expressive: l('你会把小问题讲得很具体，让大家无法继续假装没看见。', '你會把小問題講得很具體，讓大家無法繼續假裝沒看見。', 'You make small problems concrete enough that nobody can keep pretending.'),
    cautious: l('你的谨慎会叠加，形成一套很厚的防翻车系统。', '你的謹慎會疊加，形成一套很厚的防翻車系統。', 'Your caution compounds into a thick anti-disaster system.'),
    competitive: l('你会为了标准开战，尤其当别人想把漏洞塞进 supplement。', '你會為了標準開戰，尤其當別人想把漏洞塞進 supplement。', 'You fight for standards, especially when someone hides gaps in the supplement.'),
    caretaking: l('你会照顾人，但不会因此放过关键错误。', '你會照顧人，但不會因此放過關鍵錯誤。', 'You care for people without excusing critical errors.'),
    detached: l('你把情绪降到最低，用 checklist 慢慢把问题逼出来。', '你把情緒降到最低，用 checklist 慢慢把問題逼出來。', 'You lower the emotional volume and let the checklist expose the issue.'),
  },
  operator: {
    private: l('你更愿意先把事情做完，再让结果替你解释。', '你更願意先把事情做完，再讓結果替你解釋。', 'You prefer to finish the work and let the result explain you.'),
    expressive: l('你会边做边讲，让实验台变成临时直播间。', '你會邊做邊講，讓實驗台變成臨時直播間。', 'You narrate while doing; the bench becomes a temporary broadcast desk.'),
    cautious: l('你动手快，但会给每一步留一个可回退版本。', '你動手快，但會給每一步留一個可回退版本。', 'You move fast with a rollback version at every step.'),
    competitive: l('你会把执行力变成压迫感，别人刚说“可以试试”，你已经开始排程。', '你會把執行力變成壓迫感，別人剛說「可以試試」，你已經開始排程。', 'Your execution becomes pressure; by “we could try,” you are scheduling.'),
    caretaking: l('你习惯把别人漏掉的步骤补上，但要小心这变成默认义务。', '你習慣把別人漏掉的步驟補上，但要小心這變成預設義務。', 'You fill missed steps for others; beware it becoming your default duty.'),
    detached: l('你看似低调，却会把关键步骤悄悄做成最稳的版本。', '你看似低調，卻會把關鍵步驟悄悄做成最穩的版本。', 'You look low-key while quietly making the critical step robust.'),
  },
};

const LBTI_ZODIAC_INTERACTIONS: Record<LbtiMode, Record<ZodiacElement, L>> = {
  explorer: elementMap('火象把你的探索推向预实验；土象逼你写停止规则；风象让支线先变成白板图；水象会让异常带上情绪重量。', '火象把你的探索推向預實驗；土象逼你寫停止規則；風象讓支線先變成白板圖；水象會讓異常帶上情緒重量。', 'Fire pushes exploration into pilots; earth asks for stop rules; air turns branches into whiteboard maps; water gives anomalies emotional weight.'),
  builder: elementMap('火象让计划多一个临时侧实验；土象让流程更像铁路；风象把依赖关系讲清楚；水象提醒你人也会成为瓶颈。', '火象讓計畫多一個臨時側實驗；土象讓流程更像鐵路；風象把依賴關係講清楚；水象提醒你人也會成為瓶頸。', 'Fire adds one side experiment; earth rails the workflow; air clarifies dependencies; water reminds you people can be bottlenecks.'),
  verifier: elementMap('火象会催你早点挑战结论；土象要求每个判断落到记录；风象让你把标准讲给全组听；水象让你特别在意谁被错误结果伤到。', '火象會催你早點挑戰結論；土象要求每個判斷落到記錄；風象讓你把標準講給全組聽；水象讓你特別在意誰被錯誤結果傷到。', 'Fire challenges conclusions early; earth records every judgment; air broadcasts standards; water notices who false results hurt.'),
  storyteller: elementMap('火象给故事速度；土象给它骨架；风象给它听众；水象给它记忆点。', '火象給故事速度；土象給它骨架；風象給它聽眾；水象給它記憶點。', 'Fire gives the story speed; earth gives bones; air gives audience; water gives a memorable pulse.'),
  guardian: elementMap('火象让你更早说“不行”；土象让标准落到清单；风象把分歧变成规则讨论；水象让你保护结果也保护人。', '火象讓你更早說「不行」；土象讓標準落到清單；風象把分歧變成規則討論；水象讓你保護結果也保護人。', 'Fire says no earlier; earth makes standards into lists; air turns disputes into rule-talk; water protects results and people.'),
  operator: elementMap('火象让你先跑第一轮；土象让你稳住手法；风象让你边做边解释；水象让你留意疲惫如何影响操作。', '火象讓你先跑第一輪；土象讓你穩住手法；風象讓你邊做邊解釋；水象讓你留意疲憊如何影響操作。', 'Fire runs round one; earth steadies technique; air explains while doing; water notices how fatigue affects handling.'),
};

const SBTI_ZODIAC_INTERACTIONS: Record<SbtiMode, Record<ZodiacElement, L>> = {
  private: elementMap('你不会抢第一个发言，但一旦关键对照被忽略，会突然变得很清醒。', '你不會搶第一個發言，但一旦關鍵對照被忽略，會突然變得很清醒。', 'You do not grab the first word, but ignored controls wake you up sharply.'),
  expressive: elementMap('你的表达会给项目加速，也可能让还没站稳的结果提前上台。', '你的表達會給專案加速，也可能讓還沒站穩的結果提前上台。', 'Your expression accelerates the project and may put early results on stage too soon.'),
  cautious: elementMap('你会把戏剧性压成风险清单，直到数据证明值得放大。', '你會把戲劇性壓成風險清單，直到資料證明值得放大。', 'You compress drama into a risk list until data earns amplification.'),
  competitive: elementMap('你容易把会议变成方法标准的擂台，赢不赢另说，大家会醒。', '你容易把會議變成方法標準的擂台，贏不贏另說，大家會醒。', 'You can turn meetings into a methods arena; win or not, everyone wakes up.'),
  caretaking: elementMap('你会替项目保温，也会替人保温，风险是没人记得给你换冰盒。', '你會替專案保溫，也會替人保溫，風險是沒人記得給你換冰盒。', 'You keep the project and people warm; the risk is nobody changes your ice box.'),
  detached: elementMap('你用距离感减小噪音，偶尔也会让别人误以为你不在乎。', '你用距離感減小噪音，偶爾也會讓別人誤以為你不在乎。', 'Distance reduces noise, and sometimes convinces people you do not care.'),
};

const TRIPLE_OVERRIDES: { mode: LbtiMode; sbti: SbtiMode; element: ZodiacElement; text: L }[] = [
  { mode: 'explorer', sbti: 'cautious', element: 'fire', text: l('这里最有趣的矛盾是：你会先把安全网织好，然后突然跳得很远。', '這裡最有趣的矛盾是：你會先把安全網織好，然後突然跳得很遠。', 'The best contradiction here: you weave the safety net first, then jump surprisingly far.') },
  { mode: 'verifier', sbti: 'expressive', element: 'air', text: l('你不是单纯挑刺；你会把复现标准说成全组都能跟上的公共语言。', '你不是單純挑刺；你會把重現標準說成全組都能跟上的公共語言。', 'You are not merely nitpicking; you make replication standards a shared language.') },
  { mode: 'storyteller', sbti: 'private', element: 'earth', text: l('这个组合会把标题藏很久，但一旦拿出来，通常已经有图、有逻辑、有备份数据。', '這個組合會把標題藏很久，但一旦拿出來，通常已經有圖、有邏輯、有備份資料。', 'This combination hides the title for a long time, but when it appears it has figures, logic and backup data.') },
  { mode: 'operator', sbti: 'caretaking', element: 'water', text: l('你最容易成为“大家都放心交给你”的人，所以必须提前写清边界。', '你最容易成為「大家都放心交給你」的人，所以必須提前寫清邊界。', 'You can become the person everyone safely hands things to, so boundaries need writing early.') },
];

function core(
  mode: LbtiMode,
  axis: Axis,
  titleCN: string,
  titleTW: string,
  titleEN: string,
  hookCN: string,
  hookTW: string,
  hookEN: string,
  evidenceCN: string,
  evidenceTW: string,
  evidenceEN: string,
  decisionCN: string,
  decisionTW: string,
  decisionEN: string,
  designCN: string,
  designTW: string,
  designEN: string,
  collaborationCN: string,
  collaborationTW: string,
  collaborationEN: string,
  pressureCN: string,
  pressureTW: string,
  pressureEN: string,
  contradictionCN: string,
  contradictionTW: string,
  contradictionEN: string,
  roleCN: string,
  roleTW: string,
  roleEN: string,
  notForeverCN: string,
  notForeverTW: string,
  notForeverEN: string,
  failureCN: string,
  failureTW: string,
  failureEN: string,
  sceneCN: string,
  sceneTW: string,
  sceneEN: string,
  shareCN: string,
  shareTW: string,
  shareEN: string,
): LbtiProfile {
  return {
    mode,
    axis,
    title: l(titleCN, titleTW, titleEN),
    hook: l(hookCN, hookTW, hookEN),
    evidence: l(evidenceCN, evidenceTW, evidenceEN),
    decision: l(decisionCN, decisionTW, decisionEN),
    design: l(designCN, designTW, designEN),
    collaboration: l(collaborationCN, collaborationTW, collaborationEN),
    pressure: l(pressureCN, pressureTW, pressureEN),
    contradiction: l(contradictionCN, contradictionTW, contradictionEN),
    role: l(roleCN, roleTW, roleEN),
    notForever: l(notForeverCN, notForeverTW, notForeverEN),
    failure: l(failureCN, failureTW, failureEN),
    scene: l(sceneCN, sceneTW, sceneEN),
    share: l(shareCN, shareTW, shareEN),
    advice: defaultAdvice(axis),
  };
}

function makeProfile(mode: LbtiMode, axis: Axis, titleCN: string, titleTW: string, titleEN: string, hookCN: string, hookTW: string, hookEN: string, evidenceCN: string, evidenceTW: string, evidenceEN: string, roleCN: string, roleTW: string, roleEN: string): LbtiProfile {
  return core(
    mode, axis, titleCN, titleTW, titleEN, hookCN, hookTW, hookEN, evidenceCN, evidenceTW, evidenceEN,
    `你会先让证据和当前问题对齐；如果直觉和数据冲突，${hookCN}`,
    `你會先讓證據和目前問題對齊；如果直覺和資料衝突，${hookTW}`,
    `You first align evidence with the current question; when intuition and data conflict, ${hookEN.charAt(0).toLowerCase()}${hookEN.slice(1)}`,
    '你通常先做能暴露关键风险的预实验，再决定是复制、优化、建模还是写进正文。',
    '你通常先做能暴露關鍵風險的預實驗，再決定是複製、最佳化、建模還是寫進正文。',
    'You usually run the pilot that exposes the key risk, then decide whether to replicate, optimise, model or write.',
    '你和合作者相处时最看重明确交接：谁负责哪张图、哪份 source data、哪条 reviewer response。',
    '你和合作者相處時最看重明確交接：誰負責哪張圖、哪份 source data、哪條 reviewer response。',
    'With collaborators, you value explicit handoffs: who owns which figure, source data and reviewer response.',
    '压力上来时，你会先把最能保住主线的步骤留下，其他想法暂时放进 parking lot。',
    '壓力上來時，你會先把最能保住主線的步驟留下，其他想法暫時放進 parking lot。',
    'Under pressure, you keep the steps that protect the main line and park the rest.',
    '你的矛盾在于既想把事情做漂亮，又知道科研经常只允许先做出可检查的版本。',
    '你的矛盾在於既想把事情做漂亮，又知道科研經常只允許先做出可檢查的版本。',
    'Your contradiction is wanting elegant work while knowing research often needs an inspectable version first.',
    roleCN, roleTW, roleEN,
    '不要让你长期承担所有“顺手也帮一下”的杂活。',
    '不要讓你長期承擔所有「順手也幫一下」的雜活。',
    'Do not let you permanently absorb every “while you are at it” task.',
    '你可能在支线、细节或善后里消耗太久，导致主问题没有及时关口。',
    '你可能在支線、細節或善後裡消耗太久，導致主問題沒有及時關口。',
    'You can spend too long in branches, details or cleanup and delay closing the main question.',
    `一个普通组会里，${hookCN}`,
    `一個普通組會裡，${hookTW}`,
    `In an ordinary group meeting, ${hookEN.charAt(0).toLowerCase()}${hookEN.slice(1)}`,
    hookCN,
    hookTW,
    hookEN,
  );
}

function defaultAdvice(axis: Axis): [L, L, L] {
  const common = l('在开始第三个支线前，写下当前 manuscript 的最小 Figure 清单。', '在開始第三個支線前，寫下目前 manuscript 的最小 Figure 清單。', 'Before opening a third branch, write the minimum figure list for the current manuscript.');
  const ownership = l('让合作者用文字确认样本、脚本、图和 reviewer response 的归属。', '讓合作者用文字確認樣本、腳本、圖和 reviewer response 的歸屬。', 'Ask collaborators to confirm ownership of samples, scripts, figures and reviewer responses in writing.');
  const byAxis: Record<Axis, L> = {
    evidence: l('先定义什么证据足以改变结论，再开始补实验。', '先定義什麼證據足以改變結論，再開始補實驗。', 'Define what evidence would change the conclusion before adding experiments.'),
    risk: l('把“有趣异常”和“当前正文范围”分开放进两个列表。', '把「有趣異常」和「目前正文範圍」分開放進兩個清單。', 'Keep “interesting anomaly” and “current manuscript scope” in separate lists.'),
    tempo: l('给预实验设置停止规则，不要让 v1 自动长成 v9。', '給預實驗設定停止規則，不要讓 v1 自動長成 v9。', 'Set a stop rule for pilots so v1 does not quietly become v9.'),
    social: l('组会结束前确认谁做决定、谁做执行、谁只是提供意见。', '組會結束前確認誰做決定、誰做執行、誰只是提供意見。', 'Before the meeting ends, confirm who decides, who executes and who only advises.'),
  };
  return [byAxis[axis], ownership, common];
}

function sbti(mode: SbtiMode, titleCN: string, titleTW: string, titleEN: string, presentationCN: string, presentationTW: string, presentationEN: string): SbtiModifier {
  return {
    mode,
    titleAccent: l(titleCN, titleTW, titleEN),
    presentation: l(presentationCN, presentationTW, presentationEN),
    uncertainty: uncertaintyByMode(mode),
    meeting: meetingByMode(mode),
    recognition: recognitionByMode(mode),
  };
}

function zodiac(element: ZodiacElement, titleCN: string, titleTW: string, titleEN: string, tempoCN: string, tempoTW: string, tempoEN: string): ZodiacModifier {
  return {
    element,
    titleImage: l(titleCN, titleTW, titleEN),
    tempo: l(tempoCN, tempoTW, tempoEN),
    ritual: ritualByElement(element),
    pressure: pressureByElement(element),
    successStory: successByElement(element),
  };
}

function elementMap(cn: string, tw: string, en: string): Record<ZodiacElement, L> {
  return { fire: l(cn, tw, en), earth: l(cn, tw, en), air: l(cn, tw, en), water: l(cn, tw, en) };
}

function uncertaintyByMode(mode: SbtiMode): L {
  return ({
    private: l('不确定时，你会先把怀疑放进私人 notebook，而不是立刻丢到组会上。', '不確定時，你會先把懷疑放進私人 notebook，而不是立刻丟到組會上。', 'When uncertain, you put doubt into a private notebook before bringing it to meeting.'),
    expressive: l('不确定性会被你讲出来试压，房间反应本身也成为数据。', '不確定性會被你講出來試壓，房間反應本身也成為資料。', 'You pressure-test uncertainty aloud; the room’s reaction becomes data.'),
    cautious: l('不确定性会先被拆成风险、备选解释和最小验证步骤。', '不確定性會先被拆成風險、備選解釋和最小驗證步驟。', 'Uncertainty becomes risks, alternative explanations and a minimal validation step.'),
    competitive: l('不确定会激起你的胜负心：要么证明它错，要么证明别人低估了它。', '不確定會激起你的勝負心：要麼證明它錯，要麼證明別人低估了它。', 'Uncertainty wakes your competitive streak: prove it wrong or prove others underestimated it.'),
    caretaking: l('不确定时，你会先确认它会不会拖累合作者、学生或样本窗口。', '不確定時，你會先確認它會不會拖累合作者、學生或樣本窗口。', 'When uncertain, you check whether it will hurt collaborators, students or sample windows.'),
    detached: l('不确定性会被你降噪处理：少表态，多观察，等模式自己露出来。', '不確定性會被你降噪處理：少表態，多觀察，等模式自己露出來。', 'You denoise uncertainty: speak less, observe more, wait for the pattern.'),
  })[mode];
}

function meetingByMode(mode: SbtiMode): L {
  return ({
    private: l('组会上你不抢话，但会在别人忽略关键约束时补上一句。', '組會上你不搶話，但會在別人忽略關鍵約束時補上一句。', 'In meetings, you do not grab airtime, but add the missing constraint.'),
    expressive: l('组会上你会把想法摊开，让别人能立刻反对、补充或加入。', '組會上你會把想法攤開，讓別人能立刻反對、補充或加入。', 'In meetings, you spread ideas out so people can object, add or join.'),
    cautious: l('组会上你会问“如果这个假设错了，我们最先在哪里发现？”', '組會上你會問「如果這個假設錯了，我們最先在哪裡發現？」', 'In meetings, you ask where the hypothesis would fail first.'),
    competitive: l('组会上你容易把模糊建议追问到必须负责的程度。', '組會上你容易把模糊建議追問到必須負責的程度。', 'In meetings, you chase vague suggestions until someone owns them.'),
    caretaking: l('组会上你会注意沉默的人，也会替混乱的任务找落点。', '組會上你會注意沉默的人，也會替混亂的任務找落點。', 'In meetings, you notice silent people and give messy tasks a landing place.'),
    detached: l('组会上你像在省电模式，但关键漏洞会让你突然开机。', '組會上你像在省電模式，但關鍵漏洞會讓你突然開機。', 'In meetings, you look in low-power mode until a key flaw boots you up.'),
  })[mode];
}

function recognitionByMode(mode: SbtiMode): L {
  return ({
    private: l('被认可时你不会大张旗鼓，但会更愿意把下一版拿出来。', '被認可時你不會大張旗鼓，但會更願意把下一版拿出來。', 'Recognition does not make you loud, but it makes the next version easier to show.'),
    expressive: l('被认可会让你加速；被忽略时，你可能直接把 Figure 6 画到白板上。', '被認可會讓你加速；被忽略時，你可能直接把 Figure 6 畫到白板上。', 'Recognition accelerates you; if ignored, you may draw Figure 6 on the board.'),
    cautious: l('被认可不会让你立刻放松，你更想知道还有哪条风险没被点名。', '被認可不會讓你立刻放鬆，你更想知道還有哪條風險沒被點名。', 'Recognition does not relax you; you want the unnamed risk.'),
    competitive: l('被忽略会让你更想证明方法标准不是装饰。', '被忽略會讓你更想證明方法標準不是裝飾。', 'Being ignored makes you prove that standards are not decoration.'),
    caretaking: l('被认可时你常把功劳分出去；被忽略久了会开始默默撤退。', '被認可時你常把功勞分出去；被忽略久了會開始默默撤退。', 'You distribute credit when recognised; ignored too long, you retreat quietly.'),
    detached: l('认可和忽略都不会立刻改变表情，但会改变你下次愿不愿意出现。', '認可和忽略都不會立刻改變表情，但會改變你下次願不願意出現。', 'Recognition or neglect may not change your face, but changes whether you show up next time.'),
  })[mode];
}

function ritualByElement(element: ZodiacElement): L {
  return ({
    fire: l('你的实验仪式是先跑起来，再在白板前补路线图。', '你的實驗儀式是先跑起來，再在白板前補路線圖。', 'Your ritual is to start the run, then fill the route map at the whiteboard.'),
    earth: l('你的实验仪式是检查标签、路径和 calendar，然后才允许自己兴奋。', '你的實驗儀式是檢查標籤、路徑和 calendar，然後才允許自己興奮。', 'Your ritual is checking labels, paths and calendar before allowing excitement.'),
    air: l('你的实验仪式是把想法讲一遍，听它在空气里哪里变形。', '你的實驗儀式是把想法講一遍，聽它在空氣裡哪裡變形。', 'Your ritual is saying the idea aloud and hearing where it deforms.'),
    water: l('你的实验仪式是看一眼数据，再看一眼房间里谁开始紧张。', '你的實驗儀式是看一眼資料，再看一眼房間裡誰開始緊張。', 'Your ritual is reading the data, then reading who in the room tenses.'),
  })[element];
}

function pressureByElement(element: ZodiacElement): L {
  return ({
    fire: l('压力越近，你越想把最关键的那一轮先跑出来。', '壓力越近，你越想把最關鍵的那一輪先跑出來。', 'As pressure nears, you want the key run done first.'),
    earth: l('压力越近，你越依赖清单、版本和确定的交付边界。', '壓力越近，你越依賴清單、版本和確定的交付邊界。', 'As pressure nears, you lean on lists, versions and delivery boundaries.'),
    air: l('压力越近，你越需要把选择说清楚，否则脑内分支会开太多。', '壓力越近，你越需要把選擇說清楚，否則腦內分支會開太多。', 'As pressure nears, choices need saying aloud or branches multiply.'),
    water: l('压力越近，你越容易读到人际暗流，也越需要保护自己的边界。', '壓力越近，你越容易讀到人際暗流，也越需要保護自己的邊界。', 'As pressure nears, you read undercurrents and need stronger boundaries.'),
  })[element];
}

function successByElement(element: ZodiacElement): L {
  return ({
    fire: l('成功故事会被你讲成一次及时点火。', '成功故事會被你講成一次及時點火。', 'Success becomes a story of timely ignition.'),
    earth: l('成功故事会被你讲成终于按计划落地。', '成功故事會被你講成終於按計畫落地。', 'Success becomes a story of finally landing the plan.'),
    air: l('成功故事会被你讲成一次好问题找到好听众。', '成功故事會被你講成一次好問題找到好聽眾。', 'Success becomes a good question finding good listeners.'),
    water: l('成功故事会被你讲成某个差点被忽略的信号终于被听见。', '成功故事會被你講成某個差點被忽略的訊號終於被聽見。', 'Success becomes a nearly ignored signal finally being heard.'),
  })[element];
}

function scoreLean(scores: number[], id: string): 'high' | 'low' | 'middle' {
  const idx = dimensionOrder.indexOf(id);
  const value = idx >= 0 ? scores[idx] : 50;
  if (value >= 62) return 'high';
  if (value <= 38) return 'low';
  return 'middle';
}

function scoreDetail(scores: number[], lang: LanguageCode): string {
  const risk = scoreLean(scores, 'safe_risk');
  const launch = scoreLean(scores, 'launch_iteration');
  const collab = scoreLean(scores, 'team_independent');
  const copy: Record<LanguageCode, Record<string, string>> = {
    'zh-CN': {
      highRisk: '你的风险分数偏高，所以系统会允许更多预实验和支线，但不会替它们自动进入正文。',
      lowRisk: '你的风险分数偏低，所以新方向需要先通过小样本、低成本的验证门槛。',
      midRisk: '你的风险分数居中，真正的分水岭不是敢不敢冒险，而是何时停止追加条件。',
      launch: launch === 'high' ? '你更愿意先发出 v1，再让反馈修正路线。' : launch === 'low' ? '你更愿意先把证据攒够，再公开移动。' : '你会在启动和迭代之间来回校准。',
      collab: collab === 'high' ? '合作对你来说是加速器。' : collab === 'low' ? '独立工作能保护你的判断。' : '你需要合作和独处轮流出现。',
    },
    'zh-TW': {
      highRisk: '你的風險分數偏高，所以系統會允許更多預實驗和支線，但不會替它們自動進入正文。',
      lowRisk: '你的風險分數偏低，所以新方向需要先通過小樣本、低成本的驗證門檻。',
      midRisk: '你的風險分數居中，真正的分水嶺不是敢不敢冒險，而是何時停止追加條件。',
      launch: launch === 'high' ? '你更願意先發出 v1，再讓回饋修正路線。' : launch === 'low' ? '你更願意先把證據攢夠，再公開移動。' : '你會在啟動和迭代之間來回校準。',
      collab: collab === 'high' ? '合作對你來說是加速器。' : collab === 'low' ? '獨立工作能保護你的判斷。' : '你需要合作和獨處輪流出現。',
    },
    en: {
      highRisk: 'Your risk score is high, so pilots and branches are allowed, but they do not automatically enter the manuscript.',
      lowRisk: 'Your risk score is low, so new directions need a small, cheap validation gate first.',
      midRisk: 'Your risk score sits in the middle; the real split is not whether to risk, but when to stop adding conditions.',
      launch: launch === 'high' ? 'You prefer shipping v1 and letting feedback correct the route.' : launch === 'low' ? 'You prefer gathering evidence before moving publicly.' : 'You calibrate between launch and iteration.',
      collab: collab === 'high' ? 'Collaboration is an accelerator for you.' : collab === 'low' ? 'Independent work protects your judgment.' : 'You need collaboration and solitude in alternation.',
    },
  };
  const riskKey = risk === 'high' ? 'highRisk' : risk === 'low' ? 'lowRisk' : 'midRisk';
  return `${copy[lang][riskKey]} ${copy[lang].launch} ${copy[lang].collab}`;
}

function labName(code: string, lang: LanguageCode): string {
  const value = resolvePath(translations[lang], `archetypes.${code}.name`);
  return typeof value === 'string' ? value : code;
}

function zodiacName(sign: string | null, lang: LanguageCode): string {
  if (!sign || !isZodiacSign(sign)) {
    const none = resolvePath(translations[lang], 'cross.noneShort');
    return typeof none === 'string' ? none : '-';
  }
  const value = resolvePath(translations[lang], `cross.zodiac.${sign}`);
  return typeof value === 'string' ? value : sign;
}

export function sbtiLabel(sbti: string): string {
  const type = SBTI_TYPE_OPTIONS.find((option) => option.code === sbti);
  return type ? `${type.code}（${type.cn}）` : '';
}

function composeHeader(lbtiType: string, sbtiType: string, zodiac: string | null, lang: LanguageCode): string {
  return `${lbtiType} ${labName(lbtiType, lang)} x ${sbtiLabel(sbtiType) || pick(l('未指定 SBTI', '未指定 SBTI', 'No SBTI'), lang)} x ${zodiacName(zodiac, lang)}`;
}

export function generateCrossReading(args: GenerateCrossReadingArgs): CrossReading {
  const lang = args.language;
  const code = archetypeByCode.has(args.lbtiType) ? args.lbtiType : 'BAYES';
  const coreProfile = LBTI_PROFILES[code] ?? LBTI_PROFILES.BAYES;
  const sbti = args.sbtiType && isSbtiType(args.sbtiType) ? args.sbtiType : '';
  const sbtiModifier = sbti ? SBTI_MODIFIERS[sbti] : NEUTRAL_SBTI;
  const sign = args.zodiac && isZodiacSign(args.zodiac) ? args.zodiac : null;
  const zodiacModifier = sign ? ZODIAC_MODIFIERS[sign] : NEUTRAL_ZODIAC;
  const lbtiSbti = LBTI_SBTI_INTERACTIONS[coreProfile.mode][sbtiModifier.mode];
  const lbtiZodiac = LBTI_ZODIAC_INTERACTIONS[coreProfile.mode][zodiacModifier.element];
  const sbtiZodiac = SBTI_ZODIAC_INTERACTIONS[sbtiModifier.mode][zodiacModifier.element];
  const triple = TRIPLE_OVERRIDES.find((item) => item.mode === coreProfile.mode && item.sbti === sbtiModifier.mode && item.element === zodiacModifier.element);
  const scores = args.scores.length ? args.scores : Array.from({ length: dimensionOrder.length }, () => 50);
  const scoreSentence = scoreDetail(scores, lang);
  const profileName = pick(coreProfile.title, lang);
  const sectionLead = {
    design: pick(l(`${profileName}的实验设计不会只停在口号里。`, `${profileName}的實驗設計不會只停在口號裡。`, `For ${profileName}, experiment design cannot remain a slogan.`), lang),
    collaboration: pick(l(`${profileName}进入合作时，最怕责任和证据一起变模糊。`, `${profileName}進入合作時，最怕責任和證據一起變模糊。`, `When ${profileName} enters collaboration, the danger is responsibility and evidence blurring together.`), lang),
    pressure: pick(l(`${profileName}遇到压力时不会只说“调整一下”。`, `${profileName}遇到壓力時不會只說「調整一下」。`, `Under pressure, ${profileName} does not merely say “adjust.”`), lang),
    contradiction: pick(l(`${profileName}的有用矛盾不是装饰。`, `${profileName}的有用矛盾不是裝飾。`, `The useful contradiction in ${profileName} is not decoration.`), lang),
    failure: pick(l(`${profileName}的翻车方式很具体。`, `${profileName}的翻車方式很具體。`, `The failure mode for ${profileName} is specific.`), lang),
  };

  const combinationTitle = [
    pick(coreProfile.title, lang),
    pick(sbtiModifier.titleAccent, lang),
    pick(zodiacModifier.titleImage, lang),
  ].join(lang === 'en' ? ', ' : '，');

  const hook = `${pick(coreProfile.hook, lang)} ${pick(sbtiModifier.presentation, lang)}`;
  const openingScene = `${pick(coreProfile.scene, lang)} ${pick(zodiacModifier.ritual, lang)} ${pick(sbtiModifier.meeting, lang)}`;
  const researchDecision = `${pick(coreProfile.evidence, lang)} ${pick(coreProfile.decision, lang)} ${pick(sbtiModifier.uncertainty, lang)} ${scoreSentence}`;
  const experimentDesign = `${sectionLead.design} ${pick(coreProfile.design, lang)} ${pick(lbtiZodiac, lang)} ${pick(zodiacModifier.ritual, lang)}`;
  const collaboration = `${sectionLead.collaboration} ${pick(coreProfile.collaboration, lang)} ${pick(sbtiModifier.meeting, lang)} ${pick(sbtiZodiac, lang)}`;
  const pressureResponse = `${sectionLead.pressure} ${pick(coreProfile.pressure, lang)} ${pick(zodiacModifier.pressure, lang)} ${pick(sbtiModifier.recognition, lang)}`;
  const usefulContradiction = `${sectionLead.contradiction} ${pick(coreProfile.contradiction, lang)} ${pick(lbtiSbti, lang)}${triple ? ` ${pick(triple.text, lang)}` : ''}`;
  const laboratoryRole = `${pick(coreProfile.role, lang)}：${pick(coreProfile.collaboration, lang)} ${pick(sbtiModifier.recognition, lang)} ${pick(zodiacModifier.tempo, lang)} ${pick(coreProfile.notForever, lang)}`;
  const failureMode = `${sectionLead.failure} ${pick(coreProfile.failure, lang)} ${pick(zodiacModifier.successStory, lang)}`;
  const survivalAdvice = [
    `${pick(coreProfile.advice[0], lang)} ${pick(sbtiModifier.uncertainty, lang)}`,
    `${pick(coreProfile.advice[1], lang)} ${pick(zodiacModifier.tempo, lang)}`,
    `${pick(coreProfile.advice[2], lang)} ${pick(lbtiSbti, lang)}`,
  ];
  const shareLine = `${pick(coreProfile.share, lang)} ${pick(sbtiModifier.titleAccent, lang)}，${pick(zodiacModifier.titleImage, lang)}。`;

  return {
    header: composeHeader(code, sbti, sign, lang),
    combinationTitle,
    hook,
    openingScene,
    researchDecision,
    experimentDesign,
    collaboration,
    pressureResponse,
    usefulContradiction,
    laboratoryRole,
    failureMode,
    survivalAdvice,
    shareLine,
    badges: [
      { label: 'LBTI', value: `${code} ${labName(code, lang)}` },
      { label: 'SBTI', value: sbtiLabel(sbti) || pick(l('未指定', '未指定', 'Not specified'), lang) },
      { label: pick(l('星座', '星座', 'Zodiac'), lang), value: zodiacName(sign, lang) },
    ],
  };
}

export function buildCrossInterpretation(
  result: ScoreResult,
  sbti: string,
  zodiac: string,
  lang: LanguageCode,
): CrossReading {
  return generateCrossReading({
    lbtiType: result.primary,
    sbtiType: sbti,
    zodiac,
    language: lang,
    scores: result.scores,
    classificationMargin: result.classificationMargin,
  });
}
