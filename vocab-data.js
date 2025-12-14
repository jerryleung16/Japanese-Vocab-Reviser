// 日語詞彙資料庫
const vocabData = [
    {
        id: 1,
        hiragana: "みちにまよう",
        kanji: "道に迷う",
        definition: "迷路",
        example: "山の中で道に迷うのは危険だ。",
        translation: "在山裡迷路很危險。"
    },
    {
        id: 2,
        hiragana: "(A か B か)まよう",
        kanji: "(A か B か)迷う",
        definition: "在A和B之間猶豫",
        example: "進学か就職か迷っている。",
        translation: "正在升學和就業之間猶豫。"
    },
    {
        id: 3,
        hiragana: "せいかくがあかるい",
        kanji: "性格が明るい",
        definition: "性格開朗",
        example: "彼女は性格が明るくて、誰からも好かれる。",
        translation: "她性格開朗，受到大家的喜愛。"
    },
    {
        id: 4,
        hiragana: "ちちおや",
        kanji: "父親",
        definition: "父親（較正式的稱呼）",
        example: "父親は会社員です。",
        translation: "父親是公司職員。"
    },
    {
        id: 5,
        hiragana: "おやじ",
        kanji: "親父",
        definition: "老爸（較親密、口語的稱呼）",
        example: "親父は頑固なんだ。",
        translation: "我老爸很固執。"
    },
    {
        id: 6,
        hiragana: "ははおや",
        kanji: "母親",
        definition: "母親",
        example: "母親の手料理が一番美味しい。",
        translation: "媽媽親手做的菜最好吃。"
    },
    {
        id: 7,
        hiragana: "みずうみ",
        kanji: "湖",
        definition: "湖泊",
        example: "この湖はとても深い。",
        translation: "這個湖泊非常深。"
    },
    {
        id: 8,
        hiragana: "めざす",
        kanji: "目指す",
        definition: "以...為目標",
        example: "彼は医者を目指して勉強している。",
        translation: "他以成為醫生為目標而努力學習。"
    },
    {
        id: 9,
        hiragana: "おせちりょうり",
        kanji: "おせち料理",
        definition: "日本新年料理（年菜）",
        example: "正月にはおせち料理を食べます。",
        translation: "正月時會吃年菜。"
    },
    {
        id: 10,
        hiragana: "はつもうで",
        kanji: "初詣で",
        definition: "新年首次參拜神社",
        example: "元旦に家族で初詣でに行く。",
        translation: "元旦和家人一起去新年參拜。"
    },
    {
        id: 11,
        hiragana: "ざぶとん",
        kanji: "座布団",
        definition: "坐墊",
        example: "客に座布団をすすめる。",
        translation: "請客人使用坐墊。"
    },
    {
        id: 12,
        hiragana: "ゆか",
        kanji: "床",
        definition: "地板",
        example: "床を掃除する。",
        translation: "打掃地板。"
    },
    {
        id: 13,
        hiragana: "おじぎ",
        kanji: "お辞儀",
        definition: "行禮、鞠躬",
        example: "先生にお辞儀をして挨拶した。",
        translation: "向老師鞠躬打招呼。"
    },
    {
        id: 14,
        hiragana: "けってん",
        kanji: "欠点",
        definition: "缺點",
        example: "彼の欠点は飽きっぽいことだ。",
        translation: "他的缺點是容易厭倦。"
    },
    {
        id: 15,
        hiragana: "にあう",
        kanji: "似合う",
        definition: "適合",
        example: "そのスカート、あなたにとても似合っていますよ。",
        translation: "那條裙子非常適合你。"
    },
    {
        id: 16,
        hiragana: "ポイント",
        kanji: "ポイント",
        definition: "要點、重點",
        example: "彼の話はポイントがはっきりしていて分かりやすい。",
        translation: "他的話重點明確，容易理解。"
    },
    {
        id: 17,
        hiragana: "ききとる",
        kanji: "聞き取る",
        definition: "聽懂話語內容",
        example: "騒がしい店の中で、彼の話を聞き取るのは難しかった。",
        translation: "在嘈雜的店裡，很難聽清楚他的話。"
    },
    {
        id: 18,
        hiragana: "でんとうてき[な]",
        kanji: "伝統的[な]",
        definition: "傳統的",
        example: "これは伝統的な日本の習慣です。",
        translation: "這是日本的傳統習慣。"
    },
    {
        id: 19,
        hiragana: "なんとか",
        kanji: "何とか",
        definition: "1. 想辦法、主動付出努力以克服困難<br>2. 總算、結果上勉強達成<br>3. 模糊指代（忘記或不確定）<br>4. 呼籲請求",
        example: "1. 予算は限られているが、何とか節約してやってみよう。<br>2. 練習した甲斐があって、試験に何とか合格できた。<br>3. 駅前の何とかという店で買いました。<br>4. このプロジェクトを成功させなければならない。皆さん、何とかお願いします！",
        translation: "1. 雖然預算有限，但我們想辦法節省一下試試看吧。<br>2. 練習有了回報，我總算通過了考試。<br>3. 在車站前一家叫某某的店裡買的。<br>4. 這個專案必須成功。各位，務請大家盡力而為！"
    },
    {
        id: 20,
        hiragana: "すいせん",
        kanji: "推薦",
        definition: "推薦",
        example: "先生に大学を推薦してもらった。",
        translation: "請老師推薦了大學。"
    },
    {
        id: 21,
        hiragana: "すいせんじょう",
        kanji: "推薦状",
        definition: "推薦函",
        example: "就職に推薦状が必要です。",
        translation: "求職需要推薦函。"
    },
    {
        id: 22,
        hiragana: "しかい",
        kanji: "司会",
        definition: "主持人",
        example: "会議の司会をお願いできますか。",
        translation: "可以請您負責會議的主持嗎？"
    },
    {
        id: 23,
        hiragana: "しかいする",
        kanji: "司会する",
        definition: "主持（表示執行主持的行為）",
        example: "部長が定例会議を司会した。",
        translation: "部長主持了例行會議。"
    },
    {
        id: 24,
        hiragana: "ひきうける",
        kanji: "引き受ける",
        definition: "1. 接受工作、任務、角色<br>2. 承擔責任、後果",
        example: "1. 司会を引き受ける。<br>2. 今回の失敗の責任はすべて私が引き受ける。",
        translation: "1. 接受主持的工作。<br>2. 這次失敗的責任，全部由我來承擔。"
    },
    {
        id: 25,
        hiragana: "おる",
        kanji: "折る",
        definition: "折斷或簡單彎曲",
        example: "紙を折って鶴を作る。",
        translation: "摺紙做成鶴。"
    },
    {
        id: 26,
        hiragana: "たたむ",
        kanji: "畳む",
        definition: "把攤開的東西收拾整齊",
        example: "洗濯物をたたむ。",
        translation: "摺疊洗好的衣服。"
    },
    {
        id: 27,
        hiragana: "おりたたむ",
        kanji: "折り畳む",
        definition: "把一個大東西（如椅子）變小收起來",
        example: "折り畳み椅子を持って行く。",
        translation: "帶摺疊椅去。"
    },
    {
        id: 28,
        hiragana: "かさねる",
        kanji: "重ねる",
        definition: "1. 具體的「重疊、疊加」<br>2. 抽象的「重複、累積」",
        example: "1. 皿を重ねて片付ける。<br>2. 失敗を重ねてようやく成功した。",
        translation: "1. 把盤子疊起來收拾。<br>2. 經歷了多次失敗後終於成功了。"
    },
    {
        id: 29,
        hiragana: "つむ",
        kanji: "積む",
        definition: "堆磚頭、裝貨、積攢財富",
        example: "経験を積むことが大切だ。",
        translation: "積累經驗很重要。"
    },
    {
        id: 30,
        hiragana: "いた",
        kanji: "板",
        definition: "木板",
        example: "板で棚を作る。",
        translation: "用木板做架子。"
    },
    {
        id: 31,
        hiragana: "はる",
        kanji: "張る",
        definition: "鋪設、拉開、覆蓋一個面，使其緊繃或構成表面",
        example: "板を張る（鋪木板）、ネットを張る（拉開幕布）",
        translation: ""
    },
    {
        id: 32,
        hiragana: "はる",
        kanji: "貼る",
        definition: "黏貼",
        example: "シールを貼る（貼貼紙）",
        translation: ""
    },
    {
        id: 33,
        hiragana: "いたばり",
        kanji: "板張り",
        definition: "鋪設好的木板地面（地板）或牆面",
        example: "この部屋は板張りなので、足元が冷たい。",
        translation: "這個房間是木地板，所以腳下感覺很冷。"
    }
];

// 複製一份原始資料用於隨機排序
let currentVocabList = [...vocabData];