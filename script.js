// 等待網頁完全載入
document.addEventListener('DOMContentLoaded', function() {
    // 取得DOM元素
    const vocabCard = document.getElementById('vocabCard');
    const frontText = document.getElementById('frontText');
    const backKanji = document.getElementById('backKanji');
    const backReading = document.getElementById('backReading');
    const backDefinition = document.getElementById('backDefinition');
    const backExample = document.getElementById('backExample');
    const backTranslation = document.getElementById('backTranslation');
    const frontLabel = document.getElementById('frontLabel');
    const backLabel = document.getElementById('backLabel');
    
    const mode1Btn = document.getElementById('mode1');
    const mode2Btn = document.getElementById('mode2');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    // 當前狀態
    let currentMode = 1; // 1: 平假名→漢字, 2: 漢字→平假名
    let currentIndex = 0;
    let isFlipped = false;
    
    // 初始化
    function init() {
        updateProgress();
        updateCard();
        
        // 設定事件監聽器
        vocabCard.addEventListener('click', flipCard);
        mode1Btn.addEventListener('click', () => switchMode(1));
        mode2Btn.addEventListener('click', () => switchMode(2));
        prevBtn.addEventListener('click', showPrevious);
        nextBtn.addEventListener('click', showNext);
        shuffleBtn.addEventListener('click', shuffleVocab);
        
        // 鍵盤快捷鍵
        document.addEventListener('keydown', handleKeyPress);
    }
    
    // 更新進度顯示
    function updateProgress() {
        const progress = ((currentIndex + 1) / currentVocabList.length) * 100;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${currentIndex + 1}/${currentVocabList.length}`;
    }
    
    // 更新卡片內容
    function updateCard() {
        const currentVocab = currentVocabList[currentIndex];
        
        if (!currentVocab) return;
        
        // 重置卡片為正面
        vocabCard.classList.remove('flipped');
        isFlipped = false;
        
        if (currentMode === 1) {
            // 模式1: 正面顯示平假名，背面顯示漢字+解釋+例句
            frontLabel.textContent = "平假名";
            backLabel.textContent = "漢字+解釋";
            frontText.textContent = currentVocab.hiragana;
            backKanji.textContent = currentVocab.kanji;
            backReading.textContent = `読み方：${currentVocab.hiragana}`;
            backDefinition.innerHTML = currentVocab.definition;
            backExample.innerHTML = currentVocab.example;
            backTranslation.textContent = currentVocab.translation;
        } else {
            // 模式2: 正面顯示漢字，背面顯示平假名+解釋+例句
            frontLabel.textContent = "漢字";
            backLabel.textContent = "平假名+解釋";
            frontText.textContent = currentVocab.kanji;
            backKanji.textContent = currentVocab.hiragana;
            backReading.textContent = `漢字：${currentVocab.kanji}`;
            backDefinition.innerHTML = currentVocab.definition;
            backExample.innerHTML = currentVocab.example;
            backTranslation.textContent = currentVocab.translation;
        }
        
        updateProgress();
    }
    
    // 翻轉卡片
    function flipCard() {
        isFlipped = !isFlipped;
        vocabCard.classList.toggle('flipped');
    }
    
    // 切換模式
    function switchMode(mode) {
        if (currentMode === mode) return;
        
        currentMode = mode;
        
        // 更新按鈕狀態
        if (mode === 1) {
            mode1Btn.classList.add('active');
            mode2Btn.classList.remove('active');
        } else {
            mode1Btn.classList.remove('active');
            mode2Btn.classList.add('active');
        }
        
        // 更新卡片
        updateCard();
    }
    
    // 顯示上一個單字
    function showPrevious() {
        if (currentIndex > 0) {
            currentIndex--;
        } else {
            currentIndex = currentVocabList.length - 1; // 循環到最後一個
        }
        updateCard();
    }
    
    // 顯示下一個單字
    function showNext() {
        if (currentIndex < currentVocabList.length - 1) {
            currentIndex++;
        } else {
            currentIndex = 0; // 循環到第一個
        }
        updateCard();
    }
    
    // 隨機排序詞彙
    function shuffleVocab() {
        // 隨機排序陣列 (Fisher-Yates 洗牌算法)
        for (let i = currentVocabList.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [currentVocabList[i], currentVocabList[j]] = [currentVocabList[j], currentVocabList[i]];
        }
        
        // 回到第一個
        currentIndex = 0;
        updateCard();
        
        // 顯示提示
        alert('單字已隨機排序！');
    }
    
    // 處理鍵盤按鍵
    function handleKeyPress(event) {
        switch(event.key) {
            case 'ArrowLeft':
                showPrevious();
                break;
            case 'ArrowRight':
                showNext();
                break;
            case ' ':
            case 'Enter':
                flipCard();
                event.preventDefault(); // 防止空格鍵滾動頁面
                break;
            case '1':
                switchMode(1);
                break;
            case '2':
                switchMode(2);
                break;
            case 'r':
            case 'R':
                shuffleVocab();
                break;
        }
    }
    
    // 開始應用
    init();
});