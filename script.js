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
    const resetReviewBtn = document.getElementById('resetReviewBtn');
    const knowBtn = document.getElementById('knowBtn');
    const dontKnowBtn = document.getElementById('dontKnowBtn');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const reviewStatus = document.getElementById('reviewStatus');
    const knownCount = document.getElementById('knownCount');
    const dontKnowCount = document.getElementById('dontKnowCount');
    const knownBoardCount = document.getElementById('knownBoardCount');
    const dontKnowBoardCount = document.getElementById('dontKnowBoardCount');
    const knownCardsList = document.getElementById('knownCardsList');
    const dontKnowCardsList = document.getElementById('dontKnowCardsList');
    
    // 當前狀態
    let currentMode = 1; // 1: 平假名→漢字, 2: 漢字→平假名
    let currentIndex = 0;
    let isFlipped = false;
    
    // 更新詞彙列表函數
    function updateVocabList() {
        currentVocabList = window.vocabStorage.getReviewVocab(window.getAllVocabData ? window.getAllVocabData() : window.vocabStorage.getAllVocab());
        currentVocabList = Array.isArray(currentVocabList) ? currentVocabList : [];
        currentIndex = Math.min(currentIndex, Math.max(currentVocabList.length - 1, 0));
        if (currentIndex < 0) currentIndex = 0;
        updateCard();
        updateReviewSummary();
    }
    
    // 公開更新函數供管理面板使用
    window.updateCard = updateCard;
    
    // 初始化
    function init() {
        updateVocabList();
        
        // 設定事件監聽器
        vocabCard.addEventListener('click', flipCard);
        mode1Btn.addEventListener('click', () => switchMode(1));
        mode2Btn.addEventListener('click', () => switchMode(2));
        prevBtn.addEventListener('click', showPrevious);
        nextBtn.addEventListener('click', showNext);
        shuffleBtn.addEventListener('click', shuffleVocab);
        resetReviewBtn.addEventListener('click', resetReviewStates);
        knowBtn.addEventListener('click', () => markCurrentVocab('known'));
        dontKnowBtn.addEventListener('click', () => markCurrentVocab('dontknow'));
        
        // 鍵盤快捷鍵
        document.addEventListener('keydown', handleKeyPress);
    }
    
    // 更新進度顯示
    function updateProgress() {
        if (currentVocabList.length === 0) {
            progressFill.style.width = '0%';
            progressText.textContent = '0/0';
            return;
        }
        
        const progress = ((currentIndex + 1) / currentVocabList.length) * 100;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${currentIndex + 1}/${currentVocabList.length}`;
    }
    
    // 更新卡片內容
    function updateCard() {
        if (currentVocabList.length === 0) {
            forceCardFront();
            frontText.textContent = "已完成";
            backKanji.textContent = "沒有要複習的詞彙";
            backReading.textContent = "";
            backDefinition.textContent = "所有詞彙都已標記為「我會了」，或你可以重設標記後繼續複習。";
            backExample.textContent = "";
            backTranslation.textContent = "";
            if (reviewStatus) reviewStatus.textContent = "目前沒有待複習詞彙";
            updateProgress();
            return;
        }
        
        const currentVocab = currentVocabList[currentIndex];
        
        if (!currentVocab) return;
        
        // 重置卡片為正面
        forceCardFront();
        
        const currentStatus = window.getVocabStatus ? window.getVocabStatus(currentVocab.id) : 'pending';
        if (reviewStatus) {
            if (currentStatus === 'known') {
                reviewStatus.textContent = '已標記：我會了';
            } else if (currentStatus === 'dontknow') {
                reviewStatus.textContent = '已標記：我還不會';
            } else {
                reviewStatus.textContent = '尚未標記';
            }
        }

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
            
            // 標記自定義詞彙
            if (currentVocab.id >= 1000) {
                backReading.textContent += ' (自定義)';
            }
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
            
            // 標記自定義詞彙
            if (currentVocab.id >= 1000) {
                backReading.textContent += ' (自定義)';
            }
        }
        
        updateProgress();
        updateReviewSummary();
    }

    function forceCardFront() {
        vocabCard.classList.remove('flipped');
        isFlipped = false;
    }

    function updateReviewSummary() {
        if (!knownCount || !dontKnowCount) return;

        const counts = window.getReviewStatusCounts ? window.getReviewStatusCounts() : { known: 0, dontknow: 0 };
        knownCount.textContent = String(counts.known || 0);
        dontKnowCount.textContent = String(counts.dontknow || 0);
        renderStatusBoards();
    }

    function renderStatusBoards() {
        if (!knownCardsList || !dontKnowCardsList || !knownBoardCount || !dontKnowBoardCount) return;

        const allVocab = window.getAllVocabData ? window.getAllVocabData() : [];
        const knownItems = [];
        const dontKnowItems = [];

        allVocab.forEach(vocab => {
            const status = window.getVocabStatus ? window.getVocabStatus(vocab.id) : 'pending';
            if (status === 'known') {
                knownItems.push(vocab);
            } else if (status === 'dontknow') {
                dontKnowItems.push(vocab);
            }
        });

        const byHiragana = (a, b) => String(a.hiragana || '').localeCompare(String(b.hiragana || ''), 'ja');
        knownItems.sort(byHiragana);
        dontKnowItems.sort(byHiragana);

        knownBoardCount.textContent = String(knownItems.length);
        dontKnowBoardCount.textContent = String(dontKnowItems.length);

        renderStatusList(knownCardsList, knownItems, '目前沒有我會了的卡片');
        renderStatusList(dontKnowCardsList, dontKnowItems, '目前沒有我還不會的卡片');
    }

    function renderStatusList(container, items, emptyText) {
        container.innerHTML = '';

        if (!items.length) {
            const empty = document.createElement('div');
            empty.className = 'status-empty';
            empty.textContent = emptyText;
            container.appendChild(empty);
            return;
        }

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'status-mini-card';
            card.innerHTML = `
                <div class="status-mini-head">
                    <span class="status-mini-hiragana">${item.hiragana || ''}</span>
                    <span class="status-mini-kanji">${item.kanji || ''}</span>
                </div>
                <div class="status-mini-definition">${item.definition || ''}</div>
            `;
            container.appendChild(card);
        });
    }
    
    // 翻轉卡片
    function flipCard() {
        if (currentVocabList.length === 0) return;
        isFlipped = !isFlipped;
        vocabCard.classList.toggle('flipped');
    }

    // 標記當前詞彙
    function markCurrentVocab(status) {
        if (currentVocabList.length === 0) return;

        forceCardFront();

        const currentVocab = currentVocabList[currentIndex];
        if (!currentVocab) return;

        const statusValue = status === 'dontknow' ? 'dontknow' : 'known';
        if (window.setVocabStatus) {
            window.setVocabStatus(currentVocab.id, statusValue);
        }

        if (status === 'dontknow') {
            showNotification('已標記為「我還不會」，將保留於複習中。');
        } else {
            showNotification('已標記為「我會了」，已從複習中移除。');
        }

        const previousIndex = currentIndex;
        updateVocabList();

        if (currentVocabList.length === 0) {
            return;
        }

        const remainingIndex = currentVocabList.findIndex(item => item.id === currentVocab.id);
        if (remainingIndex === -1) {
            currentIndex = Math.min(previousIndex, currentVocabList.length - 1);
        } else {
            currentIndex = Math.min(remainingIndex + 1, currentVocabList.length - 1);
        }

        updateCard();
    }

    function resetReviewStates() {
        if (window.resetVocabStatuses) {
            window.resetVocabStatuses();
        }
        currentIndex = 0;
        updateVocabList();
        forceCardFront();
        showNotification('已重設所有複習標記。');
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
        if (currentVocabList.length === 0) return;
        
        if (currentIndex > 0) {
            currentIndex--;
        } else {
            currentIndex = currentVocabList.length - 1; // 循環到最後一個
        }
        updateCard();
    }
    
    // 顯示下一個單字
    function showNext() {
        if (currentVocabList.length === 0) return;
        
        if (currentIndex < currentVocabList.length - 1) {
            currentIndex++;
        } else {
            currentIndex = 0; // 循環到第一個
        }
        updateCard();
    }
    
    // 隨機排序詞彙
    function shuffleVocab() {
        if (currentVocabList.length === 0) return;
        
        // 隨機排序陣列 (Fisher-Yates 洗牌算法)
        for (let i = currentVocabList.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [currentVocabList[i], currentVocabList[j]] = [currentVocabList[j], currentVocabList[i]];
        }
        
        // 回到第一個
        currentIndex = 0;
        updateCard();
        
        // 顯示提示
        showNotification('單字已隨機排序！');
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
            case 'Escape':
                // 關閉管理面板
                const managementPanel = document.getElementById('managementPanel');
                if (managementPanel) {
                    managementPanel.classList.remove('active');
                }
                break;
        }
    }
    
    // 顯示通知訊息（與管理面板共用）
    function showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const notificationMessage = document.getElementById('notificationMessage');
        
        if (notification && notificationMessage) {
            notificationMessage.textContent = message;
            notification.className = 'notification';
            
            if (type === 'error') {
                notification.style.background = '#e74c3c';
            } else if (type === 'warning') {
                notification.style.background = '#f39c12';
            } else {
                notification.style.background = '#27ae60';
            }
            
            notification.classList.add('active');
            
            // 3秒後自動隱藏
            setTimeout(() => {
                notification.classList.remove('active');
            }, 3000);
        } else {
            // 如果通知元素不存在，使用alert
            alert(message);
        }
    }
    
    // 公開函數供管理面板使用
    window.showNotification = showNotification;
    
    // 開始應用
    init();
});